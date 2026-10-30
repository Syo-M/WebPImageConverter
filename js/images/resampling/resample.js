import { linearLight, encodeSrgb } from './color.js';
import { createWeights } from './kernels.js';

/**
 * 元画像から目的サイズへ直接補間します。横・縦の分離計算は多段階拡大ではありません。
 * 横方向の計算結果は必要な行だけ保持し、大きなFloat32中間画像を確保しません。
 */
export function resamplePixels(source, width, height, outputWidth, outputHeight, method) {
  const result = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  if (method === 'nearest') {
    for (let y = 0; y < outputHeight; y++) for (let x = 0; x < outputWidth; x++) {
      const sourceOffset = (Math.min(height - 1, Math.floor((y + .5) * height / outputHeight)) * width
        + Math.min(width - 1, Math.floor((x + .5) * width / outputWidth))) * 4;
      result.set(source.subarray(sourceOffset, sourceOffset + 4), (y * outputWidth + x) * 4);
    }
    return result;
  }
  const horizontalWeights = createWeights(width, outputWidth, method);
  const verticalWeights = createWeights(height, outputHeight, method);
  const rows = new Map();
  for (let y = 0; y < outputHeight; y++) {
    const neededRows = new Set(verticalWeights[y].map((tap) => tap.index));
    for (const rowIndex of rows.keys()) if (!neededRows.has(rowIndex)) rows.delete(rowIndex);
    for (const rowIndex of neededRows) {
      if (rows.has(rowIndex)) continue;
      const row = new Float32Array(outputWidth * 4);
      for (let x = 0; x < outputWidth; x++) for (const tap of horizontalWeights[x]) {
        const sourceOffset = (rowIndex * width + tap.index) * 4;
        const alpha = source[sourceOffset + 3] / 255;
        // RGBに透明度を掛けた状態で補間し、見えない画素の色の混入を防ぎます。
        for (let channel = 0; channel < 3; channel++) row[x * 4 + channel] += linearLight[source[sourceOffset + channel]] * alpha * tap.weight;
        row[x * 4 + 3] += alpha * tap.weight;
      }
      rows.set(rowIndex, row);
    }
    for (let x = 0; x < outputWidth; x++) {
      const values = [0, 0, 0, 0];
      for (const tap of verticalWeights[y]) {
        const row = rows.get(tap.index);
        for (let channel = 0; channel < 4; channel++) values[channel] += row[x * 4 + channel] * tap.weight;
      }
      const offset = (y * outputWidth + x) * 4;
      const alpha = Math.max(0, Math.min(1, values[3]));
      result[offset + 3] = alpha * 255;
      if (alpha > 1 / 65535) for (let channel = 0; channel < 3; channel++) result[offset + channel] = encodeSrgb(values[channel] / alpha);
    }
  }
  return result;
}
