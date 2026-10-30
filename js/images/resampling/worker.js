import { resamplePixels } from './resample.js';
import { filterPixels } from './filters.js';
import { resolveMethod } from './kernels.js';

/** DOMを使わない専用スレッド。画面のスクロールやキャンセル操作を計算で止めません。 */
self.onmessage = ({ data }) => {
  try {
    const { width, height, outputWidth, outputHeight, settings } = data;
    const method = resolveMethod(settings);
    const custom = settings.enlargementMode === 'custom' && method !== 'nearest';
    let pixels = new Uint8ClampedArray(data.buffer);
    if (custom && settings.denoise) pixels = filterPixels(pixels, width, height, settings.denoise / 100, true);
    pixels = resamplePixels(pixels, width, height, outputWidth, outputHeight, method);
    if (custom && settings.sharpness) pixels = filterPixels(pixels, outputWidth, outputHeight, settings.sharpness / 100);
    self.postMessage({ buffer: pixels.buffer, method }, [pixels.buffer]);
  } catch (error) { self.postMessage({ error: error.message }); }
};
