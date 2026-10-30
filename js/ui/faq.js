/** 質問の絞り込みと開閉を担当します。JSなしでもdetailsは開閉できます。 */
export function bindFaq(reducedMotion) {
  const filters = document.getElementById('faq-filters');
  const count = document.getElementById('faq-count');
  const questions = [...document.querySelectorAll('.faq-items details')];
  const filterButtons = [...filters.querySelectorAll('button')];
  const activeAnimations = new Map(); // 質問ごとの再生中の動きと完了処理を対応付けます。
  filters.hidden = false;

  // 選択カテゴリーと一致する質問だけを残し、表示件数も更新します。
  function selectCategory(button, animate = true) {
      const category = button.dataset.faqFilter;
      filters.querySelectorAll('button').forEach((filter) => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      let visibleCount = 0;
      for (const question of questions) {
        question.hidden = question.dataset.category !== category;
        if (question.hidden) continue;
        visibleCount += 1;
        if (animate && !reducedMotion.matches) question.animate(
          [{ opacity: 0.45, translate: '0 5px' }, { opacity: 1, translate: '0 0' }],
          { duration: 200, easing: 'ease-out' },
        );
      }
      count.textContent = `${visibleCount}件の質問`;
  }
  for (const button of filterButtons) button.addEventListener('click', () => selectCategory(button));
  // 初期表示もカテゴリー内だけに絞り、長い「全件表示」を作りません。
  selectCategory(filterButtons.find((button) => button.getAttribute('aria-pressed') === 'true') || filterButtons[0], false);
  for (const question of questions) {
    const summary = question.querySelector('summary');
    const answer = question.querySelector('.faq-answer');
    let desiredOpen = question.open; // アニメーション中も、次に目指す状態を記録します。
    summary.addEventListener('click', (event) => {
      event.preventDefault(); // マウス・Enter・Spaceのどの操作も同じ開閉へつなぎます。
      desiredOpen = !desiredOpen;
      const currentHeight = question.open ? answer.getBoundingClientRect().height : 0;
      activeAnimations.get(question)?.animation.cancel();
      if (reducedMotion.matches) {
        question.open = desiredOpen;
        activeAnimations.delete(question);
        return;
      }
      question.open = true; // 回答を測れる状態にしてから高さをアニメーションします。
      const targetHeight = desiredOpen ? answer.scrollHeight : 0;
      const animation = answer.animate(
        [{ height: `${currentHeight}px`, opacity: desiredOpen ? 0.4 : 1 },
          { height: `${targetHeight}px`, opacity: desiredOpen ? 1 : 0 }],
        { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      const finish = () => { question.open = desiredOpen; };
      activeAnimations.set(question, { animation, finish });
      animation.finished.then(() => {
        // 連打で別のアニメーションが始まっていたら、古い完了処理は反映しません。
        if (activeAnimations.get(question)?.animation !== animation) return;
        finish();
        activeAnimations.delete(question);
      }).catch(() => {}); // cancelで発生するPromiseの中断は正常な操作です。
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    for (const { animation, finish } of activeAnimations.values()) {
      animation.cancel();
      finish();
    }
    activeAnimations.clear();
  });
}
