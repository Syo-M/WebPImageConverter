import { MAX_IMAGE_PIXELS } from '../config.js';
import { readImageFile } from './decode-image.js';

/**
 * Fileを1枚だけWebPへ変換します。画面や一覧データを変更せず、結果を返します。
 * settings: { qualityRatio: 0〜1, maxLongEdge: 上限px（0は原寸）, useWhiteBackground: boolean }
 */
export async function convertImageToWebp(originalFile, settings) {
  const decodedImage = await readImageFile(originalFile);
  let canvasElement;

  try {
    // Image要素とImageBitmapでは、寸法を取得するプロパティ名が異なります。
    const originalWidth = decodedImage.naturalWidth || decodedImage.width;
    const originalHeight = decodedImage.naturalHeight || decodedImage.height;
    if (!originalWidth || !originalHeight) {
      throw new Error('画像のサイズを取得できませんでした。');
    }
    if (originalWidth * originalHeight > MAX_IMAGE_PIXELS) {
      throw new Error('画像が大きすぎます。4,000万画素以下に縮小してからお試しください。');
    }

    // 長辺に合わせて同じ倍率で縮小します。Math.min(1, ...)で拡大を防ぎます。
    const resizeRatio = settings.maxLongEdge
      ? Math.min(1, settings.maxLongEdge / Math.max(originalWidth, originalHeight))
      : 1;
    const outputWidth = Math.max(1, Math.round(originalWidth * resizeRatio));
    const outputHeight = Math.max(1, Math.round(originalHeight * resizeRatio));

    canvasElement = document.createElement('canvas');
    canvasElement.width = outputWidth;
    canvasElement.height = outputHeight;
    const drawingContext = canvasElement.getContext('2d');
    if (!drawingContext) {
      throw new Error('描画領域を確保できません。画像を小さくしてお試しください。');
    }
    if (settings.useWhiteBackground) {
      drawingContext.fillStyle = '#ffffff';
      drawingContext.fillRect(0, 0, outputWidth, outputHeight);
    }
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = 'high';
    drawingContext.drawImage(decodedImage, 0, 0, outputWidth, outputHeight);

    // toBlobのコールバックをPromiseで包み、awaitで結果を待てるようにします。
    const convertedBlob = await new Promise((resolve) => {
      canvasElement.toBlob(resolve, 'image/webp', settings.qualityRatio);
    });
    // 非対応ブラウザではPNGになる場合があるので、拡張子だけでなく中身の種類も確認します。
    if (!convertedBlob || convertedBlob.type !== 'image/webp') {
      throw new Error('このブラウザはWebPへの書き出しに対応していません。最新のChrome・Edge・Firefox・Safariをお試しください。');
    }
    return { convertedBlob, outputWidth, outputHeight };
  } finally {
    // 大きな画像を次々処理するため、不要になった描画メモリを解放します。
    if (canvasElement) canvasElement.width = canvasElement.height = 1;
    decodedImage.close?.(); // ImageBitmapだけが持つcloseメソッドを、存在するときに呼びます。
  }
}
