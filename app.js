'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('file-input');
  const dropZone = $('drop-zone');
  const quality = $('quality');
  const maxSize = $('max-size');
  const whiteBackground = $('white-background');
  const convertButton = $('convert-all');
  const zipButton = $('download-zip');
  const clearButton = $('clear-all');
  const settings = [quality, maxSize, whiteBackground];
  const MAX_FILE = 50 * 1024 * 1024;
  const MAX_TOTAL = 500 * 1024 * 1024;
  const MAX_PIXELS = 40_000_000;
  const files = [];
  let busy = false;
  let zipping = false;
  let dragDepth = 0;

  function bytes(value) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }
  function notice(message) {
    $('notice').textContent = message;
    $('notice').hidden = !message;
  }
  function outputName(name) {
    const stem = name.replace(/\.[^.]+$/, '').replace(/[\x00-\x1f/\\:*?"<>|]/g, '_').replace(/^\.+|[. ]+$/g, '').slice(0, 140) || 'image';
    const used = new Set(files.map((item) => item.name.toLowerCase()));
    let result = `${stem}.webp`, index = 2;
    while (used.has(result.toLowerCase())) result = `${stem} (${index++}).webp`;
    return result;
  }
  function refresh() {
    const done = files.filter((item) => item.blob);
    $('results').hidden = files.length === 0;
    $('file-count').textContent = `${files.length}枚`;
    convertButton.disabled = busy || zipping || !files.some((item) => !item.blob);
    convertButton.firstChild.textContent = busy ? '変換中…' : 'WebPに変換';
    zipButton.disabled = busy || zipping || done.length === 0;
    clearButton.disabled = busy || zipping;
    for (const setting of settings) setting.disabled = busy || zipping;
    $('choose-files').disabled = zipping;
    const summary = $('summary');
    summary.hidden = done.length === 0;
    if (done.length) {
      const before = done.reduce((sum, item) => sum + item.file.size, 0);
      const after = done.reduce((sum, item) => sum + item.blob.size, 0);
      const percent = before ? (1 - after / before) * 100 : 0;
      const text = percent >= 0 ? `${percent.toFixed(1)}% 軽くなりました` : `${Math.abs(percent).toFixed(1)}% サイズが増えました`;
      summary.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = text;
      const detail = document.createElement('span');
      detail.textContent = `${bytes(before)} → ${bytes(after)} ・ ${done.length}枚変換済み`;
      summary.append(strong, detail);
    }
    for (const item of files) {
      item.row.querySelector('.remove-one').disabled = busy || zipping;
      item.row.querySelector('.download-one').disabled = !item.blob || busy || zipping;
    }
  }
  function drawRow(item) {
    const row = item.row;
    row.querySelector('.file-name').textContent = item.file.name;
    row.querySelector('.file-name').title = item.file.name;
    let detail = bytes(item.file.size);
    if (item.width) detail += ` ・ ${item.width} × ${item.height} px`;
    if (item.blob) detail += ` → ${bytes(item.blob.size)} ・ ${item.name}`;
    row.querySelector('.file-detail').textContent = detail;
    row.querySelector('.file-error').textContent = item.error || '';
    const status = row.querySelector('.file-status');
    status.className = `file-status ${item.blob ? 'done' : item.error ? 'error' : ''}`;
    status.textContent = item.blob ? '✓ 変換完了' : item.error ? '変換できません' : item.processing ? '変換中…' : '変換待ち';
    row.querySelector('.download-one').setAttribute('aria-label', `${item.name} を保存`);
    row.querySelector('.remove-one').setAttribute('aria-label', `${item.file.name} を削除`);
    const image = row.querySelector('img');
    if (item.url) { image.src = item.url; image.hidden = false; }
    else { image.removeAttribute('src'); image.hidden = true; }
  }
  function release(item) {
    if (item.url) URL.revokeObjectURL(item.url);
    item.url = null;
    item.blob = null;
  }
  function addFiles(incoming) {
    if (zipping) return;
    const messages = [];
    for (const file of incoming) {
      if (!file.size) { messages.push(`${file.name}: 空のファイルです。`); continue; }
      if (/\.(heic|heif)$/i.test(file.name) || /^image\/(heic|heif)(-sequence)?$/i.test(file.type)) {
        messages.push(`${file.name}: HEIC・HEIFは非対応です。JPEGやPNGに書き出してから追加してください。`); continue;
      }
      if (!/\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(file.name) && !/^image\/(jpeg|png|gif|webp|bmp|avif)$/i.test(file.type)) {
        messages.push(`${file.name}: 対応していない形式です。`); continue;
      }
      if (file.size > MAX_FILE) { messages.push(`${file.name}: 1枚50MBまで追加できます。`); continue; }
      if (files.length >= 100) { messages.push('一度に追加できるのは100枚までです。'); break; }
      if (files.reduce((total, item) => total + item.file.size, 0) + file.size > MAX_TOTAL) { messages.push('画像の合計は500MBまでです。変換・保存後に一覧を削除して追加してください。'); break; }
      const item = { file, name: outputName(file.name), blob: null, url: null, row: $('file-template').content.firstElementChild.cloneNode(true) };
      files.push(item);
      item.row.querySelector('.download-one').addEventListener('click', () => {
        if (item.blob) download(item.blob, item.name);
      });
      item.row.querySelector('.remove-one').addEventListener('click', () => {
        if (busy || zipping) return;
        release(item);
        files.splice(files.indexOf(item), 1);
        item.row.remove();
        refresh();
      });
      drawRow(item);
      $('file-list').append(item.row);
    }
    notice(messages.slice(0, 6).join('\n') + (messages.length > 6 ? `\nほか${messages.length - 6}件のファイルを追加できませんでした。` : ''));
    refresh();
  }
  async function decodeImage(blob) {
    // ImageBitmap selects the default/first frame of animated images.
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(blob); } catch { /* Try native image decoding next. */ }
    }
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally { URL.revokeObjectURL(url); }
  }
  async function readImage(file) {
    try { return await decodeImage(file); }
    catch { throw new Error('画像を読み込めません。ファイルの形式・破損や、ブラウザがその形式に対応しているかを確認してください。'); }
  }
  async function convert(item, options) {
    const image = await readImage(item.file);
    const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('画像のサイズを取得できませんでした。');
    // Guard canvas allocations on mobile devices before drawing.
    if (width * height > MAX_PIXELS) { image.close?.(); throw new Error('画像が大きすぎます。4,000万画素以下に縮小してからお試しください。'); }
    const scale = options.maxSize ? Math.min(1, options.maxSize / Math.max(width, height)) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('描画領域を確保できません。画像を小さくしてお試しください。');
      if (options.white) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', options.quality));
      if (!blob || blob.type !== 'image/webp') throw new Error('このブラウザはWebPへの書き出しに対応していません。最新のChrome・Edge・Firefox・Safariをお試しください。');
      item.width = canvas.width;
      item.height = canvas.height;
      item.blob = blob;
      item.url = URL.createObjectURL(blob);
    } finally { canvas.width = canvas.height = 1; image.close?.(); }
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  async function convertAll() {
    if (busy || zipping) return;
    const queue = files.filter((item) => !item.blob);
    if (!queue.length) return;
    busy = true;
    notice('');
    const options = { quality: Number(quality.value) / 100, maxSize: Number(maxSize.value), white: whiteBackground.checked };
    $('progress-area').hidden = false;
    $('progress').max = queue.length;
    $('progress').value = 0;
    refresh();
    let failures = 0;
    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        item.processing = true;
        item.error = '';
        $('progress-text').textContent = `変換中: ${item.file.name}`;
        $('progress-count').textContent = `${i + 1} / ${queue.length}`;
        drawRow(item);
        await new Promise((resolve) => setTimeout(resolve, 20));
        try { await convert(item, options); }
        catch (error) { item.error = error.message || '変換できませんでした。別の画像をお試しください。'; failures++; }
        item.processing = false;
        drawRow(item);
        $('progress').value = i + 1;
        refresh();
      }
    } finally {
      busy = false;
      $('progress-area').hidden = true;
      refresh();
      notice(failures ? `${queue.length - failures}枚の変換が完了しました。${failures}枚は読み込めませんでした。各画像のエラーをご確認ください。` : `${queue.length}枚の変換が完了しました。個別またはZIPで保存できます。`);
    }
  }
  convertButton.addEventListener('click', convertAll);
  zipButton.addEventListener('click', async () => {
    if (busy || zipping) return;
    const done = files.filter((item) => item.blob);
    if (!done.length) return;
    if (done.reduce((sum, item) => sum + item.blob.size, 0) > MAX_TOTAL) {
      notice('ZIPの合計が500MBを超えています。画像を減らすか、個別に保存してください。'); return;
    }
    zipping = true;
    refresh();
    zipButton.lastChild.textContent = 'ZIPを作成中…';
    try {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const zip = await KokaruZip.createZip(done);
      download(zip, `kokaru-webp-${new Date().toISOString().slice(0, 10)}.zip`);
      notice(`${done.length}枚をまとめたZIPのダウンロードを開始しました。`);
    } catch { notice('ZIPを作成できませんでした。画像を減らすか、個別に保存してください。'); }
    finally { zipping = false; zipButton.lastChild.textContent = 'まとめてZIP保存'; refresh(); }
  });
  clearButton.addEventListener('click', () => {
    if (busy || zipping) return;
    files.forEach(release);
    files.length = 0;
    $('file-list').replaceChildren();
    notice('');
    refresh();
  });
  for (const setting of settings) setting.addEventListener('input', () => {
    $('quality-value').innerHTML = `${quality.value}<span>%</span>`;
    for (const item of files) { release(item); item.error = ''; item.width = item.height = null; drawRow(item); }
    if (files.length) notice('設定を変更しました。「WebPに変換」で新しい設定を適用してください。');
    refresh();
  });
  $('choose-files').addEventListener('click', () => input.click());
  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
    document.addEventListener(eventName, (event) => {
      if (event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files')) event.preventDefault();
    });
  }
  dropZone.addEventListener('dragenter', (event) => { event.preventDefault(); dragDepth++; dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragover', (event) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; });
  dropZone.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; dropZone.classList.remove('dragging'); } });
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault(); dragDepth = 0; dropZone.classList.remove('dragging');
    if (event.dataTransfer) addFiles(event.dataTransfer.files);
  });
  refresh();
})();
