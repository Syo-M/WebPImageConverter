/** 出力ピクセルを基準にした共通の倍率。初期表示では1倍を超えて拡大しません。 */
export function getFitZoom(imageWidth, imageHeight, viewportWidth, viewportHeight) {
  return Math.min(1, viewportWidth / imageWidth, viewportHeight / imageHeight);
}

/**
 * 注目位置を0〜1の比率で保持し、左右の画像に同じ位置を表示します。
 * 端まで移動しても余白へ画像が逃げないよう、注目位置を表示領域で制限します。
 */
export function getComparisonLayout(imageWidth, imageHeight, zoom, centerX, centerY, viewportWidth, viewportHeight) {
  const width = imageWidth * zoom, height = imageHeight * zoom;
  const horizontalMargin = Math.min(0.5, viewportWidth / (2 * width));
  const verticalMargin = Math.min(0.5, viewportHeight / (2 * height));
  const boundedX = Math.max(horizontalMargin, Math.min(1 - horizontalMargin, centerX));
  const boundedY = Math.max(verticalMargin, Math.min(1 - verticalMargin, centerY));
  return {
    width, height, centerX: boundedX, centerY: boundedY,
    left: viewportWidth / 2 - boundedX * width,
    top: viewportHeight / 2 - boundedY * height,
    canPan: width > viewportWidth + 1 || height > viewportHeight + 1,
  };
}
