/**
 * CRC-32は、ZIPを展開するときにデータの破損を検出するための検査値です。
 * 暗号化や改ざん防止のためのハッシュではありません。
 */
const CRC32_POLYNOMIAL = 0xedb88320;

// 1バイトは256通り。計算表を一度作り、ファイルの各バイトの処理を速くします。
const crcLookupTable = Uint32Array.from({ length: 256 }, (_, byteValue) => {
  let checksum = byteValue;
  for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
    checksum = (checksum & 1)
      ? CRC32_POLYNOMIAL ^ (checksum >>> 1)
      : checksum >>> 1;
  }
  return checksum >>> 0;
});

/** Uint8Array（0〜255の数値の配列）から、符号なし32ビットの検査値を求めます。 */
export function calculateCrc32(fileBytes) {
  let checksum = 0xffffffff;
  for (const currentByte of fileBytes) {
    const lookupIndex = (checksum ^ currentByte) & 255;
    checksum = crcLookupTable[lookupIndex] ^ (checksum >>> 8);
  }
  // JavaScriptのビット演算は符号付きになるため、>>> 0で符号なしの値に戻します。
  return (checksum ^ 0xffffffff) >>> 0;
}
