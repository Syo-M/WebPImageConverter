import { isSupportedImageFile } from '../file-validation.js';
import { MAX_IMAGE_COUNT } from '../config.js';

/** dropのイベント中だけ参照できるデータを、awaitする前にすべて取り出します。 */
export function captureDroppedItems(dataTransfer) {
  const sources = [];
  for (const item of Array.from(dataTransfer.items || [])) {
    if (item.kind !== 'file') continue;
    const getEntry = item.getAsEntry || item.webkitGetAsEntry;
    const entry = getEntry?.call(item);
    const file = entry ? null : item.getAsFile();
    if (entry || file) sources.push({ entry, file });
  }
  // フォルダAPIが使えないブラウザでも、通常の画像ドロップを維持します。
  return sources.length ? sources : Array.from(dataTransfer.files || [], (file) => ({ file }));
}

/**
 * サブフォルダも順番に調べ、対応形式だけを返します。画像の内容はここでは読み込みません。
 * 読み込み失敗はその項目だけを飛ばし、大量のフォルダでも探索を無制限に続けません。
 */
export async function collectDroppedImages(sources) {
  const result = { files: [], skippedCount: 0, unreadableCount: 0, truncated: false };
  let visitedCount = 0;
  async function visit(source) {
    if (result.truncated) return;
    if (++visitedCount > 10000) { result.truncated = true; return; }
    const { entry } = source;
    try {
      if (entry?.isDirectory) {
        const reader = entry.createReader();
        // readEntriesは一度に全件を返すとは限りません。空になるまで同じreaderを使います。
        while (!result.truncated) {
          const children = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
          if (!children.length) break;
          for (const child of children) {
            await visit({ entry: child });
            if (result.truncated) break;
          }
        }
        return;
      }
      const file = source.file || await new Promise((resolve, reject) => entry.file(resolve, reject));
      if (!isSupportedImageFile(file)) { result.skippedCount += 1; return; }
      // 101枚目を見つけた時点で止め、一覧へ渡すFileの参照も100枚に抑えます。
      if (result.files.length >= MAX_IMAGE_COUNT) { result.truncated = true; return; }
      result.files.push(file);
    } catch {
      result.unreadableCount += 1;
    }
  }
  for (const source of sources) {
    await visit(source);
    if (result.truncated) break;
  }
  return result;
}
