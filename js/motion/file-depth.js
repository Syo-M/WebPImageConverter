/** ポインターとスクロールへの反応を、ファイルの3D表現だけに適用します。 */
export function bindFileDepth(reducedMotion) {
  const art = document.querySelector('.file-art');
  const dropZone = document.getElementById('drop-zone');
  const currentPose = { x: 0, y: 0, drift: 0 };
  const targetPose = { x: 0, y: 0, drift: 0 };
  let frameId = 0;
  let previousTime = 0;

  function renderPose(time) {
    // 画面の更新頻度が違っても、近い速度で追従するよう時間差を使います。
    const timeStep = previousTime ? Math.min((time - previousTime) / 16.67, 3) : 1;
    previousTime = time;
    const easing = 1 - Math.pow(0.84, timeStep);
    let isMoving = false;
    for (const property of ['x', 'y', 'drift']) {
      currentPose[property] += (targetPose[property] - currentPose[property]) * easing;
      if (Math.abs(targetPose[property] - currentPose[property]) > 0.015) isMoving = true;
    }
    art.style.setProperty('--tilt-x', `${currentPose.x}deg`);
    art.style.setProperty('--tilt-y', `${currentPose.y}deg`);
    art.style.setProperty('--drift', `${currentPose.drift}px`);
    frameId = isMoving ? requestAnimationFrame(renderPose) : 0;
    if (!isMoving) previousTime = 0; // 静止中はアニメーションを動かし続けません。
  }
  function requestPoseUpdate() {
    if (!frameId && !reducedMotion.matches) frameId = requestAnimationFrame(renderPose);
  }
  dropZone.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reducedMotion.matches) return;
    const bounds = dropZone.getBoundingClientRect();
    const horizontalRatio = (event.clientX - bounds.left) / bounds.width;
    const verticalRatio = (event.clientY - bounds.top) / bounds.height;
    targetPose.x = -(verticalRatio - 0.5) * 26;
    targetPose.y = (horizontalRatio - 0.5) * 36;
    art.style.setProperty('--light-x', `${horizontalRatio * 100}%`);
    art.style.setProperty('--light-y', `${verticalRatio * 100}%`);
    requestPoseUpdate();
  });
  dropZone.addEventListener('pointerleave', () => {
    targetPose.x = targetPose.y = 0;
    requestPoseUpdate();
  });
  let previousScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const distance = window.scrollY - previousScroll;
    previousScroll = window.scrollY;
    if (reducedMotion.matches) return;
    currentPose.drift = Math.max(-7, Math.min(7, distance * 0.1));
    requestPoseUpdate();
  }, { passive: true });
  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(frameId);
    frameId = previousTime = 0;
    for (const property of ['x', 'y', 'drift']) currentPose[property] = targetPose[property] = 0;
    art.style.setProperty('--tilt-x', '0deg');
    art.style.setProperty('--tilt-y', '0deg');
    art.style.setProperty('--drift', '0px');
  });
}
