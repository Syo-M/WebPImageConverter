import { MAX_IMAGE_PIXELS } from '../config.js';
import { readImageFile, decodeImage } from './decode-image.js';
import { isSvgImage, prepareSvg } from './svg-image.js';
import { calculateOutputSize } from './output-size.js';
import { enlargeImage } from './enlarge-image.js';

/** 元画像から処理し、最後に一度だけWebPへ圧縮します。UIや一覧の状態は変更しません。 */
export async function convertImageToWebp(originalFile, settings, signal) {
  const svg = isSvgImage(originalFile) ? await prepareSvg(originalFile) : null;
  let decodedImage = svg ? null : await readImageFile(originalFile);
  let canvasElement;
  try {
    const originalWidth = svg?.width || decodedImage.naturalWidth || decodedImage.width;
    const originalHeight = svg?.height || decodedImage.naturalHeight || decodedImage.height;
    if (!originalWidth || !originalHeight) throw new Error('画像のサイズを取得できませんでした。');
    if (!svg && originalWidth * originalHeight > MAX_IMAGE_PIXELS) throw new Error('入力画像は4,000万画素以下にしてください。');
    const size = calculateOutputSize(originalWidth, originalHeight, settings);
    const { outputWidth, outputHeight, enlarged } = size;
    // ベクターは元サイズのビットマップを拡大せず、最終寸法で直接ラスタライズします。
    if (svg) decodedImage = await decodeImage((await prepareSvg(originalFile, { width: outputWidth, height: outputHeight })).blob);
    canvasElement = document.createElement('canvas');
    canvasElement.width = !svg && enlarged ? originalWidth : outputWidth;
    canvasElement.height = !svg && enlarged ? originalHeight : outputHeight;
    let context = canvasElement.getContext('2d', { colorSpace: 'srgb' });
    if (!context) throw new Error('描画領域を確保できません。出力を小さくしてください。');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(decodedImage, 0, 0, canvasElement.width, canvasElement.height);
    let method = svg ? 'SVGを直接描画' : 'ブラウザ標準';
    if (!svg && enlarged) {
      const pixels = context.getImageData(0, 0, originalWidth, originalHeight);
      // 元の描画メモリは、Workerの処理が終わるまで保持する必要がありません。
      canvasElement.width = canvasElement.height = 1;
      const result = await enlargeImage(pixels, outputWidth, outputHeight, settings, signal);
      method = { nearest: '最近傍', lanczos: 'Lanczos 3', bicubic: 'バイキュービック', bilinear: 'バイリニア' }[result.method];
      canvasElement.width = outputWidth; canvasElement.height = outputHeight;
      context = canvasElement.getContext('2d', { colorSpace: 'srgb' });
      context.putImageData(new ImageData(new Uint8ClampedArray(result.buffer), outputWidth, outputHeight), 0, 0);
    }
    if (signal?.aborted) throw new DOMException('変換を中止しました。', 'AbortError');
    if (settings.useWhiteBackground) {
      context.globalCompositeOperation = 'destination-over';
      context.fillStyle = '#fff'; context.fillRect(0, 0, outputWidth, outputHeight);
      context.globalCompositeOperation = 'source-over';
    }
    const convertedBlob = await new Promise((resolve) => canvasElement.toBlob(resolve, 'image/webp', settings.qualityRatio));
    if (!convertedBlob || convertedBlob.type !== 'image/webp') throw new Error('このブラウザはWebP書き出しに対応していません。別のブラウザでお試しください。');
    return { convertedBlob, outputWidth, outputHeight, originalWidth, originalHeight, processingMethod: method, enlargementRatio: size.ratio };
  } finally {
    if (canvasElement) canvasElement.width = canvasElement.height = 1;
    decodedImage?.close?.();
  }
}
