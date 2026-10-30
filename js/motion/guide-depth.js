/** ガイドのカードを小さく傾け、スクロールで一度だけ登場させます。 */
export function bindGuideDepth(reducedMotion) {
  const surfaces = [...document.querySelectorAll('.depth-surface')];
  for (const surface of surfaces) {
    let frameId = 0;
    let previousTime = 0;
    const pose = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    function update(time) {
      const timeStep = previousTime ? Math.min((time - previousTime) / 16.67, 3) : 1;
      previousTime = time;
      const easing = 1 - Math.pow(0.8, timeStep);
      for (const axis of ['x', 'y']) pose[axis] += (target[axis] - pose[axis]) * easing;
      surface.style.setProperty('--surface-x', `${pose.x}deg`);
      surface.style.setProperty('--surface-y', `${pose.y}deg`);
      const isMoving = Math.abs(pose.x - target.x) + Math.abs(pose.y - target.y) > 0.01;
      frameId = isMoving ? requestAnimationFrame(update) : 0;
      if (!isMoving) previousTime = 0;
    }
    function requestUpdate() {
      if (!frameId && !reducedMotion.matches) frameId = requestAnimationFrame(update);
    }
    surface.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || reducedMotion.matches) return;
      const bounds = surface.getBoundingClientRect();
      target.x = -((event.clientY - bounds.top) / bounds.height - 0.5) * 4;
      target.y = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
      requestUpdate();
    });
    surface.addEventListener('pointerleave', () => {
      target.x = target.y = 0;
      requestUpdate();
    });
    reducedMotion.addEventListener('change', () => {
      cancelAnimationFrame(frameId);
      frameId = previousTime = 0;
      pose.x = pose.y = target.x = target.y = 0;
      surface.style.setProperty('--surface-x', '0deg');
      surface.style.setProperty('--surface-y', '0deg');
    });
  }
  // 補間の解説も既存ガイドと同じ登場・傾きの処理を共有します。
  const revealElements = [...document.querySelectorAll('.workflow-card, .faq-intro, .faq-content, .resampling-card')];
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // 何度も画面に出入りしても再生しません。
    }
  }, { threshold: 0.1 });
  revealElements.forEach((element, index) => {
    element.classList.add('guide-reveal');
    element.style.setProperty('--reveal-delay', `${index < 3 ? index * 70 : 0}ms`);
    observer.observe(element);
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    revealElements.forEach((element) => element.classList.add('is-visible'));
  });
}
