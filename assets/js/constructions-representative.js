(() => {
  const staffList = document.querySelector('[data-supplier-staff-list]');
  const addBtn = document.querySelector('[data-supplier-staff-add]');
  const rowTemplate = document.querySelector('#supplier-staff-row-template');

  if (!staffList || !addBtn || !rowTemplate) return;

  let staffCount = staffList.querySelectorAll('.staff-field-row').length;

  const showMessage = (message) => {
    window.MotherMapShell?.showToast(message);
  };

  const updateLabels = () => {
    staffList.querySelectorAll('.staff-field-row').forEach((row, index) => {
      const label = row.querySelector('.label');
      if (label) label.textContent = `担当者-${index + 1}`;
    });
  };

  const addStaffRow = () => {
    staffCount += 1;
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    const input = row.querySelector('input');
    if (input) {
      input.name = `supplier_staff_${staffCount}`;
      input.setAttribute('aria-label', `担当者-${staffCount}`);
    }
    staffList.appendChild(row);
    updateLabels();
    row.querySelector('input')?.focus();
  };

  addBtn.addEventListener('click', addStaffRow);

  staffList.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-supplier-staff-remove]');
    if (!removeBtn) return;

    const row = removeBtn.closest('.staff-field-row');
    if (!row || staffList.children.length <= 1) return;

    row.remove();
    staffCount = staffList.querySelectorAll('.staff-field-row').length;
    updateLabels();
    showMessage('担当者を削除しました');
  });

  document.querySelectorAll('[data-supplier-register]').forEach((registerBtn) => {
    registerBtn.addEventListener('click', () => {
      showMessage('受注先を登録しました');
      window.MotherMapShell?.closeModal(registerBtn.closest('[data-modal-overlay]'));
    });
  });
})();
