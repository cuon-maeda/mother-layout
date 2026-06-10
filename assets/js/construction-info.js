(() => {
  const typeRow = document.querySelector('[data-signboard-type-row]');
  const useInputs = document.querySelectorAll('[data-signboard-use-input]');

  if (!typeRow || !useInputs.length) return;

  const typeRadios = typeRow.querySelectorAll('input[type="radio"]');

  const syncTypeRowVisibility = () => {
    const useSignboard = document.querySelector('[data-signboard-use-input]:checked')?.value === 'true';
    typeRow.hidden = !useSignboard;

    if (!useSignboard) {
      typeRadios.forEach((radio) => {
        radio.checked = false;
      });
    }
  };

  const useGroup = document.querySelector('[data-signboard-use]');
  useGroup?.addEventListener('change', syncTypeRowVisibility);
  useGroup?.addEventListener('input', syncTypeRowVisibility);

  syncTypeRowVisibility();
})();
