(() => {
  const PLACE_OPTIONS = [
    { value: '0', label: '自由入力' },
    { value: '1', label: 'インターホン' },
    { value: '2', label: '制御装置' },
    { value: '3', label: '集合玄関機' },
    { value: '4', label: 'ロビーインターホン' },
    { value: '5', label: '管理室親機' },
    { value: '6', label: '住戸アダプター' },
    { value: '7', label: '統合盤' },
    { value: '8', label: '住宅情報盤' },
    { value: '9', label: '室内親機' },
    { value: '10', label: '玄関子機' },
    { value: '11', label: 'ドアホン子器' },
  ];

  const rowTemplate = document.getElementById('photography-row-template');
  if (!rowTemplate) return;

  const populateSelectOptions = (select) => {
    select.replaceChildren();
    PLACE_OPTIONS.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
  };

  const initPanel = (card) => {
    const useInputs = card.querySelectorAll('[data-photography-use-input]');
    const fields = card.querySelector('[data-photography-fields]');
    const listWrap = card.querySelector('[data-photography-list-wrap]');
    const listBody = card.querySelector('[data-photography-list]');
    const select = card.querySelector('[data-photography-select]');
    const addButton = card.querySelector('[data-photography-add]');

    if (!useInputs.length || !fields || !listWrap || !listBody || !select || !addButton) return;

    populateSelectOptions(select);

    let rowIndex = 0;

    const syncVisibility = () => {
      const usePhotography = card.querySelector('[data-photography-use-input]:checked')?.value === 'true';
      fields.hidden = !usePhotography;

      if (!usePhotography) {
        listBody.replaceChildren();
        listWrap.hidden = true;
        rowIndex = 0;
        return;
      }

      listWrap.hidden = listBody.children.length === 0;
    };

    const addRow = () => {
      const fragment = rowTemplate.content.cloneNode(true);
      const row = fragment.querySelector('tr');
      const selectedOption = select.options[select.selectedIndex];
      const nameInput = row.querySelector('[data-photography-name]');
      const timingInputs = row.querySelectorAll('[data-photography-timing]');
      const removeButton = row.querySelector('[data-photography-remove]');

      rowIndex += 1;
      const prefix = card.dataset.photographyPrefix || 'photography';

      if (nameInput) {
        nameInput.name = `${prefix}_name_${rowIndex}`;
        if (select.value !== '0' && selectedOption) {
          nameInput.value = selectedOption.textContent.trim();
        }
      }

      timingInputs.forEach((input, index) => {
        input.name = `${prefix}_timing_${rowIndex}_${index}`;
        input.checked = true;
      });

      const remarksInput = row.querySelector('[data-photography-remarks]');
      if (remarksInput) {
        remarksInput.name = `${prefix}_remarks_${rowIndex}`;
      }

      removeButton?.addEventListener('click', () => {
        row.remove();
        listWrap.hidden = listBody.children.length === 0;
      });

      listBody.appendChild(fragment);
      listWrap.hidden = false;
    };

    useInputs.forEach((input) => {
      input.addEventListener('change', syncVisibility);
    });

    addButton.addEventListener('click', addRow);

    syncVisibility();
  };

  document.querySelectorAll('.ui-form-card').forEach((card) => {
    if (card.querySelector('[data-photography-use]')) {
      initPanel(card);
    }
  });
})();
