import {
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_INPUT_BYTES,
  MAX_IMAGE_COUNT,
} from './config.js';

/**
 * 追加してよいファイルかを判定します。成功時はnull、失敗時は理由を返します。
 * stopAddingは、一覧全体の上限に達したので追加処理を打ち切るかを表します。
 * 拡張子・MIMEタイプは入口の確認であり、本当に画像かはデコード時に判定されます。
 */
export function validateImageFile(originalFile, imageEntries) {
  if (originalFile.size === 0) {
    return { message: `${originalFile.name}: 空のファイルです。`, stopAdding: false };
  }

  if (!isSupportedImageFile(originalFile)) {
    const isHeic = /\.(heic|heif)$/i.test(originalFile.name) || /^image\/(heic|heif)(-sequence)?$/i.test(originalFile.type);
    return {
      message: isHeic ? `${originalFile.name}: HEIC・HEIFは非対応です。JPEGやPNGに書き出してから追加してください。`
        : `${originalFile.name}: 対応していない形式です。`,
      stopAdding: false,
    };
  }
  if (originalFile.size > MAX_FILE_SIZE_BYTES) {
    return { message: `${originalFile.name}: 1枚50MBまで追加できます。`, stopAdding: false };
  }
  if (imageEntries.length >= MAX_IMAGE_COUNT) {
    return { message: '一度に追加できるのは100枚までです。', stopAdding: true };
  }

  // reduceは、配列の各要素から1つの値（ここでは入力サイズの合計）を計算します。
  const totalInputBytes = imageEntries.reduce(
    (totalBytes, imageEntry) => totalBytes + imageEntry.originalFile.size,
    0,
  );
  if (totalInputBytes + originalFile.size > MAX_TOTAL_INPUT_BYTES) {
    return {
      message: '画像の合計は500MBまでです。変換・保存後に一覧を削除して追加してください。',
      stopAdding: true,
    };
  }
  return null;
}

/** フォルダ内の画像抽出と通常の追加で、対応形式の判断を共通にします。 */
export function isSupportedImageFile(file) {
  if (/\.(heic|heif)$/i.test(file.name) || /^image\/(heic|heif)(-sequence)?$/i.test(file.type)) return false;
  return /\.(jpe?g|png|gif|webp|bmp|avif|svg)$/i.test(file.name)
    || /^image\/(jpeg|png|gif|webp|bmp|avif|svg\+xml)$/i.test(file.type);
}
