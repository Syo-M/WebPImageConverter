import { pageElements, conversionSettingElements } from './elements.js';
import { updateImageRowButtons } from './file-list.js';
import { getQualityDescription } from '../quality.js';
import { renderConversionSummary } from './conversion-summary.js';

/** 通知欄を更新します。textContentを使い、ファイル名をHTMLとして解釈させません。 */
export function showNotice(message) {
  pageElements.notice.textContent = message;
  pageElements.notice.hidden = !message;
}

/** 入力欄は文字列なので、Numberで数値へ変換してから変換処理へ渡します。 */
export function readConversionSettings() {
  return {
    qualityRatio: Number(pageElements.qualityInput.value) / 100,
    maxLongEdge: Number(pageElements.maxSizeInput.value),
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

  pageElements.emptyState.hidden = imageEntries.length > 0;
  pageElements.resultsFootnote.hidden = imageEntries.length === 0;
  pageElements.outputPlaceholder.hidden = completedEntries.length > 0;
  pageElements.outputCount.textContent = imageEntries.length ? `${imageEntries.length}枚` : '—';
  pageElements.outputPlaceholder.querySelector('p').textContent = imageEntries.length
    ? '変換設定を確認して実行してください' : '画像を追加して変換設定を確認してください';
  pageElements.sizeButton.disabled = isLocked;
  pageElements.fileCount.textContent = `${imageEntries.length}枚`;
  pageElements.convertButton.disabled = isLocked || !hasUnconvertedImages;
  pageElements.zipButton.disabled = isLocked || completedEntries.length === 0;
  pageElements.clearButton.disabled = isLocked || imageEntries.length === 0;
  pageElements.chooseFilesButton.disabled = isCreatingZip;
  // ボタン内のアイコンを消さないよう、専用の文字要素だけを書き換えます。
  pageElements.convertButton.querySelector('.button-label').textContent = isConverting ? '変換中…' : 'WebPに変換';
  pageElements.zipButton.querySelector('.button-label').textContent = isCreatingZip ? 'ZIPを作成中…' : 'まとめてZIP保存';

  for (const settingElement of conversionSettingElements) settingElement.disabled = isLocked;
  for (const imageEntry of imageEntries) updateImageRowButtons(imageEntry, isLocked);
  renderConversionSummary(completedEntries);
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
