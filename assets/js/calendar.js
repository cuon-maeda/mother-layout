(() => {
  const root = document.querySelector('[data-work-calendar]');
  if (!root) return;

  const panel = root.querySelector('[data-calendar-panel]');
  const titleEl = root.querySelector('[data-calendar-title]');
  const viewTabs = root.querySelectorAll('[data-calendar-view]');
  const prevBtn = root.querySelector('[data-calendar-prev]');
  const nextBtn = root.querySelector('[data-calendar-next]');
  const todayBtn = root.querySelector('[data-calendar-today]');
  const printBtn = root.querySelector('[data-calendar-print]');

  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

  const TASK_TYPES = {
    site: { icon: 'construction', label: '現場工事' },
    survey: { icon: 'sensors', label: '設備調査' },
    meeting: { icon: 'groups', label: '住民説明' },
    handover: { icon: 'verified', label: '試運転・引渡' },
    office: { icon: 'description', label: '事務・連絡' },
    remaining: { icon: 'home_repair_service', label: '残工事' },
  };

  const SAMPLE_ASSIGNEES = ['真鍋 智彦', '佐藤 誠', '鈴木 雅人'];
  const SAMPLE_NOTES = [
    'エントランス親機は先行入替済み。各戸子機は午後から順次対応。',
    '管理室の配線図と実測の差異を当日確認すること。',
    '住民説明会は2階集会室。プロジェクターとマイクを前日確認済み。',
    '試運転前に共用部の音量バランスを最終調整する。',
    '届出書類は電子申請。紙の控えは現場フォルダへ保管。',
    'アフターフォローは管理会社経由で連絡予定。',
    '搬入経路は南側搬入口。エレベーター予約 08:00〜。',
    '残工事は101号室・205号室の子機ラベル貼付のみ。',
  ];

  const SAMPLE_TASKS = [
    {
      id: 't1',
      title: '〇●マンションA インターホン機器取付',
      type: 'site',
      start: '2026-05-18',
      end: '2026-05-18',
      time: '09:00-16:00',
      done: false,
    },
    {
      id: 't3',
      title: '×●コーポC 事前設備調査',
      type: 'survey',
      start: '2026-05-12',
      end: '2026-05-12',
      done: true,
    },
    {
      id: 't4',
      title: '〇●マンションA 住民説明会',
      type: 'meeting',
      start: '2026-05-20',
      end: '2026-05-20',
      time: '14:00-16:30',
      done: false,
    },
    {
      id: 't6',
      title: '工事届・完了報告書提出',
      type: 'office',
      start: '2026-05-19',
      end: '2026-05-19',
      done: true,
    },
    {
      id: 't8',
      title: 'アフターフォロー電話（完了分）',
      type: 'office',
      start: '2026-05-08',
      end: '2026-05-08',
      done: true,
    },
    {
      id: 't9',
      title: '管理組合 定例打合せ',
      type: 'meeting',
      start: '2026-05-15',
      end: '2026-05-15',
      time: '10:00-11:00',
      done: true,
    },
    {
      id: 't11',
      title: '△■マンションB 試聴調整・音量残',
      type: 'remaining',
      start: '2026-05-18',
      end: '2026-05-18',
      time: '13:00-17:00',
      done: false,
    },
    {
      id: 't13',
      title: '◇◇ビル 5F 親機交換 残',
      type: 'remaining',
      start: '2026-05-27',
      end: '2026-05-27',
      time: '08:30-12:00',
      done: false,
    },
    {
      id: 't14',
      title: '〇●マンションA 試聴立会（完了）',
      type: 'site',
      start: '2026-05-19',
      end: '2026-05-19',
      time: '10:00-11:30',
      done: true,
    },
    {
      id: 't15',
      title: '〇●マンションA 朝礼・KY活動',
      type: 'meeting',
      start: '2026-05-18',
      end: '2026-05-18',
      time: '08:00-08:30',
      done: true,
    },
    {
      id: 't16',
      title: '△■マンションB 親機室 現場確認',
      type: 'survey',
      start: '2026-05-18',
      end: '2026-05-18',
      time: '07:30-08:00',
      done: false,
    },
    {
      id: 't17',
      title: '管理会社へ当日進捗連絡',
      type: 'office',
      start: '2026-05-18',
      end: '2026-05-18',
      time: '17:30-18:00',
      done: false,
    },
    {
      id: 't18',
      title: '試運転前 最終配線チェック',
      type: 'handover',
      start: '2026-05-19',
      end: '2026-05-19',
      time: '14:00-15:30',
      done: false,
    },
    {
      id: 't19',
      title: '施主立会（内見対応）',
      type: 'meeting',
      start: '2026-05-19',
      end: '2026-05-19',
      time: '11:00-12:00',
      done: false,
    },
    {
      id: 't20',
      title: '各戸 子機ラベル貼付 残',
      type: 'remaining',
      start: '2026-05-19',
      end: '2026-05-19',
      time: '15:30-17:00',
      done: false,
    },
    {
      id: 't22',
      title: '×●コーポC 配線ルート再調査',
      type: 'survey',
      start: '2026-05-15',
      end: '2026-05-15',
      time: '13:00-15:00',
      done: false,
    },
    {
      id: 't23',
      title: '△■マンションB 機器搬入',
      type: 'site',
      start: '2026-05-15',
      end: '2026-05-15',
      time: '08:30-11:30',
      done: false,
    },
    {
      id: 't24',
      title: '施工計画書 最終確認',
      type: 'office',
      start: '2026-05-15',
      end: '2026-05-15',
      time: '16:00-17:00',
      done: true,
    },
    {
      id: 't25',
      title: '共用部 配線トラブル対応 残',
      type: 'remaining',
      start: '2026-05-15',
      end: '2026-05-15',
      time: '15:00-16:00',
      done: false,
    },
    {
      id: 't26',
      title: '〇●マンションA 住民説明 資料準備',
      type: 'office',
      start: '2026-05-20',
      end: '2026-05-20',
      time: '09:00-10:30',
      done: false,
    },
    {
      id: 't27',
      title: '会場設営・プロジェクター確認',
      type: 'site',
      start: '2026-05-20',
      end: '2026-05-20',
      time: '11:00-12:30',
      done: false,
    },
    {
      id: 't28',
      title: '説明会後 質疑メモ整理',
      type: 'office',
      start: '2026-05-20',
      end: '2026-05-20',
      time: '17:00-18:00',
      done: false,
    },
    {
      id: 't29',
      title: '試聴デモ機 予備調整',
      type: 'handover',
      start: '2026-05-20',
      end: '2026-05-20',
      time: '13:00-13:45',
      done: false,
    },
  ].map((task, index) => ({
    ...task,
    assignee: task.assignee ?? SAMPLE_ASSIGNEES[index % SAMPLE_ASSIGNEES.length],
    status: task.status ?? (task.done ? '完了' : index % 4 === 0 ? '未着手' : '進行中'),
    notes: task.notes ?? SAMPLE_NOTES[index % SAMPLE_NOTES.length],
  }));

  const taskModal = document.getElementById('calendar-task-modal');
  const taskModalTitle = taskModal?.querySelector('#calendar-task-modal-title');
  const taskModalPeriod = taskModal?.querySelector('[data-calendar-task-period]');
  const taskModalAssignee = taskModal?.querySelector('[data-calendar-task-assignee]');
  const taskModalStatus = taskModal?.querySelector('[data-calendar-task-status]');
  const taskModalNotes = taskModal?.querySelector('[data-calendar-task-notes]');
  const taskCompleteBtn = taskModal?.querySelector('[data-calendar-task-complete]');

  let activeTaskId = null;

  let view = 'month';
  let anchor = new Date(2026, 4, 18);

  const pad = (n) => String(n).padStart(2, '0');

  const toKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const parseKey = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const taskOnDay = (task, dayKey) => task.start === dayKey;

  const timeSortKey = (task) => (task.time ? task.time.split('-')[0] : '99:99');

  const sortDayTasks = (tasks) =>
    [...tasks].sort((a, b) => {
      const byTime = timeSortKey(a).localeCompare(timeSortKey(b));
      if (byTime !== 0) return byTime;
      return a.title.localeCompare(b.title, 'ja');
    });

  const formatMonthTitle = (date) => `${date.getFullYear()}年${date.getMonth() + 1}月`;

  const formatWeekTitle = (weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    if (sameMonth) {
      return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月 ${weekStart.getDate()}日〜${weekEnd.getDate()}日`;
    }
    return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日〜${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
  };

  const getMonthMatrix = (date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    const weeks = [];

    for (let w = 0; w < 6; w += 1) {
      const days = [];
      for (let d = 0; d < 7; d += 1) {
        days.push(addDays(start, w * 7 + d));
      }
      weeks.push(days);
    }

    return weeks;
  };

  const getWeekStart = (date) => addDays(startOfDay(date), -date.getDay());

  const escapeHtml = (value) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  const findTask = (taskId) => SAMPLE_TASKS.find((task) => task.id === taskId);

  const formatTaskPeriod = (task) => {
    const [y, m, d] = task.start.split('-');
    const dateLabel = `${y}/${m}/${d}`;
    if (task.time) {
      return `${dateLabel} ${task.time.replace('-', '〜')}`;
    }
    if (task.start !== task.end) {
      return `${task.start} 〜 ${task.end}`;
    }
    return dateLabel;
  };

  const renderStatusCell = (status) => {
    if (status === '完了') {
      return `<span class="ui-badge">${escapeHtml(status)}</span>`;
    }
    return escapeHtml(status);
  };

  const setTaskCompleteButton = (task) => {
    if (!taskCompleteBtn) return;
    const isDone = Boolean(task?.done);
    taskCompleteBtn.disabled = isDone;
    taskCompleteBtn.textContent = isDone ? '完了済み' : '完了';
    taskCompleteBtn.hidden = false;
  };

  const populateTaskModal = (task) => {
    if (!task || !taskModal) return;

    activeTaskId = task.id;
    if (taskModalTitle) taskModalTitle.textContent = task.title;
    if (taskModalPeriod) taskModalPeriod.textContent = formatTaskPeriod(task);
    if (taskModalAssignee) taskModalAssignee.textContent = task.assignee;
    if (taskModalStatus) taskModalStatus.innerHTML = renderStatusCell(task.status);
    if (taskModalNotes) taskModalNotes.textContent = task.notes;
    setTaskCompleteButton(task);
  };

  const openTaskModal = (taskId) => {
    const task = findTask(taskId);
    if (!task) return;
    populateTaskModal(task);
    window.MotherMapShell?.openModal(taskModal);
  };

  const markTaskComplete = () => {
    const task = findTask(activeTaskId);
    if (!task || task.done) return;

    task.done = true;
    task.status = '完了';
    render();
    window.MotherMapShell?.closeModal(taskModal);
    activeTaskId = null;
    window.MotherMapShell?.showToast('タスクを完了にしました');
  };

  const getHolidayName = (dayKey) => window.JapaneseHolidays?.getHoliday(dayKey) || null;

  const renderHolidayLabel = (name) =>
    `<span class="holiday" title="${escapeHtml(name)}">${escapeHtml(name)}</span>`;

  const renderTaskChip = (task) => {
    const type = TASK_TYPES[task.type] || TASK_TYPES.site;
    const doneClass = task.done ? ' is-done' : '';
    const timedClass = task.time ? ' has-time' : '';
    const flag = task.done
      ? '<span class="flag material-symbols-rounded" aria-hidden="true">flag</span>'
      : '';
    const timeLabel = task.time ? `${task.time} ` : '';
    const timeHtml = task.time
      ? `<span class="time">${escapeHtml(task.time)}</span>`
      : '';

    if (task.time) {
      return `<a href="#" class="task is-${task.type}${doneClass} has-time" data-task-id="${task.id}" title="${escapeHtml(timeLabel + task.title)}">
      ${timeHtml}
      <span class="main">
        <span class="icon material-symbols-rounded" aria-hidden="true">${type.icon}</span>
        <span class="label">${escapeHtml(task.title)}</span>
      </span>
      ${flag}
    </a>`;
    }

    return `<a href="#" class="task is-${task.type}${doneClass}${timedClass}" data-task-id="${task.id}" title="${escapeHtml(timeLabel + task.title)}">
      ${timeHtml}
      <span class="icon material-symbols-rounded" aria-hidden="true">${type.icon}</span>
      <span class="label">${escapeHtml(task.title)}</span>
      ${flag}
    </a>`;
  };

  const renderMonth = () => {
    const today = startOfDay(new Date(2026, 4, 18));
    const weeks = getMonthMatrix(anchor);
    const month = anchor.getMonth();
    const weekdayHeader = WEEKDAYS.map(
      (day, index) =>
        `<div class="weekday${index === 0 ? ' is-sun' : ''}${index === 6 ? ' is-sat' : ''}">${day}</div>`,
    ).join('');

    const weekRows = weeks
      .map((days) => {
        const dayCells = days
          .map((day) => {
            const dayKey = toKey(day);
            const isOtherMonth = day.getMonth() !== month;
            const isToday = isSameDay(day, today);
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            const holidayName = getHolidayName(dayKey);
            const dayTasks = sortDayTasks(SAMPLE_TASKS.filter((task) => taskOnDay(task, dayKey)))
              .map((task) => renderTaskChip(task))
              .join('');

            return `<div class="day${isOtherMonth ? ' is-other' : ''}${isToday ? ' is-today' : ''}${weekend ? ' is-weekend' : ''}${holidayName ? ' is-holiday' : ''}" data-date="${dayKey}">
              <div class="date">${day.getDate()}</div>
              ${holidayName ? renderHolidayLabel(holidayName) : ''}
              <div class="tasks">${dayTasks}</div>
            </div>`;
          })
          .join('');

        return `<div class="week-row">
          <div class="days">${dayCells}</div>
        </div>`;
      })
      .join('');

    panel.innerHTML = `<div class="month-view" role="grid" aria-label="${escapeHtml(formatMonthTitle(anchor))}のカレンダー">
      <div class="weekdays">${weekdayHeader}</div>
      ${weekRows}
    </div>`;
  };

  const renderWeek = () => {
    const today = startOfDay(new Date(2026, 4, 18));
    const weekStart = getWeekStart(anchor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const columns = days
      .map((day) => {
        const dayKey = toKey(day);
        const isToday = isSameDay(day, today);
        const weekend = day.getDay() === 0 || day.getDay() === 6;
        const holidayName = getHolidayName(dayKey);
        const tasks = sortDayTasks(SAMPLE_TASKS.filter((task) => taskOnDay(task, dayKey)))
          .map((task) => {
            const type = TASK_TYPES[task.type];
            const doneClass = task.done ? ' is-done' : '';
            const timedClass = task.time ? ' has-time' : '';
            const flag = task.done
              ? '<span class="flag material-symbols-rounded" aria-hidden="true">flag</span>'
              : '';
            const timeHtml = task.time
              ? `<span class="time">${escapeHtml(task.time)}</span>`
              : '';
            const timeLabel = task.time ? `${task.time} ` : '';

            return `<a href="#" class="task is-${task.type}${doneClass}${timedClass}" data-task-id="${task.id}" title="${escapeHtml(timeLabel + task.title)}">
              <span class="head">
                <span class="icon material-symbols-rounded" aria-hidden="true">${type.icon}</span>
                <span class="type">${type.label}</span>
                ${flag}
              </span>
              <span class="label">${escapeHtml(task.title)}</span>
              ${timeHtml}
            </a>`;
          })
          .join('');

        return `<div class="day-col${isToday ? ' is-today' : ''}${weekend ? ' is-weekend' : ''}${holidayName ? ' is-holiday' : ''}">
          <div class="head">
            <span class="dow">${WEEKDAYS[day.getDay()]}</span>
            <span class="date">${day.getMonth() + 1}/${day.getDate()}</span>
          </div>
          ${holidayName ? `<div class="holiday-bar">${renderHolidayLabel(holidayName)}</div>` : ''}
          <div class="tasks">${tasks || '<p class="empty">予定なし</p>'}</div>
        </div>`;
      })
      .join('');

    panel.innerHTML = `<div class="week-view" aria-label="${escapeHtml(formatWeekTitle(weekStart))}の週表示">
      ${columns}
    </div>`;
  };

  const render = () => {
    if (view === 'month') {
      titleEl.textContent = formatMonthTitle(anchor);
      renderMonth();
    } else {
      const weekStart = getWeekStart(anchor);
      titleEl.textContent = formatWeekTitle(weekStart);
      renderWeek();
    }

    viewTabs.forEach((tab) => {
      const isActive = tab.dataset.calendarView === view;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
  };

  const setView = (nextView) => {
    view = nextView;
    render();
  };

  const shiftAnchor = (delta) => {
    if (view === 'month') {
      anchor = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
    } else {
      anchor = addDays(anchor, delta * 7);
    }
    render();
  };

  viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => setView(tab.dataset.calendarView));
  });

  prevBtn?.addEventListener('click', () => shiftAnchor(-1));
  nextBtn?.addEventListener('click', () => shiftAnchor(1));
  todayBtn?.addEventListener('click', () => {
    anchor = startOfDay(new Date(2026, 4, 18));
    render();
  });

  printBtn?.addEventListener('click', () => {
    window.print();
  });

  panel.addEventListener('click', (event) => {
    const taskLink = event.target.closest('.task[data-task-id]');
    if (!taskLink) return;

    event.preventDefault();
    openTaskModal(taskLink.dataset.taskId);
  });

  taskCompleteBtn?.addEventListener('click', markTaskComplete);

  render();
})();
