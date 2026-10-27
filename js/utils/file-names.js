/**
 * WebPの保存名を作ります。同じ名前は連番で区別し、ZIP内での上書きを防ぎます。
 * 元のFile.nameは書き換えず、出力用の名前を返します。
 */
export function createUniqueWebpFileName(originalFileName, imageEntries) {
  const baseName = originalFileName
    .replace(/\.[^.]+$/, '') // 最後の拡張子を取り除きます。
    .replace(/[\x00-\x1f/\\:*?"<>|]/g, '_') // 保存先で扱いにくい文字を置換します。
    .replace(/^\.+|[. ]+$/g, '')
    .slice(0, 140) || 'image';

  // Setは重複のない値の集まりです。大文字・小文字の違いも重複として扱います。
  const existingNames = new Set(
    imageEntries.map((imageEntry) => imageEntry.outputFileName.toLowerCase()),
  );
  let outputFileName = `${baseName}.webp`;
  let duplicateNumber = 2;

  while (existingNames.has(outputFileName.toLowerCase())) {
    outputFileName = `${baseName} (${duplicateNumber}).webp`;
    duplicateNumber += 1;
  }
  return outputFileName;
}
