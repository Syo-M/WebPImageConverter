/* ZIP (STORE) writer. WebP is already compressed; no recompression is needed. */
(function (root) {
  'use strict';
  const table = Uint32Array.from({ length: 256 }, (_, n) => {
    for (let i = 0; i < 8; i++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function header(length) {
    const bytes = new Uint8Array(length);
    return { bytes, view: new DataView(bytes.buffer) };
  }
  async function createZip(files) {
    if (files.length > 65535) throw new Error('ZIPに含めるファイルが多すぎます。');
    const encoder = new TextEncoder();
    const localParts = [], centralParts = [];
    let offset = 0, centralSize = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const file of files) {
      const name = encoder.encode(file.name);
      if (name.length > 65535 || offset + file.blob.size > 0xffffffff) throw new Error('ZIPのサイズ上限を超えました。');
      const data = new Uint8Array(await file.blob.arrayBuffer());
      const crc = crc32(data);
      const local = header(30);
      local.view.setUint32(0, 0x04034b50, true);
      local.view.setUint16(4, 20, true);
      local.view.setUint16(6, 0x0800, true); // UTF-8 filename
      local.view.setUint16(10, dosTime, true);
      local.view.setUint16(12, dosDate, true);
      local.view.setUint32(14, crc, true);
      local.view.setUint32(18, data.length, true);
      local.view.setUint32(22, data.length, true);
      local.view.setUint16(26, name.length, true);
      localParts.push(local.bytes, name, file.blob);
      const central = header(46);
      central.view.setUint32(0, 0x02014b50, true);
      central.view.setUint16(4, 20, true);
      central.view.setUint16(6, 20, true);
      central.view.setUint16(8, 0x0800, true);
      central.view.setUint16(12, dosTime, true);
      central.view.setUint16(14, dosDate, true);
      central.view.setUint32(16, crc, true);
      central.view.setUint32(20, data.length, true);
      central.view.setUint32(24, data.length, true);
      central.view.setUint16(28, name.length, true);
      central.view.setUint32(42, offset, true);
      centralParts.push(central.bytes, name);
      centralSize += 46 + name.length;
      offset += 30 + name.length + data.length;
    }
    if (offset + centralSize > 0xffffffff) throw new Error('ZIPのサイズ上限を超えました。');
    const end = header(22);
    end.view.setUint32(0, 0x06054b50, true);
    end.view.setUint16(8, files.length, true);
    end.view.setUint16(10, files.length, true);
    end.view.setUint32(12, centralSize, true);
    end.view.setUint32(16, offset, true);
    return new Blob([...localParts, ...centralParts, end.bytes], { type: 'application/zip' });
  }
  root.KokaruZip = { createZip, crc32 };
  if (typeof module !== 'undefined') module.exports = root.KokaruZip;
})(globalThis);
