(function () {
  const board = document.querySelector('[data-detail-schedule-board]');
  const detailScheduleRoot = document.querySelector('.detail-schedule.workspace');
  const ngModeCheckbox = document.querySelector('[data-detail-schedule-ng-mode]');
  const ngModeHint = document.querySelector('[data-ng-mode-hint]');
  const ngModeLegend = document.querySelector('[data-ng-mode-legend]');
  if (!board) return;

  const DAYS = [
    { date: '1/27', dow: '火', type: 'work', isReserveDay: true },
    { date: '1/28', dow: '水', type: 'work' },
    { date: '1/29', dow: '木', type: 'holiday', label: '専有部休工日' },
    { date: '1/30', dow: '金', type: 'work' },
    { date: '1/31', dow: '土', type: 'work' },
  ];

  const DAY_COUNT = DAYS.length;
  const scheduleThead = document.querySelector('[data-detail-schedule-thead]');
  const reserveBandLabel = '予定日工事枠';

  const makeSlot = (room, status = 'confirmed', flags = {}) => ({
    room,
    status,
    hasHistory: Boolean(flags.history),
    hasRemarks: Boolean(flags.remarks),
    isPriority: Boolean(flags.priority),
  });

  const normalizeSlot = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      return makeSlot(value, 'confirmed');
    }
    if (typeof value === 'object' && value.room) {
      return makeSlot(value.room, value.status || 'confirmed', {
        history: value.hasHistory,
        remarks: value.hasRemarks,
        priority: value.isPriority,
      });
    }
    return null;
  };

  const getSlotRoom = (value) => normalizeSlot(value)?.room || '';
  let nextBandId = 4;
  let dragSource = null;
  let suppressNextClick = false;

  const roomDetailTitle = document.querySelector('[data-room-detail-title]');
  const roomDetailEdit = document.querySelector('[data-room-detail-edit]');
  const roomOverviewBody = document.querySelector('[data-room-overview-body]');
  const roomHistoryBody = document.querySelector('[data-room-history-body]');
  const registerActions = document.querySelector('[data-detail-schedule-actions]');
  const registerButton = document.querySelector('[data-detail-schedule-register]');
  const cancelButton = document.querySelector('[data-detail-schedule-cancel]');
  const slotPatternEl = document.querySelector('[data-slot-pattern]');
  const slotPatternNote = document.querySelector('[data-slot-pattern-note]');

  const PROJECT_ITINERARY = {
    commonArea: '2026/01/20 〜 2026/02/10',
    privateArea: '2026/01/27 〜 2026/01/31',
    units: '40',
    optionWorks: [
      { name: 'キッチン交換', period: '2026/01/27 〜 2026/01/29' },
      { name: '収納扉交換', period: '2026/01/30 〜 2026/01/31' },
    ],
  };

  const ROOM_CATALOG = {
    301: {
      resident: '山田 太郎',
      preferredTime: '午前中',
      phone: '090-1234-5678',
      cardKeys: '2 枚',
      optionWorks: [{ name: 'キッチン交換', quantity: '1 式' }],
      remarks: 'ペットあり。工事当日は在宅予定。共用部からの搬入経路に注意。',
      history: [
        { date: '2026/01/15', operator: '真鍋 智彦', content: '1/28 13:00〜15:00 に変更' },
        { date: '2026/01/14', operator: '山田 太郎', content: '希望時間帯を午前中に更新' },
      ],
    },
    505: {
      resident: '佐藤 花子',
      preferredTime: '13:00〜15:00',
      phone: '080-9876-5432',
      cardKeys: '1 枚',
      optionWorks: [],
      remarks: '平日のみ在宅可能。',
      history: [{ date: '2026/01/12', operator: '前田 悠斗', content: '1/27 09:00〜12:00 に配置' }],
    },
    102: {
      resident: '鈴木 一郎',
      preferredTime: '午前中',
      phone: '070-1111-2222',
      cardKeys: '—',
      optionWorks: [],
      remarks: '',
      history: [],
    },
    103: {
      resident: '高橋 美咲',
      preferredTime: '15:00〜17:00',
      phone: '090-3333-4444',
      cardKeys: '1 枚',
      optionWorks: [{ name: 'キッチン交換', quantity: '1 式' }],
      remarks: 'エレベーター利用可。',
      history: [],
    },
    804: {
      resident: '伊藤 健',
      preferredTime: '18:00〜19:00',
      phone: '080-5555-6666',
      cardKeys: '2 枚',
      optionWorks: [
        { name: 'キッチン交換', quantity: '1 式' },
        { name: '収納扉交換', quantity: '1 式' },
      ],
      remarks: 'オプション申込あり（要確認）。',
      history: [{ date: '2026/01/13', operator: '佐藤 花子', content: 'オプション数量を更新' }],
    },
  };

  const defaultRoomProfile = (room) => ({
    resident: '—',
    preferredTime: '—',
    phone: '—',
    cardKeys: '—',
    optionWorks: [],
    remarks: '',
    history: [],
  });

  const getRoomOptionWorks = (profile) => profile?.optionWorks || [];

  const formatRoomOptionWorksText = (optionWorks) =>
    optionWorks
      .map((work) => [work.name, work.quantity].filter(Boolean).join(' '))
      .join('、');

  const formatProjectOptionWorksText = (optionWorks) =>
    optionWorks.map((work) => `${work.name}（${work.period}）`).join('、');

  const state = {
    bands: [
      {
        id: 'band-1',
        label: '09:00〜12:00',
        startTime: '09:00',
        endTime: '12:00',
        rows: [
          {
            rooms: [
              makeSlot('301', 'confirmed', { remarks: true }),
              makeSlot('505', 'unconfirmed'),
              '',
              makeSlot('301', 'unconfirmed', { history: true }),
              makeSlot('102', 'unconfirmed'),
            ],
          },
          { rooms: ['', '', '', '', makeSlot('103', 'unconfirmed', { history: true })] },
          {
            rooms: [
              makeSlot('501', 'unconfirmed', { priority: true }),
              '',
              makeSlot('804', 'done', { history: true, remarks: true }),
              '',
              '',
            ],
          },
          { rooms: ['', makeSlot('605', 'unconfirmed'), '', makeSlot('702', 'done'), ''] },
        ],
      },
      {
        id: 'band-2',
        label: '13:00〜15:00',
        startTime: '13:00',
        endTime: '15:00',
        rows: [
          {
            rooms: [
              makeSlot('301', 'confirmed', { history: true, remarks: true }),
              makeSlot('804', 'done'),
              '',
              '',
              makeSlot('904', 'unconfirmed', { priority: true }),
            ],
          },
          {
            rooms: [
              '',
              makeSlot('203', 'done', { remarks: true, priority: true }),
              '',
              makeSlot('401', 'confirmed'),
              '',
            ],
          },
        ],
      },
      {
        id: 'band-3',
        label: '15:00〜17:00',
        startTime: '15:00',
        endTime: '17:00',
        rows: [
          {
            rooms: [
              makeSlot('302', 'done'),
              makeSlot('506', 'unconfirmed'),
              '',
              makeSlot('302', 'confirmed'),
              makeSlot('905', 'unconfirmed', { priority: true }),
            ],
          },
          { rooms: [makeSlot('502', 'unconfirmed'), '', makeSlot('805', 'unconfirmed'), '', ''] },
        ],
      },
      {
        id: 'band-4',
        label: '18:00〜19:00',
        startTime: '18:00',
        endTime: '19:00',
        isReserveBand: true,
        rows: [
          {
            rooms: [
              makeSlot('202', 'done'),
              makeSlot('601', 'done'),
              '',
              makeSlot('202', 'done'),
              makeSlot('603', 'done'),
            ],
          },
        ],
      },
    ],
    ngCells: new Set(),
  };

  let selection = {
    bandIndex: 0,
    rowIndex: 0,
    dayIndex: 0,
    room: '301',
  };

  let isDirty = false;
  let committedSnapshot = null;
  let isListView = false;

  const scheduleWorkspace = document.querySelector('[data-detail-schedule-workspace]');
  const listViewPanel = document.querySelector('[data-detail-schedule-list-view]');
  const boardViewPanel = document.querySelector('[data-detail-schedule-board-view]');
  const listViewBody = document.querySelector('[data-detail-schedule-list-body]');
  const toggleViewButton = document.querySelector('[data-detail-schedule-toggle-view]');
  const summaryPatternEl = document.querySelector('[data-detail-schedule-summary-pattern]');
  const summaryCommonEl = document.querySelector('[data-detail-schedule-summary-common]');
  const summaryPrivateEl = document.querySelector('[data-detail-schedule-summary-private]');
  const summaryUnitsEl = document.querySelector('[data-detail-schedule-summary-units]');
  const summaryOptionsEl = document.querySelector('[data-detail-schedule-summary-options]');
  const itineraryCommonEl = document.querySelector('[data-detail-schedule-itinerary-common]');
  const itineraryPrivateEl = document.querySelector('[data-detail-schedule-itinerary-private]');
  const itineraryUnitsEl = document.querySelector('[data-detail-schedule-itinerary-units]');
  const itineraryOptionsEl = document.querySelector('[data-detail-schedule-itinerary-options]');
  const changeMenuButton = document.querySelector('[data-detail-schedule-change-toggle]');
  const changeMenu = document.getElementById('detail-schedule-change-dropdown');
  const excelExportButton = document.querySelector('[data-detail-schedule-excel-export]');

  const SCHEDULE_YEAR = 2026;

  const RECEPTION_LABELS = {
    unconfirmed: '未連絡',
    confirmed: '確定',
    done: '対応済み',
  };

  const addBandForm = document.querySelector('[data-detail-schedule-add-band-form]');
  const addBandModal = document.getElementById('detail-schedule-add-band-modal');
  const startInput = document.getElementById('detail-schedule-band-start');
  const endInput = document.getElementById('detail-schedule-band-end');
  const bandError = document.querySelector('[data-detail-schedule-band-error]');
  const bandErrorText = document.querySelector('[data-detail-schedule-band-error-text]');

  const emptyRow = () => ({ rooms: Array(DAY_COUNT).fill('') });

  const cloneSlot = (slot) => {
    const normalized = normalizeSlot(slot);
    return normalized ? { ...normalized } : '';
  };

  const cloneBands = (bands) =>
    bands.map((band) => ({
      id: band.id,
      label: band.label,
      startTime: band.startTime,
      endTime: band.endTime,
      isReserveBand: Boolean(band.isReserveBand),
      rows: band.rows.map((row) => ({ rooms: row.rooms.map(cloneSlot) })),
    }));

  const createSnapshot = () => ({
    bands: cloneBands(state.bands),
    ngCells: new Set(state.ngCells),
  });

  const restoreSnapshot = (snapshot) => {
    state.bands = cloneBands(snapshot.bands);
    state.ngCells = new Set(snapshot.ngCells);
    sanitizeHolidayCells();
    sortBandsByStartTime();
  };

  const getSlotPatternText = (bands) => bands.map((band) => `[${band.label}]`).join(' ');

  const cellKey = (bandIndex, rowIndex, dayIndex) => `${bandIndex}-${rowIndex}-${dayIndex}`;

  const isHolidayDay = (dayIndex) => DAYS[dayIndex]?.type === 'holiday';

  const isNgMode = () => Boolean(ngModeCheckbox?.checked);

  const isNgCell = (bandIndex, rowIndex, dayIndex) => state.ngCells.has(cellKey(bandIndex, rowIndex, dayIndex));

  const getCellAssignment = (bandIndex, rowIndex, dayIndex) =>
    state.bands[bandIndex]?.rows[rowIndex]?.rooms[dayIndex];

  const isCellEmpty = (bandIndex, rowIndex, dayIndex) =>
    !getSlotRoom(getCellAssignment(bandIndex, rowIndex, dayIndex));

  const canToggleNgCell = (bandIndex, rowIndex, dayIndex) => {
    if (isHolidayDay(dayIndex)) return false;
    return isCellEmpty(bandIndex, rowIndex, dayIndex);
  };

  const sanitizeNgCells = () => {
    [...state.ngCells].forEach((key) => {
      const [bandIndex, rowIndex, dayIndex] = key.split('-').map(Number);
      if (isHolidayDay(dayIndex) || !isCellEmpty(bandIndex, rowIndex, dayIndex)) {
        state.ngCells.delete(key);
      }
    });
  };

  const markDirty = () => {
    isDirty = true;
    if (registerActions) registerActions.hidden = false;
    updateSlotPatternPreview();
  };

  const clearDirty = () => {
    isDirty = false;
    if (registerActions) registerActions.hidden = true;
    if (slotPatternNote) slotPatternNote.hidden = true;
  };

  const updateSlotPatternPreview = () => {
    if (!slotPatternEl || !slotPatternNote || !committedSnapshot) return;

    const pending = getSlotPatternText(state.bands);
    const committed = getSlotPatternText(committedSnapshot.bands);

    if (isDirty && pending !== committed) {
      slotPatternNote.textContent = `登録後に反映: ${pending}`;
      slotPatternNote.hidden = false;
      return;
    }

    slotPatternNote.hidden = true;
  };

  const formatListDate = (dayIndex) => {
    const day = DAYS[dayIndex];
    if (!day) return '—';
    const [month, date] = day.date.split('/');
    return `${SCHEDULE_YEAR}年${month}月${date}日(${day.dow})`;
  };

  const formatListBand = (label) => `(${label.replace('〜', ' 〜 ')})`;

  const collectListRows = () => {
    const rows = [];

    state.bands.forEach((band, bandIndex) => {
      band.rows.forEach((slotRow, rowIndex) => {
        slotRow.rooms.forEach((assignment, dayIndex) => {
          const slot = normalizeSlot(assignment);
          if (!slot || isHolidayDay(dayIndex)) return;

          const profile = getRoomProfile(slot.room);
          const optionWorks = getRoomOptionWorks(profile);
          const markers = getRoomMarkers(slot, profile);
          rows.push({
            dateLabel: formatListDate(dayIndex),
            bandLabel: formatListBand(band.label),
            room: slot.room,
            status: slot.status,
            ...markers,
            optionWorks: formatRoomOptionWorksText(optionWorks),
            remarks: profile.remarks || '',
          });
        });
      });
    });

    return rows;
  };

  const syncListSummary = () => {
    if (summaryPatternEl && slotPatternEl) {
      summaryPatternEl.textContent = slotPatternEl.textContent;
    }
    renderItineraryInfo();
  };

  const renderListView = () => {
    if (!listViewBody) return;

    const rows = collectListRows();
    if (!rows.length) {
      listViewBody.innerHTML =
        '<tr><td colspan="7" class="text-muted">表示する工事枠がありません</td></tr>';
      return;
    }

    listViewBody.innerHTML = rows
      .map((row) => {
        const statusClass = row.status ? ` detail-schedule-list-row--${row.status}` : '';
        const statusLabel = RECEPTION_LABELS[row.status] || '—';
        const remarks = row.remarks ? escapeHtml(row.remarks) : '';
        const optionWorks = row.optionWorks ? escapeHtml(row.optionWorks) : '—';
        const statusBadgeClass = row.status
          ? `detail-schedule-reception-status detail-schedule-reception-status--${row.status}`
          : 'detail-schedule-reception-status';

        return `<tr class="detail-schedule-list-row${statusClass}">
          <td>${escapeHtml(row.dateLabel)}</td>
          <td>${escapeHtml(row.bandLabel)}</td>
          <td class="col-room">${renderListRoomCell(row.room, row)}</td>
          <td>
            <span class="${statusBadgeClass}">${escapeHtml(statusLabel)}</span>
          </td>
          <td>${optionWorks}</td>
          <td>${remarks}</td>
          <td class="col-actions">
            <a href="${roomDetailUrl(row.room)}" class="ui-btn--outline ui-btn--sm ui-btn--primary">履歴</a>
          </td>
        </tr>`;
      })
      .join('');
  };

  const refreshListViewIfActive = () => {
    if (!isListView) return;
    syncListSummary();
    renderListView();
  };

  const setListView = (active) => {
    isListView = active;
    scheduleWorkspace?.classList.toggle('is-list-view', active);
    if (listViewPanel) listViewPanel.hidden = !active;
    if (boardViewPanel) boardViewPanel.hidden = active;
    toggleViewButton?.setAttribute('aria-pressed', String(active));

    if (active) {
      syncListSummary();
      renderListView();
    }
  };

  const applyCommittedItinerary = () => {
    if (!slotPatternEl || !committedSnapshot) return;
    slotPatternEl.textContent = getSlotPatternText(committedSnapshot.bands);
    updateSlotPatternPreview();
    refreshListViewIfActive();
  };

  const commitChanges = () => {
    sanitizeNgCells();
    committedSnapshot = createSnapshot();
    clearDirty();
    applyCommittedItinerary();
    window.MotherMapShell?.showToast('工事枠を登録しました');
  };

  const cancelChanges = () => {
    if (!committedSnapshot) return;
    restoreSnapshot(committedSnapshot);
    renderBoard();
    clearDirty();
    applyCommittedItinerary();
    window.MotherMapShell?.showToast('変更を破棄しました');
  };

  const sanitizeHolidayCells = () => {
    state.bands.forEach((band) => {
      band.rows.forEach((row) => {
        DAYS.forEach((day, dayIndex) => {
          if (day.type === 'holiday') {
            row.rooms[dayIndex] = '';
          }
        });
      });
    });

    sanitizeNgCells();
  };

  const renderTableHead = () => {
    if (!scheduleThead) return;

    const dayHeaders = DAYS.map((day, dayIndex) => {
      const reserveBadge = day.isReserveDay
        ? `<span class="day-badge day-badge--reserve">予定日</span>`
        : '';

      if (day.type === 'holiday') {
        return `<th scope="col" class="col-day is-holiday" data-day-index="${dayIndex}">
          ${reserveBadge}
          ${escapeHtml(day.date)}<span class="dow">(${escapeHtml(day.dow)})</span>
          <span class="holiday-label">${escapeHtml(day.label)}</span>
        </th>`;
      }

      const reserveClass = day.isReserveDay ? ' is-reserve-day' : '';
      return `<th scope="col" class="col-day${reserveClass}" data-day-index="${dayIndex}">
        ${reserveBadge}
        ${escapeHtml(day.date)}<span class="dow">(${escapeHtml(day.dow)})</span>
      </th>`;
    }).join('');

    scheduleThead.innerHTML = `<th scope="col" class="col-time">時間帯</th>${dayHeaders}`;
  };

  const toggleNgCell = (bandIndex, rowIndex, dayIndex) => {
    if (!canToggleNgCell(bandIndex, rowIndex, dayIndex)) return false;

    const key = cellKey(bandIndex, rowIndex, dayIndex);
    if (state.ngCells.has(key)) {
      state.ngCells.delete(key);
    } else {
      state.ngCells.add(key);
    }
    return true;
  };

  const applyNgCellToggle = (bandIndex, rowIndex, dayIndex) => {
    if (!toggleNgCell(bandIndex, rowIndex, dayIndex)) return;
    renderBoard();
    markDirty();
  };

  const syncNgModeUi = () => {
    const active = isNgMode();
    detailScheduleRoot?.classList.toggle('is-ng-mode', active);
    if (ngModeHint) ngModeHint.hidden = !active;
    if (ngModeLegend) ngModeLegend.hidden = !active;
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const renderProjectOptionWorksHtml = (optionWorks) => {
    if (!optionWorks.length) return '—';

    return `<ul class="detail-schedule-option-list">${optionWorks
      .map(
        (work) => `<li>
          <span class="detail-schedule-option-list__name">${escapeHtml(work.name)}</span>
          ${work.period ? `<span class="detail-schedule-option-list__meta">${escapeHtml(work.period)}</span>` : ''}
        </li>`
      )
      .join('')}</ul>`;
  };

  const renderItineraryInfo = () => {
    const { commonArea, privateArea, units, optionWorks = [] } = PROJECT_ITINERARY;
    const optionSummary = optionWorks.length ? formatProjectOptionWorksText(optionWorks) : '—';

    if (summaryCommonEl) summaryCommonEl.textContent = commonArea;
    if (summaryPrivateEl) summaryPrivateEl.textContent = privateArea;
    if (summaryUnitsEl) summaryUnitsEl.textContent = units;
    if (summaryOptionsEl) summaryOptionsEl.textContent = optionSummary;

    if (itineraryCommonEl) itineraryCommonEl.textContent = commonArea;
    if (itineraryPrivateEl) itineraryPrivateEl.textContent = privateArea;
    if (itineraryUnitsEl) itineraryUnitsEl.textContent = units;

    if (itineraryOptionsEl) {
      itineraryOptionsEl.innerHTML = renderProjectOptionWorksHtml(optionWorks);
    }
  };

  const parseTimeToMinutes = (time) => {
    const [hours, minutes] = String(time).split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const formatBandLabel = (startTime, endTime) => `${startTime}〜${endTime}`;

  const formatTimeLabel = (label) => {
    const parts = label.split('〜');
    if (parts.length !== 2) return escapeHtml(label);
    return `${escapeHtml(parts[0].trim())}<br />〜<br />${escapeHtml(parts[1].trim())}`;
  };

  const sortBandsByStartTime = () => {
    state.bands.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  };

  const suggestNextBandTimes = () => {
    if (!state.bands.length) {
      return { start: '09:00', end: '12:00' };
    }

    const latest = [...state.bands].sort(
      (a, b) => parseTimeToMinutes(b.endTime) - parseTimeToMinutes(a.endTime)
    )[0];
    const startMinutes = parseTimeToMinutes(latest.endTime);
    const endMinutes = Math.min(startMinutes + 120, 23 * 60 + 59);

    return {
      start: minutesToTime(startMinutes),
      end: minutesToTime(endMinutes),
    };
  };

  const hideBandError = () => {
    if (bandError) bandError.hidden = true;
  };

  const showBandError = (message) => {
    if (!bandError) return;
    if (bandErrorText) bandErrorText.textContent = message;
    bandError.hidden = false;
  };

  const isSameSelection = (bandIndex, rowIndex, dayIndex, room) =>
    selection &&
    selection.bandIndex === bandIndex &&
    selection.rowIndex === rowIndex &&
    selection.dayIndex === dayIndex &&
    selection.room === room;

  const getRoomProfile = (room) => ROOM_CATALOG[room] || defaultRoomProfile(room);

  const getRoomMarkers = (slot, profile = getRoomProfile(slot?.room)) => ({
    hasHistory: Boolean(slot?.hasHistory || profile.history.length),
    hasRemarks: Boolean(slot?.hasRemarks || profile.remarks),
    isPriority: Boolean(slot?.isPriority),
  });

  const renderRoomMarkerBadges = ({ hasHistory, hasRemarks, isPriority }) => {
    const leadBadges = hasHistory
      ? `<span class="slot-room-badges slot-room-badges--lead">
          <span class="slot-room-icon slot-room-icon--history" title="対応履歴あり" aria-label="対応履歴あり">
            <span class="material-symbols-rounded" aria-hidden="true">history</span>
          </span>
        </span>`
      : '';
    const trailParts = [];

    if (hasRemarks) {
      trailParts.push(
        `<span class="slot-room-icon slot-room-icon--remarks" title="部屋備考" aria-label="部屋備考">
          <span class="material-symbols-rounded" aria-hidden="true">sticky_note_2</span>
        </span>`
      );
    }

    if (isPriority) {
      trailParts.push(
        `<span class="slot-room-priority" title="優先工事" aria-label="優先工事">優</span>`
      );
    }

    const trailBadges = trailParts.length
      ? `<span class="slot-room-badges slot-room-badges--trail">${trailParts.join('')}</span>`
      : '';

    return { leadBadges, trailBadges };
  };

  const renderListRoomCell = (room, markers) => {
    const { leadBadges, trailBadges } = renderRoomMarkerBadges(markers);
    return `<span class="detail-schedule-list-room">${leadBadges}<span class="detail-schedule-list-room-num">${escapeHtml(room)}</span>${trailBadges}</span>`;
  };

  const roomDetailUrl = (room) => `room-detail.html?room=${encodeURIComponent(room)}`;

  const updateRoomPanel = (room) => {
    if (!room) return;
    const profile = getRoomProfile(room);

    if (roomDetailTitle) {
      roomDetailTitle.textContent = `部屋詳細（${room}）`;
    }

    if (roomDetailEdit) {
      roomDetailEdit.href = roomDetailUrl(room);
      roomDetailEdit.setAttribute('aria-label', `部屋${room}の詳細ページへ`);
    }

    if (roomOverviewBody) {
      const optionWorks = getRoomOptionWorks(profile);
      const optionWorksLabel = formatRoomOptionWorksText(optionWorks) || '—';

      roomOverviewBody.innerHTML = `
        <tr><th scope="row">入居者名</th><td>${escapeHtml(profile.resident)}</td></tr>
        <tr><th scope="row">希望時間帯</th><td>${escapeHtml(profile.preferredTime)}</td></tr>
        <tr><th scope="row">電話番号</th><td>${escapeHtml(profile.phone)}</td></tr>
        <tr><th scope="row">追加カードキー</th><td>${escapeHtml(profile.cardKeys)}</td></tr>
        <tr><th scope="row">オプション工事</th><td>${escapeHtml(optionWorksLabel)}</td></tr>
        <tr><th scope="row">部屋備考</th><td>${escapeHtml(profile.remarks) || '—'}</td></tr>
      `;
    }

    if (roomHistoryBody) {
      if (!profile.history.length) {
        roomHistoryBody.innerHTML =
          '<tr><td colspan="3" class="text-muted">履歴はありません</td></tr>';
      } else {
        roomHistoryBody.innerHTML = profile.history
          .map(
            (item) => `
          <tr>
            <td>${escapeHtml(item.date)}</td>
            <td>${escapeHtml(item.operator)}</td>
            <td>${escapeHtml(item.content)}</td>
          </tr>`
          )
          .join('');
      }
    }

    const overviewTable = document.querySelector('[data-room-overview-table]');
    if (overviewTable) {
      overviewTable.setAttribute('aria-label', `部屋${room}の概要`);
    }
    const historyTable = document.querySelector('[data-room-history-table]');
    if (historyTable) {
      historyTable.setAttribute('aria-label', `部屋${room}の履歴`);
    }
  };

  const renderRoomButton = (assignment, bandIndex, rowIndex, dayIndex) => {
    const slot = normalizeSlot(assignment);
    if (!slot) return '';

    const { room, status } = slot;
    const markers = getRoomMarkers(slot, getRoomProfile(room));
    const { leadBadges, trailBadges } = renderRoomMarkerBadges(markers);
    const selected = isSameSelection(bandIndex, rowIndex, dayIndex, room);

    const statusLabel =
      status === 'unconfirmed' ? '未確定' : status === 'done' ? '対応済み' : '確定';

    return `<button
      type="button"
      class="slot-room slot-room--${status}${selected ? ' is-selected' : ''}"
      draggable="true"
      data-room="${escapeHtml(room)}"
      data-slot-status="${status}"
      aria-pressed="${selected ? 'true' : 'false'}"
      aria-label="部屋${escapeHtml(room)}（${statusLabel}）"
    >${leadBadges}<span class="slot-room-num">${escapeHtml(room)}</span>${trailBadges}</button>`;
  };

  const renderNgMark = () =>
    `<span class="slot-ng-mark" aria-hidden="true"><span class="material-symbols-rounded">close</span></span>`;

  const renderSlotCell = (assignment, bandIndex, rowIndex, dayIndex) => {
    const day = DAYS[dayIndex];
    const cellAttrs = `data-slot-cell data-band-index="${bandIndex}" data-row-index="${rowIndex}" data-day-index="${dayIndex}"`;
    const slot = normalizeSlot(assignment);
    const room = getSlotRoom(assignment);
    const ngModeActive = isNgMode();

    if (isHolidayDay(dayIndex)) {
      return `<td class="slot-cell is-holiday" ${cellAttrs} aria-label="${escapeHtml(day.label)}">
        <span class="slot-holiday">休</span>
      </td>`;
    }

    const isNg = isNgCell(bandIndex, rowIndex, dayIndex);
    const isEmptyCell = !room;
    const statusClass = slot ? ` slot-cell--${slot.status}` : '';
    const ngTargetClass = ngModeActive && !isNg && isEmptyCell ? ' is-ng-target' : '';
    const ngOccupiedClass = ngModeActive && room ? ' is-ng-occupied' : '';
    const cellClass = `slot-cell${statusClass}${ngTargetClass}${ngOccupiedClass}${isNg ? ' is-ng' : ''}`;
    const ngLabel = ngModeActive
      ? isNg
        ? 'NG枠（クリックで解除）'
        : isEmptyCell
          ? 'クリックでNG枠に設定'
          : '部屋配置済み（NG枠は設定できません）'
      : isNg
        ? 'NG枠'
        : '';
    const ariaLabel = ngLabel ? ` aria-label="${escapeHtml(ngLabel)}"` : '';
    const ngMark = ngModeActive && isNg ? renderNgMark() : '';
    const ngBadge = isNg
      ? `<span class="slot-ng"${ngModeActive ? ' aria-hidden="true"' : ' aria-label="NG枠"'}>NG</span>`
      : '';

    if (!room && !isNg && !ngModeActive) {
      return `<td class="${cellClass}" ${cellAttrs}></td>`;
    }

    const roomButton = room ? renderRoomButton(assignment, bandIndex, rowIndex, dayIndex) : '';
    const emptyHint =
      ngModeActive && isEmptyCell && !isNg
        ? '<span class="slot-ng-placeholder" aria-hidden="true"></span>'
        : '';

    return `<td class="${cellClass}" ${cellAttrs}${ariaLabel} tabindex="${ngModeActive && isEmptyCell ? '0' : '-1'}"><div class="slot-cell-inner">${ngBadge}${roomButton}${emptyHint}${ngMark}</div></td>`;
  };

  const renderBoard = () => {
    sanitizeNgCells();
    const rows = [];

    state.bands.forEach((band, bandIndex) => {
      const rowCount = band.rows.length;

      band.rows.forEach((slotRow, rowIndex) => {
        const isFirst = rowIndex === 0;
        const cells = [];

        if (isFirst) {
          const reserveBandBadge = band.isReserveBand
            ? `<span class="band-badge band-badge--reserve">${escapeHtml(reserveBandLabel)}</span>`
            : '';
          const timeCellClass = band.isReserveBand ? 'time is-reserve-band' : 'time';

          cells.push(
            `<th scope="rowgroup" rowspan="${rowCount}" class="${timeCellClass}">
              <div class="time-cell">
                ${reserveBandBadge}
                <span class="time-label">${formatTimeLabel(band.label)}</span>
                <button type="button" class="ui-btn--outline ui-btn--sm ui-btn--primary" data-add-slot-row data-band-index="${bandIndex}">枠追加</button>
              </div>
            </th>`
          );
        }

        slotRow.rooms.forEach((assignment, dayIndex) => {
          cells.push(renderSlotCell(assignment, bandIndex, rowIndex, dayIndex));
        });

        const isLastInBand = rowIndex === band.rows.length - 1;
        const rowClass = [isFirst ? 'slot-group' : '', isLastInBand ? 'band-end' : ''].filter(Boolean).join(' ');
        rows.push(`<tr class="${rowClass}" data-band-index="${bandIndex}">${cells.join('')}</tr>`);
      });
    });

    board.innerHTML = rows.join('');
    syncSelectionAfterRender();
    refreshListViewIfActive();
  };

  const syncSelectionAfterRender = () => {
    if (!selection?.room) return;

    const stillExists = state.bands.some((band, bandIndex) =>
      band.rows.some((row, rowIndex) =>
        row.rooms.some((assignment, dayIndex) => {
          const room = getSlotRoom(assignment);
          return isSameSelection(bandIndex, rowIndex, dayIndex, room) && room === selection.room;
        })
      )
    );

    if (!stillExists) {
      const firstRoom = findFirstRoomSlot();
      if (firstRoom) {
        selection = firstRoom;
      } else {
        selection = null;
        return;
      }
    }

    updateRoomPanel(selection.room);
  };

  const findFirstRoomSlot = () => {
    for (let bandIndex = 0; bandIndex < state.bands.length; bandIndex += 1) {
      const band = state.bands[bandIndex];
      for (let rowIndex = 0; rowIndex < band.rows.length; rowIndex += 1) {
        for (let dayIndex = 0; dayIndex < band.rows[rowIndex].rooms.length; dayIndex += 1) {
          const room = getSlotRoom(band.rows[rowIndex].rooms[dayIndex]);
          if (room && !isHolidayDay(dayIndex)) {
            return { bandIndex, rowIndex, dayIndex, room };
          }
        }
      }
    }
    return null;
  };

  const selectRoom = (bandIndex, rowIndex, dayIndex, room) => {
    selection = { bandIndex, rowIndex, dayIndex, room };
    board.querySelectorAll('.slot-room').forEach((button) => {
      const cell = button.closest('[data-slot-cell]');
      const active =
        cell &&
        Number(cell.dataset.bandIndex) === bandIndex &&
        Number(cell.dataset.rowIndex) === rowIndex &&
        Number(cell.dataset.dayIndex) === dayIndex &&
        button.dataset.room === room;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateRoomPanel(room);
  };

  const moveRoom = (from, to) => {
    const sourceAssignment = state.bands[from.bandIndex]?.rows[from.rowIndex]?.rooms[from.dayIndex];
    const sourceRoom = getSlotRoom(sourceAssignment);
    if (!sourceRoom) return false;

    const targetBand = state.bands[to.bandIndex];
    if (!targetBand?.rows[to.rowIndex]) return false;

    const targetAssignment = targetBand.rows[to.rowIndex].rooms[to.dayIndex];

    if (from.bandIndex === to.bandIndex && from.rowIndex === to.rowIndex && from.dayIndex === to.dayIndex) {
      return false;
    }

    if (isHolidayDay(from.dayIndex) || isHolidayDay(to.dayIndex) || isNgCell(to.bandIndex, to.rowIndex, to.dayIndex)) {
      return false;
    }

    targetBand.rows[to.rowIndex].rooms[to.dayIndex] = cloneSlot(sourceAssignment);
    state.bands[from.bandIndex].rows[from.rowIndex].rooms[from.dayIndex] = targetAssignment
      ? cloneSlot(targetAssignment)
      : '';

    selection = { bandIndex: to.bandIndex, rowIndex: to.rowIndex, dayIndex: to.dayIndex, room: sourceRoom };
    return true;
  };

  const readCellCoords = (cell) => ({
    bandIndex: Number(cell.dataset.bandIndex),
    rowIndex: Number(cell.dataset.rowIndex),
    dayIndex: Number(cell.dataset.dayIndex),
  });

  const clearDropTargets = () => {
    board.querySelectorAll('.slot-cell.is-drop-target').forEach((cell) => {
      cell.classList.remove('is-drop-target');
    });
  };

  const addSlotRow = (bandIndex) => {
    const band = state.bands[bandIndex];
    if (!band) return;
    band.rows.push(emptyRow());
    renderBoard();
    markDirty();
  };

  const isDuplicateBand = (startTime, endTime) =>
    state.bands.some((band) => band.startTime === startTime && band.endTime === endTime);

  const addTimeBand = (startTime, endTime) => {
    nextBandId += 1;
    state.bands.push({
      id: `band-${nextBandId}`,
      label: formatBandLabel(startTime, endTime),
      startTime,
      endTime,
      rows: [emptyRow()],
    });
    sortBandsByStartTime();
    renderBoard();
    markDirty();
  };

  const closeAddBandModal = () => {
    addBandModal?.querySelector('[data-modal-close]')?.click();
  };

  const prepareAddBandModal = () => {
    const { start, end } = suggestNextBandTimes();
    hideBandError();
    if (startInput) startInput.value = start;
    if (endInput) endInput.value = end;
  };

  board.addEventListener('click', (event) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    const addRowButton = event.target.closest('[data-add-slot-row]');
    if (addRowButton) {
      event.preventDefault();
      addSlotRow(Number(addRowButton.dataset.bandIndex));
      return;
    }

    const cell = event.target.closest('[data-slot-cell]');
    if (!cell) return;

    const { bandIndex, rowIndex, dayIndex } = readCellCoords(cell);

    if (isHolidayDay(dayIndex)) {
      return;
    }

    if (isNgMode()) {
      event.preventDefault();
      applyNgCellToggle(bandIndex, rowIndex, dayIndex);
      return;
    }

    const roomButton = event.target.closest('.slot-room');
    if (!roomButton) return;

    event.preventDefault();
    const room = roomButton.dataset.room;

    if (isSameSelection(bandIndex, rowIndex, dayIndex, room)) {
      return;
    }

    selectRoom(bandIndex, rowIndex, dayIndex, room);
  });

  board.addEventListener('dblclick', (event) => {
    if (isNgMode()) return;

    const roomButton = event.target.closest('.slot-room');
    if (!roomButton) return;

    event.preventDefault();

    const cell = roomButton.closest('[data-slot-cell]');
    if (!cell) return;

    const { bandIndex, rowIndex, dayIndex } = readCellCoords(cell);
    const room = roomButton.dataset.room;

    if (!isSameSelection(bandIndex, rowIndex, dayIndex, room)) {
      selectRoom(bandIndex, rowIndex, dayIndex, room);
    }

    window.location.href = roomDetailUrl(room);
  });

  board.addEventListener('keydown', (event) => {
    if (!isNgMode()) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const cell = event.target.closest('[data-slot-cell]');
    if (!cell) return;

    const coords = readCellCoords(cell);
    const { bandIndex, rowIndex, dayIndex } = coords;

    if (isHolidayDay(dayIndex)) return;

    event.preventDefault();
    applyNgCellToggle(bandIndex, rowIndex, dayIndex);
  });

  board.addEventListener('dragstart', (event) => {
    if (isNgMode()) {
      event.preventDefault();
      return;
    }

    const roomButton = event.target.closest('.slot-room');
    if (!roomButton) return;

    const cell = roomButton.closest('[data-slot-cell]');
    if (!cell) return;

    const { dayIndex } = readCellCoords(cell);
    if (isHolidayDay(dayIndex)) {
      event.preventDefault();
      return;
    }

    dragSource = {
      ...readCellCoords(cell),
      room: roomButton.dataset.room,
      element: roomButton,
    };

    roomButton.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', dragSource.room);
  });

  board.addEventListener('dragend', (event) => {
    const roomButton = event.target.closest('.slot-room');
    roomButton?.classList.remove('is-dragging');
    clearDropTargets();
    suppressNextClick = true;
    dragSource = null;
  });

  board.addEventListener('dragover', (event) => {
    const cell = event.target.closest('[data-slot-cell]');
    if (!cell || !dragSource) return;

    const { bandIndex, rowIndex, dayIndex } = readCellCoords(cell);
    if (isHolidayDay(dayIndex) || isNgCell(bandIndex, rowIndex, dayIndex)) {
      event.dataTransfer.dropEffect = 'none';
      clearDropTargets();
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    clearDropTargets();
    cell.classList.add('is-drop-target');
  });

  board.addEventListener('dragleave', (event) => {
    const cell = event.target.closest('[data-slot-cell]');
    if (!cell) return;
    cell.classList.remove('is-drop-target');
  });

  board.addEventListener('drop', (event) => {
    event.preventDefault();
    const cell = event.target.closest('[data-slot-cell]');
    clearDropTargets();
    if (!cell || !dragSource) return;

    const target = readCellCoords(cell);
    if (moveRoom(dragSource, target)) {
      renderBoard();
      markDirty();
    }
  });

  registerButton?.addEventListener('click', commitChanges);
  cancelButton?.addEventListener('click', cancelChanges);

  ngModeCheckbox?.addEventListener('change', () => {
    syncNgModeUi();
    renderBoard();
  });

  document.querySelectorAll('[data-detail-schedule-open-add-band]').forEach((button) => {
    button.addEventListener('click', prepareAddBandModal);
  });

  addBandForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    hideBandError();

    const startTime = startInput?.value;
    const endTime = endInput?.value;
    if (!startTime || !endTime) {
      showBandError('開始時刻と終了時刻を入力してください。');
      return;
    }

    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      showBandError('終了時刻は開始時刻より後にしてください。');
      return;
    }

    if (isDuplicateBand(startTime, endTime)) {
      showBandError('同じ時間帯が既に登録されています。');
      return;
    }

    addTimeBand(startTime, endTime);
    closeAddBandModal();
  });

  const tabRoot = document.querySelector('[data-room-detail-tabs]');
  const tabPanels = document.querySelector('[data-room-tab-panels]');

  if (tabRoot && tabPanels) {
    tabRoot.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-room-tab]');
      if (!tab) return;

      const name = tab.dataset.roomTab;
      tabRoot.querySelectorAll('[data-room-tab]').forEach((item) => {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });

      tabPanels.querySelectorAll('[data-room-tab-panel]').forEach((panel) => {
        const active = panel.dataset.roomTabPanel === name;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    });
  }

  toggleViewButton?.addEventListener('click', () => {
    setListView(!isListView);
  });

  const closeChangeMenu = () => {
    changeMenu?.classList.remove('is-open');
    changeMenuButton?.setAttribute('aria-expanded', 'false');
  };

  changeMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = changeMenu?.classList.toggle('is-open');
    changeMenuButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.detail-schedule-change-menu')) {
      closeChangeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeChangeMenu();
  });

  excelExportButton?.addEventListener('click', () => {
    window.MotherMapShell?.showToast('EXCEL出力を開始しました（モック）');
  });

  syncNgModeUi();
  sanitizeHolidayCells();
  sortBandsByStartTime();
  renderTableHead();
  committedSnapshot = createSnapshot();
  renderBoard();
  applyCommittedItinerary();
  renderItineraryInfo();
})();
