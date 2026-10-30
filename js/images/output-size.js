import { MAX_IMAGE_PIXELS } from '../config.js';
export const MAX_ENLARGED_PIXELS = 12_000_000;
/** 元画像と指定長辺から、縦横比を保った最終寸法を一度だけ計算します。 */
export function calculateOutputSize(width, height, settings) {
  let ratio = settings.maxLongEdge ? settings.maxLongEdge / Math.max(width, height) : 1;
  if (!settings.allowEnlargement) ratio = Math.min(1, ratio);
  const outputWidth = Math.max(1, Math.round(width * ratio));
  const outputHeight = Math.max(1, Math.round(height * ratio));
  const enlarged = ratio > 1;
  const limit = enlarged ? MAX_ENLARGED_PIXELS : MAX_IMAGE_PIXELS;
  if (outputWidth > 16384 || outputHeight > 16384 || outputWidth * outputHeight > limit) throw new Error(`出力が大きすぎます。長辺16,384px以下・${enlarged ? '拡大時は1,200万' : '4,000万'}画素以下に指定してください。`);
  return { outputWidth, outputHeight, enlarged, ratio };
}
