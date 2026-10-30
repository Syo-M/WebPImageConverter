import { linearLight, encodeSrgb } from './color.js';

/**
 * 任意の弱いノイズ軽減／アンシャープマスク。元バッファを参照し、走査方向への偏りを避けます。
 * 色比を保って輝度だけを補正し、透明度と透明な縁は変更しません。
 */
export function filterPixels(pixels, width, height, strength, denoise = false) {
  if (!strength) return pixels;
  const result = new Uint8ClampedArray(pixels);
  const luminance = (offset) => .2126 * linearLight[pixels[offset]] + .7152 * linearLight[pixels[offset + 1]] + .0722 * linearLight[pixels[offset + 2]];
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const offset = (y * width + x) * 4;
    if (pixels[offset + 3] !== 255) continue;
    const original = luminance(offset);
    let sum = 0, weightSum = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const neighbor = ((y + dy) * width + x + dx) * 4;
      if (pixels[neighbor + 3] !== 255) continue;
      const value = luminance(neighbor);
      // ノイズ軽減時は明るさの近い画素だけ混ぜ、輪郭をなるべく残します。
      const weight = (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1) * (denoise ? Math.exp(-(((value - original) / .025) ** 2)) : 1);
      sum += value * weight; weightSum += weight;
    }
    const difference = sum / weightSum - original;
    const adjustment = denoise ? difference * strength : Math.max(-.06, Math.min(.06, -difference * strength));
    if (original < 1e-5) continue;
    const ratio = Math.max(0, original + adjustment) / original;
    for (let channel = 0; channel < 3; channel++) result[offset + channel] = encodeSrgb(linearLight[pixels[offset + channel]] * ratio);
  }
  return result;
}
