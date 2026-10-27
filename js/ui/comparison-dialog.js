import { createComparisonViewport } from '../comparison/viewport.js';
import { loadComparisonContent, clearComparisonContent } from '../comparison/content.js';
import { downloadSingleImage } from '../controllers/download-controller.js';

const dialog = document.getElementById('comparison-dialog');
let viewport;
let activeEntry = null; // 比較中の1枚だけを参照し、閉じたら手放します。
let returnFocus = null;
let requestNumber = 0; // 閉じる・開き直す前の読み込み結果が、新しい画面を上書きしないようにします。

/** モーダルの終了と保存を接続します。画像の変換設定には触れません。 */
export function bindComparisonDialog() {
  viewport = createComparisonViewport(dialog);
  dialog.querySelectorAll('[data-close-comparison]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.getElementById('comparison-download').addEventListener('click', () => {
    if (activeEntry) downloadSingleImage(activeEntry);
  });
  dialog.addEventListener('close', () => {
    requestNumber += 1;
    viewport.clear();
    clearComparisonContent();
    activeEntry = null;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  });
  viewport.clear();
}

/** 変換済みの比較ボタンまたはサムネイルから開き、画像の読み込み完了後に表示操作を有効にします。 */
export async function openImageComparison(imageEntry) {
  if (!imageEntry.convertedBlob || !viewport || dialog.open) return;
  const currentRequest = ++requestNumber;
  const isCurrentRequest = () => currentRequest === requestNumber && dialog.open;
  returnFocus = document.activeElement;
  activeEntry = imageEntry;
  const grid = document.getElementById('comparison-grid');
  const status = document.getElementById('comparison-status');
  const downloadButton = document.getElementById('comparison-download');
  document.getElementById('comparison-filename').textContent = imageEntry.originalFile.name;
  grid.hidden = true;
  status.hidden = false;
  status.textContent = 'プレビューを準備しています…';
  downloadButton.disabled = true;
  viewport.clear();
  dialog.showModal();
  try {
    if (!await loadComparisonContent(imageEntry, isCurrentRequest)) return;
    grid.hidden = false;
    status.hidden = true;
    viewport.show(imageEntry.outputWidth, imageEntry.outputHeight);
    downloadButton.disabled = false;
  } catch {
    if (!isCurrentRequest()) return;
    clearComparisonContent();
    status.textContent = '比較用の画像を読み込めませんでした。一覧からもう一度開いてください。';
  }
}
