import { captureDroppedItems, collectDroppedImages } from '../files/dropped-files.js';
import { appState } from '../state.js';
import { showNotice } from '../ui/page.js';
import { pageElements } from '../ui/elements.js';
import { addImageFiles } from '../controllers/file-controller.js';

// 子要素へマウスが移るたびにdragenter/dragleaveが発生するため、入った回数を数えます。
let dragEnterCount = 0;
let dropQueue = Promise.resolve(); // 複数回のドロップは受け取った順番で取り込みます。

/** ファイル選択・ドラッグ＆ドロップのイベントを一度だけ登録します。 */
export function bindFileInputEvents() {
  pageElements.chooseFilesButton.addEventListener('click', () => pageElements.fileInput.click());
  pageElements.fileInput.addEventListener('change', handleFileSelection);

  // ブラウザが画像を直接開いて、現在の作業ページが置き換わることを防ぎます。
  for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
    document.addEventListener(eventName, preventFileNavigation);
  }
  pageElements.dropZone.addEventListener('dragenter', handleDragEnter);
  pageElements.dropZone.addEventListener('dragover', handleDragOver);
  pageElements.dropZone.addEventListener('dragleave', handleDragLeave);
  pageElements.dropZone.addEventListener('drop', handleFileDrop);
}

/** input.filesはFileListですが、for...ofで配列と同じように順番に扱えます。 */
function handleFileSelection() {
  addImageFiles(pageElements.fileInput.files);
  pageElements.fileInput.value = ''; // 同じファイルを続けて選択してもchangeを発生させます。
}

function preventFileNavigation(event) {
  const draggedTypes = event.dataTransfer ? Array.from(event.dataTransfer.types) : [];
  if (draggedTypes.includes('Files')) event.preventDefault();
}

function handleDragEnter(event) {
  event.preventDefault();
  dragEnterCount += 1;
  pageElements.dropZone.classList.add('dragging');
}

function handleDragOver(event) {
  event.preventDefault(); // 既定の動作を止めることで、ドロップを受け付けられます。
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
}

function handleDragLeave() {
  dragEnterCount -= 1;
  if (dragEnterCount <= 0) resetDropZone();
}

/** 同期的にドロップ内容を確保してから、フォルダを非同期で読み取ります。 */
function handleFileDrop(event) {
  event.preventDefault();
  resetDropZone();
  if (!event.dataTransfer || appState.isCreatingZip) return;
  const sources = captureDroppedItems(event.dataTransfer);
  dropQueue = dropQueue.then(async () => {
    showNotice('ドロップした項目から対応画像を確認しています…');
    const result = await collectDroppedImages(sources);
    const messages = [];
    if (result.skippedCount) messages.push(`対応形式以外の${result.skippedCount}件をスキップしました。`);
    if (result.unreadableCount) messages.push(`${result.unreadableCount}件を読み取れませんでした。`);
    if (result.truncated) messages.push('探索を上限で終了しました。画像100枚または探索項目10,000件までが対象です。残りは分けて追加してください。');
    if (!result.files.length) messages.push('追加できる画像がありません。フォルダ内の対応画像を確認してください。フォルダを読み取れない場合は画像ファイルを選択してください。');
    addImageFiles(result.files, messages);
  }).catch(() => showNotice('ドロップした項目を読み取れませんでした。画像ファイルを選択して追加してください。'));
}

function resetDropZone() {
  dragEnterCount = 0;
  pageElements.dropZone.classList.remove('dragging');
}
