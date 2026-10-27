import { calculateCrc32 } from './crc32.js';
import {
  encodeZipTimestamp, createLocalFileHeader,
  createDirectoryFileHeader, createArchiveEndHeader,
} from './zip-headers.js';

// ZIP64を使わない通常のZIPに格納できる、ファイル数とサイズの上限です。
const MAX_ZIP_ENTRIES = 65535;
const MAX_ZIP_UINT32 = 0xffffffff;

/**
 * [{ name: '写真.webp', blob: Blob }, ...] からZIPのBlobを作ります。
 * WebP自体が圧縮済みなので、ZIPでは再圧縮せずSTORE方式で格納します。
 * このモジュールはDOMを使わず、ZIPの作成だけに責任を持ちます。
 */
export async function createZipArchive(archiveFiles) {
  if (archiveFiles.length > MAX_ZIP_ENTRIES) {
    throw new Error('ZIPに含めるファイルが多すぎます。');
  }
  const fileNameEncoder = new TextEncoder(); // 日本語もUTF-8のバイト列に変換します。
  const localFileParts = []; // ファイルごとのヘッダー・名前・本体を順に入れます。
  const directoryParts = []; // ファイルの位置を記録する目次を順に入れます。
  const timestamp = encodeZipTimestamp(new Date());
  let nextLocalHeaderOffset = 0; // 次のファイルが始まる位置。単位はバイトです。
  let directorySize = 0;

  for (const archiveFile of archiveFiles) {
    const fileNameBytes = fileNameEncoder.encode(archiveFile.name);
    if (fileNameBytes.length > 65535 || nextLocalHeaderOffset + archiveFile.blob.size > MAX_ZIP_UINT32) {
      throw new Error('ZIPのサイズ上限を超えました。');
    }
    const fileBytes = new Uint8Array(await archiveFile.blob.arrayBuffer());
    const fileMetadata = {
      fileSize: fileBytes.length,
      fileNameByteLength: fileNameBytes.length,
      checksum: calculateCrc32(fileBytes),
      timestamp,
    };
    const localHeader = createLocalFileHeader(fileMetadata);
    const directoryHeader = createDirectoryFileHeader(fileMetadata, nextLocalHeaderOffset);
    localFileParts.push(localHeader, fileNameBytes, archiveFile.blob);
    directoryParts.push(directoryHeader, fileNameBytes);
    nextLocalHeaderOffset += localHeader.length + fileNameBytes.length + fileBytes.length;
    directorySize += directoryHeader.length + fileNameBytes.length;
  }

  if (nextLocalHeaderOffset + directorySize > MAX_ZIP_UINT32) {
    throw new Error('ZIPのサイズ上限を超えました。');
  }
  const endHeader = createArchiveEndHeader(archiveFiles.length, directorySize, nextLocalHeaderOffset);
  // スプレッド構文で部品の配列を展開し、1つのバイナリファイルとして結合します。
  return new Blob([...localFileParts, ...directoryParts, endHeader], { type: 'application/zip' });
}
