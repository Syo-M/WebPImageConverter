import { bindLearningVisuals } from './learning-visuals.js';

/** 解説は初期状態では閉じ、必要な人だけdetailsで展開します。 */
export function bindEnlargementGuide(reducedMotion) {
  const details = document.getElementById('enlargement-guide-disclosure');
  const summary = details.querySelector('summary');
  const content = details.querySelector('.guide-disclosure-content');
  let desiredOpen = details.open;
  let activeAnimation;
  function setOpen(open) {
    desiredOpen = open;
    const currentHeight = details.open ? content.getBoundingClientRect().height : 0;
    activeAnimation?.cancel();
    if (reducedMotion.matches) {
      details.open = open;
      if (!open) summary.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      return;
    }
    details.open = true; // 高さを測るため、開いてからアニメーションを始めます。
    const animation = content.animate([
      { height: `${currentHeight}px`, opacity: currentHeight ? 1 : 0 },
      { height: `${open ? content.scrollHeight : 0}px`, opacity: open ? 1 : 0 },
    ], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' });
    activeAnimation = animation;
    animation.finished.then(() => {
      if (activeAnimation !== animation) return;
      details.open = desiredOpen;
      activeAnimation = null;
      // 長い解説を閉じてページの高さが変わっても、操作した見出しを見失わないようにします。
      if (!desiredOpen) summary.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }).catch(() => {}); // 連打時のcancelは正常な中断です。
  }
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    setOpen(!desiredOpen);
  });
  for (const button of document.querySelectorAll('[data-open-enlargement-guide]')) {
    button.addEventListener('click', () => {
      setOpen(true);
      summary.focus({ preventScroll: true });
      document.getElementById('enlargement-guide').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    activeAnimation?.cancel();
    activeAnimation = null;
    details.open = desiredOpen;
  });
  bindLearningVisuals(details, reducedMotion);
}
