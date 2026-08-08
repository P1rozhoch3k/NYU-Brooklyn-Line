// Thin localStorage wrapper — keys per PRD §8: `schedule-data`, `tasks-data`.

const Storage = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Storage read failed for', key, e);
      return fallback;
    }
  },
  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const SCHEDULE_KEY = 'schedule-data';
const TASKS_KEY = 'tasks-data';
