/** ページ内リンクは、ゆっくり加速・減速する専用の移動に分けます。 */
export function bindAnchorNavigation(reducedMotion, stopWheelScrolling) {
  let frameId = 0;
  /** 手動操作へ切り替えるとき、到着先へ勝手に動き続けないよう予約を取り消します。 */
  function cancelNavigation() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    let target;
    try {
      target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    } catch { return; } // 不正なエンコードのリンクは通常のブラウザ動作へ戻します。
    if (!target) return;
    event.preventDefault();
    cancelNavigation();
    stopWheelScrolling();
    const startPosition = window.scrollY;
    const targetBounds = target.getBoundingClientRect();
    const topMargin = parseFloat(getComputedStyle(target).scrollMarginTop) || 24;
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const destination = Math.max(0, Math.min(maximumScroll, startPosition + targetBounds.top - topMargin));
    const distance = destination - startPosition;
    const duration = Math.min(1400, 900 + Math.abs(distance) * 0.18);
    let startTime;
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);

    function finishNavigation() {
      // キーボードで続けて操作できるよう、到着先へフォーカスを移します。
      const originalTabIndex = target.getAttribute('tabindex');
      if (originalTabIndex === null) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (originalTabIndex === null) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      frameId = 0;
    }
    function animate(time) {
      startTime ??= time;
      const progress = Math.min(1, (time - startTime) / duration);
      // easeInOutCubic：出発と到着を特にゆっくりにし、終点で跳ね返らせません。
      const easedProgress = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      const currentMaximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.min(currentMaximum, startPosition + distance * easedProgress), behavior: 'instant' });
      if (progress < 1) frameId = requestAnimationFrame(animate);
      else finishNavigation();
    }
    if (reducedMotion.matches || Math.abs(distance) < 2) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      finishNavigation();
    } else {
      frameId = requestAnimationFrame(animate);
    }
  });
  // 移動中に手でスクロールしたら、その入力を優先して案内の移動を中断します。
  window.addEventListener('wheel', cancelNavigation, { passive: true });
  window.addEventListener('touchstart', cancelNavigation, { passive: true });
  window.addEventListener('pointerdown', cancelNavigation, { passive: true });
  window.addEventListener('keydown', cancelNavigation);
  window.addEventListener('resize', cancelNavigation);
  window.addEventListener('popstate', cancelNavigation);
  reducedMotion.addEventListener('change', cancelNavigation);
}
