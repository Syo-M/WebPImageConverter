/** sRGBの値を線形光へ変換する表。補間中に暗い縁が出ることを防ぎます。 */
export const linearLight = Float32Array.from({ length: 256 }, (_, value) => {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
});

/** 線形光を表示用sRGBへ戻します。負の値や輪郭付近の過大値は範囲内に収めます。 */
export function encodeSrgb(value) {
  value = Math.max(0, Math.min(1, value));
  return 255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055);
}
