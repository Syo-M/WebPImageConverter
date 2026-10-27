import { pageElements, conversionSettingElements } from './elements.js';
import { updateImageRowButtons } from './file-list.js';
import { getQualityDescription } from '../quality.js';
import { formatFileSize } from '../utils/format-file-size.js';

/** 通知欄を更新します。textContentを使い、ファイル名をHTMLとして解釈させません。 */
export function showNotice(message) {
  pageElements.notice.textContent = message;
  pageElements.notice.hidden = !message;
}

/** 入力欄は文字列なので、Numberで数値へ変換してから変換処理へ渡します。 */
export function readConversionSettings() {
  return {
    qualityRatio: Number(pageElements.qualityInput.value) / 100,
    maxLongEdge: Number(pageElements.maxSizeSelect.value),
    useWhiteBackground: pageElements.whiteBackgroundCheckbox.checked,
  };
}

/** スライダーの数値に対応する画質区分と説明を表示します。 */
export function renderQualityDescription() {
  const qualityPercent = Number(pageElements.qualityInput.value);
  const qualityInfo = getQualityDescription(qualityPercent);
  const percentUnit = document.createElement('span');
  percentUnit.textContent = '%';
  pageElements.qualityValue.replaceChildren(String(qualityPercent), percentUnit);
  pageElements.qualityLevel.textContent = qualityInfo.label;
  pageElements.qualityLevel.dataset.level = qualityInfo.level;
  pageElements.qualityRange.textContent = qualityInfo.range;
  pageElements.qualityDescription.textContent = qualityInfo.description;
}

/** 状態に合わせて、ページ全体の表示と操作できるボタンを更新します。 */
export function renderPage(appState) {
  const { imageEntries, isConverting, isCreatingZip } = appState;
  const isLocked = isConverting || isCreatingZip;
  const completedEntries = imageEntries.filter((imageEntry) => imageEntry.convertedBlob);
  const hasUnconvertedImages = imageEntries.some((imageEntry) => !imageEntry.convertedBlob);

  pageElements.resultsSection.hidden = imageEntries.length === 0;
  pageElements.fileCount.textContent = `${imageEntries.length}枚`;
  pageElements.convertButton.disabled = isLocked || !hasUnconvertedImages;
  pageElements.zipButton.disabled = isLocked || completedEntries.length === 0;
  pageElements.clearButton.disabled = isLocked;
  pageElements.chooseFilesButton.disabled = isCreatingZip;
  // ボタン内のアイコンを消さないよう、専用の文字要素だけを書き換えます。
  pageElements.convertButton.querySelector('.button-label').textContent = isConverting ? '変換中…' : 'WebPに変換';
  pageElements.zipButton.querySelector('.button-label').textContent = isCreatingZip ? 'ZIPを作成中…' : 'まとめてZIP保存';

  for (const settingElement of conversionSettingElements) settingElement.disabled = isLocked;
  for (const imageEntry of imageEntries) updateImageRowButtons(imageEntry, isLocked);
  renderConversionSummary(completedEntries);
}

/** 成功した画像だけを集計し、変換前後の合計容量を表示します。 */
function renderConversionSummary(completedEntries) {
  pageElements.summary.hidden = completedEntries.length === 0;
  if (completedEntries.length === 0) return;

  const originalBytes = completedEntries.reduce(
    (totalBytes, imageEntry) => totalBytes + imageEntry.originalFile.size, 0,
  );
  const convertedBytes = completedEntries.reduce(
    (totalBytes, imageEntry) => totalBytes + imageEntry.convertedBlob.size, 0,
  );
  const reductionPercent = originalBytes ? (1 - convertedBytes / originalBytes) * 100 : 0;
  const summaryHeading = document.createElement('strong');
  summaryHeading.textContent = reductionPercent >= 0
    ? `容量を${reductionPercent.toFixed(1)}%削減`
    : `容量が${Math.abs(reductionPercent).toFixed(1)}%増加`;
  const summaryDetail = document.createElement('span');
  summaryDetail.textContent = `${formatFileSize(originalBytes)} → ${formatFileSize(convertedBytes)} ・ ${completedEntries.length}枚変換済み`;
  pageElements.summary.replaceChildren(summaryHeading, summaryDetail);
}

/** 現在のファイル名と完了数をprogress要素に反映します。 */
export function showConversionProgress(fileName, imageIndex, totalImages) {
  pageElements.progressArea.hidden = false;
  pageElements.progressText.textContent = `変換中: ${fileName}`;
  pageElements.progressCount.textContent = `${imageIndex + 1} / ${totalImages}`;
  pageElements.progressBar.max = totalImages;
  pageElements.progressBar.value = imageIndex;
}

/** 最後の処理結果を反映し、処理終了時には進捗欄を非表示にします。 */
export function updateCompletedProgress(completedCount) {
  pageElements.progressBar.value = completedCount;
}

export function hideConversionProgress() {
  pageElements.progressArea.hidden = true;
}
