/**
 * HTMLのidとJavaScriptで使う名前の対応表です。
 * DOM（ページの要素）を探す処理をここへ集め、他のファイルでは役割の名前で参照します。
 * type="module"のスクリプトはHTMLの解析後に動くため、ここで要素を取得できます。
 */
export const pageElements = {
  fileInput: document.getElementById('file-input'),
  chooseFilesButton: document.getElementById('choose-files'),
  dropZone: document.getElementById('drop-zone'),
  qualityInput: document.getElementById('quality'),
  qualityValue: document.getElementById('quality-value'),
  qualityLevel: document.getElementById('quality-level'),
  qualityRange: document.getElementById('quality-range'),
  qualityDescription: document.getElementById('quality-description'),
  maxSizeInput: document.getElementById('max-size'),
  sizeButton: document.getElementById('size-button'),
  emptyState: document.getElementById('empty-state'),
  resultsFootnote: document.getElementById('results-footnote'),
  outputPlaceholder: document.getElementById('output-placeholder'),
  outputCount: document.getElementById('output-count'),
  whiteBackgroundCheckbox: document.getElementById('white-background'),
  convertButton: document.getElementById('convert-all'),
  zipButton: document.getElementById('download-zip'),
  clearButton: document.getElementById('clear-all'),
  resultsSection: document.getElementById('results'),
  fileCount: document.getElementById('file-count'),
  fileList: document.getElementById('file-list'),
  fileTemplate: document.getElementById('file-template'),
  summary: document.getElementById('summary'),
  progressArea: document.getElementById('progress-area'),
  progressText: document.getElementById('progress-text'),
  progressCount: document.getElementById('progress-count'),
  progressBar: document.getElementById('progress'),
  notice: document.getElementById('notice'),
};

// 同じタイミングで有効・無効を切り替える設定欄を配列にまとめます。
export const conversionSettingElements = [
  pageElements.qualityInput,
  pageElements.maxSizeInput,
  pageElements.whiteBackgroundCheckbox,
];
