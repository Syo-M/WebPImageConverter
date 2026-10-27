import { readImageFile } from '../images/decode-image.js';
import { formatFileSize } from '../utils/format-file-size.js';

/** 元画像を同じ出力サイズの静止フレームへ描き、縮小条件をそろえて比較します。 */
export async function loadComparisonContent(imageEntry, isCurrentRequest) {
  const canvas = document.getElementById('comparison-original');
  const outputImage = document.getElementById('comparison-converted');
  const decodedImage = await readImageFile(imageEntry.originalFile);
  const originalWidth = decodedImage.naturalWidth || decodedImage.width;
  const originalHeight = decodedImage.naturalHeight || decodedImage.height;
  try {
    if (!isCurrentRequest()) return false;
    canvas.width = imageEntry.outputWidth; canvas.height = imageEntry.outputHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('プレビューの描画領域を確保できませんでした。');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(decodedImage, 0, 0, canvas.width, canvas.height);
  } finally {
    decodedImage.close?.(); // 比較用Canvasへ描いたら、元画像のデコード用メモリは解放します。
  }
  if (!isCurrentRequest()) return false;
  outputImage.src = imageEntry.convertedPreviewUrl;
  outputImage.alt = `${imageEntry.outputFileName} のプレビュー`;
  await outputImage.decode();
  if (!isCurrentRequest()) return false;
  document.getElementById('comparison-original-detail').textContent =
    `${formatFileSize(imageEntry.originalFile.size)} · ${originalWidth} × ${originalHeight} px`;
  document.getElementById('comparison-converted-detail').textContent =
    `${formatFileSize(imageEntry.convertedBlob.size)} · ${imageEntry.outputWidth} × ${imageEntry.outputHeight} px`;
  return true;
}

/** URLはstate.jsの所有物なので取り消さず、比較画面の参照と描画メモリだけを片付けます。 */
export function clearComparisonContent() {
  const canvas = document.getElementById('comparison-original');
  canvas.width = canvas.height = 1;
  document.getElementById('comparison-converted').removeAttribute('src');
}
