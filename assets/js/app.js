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

  window.MotherMapShell = { openModal, closeModal, showToast };
})();
