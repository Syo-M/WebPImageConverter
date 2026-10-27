import { appState } from '../state.js';
import { MAX_ZIP_CONTENT_BYTES } from '../config.js';
import { downloadBlobAsFile } from '../utils/download-file.js';
import { createZipArchive } from '../zip/create-zip.js';
import { renderPage, showNotice } from '../ui/page.js';

/** 変換が成功している1枚だけをダウンロードします。 */
export function downloadSingleImage(imageEntry) {
  if (appState.isConverting || appState.isCreatingZip || !imageEntry.convertedBlob) return;
  downloadBlobAsFile(imageEntry.convertedBlob, imageEntry.outputFileName);
}

/** 成功した画像をZIPへまとめて保存します。失敗した画像は含めません。 */
export async function downloadCompletedImagesAsZip() {
  if (appState.isConverting || appState.isCreatingZip) return;
  const completedEntries = appState.imageEntries.filter((imageEntry) => imageEntry.convertedBlob);
  if (completedEntries.length === 0) return;

  const totalOutputBytes = completedEntries.reduce(
    (totalBytes, imageEntry) => totalBytes + imageEntry.convertedBlob.size, 0,
  );
  if (totalOutputBytes > MAX_ZIP_CONTENT_BYTES) {
    showNotice('ZIPの合計が500MBを超えています。画像を減らすか、個別に保存してください。');
    return;
  }
  appState.isCreatingZip = true;
  renderPage(appState);

  try {
    await new Promise((resolve) => setTimeout(resolve, 20));
    // ZIP処理には画面の行などを渡さず、必要なファイル名とBlobだけを渡します。
    const archiveFiles = completedEntries.map((imageEntry) => ({
      name: imageEntry.outputFileName,
      blob: imageEntry.convertedBlob,
    }));
    const zipBlob = await createZipArchive(archiveFiles);
    const dateLabel = new Date().toISOString().slice(0, 10);
    downloadBlobAsFile(zipBlob, `webp-images-${dateLabel}.zip`);
    showNotice(`${completedEntries.length}枚をまとめたZIPのダウンロードを開始しました。`);
  } catch {
    showNotice('ZIPを作成できませんでした。画像を減らすか、個別に保存してください。');
  } finally {
    appState.isCreatingZip = false;
    renderPage(appState);
  }
}
