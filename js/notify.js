// Optional live browser notifications — a bonus on top of .ics reminders.
// Only fires while this tab is open; the .ics export is the reliable path
// for reminders that need to reach you when the browser is closed.

const NOTIFY_ENABLED_KEY = 'notify-enabled';
const NOTIFY_LOG_KEY = 'notify-log';

function notifyEnabled() {
  return Storage.read(NOTIFY_ENABLED_KEY, false);
}
function setNotifyEnabled(v) {
  Storage.write(NOTIFY_ENABLED_KEY, v);
}

async function requestNotifyPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function fireNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

function todayNotifyLog() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const log = Storage.read(NOTIFY_LOG_KEY, { date: todayStr, fired: [] });
  if (log.date !== todayStr) return { date: todayStr, fired: [] };
  return log;
}
function saveNotifyLog(log) {
  Storage.write(NOTIFY_LOG_KEY, log);
}

function checkClassReminders() {
  const classes = loadSchedule();
  if (classes.length === 0) return;
  const now = new Date();
  const log = todayNotifyLog();
  let changed = false;

  classes.filter((c) => Number(c.day) === now.getDay()).forEach((c) => {
    const [h, m] = c.start.split(':').map(Number);
    const startAt = new Date(now);
    startAt.setHours(h, m, 0, 0);
    const minsUntil = (startAt - now) / 60000;

    [120, 90].forEach((mark) => {
      const key = `class-${c.id}-${mark}`;
      if (minsUntil <= mark && minsUntil > mark - 1 && !log.fired.includes(key)) {
        fireNotification(
          `Class in ${mark === 120 ? '2 hours' : '90 min'}: ${c.name}`,
          `Starts at ${formatTime(c.start)}${c.room ? ' · ' + c.room : ''} — time to get moving.`
        );
        log.fired.push(key);
        changed = true;
      }
    });
  });

  if (changed) saveNotifyLog(log);
}

function checkHomeworkReminder() {
  const tasks = loadTasks().filter((t) => !t.done);
  if (tasks.length === 0) return;
  const log = todayNotifyLog();
  const key = 'homework-daily-summary';
  if (log.fired.includes(key)) return;

  const overdueCount = tasks.filter((t) => daysUntil(t.due) < 0).length;
  const dueTodayCount = tasks.filter((t) => daysUntil(t.due) === 0).length;
  if (overdueCount === 0 && dueTodayCount === 0) return;

  const parts = [];
  if (overdueCount) parts.push(`${overdueCount} overdue`);
  if (dueTodayCount) parts.push(`${dueTodayCount} due today`);
  fireNotification('Homework check-in', parts.join(', '));
  log.fired.push(key);
  saveNotifyLog(log);
}

function runNotifyChecks() {
  if (!notifyEnabled() || !('Notification' in window) || Notification.permission !== 'granted') return;
  checkClassReminders();
  checkHomeworkReminder();
}

function initNotifications() {
  runNotifyChecks();
  setInterval(runNotifyChecks, 30 * 1000);
}
