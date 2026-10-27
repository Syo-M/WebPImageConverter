import { getQualityDescription } from '../quality.js';

/** 操作例だけを再生します。変換アプリのstateや設定欄には接続しません。 */
export function bindWorkflowGuide(reducedMotion) {
  const qualityInput = document.getElementById('guide-quality');
  const qualityValue = document.getElementById('guide-quality-value');
  const qualityLevel = document.getElementById('guide-quality-level');
  const status = document.getElementById('guide-status');
  const qualityCard = document.querySelector('[data-step="settings"]');
  const qualityButton = qualityCard.querySelector('.guide-play');
  const automaticPlaybackDone = new Set(); // 初回ホバーだけ自動再生し、その後はボタンで再生します。
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)'); // マウスでホバーできる環境かを調べます。
  const resetCallbacks = new Map(); // 再生中のタイマーを、カードごとに管理します。

  /** 操作例のスライダー・数値・画質区分だけを更新します。 */
  function renderDemoQuality(value) {
    qualityInput.value = value;
    qualityValue.textContent = `${value}%`;
    qualityLevel.textContent = getQualityDescription(value).label;
  }
  /** 完了状態を表示し、再生ボタンを再び操作できるようにします。 */
  function finishExample(card, button) {
    card.dataset.phase = 'done';
    button.disabled = false;
    button.querySelector('span').textContent = 'もう一度見る';
    const messages = {
      upload: '操作例：JPEGとPNGをまとめて追加しました。',
      settings: '操作例：画質を80%に設定しました。実際の変換設定は変更していません。',
      save: '操作例：変換したWebPをZIPにまとめました。実際の保存は行いません。',
    };
    status.textContent = messages[card.dataset.step];
  }
  document.querySelectorAll('[data-play-step]').forEach((button) => {
    const card = button.closest('.workflow-card');
    /** 自動再生とボタンクリックで、同じ再生処理を共有します。 */
    function playExample() {
      automaticPlaybackDone.add(card);
      resetCallbacks.get(card)?.();
      card.dataset.phase = 'playing';
      button.disabled = true;
      button.querySelector('span').textContent = '操作例を再生中…';
      const timers = [];
      if (card === qualityCard) {
        renderDemoQuality(80);
        if (!reducedMotion.matches) {
          // 短い段階表示で区分の変化を見せ、最後は80%へ戻します。
          for (const [delay, value] of [[220, 25], [620, 55], [1050, 80]]) {
            timers.push(setTimeout(() => renderDemoQuality(value), delay));
          }
        }
      }
      const cancel = () => timers.forEach(clearTimeout);
      resetCallbacks.set(card, cancel);
      if (reducedMotion.matches) {
        finishExample(card, button);
      } else {
        timers.push(setTimeout(() => {
          finishExample(card, button);
          resetCallbacks.delete(card);
        }, 1450));
      }
    }
    button.addEventListener('click', playExample);
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || !canHover.matches || reducedMotion.matches) return;
      if (automaticPlaybackDone.has(card)) return;
      playExample();
    });
  });
  qualityInput.addEventListener('input', () => {
    // スライダーを触ったら操作例の自動変更を止め、利用者の入力を優先します。
    resetCallbacks.get(qualityCard)?.();
    resetCallbacks.delete(qualityCard);
    qualityCard.dataset.phase = 'ready';
    qualityButton.disabled = false;
    qualityButton.querySelector('span').textContent = '設定の動きを見る';
    renderDemoQuality(Number(qualityInput.value));
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    document.querySelectorAll('.workflow-card[data-phase="playing"]').forEach((card) => {
      resetCallbacks.get(card)?.();
      resetCallbacks.delete(card);
      if (card === qualityCard) renderDemoQuality(80);
      finishExample(card, card.querySelector('.guide-play'));
    });
  });
}
