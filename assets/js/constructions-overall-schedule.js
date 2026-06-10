(() => {
  const CONTRACTORS = {
    1: { name: 'テスト施工行者', staff: ['担当A', '担当B'] },
    2: { name: '施工業者4', staff: ['テスト椎名', 'まえだ'] },
    3: { name: 'テスト', staff: ['山田', '佐藤'] },
  };

  const selectEl = document.querySelector('[data-contractor-select]');
  const addBtn = document.querySelector('[data-contractor-add]');
  const listBody = document.querySelector('[data-contractor-list]');
  const listWrap = document.querySelector('[data-contractor-list-wrap]');
  const rowTemplate = document.querySelector('#contractor-row-template');

  if (!selectEl || !addBtn || !listBody || !rowTemplate) return;

  const addedIds = new Set();

  const showMessage = (message) => {
    window.MotherMapShell?.showToast(message);
  };

  const buildRow = (id, contractor) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.contractorId = String(id);

    const nameCell = row.querySelector('.name');
    if (nameCell) nameCell.textContent = contractor.name;

    const checkgroup = row.querySelector('.ui-checkgroup');
    if (checkgroup) {
      checkgroup.setAttribute('aria-label', `${contractor.name}の担当者`);
      contractor.staff.forEach((staffName, index) => {
        const label = document.createElement('label');
        label.className = 'ui-choice';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `contractor_staff_${id}[]`;
        input.value = staffName;
        input.id = `contractor-staff-${id}-${index}`;
        label.appendChild(input);
        label.append(`${staffName}`);
        checkgroup.appendChild(label);
      });
    }

    return row;
  };

  const syncListVisibility = () => {
    const visible = addedIds.size > 0;
    listBody.hidden = !visible;
    if (listWrap) listWrap.hidden = !visible;
  };

  const removeRow = (id) => {
    addedIds.delete(String(id));
    listBody.querySelector(`[data-contractor-id="${id}"]`)?.remove();
    syncListVisibility();
  };

  addBtn.addEventListener('click', () => {
    const id = selectEl.value;
    if (!id) {
      showMessage('施工業者を選択してください');
      return;
    }

    if (addedIds.has(id)) {
      showMessage('この施工業者は既に追加されています');
      return;
    }

    const contractor = CONTRACTORS[id];
    if (!contractor) return;

    addedIds.add(id);
    listBody.appendChild(buildRow(id, contractor));
    syncListVisibility();
    showMessage(`「${contractor.name}」を追加しました`);
  });

  listBody.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-contractor-remove]');
    if (!removeBtn) return;

    const row = removeBtn.closest('[data-contractor-id]');
    if (!row) return;

    const id = row.dataset.contractorId;
    const name = CONTRACTORS[id]?.name || '施工業者';
    removeRow(id);
    showMessage(`「${name}」を削除しました`);
  });
})();
