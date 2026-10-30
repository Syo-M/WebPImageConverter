import { enlargementSettings } from './enlargement-settings.js';
import { pageElements } from './elements.js';
import { formatFileSize } from '../utils/format-file-size.js';

/** templateのひな型をコピーし、画像1枚分の行とボタン操作を作成します。 */
export function addImageRow(imageEntry, { onDownloadRequested, onRemoveRequested, onCompareRequested, onKindChanged }) {
  const rowElement = pageElements.fileTemplate.content.firstElementChild.cloneNode(true);
  imageEntry.rowElement = rowElement;

  rowElement.querySelector('img').addEventListener('error', () => {
    // 壊れた画像でも一覧の他のファイルを操作できるよう、プレビューだけを非表示にします。
    imageEntry.previewFailed = true;
    rowElement.querySelector('img').hidden = true;
    rowElement.querySelector('.thumbnail-fallback').hidden = false;
  });
  // 文字付きボタンとサムネイルのどちらからも、同じ比較画面を開きます。
  rowElement.querySelectorAll('.compare-preview, .compare-action').forEach((button) => {
    button.addEventListener('click', () => onCompareRequested(imageEntry));
  });
  rowElement.querySelector('.download-one').addEventListener('click', () => {
    onDownloadRequested(imageEntry);
  });
  rowElement.querySelector('.remove-one').addEventListener('click', () => {
    onRemoveRequested(imageEntry);
  });
  rowElement.querySelector('.image-kind').addEventListener('change', (event) => onKindChanged(imageEntry, event.target.value));
  renderImageRow(imageEntry);
  pageElements.fileList.append(rowElement);
}

/** 管理データを読み取り、ファイル名・容量・状態を1行に反映します。 */
export function renderImageRow(imageEntry) {
  const rowElement = imageEntry.rowElement;
  rowElement.querySelector('.image-kind-field').hidden = !enlargementSettings.allowEnlargement || enlargementSettings.enlargementMode !== 'custom' || /\.svg$/i.test(imageEntry.originalFile.name);
  const originalFileName = imageEntry.originalFile.name;
  const fileNameElement = rowElement.querySelector('.file-name');
  fileNameElement.textContent = originalFileName;
  fileNameElement.title = originalFileName;

  let detailText = formatFileSize(imageEntry.originalFile.size);
  if (imageEntry.outputWidth) {
    detailText += ` ・ ${imageEntry.originalWidth} × ${imageEntry.originalHeight} → ${imageEntry.outputWidth} × ${imageEntry.outputHeight} px`;
  }
  if (imageEntry.convertedBlob) {
    detailText += ` → ${formatFileSize(imageEntry.convertedBlob.size)} ・ ${imageEntry.outputFileName}`;
  }
  if (imageEntry.convertedBlob && imageEntry.enlargementRatio > 1) detailText += ` ・ ${imageEntry.enlargementRatio.toFixed(2)}倍・${imageEntry.processingMethod}`;
  rowElement.querySelector('.file-detail').textContent = detailText;
  rowElement.querySelector('.file-error').textContent = imageEntry.errorMessage;

  const statusElement = rowElement.querySelector('.file-status');
  statusElement.className = 'file-status';
  if (imageEntry.convertedBlob) {
    statusElement.textContent = '✓ 変換完了';
    statusElement.classList.add('done');
  } else if (imageEntry.errorMessage) {
    statusElement.textContent = '変換できません';
    statusElement.classList.add('error');
  } else {
    statusElement.textContent = imageEntry.isConverting ? '変換中…' : '変換待ち';
  }
  rowElement.querySelector('.download-one').setAttribute('aria-label', `${imageEntry.outputFileName} を保存`);
  rowElement.querySelector('.remove-one').setAttribute('aria-label', `${originalFileName} を削除`);
  const compareButton = rowElement.querySelector('.compare-preview');
  compareButton.classList.toggle('comparison-available', Boolean(imageEntry.convertedBlob));
  compareButton.setAttribute('aria-label', `${originalFileName} の変換前後を比較`);
  const compareAction = rowElement.querySelector('.compare-action');
  compareAction.hidden = !imageEntry.convertedBlob; // 変換できた画像にだけ、目立つ入口を表示します。
  compareAction.setAttribute('aria-label', `${originalFileName} の変換前後を比較する`);
  renderImageThumbnail(imageEntry);
}

/** 変換後は結果の画像を、変換前・設定変更後は元画像を表示します。 */
function renderImageThumbnail(imageEntry) {
  const rowElement = imageEntry.rowElement;
  const imageElement = rowElement.querySelector('img');
  const previewUrl = imageEntry.convertedPreviewUrl || imageEntry.originalPreviewUrl;
  const isPreviewUnavailable = imageEntry.previewFailed && !imageEntry.convertedPreviewUrl;

  imageElement.alt = `${imageEntry.originalFile.name} のプレビュー`;
  rowElement.querySelector('.thumbnail-fallback').hidden = !isPreviewUnavailable;
  rowElement.querySelector('.thumbnail > svg').style.display = previewUrl ? 'none' : '';
  if (previewUrl && !isPreviewUnavailable) {
    // 同じURLを再代入して、画像の再読み込みが発生することを避けます。
    if (imageElement.getAttribute('src') !== previewUrl) imageElement.src = previewUrl;
    imageElement.hidden = false;
  } else {
    imageElement.removeAttribute('src');
    imageElement.hidden = true;
  }
}

/** 処理中は削除と保存を止め、元データが途中で変わることを防ぎます。 */
export function updateImageRowButtons(imageEntry, isLocked) {
  imageEntry.rowElement.querySelectorAll('.compare-preview, .compare-action').forEach((button) => {
    button.disabled = isLocked || !imageEntry.convertedBlob;
  });
  imageEntry.rowElement.querySelector('.image-kind').disabled = isLocked;
  imageEntry.rowElement.querySelector('.remove-one').disabled = isLocked;
  imageEntry.rowElement.querySelector('.download-one').disabled = isLocked || !imageEntry.convertedBlob;
}
