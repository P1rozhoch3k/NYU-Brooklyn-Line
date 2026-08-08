// Static reference data — Key Dates, International Hub, Transit.
// Hard-coded per PRD §6.1, §6.4, §6.5 — not user-editable, not stored in localStorage.

const KEY_DATES = [
  { id: 'movein',       label: 'Move-In Days',                     start: '2026-08-28', end: '2026-08-30' },
  { id: 'classesbegin', label: 'Fall 2026 Classes Begin',           start: '2026-09-02', end: null },
  { id: 'laborday',     label: 'Labor Day (no classes)',            start: '2026-09-07', end: null },
  { id: 'thanksgiving', label: 'Thanksgiving Recess (no classes)',  start: '2026-11-26', end: '2026-11-27' },
  { id: 'lastday',      label: 'Last Day of Classes',               start: '2026-12-14', end: null },
  { id: 'readingday',   label: 'Reading Day',                       start: '2026-12-15', end: null },
  { id: 'finals',       label: 'Final Exam Period',                 start: '2026-12-16', end: '2026-12-22' },
  { id: 'incomplete',   label: 'Incomplete Grade Request Deadline', start: '2026-12-22', end: null },
  { id: 'winterrecess', label: 'Winter Recess Begins',              start: '2026-12-23', end: '2027-01-01' },
];

const INTL_HUB_CARDS = [
  {
    title: 'Immigration alert',
    urgent: true,
    body: `The US ends "Duration of Status" (D/S) for F-1 students effective <strong>Sept 15, 2026</strong>. Students get a fixed I-94 expiration date instead of an open-ended one tied to program length. Check your I-94 after every re-entry to the US.`,
  },
  {
    title: 'Office of Global Services (OGS)',
    body: `Room 259, 5 MetroTech Center, Brooklyn. Mandatory check-in workshop within 10 days of arrival.`,
  },
  {
    title: 'Health insurance',
    body: `Confirm your waiver eligibility or complete enrollment before the deadline — check the NYU Student Health Center portal.`,
  },
  {
    title: 'Banking & SIM card',
    body: `Open a US bank account and get a US SIM card in your first week — both are usually required for campus and housing logistics.`,
  },
  {
    title: 'CPT / OPT lead time',
    body: `Start learning about CPT/OPT eligibility and timelines early with an advisor — don't wait until senior year.`,
  },
];

const TRANSIT_CARDS = [
  {
    title: 'Jay St–MetroTech',
    body: `<span class="line-badges"><span class="line-chip">A</span><span class="line-chip">C</span><span class="line-chip">F</span><span class="line-chip">R</span></span> Closest stop — right under campus.`,
  },
  {
    title: 'Borough Hall',
    body: `<span class="line-badges"><span class="line-chip">2</span><span class="line-chip">3</span><span class="line-chip">4</span><span class="line-chip">5</span></span> About a 6 minute walk.`,
  },
  {
    title: 'DeKalb Ave',
    body: `<span class="line-badges"><span class="line-chip">B</span><span class="line-chip">Q</span></span> About an 8 minute walk.`,
  },
  {
    title: 'NYU shuttle',
    body: `Free inter-campus shuttle connects to Washington Square (Manhattan campus).`,
  },
];

// Curated from public listings — verify hours/current status before relying on them.
const NEIGHBORHOOD_ADDRESS = '55 Clark Street, Brooklyn, NY 11201';
const NEIGHBORHOOD_MAP_EMBED = 'https://www.google.com/maps?q=55+Clark+St,+Brooklyn,+NY+11201&output=embed';

const NEIGHBORHOOD_SPOTS = [
  { category: 'Subway', name: 'Clark St (2 · 3)', note: 'In the building’s basement — first Brooklyn stop coming from Manhattan.' },
  { category: 'Groceries', name: 'Key Food — 102 Montague St', note: 'Closest full grocery store, about a 5 minute walk.' },
  { category: 'Pharmacy', name: 'CVS — Henry St & Love Lane', note: 'Prescriptions and everyday essentials, about a 5 minute walk.' },
  { category: 'Coffee', name: 'Café Brume', note: 'Alpine-themed café on Clark St — decent study spot.' },
  { category: 'Food', name: 'Clark’s Restaurant — 80 Clark St', note: 'Classic diner, same block.' },
  { category: 'Food', name: 'Chama Mama', note: 'Georgian food, short walk toward Montague St.' },
  { category: 'Wine & liquor', name: 'Michael Towne Wines', note: 'Corner of Clark & Henry, right by the subway entrance.' },
  { category: 'Outdoors', name: 'Brooklyn Heights Promenade', note: 'Waterfront views of Manhattan, about a 5 minute walk downhill.' },
  { category: 'Outdoors', name: 'Brooklyn Bridge Park', note: 'Bigger park + waterfront, about a 10 minute walk.' },
];
