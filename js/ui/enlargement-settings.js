import { getEnlargementEffectDescription } from '../enlargement-effects.js';

/** 適用済み設定。モーダルの編集中の値は、適用するまでここへ書き込みません。 */
export const enlargementSettings = {
  allowEnlargement: false, enlargementMode: 'auto', imageKind: 'photo',
  interpolation: 'recommended', sharpness: 0, denoise: 0,
};

/** トグルと段階的な詳細表示を管理します。キャンセル時は適用済みの値へ戻します。 */
export function bindEnlargementSettings() {
  const fields = Object.fromEntries(Object.keys(enlargementSettings).map((key) => [key, document.getElementById(key)]));
  const panel = document.getElementById('enlargement-options');
  const custom = document.getElementById('enlargement-custom');
  const update = () => {
    panel.hidden = !fields.allowEnlargement.checked;
    custom.hidden = fields.enlargementMode.value !== 'custom';
    const pixel = fields.imageKind.value === 'pixel';
    fields.interpolation.disabled = pixel;
    for (const key of ['sharpness', 'denoise']) fields[key].disabled = pixel || fields.interpolation.value === 'nearest';
    document.getElementById('sharpness-value').textContent = fields.sharpness.value === '0' ? 'OFF' : `${fields.sharpness.value}%`;
    document.getElementById('denoise-value').textContent = fields.denoise.value === '0' ? 'OFF' : `${fields.denoise.value}%`;
    // 数値だけでなく、強さの目安と画像への影響をスライダー操作に合わせて更新します。
    // 最近傍では保存された値があっても補正しないため、実際の適用状態を優先して伝えます。
    for (const effect of ['sharpness', 'denoise']) {
      const percent = Number(fields[effect].value);
      const info = getEnlargementEffectDescription(effect, percent, fields[effect].disabled);
      const level = document.getElementById(`${effect}-level`);
      level.textContent = info.label;
      level.dataset.level = info.level;
      document.getElementById(`${effect}-range`).textContent = info.range;
      document.getElementById(`${effect}-description`).textContent = info.description;
      fields[effect].setAttribute('aria-valuetext', `${percent}%・${info.label}`);
    }
    document.getElementById('enlargement-note').textContent = fields.allowEnlargement.checked
      ? '縦横比を維持し、指定した長辺へ直接拡大します。拡大出力は1,200万画素まで。'
      : '縦横比を維持します。元画像より大きく拡大しません。';
  };
  for (const field of Object.values(fields)) field.addEventListener('input', update);
  return {
    restore() {
      for (const [key, field] of Object.entries(fields)) {
        if (field.type === 'checkbox') field.checked = enlargementSettings[key];
        else field.value = enlargementSettings[key];
      }
      update();
    },
    apply() {
      const previous = JSON.stringify(enlargementSettings);
      for (const [key, field] of Object.entries(fields)) enlargementSettings[key] = field.type === 'checkbox' ? field.checked
        : field.type === 'range' ? Number(field.value) : field.value;
      return previous !== JSON.stringify(enlargementSettings);
    },
  };
}
