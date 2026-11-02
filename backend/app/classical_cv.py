"""
Classical (no-training) skin measurements from a face crop: ITA, redness, dryness.

STATUS: UNCALIBRATED BASELINE.
  * ITA uses the standard dermatology formula, ITA = arctan((L* - 50) / b*) in degrees,
    on skin pixels only.
  * Redness and dryness use simple, explainable image statistics. Their 0-10 mapping constants
    are first guesses. They must be calibrated against the team's own rated photos
    (see the photo-collection plan) before anyone trusts the numbers.
  * 'Dryness' is only a visible-texture proxy. A photo cannot measure true skin hydration.

Input: BGR face image cropped to the detected face box (no extra margin).
Output: dict(ita_value, redness_score, dryness_score, skin_pixels)
"""
import cv2
import numpy as np

# ROIs as fractions of the face box: (x0, x1, y0, y1)
_FOREHEAD = (0.25, 0.75, 0.00, 0.16)
_CHEEKS = [(0.10, 0.36, 0.50, 0.74), (0.64, 0.90, 0.50, 0.74)]


def _roi(img, box):
    h, w = img.shape[:2]
    x0, x1, y0, y1 = box
    return slice(int(y0 * h), max(int(y1 * h), int(y0 * h) + 1)), slice(int(x0 * w), max(int(x1 * w), int(x0 * w) + 1))


def _skin_mask(bgr: np.ndarray, lab: np.ndarray) -> np.ndarray:
    ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    cr, cb = ycrcb[..., 1], ycrcb[..., 2]
    m = (cr >= 133) & (cr <= 173) & (cb >= 77) & (cb <= 127)
    L = lab[..., 0]
    m &= (L > 20) & (L < 95)                  # drop deep shadow (hair, beard) and blown highlights
    return m


def analyze_skin(face_bgr: np.ndarray) -> dict:
    face = cv2.resize(face_bgr, (256, 256), interpolation=cv2.INTER_AREA)
    lab = cv2.cvtColor(face.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)   # L 0-100, a/b signed
    mask = _skin_mask(face, lab)

    fy, fx = _roi(face, _FOREHEAD)
    cheek_slices = [_roi(face, c) for c in _CHEEKS]

    def pixels(channel, rows, cols):
        sel = mask[rows, cols]
        return channel[rows, cols][sel]

    a, b, L = lab[..., 1], lab[..., 2], lab[..., 0]
    fore_a = pixels(a, fy, fx)
    cheek_a = np.concatenate([pixels(a, r, c) for r, c in cheek_slices])
    all_L = np.concatenate([pixels(L, fy, fx)] + [pixels(L, r, c) for r, c in cheek_slices])
    all_b = np.concatenate([pixels(b, fy, fx)] + [pixels(b, r, c) for r, c in cheek_slices])

    n = int(all_L.size)
    if n < 300:                                # too few skin pixels to measure anything
        return {"ita_value": None, "redness_score": None, "dryness_score": None, "skin_pixels": n}

    # ITA (degrees); b* floor avoids division blow-ups
    L_med, b_med = float(np.median(all_L)), float(np.median(all_b))
    ita = float(np.degrees(np.arctan((L_med - 50.0) / max(b_med, 1.0))))

    # Redness: cheeks redder than forehead + share of locally red spots on the cheeks
    ref_a = float(np.median(fore_a)) if fore_a.size >= 100 else float(np.median(cheek_a))
    diff = float(np.mean(cheek_a)) - ref_a
    a_s = cv2.GaussianBlur(a, (0, 0), 1.0)
    spot_frac = float(np.mean(np.concatenate([a_s[r, c][mask[r, c]] for r, c in cheek_slices]) > np.median(cheek_a) + 5.0))
    redness = 10.0 * (0.5 * np.clip((diff - 1.0) / 6.0, 0, 1) + 0.5 * np.clip(spot_frac / 0.15, 0, 1))

    # Dryness proxy: fine texture (high-pass of L) on skin pixels, ignoring strong edges/spots
    # texture is measured at a fixed 128 px face width so photo resolution does not change the score
    f128 = cv2.resize(face_bgr, (128, 128), interpolation=cv2.INTER_AREA)
    lab128 = cv2.cvtColor(f128.astype(np.float32) / 255.0, cv2.COLOR_BGR2LAB)
    mask128 = _skin_mask(f128, lab128)
    L128 = lab128[..., 0]
    hp = L128 - cv2.GaussianBlur(L128, (0, 0), 1.5)
    hp_vals = np.concatenate([hp[r, c][mask128[r, c]] for r, c in [_roi(f128, b) for b in _CHEEKS + [_FOREHEAD]]])
    hp_vals = hp_vals[np.abs(hp_vals) < 6.0]
    rough = float(np.std(hp_vals)) if hp_vals.size > 60 else 0.0
    dryness = 10.0 * float(np.clip((rough - 0.5) / 2.5, 0, 1))

    return {
        "ita_value": round(ita, 1),
        "redness_score": round(float(redness), 1),
        "dryness_score": round(dryness, 1),
        "skin_pixels": n,
        "_debug": {"cheek_minus_forehead_a": round(diff, 2), "red_spot_frac": round(spot_frac, 3), "texture_std": round(rough, 2)},
    }
