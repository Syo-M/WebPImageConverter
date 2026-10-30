/**
 * 拡大時の補正値を、利用者向けの強さと説明へ変換します。
 * パーセントはこのアプリ内の補正強度です。改善率・ノイズ除去率ではありません。
 * DOMに依存しないため、説明の境界値だけを独立して確認できます。
 */
export function getEnlargementEffectDescription(effect, percent, disabled = false) {
  if (disabled) return {
    level: 'off', label: '適用なし', range: '最近傍補間',
    description: 'ドットを保つため、この補正は適用しません。設定値を残したまま無効にしています。',
  };
  if (percent === 0) return {
    level: 'off', label: 'OFF', range: '0%',
    description: effect === 'sharpness'
      ? '輪郭を強調せずに拡大します。まずはOFFで確認し、ぼやけが気になる場合に5〜30%から試してください。'
      : 'ノイズ軽減を加えず、元の細かな質感を優先します。ざらつきが気になる場合に5〜30%から試してください。',
  };
  const level = percent < 35 ? 'low' : percent < 70 ? 'medium' : 'high';
  const descriptions = {
    sharpness: {
      low: '輪郭の明暗差を控えめに強調します。自然な見た目を保ちながら、拡大後の軽いぼやけを調整する目安です。',
      medium: '輪郭をよりはっきりさせます。細い線や文字の周囲に、明るい縁・暗い縁が目立つ場合があります。',
      high: 'この補正の中では強い輪郭強調です。ざらつきや縁取りが強まる場合があるため、変換後に比較して確認してください。',
    },
    denoise: {
      low: '明るさの近い画素を少しなじませ、細かなざらつきを控えめに抑えます。まず試す強さの目安です。',
      medium: '細かなざらつきをよりなだらかにします。髪・布・葉などの細かい質感も柔らかくなる場合があります。',
      high: 'この補正の中では強い平滑化です。細部がのっぺり見える場合があります。大きなノイズや色のノイズを除去できるとは限りません。',
    },
  };
  return {
    level,
    label: { low: '弱め', medium: '中程度', high: '強め' }[level],
    range: { low: '5–30%', medium: '35–65%', high: '70–100%' }[level],
    description: descriptions[effect][level],
  };
}
