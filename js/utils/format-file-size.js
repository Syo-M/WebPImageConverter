/** バイト数を、画面で読みやすい B / KB / MB に変換します。 */
export function formatFileSize(sizeInBytes) {
  const bytesPerKilobyte = 1024;
  const bytesPerMegabyte = bytesPerKilobyte * 1024;

  if (sizeInBytes < bytesPerKilobyte) return `${sizeInBytes} B`;
  if (sizeInBytes < bytesPerMegabyte) {
    return `${(sizeInBytes / bytesPerKilobyte).toFixed(1)} KB`;
  }
  return `${(sizeInBytes / bytesPerMegabyte).toFixed(2)} MB`;
}
