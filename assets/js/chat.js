(() => {
  const STATUS_CLASS_MAP = {
    未着手: 'is-status-pending',
    進行中: 'is-status-progress',
    完了: 'is-status-done',
  };

  const STATUS_KEYS = Object.keys(STATUS_CLASS_MAP);

  function getStatusClass(status) {
    return STATUS_CLASS_MAP[status] || 'is-status-pending';
  }

  function applyStatusToCard(card, status) {
    if (!card) return;
    const nextStatus = STATUS_KEYS.includes(status) ? status : '未着手';
    const nextClass = getStatusClass(nextStatus);

    card.classList.remove('is-status-pending', 'is-status-progress', 'is-status-done');
    card.classList.add(nextClass);

    const badge = card.querySelector('.document-status-badge');
    if (badge) {
      badge.textContent = nextStatus;
      badge.classList.remove('is-status-pending', 'is-status-progress', 'is-status-done');
      badge.classList.add(nextClass);
    }
  }

  function getModalTaskCards(modal) {
    return Array.from(modal.querySelectorAll('.document-box--item'));
  }

  function getSidebarTaskCards() {
    const blocks = Array.from(document.querySelectorAll('.section-block'));
    const taskBlock = blocks.find((block) => block.querySelector('.section-title')?.textContent?.trim() === 'タスク管理');
    if (!taskBlock) return [];
    return Array.from(taskBlock.querySelectorAll('.document-box--widget'));
  }

  function syncModalToSidebar(modal) {
    const sidebarCards = getSidebarTaskCards();
    if (!sidebarCards.length) return;

    const byLabel = new Map(
      sidebarCards
        .map((card) => [card.querySelector('.label')?.textContent?.trim(), card])
        .filter(([label]) => Boolean(label)),
    );

    getModalTaskCards(modal).forEach((modalCard) => {
      const label = modalCard.querySelector('.label')?.textContent?.trim();
      const select = modalCard.querySelector('select.ui-control');
      const status = select?.value?.trim();
      if (!label || !status) return;
      applyStatusToCard(byLabel.get(label), status);
    });
  }

  function wireModal(modalOverlay) {
    const modal = modalOverlay?.querySelector('.ui-modal');
    if (!modal) return;

    modal.addEventListener('change', (event) => {
      const select = event.target?.closest('select.ui-control');
      if (!select) return;
      const card = select.closest('.document-box--item');
      if (!card) return;
      applyStatusToCard(card, select.value?.trim());
    });

    const saveBtn = modal.querySelector('[data-chat-task-save]');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        syncModalToSidebar(modal);
        // Toast + close are handled by app.js (data-message / data-modal-close)
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.querySelector('#chat-task-status-modal[data-modal-overlay]');
    if (!overlay) return;
    wireModal(overlay);
  });
})();

