/**
 * 解説の模式図を一度ずつ再生します。画像変換の状態・設定には触れません。
 * 表示時・ホバー・再生ボタンが共通の入口を使い、画面外では動きを止めます。
 */
export function bindLearningVisuals(container, reducedMotion) {
  const scenes = [...container.querySelectorAll('.learning-scene')];
  const runningTimers = new Map();
  function stop(scene) {
    clearTimeout(runningTimers.get(scene));
    runningTimers.delete(scene);
    scene.classList.remove('is-playing');
  }
  function play(scene) {
    stop(scene);
    if (reducedMotion.matches || !container.open) return;
    // 同じCSSアニメーションを再生し直すため、一度クラスを外して描画を確定します。
    void scene.offsetWidth;
    scene.classList.add('is-playing');
    runningTimers.set(scene, setTimeout(() => stop(scene), 1700));
  }
  for (const scene of scenes) {
    const card = scene.closest('article');
    card.querySelector('.visual-replay').addEventListener('click', () => play(scene));
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch' && !runningTimers.has(scene)) play(scene);
    });
  }
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= .4) play(entry.target);
      else stop(entry.target);
    }
  }, { threshold: .4 }) : null;
  scenes.forEach((scene) => observer?.observe(scene));
  const stopAll = () => scenes.forEach(stop);
  container.addEventListener('toggle', () => { if (!container.open) stopAll(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stopAll(); });
}
