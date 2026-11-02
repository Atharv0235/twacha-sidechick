// Prepares a photo for upload: respects EXIF orientation, shrinks to ~1280 px, re-encodes as JPEG
// (re-encoding also drops EXIF metadata such as GPS location).

const MAX_SIDE = 1280;

export async function toBitmap(blob) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* fall through */ }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

function drawToBlob(src, maxSide, quality) {
  const w = src.width, h = src.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', quality)
  );
}

export async function prepareImage(blob) {
  let bmp;
  try { bmp = await toBitmap(blob); } catch { throw new Error('That file could not be read as an image. Please choose a JPEG or PNG photo.'); }
  return drawToBlob(bmp, MAX_SIDE, 0.9);
}

/** Small preview kept on the phone only, for the timeline. Returns a data URL. */
export async function makeThumbnail(blob) {
  const bmp = await toBitmap(blob);
  const small = await drawToBlob(bmp, 160, 0.7);
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(small);
  });
}
