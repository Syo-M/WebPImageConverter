/** 左右どちらの領域を操作しても、共通の表示位置へ移動量を渡します。 */
export function bindComparisonPan(viewports, moveByPixels) {
  for (const viewport of viewports) {
    let activePointer = null;
    let previousX = 0, previousY = 0;
    viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || viewport.dataset.canPan !== 'true') return;
      activePointer = event.pointerId;
      previousX = event.clientX; previousY = event.clientY;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-panning');
    });
    viewport.addEventListener('pointermove', (event) => {
      if (event.pointerId !== activePointer) return;
      moveByPixels(previousX - event.clientX, previousY - event.clientY);
      previousX = event.clientX; previousY = event.clientY;
    });
    function finishPan() {
      activePointer = null;
      viewport.classList.remove('is-panning');
    }
    viewport.addEventListener('pointerup', finishPan);
    viewport.addEventListener('pointercancel', finishPan);
    viewport.addEventListener('lostpointercapture', finishPan);
    viewport.addEventListener('keydown', (event) => {
      if (viewport.dataset.canPan !== 'true' || event.ctrlKey || event.metaKey || event.altKey) return;
      const steps = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
      if (!steps[event.key]) return;
      event.preventDefault();
      moveByPixels(...steps[event.key]);
    });
  }
}
