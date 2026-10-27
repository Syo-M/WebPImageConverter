/**
 * FileまたはBlobから、Canvasへ描画できる画像を読み込みます。
 * createImageBitmapはアニメーション画像の既定（通常は先頭）のフレームを使います。
 */
export async function decodeImage(imageBlob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(imageBlob);
    } catch {
      // 同じファイルでもImage要素なら読み込める場合があるため、次の方法を試します。
    }
  }

  const temporaryImageUrl = URL.createObjectURL(imageBlob);
  try {
    const imageElement = new Image();
    imageElement.src = temporaryImageUrl;
    await imageElement.decode(); // 読み込みが終わってから描画へ進みます。
    return imageElement;
  } finally {
    // 成功・失敗のどちらでも一時URLを解放します。
    URL.revokeObjectURL(temporaryImageUrl);
  }
}

/** 読み込み方法に関係なく、利用者向けの共通メッセージを返します。 */
export async function readImageFile(originalFile) {
  try {
    return await decodeImage(originalFile);
  } catch {
    throw new Error('画像を読み込めません。ファイルの形式・破損や、ブラウザがその形式に対応しているかを確認してください。');
  }
}
