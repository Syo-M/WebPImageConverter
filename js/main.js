/**
 * アプリの入口です。最初はこのファイルから読み始めてください。
 * ここでは「どの操作で、どの処理を呼ぶか」だけを決めます。
 * 実際の画像処理・画面描画・ZIP作成は、import先の小さなモジュールへ分けています。
 */
import { bindComparisonDialog } from './ui/comparison-dialog.js';
import { bindWorkflowGuide } from './ui/workflow-guide.js';
import { bindEnlargementGuide } from './ui/enlargement-guide.js';
import { bindFaq } from './ui/faq.js';
import { bindGuideDepth } from './motion/guide-depth.js';
import { bindSizeDialog } from './ui/size-dialog.js';
import { bindFileDepth } from './motion/file-depth.js';
import { bindSmoothScroll } from './motion/smooth-scroll.js';
import { appState } from './state.js';
import { pageElements, conversionSettingElements, conversionButtons, zipButtons } from './ui/elements.js';
import { renderPage, renderQualityDescription } from './ui/page.js';
import { bindFileInputEvents } from './events/file-input-events.js';
import { clearAllImages, handleSettingsChange } from './controllers/file-controller.js';
import { convertPendingImages, cancelConversion } from './controllers/conversion-controller.js';
import { downloadCompletedImagesAsZip } from './controllers/download-controller.js';

/** イベントを登録し、まだ画像がない初期画面を描画します。 */
function initializeApplication() {
  // ファイル追加とサイズ選択は、実際の変換設定につながる操作です。
  bindFileInputEvents();
  bindSizeDialog();
  document.getElementById('cancel-conversion').addEventListener('click', cancelConversion);
  bindComparisonDialog();
  // OSの動きを減らす設定を共有し、各モジュール内で変更にも追従します。
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  bindFileDepth(reducedMotion);
  bindSmoothScroll(reducedMotion);
  // 操作例・FAQ・ガイドの装飾は、変換用のappStateから独立しています。
  bindWorkflowGuide(reducedMotion);
  bindFaq(reducedMotion);
  bindEnlargementGuide(reducedMotion);
  bindGuideDepth(reducedMotion);
  // 入口が違っても同じ変換処理へ渡し、処理中の二重実行はコントローラー側でも防ぎます。
  for (const button of conversionButtons) button.addEventListener('click', convertPendingImages);
  for (const button of zipButtons) button.addEventListener('click', downloadCompletedImagesAsZip);
  pageElements.clearButton.addEventListener('click', clearAllImages);

  // 画質・サイズ・背景のどれを変更しても、共通の再設定処理を呼びます。
  for (const settingElement of conversionSettingElements) {
    settingElement.addEventListener('input', handleSettingsChange);
  }
  renderQualityDescription();
  renderPage(appState);
}

initializeApplication();
