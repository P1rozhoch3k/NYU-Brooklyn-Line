// The Brooklyn Line — app logic: tab nav, Key Dates, Schedule CRUD, Homework CRUD, Next Arrival.

// ---------- date helpers ----------

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d;
}

function daysBetween(fromDate, toDate) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((toDate.getTime() - fromDate.getTime()) / MS);
}

function daysUntil(dateStr) {
  return daysBetween(todayMidnight(), parseDateOnly(dateStr));
}

function formatDateRange(startStr, endStr) {
  const opts = { month: 'short', day: 'numeric' };
  const start = parseDateOnly(startStr);
  const startFmt = start.toLocaleDateString('en-US', opts);
  if (!endStr) return startFmt + ', ' + start.getFullYear();
  const end = parseDateOnly(endStr);
  const endFmt = end.toLocaleDateString('en-US', opts);
  const year = end.getFullYear();
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startFmt}, ${start.getFullYear()} – ${endFmt}, ${year}`;
  }
  return `${startFmt} – ${endFmt}, ${year}`;
}

function urgencyStatus(days) {
  if (days < 0) return 'past';
  if (days <= 7) return 'soon';
  if (days <= 21) return 'mid';
  return 'far';
}

function countdownText(startStr, endStr) {
  const start = daysUntil(startStr);
  const end = endStr ? daysUntil(endStr) : start;
  if (end < 0) return 'Past';
  if (start <= 0 && end >= 0) return 'In progress';
  if (start === 1) return 'Tomorrow';
  return `In ${start} day${start === 1 ? '' : 's'}`;
}

// ---------- toast ----------

let toastTimer;
function toast(message, duration = 3200) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
}

// ---------- tab navigation ----------

const TABS = ['schedule', 'keydates', 'homework', 'intl', 'transit'];

function showTab(tab) {
  const activeIndex = TABS.indexOf(tab);
  TABS.forEach((t) => {
    const view = document.getElementById('view-' + t);
    const station = document.querySelector(`.station[data-tab="${t}"]`);
    const active = t === tab;
    view.hidden = !active;
    station.classList.toggle('is-active', active);
    if (active) {
      // restart the entrance animation every time this view is shown
      view.classList.remove('view--enter');
      void view.offsetWidth;
      view.classList.add('view--enter');
    }
  });
  document.querySelectorAll('.line-map__connector').forEach((el) => {
    el.classList.toggle('is-upcoming', Number(el.dataset.idx) > activeIndex);
  });
  // replaceState (not location.hash =) so switching tabs doesn't push a
  // browser history entry — pushing entries made mobile back-swipe show a
  // ghosted preview of the previous tab overlapping the current one.
  history.replaceState(null, '', '#' + tab);
}

document.querySelectorAll('.station').forEach((station) => {
  station.querySelector('.station__button').addEventListener('click', () => {
    showTab(station.dataset.tab);
  });
});

// ---------- Key Dates ----------

function renderKeyDates() {
  const list = document.getElementById('keydates-list');
  list.innerHTML = '';
  const sorted = [...KEY_DATES].sort((a, b) => a.start.localeCompare(b.start));
  sorted.forEach((kd) => {
    const status = urgencyStatus(kd.end ? daysUntil(kd.end) : daysUntil(kd.start));
    const li = document.createElement('li');
    li.className = `date-row date-row--${status}`;
    li.innerHTML = `
      <div class="date-row__badge badge badge--${status}">${countdownText(kd.start, kd.end)}</div>
      <div class="date-row__body">
        <div class="date-row__label">${kd.label}</div>
        <div class="date-row__range">${formatDateRange(kd.start, kd.end)}</div>
      </div>
    `;
    list.appendChild(li);
  });
}

// ---------- Next Arrival (departure board) ----------

function computeNextArrival(tasks) {
  const candidates = [];

  KEY_DATES.forEach((kd) => {
    const refDate = kd.end || kd.start;
    const days = daysUntil(refDate);
    if (days >= 0 || (kd.end && daysUntil(kd.start) <= 0 && daysUntil(kd.end) >= 0)) {
      const sortDays = daysUntil(kd.start) >= 0 ? daysUntil(kd.start) : 0;
      candidates.push({ label: kd.label, days: sortDays, overdue: false, source: 'K' });
    }
  });

  tasks.filter((t) => !t.done).forEach((t) => {
    const days = daysUntil(t.due);
    candidates.push({ label: t.title, days, overdue: days < 0, source: 'H' });
  });

  if (candidates.length === 0) return null;

  const overdue = candidates.filter((c) => c.overdue).sort((a, b) => a.days - b.days);
  if (overdue.length > 0) return overdue[0];

  const upcoming = candidates.filter((c) => !c.overdue).sort((a, b) => a.days - b.days);
  return upcoming[0] || null;
}

function renderNextArrival() {
  const tasks = Storage.read(TASKS_KEY, []);
  const next = computeNextArrival(tasks);
  const eventEl = document.getElementById('db-event');
  const etaEl = document.getElementById('db-eta');
  const board = document.getElementById('departure-board');

  if (!next) {
    eventEl.textContent = 'All clear';
    etaEl.textContent = '--';
    board.classList.remove('departure-board--alert');
    return;
  }

  eventEl.textContent = `${next.source === 'K' ? 'K' : 'H'} — ${next.label}`;
  if (next.overdue) {
    etaEl.textContent = `${Math.abs(next.days)}D OVERDUE`;
    board.classList.add('departure-board--alert');
  } else if (next.days === 0) {
    etaEl.textContent = 'TODAY';
    board.classList.add('departure-board--alert');
  } else if (next.days === 1) {
    etaEl.textContent = '1 DAY';
    board.classList.toggle('departure-board--alert', false);
  } else {
    etaEl.textContent = `${next.days} DAYS`;
    board.classList.remove('departure-board--alert');
  }
}

// ---------- Schedule ----------

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

function loadSchedule() {
  return Storage.read(SCHEDULE_KEY, []);
}
function saveSchedule(items) {
  Storage.write(SCHEDULE_KEY, items);
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function renderSchedule() {
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';
  const items = loadSchedule();

  DAY_DISPLAY_ORDER.forEach((dayNum) => {
    const col = document.createElement('div');
    col.className = 'day-col';
    const dayItems = items
      .filter((c) => Number(c.day) === dayNum)
      .sort((a, b) => a.start.localeCompare(b.start));

    col.innerHTML = `<div class="day-col__header">${DAY_LABELS[dayNum].slice(0, 3)}</div>`;
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'day-col__cards';

    if (dayItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'day-col__empty';
      empty.textContent = '—';
      cardsWrap.appendChild(empty);
    }

    dayItems.forEach((c) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'class-card';
      card.innerHTML = `
        <div class="class-card__time">${formatTime(c.start)}–${formatTime(c.end)}</div>
        <div class="class-card__name">${c.name}</div>
        ${c.room ? `<div class="class-card__room">${c.room}</div>` : ''}
      `;
      card.addEventListener('click', () => openClassModal(c));
      cardsWrap.appendChild(card);
    });

    col.appendChild(cardsWrap);
    grid.appendChild(col);
  });
}

const classModal = document.getElementById('class-modal');
const classForm = document.getElementById('class-form');

function openClassModal(existing) {
  document.getElementById('class-modal-title').textContent = existing ? 'Edit class' : 'Add class';
  document.getElementById('class-id').value = existing ? existing.id : '';
  document.getElementById('class-name').value = existing ? existing.name : '';
  document.getElementById('class-room').value = existing ? existing.room || '' : '';
  document.getElementById('class-day').value = existing ? existing.day : '1';
  document.getElementById('class-start').value = existing ? existing.start : '';
  document.getElementById('class-end').value = existing ? existing.end : '';
  document.getElementById('class-delete-btn').hidden = !existing;
  classModal.showModal();
}

document.getElementById('add-class-btn').addEventListener('click', () => openClassModal(null));
document.getElementById('class-cancel-btn').addEventListener('click', () => classModal.close());

classForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('class-id').value || 'c' + Date.now();
  const entry = {
    id,
    name: document.getElementById('class-name').value.trim(),
    room: document.getElementById('class-room').value.trim(),
    day: document.getElementById('class-day').value,
    start: document.getElementById('class-start').value,
    end: document.getElementById('class-end').value,
  };
  if (!entry.name || !entry.start || !entry.end) return;

  const items = loadSchedule();
  const idx = items.findIndex((c) => c.id === id);
  if (idx >= 0) items[idx] = entry; else items.push(entry);
  saveSchedule(items);
  classModal.close();
  renderSchedule();
});

document.getElementById('class-delete-btn').addEventListener('click', () => {
  const id = document.getElementById('class-id').value;
  if (!id) return;
  saveSchedule(loadSchedule().filter((c) => c.id !== id));
  classModal.close();
  renderSchedule();
});

// ---------- Homework ----------

function loadTasks() {
  return Storage.read(TASKS_KEY, []);
}
function saveTasks(items) {
  Storage.write(TASKS_KEY, items);
}

const TASK_GROUPS = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This Week' },
  { key: 'later', label: 'Later' },
  { key: 'done', label: 'Done' },
];

function groupForTask(t) {
  if (t.done) return 'done';
  const days = daysUntil(t.due);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 7) return 'week';
  return 'later';
}

function renderHomework() {
  const container = document.getElementById('task-groups');
  container.innerHTML = '';
  const tasks = loadTasks();

  const grouped = {};
  TASK_GROUPS.forEach((g) => (grouped[g.key] = []));
  tasks.forEach((t) => grouped[groupForTask(t)].push(t));

  TASK_GROUPS.forEach((g) => {
    const items = grouped[g.key].sort((a, b) => a.due.localeCompare(b.due));
    if (items.length === 0) return;

    const section = document.createElement('div');
    section.className = `task-group task-group--${g.key}`;
    section.innerHTML = `<h2 class="task-group__title">${g.label} <span class="task-group__count">${items.length}</span></h2>`;
    const list = document.createElement('ul');
    list.className = 'task-list';

    items.forEach((t) => {
      const li = document.createElement('li');
      li.className = `task-row task-row--priority-${t.priority}${t.done ? ' task-row--done' : ''}`;
      li.innerHTML = `
        <label class="task-row__check">
          <input type="checkbox" ${t.done ? 'checked' : ''} />
        </label>
        <button type="button" class="task-row__body">
          <span class="task-row__title">${t.title}</span>
          <span class="task-row__meta">${t.subject ? t.subject + ' · ' : ''}${parseDateOnly(t.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </button>
      `;
      li.querySelector('.task-row__check input').addEventListener('change', (e) => {
        toggleTaskDone(t.id, e.target.checked);
      });
      li.querySelector('.task-row__body').addEventListener('click', () => openTaskModal(t));
      list.appendChild(li);
    });

    section.appendChild(list);
    container.appendChild(section);
  });

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">No assignments yet — add your first one.</p>';
  }
}

function toggleTaskDone(id, done) {
  const items = loadTasks();
  const idx = items.findIndex((t) => t.id === id);
  if (idx >= 0) {
    items[idx].done = done;
    saveTasks(items);
    renderHomework();
    renderNextArrival();
  }
}

const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

function openTaskModal(existing) {
  document.getElementById('task-modal-title').textContent = existing ? 'Edit assignment' : 'Add assignment';
  document.getElementById('task-id').value = existing ? existing.id : '';
  document.getElementById('task-title').value = existing ? existing.title : '';
  document.getElementById('task-subject').value = existing ? existing.subject || '' : '';
  document.getElementById('task-due').value = existing ? existing.due : '';
  document.getElementById('task-priority').value = existing ? existing.priority : 'medium';
  document.getElementById('task-delete-btn').hidden = !existing;
  taskModal.showModal();
}

document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal(null));
document.getElementById('task-cancel-btn').addEventListener('click', () => taskModal.close());

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('task-id').value || 't' + Date.now();
  const items = loadTasks();
  const idx = items.findIndex((t) => t.id === id);
  const entry = {
    id,
    title: document.getElementById('task-title').value.trim(),
    subject: document.getElementById('task-subject').value.trim(),
    due: document.getElementById('task-due').value,
    priority: document.getElementById('task-priority').value,
    done: idx >= 0 ? items[idx].done : false,
  };
  if (!entry.title || !entry.due) return;

  if (idx >= 0) items[idx] = entry; else items.push(entry);
  saveTasks(items);
  taskModal.close();
  renderHomework();
  renderNextArrival();
});

document.getElementById('task-delete-btn').addEventListener('click', () => {
  const id = document.getElementById('task-id').value;
  if (!id) return;
  saveTasks(loadTasks().filter((t) => t.id !== id));
  taskModal.close();
  renderHomework();
  renderNextArrival();
});

// ---------- International Hub / Transit (static content) ----------

function renderStaticCards(containerId, cards) {
  const el = document.getElementById(containerId);
  el.innerHTML = cards
    .map(
      (c) => `
      <div class="info-card${c.urgent ? ' info-card--urgent' : ''}">
        <h3 class="info-card__title">${c.title}</h3>
        <p class="info-card__body">${c.body}</p>
      </div>`
    )
    .join('');
}

// ---------- Neighborhood (Transit tab) ----------

function renderNeighborhood() {
  document.getElementById('neighborhood-map').src = NEIGHBORHOOD_MAP_EMBED;
  const list = document.getElementById('neighborhood-list');
  list.innerHTML = NEIGHBORHOOD_SPOTS.map(
    (s) => `
      <li class="spot-row">
        <span class="spot-row__category">${s.category}</span>
        <div class="spot-row__body">
          <div class="spot-row__name">${s.name}</div>
          <div class="spot-row__note">${s.note}</div>
        </div>
      </li>`
  ).join('');
}

// ---------- ICS export buttons ----------

document.getElementById('export-keydates-ics').addEventListener('click', () => {
  exportKeyDatesIcs();
  toast('Calendar file saved — open it from your downloads to add these to your calendar app.');
});

document.getElementById('export-homework-ics').addEventListener('click', () => {
  const tasks = loadTasks();
  if (tasks.filter((t) => !t.done).length === 0) {
    toast('No open assignments to export yet.');
    return;
  }
  exportHomeworkIcs(tasks);
  toast('Calendar file saved — open it from your downloads to add these to your calendar app.');
});

document.getElementById('export-schedule-ics').addEventListener('click', () => {
  const ok = exportScheduleIcs(loadSchedule());
  if (!ok) {
    toast('Add a class first, then export.');
    return;
  }
  toast('Calendar file saved — opening it adds a weekly repeating event with reminders 2h and 90min before each class.');
});

// ---------- live reminders toggle ----------

const notifyToggleBtn = document.getElementById('notify-toggle');

function refreshNotifyToggleUI() {
  const supported = 'Notification' in window;
  const on = supported && notifyEnabled() && Notification.permission === 'granted';
  notifyToggleBtn.classList.toggle('is-on', on);
  notifyToggleBtn.setAttribute('aria-pressed', String(on));
  notifyToggleBtn.title = !supported
    ? 'Notifications not supported in this browser'
    : on
    ? 'Live reminders on — tap to turn off'
    : 'Turn on live reminders (fires while this tab is open)';
}

notifyToggleBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    toast('This browser doesn’t support notifications — use the .ics export instead.');
    return;
  }
  const currentlyOn = notifyEnabled() && Notification.permission === 'granted';
  if (currentlyOn) {
    setNotifyEnabled(false);
    toast('Live reminders turned off.');
  } else {
    const granted = await requestNotifyPermission();
    setNotifyEnabled(granted);
    if (granted) {
      toast('Live reminders on — you’ll get a heads-up 2h and 90min before class while this tab is open.');
      runNotifyChecks();
    } else {
      toast('Notifications are blocked — enable them in your browser settings to use this.');
    }
  }
  refreshNotifyToggleUI();
});

// ---------- init ----------

function init() {
  renderKeyDates();
  renderNextArrival();
  renderSchedule();
  renderHomework();
  renderStaticCards('intl-content', INTL_HUB_CARDS);
  renderStaticCards('transit-content', TRANSIT_CARDS);
  renderNeighborhood();
  refreshNotifyToggleUI();
  initNotifications();

  const hashTab = location.hash.replace('#', '');
  showTab(TABS.includes(hashTab) ? hashTab : 'schedule');

  setInterval(renderNextArrival, 60 * 1000);
}

init();
