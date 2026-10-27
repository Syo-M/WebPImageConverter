/**
 * Blobを、指定された名前で保存します。サーバーへのアップロードは行いません。
 * download属性付きのa要素を一時的に作り、通常のリンク操作で保存を開始します。
 */
export function downloadBlobAsFile(fileBlob, fileName) {
  const downloadUrl = URL.createObjectURL(fileBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  // 直後にURLを解放するとダウンロードに失敗するブラウザがあるため、少し待ちます。
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
}
