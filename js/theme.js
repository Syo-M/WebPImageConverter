/**
 * 配色だけを初回描画前に決める独立した入口です。
 * headから通常のscriptとして読み、白い画面が一瞬出ることを防ぎます。
 * 即時実行関数で囲み、変換用の変数やグローバル変数と混ざらないようにします。
 */
(() => {
  const storageKey = 'webp-color-theme'; // 保存するのはlight / darkのみ。画像データは保存しません。
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let selectedTheme = null; // nullの間は端末の設定に追従します。
  try {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') selectedTheme = savedTheme;
  } catch { /* 保存が禁止された環境でも、その場で配色を切り替えられます。 */ }

  function applyTheme() {
    const theme = selectedTheme || (systemTheme.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    const browserThemeColor = document.querySelector('meta[name="theme-color"]');
    if (browserThemeColor) browserThemeColor.content = theme === 'dark' ? '#14151d' : '#f5f5fa';
    const nextAction = theme === 'dark' ? 'ライトモードに切り替える' : 'ダークモードに切り替える';
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', nextAction);
      button.title = nextAction;
    });
  }
  applyTheme();

  /** DOM完成後にボタンを接続します。通常のscriptなのでmoduleの入口とは独立しています。 */
  function bindThemeButtons() {
    applyTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.hidden = false;
      button.addEventListener('click', () => {
        selectedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(storageKey, selectedTheme); } catch { /* 保存に失敗しても表示は更新します。 */ }
        applyTheme();
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindThemeButtons, { once: true });
  else bindThemeButtons();
  systemTheme.addEventListener('change', () => {
    if (selectedTheme === null) applyTheme();
  });
  // 別タブで切り替えた場合や保存設定を消した場合も、各ページの配色をそろえます。
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    selectedTheme = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    applyTheme();
  });
})();
