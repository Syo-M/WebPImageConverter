import { bindAnchorNavigation } from './anchor-navigation.js';

/** 段階的なホイール入力だけを穏やかに補間し、OSの慣性には重ねません。 */
export function bindSmoothScroll(reducedMotion) {
  const distanceScale = 0.65; // 1回の入力で進みすぎないよう移動量を抑えます。
  const maximumInputDistance = 80;
  const maximumPendingDistance = 150; // 連続入力でも、先の移動を大量にためません。
  const decelerationTime = 200; // 大きいほどゆっくり減速します（ミリ秒）。
  const maximumSpeed = 600; // ピクセル/秒。急な入力でも上限を超えません。
  let frameId = 0;
  let targetScroll = window.scrollY;
  let previousTime = 0;

  function stopScrolling() {
    cancelAnimationFrame(frameId);
    frameId = previousTime = 0;
    targetScroll = window.scrollY;
  }
  function animateScroll(time) {
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetScroll = Math.max(0, Math.min(maximumScroll, targetScroll));
    const distance = targetScroll - window.scrollY;
    if (reducedMotion.matches || Math.abs(distance) < 2) {
      if (!reducedMotion.matches) window.scrollTo({ top: targetScroll, behavior: 'instant' });
      stopScrolling();
      return;
    }
    // 時間差で計算し、60Hz・120Hzの画面でも同じ速さに近づけます。
    const elapsed = previousTime ? Math.min(time - previousTime, 32) : 16.67;
    previousTime = time;
    const easedDistance = distance * (1 - Math.exp(-elapsed / decelerationTime));
    const speedLimit = maximumSpeed * elapsed / 1000;
    const movement = Math.max(-speedLimit, Math.min(speedLimit, easedDistance));
    window.scrollTo({ top: window.scrollY + movement, behavior: 'instant' });
    frameId = requestAnimationFrame(animateScroll);
  }
  window.addEventListener('wheel', (event) => {
    if (event.defaultPrevented || reducedMotion.matches || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('dialog[open]') || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    // デバイス種別は直接取得できないため、段階的な入力だけを対象にします。
    // 細かな値・小数・横方向を含む操作は、トラックパッドの標準慣性に任せます。
    const magnitude = Math.abs(event.deltaY);
    const isSteppedInput = event.deltaMode !== 0 || (event.deltaX === 0 && magnitude >= 100
      && (magnitude % 100 === 0 || magnitude % 120 === 0));
    if (!isSteppedInput) { stopScrolling(); return; }
    const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maximumScroll <= 0) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const distance = Math.max(-maximumInputDistance, Math.min(maximumInputDistance, event.deltaY * unit * distanceScale));
    const pendingDistance = targetScroll - window.scrollY;
    const directionChanged = pendingDistance * distance < 0;
    const startScroll = frameId && !directionChanged ? targetScroll : window.scrollY;
    const nextScroll = Math.max(0, Math.min(maximumScroll, startScroll + distance));
    if (nextScroll === window.scrollY && !frameId) return;
    event.preventDefault();
    targetScroll = Math.max(window.scrollY - maximumPendingDistance,
      Math.min(window.scrollY + maximumPendingDistance, nextScroll));
    if (!frameId) frameId = requestAnimationFrame(animateScroll);
  }, { passive: false });
  // 別の操作へ切り替えたら惰性を残しません。タッチの慣性はブラウザが担当します。
  window.addEventListener('keydown', stopScrolling);
  window.addEventListener('pointerdown', stopScrolling, { passive: true });
  window.addEventListener('touchstart', stopScrolling, { passive: true });
  window.addEventListener('resize', stopScrolling);
  reducedMotion.addEventListener('change', stopScrolling);
  bindAnchorNavigation(reducedMotion, stopScrolling);
}
