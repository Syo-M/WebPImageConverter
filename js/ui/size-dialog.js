import { bindEnlargementSettings, enlargementSettings } from './enlargement-settings.js';
import { pageElements } from './elements.js';

/** モーダル内の選択は、適用するまで変換設定を書き換えません。 */
export function bindSizeDialog() {
  const enlargement = bindEnlargementSettings();
  const dialog = document.getElementById('size-dialog');
  const sizeButton = pageElements.sizeButton;
  const sizeValue = document.getElementById('size-value');
  const choices = [...dialog.querySelectorAll('input[name="output-size"]')];
  const customField = document.getElementById('custom-size-field');
  const customInput = document.getElementById('custom-size');
  const errorMessage = document.getElementById('size-error');
  let draftValue = '0'; // キャンセル時はこの一時的な選択を破棄します。

  sizeButton.addEventListener('click', () => {
    enlargement.restore();
    const currentValue = pageElements.maxSizeInput.value;
    const presetExists = choices.some((choice) => choice.value === currentValue);
    draftValue = presetExists ? currentValue : 'custom';
    if (!presetExists) customInput.value = currentValue;
    choices.forEach((choice) => { choice.checked = choice.value === draftValue; });
    customField.hidden = draftValue !== 'custom';
    errorMessage.hidden = true;
    customInput.removeAttribute('aria-invalid');
    dialog.showModal(); // 背景の操作を止め、フォーカスをダイアログ内に保ちます。
    sizeButton.setAttribute('aria-expanded', 'true');
    dialog.querySelector('input:checked').focus();
  });
  for (const choice of choices) {
    choice.addEventListener('change', () => {
      draftValue = choice.value;
      customField.hidden = draftValue !== 'custom';
      errorMessage.hidden = true;
      if (draftValue === 'custom') customInput.focus();
    });
  }
  customInput.addEventListener('input', () => {
    errorMessage.hidden = true;
    customInput.removeAttribute('aria-invalid');
  });
  document.getElementById('apply-size').addEventListener('click', () => {
    const selectedValue = draftValue === 'custom' ? Number(customInput.value) : Number(draftValue);
    if (draftValue === 'custom' && (!Number.isInteger(selectedValue) || selectedValue < 1 || selectedValue > 16384)) {
      errorMessage.hidden = false;
      customInput.setAttribute('aria-invalid', 'true');
      customInput.focus();
      return;
    }
    const enlargementChanged = enlargement.apply();
    if (Number(pageElements.maxSizeInput.value) !== selectedValue || enlargementChanged) {
      pageElements.maxSizeInput.value = String(selectedValue);
      sizeValue.textContent = selectedValue ? `長辺 ${selectedValue.toLocaleString()} px${enlargementSettings.allowEnlargement ? '・拡大可' : ''}` : '元のサイズ';
      // 通常の設定欄と同じinputイベントで、変換結果のリセットを通知します。
      pageElements.maxSizeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    dialog.close();
  });
  document.getElementById('close-size-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    // ダイアログ本体の余白では閉じず、背景をクリックした場合だけ閉じます。
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    sizeButton.setAttribute('aria-expanded', 'false');
    sizeButton.focus(); // Esc・背景・閉じるボタンのどの場合も元の操作へ戻します。
  });
}
