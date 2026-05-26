(() => {
  const root = document.querySelector('[data-process-schedule]');
  if (!root) return;

  const board = root.querySelector('[data-schedule-board]');
  const laborBoard = root.querySelector('[data-schedule-labor]');
  const laborProjectLegendEl = root.querySelector('[data-schedule-labor-project-legend]');
  const laborPickerEl = root.querySelector('[data-labor-picker]');
  const laborPickerTitleEl = laborPickerEl?.querySelector('[data-labor-picker-title]');
  const laborPickerOptionsEl = laborPickerEl?.querySelector('[data-labor-picker-options]');
  let activeLaborPickerCell = null;
  const periodEl = root.querySelector('[data-schedule-period]');
  const legendEl = root.querySelector('[data-schedule-legend]');
  const prevBtn = root.querySelector('[data-schedule-prev]');
  const nextBtn = root.querySelector('[data-schedule-next]');
  const todayBtn = root.querySelector('[data-schedule-today]');
  const rangeStartInput = root.querySelector('[data-schedule-range-start]');
  const filterSelect = root.querySelector('[data-schedule-filter]');

  const modal = document.getElementById('schedule-task-modal');
  const modalProjectEl = modal?.querySelector('[data-schedule-modal-project]');
  const taskForm = modal?.querySelector('[data-schedule-task-form]');
  const saveBtn = modal?.querySelector('[data-schedule-task-save]');

  const tasksModal = document.getElementById('schedule-project-tasks-modal');
  const tasksModalProjectEl = tasksModal?.querySelector('[data-schedule-tasks-modal-project]');
  const tasksGridEl = tasksModal?.querySelector('[data-schedule-tasks-grid]');

  const documentsModal = document.getElementById('schedule-project-documents-modal');
  const documentsModalProjectEl = documentsModal?.querySelector('[data-schedule-documents-modal-project]');
  const documentsGridEl = documentsModal?.querySelector('[data-schedule-documents-grid]');

  const VISIBLE_DAYS = 35;
  const DAY_MS = 86400000;
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

  const SEGMENT_TYPES = [
    { key: 'planned', label: '予定工期', short: '工期', mode: 'range', color: 'contractor' },
    { key: 'common1', label: '第一共用部', short: '共1', mode: 'range', color: 'contractor' },
    { key: 'common2', label: '第二共用部', short: '共2', mode: 'range', color: 'contractor' },
    { key: 'exclusive', label: '専有部', short: '専有', mode: 'range', color: 'contractor' },
    { key: 'reserve', label: '予備日', short: '予備', mode: 'days', color: 'reserve' },
    { key: 'holiday', label: '休工日', short: '休工', mode: 'days', color: 'holiday' },
  ];

  const SEGMENT_PALETTE = {
    reserve: { bg: '#fef3c7', border: '#d97706', text: '#92400e', legend: '予備日' },
    holiday: { bg: '#f3f4f6', border: '#6b7280', text: '#374151', legend: '休工日' },
  };

  const CONTRACTORS = [
    { id: '', label: '未設定' },
    {
      id: 'terasys',
      label: 'テラシステム電設',
      bg: '#dbeafe',
      border: '#2563eb',
      text: '#1e3a8a',
    },
    {
      id: 'kansai',
      label: '関西設備工業',
      bg: '#d1fae5',
      border: '#059669',
      text: '#065f46',
    },
    {
      id: 'tokai',
      label: '東海電気通信',
      bg: '#ffedd5',
      border: '#d97706',
      text: '#9a3412',
    },
    {
      id: 'hokuriku',
      label: '北陸メンテナンス',
      bg: '#ede9fe',
      border: '#7c3aed',
      text: '#5b21b6',
    },
  ];

  const ASSIGNEES = [
    { id: '', label: '未設定' },
    { id: 'manabe', label: '真鍋 智彦' },
    { id: 'sato', label: '佐藤 誠' },
    { id: 'suzuki', label: '鈴木 雅人' },
    { id: 'tanaka', label: '田中 裕子' },
  ];

  const STAFF = [
    { id: 'manabe', name: '真鍋', role: '主任・電気工事士' },
    { id: 'sato', name: '佐藤', role: '班長・第2班' },
    { id: 'suzuki', name: '鈴木', role: '電気工事士' },
    { id: 'tanaka', name: '田中', role: '事務・連絡' },
  ];

  const ITEM_STATUSES = ['未着手', '進行中', '完了'];

  const PROJECT_TASK_ITEMS = [
    { key: 'construction-docs', label: '工事関連資料配布' },
    { key: 'decision-notice', label: '決定案内配布' },
    { key: 'schedule-deadline', label: '工事日程締切' },
    { key: 'option-deadline', label: 'オプション工事締切' },
    { key: 'option-order', label: 'オプション発注' },
    { key: 'waste', label: '産廃' },
  ];

  const PROJECT_DOCUMENT_ITEMS = [
    { key: 'proposal', label: '提案書' },
    { key: 'agency-order', label: '代理店発注書' },
    { key: 'fire', label: '消防書類' },
    { key: 'resident-guide', label: '住民案内・配布資料' },
    { key: 'order-docs', label: '受注書類' },
    { key: 'waste', label: '産廃' },
  ];

  const DEFAULT_PROJECT_TASKS = {
    'construction-docs': { deadline: '2026-05-08', status: '進行中' },
    'decision-notice': { deadline: '2026-05-10', status: '未着手' },
    'schedule-deadline': { deadline: '2026-05-12', status: '進行中' },
    'option-deadline': { deadline: '2026-05-14', status: '未着手' },
    'option-order': { deadline: '2026-05-18', status: '未着手' },
    waste: { deadline: '2026-05-20', status: '未着手' },
  };

  const DEFAULT_PROJECT_DOCUMENTS = {
    proposal: { deadline: '2026-05-09', status: '進行中' },
    'agency-order': { deadline: '2026-05-11', status: '未着手' },
    fire: { deadline: '2026-05-13', status: '未着手' },
    'resident-guide': { deadline: '2026-05-15', status: '未着手' },
    'order-docs': { deadline: '2026-05-17', status: '未着手' },
    waste: { deadline: '2026-05-22', status: '未着手' },
  };

  const projects = [
    {
      id: 'p1',
      no: 1,
      title: '〇●マンションA インターホン更新',
      property: '〇●マンションA',
      client: '株式会社サンプル設備',
      contractorId: '',
      assigneeId: '',
      segments: {},
      tasks: structuredClone(DEFAULT_PROJECT_TASKS),
      documents: structuredClone(DEFAULT_PROJECT_DOCUMENTS),
    },
    {
      id: 'p2',
      no: 2,
      title: '△■マンションB 子機交換',
      property: '△■マンションB',
      client: '△■管理組合',
      contractorId: 'terasys',
      assigneeId: 'manabe',
      segments: {
        planned: { start: '2026-05-06', end: '2026-05-20' },
        common1: { start: '2026-05-08', end: '2026-05-12' },
        common2: { start: '2026-05-13', end: '2026-05-16' },
        exclusive: { start: '2026-05-17', end: '2026-05-25' },
        reserve: { dates: ['2026-05-26', '2026-05-27', '2026-05-28'] },
        holiday: { dates: ['2026-05-10', '2026-05-17', '2026-05-24'] },
      },
      tasks: {
        'construction-docs': { deadline: '2026-05-01', status: '完了' },
        'decision-notice': { deadline: '2026-05-04', status: '完了' },
        'schedule-deadline': { deadline: '2026-05-06', status: '完了' },
        'option-deadline': { deadline: '2026-05-08', status: '進行中' },
        'option-order': { deadline: '2026-05-12', status: '進行中' },
        waste: { deadline: '2026-05-25', status: '未着手' },
      },
      documents: {
        proposal: { deadline: '2026-04-28', status: '完了' },
        'agency-order': { deadline: '2026-05-02', status: '完了' },
        fire: { deadline: '2026-05-07', status: '進行中' },
        'resident-guide': { deadline: '2026-05-14', status: '進行中' },
        'order-docs': { deadline: '2026-05-16', status: '未着手' },
        waste: { deadline: '2026-05-28', status: '未着手' },
      },
    },
    {
      id: 'p3',
      no: 3,
      title: '×●コーポC 新設工事',
      property: '×●コーポC',
      client: '×●コーポ管理会社',
      contractorId: '',
      assigneeId: '',
      segments: {},
      tasks: structuredClone(DEFAULT_PROJECT_TASKS),
      documents: structuredClone(DEFAULT_PROJECT_DOCUMENTS),
    },
  ];

  let rangeStart = startOfDay(new Date(2026, 4, 1));
  let activeProjectId = null;
  let activeItemsProjectId = null;
  const modalDayDrafts = new Map();

  const labor = {
    manabe: {
      '2026-05-18': 'p2',
      '2026-05-19': 'p2',
      '2026-05-20': 'p2',
      '2026-05-21': 'p2',
    },
    sato: {
      '2026-05-10': 'off',
      '2026-05-17': 'off',
      '2026-05-24': 'off',
    },
    suzuki: {
      '2026-05-08': 'p2',
      '2026-05-09': 'p2',
    },
  };

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseDateKey(key) {
    if (!key) return null;
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateLabel(key) {
    const date = parseDateKey(key);
    if (!date) return key;
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function dayIndex(date) {
    return Math.round((startOfDay(date) - rangeStart) / DAY_MS);
  }

  function getProjectNo(project) {
    return project?.no ?? '';
  }

  function formatProjectNoLabel(project) {
    return `${getProjectNo(project)}：${project.property}`;
  }

  function getContractor(id) {
    return CONTRACTORS.find((item) => item.id === id) || CONTRACTORS[0];
  }

  function getAssignee(id) {
    return ASSIGNEES.find((item) => item.id === id) || ASSIGNEES[0];
  }

  function segmentHasValue(segment, mode) {
    if (mode === 'days') return Array.isArray(segment?.dates) && segment.dates.length > 0;
    return Boolean(segment?.start && segment?.end);
  }

  function hasSegments(segments) {
    return SEGMENT_TYPES.some(({ key, mode }) => segmentHasValue(segments[key], mode));
  }

  function getHolidayName(date) {
    return window.JapaneseHolidays?.getHoliday(formatDateKey(date)) || null;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getBarAppearance(project, colorKey) {
    if (colorKey === 'reserve' || colorKey === 'holiday') {
      const palette = SEGMENT_PALETTE[colorKey];
      return {
        className: `bar is-segment-${colorKey}`,
        style: `background:${palette.bg};border-color:${palette.border};color:${palette.text}`,
      };
    }

    const contractor = getContractor(project.contractorId);
    const assigned = Boolean(project.contractorId);
    if (assigned) {
      return {
        className: 'bar is-assigned',
        style: `background:${contractor.bg};border-color:${contractor.border};color:${contractor.text}`,
      };
    }

    return { className: 'bar is-unassigned', style: '' };
  }

  function renderLegend() {
    if (!legendEl) return;
    const contractorItems = CONTRACTORS.filter((c) => c.id)
      .map(
        (c) =>
          `<span class="item"><span class="swatch" style="background:${c.bg};border-color:${c.border}"></span>${escapeHtml(c.label)}</span>`,
      )
      .join('');
    const segmentItems = Object.entries(SEGMENT_PALETTE)
      .map(
        ([key, palette]) =>
          `<span class="item"><span class="swatch is-segment-${key}" style="background:${palette.bg};border-color:${palette.border}"></span>${escapeHtml(palette.legend)}</span>`,
      )
      .join('');
    legendEl.innerHTML = `${contractorItems}${segmentItems}<span class="item"><span class="swatch is-unassigned"></span>施工業者未設定（破線）</span>`;
  }

  function renderSelectOptions(list, selectedId) {
    return list
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}"${item.id === selectedId ? ' selected' : ''}>${escapeHtml(item.label)}</option>`,
      )
      .join('');
  }

  const TRACK_GRID_ROWS = SEGMENT_TYPES.length;

  function renderDayHeaderCell(index) {
    const date = addDays(rangeStart, index);
    const dow = date.getDay();
    const isToday = formatDateKey(date) === formatDateKey(new Date());
    const holidayName = getHolidayName(date);
    const classes = [
      'day-head',
      dow === 0 ? 'is-sun' : '',
      dow === 6 ? 'is-sat' : '',
      holidayName ? 'is-holiday' : '',
      isToday ? 'is-today' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `<div class="${classes}" data-day-index="${index}" style="grid-column:${index + 1}" title="${holidayName || ''}">
      <span class="md">${date.getMonth() + 1}/${date.getDate()}</span>
      <span class="dow">${WEEKDAYS[dow]}</span>
    </div>`;
  }

  function renderBarMarkup({
    className,
    style,
    title,
    label,
    colStart,
    colEnd,
    gridRow,
    extraClass = '',
  }) {
    return `<div class="${className}${extraClass ? ` ${extraClass}` : ''}" style="grid-column:${colStart}/${colEnd};grid-row:${gridRow};${style}" title="${title}">
      <span class="label">${label}</span>
    </div>`;
  }

  function renderBars(project) {
    const bars = [];

    SEGMENT_TYPES.forEach(({ key, label, short, mode, color }, rowIndex) => {
      const segment = project.segments[key];
      if (!segmentHasValue(segment, mode)) return;

      const { className, style } = getBarAppearance(project, color);
      const gridRow = rowIndex + 1;

      if (mode === 'days') {
        segment.dates.forEach((dateKey) => {
          const date = parseDateKey(dateKey);
          if (!date) return;

          const idx = dayIndex(date);
          if (idx < 0 || idx >= VISIBLE_DAYS) return;

          const colStart = idx + 1;
          const colEnd = idx + 2;
          bars.push(
            renderBarMarkup({
              className,
              style,
              title: `${escapeHtml(label)}: ${formatDateLabel(dateKey)}`,
              label: escapeHtml(short),
              colStart,
              colEnd,
              gridRow,
              extraClass: 'is-day',
            }),
          );
        });
        return;
      }

      const start = parseDateKey(segment.start);
      const end = parseDateKey(segment.end);
      if (!start || !end) return;

      const startIdx = dayIndex(start);
      const endIdx = dayIndex(end) + 1;
      if (endIdx <= 0 || startIdx >= VISIBLE_DAYS) return;

      const colStart = Math.max(1, startIdx + 1);
      const colEnd = Math.min(VISIBLE_DAYS + 1, endIdx + 1);
      if (colStart >= colEnd) return;

      bars.push(
        renderBarMarkup({
          className,
          style,
          title: `${escapeHtml(label)}: ${segment.start} 〜 ${segment.end}`,
          label: escapeHtml(short),
          colStart,
          colEnd,
          gridRow,
        }),
      );
    });

    return bars.join('');
  }

  function renderDayCell(index) {
    const date = addDays(rangeStart, index);
    const dow = date.getDay();
    const holidayName = getHolidayName(date);
    const classes = [
      'day-cell',
      dow === 0 ? 'is-sun' : '',
      dow === 6 ? 'is-sat' : '',
      holidayName ? 'is-holiday' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `<div class="${classes}" style="grid-column:${index + 1}" aria-hidden="true"></div>`;
  }

  function ensureProjectItems(project) {
    if (!project.tasks) project.tasks = structuredClone(DEFAULT_PROJECT_TASKS);
    if (!project.documents) project.documents = structuredClone(DEFAULT_PROJECT_DOCUMENTS);
  }

  function getItemStatusClass(status) {
    if (status === '完了') return 'is-status-done';
    if (status === '進行中') return 'is-status-progress';
    return 'is-status-pending';
  }

  function renderStatusOptions(selected) {
    return ITEM_STATUSES.map(
      (status) =>
        `<option value="${escapeHtml(status)}"${status === selected ? ' selected' : ''}>${escapeHtml(status)}</option>`,
    ).join('');
  }

  function applyItemCardStatus(card, status) {
    if (!card) return;
    const nextStatus = status || '未着手';
    card.dataset.status = nextStatus;
    card.classList.remove('is-status-pending', 'is-status-progress', 'is-status-done');
    card.classList.add(getItemStatusClass(nextStatus));

    const badge = card.querySelector('[data-schedule-item-status-badge]');
    if (badge) {
      badge.textContent = nextStatus;
      badge.classList.remove('is-status-pending', 'is-status-progress', 'is-status-done');
      badge.classList.add(getItemStatusClass(nextStatus));
    }
  }

  function renderItemCard(projectId, kind, itemKey, label, item) {
    const status = item?.status || '未着手';
    const statusClass = getItemStatusClass(status);
    const deadline = item?.deadline || '';
    const deadlineLabel = deadline ? formatDateLabel(deadline) : '—';
    const statusAttr = kind === 'tasks' ? 'data-schedule-task-status' : 'data-schedule-document-status';

    return `
      <article class="document-box document-box--item ${statusClass}" data-status="${escapeHtml(status)}" data-project-id="${escapeHtml(projectId)}" data-item-kind="${kind}" data-item-key="${escapeHtml(itemKey)}">
        <div class="document-box-head">
          <p class="label">${escapeHtml(label)}</p>
          <span class="ui-badge document-status-badge ${statusClass}" data-schedule-item-status-badge>${escapeHtml(status)}</span>
        </div>
        <dl class="document-item-meta">
          <div>
            <dt>期限</dt>
            <dd><time datetime="${escapeHtml(deadline)}">${escapeHtml(deadlineLabel)}</time></dd>
          </div>
          <div>
            <dt>ステータス</dt>
            <dd>
              <select class="ui-control" ${statusAttr} aria-label="${escapeHtml(label)}のステータス">
                ${renderStatusOptions(status)}
              </select>
            </dd>
          </div>
        </dl>
      </article>
    `;
  }

  function renderProjectItemsGrid(project, kind, definitions, gridEl) {
    if (!gridEl) return;
    ensureProjectItems(project);
    const store = kind === 'tasks' ? project.tasks : project.documents;

    gridEl.innerHTML = definitions
      .map(({ key, label }) => renderItemCard(project.id, kind, key, label, store[key]))
      .join('');
  }

  function renderInfoPanel(project) {
    return `
      <div class="info" data-project-id="${escapeHtml(project.id)}">
        <p class="title"><span class="project-no" aria-hidden="true">${getProjectNo(project)}</span>${escapeHtml(project.title)}</p>
        <dl class="meta">
          <div><dt>物件名</dt><dd>${escapeHtml(project.property)}</dd></div>
          <div><dt>受注先</dt><dd>${escapeHtml(project.client)}</dd></div>
          <div>
            <dt>施工業者</dt>
            <dd>
              <select class="ui-control" data-schedule-contractor aria-label="施工業者">
                ${renderSelectOptions(CONTRACTORS, project.contractorId)}
              </select>
            </dd>
          </div>
          <div>
            <dt>担当</dt>
            <dd>
              <select class="ui-control" data-schedule-assignee aria-label="担当">
                ${renderSelectOptions(ASSIGNEES, project.assigneeId)}
              </select>
            </dd>
          </div>
        </dl>
        <div class="info-actions">
          <button type="button" class="ui-btn--outline ui-btn--sm" data-schedule-open-tasks>タスク一覧</button>
          <button type="button" class="ui-btn--outline ui-btn--sm" data-schedule-open-documents>提出書類</button>
        </div>
      </div>
    `;
  }

  function renderTimelineHeadRow() {
    const dayHeaders = Array.from({ length: VISIBLE_DAYS }, (_, i) => renderDayHeaderCell(i)).join('');
    return `<div class="schedule-row is-head">${dayHeaders}</div>`;
  }

  function getLaborAssignment(staffId, dateKey) {
    return labor[staffId]?.[dateKey] ?? '';
  }

  function setLaborAssignment(staffId, dateKey, value) {
    if (!labor[staffId]) labor[staffId] = {};
    if (!value) delete labor[staffId][dateKey];
    else labor[staffId][dateKey] = value;
  }

  function renderLaborDayHead(index) {
    const date = addDays(rangeStart, index);
    const dow = date.getDay();
    const isToday = formatDateKey(date) === formatDateKey(new Date());
    const holidayName = getHolidayName(date);
    const classes = [
      'day-head',
      'labor-day-head',
      dow === 0 ? 'is-sun' : '',
      dow === 6 ? 'is-sat' : '',
      holidayName ? 'is-holiday' : '',
      isToday ? 'is-today' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `<div class="${classes}" data-labor-day-index="${index}" style="grid-column:${index + 1}" title="${holidayName || ''}">
      <span class="md">${date.getMonth() + 1}/${date.getDate()}</span>
      <span class="dow">${WEEKDAYS[dow]}</span>
    </div>`;
  }

  function renderLaborChip(value) {
    if (value === 'off') {
      return `<div class="labor-chip is-off" title="休工"><span class="labor-chip-title">休</span></div>`;
    }

    const project = projects.find((item) => item.id === value);
    if (!project) return '';

    const contractor = getContractor(project.contractorId);
    const style = project.contractorId
      ? `style="background:${contractor.bg};border-color:${contractor.border};color:${contractor.text}"`
      : '';
    const className = project.contractorId ? 'labor-chip is-assigned' : 'labor-chip is-unassigned';

    return `<div class="${className}" ${style} title="${escapeHtml(formatProjectNoLabel(project))} — ${escapeHtml(project.title)}">
      <span class="labor-chip-title">${getProjectNo(project)}</span>
    </div>`;
  }

  function renderLaborProjectLegend() {
    return projects
      .map(
        (project) =>
          `<span class="item"><span class="project-no">${getProjectNo(project)}</span><span class="name">${escapeHtml(project.property)}</span></span>`,
      )
      .join('');
  }

  function renderLaborDayCell(staffId, index) {
    const date = addDays(rangeStart, index);
    const dateKey = formatDateKey(date);
    const dow = date.getDay();
    const holidayName = getHolidayName(date);
    const staff = STAFF.find((item) => item.id === staffId);
    const value = getLaborAssignment(staffId, dateKey);
    const classes = [
      'labor-day-cell',
      dow === 0 ? 'is-sun' : '',
      dow === 6 ? 'is-sat' : '',
      holidayName ? 'is-holiday' : '',
      value === 'off' ? 'is-off-day' : '',
      value && value !== 'off' ? 'is-assigned-day' : '',
      !value ? 'is-empty' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const cellLabel = value
      ? `${staff?.name || ''} ${formatDateLabel(dateKey)} 案件${value === 'off' ? '休工' : getProjectNo(projects.find((p) => p.id === value))}`
      : `${staff?.name || ''} ${formatDateLabel(dateKey)} 案件を選択`;

    const content = value
      ? renderLaborChip(value)
      : '<span class="labor-empty-hint" aria-hidden="true">＋</span>';

    return `<button
      type="button"
      class="${classes}"
      style="grid-column:${index + 1}"
      data-labor-cell
      data-labor-staff="${escapeHtml(staffId)}"
      data-labor-date="${dateKey}"
      aria-label="${escapeHtml(cellLabel)}"
      aria-haspopup="dialog"
      aria-expanded="false"
    >${content}</button>`;
  }

  function renderLaborPickerChoices(currentValue) {
    const chips = [
      `<button type="button" class="labor-pick-chip is-clear${currentValue === '' ? ' is-selected' : ''}" data-labor-pick="">未選択</button>`,
      `<button type="button" class="labor-pick-chip is-off${currentValue === 'off' ? ' is-selected' : ''}" data-labor-pick="off" title="休工">休</button>`,
      ...projects.map((project) => {
        const contractor = getContractor(project.contractorId);
        const selected = project.id === currentValue ? ' is-selected' : '';
        const style = project.contractorId
          ? `style="background:${contractor.bg};border-color:${contractor.border};color:${contractor.text}"`
          : '';
        const unassigned = project.contractorId ? '' : ' is-unassigned';
        return `<button type="button" class="labor-pick-chip is-project${unassigned}${selected}" data-labor-pick="${escapeHtml(project.id)}" title="${escapeHtml(formatProjectNoLabel(project))}" ${style}>${getProjectNo(project)}</button>`;
      }),
    ];
    return chips.join('');
  }

  function closeLaborPicker() {
    if (laborPickerEl) laborPickerEl.hidden = true;
    if (activeLaborPickerCell) {
      activeLaborPickerCell.setAttribute('aria-expanded', 'false');
      activeLaborPickerCell = null;
    }
  }

  function positionLaborPicker(anchor) {
    if (!laborPickerEl) return;

    laborPickerEl.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const pickerRect = laborPickerEl.getBoundingClientRect();
    const margin = 8;
    let left = rect.left;
    let top = rect.bottom + margin;

    if (left + pickerRect.width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - pickerRect.width - margin);
    }
    if (top + pickerRect.height > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - pickerRect.height - margin);
    }

    laborPickerEl.style.left = `${left}px`;
    laborPickerEl.style.top = `${top}px`;
  }

  function openLaborPicker(cell) {
    if (!laborPickerEl || !laborPickerOptionsEl) return;

    if (activeLaborPickerCell === cell) {
      closeLaborPicker();
      return;
    }

    closeLaborPicker();

    const staffId = cell.dataset.laborStaff;
    const dateKey = cell.dataset.laborDate;
    const staff = STAFF.find((item) => item.id === staffId);
    const value = getLaborAssignment(staffId, dateKey);

    activeLaborPickerCell = cell;
    cell.setAttribute('aria-expanded', 'true');

    if (laborPickerTitleEl) {
      laborPickerTitleEl.textContent = `${staff?.name || ''} — ${formatDateLabel(dateKey)}`;
    }
    laborPickerOptionsEl.innerHTML = renderLaborPickerChoices(value);

    positionLaborPicker(cell);
    laborPickerEl.querySelector('.labor-pick-chip')?.focus();
  }

  function applyLaborAssignment(staffId, dateKey, value) {
    setLaborAssignment(staffId, dateKey, value);
    closeLaborPicker();

    const scrollLeft = board.querySelector('[data-schedule-scroll]')?.scrollLeft ?? 0;
    renderLaborBoard();
    bindScrollSync();
    const ganttScroll = board.querySelector('[data-schedule-scroll]');
    const laborScroll = laborBoard?.querySelector('[data-labor-scroll]');
    if (ganttScroll) ganttScroll.scrollLeft = scrollLeft;
    if (laborScroll) laborScroll.scrollLeft = scrollLeft;
    requestAnimationFrame(syncLaborLayout);

    if (value && value !== 'off') {
      const project = projects.find((item) => item.id === value);
      if (project) {
        window.MotherMapShell?.showToast(
          `${formatDateLabel(dateKey)}を案件${getProjectNo(project)}（${project.property}）に設定しました`,
        );
      }
    } else if (value === 'off') {
      window.MotherMapShell?.showToast(`${formatDateLabel(dateKey)}を休工に設定しました`);
    } else {
      window.MotherMapShell?.showToast(`${formatDateLabel(dateKey)}の割当を解除しました`);
    }
  }

  function renderLaborStaffLabel(staff) {
    return `<div class="labor-staff-info">
      <p class="title">${escapeHtml(staff.name)}</p>
      <p class="role">${escapeHtml(staff.role)}</p>
    </div>`;
  }

  function renderLaborBoard() {
    if (!laborBoard) return;

    closeLaborPicker();

    if (laborProjectLegendEl) {
      laborProjectLegendEl.innerHTML = renderLaborProjectLegend();
    }

    const dayHeaders = Array.from({ length: VISIBLE_DAYS }, (_, i) => renderLaborDayHead(i)).join('');
    const staffLabels = STAFF.map((staff) => renderLaborStaffLabel(staff)).join('');
    const staffRows = STAFF.map(
      (staff) => `
        <div class="labor-row">
          ${Array.from({ length: VISIBLE_DAYS }, (_, i) => renderLaborDayCell(staff.id, i)).join('')}
        </div>
      `,
    ).join('');

    laborBoard.innerHTML = `
      <div class="labor-board-layout">
        <div class="labels-pane labor-labels-pane">
          <div class="corner">
            <span class="corner-label">担当者</span>
          </div>
          ${staffLabels}
        </div>
        <div class="timeline-pane labor-timeline-pane" data-labor-scroll>
          <div class="labor-timeline-body" style="--ps-days:${VISIBLE_DAYS}">
            <div class="labor-head-row">${dayHeaders}</div>
            ${staffRows}
          </div>
        </div>
      </div>
    `;
  }

  function bindScrollSync() {
    const ganttScroll = board.querySelector('[data-schedule-scroll]');
    const laborScroll = laborBoard?.querySelector('[data-labor-scroll]');
    if (!ganttScroll || !laborScroll) return;

    laborScroll.scrollLeft = ganttScroll.scrollLeft;
    ganttScroll.onscroll = () => {
      laborScroll.scrollLeft = ganttScroll.scrollLeft;
    };
    laborScroll.onscroll = () => {
      ganttScroll.scrollLeft = laborScroll.scrollLeft;
    };
  }

  function syncLaborHeadHeight() {
    const corner = laborBoard?.querySelector('.labor-labels-pane .corner');
    const headRow = laborBoard?.querySelector('.labor-head-row');
    if (!corner || !headRow) return;

    corner.style.height = '';
    corner.style.minHeight = '';
    headRow.style.height = '';
    headRow.style.minHeight = '';

    const headHeight = Math.max(corner.offsetHeight, headRow.offsetHeight);
    corner.style.height = `${headHeight}px`;
    corner.style.minHeight = `${headHeight}px`;
    headRow.style.height = `${headHeight}px`;
    headRow.style.minHeight = `${headHeight}px`;
  }

  function syncLaborRowHeights() {
    const labels = laborBoard?.querySelectorAll('.labor-staff-info');
    const rows = laborBoard?.querySelectorAll('.labor-row');
    if (!labels?.length || !rows?.length) return;

    labels.forEach((label, index) => {
      const row = rows[index];
      if (!row) return;
      label.style.minHeight = '';
      row.style.minHeight = '';
      const rowHeight = Math.max(label.offsetHeight, row.offsetHeight);
      label.style.minHeight = `${rowHeight}px`;
      row.style.minHeight = `${rowHeight}px`;
    });
  }

  function syncLaborLayout() {
    syncLaborHeadHeight();
    syncLaborRowHeights();
  }

  function renderTimelineRow(project) {
    const empty = !hasSegments(project.segments);
    const dayCells = Array.from({ length: VISIBLE_DAYS }, (_, i) => renderDayCell(i)).join('');
    const bars = renderBars(project);
    const rowClass = empty ? 'schedule-row is-empty' : 'schedule-row';

    return `
      <div
        class="${rowClass}"
        data-schedule-track
        data-project-id="${escapeHtml(project.id)}"
        role="button"
        tabindex="0"
        aria-label="${escapeHtml(project.title)}の工期を登録"
      >
        <div class="day-lanes" aria-hidden="true">${dayCells}</div>
        <div class="track-grid">
          ${bars}
          ${empty ? `<span class="empty-hint" style="grid-column:1 / span ${VISIBLE_DAYS};grid-row:1 / span ${TRACK_GRID_ROWS}">クリックして工期を登録</span>` : ''}
        </div>
      </div>
    `;
  }

  function syncRowHeights() {
    const corner = board.querySelector('.corner');
    const headRow = board.querySelector('.timeline-pane .schedule-row.is-head');
    if (corner && headRow) {
      const headHeight = Math.max(corner.offsetHeight, headRow.offsetHeight);
      corner.style.minHeight = `${headHeight}px`;
      headRow.style.minHeight = `${headHeight}px`;
    }

    const infos = board.querySelectorAll('.labels-pane .info[data-project-id]');
    const timelineRows = board.querySelectorAll('.timeline-pane .schedule-row[data-schedule-track]');
    infos.forEach((info, index) => {
      const timelineRow = timelineRows[index];
      if (!timelineRow) return;

      timelineRow.style.minHeight = '';
      info.style.minHeight = '';

      const timelineHeight = timelineRow.offsetHeight;
      const infoHeight = info.offsetHeight;
      const rowHeight = Math.max(timelineHeight, infoHeight);

      info.style.minHeight = `${rowHeight}px`;
      if (infoHeight > timelineHeight) {
        timelineRow.style.minHeight = `${rowHeight}px`;
      }
    });
  }

  function syncRangeStartInput() {
    if (rangeStartInput) {
      rangeStartInput.value = formatDateKey(rangeStart);
    }
  }

  function setRangeStart(date) {
    rangeStart = startOfDay(date);
    renderBoard();
  }

  function renderBoard() {
    const rangeEnd = addDays(rangeStart, VISIBLE_DAYS - 1);
    syncRangeStartInput();
    if (periodEl) {
      periodEl.textContent = `${rangeStart.getFullYear()}年${rangeStart.getMonth() + 1}月${rangeStart.getDate()}日 〜 ${rangeEnd.getMonth() + 1}月${rangeEnd.getDate()}日`;
    }

    board.innerHTML = `
      <div class="board-layout">
        <div class="labels-pane">
          <div class="corner">
            <span class="corner-label">案件</span>
          </div>
          ${projects.map((project) => renderInfoPanel(project)).join('')}
        </div>
        <div class="timeline-pane" data-schedule-scroll>
          <div class="timeline-body" style="--ps-days:${VISIBLE_DAYS};--ps-track-rows:${TRACK_GRID_ROWS}">
            ${renderTimelineHeadRow()}
            ${projects.map((project) => renderTimelineRow(project)).join('')}
          </div>
        </div>
      </div>
    `;

    renderLaborBoard();
    bindScrollSync();

    requestAnimationFrame(() => {
      syncRowHeights();
      syncLaborLayout();
      requestAnimationFrame(() => {
        syncRowHeights();
        syncLaborLayout();
      });
    });
  }

  function getMultiDayDraft(key) {
    if (!modalDayDrafts.has(key)) modalDayDrafts.set(key, []);
    return modalDayDrafts.get(key);
  }

  function renderMultiDayList(key) {
    const list = modal?.querySelector(`[data-multi-day-list="${key}"]`);
    if (!list) return;

    const dates = getMultiDayDraft(key);
    if (!dates.length) {
      list.innerHTML = '<li class="empty">登録された日付はありません</li>';
      return;
    }

    list.innerHTML = dates
      .map(
        (dateKey) => `
          <li>
            <span>${escapeHtml(formatDateLabel(dateKey))}</span>
            <button type="button" class="remove" data-multi-day-remove="${key}" data-date="${escapeHtml(dateKey)}" aria-label="${escapeHtml(formatDateLabel(dateKey))}を削除">
              <span class="material-symbols-rounded" aria-hidden="true">close</span>
            </button>
          </li>
        `,
      )
      .join('');
  }

  function populateModal(project) {
    SEGMENT_TYPES.forEach(({ key, mode }) => {
      const segment = project.segments[key];

      if (mode === 'days') {
        const dates = Array.isArray(segment?.dates) ? [...segment.dates].sort() : [];
        modalDayDrafts.set(key, dates);
        renderMultiDayList(key);
        const input = modal?.querySelector(`[data-multi-day-input="${key}"]`);
        if (input) input.value = '';
        return;
      }

      const range = segment || {};
      taskForm?.querySelectorAll(`[data-segment="${key}"]`).forEach((input) => {
        const bound = input.dataset.bound;
        input.value = bound === 'start' ? range.start || '' : range.end || '';
      });
    });
  }

  function setModalProjectLabel(el, project) {
    if (el) el.textContent = `${project.property} — ${project.title}`;
  }

  function openProjectTasksModal(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !tasksModal) return;

    activeItemsProjectId = projectId;
    setModalProjectLabel(tasksModalProjectEl, project);
    renderProjectItemsGrid(project, 'tasks', PROJECT_TASK_ITEMS, tasksGridEl);
    window.MotherMapShell?.openModal(tasksModal);
  }

  function openProjectDocumentsModal(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !documentsModal) return;

    activeItemsProjectId = projectId;
    setModalProjectLabel(documentsModalProjectEl, project);
    renderProjectItemsGrid(project, 'documents', PROJECT_DOCUMENT_ITEMS, documentsGridEl);
    window.MotherMapShell?.openModal(documentsModal);
  }

  function updateProjectItemStatus(projectId, kind, itemKey, status) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    ensureProjectItems(project);
    const store = kind === 'tasks' ? project.tasks : project.documents;
    if (!store[itemKey]) store[itemKey] = { deadline: '', status: '未着手' };
    store[itemKey].status = status;

    const definitions = kind === 'tasks' ? PROJECT_TASK_ITEMS : PROJECT_DOCUMENT_ITEMS;
    const label = definitions.find((item) => item.key === itemKey)?.label || itemKey;
    window.MotherMapShell?.showToast(`「${label}」を「${status}」に変更しました`);
  }

  function openTaskModal(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !modal) return;

    activeProjectId = projectId;
    modalDayDrafts.clear();
    if (modalProjectEl) {
      modalProjectEl.textContent = `${project.property} — ${project.title}`;
    }

    populateModal(project);
    window.MotherMapShell?.openModal(modal);
  }

  function addMultiDay(key) {
    const input = modal?.querySelector(`[data-multi-day-input="${key}"]`);
    const value = input?.value;
    if (!value) {
      window.MotherMapShell?.showToast('日付を選択してください');
      return;
    }

    const draft = getMultiDayDraft(key);
    if (!draft.includes(value)) draft.push(value);
    draft.sort();
    renderMultiDayList(key);
    if (input) input.value = '';
  }

  function removeMultiDay(key, dateKey) {
    const draft = getMultiDayDraft(key);
    const next = draft.filter((item) => item !== dateKey);
    modalDayDrafts.set(key, next);
    renderMultiDayList(key);
  }

  function saveTaskModal() {
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;

    const nextSegments = {};
    SEGMENT_TYPES.forEach(({ key, mode }) => {
      if (mode === 'days') {
        const dates = getMultiDayDraft(key);
        if (dates.length) nextSegments[key] = { dates: [...dates] };
        return;
      }

      const startInput = taskForm?.querySelector(`[data-segment="${key}"][data-bound="start"]`);
      const endInput = taskForm?.querySelector(`[data-segment="${key}"][data-bound="end"]`);
      const start = startInput?.value || '';
      const end = endInput?.value || '';
      if (start && end) nextSegments[key] = { start, end };
    });

    project.segments = nextSegments;
    modalDayDrafts.clear();
    window.MotherMapShell?.closeModal(modal);
    window.MotherMapShell?.showToast('工期を登録しました');
    renderBoard();
  }

  function shiftRange(days) {
    setRangeStart(addDays(rangeStart, days));
  }

  function goToToday() {
    const today = startOfDay(new Date());
    setRangeStart(addDays(today, -7));

    const todayIndex = dayIndex(today);
    const scrollPane = board.querySelector('[data-schedule-scroll]');
    const head = board.querySelector(`[data-day-index="${todayIndex}"]`);
    if (!scrollPane || !head) return;

    const headRect = head.getBoundingClientRect();
    const paneRect = scrollPane.getBoundingClientRect();
    const offset =
      scrollPane.scrollLeft +
      (headRect.left - paneRect.left) -
      scrollPane.clientWidth / 2 +
      headRect.width / 2;
    scrollPane.scrollTo({
      left: Math.max(0, offset),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  prevBtn?.addEventListener('click', () => shiftRange(-7));
  nextBtn?.addEventListener('click', () => shiftRange(7));
  todayBtn?.addEventListener('click', goToToday);

  rangeStartInput?.addEventListener('change', () => {
    const parsed = parseDateKey(rangeStartInput.value);
    if (!parsed) {
      syncRangeStartInput();
      return;
    }
    setRangeStart(parsed);
  });

  filterSelect?.addEventListener('change', (event) => {
    window.MotherMapShell?.showToast(
      `表示を「${event.target.selectedOptions[0]?.text || ''}」に切り替えました（デモ）`,
    );
  });

  board.addEventListener('click', (event) => {
    const openTasksBtn = event.target.closest('[data-schedule-open-tasks]');
    if (openTasksBtn) {
      event.preventDefault();
      event.stopPropagation();
      const info = openTasksBtn.closest('.info[data-project-id]');
      if (info) openProjectTasksModal(info.dataset.projectId);
      return;
    }

    const openDocumentsBtn = event.target.closest('[data-schedule-open-documents]');
    if (openDocumentsBtn) {
      event.preventDefault();
      event.stopPropagation();
      const info = openDocumentsBtn.closest('.info[data-project-id]');
      if (info) openProjectDocumentsModal(info.dataset.projectId);
      return;
    }

    if (event.target.closest('.info')) return;

    const bar = event.target.closest('.bar');
    if (bar) {
      event.stopPropagation();
      const row = bar.closest('[data-schedule-track]');
      if (row) openTaskModal(row.dataset.projectId);
      return;
    }

    const row = event.target.closest('[data-schedule-track]');
    if (!row) return;
    openTaskModal(row.dataset.projectId);
  });

  board.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('[data-schedule-track]');
    if (!row || event.target.closest('.info')) return;
    event.preventDefault();
    openTaskModal(row.dataset.projectId);
  });

  root.addEventListener('click', (event) => {
    const pickChip = event.target.closest('[data-labor-pick]');
    if (pickChip && laborPickerEl && !laborPickerEl.hidden) {
      event.preventDefault();
      if (!activeLaborPickerCell) return;
      const staffId = activeLaborPickerCell.dataset.laborStaff;
      const dateKey = activeLaborPickerCell.dataset.laborDate;
      applyLaborAssignment(staffId, dateKey, pickChip.dataset.laborPick ?? '');
      return;
    }

    const laborCell = event.target.closest('[data-labor-cell]');
    if (laborCell) {
      event.preventDefault();
      openLaborPicker(laborCell);
      return;
    }

    if (laborPickerEl && !laborPickerEl.hidden && !event.target.closest('[data-labor-picker]')) {
      closeLaborPicker();
    }
  });

  document.addEventListener('click', (event) => {
    if (!laborPickerEl || laborPickerEl.hidden) return;
    if (root.contains(event.target) || laborPickerEl.contains(event.target)) return;
    closeLaborPicker();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLaborPicker();
  });

  function bindItemsModalStatusChange(modalEl, kind) {
    modalEl?.addEventListener('change', (event) => {
      const select = event.target.closest(
        kind === 'tasks' ? '[data-schedule-task-status]' : '[data-schedule-document-status]',
      );
      if (!select) return;

      const card = select.closest('[data-item-key]');
      if (!card) return;

      const projectId = card.dataset.projectId || activeItemsProjectId;
      const itemKey = card.dataset.itemKey;
      if (!projectId || !itemKey) return;

      updateProjectItemStatus(projectId, kind, itemKey, select.value);
      applyItemCardStatus(card, select.value);
    });
  }

  bindItemsModalStatusChange(tasksModal, 'tasks');
  bindItemsModalStatusChange(documentsModal, 'documents');

  root.addEventListener('change', (event) => {
    const info = event.target.closest('.info[data-project-id]');
    if (!info) return;

    const project = projects.find((p) => p.id === info.dataset.projectId);
    if (!project) return;

    if (event.target.matches('[data-schedule-contractor]')) {
      project.contractorId = event.target.value;
      const label = getContractor(project.contractorId).label;
      renderBoard();
      window.MotherMapShell?.showToast(`施工業者を「${label}」に変更しました`);
      return;
    }

    if (event.target.matches('[data-schedule-assignee]')) {
      project.assigneeId = event.target.value;
      const label = getAssignee(project.assigneeId).label;
      window.MotherMapShell?.showToast(`担当を「${label}」に変更しました`);
    }
  });

  modal?.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-multi-day-add]');
    if (addBtn) {
      event.preventDefault();
      addMultiDay(addBtn.dataset.multiDayAdd);
      return;
    }

    const removeBtn = event.target.closest('[data-multi-day-remove]');
    if (removeBtn) {
      event.preventDefault();
      removeMultiDay(removeBtn.dataset.multiDayRemove, removeBtn.dataset.date);
    }
  });

  saveBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    saveTaskModal();
  });

  taskForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    saveTaskModal();
  });

  window.addEventListener('resize', () => {
    if (board.querySelector('.timeline-pane')) syncRowHeights();
    if (laborBoard?.querySelector('.labor-timeline-pane')) syncLaborLayout();
    if (activeLaborPickerCell) positionLaborPicker(activeLaborPickerCell);
  });

  window.addEventListener('scroll', () => {
    if (activeLaborPickerCell) positionLaborPicker(activeLaborPickerCell);
  }, true);

  renderLegend();
  renderBoard();
})();
