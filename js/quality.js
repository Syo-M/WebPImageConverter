/**
 * 画質の数値から、画面に表示する区分と説明を返します。
 * DOMを操作しない関数なので、ブラウザの外でも単独で検証できます。
 * この区分はアプリの目安であり、画像の劣化率を保証するものではありません。
 */
export function getQualityDescription(qualityPercent) {
  if (qualityPercent < 40) {
    return {
      level: 'low',
      label: '低画質',
      range: '10–39%',
      description: '圧縮を優先します。細部のつぶれや輪郭のにじみが目立つ場合があります。',
    };
  }
  if (qualityPercent < 80) {
    return {
      level: 'medium',
      label: '中画質',
      range: '40–79%',
      description: '容量と画質を両立します。細かな質感や文字・細線が変化する場合があります。',
    };
  }
  return {
    level: 'high',
    label: '高画質',
    range: '80–100%',
    description: '細部の再現を優先します。質感や輪郭が変化する場合があります。',
  };
}
