(() => {
  const rowTemplate = document.getElementById('option-row-template');
  const select = document.querySelector('[data-option-select]');
  const addButton = document.querySelector('[data-option-add]');
  const listWrap = document.querySelector('[data-option-list-wrap]');
  const listBody = document.querySelector('[data-option-list]');

  if (!rowTemplate || !select || !addButton || !listWrap || !listBody) return;

  const TAX_RATE = 0.1;

  const optionCatalog = {
    1: { name: 'オプション1', amount: '' },
    2: { name: 'カメラ付き玄関子機', amount: 13637 },
    3: { name: 'タグキー', amount: '' },
  };

  let rowIndex = 0;

  const parseAmount = (value) => {
    const digits = String(value).replace(/[^\d]/g, '');
    return digits ? Number.parseInt(digits, 10) : 0;
  };

  const formatAmount = (value) => {
    if (!value) return '';
    return value.toLocaleString('ja-JP');
  };

  const calcTaxIncluded = (excluded) => {
    if (!excluded) return 0;
    return Math.round(excluded * (1 + TAX_RATE));
  };

  const formatTaxIncluded = (value) => {
    if (!value) return '';
    return `¥ ${formatAmount(value)}`;
  };

  const syncTaxIncluded = (row) => {
    const excludedInput = row.querySelector('[data-option-amount-excluded]');
    const includedDisplay = row.querySelector('[data-option-amount-included]');
    const includedInput = row.querySelector('[data-option-amount-included-input]');
    const excluded = parseAmount(excludedInput?.value);
    const included = calcTaxIncluded(excluded);

    if (includedDisplay) {
      includedDisplay.textContent = formatTaxIncluded(included);
    }

    if (includedInput) {
      includedInput.value = included || '';
    }
  };

  const addRow = () => {
    const selectedValue = select.value;
    const catalogItem = optionCatalog[selectedValue];
    if (!catalogItem) return;

    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector('tr');
    const nameText = row.querySelector('[data-option-name-text]');
    const nameInput = row.querySelector('[data-option-name]');
    const timingInputs = row.querySelectorAll('[data-option-timing]');
    const excludedInput = row.querySelector('[data-option-amount-excluded]');
    const removeButton = row.querySelector('[data-option-remove]');

    rowIndex += 1;

    if (nameText) {
      nameText.textContent = catalogItem.name;
    }

    if (nameInput) {
      nameInput.name = `option_name_${rowIndex}`;
      nameInput.value = catalogItem.name;
    }

    timingInputs.forEach((input, index) => {
      input.name = `option_timing_${rowIndex}_${index}`;
      input.checked = true;
    });

    if (excludedInput) {
      excludedInput.name = `option_amount_excluded_${rowIndex}`;
      if (catalogItem.amount !== '') {
        excludedInput.value = formatAmount(catalogItem.amount);
      }
      excludedInput.addEventListener('input', () => {
        syncTaxIncluded(row);
      });
    }

    const includedInput = row.querySelector('[data-option-amount-included-input]');
    if (includedInput) {
      includedInput.name = `option_amount_included_${rowIndex}`;
    }

    syncTaxIncluded(row);

    removeButton?.addEventListener('click', () => {
      row.remove();
      listWrap.hidden = listBody.children.length === 0;
    });

    listBody.appendChild(fragment);
    listWrap.hidden = false;
  };

  addButton.addEventListener('click', addRow);
})();
