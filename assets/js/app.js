(() => {
  const layout = document.querySelector('.admin-layout');
  const sidebar = document.querySelector('.admin-sidebar');
  const sidebarToggle = document.querySelector('[data-toggle="sidebar"]');
  const overlay = document.querySelector('[data-overlay]');
  const userMenuButton = document.querySelector('[data-toggle="user-menu"]');
  const userMenu = document.querySelector('[data-menu="user"]');
  const toast = document.querySelector('[data-toast]');
  const accordionButtons = document.querySelectorAll('[data-accordion]');
  const modalOverlays = document.querySelectorAll('[data-modal-overlay]');
  let activeModal = null;
  let modalCloseTimer = null;
  let toastTimer = null;
  let overlayTimer = null;

  const showToast = (message) => {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-show');
    }, 2400);
  };

  const openSidebar = () => {
    clearTimeout(overlayTimer);
    if (overlay) overlay.hidden = false;
    layout?.classList.add('is-nav-open');
    sidebar?.classList.add('is-open');
    overlay?.classList.add('is-open');
    sidebarToggle?.setAttribute('aria-expanded', 'true');
  };

  const closeSidebar = () => {
    layout?.classList.remove('is-nav-open');
    sidebar?.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => {
      if (overlay && !overlay.classList.contains('is-open')) {
        overlay.hidden = true;
      }
    }, 260);
    sidebarToggle?.setAttribute('aria-expanded', 'false');
  };

  const openModal = (modalOverlay) => {
    if (!modalOverlay) return;
    activeModal = modalOverlay;
    clearTimeout(modalCloseTimer);
    modalOverlay.hidden = false;
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      modalOverlay.classList.add('is-open');
    });
  };

  const closeModal = (modalOverlay) => {
    const target = modalOverlay || activeModal;
    if (!target) return;
    target.classList.remove('is-open');
    clearTimeout(modalCloseTimer);
    modalCloseTimer = setTimeout(() => {
      target.hidden = true;
      target.setAttribute('aria-hidden', 'true');
      if (activeModal === target) activeModal = null;
      document.body.style.overflow = '';
    }, 240);
  };

  const toggleSidebar = () => {
    if (layout?.classList.contains('is-nav-open')) {
      closeSidebar();
      return;
    }

    openSidebar();
  };

  const getMainScrollContainer = () => document.querySelector('.admin-main');

  const smoothScrollBehavior = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const scrollMainToTop = () => {
    getMainScrollContainer()?.scrollTo({ top: 0, behavior: smoothScrollBehavior() });
  };

  const scrollToHashTarget = (target) => {
    if (!target) return;
    target.scrollIntoView({ behavior: smoothScrollBehavior(), block: 'start' });
  };

  const closeUserMenu = () => {
    userMenu?.classList.remove('is-open');
    userMenuButton?.setAttribute('aria-expanded', 'false');
  };

  const toggleUserMenu = () => {
    const isOpen = userMenu?.classList.toggle('is-open');
    userMenuButton?.setAttribute('aria-expanded', String(Boolean(isOpen)));
  };

  sidebarToggle?.addEventListener('click', toggleSidebar);
  overlay?.addEventListener('click', closeSidebar);

  userMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleUserMenu();
  });

  accordionButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const item = button.closest('.has-submenu');
      const isOpen = item?.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(Boolean(isOpen)));
    });
  });

  const initSearchPanels = () => {
    document.querySelectorAll('form[data-search-panel]').forEach((form) => {
      const toggle = form.querySelector('[data-search-panel-toggle]');
      const body = form.querySelector('[data-search-panel-body]');
      const summary = form.querySelector('[data-search-panel-summary]');
      const advCountEl = form.querySelector('[data-search-panel-adv-count]');
      const toggleLabel = toggle?.querySelector('[data-search-panel-toggle-label]');

      const getFields = (root) =>
        Array.from(root.querySelectorAll('[data-filter-field]')).map((field) => ({
          control: field.querySelector('input, select, textarea'),
          label: field.dataset.filterLabel || '',
        }));

      const getControlValue = (control) => {
        if (!control) return '';
        return String(control.value || '').trim();
      };

      const getDisplayValue = (control) => {
        if (!control) return '';
        if (control.tagName === 'SELECT') {
          const option = control.selectedOptions[0];
          if (option?.value) return option.textContent.trim();
          return '';
        }
        return getControlValue(control);
      };

      const clearControl = (control) => {
        if (!control) return;
        if (control.tagName === 'SELECT') control.selectedIndex = 0;
        else control.value = '';
      };

      const countAdvancedActive = () => {
        if (!body) return 0;
        return getFields(body).filter(({ control }) => getControlValue(control)).length;
      };

      const updateAdvCount = () => {
        if (!advCountEl) return;
        const count = countAdvancedActive();
        advCountEl.textContent = String(count);
        advCountEl.hidden = count === 0;
      };

      const renderSummary = () => {
        if (!summary) return;
        summary.replaceChildren();

        const active = getFields(form).filter(({ control }) => getControlValue(control));
        if (!active.length) return;

        const heading = document.createElement('span');
        heading.className = 'ui-search-panel__summary-label';
        heading.textContent = '適用中';
        summary.append(heading);

        active.forEach(({ control, label }) => {
          const chip = document.createElement('span');
          chip.className = 'ui-filter-chip';

          const text = document.createElement('span');
          text.className = 'ui-filter-chip__text';
          text.textContent = `${label}: ${getDisplayValue(control)}`;
          chip.append(text);

          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'ui-filter-chip__remove';
          remove.setAttribute('aria-label', `${label}の条件を解除`);
          remove.innerHTML =
            '<span class="material-symbols-rounded" aria-hidden="true">close</span>';
          remove.addEventListener('click', () => {
            clearControl(control);
            control.dispatchEvent(new Event('input', { bubbles: true }));
          });

          chip.append(remove);
          summary.append(chip);
        });
      };

      const syncPanel = () => {
        renderSummary();
        updateAdvCount();
      };

      const setExpanded = (expanded) => {
        form.classList.toggle('is-expanded', expanded);
        toggle?.setAttribute('aria-expanded', String(expanded));
        body?.setAttribute('aria-hidden', String(!expanded));
        if (toggleLabel) {
          toggleLabel.textContent = expanded ? '詳細条件を隠す' : '詳細条件を表示';
        }
      };

      setExpanded(form.dataset.searchPanelDefault === 'expanded');
      syncPanel();

      toggle?.addEventListener('click', () => {
        setExpanded(!form.classList.contains('is-expanded'));
      });

      form.addEventListener('input', syncPanel);
      form.addEventListener('change', syncPanel);

      form.addEventListener('reset', () => {
        requestAnimationFrame(() => {
          syncPanel();
          setExpanded(false);
        });
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        setExpanded(false);
        showToast('検索を実行しました（デモ）');
      });
    });
  };

  initSearchPanels();

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.admin-user-menu')) {
      closeUserMenu();
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const hash = decodeURIComponent(href.slice(1));
    if (!hash) return;

    const contentNav = link.closest('.content-nav');
    if (contentNav) {
      contentNav.querySelectorAll('a').forEach((item) => item.classList.remove('is-active'));
      link.classList.add('is-active');
    }

    if (hash === 'top') {
      event.preventDefault();
      scrollMainToTop();
      return;
    }

    const target = document.getElementById(hash);
    if (!target) return;

    const main = getMainScrollContainer();
    if (!main) return;

    if (main.contains(target)) {
      event.preventDefault();
      scrollToHashTarget(target);
      return;
    }

    if (target.classList.contains('admin-layout')) {
      event.preventDefault();
      scrollMainToTop();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSidebar();
      closeModal();
      closeUserMenu();
    }
  });

  document.querySelectorAll('[data-message]').forEach((button) => {
    button.addEventListener('click', () => {
      showToast(button.dataset.message || '\u30c0\u30df\u30fc\u64cd\u4f5c\u3067\u3059');
    });
  });

  document.querySelectorAll('[data-modal-target]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const selector = trigger.getAttribute('data-modal-target');
      if (!selector) return;
      const modalOverlay = document.querySelector(selector);
      openModal(modalOverlay);
    });
  });

  modalOverlays.forEach((modalOverlay) => {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        closeModal(modalOverlay);
      }
    });

    modalOverlay.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => closeModal(modalOverlay));
    });
  });

  // Event delegation fallback (more robust across pages)
  document.addEventListener('click', (event) => {
    const openTrigger = event.target.closest('[data-modal-target]');
    if (openTrigger) {
      const selector = openTrigger.getAttribute('data-modal-target');
      if (selector) {
        openModal(document.querySelector(selector));
      }
      return;
    }

    const closeTrigger = event.target.closest('[data-modal-close]');
    if (closeTrigger) {
      closeModal(closeTrigger.closest('[data-modal-overlay]'));
      return;
    }

    const overlayClick = event.target.closest('[data-modal-overlay]');
    if (overlayClick && event.target === overlayClick) {
      closeModal(overlayClick);
    }
  });

  document.querySelector('#scope-select')?.addEventListener('change', (event) => {
    showToast(`\u30b9\u30b3\u30fc\u30d7\u3092\u300c${event.target.value}\u300d\u306b\u5909\u66f4\u3057\u307e\u3057\u305f`);
  });

  document.querySelector('[data-action="notify"]')?.addEventListener('click', () => {
    showToast('\u65b0\u3057\u3044\u901a\u77e5\u306f\u3042\u308a\u307e\u305b\u3093');
  });

  document.querySelector('[data-action="help"]')?.addEventListener('click', () => {
    showToast('\u30d8\u30eb\u30d7\u3092\u958b\u304d\u307e\u3059');
  });

  const syncSegmentToggleGroup = (group) => {
    if (!group) return;
    group.querySelectorAll('.ui-segment-toggle__option').forEach((option) => {
      const input = option.querySelector('input[type="radio"]');
      option.classList.toggle('is-selected', Boolean(input?.checked));
    });
  };

  const initSegmentToggles = () => {
    const groups = document.querySelectorAll('.ui-segment-toggle');
    let lastTap = { option: null, time: 0 };
    let touchStart = null;

    groups.forEach((group) => {
      if (!group.querySelector('input[type="radio"]')) return;
      syncSegmentToggleGroup(group);
      group.addEventListener('change', () => syncSegmentToggleGroup(group));
    });

    const activateSegmentOption = (option) => {
      const input = option.querySelector('input[type="radio"]');
      if (!input) return;

      const now = Date.now();
      if (lastTap.option === option && now - lastTap.time < 400) return;
      lastTap = { option, time: now };

      const wasChecked = input.checked;
      input.checked = true;
      syncSegmentToggleGroup(option.closest('.ui-segment-toggle'));

      if (!wasChecked) {
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    document.addEventListener('touchstart', (event) => {
      const option = event.target.closest('.ui-segment-toggle__option');
      if (!option?.querySelector('input[type="radio"]')) {
        touchStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      touchStart = { option, x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (!touchStart) return;

      const touch = event.changedTouches[0];
      const moved = Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y) > 10;
      const option = touchStart.option;
      touchStart = null;

      if (moved) return;
      activateSegmentOption(option);
    }, { passive: true });

    document.addEventListener('click', (event) => {
      const option = event.target.closest('.ui-segment-toggle__option');
      if (!option?.querySelector('input[type="radio"]')) return;
      activateSegmentOption(option);
    });
  };

  initSegmentToggles();

  window.MotherMapShell = { openModal, closeModal, showToast };
})();
