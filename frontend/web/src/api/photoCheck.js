// A quick look at a photo on the phone, before it is uploaded. It only warns. The server still makes the final call
// (it also looks for a face, which this check does not try to do).
import { toBitmap } from './image';

const SAMPLE_SIDE = 256;       // the photo is shrunk to this before measuring, so the check takes a few milliseconds

export const LIMITS = {
  minSide: 480,                // pixels on the shorter side of the original
  dark: 70,                    // mean brightness 0-255
  glareShare: 0.08,            // share of almost-white pixels
  unevenRatio: 0.45,           // left and right halves differ by more than this share of the average
  blurVariance: 25,            // variance of the Laplacian on the shrunken grey image
};

/** Brightness, glare, left/right balance and sharpness from RGBA pixels. Pure, so it can be tested without a browser. */
export function measure(rgba, w, h) {
  const gray = new Float32Array(w * h);
  let sum = 0, sumL = 0, sumR = 0, nL = 0, nR = 0, hot = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const g = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
      gray[i] = g;
      sum += g;
      if (g > 245) hot++;
      if (x < w / 2) { sumL += g; nL++; } else { sumR += g; nR++; }
    }
  }
  const mean = sum / (w * h);
  // Laplacian variance: low means few sharp edges, i.e. blurry
  let lap = 0, lapSq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = gray[i - 1] + gray[i + 1] + gray[i - w] + gray[i + w] - 4 * gray[i];
      lap += v; lapSq += v * v; n++;
    }
  }
  const lapMean = n ? lap / n : 0;
  const left = nL ? sumL / nL : mean, right = nR ? sumR / nR : mean;
  return {
    mean,
    glare: hot / (w * h),
    sideGap: Math.abs(left - right) / Math.max(mean, 1),
    sharpness: n ? lapSq / n - lapMean * lapMean : 0,
  };
}

/** Turns measurements into plain-language tips. An empty list means the photo looks fine for a scan. */
export function issuesFrom(stats, width, height) {
  const out = [];
  if (Math.min(width, height) < LIMITS.minSide) {
    out.push({ id: 'small', text: 'This photo is small. A larger one gives a steadier reading.' });
  }
  if (stats.mean < LIMITS.dark) {
    out.push({ id: 'dark', text: 'It looks dark. Move to daylight or face a window.' });
  }
  if (stats.glare > LIMITS.glareShare) {
    out.push({ id: 'glare', text: 'Part of the photo is washed out by bright light. Step out of direct sun or a harsh lamp.' });
  }
  if (stats.mean >= LIMITS.dark && stats.sideGap > LIMITS.unevenRatio) {
    out.push({ id: 'uneven', text: 'The light is coming from one side. Face the light so both cheeks are lit evenly.' });
  }
  if (stats.sharpness < LIMITS.blurVariance) {
    out.push({ id: 'blur', text: 'It looks blurry. Hold the phone steady and tap the screen to focus.' });
  }
  return out;
}

/** Returns { issues: [{id, text}], stats }. Never throws: if the photo cannot be measured the result is "no issues". */
export async function checkPhoto(blob) {
  try {
    const bmp = await toBitmap(blob);
    const scale = Math.min(1, SAMPLE_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.max(8, Math.round(bmp.width * scale));
    const h = Math.max(8, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, w, h);
    const stats = measure(ctx.getImageData(0, 0, w, h).data, w, h);
    return { issues: issuesFrom(stats, bmp.width, bmp.height), stats };
  } catch {
    return { issues: [], stats: null };
  }
}
