(() => {
  const PROPERTIES = {
    'B-10482': {
      mgmtNo: 'cuon_202412_0001',
      name: '202412リリースの確認物件',
      nameKana: 'かくにんぶっけん',
      address: '東京都中央区日本橋',
      mgmtCompany: '前田会社',
      mgmtContact: '前田',
      mgmtPhone: '00000000000',
    },
  };

  const DEFAULT_PROPERTY_ID = 'B-10482';

  const form = document.querySelector('[data-property-add-construction-form]');
  const registerBtn = document.querySelector('[data-property-construction-register]');
  const constructionListBody = document.querySelector('[data-property-construction-list-body]');
  const modal = document.getElementById('property-add-construction-modal');
  const addConstructionBtn = document.querySelector('[data-modal-target="#property-add-construction-modal"]');
  const modalTitle = document.getElementById('property-add-construction-modal-title');

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('property') || params.get('property_id') || DEFAULT_PROPERTY_ID;
  const property = PROPERTIES[propertyId] || PROPERTIES[DEFAULT_PROPERTY_ID];

  let editingRow = null;

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  };

  setText('[data-property-mgmt-no]', property.mgmtNo);
  setText('[data-property-name]', property.name);
  setText('[data-property-name-kana]', property.nameKana);
  setText('[data-property-address]', property.address);
  setText('[data-property-mgmt-company]', property.mgmtCompany);
  setText('[data-property-mgmt-contact]', property.mgmtContact);
  setText('[data-property-mgmt-phone]', property.mgmtPhone);
  setText('[data-property-breadcrumb]', property.name);

  const hint = document.querySelector('[data-property-modal-hint]');
  const addHintText = `「${property.name}」に工事を追加します。「登録」で一覧に追加、「工事情報登録へ進む」で詳細登録画面に移動します。`;

  const setAddModalHint = () => {
    if (hint) hint.textContent = addHintText;
  };

  setAddModalHint();

  const readFormValues = () => ({
    constructionName: form.querySelector('[name="construction_name"]')?.value?.trim() || '',
    plannedStart: form.querySelector('[name="planned_start"]')?.value || '',
    plannedEnd: form.querySelector('[name="planned_end"]')?.value || '',
  });

  const validateForm = () => {
    const { constructionName, plannedStart, plannedEnd } = readFormValues();

    if ((plannedStart && !plannedEnd) || (!plannedStart && plannedEnd)) {
      window.MotherMapShell?.showToast('予定工期は開始日と終了日を両方入力してください');
      return null;
    }

    if (plannedStart && plannedEnd && plannedStart > plannedEnd) {
      window.MotherMapShell?.showToast('予定工期の終了日は開始日以降にしてください');
      return null;
    }

    return { constructionName, plannedStart, plannedEnd };
  };

  const formatStartDate = (start) => {
    if (!start) return '—';
    return `(予定) ${start}`;
  };

  const populateForm = ({ constructionName, plannedStart, plannedEnd }) => {
    form.querySelector('[name="construction_name"]').value = constructionName || '';
    form.querySelector('[name="planned_start"]').value = plannedStart || '';
    form.querySelector('[name="planned_end"]').value = plannedEnd || '';
  };

  const readRowData = (row) => ({
    constructionName: row.dataset.constructionName || row.cells[0]?.textContent?.trim() || '',
    plannedStart: row.dataset.plannedStart || '',
    plannedEnd: row.dataset.plannedEnd || '',
  });

  const setRowData = (row, { constructionName, plannedStart, plannedEnd }) => {
    row.dataset.constructionName = constructionName;
    if (plannedStart) {
      row.dataset.plannedStart = plannedStart;
    } else {
      delete row.dataset.plannedStart;
    }
    if (plannedEnd) {
      row.dataset.plannedEnd = plannedEnd;
    } else {
      delete row.dataset.plannedEnd;
    }
  };

  const updateRowDisplay = (row, { constructionName, plannedStart }) => {
    const cells = row.cells;
    if (!cells.length) return;
    cells[0].textContent = constructionName || '（未定）';
    cells[1].textContent = plannedStart ? formatStartDate(plannedStart) : '—';
    const label = constructionName || '（名称未定）';
    row.setAttribute('aria-label', `${label}の工事情報を表示`);
  };

  const buildConstructionRow = ({ constructionName, plannedStart, plannedEnd }, options = {}) => {
    const row = document.createElement('tr');
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    setRowData(row, { constructionName, plannedStart, plannedEnd });

    const extraCells = options.extraCells || ['予定工事', '—', '—', '—'];
    [
      constructionName || '（未定）',
      plannedStart ? formatStartDate(plannedStart) : '—',
      ...extraCells,
    ].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    const label = constructionName || '（名称未定）';
    row.setAttribute('aria-label', `${label}の工事情報を表示`);

    return row;
  };

  const appendConstruction = (values) => {
    if (!constructionListBody) return;
    constructionListBody.appendChild(buildConstructionRow(values));
  };

  const resetForm = () => {
    form.reset();
    editingRow = null;
    if (modalTitle) modalTitle.textContent = '工事追加';
    setAddModalHint();
  };

  const openConstructionModal = (row = null) => {
    editingRow = row;

    if (row) {
      const data = readRowData(row);
      populateForm({
        constructionName: data.constructionName === '（未定）' ? '' : data.constructionName,
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd,
      });
      if (modalTitle) modalTitle.textContent = '工事情報';
      if (hint) {
        const label = data.constructionName && data.constructionName !== '（未定）'
          ? data.constructionName
          : '（名称未定）';
        hint.textContent = `「${label}」の工事情報です。内容を変更して「登録」で一覧を更新できます。`;
      }
    } else {
      form.reset();
      if (modalTitle) modalTitle.textContent = '工事追加';
      setAddModalHint();
    }

    window.MotherMapShell?.openModal(modal);
  };

  addConstructionBtn?.addEventListener('click', () => {
    editingRow = null;
    form.reset();
    if (modalTitle) modalTitle.textContent = '工事追加';
    setAddModalHint();
  });

  constructionListBody?.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (!row || row.parentElement !== constructionListBody) return;
    openConstructionModal(row);
  });

  constructionListBody?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('tr');
    if (!row || row.parentElement !== constructionListBody) return;
    event.preventDefault();
    openConstructionModal(row);
  });

  registerBtn?.addEventListener('click', () => {
    const values = validateForm();
    if (!values) return;

    const isUpdate = Boolean(editingRow);

    if (editingRow) {
      setRowData(editingRow, values);
      updateRowDisplay(editingRow, values);
    } else {
      appendConstruction(values);
    }

    resetForm();
    window.MotherMapShell?.closeModal(modal);
    window.MotherMapShell?.showToast(isUpdate ? '工事情報を更新しました' : '工事を登録しました');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    window.MotherMapShell?.closeModal(modal);
    const constructionName = form.querySelector('[name="construction_name"]')?.value?.trim() || '';
    sessionStorage.setItem('construction-form:construction-name', constructionName);
    window.location.href = 'constructions-overall_schedule.html';
  });
})();
