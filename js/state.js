import { createUniqueWebpFileName } from './utils/file-names.js';

/**
 * アプリの「状態」です。画面の表示とは別に、画像一覧と処理中のフラグを保持します。
 * exportしたオブジェクトを各モジュールがimportして共有します。
 * ブラウザのwindowに独自のグローバル変数を追加する必要はありません。
 */
export const appState = {
  imageEntries: [], // 追加された画像の管理データ。元のFileもここで保持します。
  isConverting: false, // 画像を変換している間は設定変更や削除を止めます。
  isCreatingZip: false, // ZIPの作成中も、対象データが変わらないようにします。
};

/**
 * 画像1枚分の管理データを作ります。
 * Blobはファイルのようなバイナリデータ、Object URLはそのデータを表示する一時URLです。
 * originalPreviewUrlを変換結果から分離することで、再設定後も元画像を表示できます。
 */
export function createImageEntry(originalFile, existingImageEntries) {
  return {
    originalFile, // ファイル選択・ドロップで受け取ったFileオブジェクト。
    outputFileName: createUniqueWebpFileName(originalFile.name, existingImageEntries),
    originalPreviewUrl: URL.createObjectURL(originalFile),
    convertedBlob: null, // 変換成功時にWebPのBlobを入れます。
    convertedPreviewUrl: null, // 変換済みWebPを表示するためのURL。
    imageKindOverride: '', // 空欄は全体の種類設定に従います。混在した画像は個別に変更できます。
    originalWidth: null, originalHeight: null, // デコード後の元寸法。比較と倍率の説明に使います。
    processingMethod: '', enlargementRatio: 1, // 実際に適用した補間方式と倍率。
    outputWidth: null, // 処理後の横幅（ピクセル）。
    outputHeight: null, // 処理後の高さ（ピクセル）。
    previewFailed: false, // 元画像のプレビューが読み込めなかったか。
    isConverting: false, // この1枚を処理しているか。
    errorMessage: '', // 変換に失敗した場合の説明。
    rowElement: null, // ui/file-list.jsが生成する、この画像に対応したli要素。
  };
}

/** 設定変更時は出力だけを破棄し、元画像とそのプレビューを残します。 */
export function resetConversionResult(imageEntry) {
  if (imageEntry.convertedPreviewUrl) {
    URL.revokeObjectURL(imageEntry.convertedPreviewUrl);
  }
  imageEntry.convertedBlob = null;
  imageEntry.convertedPreviewUrl = null;
  imageEntry.outputWidth = null;
  imageEntry.outputHeight = null;
  imageEntry.originalWidth = imageEntry.originalHeight = null;
  imageEntry.processingMethod = '';
  imageEntry.enlargementRatio = 1;
  imageEntry.errorMessage = '';
}

/** 一覧から削除するときは、元画像用の一時URLも解放します。 */
export function disposeImageEntry(imageEntry) {
  resetConversionResult(imageEntry);
  if (imageEntry.originalPreviewUrl) {
    URL.revokeObjectURL(imageEntry.originalPreviewUrl);
    imageEntry.originalPreviewUrl = null;
  }
}
