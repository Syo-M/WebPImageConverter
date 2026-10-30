import { pageElements, conversionButtons, zipButtons } from './elements.js';

// 同じ状態の再描画や保存後に、発光を繰り返さないために直前の操作段階を覚えます。
let previousActionStep = 'empty';

/** 未処理の画像は変換へ、処理済みの成功画像は保存へ、次の操作を示します。 */
export function renderNextAction({ imageEntries, isConverting, isCreatingZip }, conversionLabel = 'WebPに変換') {
  const completedCount = imageEntries.filter((entry) => entry.convertedBlob).length;
  const pendingCount = imageEntries.filter((entry) => !entry.convertedBlob && !entry.errorMessage).length;
  // 一部が失敗しても、成功分を保存できるようZIPを強調します。全件失敗なら再試行を案内します。
  const shouldConvert = pendingCount > 0 || (completedCount === 0 && imageEntries.length > 0);
  const shouldSave = completedCount > 0 && !shouldConvert;
  for (const [button, isPrimary] of [
    ...conversionButtons.map((button) => [button, shouldConvert]), ...zipButtons.map((button) => [button, shouldSave]),
  ]) {
    button.classList.toggle('primary', isPrimary);
    button.classList.toggle('secondary', !isPrimary);
  }
  pageElements.nextAction.hidden = imageEntries.length === 0;
  // Tipsの位置は保ったまま、変換からZIP保存へボタンと説明を切り替えます。
  pageElements.uploadTip.hidden = imageEntries.length === 0;
  const showSaveButton = shouldSave || isCreatingZip;
  pageElements.inlineConvertButton.hidden = showSaveButton;
  pageElements.inlineZipButton.hidden = !showSaveButton;
  const tipMessage = isConverting ? '変換しています。完了後は画質の比較・保存に進めます。'
    : isCreatingZip ? 'ZIPを作成しています。ダウンロード開始までお待ちください。'
    : showSaveButton ? '変換が完了しました。画質を比較して確認し、まとめてZIP保存できます。'
    : `変換設定を調整し、「${conversionLabel}」を押してください。変換後は、画質の比較・保存に進めます。`;
  if (pageElements.uploadTipText.textContent !== tipMessage) pageElements.uploadTipText.textContent = tipMessage;
  const step = imageEntries.length === 0 ? 'empty' : shouldSave ? 'save' : 'convert';
  pageElements.nextAction.dataset.step = step;
  const title = isConverting ? '画像を変換中' : isCreatingZip ? 'ZIPを作成中'
    : showSaveButton ? '次はZIPで保存' : '次は画像を変換';
  for (const heading of [pageElements.uploadTipTitle, pageElements.nextActionTitle]) {
    if (heading.textContent !== title) heading.textContent = title;
  }
  // 画像追加・変換完了・再設定で段階が変わったときだけ、CSSの一回きりの発光・短い拡大縮小・表面のグラデーションを起動します。
  // 処理中の枚数更新は段階の切り替えに含めず、完了して操作可能になるまで待ちます。
  if (isConverting || isCreatingZip) {
    // disabled解除で同じCSSアニメーションが再開しないよう、処理開始時に発光を外します。
    [...conversionButtons, ...zipButtons].forEach((button) => button.classList.toggle('action-arrival', false));
  } else if (step !== previousActionStep) {
    conversionButtons.forEach((button) => button.classList.toggle('action-arrival', step === 'convert'));
    zipButtons.forEach((button) => button.classList.toggle('action-arrival', step === 'save'));
    previousActionStep = step;
  }
  const message = isConverting ? '変換しています。完了すると比較・保存できます。'
    : isCreatingZip ? '変換済みの画像をZIPにまとめています。'
    : shouldConvert ? (pendingCount ? `次の操作：変換設定を調整し、${pendingCount}枚をWebPに変換。完了後に比較・保存へ進めます。`
      : '画像のエラーを確認して、設定変更や画像の追加後に再変換してください。')
    : '次の操作：画質を比較して、まとめてZIP保存。個別保存もできます。';
  // 同じ内容の再描画で、ライブ領域を何度も読み上げさせないようにします。
  if (pageElements.nextActionText.textContent !== message) pageElements.nextActionText.textContent = message;
}

