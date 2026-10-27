import { appState } from '../state.js';
import { convertImageToWebp } from '../images/convert-image.js';
import { renderImageRow } from '../ui/file-list.js';
import {
  renderPage, showNotice, readConversionSettings,
  showConversionProgress, updateCompletedProgress, hideConversionProgress,
} from '../ui/page.js';

/**
 * 変換待ちの画像を1枚ずつ処理します。
 * 同時に大量のCanvasを作らないことで、メモリ消費を抑えます。
 */
export async function convertPendingImages() {
  if (appState.isConverting || appState.isCreatingZip) return;

  // 開始時点の対象を別の配列にします。処理中に追加された画像は次回に回ります。
  const conversionQueue = appState.imageEntries.filter((imageEntry) => !imageEntry.convertedBlob);
  if (conversionQueue.length === 0) return;
  const settings = readConversionSettings(); // 変換中に値が変わらないよう、ここで確定します。
  let failedImageCount = 0;
  appState.isConverting = true;
  showNotice('');
  renderPage(appState);

  try {
    for (let imageIndex = 0; imageIndex < conversionQueue.length; imageIndex += 1) {
      const imageEntry = conversionQueue[imageIndex];
      imageEntry.isConverting = true;
      imageEntry.errorMessage = '';
      showConversionProgress(imageEntry.originalFile.name, imageIndex, conversionQueue.length);
      renderImageRow(imageEntry);

      // JavaScriptの処理を一度ブラウザへ返し、「変換中」の画面を描画できるようにします。
      await new Promise((resolve) => setTimeout(resolve, 20));
      try {
        const result = await convertImageToWebp(imageEntry.originalFile, settings);
        imageEntry.convertedBlob = result.convertedBlob;
        imageEntry.outputWidth = result.outputWidth;
        imageEntry.outputHeight = result.outputHeight;
        imageEntry.convertedPreviewUrl = URL.createObjectURL(result.convertedBlob);
      } catch (error) {
        // 1枚の失敗で全体を止めず、理由を記録して次の画像へ進みます。
        imageEntry.errorMessage = error.message || '変換できませんでした。別の画像をお試しください。';
        failedImageCount += 1;
      } finally {
        imageEntry.isConverting = false;
      }
      renderImageRow(imageEntry);
      updateCompletedProgress(imageIndex + 1);
      renderPage(appState);
    }
  } finally {
    // 途中で例外が発生しても、画面が操作不能のままにならないように戻します。
    appState.isConverting = false;
    hideConversionProgress();
    renderPage(appState);
  }

  const successfulImageCount = conversionQueue.length - failedImageCount;
  showNotice(failedImageCount > 0
    ? `${successfulImageCount}枚の変換が完了しました。${failedImageCount}枚は読み込めませんでした。各画像のエラーをご確認ください。`
    : `${successfulImageCount}枚の変換が完了しました。個別またはZIPで保存できます。`);
}
