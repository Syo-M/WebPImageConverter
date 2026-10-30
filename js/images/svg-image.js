/** 拡張子とMIMEの両方を確認します。SVGは画像としてだけ読み込み、ページに挿入しません。 */
export function isSvgImage(file) {
  return /\.svg$/i.test(file.name || '') || file.type === 'image/svg+xml';
}

/** SVGの比率を取得し、安全な画像コンテキスト用Blobを作ります。外部参照は対象外です。 */
export async function prepareSvg(file, targetSize) {
  const document = new DOMParser().parseFromString(await file.text(), 'image/svg+xml');
  const root = document.documentElement;
  if (document.querySelector('parsererror') || root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('有効なSVGファイルではありません。');
  if (root.querySelector('script, foreignObject, animate, animateTransform, animateMotion, set') || document.doctype) throw new Error('静止SVGのみ対応しています。スクリプト・アニメーション・foreignObject・DOCTYPEを除いてください。');
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attribute of [...element.attributes]) {
      const value = attribute.value.trim();
      if (/^on/i.test(attribute.name)) element.removeAttributeNode(attribute);
      if (attribute.localName === 'href' && value && !value.startsWith('#') && !/^data:image\/(png|jpeg|webp);base64,/i.test(value)) throw new Error('SVG内の外部参照は使用できません。画像を埋め込み、文字はアウトライン化してください。');
    }
  }
  // CSSの外部参照や難読化された参照は受け付けず、内部IDへのurl(#...)のみ許可します。
  const styles = [...root.querySelectorAll('style')].map((node) => node.textContent).join('\n')
    + [...root.querySelectorAll('[style]')].map((node) => node.getAttribute('style')).join('\n')
    + [root, ...root.querySelectorAll('*')].flatMap((node) => [...node.attributes].map((attr) => attr.value)).join('\n');
  if (/@import|\\/i.test(styles) || [...styles.matchAll(/url\s*\(([^)]*)\)/gi)].some((match) => !/^['"]?#[\w:.-]+['"]?$/.test(match[1].trim()))) throw new Error('SVGの外部リソース参照には対応していません。');
  const viewBox = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const hasViewBox = viewBox.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0;
  const length = (name) => {
    const value = root.getAttribute(name) || '';
    return /^\d*\.?\d+(px)?$/.test(value) ? parseFloat(value) : 0;
  };
  let width = length('width'), height = length('height');
  if (hasViewBox) {
    if (!width && !height) { width = viewBox[2]; height = viewBox[3]; }
    else if (!width) width = height * viewBox[2] / viewBox[3];
    else if (!height) height = width * viewBox[3] / viewBox[2];
  }
  if (!(width > 0 && height > 0) || !Number.isFinite(width * height)) throw new Error('SVGのwidth・heightまたはviewBoxを指定してください（寸法はpx）。');
  // viewBoxのないSVGにも座標系を与え、幅だけが変わって中身が切れることを防ぎます。
  if (!hasViewBox) root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  root.setAttribute('width', String(targetSize?.width || width));
  root.setAttribute('height', String(targetSize?.height || height));
  return { blob: new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' }), width, height };
}
