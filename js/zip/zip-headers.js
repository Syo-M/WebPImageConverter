/**
 * ZIPは「ヘッダー」「ファイル名」「データ」をバイト列で並べた形式です。
 * DataViewを使うと、決められた位置へ16/32ビットの整数を書き込めます。
 * setUint16/32の最後のtrueは、ZIPが採用するリトルエンディアン（下位バイトが先）です。
 * 以下の位置・長さ・識別子はアプリ独自の値ではなく、ZIP形式の仕様に従います。
 */
const UTF8_FILE_NAME_FLAG = 0x0800;
const ZIP_VERSION_20 = 20;

/** 必要な長さの空の領域と、それに数値を書き込むDataViewを用意します。 */
function createHeaderBuffer(byteLength) {
  const headerBytes = new Uint8Array(byteLength);
  return { headerBytes, headerView: new DataView(headerBytes.buffer) };
}

/** ZIPの日時は、年月日・時分秒を16ビットずつに詰めたDOS形式です。 */
export function encodeZipTimestamp(date) {
  // DOS形式に収まる年の範囲は1980〜2107年です。秒は2秒単位で保存します。
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/** ファイル本体の直前に置く、30バイトのローカルヘッダーです。 */
export function createLocalFileHeader(fileMetadata) {
  const { headerBytes, headerView } = createHeaderBuffer(30);
  headerView.setUint32(0, 0x04034b50, true); // ローカルヘッダーを表す識別子。
  headerView.setUint16(4, ZIP_VERSION_20, true);
  headerView.setUint16(6, UTF8_FILE_NAME_FLAG, true);
  // オフセット8の圧縮方式は、初期値0（STORE：無圧縮）のままにします。
  headerView.setUint16(10, fileMetadata.timestamp.time, true);
  headerView.setUint16(12, fileMetadata.timestamp.date, true);
  headerView.setUint32(14, fileMetadata.checksum, true);
  headerView.setUint32(18, fileMetadata.fileSize, true); // 圧縮後サイズ。
  headerView.setUint32(22, fileMetadata.fileSize, true); // 元サイズ。STOREでは同じです。
  headerView.setUint16(26, fileMetadata.fileNameByteLength, true);
  // 追加フィールドを使わないので、オフセット28の長さは0のままです。
  return headerBytes;
}

/** ZIPの末尾側にまとめる目次です。各ファイルのデータの位置を記録します。 */
export function createDirectoryFileHeader(fileMetadata, localHeaderOffset) {
  const { headerBytes, headerView } = createHeaderBuffer(46);
  headerView.setUint32(0, 0x02014b50, true); // 中央ディレクトリの識別子。
  headerView.setUint16(4, ZIP_VERSION_20, true); // 作成側のバージョン。
  headerView.setUint16(6, ZIP_VERSION_20, true); // 展開に必要なバージョン。
  headerView.setUint16(8, UTF8_FILE_NAME_FLAG, true);
  headerView.setUint16(12, fileMetadata.timestamp.time, true);
  headerView.setUint16(14, fileMetadata.timestamp.date, true);
  headerView.setUint32(16, fileMetadata.checksum, true);
  headerView.setUint32(20, fileMetadata.fileSize, true);
  headerView.setUint32(24, fileMetadata.fileSize, true);
  headerView.setUint16(28, fileMetadata.fileNameByteLength, true);
  headerView.setUint32(42, localHeaderOffset, true); // ZIPの先頭から何バイト目か。
  return headerBytes;
}

/** 目次の位置・長さ・ファイル数を記録する、最後の22バイトです。 */
export function createArchiveEndHeader(fileCount, directorySize, directoryOffset) {
  const { headerBytes, headerView } = createHeaderBuffer(22);
  headerView.setUint32(0, 0x06054b50, true); // 目次終端の識別子。
  headerView.setUint16(8, fileCount, true);
  headerView.setUint16(10, fileCount, true);
  headerView.setUint32(12, directorySize, true);
  headerView.setUint32(16, directoryOffset, true);
  return headerBytes;
}
