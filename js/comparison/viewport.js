import { getFitZoom, getComparisonLayout } from './geometry.js';
import { bindComparisonPan } from './pan.js';

/** 画像の読み込みから独立した、左右共通の倍率と注目位置の管理です。 */
export function createComparisonViewport(dialog) {
  const viewports = [...dialog.querySelectorAll('.comparison-viewport')];
  const buttons = [...dialog.querySelectorAll('[data-comparison-action]')];
  const zoomLabel = document.getElementById('comparison-zoom');
  let imageWidth = 1, imageHeight = 1, zoom = 1;
  let centerX = 0.5, centerY = 0.5, isReady = false, isFitted = true;
  function fitZoom() {
    return getFitZoom(imageWidth, imageHeight, viewports[0].clientWidth, viewports[0].clientHeight);
  }
  function render() {
    if (!isReady || !dialog.open || !viewports[0].clientWidth) return;
    if (isFitted) zoom = fitZoom();
    const layout = getComparisonLayout(imageWidth, imageHeight, zoom, centerX, centerY,
      viewports[0].clientWidth, viewports[0].clientHeight);
    centerX = layout.centerX; centerY = layout.centerY;
    for (const viewport of viewports) {
      const plane = viewport.querySelector('.comparison-plane');
      plane.style.width = `${layout.width}px`; plane.style.height = `${layout.height}px`;
      plane.style.transform = `translate(${layout.left}px, ${layout.top}px)`;
      viewport.dataset.canPan = String(layout.canPan);
      viewport.style.touchAction = layout.canPan ? 'none' : 'pan-y';
    }
    const label = `${zoom < 0.01 ? (zoom * 100).toFixed(2) : Math.round(zoom * 100)}%`;
    if (zoomLabel.textContent !== label) zoomLabel.textContent = label;
    for (const button of buttons) {
      const action = button.dataset.comparisonAction;
      button.disabled = action === 'in' ? zoom >= 4 : action === 'out' ? zoom <= fitZoom() + 0.000001 : false;
      if (action === 'fit' || action === 'actual') {
        button.setAttribute('aria-pressed', String(action === 'fit' ? isFitted : !isFitted && zoom === 1));
      }
    }
  }
  function setZoom(nextZoom, fit = false) {
    if (!isReady) return;
    isFitted = fit;
    zoom = Math.max(fitZoom(), Math.min(4, nextZoom));
    if (fit) centerX = centerY = 0.5;
    render();
  }
  for (const button of buttons) button.addEventListener('click', () => {
    const action = button.dataset.comparisonAction;
    if (action === 'fit') setZoom(fitZoom(), true);
    else setZoom(action === 'actual' ? 1 : zoom * (action === 'in' ? 1.5 : 1 / 1.5));
  });
  bindComparisonPan(viewports, (horizontalPixels, verticalPixels) => {
    if (!isReady) return;
    centerX += horizontalPixels / (imageWidth * zoom);
    centerY += verticalPixels / (imageHeight * zoom);
    render();
  });
  const observer = new ResizeObserver(render);
  viewports.forEach((viewport) => observer.observe(viewport));
  return {
    show(width, height) {
      imageWidth = width; imageHeight = height;
      centerX = centerY = 0.5; isReady = true; isFitted = true;
      render();
    },
    clear() {
      isReady = false;
      buttons.forEach((button) => { button.disabled = true; });
      zoomLabel.textContent = '—';
    },
  };
}
