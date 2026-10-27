import { pageElements } from '../ui/elements.js';
import { addImageFiles } from '../controllers/file-controller.js';

// 子要素へマウスが移るたびにdragenter/dragleaveが発生するため、入った回数を数えます。
let dragEnterCount = 0;

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

/** ドロップされたFileListも、ファイル選択と同じ追加処理へ渡します。 */
function handleFileDrop(event) {
  event.preventDefault();
  resetDropZone();
  if (event.dataTransfer) addImageFiles(event.dataTransfer.files);
}

function resetDropZone() {
  dragEnterCount = 0;
  pageElements.dropZone.classList.remove('dragging');
}
