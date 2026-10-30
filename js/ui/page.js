import { enlargementSettings } from './enlargement-settings.js';
import { renderNextAction } from './next-action.js';
import { pageElements, conversionSettingElements, conversionButtons, zipButtons } from './elements.js';
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
    ...enlargementSettings,
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
  // 拡大を許可して長辺を指定した場合だけ、ボタンにも処理内容を明示します。
  // 「元のサイズ」（0）は拡大しないため、通常の表記を使います。
  const conversionLabel = enlargementSettings.allowEnlargement && Number(pageElements.maxSizeInput.value) > 0
    ? '拡大してWebPに変換' : 'WebPに変換';

  pageElements.emptyState.hidden = imageEntries.length > 0;
  pageElements.resultsFootnote.hidden = imageEntries.length === 0;
  pageElements.outputPlaceholder.hidden = completedEntries.length > 0;
  pageElements.outputCount.textContent = imageEntries.length ? `${imageEntries.length}枚` : '—';
  pageElements.outputPlaceholder.querySelector('p').textContent = imageEntries.length
    ? '変換設定を確認して実行してください' : '画像を追加して変換設定を確認してください';
  pageElements.sizeButton.disabled = isLocked;
  pageElements.fileCount.textContent = `${imageEntries.length}枚`;
  // 2か所のボタンの状態をそろえ、アイコンや枠のSVGを残して文字だけを更新します。
  for (const button of conversionButtons) {
    button.disabled = isLocked || !hasUnconvertedImages;
    button.querySelector('.button-label').textContent = isConverting ? '変換中…' : conversionLabel;
  }
  for (const button of zipButtons) {
    button.disabled = isLocked || completedEntries.length === 0;
    button.querySelector('.button-label').textContent = isCreatingZip ? 'ZIPを作成中…' : 'まとめてZIP保存';
  }
  pageElements.clearButton.disabled = isLocked || imageEntries.length === 0;
  pageElements.chooseFilesButton.disabled = isCreatingZip;
  for (const settingElement of conversionSettingElements) settingElement.disabled = isLocked;
  for (const imageEntry of imageEntries) updateImageRowButtons(imageEntry, isLocked);
  renderConversionSummary(completedEntries);
  renderNextAction(appState, conversionLabel);
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
