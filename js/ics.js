// .ics generation — VALARM reminders 3 days and 1 day before a deadline. PRD §7.

function icsEscape(str) {
  return String(str).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
}

function icsDateStamp(dateStr) {
  // dateStr: 'YYYY-MM-DD' -> all-day VALUE=DATE format YYYYMMDD
  return dateStr.replace(/-/g, '');
}

function icsDateStampPlusOne(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function buildIcsEvent({ uid, title, dateStr, description }) {
  const dtStart = icsDateStamp(dateStr);
  const dtEnd = icsDateStampPlusOne(dateStr);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@brooklyn-line.local`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${icsEscape(title)}`,
    description ? `DESCRIPTION:${icsEscape(description)}` : null,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(title)} — due in 3 days`,
    'TRIGGER:-P3D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(title)} — due tomorrow`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}

function buildIcsCalendar(events) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Brooklyn Line//NYU Tandon Planner//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(filename, icsContent) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportKeyDatesIcs() {
  const events = KEY_DATES.map((kd) =>
    buildIcsEvent({
      uid: `keydate-${kd.id}`,
      title: kd.label,
      dateStr: kd.start,
      description: 'NYU Fall 2026 academic calendar — The Brooklyn Line',
    })
  );
  downloadIcs('brooklyn-line-key-dates.ics', buildIcsCalendar(events));
}

function exportHomeworkIcs(tasks) {
  const events = tasks
    .filter((t) => !t.done)
    .map((t) =>
      buildIcsEvent({
        uid: `task-${t.id}`,
        title: t.subject ? `${t.title} (${t.subject})` : t.title,
        dateStr: t.due,
        description: `Priority: ${t.priority}`,
      })
    );
  downloadIcs('brooklyn-line-homework.ics', buildIcsCalendar(events));
}

// ---------- recurring class reminders (2h / 1.5h before each class) ----------

function icsPad(n) {
  return String(n).padStart(2, '0');
}

function icsLocalDateTime(dateObj, timeStr) {
  const [h, m] = timeStr.split(':');
  return `${dateObj.getFullYear()}${icsPad(dateObj.getMonth() + 1)}${icsPad(dateObj.getDate())}T${icsPad(h)}${icsPad(m)}00`;
}

function nextOccurrenceOnOrAfter(dateStr, dayOfWeek) {
  const d = new Date(dateStr + 'T00:00:00');
  const diff = (Number(dayOfWeek) - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function buildRecurringClassEvent(cls) {
  const semesterStart = KEY_DATES.find((k) => k.id === 'classesbegin').start;
  const semesterEnd = KEY_DATES.find((k) => k.id === 'lastday').start;

  const firstOccurrence = nextOccurrenceOnOrAfter(semesterStart, cls.day);
  const untilDate = new Date(semesterEnd + 'T00:00:00');
  const until = `${untilDate.getFullYear()}${icsPad(untilDate.getMonth() + 1)}${icsPad(untilDate.getDate())}T235959`;

  const dtStart = icsLocalDateTime(firstOccurrence, cls.start);
  const dtEnd = icsLocalDateTime(firstOccurrence, cls.end);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VEVENT',
    `UID:class-${cls.id}@brooklyn-line.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
    `SUMMARY:${icsEscape(cls.name)}`,
    cls.room ? `LOCATION:${icsEscape(cls.room)}` : null,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(cls.name)} starts in 2 hours`,
    'TRIGGER:-PT2H0M',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(cls.name)} starts in 90 minutes — time to head out`,
    'TRIGGER:-PT1H30M',
    'END:VALARM',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}

function exportScheduleIcs(classes) {
  if (classes.length === 0) return false;
  const events = classes.map(buildRecurringClassEvent);
  downloadIcs('brooklyn-line-schedule.ics', buildIcsCalendar(events));
  return true;
}
