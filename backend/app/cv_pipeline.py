"""
Real computer-vision pipeline.

  bytes -> decode -> quality checks -> locate face -> [beard check] ->
    acne : CNN (ONNX MobileNetV2) on the face crop -> expected grade -> 0-10
    ITA, redness, dryness : classical OpenCV measurements (classical_cv.py, UNCALIBRATED)

Privacy: the image exists only in memory during the call. Nothing is written to disk.

Returned dict has the same keys as mock_cv.mock_analyze_image(); notes are returned separately.

Env vars
  USE_REAL_ACNE      "1"/"0"; default = on if the model file exists
  USE_CLASSICAL_CV   "1"/"0"; default "1". "0" -> mock values for redness/dryness/ITA
  REQUIRE_FACE       "1" (default) reject photos with no usable face; "0" score the whole image
  TWACHA_ACNE_MODEL  path to the .onnx file
"""
import os
import threading
from pathlib import Path

import cv2
import numpy as np

from .mock_cv import mock_analyze_image
from .classical_cv import analyze_skin


class ImageError(ValueError):
    """The photo can't be scored. The message is safe to show the user."""


_BACKEND_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(os.getenv("TWACHA_ACNE_MODEL", _BACKEND_ROOT / "ml" / "twacha_acne_model.onnx"))

MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MAX_SIDE_PX = 1600
FACE_MARGIN = 0.25
BEARD_DARK_FRACTION = 0.12          # share of dark pixels in the lower face that counts as a beard
UPPER_FACE_FRACTION = 0.62          # beard present -> score only the top 62% of the face crop
MIN_BRIGHTNESS = 45                 # mean gray of the face crop
MIN_SHARPNESS = 12.0                # variance of Laplacian on the 224 px face crop

_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
_ANCHORS = np.array([1.5, 4.0, 7.0, 9.5], dtype=np.float32)

_session = None
_session_lock = threading.Lock()
_cascades = None


def _env_flag(name: str, default: bool) -> bool:
    v = os.getenv(name)
    return default if v is None else v.strip() == "1"


def real_acne_enabled() -> bool:
    return _env_flag("USE_REAL_ACNE", MODEL_PATH.exists())


def _get_session():
    global _session
    if _session is None:
        with _session_lock:
            if _session is None:
                if not MODEL_PATH.exists():
                    raise RuntimeError(f"Acne model not found at {MODEL_PATH}. Put twacha_acne_model.onnx there or set USE_REAL_ACNE=0.")
                import onnxruntime as ort
                _session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    return _session


def _get_cascades():
    global _cascades
    if _cascades is None:
        out = []
        for name, neigh in [("haarcascade_frontalface_default.xml", 5), ("haarcascade_frontalface_alt2.xml", 4),
                            ("haarcascade_frontalface_alt.xml", 4), ("haarcascade_frontalface_default.xml", 3),
                            ("haarcascade_profileface.xml", 3)]:
            c = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, name))
            if c.empty():
                raise RuntimeError(f"Could not load face detector {name}")
            out.append((c, neigh, "profile" in name))
        _cascades = out
    return _cascades


# ── Decoding and quality ────────────────────────────────────────────────────

def _decode(image_bytes: bytes) -> np.ndarray:
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise ImageError("Image is too large. Please upload a photo under 12 MB.")
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)   # applies EXIF rotation
    if img is None:
        raise ImageError("Could not read that image. Please upload a JPEG or PNG photo.")
    h, w = img.shape[:2]
    if min(h, w) < 200:
        raise ImageError("Image is too small. Please take the photo closer to the camera.")
    s = MAX_SIDE_PX / max(h, w)
    if s < 1:
        img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    return img


def _skin_fraction(bgr: np.ndarray) -> float:
    h, w = bgr.shape[:2]
    c0 = bgr[int(.2 * h):int(.8 * h), int(.2 * w):int(.8 * w)]
    y = cv2.cvtColor(c0, cv2.COLOR_BGR2YCrCb)
    cr, cb = y[..., 1], y[..., 2]
    return float(np.mean((cr >= 133) & (cr <= 173) & (cb >= 77) & (cb <= 127)))


# ── Face location ───────────────────────────────────────────────────────────

