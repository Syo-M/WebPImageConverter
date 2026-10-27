/**
 * アプリ全体で共有する上限値です。
 * 定数を一か所にまとめると、仕様を変更するときの修正漏れを防げます。
 */
const BYTES_PER_MEGABYTE = 1024 * 1024;

// メモリを使いすぎないよう、入力画像と出力ZIPの大きさを制限します。
export const MAX_FILE_SIZE_BYTES = 50 * BYTES_PER_MEGABYTE;
export const MAX_TOTAL_INPUT_BYTES = 500 * BYTES_PER_MEGABYTE;
export const MAX_ZIP_CONTENT_BYTES = 500 * BYTES_PER_MEGABYTE;
export const MAX_IMAGE_COUNT = 100;

// 圧縮ファイルが小さくても、展開すると大量のメモリを使う画像があります。
export const MAX_IMAGE_PIXELS = 40_000_000;
