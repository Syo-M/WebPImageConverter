import { bindAnchorNavigation } from './anchor-navigation.js';
import { advanceScrollSpring } from './scroll-spring.js';

/** ホイールは目的位置だけを更新し、実際の移動は1本の描画ループで行います。 */
export function bindSmoothScroll(reducedMotion) {
  let frameId = 0;
  let targetScroll = window.scrollY;
  let position = window.scrollY; // 小数を保ち、ブラウザの整数丸めが積み重ならないようにします。
  let velocity = 0; // ピクセル/秒。追加入力でも、位置とともに前フレームから引き継ぎます。
  let previousTime = null;

  /** 次の描画予約を取り消し、実際の表示位置へ内部の計算状態をそろえます。 */
  function stopScrolling() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    previousTime = null;
    velocity = 0;
    targetScroll = position = window.scrollY;
  }
  /** 1フレームの計算・描画・次フレームの予約を行います。 */
  function animateScroll(time) {
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetScroll = Math.max(0, Math.min(maximumScroll, targetScroll));
    if (reducedMotion.matches) { stopScrolling(); return; }
    // 60Hz・120Hzとも実際の経過時間で計算します。復帰時の大きな飛びだけを防ぎます。
    const elapsed = previousTime === null ? 1 / 60 : Math.min(time - previousTime, 64) / 1000;
    previousTime = time;
    const next = advanceScrollSpring(position, velocity, targetScroll, elapsed);
    position = Math.max(0, Math.min(maximumScroll, next.position));
    velocity = position === next.position ? next.velocity : 0;
    const hasArrived = Math.abs(targetScroll - position) < 0.35 && Math.abs(velocity) < 3;
    window.scrollTo({ top: hasArrived ? targetScroll : position, behavior: 'instant' });
    if (hasArrived) stopScrolling();
    else frameId = requestAnimationFrame(animateScroll);
  }
  window.addEventListener('wheel', (event) => {
    if (event.defaultPrevented || reducedMotion.matches || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('dialog[open]') || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    // タッチには介入せず、モバイルの慣性はブラウザに任せます。
    const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maximumScroll <= 0) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const distance = event.deltaY * unit; // 入力距離を縮小・切り捨てしません。
    const directionChanged = (targetScroll - position) * distance < 0;
    if (!frameId || directionChanged) {
      targetScroll = position = window.scrollY;
      velocity = 0; // 逆方向の操作では前の惰性を残さず、その方向へ切り替えます。
    }
    const nextTarget = Math.max(0, Math.min(maximumScroll, targetScroll + distance));
    if (nextTarget === window.scrollY && !frameId) return;
    event.preventDefault();
    targetScroll = nextTarget;
    // ここではscrollToを呼びません。イベントと描画の交互の飛びをなくします。
    if (!frameId) frameId = requestAnimationFrame(animateScroll);
  }, { passive: false });
  // 別の操作やタブの切替では、残ったアニメーションを中断します。
  window.addEventListener('keydown', stopScrolling);
  window.addEventListener('pointerdown', stopScrolling, { passive: true });
  window.addEventListener('touchstart', stopScrolling, { passive: true });
  window.addEventListener('resize', stopScrolling);
  document.addEventListener('visibilitychange', stopScrolling);
  reducedMotion.addEventListener('change', stopScrolling);
  bindAnchorNavigation(reducedMotion, stopScrolling);
}
