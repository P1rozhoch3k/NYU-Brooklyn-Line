// "Paste from email" — best-effort date/title extraction from pasted text.
// No inbox access: the student copies text from an email and pastes it here.

const MONTH_NAMES = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

function isoFromParts(year, monthIndex, day) {
  const y = String(year).padStart(4, '0');
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveYear(monthIndex, day, explicitYear) {
  if (explicitYear) {
    return explicitYear.length === 2 ? 2000 + Number(explicitYear) : Number(explicitYear);
  }
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, monthIndex, day);
  if ((candidate - now) / 86400000 < -30) year += 1;
  return year;
}

function findDateInText(text) {
  let m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return isoFromParts(m[1], Number(m[2]) - 1, Number(m[3]));

  m = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/i);
  if (m) {
    const monthIndex = MONTH_NAMES[m[1].toLowerCase()];
    const day = Number(m[2]);
    return isoFromParts(resolveYear(monthIndex, day, m[3]), monthIndex, day);
  }

  m = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (m) {
    const monthIndex = Number(m[1]) - 1;
    const day = Number(m[2]);
    return isoFromParts(resolveYear(monthIndex, day, m[3]), monthIndex, day);
  }

  m = text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (m) {
    const monthIndex = Number(m[1]) - 1;
    const day = Number(m[2]);
    return isoFromParts(resolveYear(monthIndex, day, null), monthIndex, day);
  }

  return null;
}

function guessTitle(text) {
  const line = text.split('\n').map((l) => l.trim()).find(Boolean) || '';
  return line.slice(0, 90);
}

function parseEmailText(text) {
  const dueLine = text.split('\n').find((l) => /\bdue\b/i.test(l));
  const due = (dueLine && findDateInText(dueLine)) || findDateInText(text);
  return { title: guessTitle(text), due };
}

const quickaddModal = document.getElementById('quickadd-modal');
const quickaddText = document.getElementById('quickadd-text');

document.getElementById('quickadd-btn').addEventListener('click', () => {
  quickaddText.value = '';
  quickaddModal.showModal();
  quickaddText.focus();
});

document.getElementById('quickadd-cancel-btn').addEventListener('click', () => quickaddModal.close());

document.getElementById('quickadd-parse-btn').addEventListener('click', () => {
  const text = quickaddText.value.trim();
  if (!text) return;
  const { title, due } = parseEmailText(text);
  quickaddModal.close();
  openTaskModal(null);
  document.getElementById('task-title').value = title;
  if (due) {
    document.getElementById('task-due').value = due;
    toast('Pulled a date from your text — double check it before saving.');
  } else {
    toast("Couldn't find a date in that text — set the due date manually.");
  }
});
