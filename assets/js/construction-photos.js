(() => {
  const root = document.querySelector('[data-construction-photos]');
  const { openModal, closeModal } = window.MotherMapShell || {};
  const { createMosaicEditor } = window.MotherMap?.mosaic || {};
  if (!root || !openModal || !closeModal || !createMosaicEditor) return;

  const TIMING_ORDER = ['before', 'during', 'after'];
  const TIMING_LABELS = {
    before: '施工前',
    during: '施工中',
    after: '施工後',
  };

  const ROOMS = ['601', '602', '603', '604', '605'];

  const areaToggle = root.querySelector('[data-cp-area-toggle]');
  const roomFilter = root.querySelector('[data-cp-room-filter]');
  const roomFilterWrap = root.querySelector('[data-cp-room-filter-wrap]');
  const listHost = root.querySelector('[data-cp-list]');
  const exportButton = root.querySelector('[data-cp-export]');

  const detailOverlay = document.querySelector('[data-cp-detail-overlay]');
  const mosaicOverlay = document.querySelector('[data-mm-mosaic-overlay]');
  const detailTitle = detailOverlay.querySelector('#cp-detail-title');
  const detailSubtitle = detailOverlay.querySelector('[data-cp-detail-subtitle]');
  const detailPreview = detailOverlay.querySelector('[data-cp-detail-preview]');
  const detailViewSwitch = detailOverlay.querySelector('[data-cp-detail-view-switch]');
  const detailDateInput = detailOverlay.querySelector('[data-cp-detail-date]');
  const detailCommentInput = detailOverlay.querySelector('[data-cp-detail-comment]');
  const detailMosaicButton = detailOverlay.querySelector('[data-cp-detail-mosaic]');

  let pendingPhotoId = null;
  let activeDetailPhotoId = null;

  detailOverlay.addEventListener('click', (event) => {
    if (event.target === detailOverlay || event.target.closest('[data-modal-close]')) {
      activeDetailPhotoId = null;
    }
  });

  function createPlaceholderImage(label, hue) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${hue}, 42%, 72%)`);
    gradient.addColorStop(1, `hsl(${hue + 24}, 38%, 58%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = 'bold 28px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  function makePhoto(id, label, shotDate) {
    const hue = (id.length * 37) % 360;
    return {
      id,
      originalImage: createPlaceholderImage(label, hue),
      mosaicImage: null,
      showMosaic: false,
      shotDate,
      comment: '',
    };
  }

  function makeItem(id, name, room, shotDates) {
    const photos = {};
    TIMING_ORDER.forEach((timing) => {
      photos[timing] = makePhoto(
        `${id}-${timing}`,
        `${name} ${TIMING_LABELS[timing]}`,
        shotDates[timing] || '2026-02-10',
      );
    });
    return { id, name, room, photos };
  }

  const state = {
    area: 'common',
    room: 'all',
    categories: {
      common: [
        makeItem('common-ext-n', '北側外壁', null, { before: '2026-01-20', during: '2026-01-25', after: '2026-02-05' }),
        makeItem('common-ext-s', '南側外壁', null, { before: '2026-01-21', during: '2026-01-26', after: '2026-02-06' }),
        makeItem('common-ent-1f', '1Fエントランス', null, { before: '2026-01-18', during: '2026-01-22', after: '2026-02-01' }),
      ],
      private: ROOMS.map((room) => ({
        id: `private-room-${room}`,
        name: room,
        items: [
          makeItem(`private-liv-${room}`, 'リビング', room, { before: '2026-01-27', during: '2026-01-28', after: '2026-01-31' }),
          makeItem(`private-kit-${room}`, 'キッチン', room, { before: '2026-01-27', during: '2026-01-29', after: '2026-01-31' }),
          makeItem(`private-bath-${room}`, '浴室', room, { before: '2026-01-28', during: '2026-01-30', after: '2026-02-01' }),
          makeItem(`private-balc-${room}`, 'バルコニー', room, { before: '2026-01-29', during: '2026-01-30', after: '2026-02-02' }),
        ],
      })),
    },
  };

  function findPhotoContext(photoId) {
    if (state.area === 'common') {
      for (const item of state.categories.common) {
        for (const timing of TIMING_ORDER) {
          const photo = item.photos[timing];
          if (photo?.id === photoId) {
            return { photo, item, timing, categoryName: item.name };
          }
        }
      }
      return null;
    }

    const categories = state.categories.private;
    for (const category of categories) {
      for (const item of category.items) {
        for (const timing of TIMING_ORDER) {
          const photo = item.photos[timing];
          if (photo?.id === photoId) {
            return { photo, item, timing, categoryName: category.name };
          }
        }
      }
    }
    return null;
  }

  function findPhoto(photoId) {
    return findPhotoContext(photoId)?.photo ?? null;
  }

  function getVisiblePrivateCategories() {
    if (state.room === 'all') {
      return state.categories.private;
    }
    return state.categories.private.filter((category) => category.name === state.room);
  }

  function getDisplayImage(photo) {
    if (photo.mosaicImage && photo.showMosaic) return photo.mosaicImage;
    return photo.originalImage;
  }

  function formatDateLabel(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function buildViewSwitch(photo, groupName, onChange) {
    const toggle = document.createElement('div');
    toggle.className = 'ui-segment-toggle view-switch';
    toggle.setAttribute('role', 'radiogroup');
    toggle.setAttribute('aria-label', '表示画像の切替');

    ['original', 'mosaic'].forEach((mode) => {
      const label = document.createElement('label');
      label.className = 'ui-segment-toggle__option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = groupName;
      input.value = mode;
      input.checked = mode === 'mosaic' ? photo.showMosaic : !photo.showMosaic;

      input.addEventListener('change', () => {
        photo.showMosaic = mode === 'mosaic';
        onChange();
      });

      const text = document.createElement('span');
      text.textContent = mode === 'original' ? '元画像' : 'モザイク';

      label.append(input, text);
      toggle.appendChild(label);
    });

    return toggle;
  }

  function openDetailModal(photoId) {
    activeDetailPhotoId = photoId;
    refreshDetailModal();
    openModal(detailOverlay);
  }

  function closeDetailModal() {
    activeDetailPhotoId = null;
    closeModal(detailOverlay);
  }

  function refreshDetailModal() {
    const context = findPhotoContext(activeDetailPhotoId);
    if (!context) return;

    const { photo, item, timing, categoryName } = context;
    const timingLabel = TIMING_LABELS[timing];

    if (state.area === 'common') {
      detailTitle.textContent = `${item.name} — ${timingLabel}`;
      detailSubtitle.hidden = true;
      detailSubtitle.textContent = '';
    } else {
      detailTitle.textContent = `${categoryName}号室`;
      detailSubtitle.hidden = false;
      detailSubtitle.textContent = `${item.name} — ${timingLabel}`;
    }
    detailPreview.src = getDisplayImage(photo);
    detailPreview.alt = `${item.name} ${TIMING_LABELS[timing]}`;
    detailDateInput.value = photo.shotDate || '';
    detailCommentInput.value = photo.comment || '';

    detailViewSwitch.replaceChildren();
    if (photo.mosaicImage) {
      detailViewSwitch.hidden = false;
      detailViewSwitch.appendChild(
        buildViewSwitch(photo, `view-detail-${photo.id}`, () => {
          detailPreview.src = getDisplayImage(photo);
          renderList();
        }),
      );
    } else {
      detailViewSwitch.hidden = true;
    }
  }

  function createPhotoCard(photo, itemName, timing) {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.dataset.photoId = photo.id;

    const heading = document.createElement('h5');
    heading.className = 'timing';
    heading.textContent = TIMING_LABELS[timing];

    const imageWrap = document.createElement('div');
    imageWrap.className = 'image-wrap';

    const image = document.createElement('img');
    image.src = getDisplayImage(photo);
    image.alt = `${itemName} ${TIMING_LABELS[timing]}`;
    imageWrap.appendChild(image);

    const dateDisplay = document.createElement('p');
    dateDisplay.className = 'date-display';
    dateDisplay.textContent = `撮影日：${formatDateLabel(photo.shotDate)}`;

    const commentDisplay = document.createElement('p');
    commentDisplay.className = 'comment-display';
    const commentText = photo.comment.trim();
    if (commentText) {
      commentDisplay.textContent = `コメント：${commentText}`;
    } else {
      commentDisplay.hidden = true;
    }

    const cardParts = [heading, imageWrap, dateDisplay];
    if (commentText) cardParts.push(commentDisplay);

    if (photo.mosaicImage) {
      const viewSwitch = buildViewSwitch(photo, `view-card-${photo.id}`, () => {
        image.src = getDisplayImage(photo);
      });
      cardParts.push(viewSwitch);
    }

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'ui-btn--outline ui-btn--primary edit-btn';
    editButton.innerHTML = `
      <span class="material-symbols-rounded" aria-hidden="true">edit</span>
      編集
    `;
    editButton.addEventListener('click', () => {
      openDetailModal(photo.id);
    });
    cardParts.push(editButton);

    card.append(...cardParts);
    return card;
  }

  function renderList() {
    listHost.replaceChildren();

    if (state.area === 'common') {
      const items = state.categories.common;
      if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = '表示する写真がありません。';
        listHost.appendChild(empty);
        return;
      }

      items.forEach((item) => {
        const section = document.createElement('section');
        section.className = 'category';

        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'title';
        categoryTitle.textContent = item.name;

        const grid = document.createElement('div');
        grid.className = 'grid';

        TIMING_ORDER.forEach((timing) => {
          if (item.photos[timing]) {
            grid.appendChild(createPhotoCard(item.photos[timing], item.name, timing));
          }
        });

        section.append(categoryTitle, grid);
        listHost.appendChild(section);
      });
      return;
    }

    const categories = getVisiblePrivateCategories();

    if (!categories.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '表示する写真がありません。部屋番号の絞り込みを変更してください。';
      listHost.appendChild(empty);
      return;
    }

    categories.forEach((category) => {
      const section = document.createElement('section');
      section.className = 'category';

      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'title';
      categoryTitle.textContent = `${category.name}号室`;

      section.appendChild(categoryTitle);

      category.items.forEach((item) => {
        const itemBlock = document.createElement('div');
        itemBlock.className = 'item';

        const itemTitle = document.createElement('h4');
        itemTitle.className = 'title';
        itemTitle.textContent = item.name;

        const grid = document.createElement('div');
        grid.className = 'grid';

        TIMING_ORDER.forEach((timing) => {
          if (item.photos[timing]) {
            grid.appendChild(createPhotoCard(item.photos[timing], item.name, timing));
          }
        });

        itemBlock.append(itemTitle, grid);
        section.appendChild(itemBlock);
      });

      listHost.appendChild(section);
    });
  }

  function updateAreaUI() {
    const isPrivate = state.area === 'private';
    roomFilterWrap.hidden = !isPrivate;
    roomFilter.disabled = !isPrivate;
    if (!isPrivate) {
      state.room = 'all';
      roomFilter.value = 'all';
    }
  }

  const mosaicEditor = createMosaicEditor(mosaicOverlay, {
    onApply(imageData) {
      if (!pendingPhotoId) return;
      const photo = findPhoto(pendingPhotoId);
      if (!photo) return;
      photo.mosaicImage = imageData;
      photo.showMosaic = true;
      const appliedPhotoId = pendingPhotoId;
      pendingPhotoId = null;
      if (activeDetailPhotoId === appliedPhotoId) {
        refreshDetailModal();
      }
      renderList();
    },
  });
  if (!mosaicEditor) return;

  detailDateInput.addEventListener('change', () => {
    const photo = findPhoto(activeDetailPhotoId);
    if (!photo) return;
    photo.shotDate = detailDateInput.value;
    renderList();
  });

  detailCommentInput.addEventListener('input', () => {
    const photo = findPhoto(activeDetailPhotoId);
    if (!photo) return;
    photo.comment = detailCommentInput.value;
    renderList();
  });

  detailMosaicButton.addEventListener('click', () => {
    const photo = findPhoto(activeDetailPhotoId);
    if (!photo) return;
    pendingPhotoId = photo.id;
    mosaicEditor.open(photo.originalImage);
  });

  areaToggle.querySelectorAll('[data-cp-area]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      closeDetailModal();
      state.area = input.value;
      updateAreaUI();
      renderList();
    });
  });

  roomFilter.addEventListener('change', () => {
    closeDetailModal();
    state.room = roomFilter.value;
    renderList();
  });

  exportButton.addEventListener('click', () => {
    window.open('../print-support/index.html', '_blank', 'noopener');
  });

  ROOMS.forEach((room) => {
    const option = document.createElement('option');
    option.value = room;
    option.textContent = `${room}号室`;
    roomFilter.appendChild(option);
  });

  updateAreaUI();
  renderList();
})();
