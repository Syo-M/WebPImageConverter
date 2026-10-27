import { appState, createImageEntry, resetConversionResult, disposeImageEntry } from '../state.js';
import { validateImageFile } from '../file-validation.js';
import { addImageRow, renderImageRow } from '../ui/file-list.js';
import { pageElements } from '../ui/elements.js';
import { renderPage, renderQualityDescription, showNotice } from '../ui/page.js';
import { downloadSingleImage } from './download-controller.js';

/** ファイル選択・ドロップのどちらからも呼び出す、画像追加の共通処理です。 */
export function addImageFiles(incomingFiles) {
  if (appState.isCreatingZip) return;
  const validationMessages = [];

  for (const originalFile of incomingFiles) {
    const validationError = validateImageFile(originalFile, appState.imageEntries);
    if (validationError) {
      validationMessages.push(validationError.message);
      if (validationError.stopAdding) break;
      continue; // この1枚だけを飛ばし、次の画像の確認を続けます。
    }
    const imageEntry = createImageEntry(originalFile, appState.imageEntries);
    appState.imageEntries.push(imageEntry);
    addImageRow(imageEntry, {
      onDownloadRequested: downloadSingleImage,
      onRemoveRequested: removeImage,
    });
  }

  // 大量の不正なファイルがあっても、通知欄を長くしすぎないよう最大6件にします。
  let noticeText = validationMessages.slice(0, 6).join('\n');
  if (validationMessages.length > 6) {
    noticeText += `\nほか${validationMessages.length - 6}件のファイルを追加できませんでした。`;
  }
  showNotice(noticeText);
  renderPage(appState);
}

/** 個別削除では、データ・一時URL・画面の行をまとめて片付けます。 */
export function removeImage(imageEntry) {
  if (appState.isConverting || appState.isCreatingZip) return;
  const entryIndex = appState.imageEntries.indexOf(imageEntry);
  if (entryIndex === -1) return;
  disposeImageEntry(imageEntry);
  appState.imageEntries.splice(entryIndex, 1);
  imageEntry.rowElement.remove();
  renderPage(appState);
}

/** 一覧を空にします。元の画像ファイル自体を削除する処理ではありません。 */
export function clearAllImages() {
  if (appState.isConverting || appState.isCreatingZip) return;
  appState.imageEntries.forEach(disposeImageEntry);
  appState.imageEntries.length = 0;
  pageElements.fileList.replaceChildren();
  showNotice('');
  renderPage(appState);
}

/** 設定が変わったら出力を無効にし、新しい設定で再変換できる状態へ戻します。 */
export function handleSettingsChange() {
  if (appState.isConverting || appState.isCreatingZip) return;
  renderQualityDescription();
  for (const imageEntry of appState.imageEntries) {
    resetConversionResult(imageEntry);
    renderImageRow(imageEntry); // 元画像のサムネイルは残ります。
  }
  if (appState.imageEntries.length > 0) {
    showNotice('設定を変更しました。「WebPに変換」で新しい設定を適用してください。');
  }
  renderPage(appState);
}
