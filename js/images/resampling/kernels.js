/** ユーザー向けの種類を実際の補間方式に対応させます。おまかせは過剰な輪郭強調を避けます。 */
export function resolveMethod(settings) {
  if (settings.enlargementMode !== 'custom') return 'bicubic';
  if (settings.imageKind === 'pixel') return 'nearest';
  if (settings.interpolation !== 'recommended') return settings.interpolation;
  return settings.imageKind === 'photo' ? 'lanczos' : settings.imageKind === 'logo' ? 'bilinear' : 'bicubic';
}

/** Mitchell–Netravali（B=C=1/3）。写真・線画の双方に使いやすい穏やかな三次補間です。 */
function cubic(distance) {
  const x = Math.abs(distance);
  if (x < 1) return (7 * x ** 3 - 12 * x ** 2 + 16 / 3) / 6;
  if (x < 2) return (-7 / 3 * x ** 3 + 12 * x ** 2 - 20 * x + 32 / 3) / 6;
  return 0;
}
function lanczos(distance) {
  const x = Math.abs(distance);
  if (x < 1e-8) return 1;
  if (x >= 3) return 0;
  return Math.sin(Math.PI * x) * Math.sin(Math.PI * x / 3) / (Math.PI ** 2 * x ** 2 / 3);
}

/** 出力画素の中心から元画像の参照位置と重みを一度だけ計算します。 */
export function createWeights(inputSize, outputSize, method) {
  const radius = method === 'lanczos' ? 3 : method === 'bilinear' ? 1 : 2;
  return Array.from({ length: outputSize }, (_, index) => {
    const center = (index + 0.5) * inputSize / outputSize - 0.5;
    const taps = [];
    let total = 0;
    for (let position = Math.ceil(center - radius); position <= Math.floor(center + radius); position++) {
      const weight = method === 'lanczos' ? lanczos(center - position) : method === 'bilinear' ? Math.max(0, 1 - Math.abs(center - position)) : cubic(center - position);
      taps.push({ index: Math.max(0, Math.min(inputSize - 1, position)), weight });
      total += weight;
    }
    for (const tap of taps) tap.weight /= total;
    return taps;
  });
}