def _detect_box(bgr: np.ndarray):
    """Largest face box (x, y, w, h) in original coordinates, or None. Tries several cascades."""
    h, w = bgr.shape[:2]
    pad = int(0.25 * max(h, w))                                  # padding lets close-ups be found
    padded = cv2.copyMakeBorder(bgr, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    gray = cv2.equalizeHist(cv2.cvtColor(padded, cv2.COLOR_BGR2GRAY))
    min_face = max(60, min(padded.shape[:2]) // 10)
    best = None
    for cascade, neigh, profile in _get_cascades():
        for flip in ((False, True) if profile else (False,)):
            g = cv2.flip(gray, 1) if flip else gray
            faces = cascade.detectMultiScale(g, scaleFactor=1.1, minNeighbors=neigh, minSize=(min_face, min_face))
            for (x, y, fw, fh) in faces:
                if flip:
                    x = g.shape[1] - x - fw
                if best is None or fw * fh > best[2] * best[3]:
                    best = (x - pad, y - pad, fw, fh)
        if best is not None:
            break
    if best is None:
        return None
    x, y, fw, fh = best
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(w, x + fw), min(h, y + fh)
    return (x0, y0, x1 - x0, y1 - y0) if x1 > x0 and y1 > y0 else None


def _locate_face(bgr: np.ndarray, require_face: bool):
    """Returns (tight_box_xywh, notes). Raises ImageError if no usable face and require_face."""
    h, w = bgr.shape[:2]
    short = min(h, w)
    box = _detect_box(bgr)
    notes = []
    if box is not None and box[2] >= 0.25 * short:
        return box, notes
    if _skin_fraction(bgr) >= 0.45:                              # a face filling the frame: cascades often miss these
        s = int(short * 0.95)
        return (max(0, (w - s) // 2), max(0, (h - s) // 2), s, s), ["Close-up photo: using the whole frame as the face."]
    if box is not None and box[2] >= 0.12 * short:
        return box, notes
    if require_face:
        raise ImageError("No face found. Face the camera in good, even light, with your whole face in the frame.")
    return (0, 0, w, h), ["No face detected: scored the whole image."]


def _margin_crop(bgr, box):
    x, y, fw, fh = box
    h, w = bgr.shape[:2]
    mx, my = int(fw * FACE_MARGIN), int(fh * FACE_MARGIN)
    return bgr[max(0, y - my):min(h, y + fh + my), max(0, x - mx):min(w, x + fw + mx)]


# ── Beard check ─────────────────────────────────────────────────────────────

def _has_beard(tight_face: np.ndarray) -> bool:
    """Lots of very dark pixels (relative to the person's own cheek skin) in the lower face."""
    t = cv2.resize(tight_face, (256, 256), interpolation=cv2.INTER_AREA)
    V = cv2.cvtColor(t, cv2.COLOR_BGR2HSV)[..., 2].astype(np.float32)
    ycc = cv2.cvtColor(t, cv2.COLOR_BGR2YCrCb)
    skin = (ycc[..., 1] >= 133) & (ycc[..., 1] <= 173) & (ycc[..., 2] >= 77) & (ycc[..., 2] <= 127)

    def sl(x0, x1, y0, y1):
        return slice(int(y0 * 256), int(y1 * 256)), slice(int(x0 * 256), int(x1 * 256))

    ref_vals = np.concatenate([V[r][skin[r]] for r in (sl(.10, .36, .50, .74), sl(.64, .90, .50, .74), sl(.25, .75, 0, .16))])
    ref = float(np.median(ref_vals)) if ref_vals.size > 200 else 120.0
    return float(np.mean(V[sl(.15, .85, .66, 1.0)] < 0.55 * ref)) >= BEARD_DARK_FRACTION


# ── Acne model ──────────────────────────────────────────────────────────────

def _preprocess(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    s = 256 / min(h, w)
    bgr = cv2.resize(bgr, (max(224, round(w * s)), max(224, round(h * s))), interpolation=cv2.INTER_AREA)
    h, w = bgr.shape[:2]
    top, left = (h - 224) // 2, (w - 224) // 2
    bgr = bgr[top:top + 224, left:left + 224]
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    rgb = (rgb - _MEAN) / _STD
    return np.ascontiguousarray(rgb.transpose(2, 0, 1)[None]).astype(np.float32)


def score_acne(bgr: np.ndarray) -> float:
    logits = _get_session().run(None, {"image": _preprocess(bgr)})[0][0]
    p = np.exp(logits - logits.max())
    p /= p.sum()
    return float(np.clip((p * _ANCHORS).sum(), 0.0, 10.0))


def _check_quality(face: np.ndarray):
    g = cv2.cvtColor(cv2.resize(face, (224, 224), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    if float(g.mean()) < MIN_BRIGHTNESS:
        raise ImageError("The photo is too dark. Move to daylight or face a window.")
    if float(cv2.Laplacian(g, cv2.CV_64F).var()) < MIN_SHARPNESS:
        raise ImageError("The photo looks blurry. Hold the phone steady and tap to focus.")


# ── Public entry points ─────────────────────────────────────────────────────

def analyze_image_with_notes(image_bytes: bytes | None) -> tuple[dict, list[str]]:
    vector = mock_analyze_image(image_bytes)             # defaults, overwritten below when real
    notes: list[str] = []
    use_acne = real_acne_enabled()
    use_classical = _env_flag("USE_CLASSICAL_CV", True)
    if not (use_acne or use_classical):
        return vector, notes
    if not image_bytes:
        raise ImageError("No image uploaded. Send the photo in the 'image' form field.")

    bgr = _decode(image_bytes)
    box, face_notes = _locate_face(bgr, _env_flag("REQUIRE_FACE", True))
    notes += face_notes
    x, y, fw, fh = box
    tight = bgr[y:y + fh, x:x + fw]
    margin = _margin_crop(bgr, box)
    _check_quality(tight)

    if use_acne:
        cnn_input = margin
        if _has_beard(tight):
            cnn_input = margin[: int(margin.shape[0] * UPPER_FACE_FRACTION)]
            notes.append("Facial hair detected: the acne score uses the forehead and cheeks only.")
        vector["acne_score"] = round(score_acne(cnn_input), 1)

    if use_classical:
        r = analyze_skin(tight)
        if r["redness_score"] is None:
            notes.append("Not enough visible skin to estimate redness, dryness and skin tone.")
        else:
            vector["redness_score"] = r["redness_score"]
            vector["dryness_score"] = r["dryness_score"]
            vector["ita_value"] = r["ita_value"]
            notes.append("Redness and dryness are rough visual estimates, not clinical measurements.")
    return vector, notes


def analyze_image(image_bytes: bytes | None) -> dict:
    """Backward-compatible wrapper: returns only the score vector."""
    return analyze_image_with_notes(image_bytes)[0]
