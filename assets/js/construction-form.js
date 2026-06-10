(() => {
  const STEPS = [
    {
      step: 1,
      path: 'constructions-overall_schedule.html',
      prevPath: 'property-detail.html',
      prevLabel: '物件詳細へ戻る',
      nextPath: 'constructions-representative.html',
      nextLabel: '保存して次へ',
    },
    {
      step: 2,
      path: 'constructions-representative.html',
      prevPath: 'constructions-overall_schedule.html',
      prevLabel: '工事情報',
      nextPath: 'construction_info.html',
      nextLabel: '保存して次へ',
    },
    {
      step: 3,
      path: 'construction_info.html',
      prevPath: 'constructions-representative.html',
      prevLabel: '担当者情報',
      nextPath: 'photography_places.html',
      nextLabel: '保存して次へ',
    },
    {
      step: 4,
      path: 'photography_places.html',
      prevPath: 'construction_info.html',
      prevLabel: '工事詳細',
      nextPath: 'options.html',
      nextLabel: '保存して次へ',
    },
    {
      step: 5,
      path: 'options.html',
      prevPath: 'photography_places.html',
      prevLabel: '撮影場所',
      nextPath: 'property-detail.html',
      nextLabel: '登録を完了',
      isLast: true,
    },
  ];

  let isDirty = false;

  const getCurrentStep = () => {
    const page = window.location.pathname.split('/').pop() || '';
    return STEPS.find((item) => item.path === page) || STEPS[0];
  };

  const showToast = (message) => {
    window.MotherMapShell?.showToast(message);
  };

  const markDirty = () => {
    isDirty = true;
  };

  const clearDirty = () => {
    isDirty = false;
  };

  const markStepperComplete = (currentStep) => {
    document.querySelectorAll('.ui-stepper .step').forEach((stepEl) => {
      stepEl.classList.remove('is-complete');
      const href = stepEl.getAttribute('href') || '';
      const file = href.split('?')[0];
      const stepInfo = STEPS.find((item) => item.path === file);
      if (stepInfo && stepInfo.step < currentStep.step) {
        stepEl.classList.add('is-complete');
      }
    });
  };

  const markActiveStepper = (currentStep) => {
    document.querySelectorAll('.ui-stepper .step').forEach((stepEl) => {
      stepEl.classList.remove('is-active');
      stepEl.removeAttribute('aria-current');
      const href = stepEl.getAttribute('href') || '';
      if (href.split('?')[0] === currentStep.path) {
        stepEl.classList.add('is-active');
        stepEl.setAttribute('aria-current', 'step');
      }
    });
  };

  const updateStepMeta = (currentStep) => {
    const stepMeta = document.querySelector('[data-context-step]');
    if (stepMeta) {
      stepMeta.textContent = `${currentStep.step} / ${STEPS.length}`;
    }
  };

  const updateFooterNav = (currentStep) => {
    const prevLink = document.querySelector('[data-construction-prev]');
    if (prevLink && currentStep.prevPath) {
      prevLink.href = currentStep.prevPath;
    }

    const prevLabel = document.querySelector('[data-construction-prev-label]');
    if (prevLabel) prevLabel.textContent = currentStep.prevLabel;

    const nextLabel = document.querySelector('[data-construction-next-label]');
    if (nextLabel) nextLabel.textContent = currentStep.nextLabel;

    const nextBtn = document.querySelector('[data-construction-next]');
    if (nextBtn) {
      const icon = nextBtn.querySelector('.material-symbols-rounded');
      if (icon) {
        icon.textContent = currentStep.isLast ? 'check' : 'arrow_forward';
      }
    }
  };

  const bindSkipButton = (currentStep) => {
    const skipBtn = document.querySelector('.construction-form-stepper-skip');
    if (!skipBtn) return;

    skipBtn.addEventListener('click', () => {
      if (isDirty && !window.confirm('未保存の変更があります。登録せず次へ進みますか？')) {
        return;
      }
      clearDirty();
      window.location.href = currentStep.nextPath;
    });
  };

  const bindNextButton = (currentStep) => {
    const nextBtn = document.querySelector('[data-construction-next]');
    if (!nextBtn) return;

    nextBtn.addEventListener('click', () => {
      clearDirty();

      if (currentStep.isLast) {
        sessionStorage.removeItem('construction-form:construction-name');
        showToast('工事を登録しました');
        setTimeout(() => {
          window.location.href = currentStep.nextPath;
        }, 400);
        return;
      }

      showToast('保存しました');
      setTimeout(() => {
        window.location.href = currentStep.nextPath;
      }, 300);
    });
  };

  const bindDirtyTracking = () => {
    const form = document.querySelector('.ui-form');
    if (!form) return;

    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
  };

  const bindLeaveWarning = () => {
    window.addEventListener('beforeunload', (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    });

    document.querySelectorAll('[data-construction-back], [data-construction-prev]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!isDirty) return;
        if (!window.confirm('未保存の変更があります。このページを離れますか？')) {
          event.preventDefault();
        } else {
          clearDirty();
        }
      });
    });
  };

  const bindDraftSaveButton = () => {
    document.querySelectorAll('.construction-form-head [data-message="一時保存しました"]').forEach((button) => {
      button.addEventListener('click', clearDirty);
    });
  };

  const bindConstructionNameSync = () => {
    const STORAGE_KEY = 'construction-form:construction-name';
    const nameInput = document.querySelector('[name="construction_name"]');
    const metaName = document.querySelector('[data-context-construction-name]');
    if (!metaName) return;

    const formatMetaName = (value) => value || '（未定）';

    const syncToMeta = (value) => {
      metaName.textContent = formatMetaName(value);
    };

    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (nameInput) {
      if (stored !== null) {
        nameInput.value = stored;
        syncToMeta(stored);
      } else {
        const metaValue = metaName.textContent.trim();
        if (!nameInput.value.trim() && metaValue && metaValue !== '（未定）') {
          nameInput.value = metaValue;
        }
        syncToMeta(nameInput.value.trim());
      }

      nameInput.addEventListener('input', () => {
        const value = nameInput.value.trim();
        syncToMeta(value);
        sessionStorage.setItem(STORAGE_KEY, value);
      });
    } else if (stored !== null) {
      syncToMeta(stored);
    }
  };

  const init = () => {
    const root = document.querySelector('[data-construction-form]');
    if (!root) return;

    const currentStep = getCurrentStep();

    markStepperComplete(currentStep);
    markActiveStepper(currentStep);
    updateStepMeta(currentStep);
    updateFooterNav(currentStep);
    bindSkipButton(currentStep);
    bindNextButton(currentStep);
    bindDirtyTracking();
    bindLeaveWarning();
    bindDraftSaveButton();
    bindConstructionNameSync();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
