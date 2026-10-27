/**
 * アプリの入口です。最初はこのファイルから読み始めてください。
 * ここでは「どの操作で、どの処理を呼ぶか」だけを決めます。
 * 実際の画像処理・画面描画・ZIP作成は、import先の小さなモジュールへ分けています。
 */
import { appState } from './state.js';
import { pageElements, conversionSettingElements } from './ui/elements.js';
import { renderPage, renderQualityDescription } from './ui/page.js';
import { bindFileInputEvents } from './events/file-input-events.js';
import { clearAllImages, handleSettingsChange } from './controllers/file-controller.js';
import { convertPendingImages } from './controllers/conversion-controller.js';
import { downloadCompletedImagesAsZip } from './controllers/download-controller.js';

/** イベントを登録し、まだ画像がない初期画面を描画します。 */
function initializeApplication() {
  bindFileInputEvents();
  pageElements.convertButton.addEventListener('click', convertPendingImages);
  pageElements.zipButton.addEventListener('click', downloadCompletedImagesAsZip);
  pageElements.clearButton.addEventListener('click', clearAllImages);

  // 画質・サイズ・背景のどれを変更しても、共通の再設定処理を呼びます。
  for (const settingElement of conversionSettingElements) {
    settingElement.addEventListener('input', handleSettingsChange);
  }
  renderQualityDescription();
  renderPage(appState);
}

initializeApplication();
