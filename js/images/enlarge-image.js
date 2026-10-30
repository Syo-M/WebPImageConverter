/** 1枚ごとにWorkerを作り、転送した画像バッファとともに終了時・中止時に解放します。 */
export function enlargeImage(imageData, outputWidth, outputHeight, settings, signal) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./resampling/worker.js', import.meta.url), { type: 'module' });
    const finish = (error, value) => {
      worker.terminate();
      signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(value);
    };
    const abort = () => finish(new DOMException('変換を中止しました。', 'AbortError'));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = ({ data }) => data.error ? finish(new Error(data.error)) : finish(null, data);
    worker.onerror = () => finish(new Error('拡大処理を開始できませんでした。Live Serverまたは公開サイトでお試しください。'));
    worker.postMessage({ buffer: imageData.data.buffer, width: imageData.width, height: imageData.height, outputWidth, outputHeight, settings }, [imageData.data.buffer]);
  });
}
