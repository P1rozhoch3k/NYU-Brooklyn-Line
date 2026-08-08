# PRD — The Brooklyn Line
### Personal academic planner for an NYU Tandon (Brooklyn) freshman

**Owner:** Student, NYU Tandon School of Engineering, Downtown Brooklyn — first-year
**Type:** Personal-use single-page web app (no backend, no other users)
**Status:** Design approved directionally · schedule/homework functionality not yet built

---

## 1. Problem

The student needs one place to see everything academic at once: weekly class schedule, exam/session dates, and every assignment deadline — instead of these being scattered. Secondary goal: reduce the extra friction of managing all this as an international student living abroad for the first time.

## 2. Goal

See the full semester at a glance, never miss a deadline, and keep GPA-risk to zero because nothing falls through the cracks. Get advance warning before important dates, not just a same-day reminder.

## 3. Non-goals (for now)

- No multi-user features, sharing, or accounts — this is single-player, personal use only.
- No native mobile app — browser-based only.
- No real backend/server — data lives in the artifact's built-in storage.
- Real push notifications are out of scope for a first version (see §7).

## 4. Users

Just the student. No other personas.

## 5. Product concept / design direction

**Theme:** "The Brooklyn Line" — the semester is framed as a subway line. Navigation is a horizontal line map with colored circular "stations" (bullets) instead of plain tabs. A "Next Arrival" departure-board widget in the header always shows the single most urgent upcoming date, styled like a real platform countdown display.

**Rationale:** grounded in the actual subject (NYU Tandon sits directly above/near the Jay St–MetroTech subway hub in Downtown Brooklyn); avoids generic dashboard/template look; gives every section its own identity via a distinct "line color," which doubles as a category color used consistently for countdowns and tags.

### Design tokens
| Token | Value | Use |
|---|---|---|
| Background (concrete) | `#F1ECE2` | page background, subtle dot-grid texture |
| Ink | `#16181D` | header bar, primary text, departure board |
| Line — Key Dates (violet) | `#6C2BA6` | Key Dates tab |
| Line — Schedule (teal) | `#0E7C7B` | Schedule tab |
| Line — Homework (amber) | `#D98E1E` | Homework tab |
| Line — Intl Hub (brick) | `#B23A2E` | International Hub tab, urgent alerts |
| Line — Transit (steel) | `#3B5A78` | Brooklyn & Transit tab |

**Type:** Archivo (900/800, condensed display, signage-style headers) + Inter (body/UI) + JetBrains Mono (dates, countdowns, departure-board text).

**Signature element:** the line-map station nav + departure-board "Next Arrival" widget, reused as the countdown-badge pattern across the Key Dates list.

Design is still open to another pass (different palette/layout) if the current direction doesn't stick after living with it.

## 6. Feature set (by tab / "station")

### 6.1 Key Dates — `K` (violet) — **auto-populated, not user-editable**
Official NYU Fall 2026 academic-calendar milestones, pulled from nyu.edu and pre-loaded into the app (not hand-entered by the student):

| Event | Date(s) |
|---|---|
| Move-In Days | Aug 28–30, 2026 |
| Fall 2026 Classes Begin | Sep 2, 2026 |
| Labor Day (no classes) | Sep 7, 2026 |
| Thanksgiving Recess (no classes) | Nov 26–27, 2026 |
| Last Day of Classes | Dec 14, 2026 |
| Reading Day | Dec 15, 2026 |
| Final Exam Period | Dec 16–22, 2026 |
| Incomplete Grade Request Deadline | Dec 22, 2026 |
| Winter Recess Begins | Dec 23, 2026 (through Jan 1, 2027) |

Each row shows a countdown badge (color escalates as the date approaches: far → mid → soon → past). Spring 2027 dates to be added once NYU publishes its Spring 2027 calendar.

**Open question:** confirm whether Tandon-specific dates (as opposed to university-wide) differ for any of the above, once the student has their Tandon-specific calendar/syllabi.

### 6.2 Class Schedule — `S` (teal) — **user-entered, not yet built**
Weekly view, 7 day-columns, each holding stacked class cards (time, course name, room/building). Student adds/edits/deletes entries themselves. *Current state: placeholder empty view only ("track not laid yet").*

### 6.3 Homework & Deadlines — `H` (amber) — **user-entered, not yet built**
Flat list of assignments (title, subject, due date, priority), auto-grouped by urgency (Overdue / Today / Tomorrow / This Week / Later / Done), with a checkbox to mark complete. *Current state: placeholder empty view only.*

### 6.4 International Hub — `I` (brick) — **new tab, static/reference content**
Non-academic essentials specific to studying in the US as an international student:
- **Immigration alert:** the US ends "Duration of Status" (D/S) for F-1 students effective **Sept 15, 2026** — students get a fixed I-94 expiration date instead of an open-ended one tied to program length; must check I-94 after every re-entry.
- **Office of Global Services (OGS):** Room 259, 5 MetroTech Center, Brooklyn. Mandatory check-in workshop within 10 days of arrival.
- Health insurance waiver/enrollment window.
- Banking + US SIM card, first-week errands.
- CPT/OPT lead-time reminder (advising early, not senior year).

### 6.5 Brooklyn & Transit — `T` (steel) — **new tab, static/reference content**
Subway access from 6 MetroTech Center:
- A·C·F·R → Jay St–MetroTech (closest stop, under campus)
- 2·3·4·5 → Borough Hall (~6 min walk)
- B·Q → DeKalb Ave (~8 min walk)
- Note on the free NYU inter-campus shuttle to Washington Square.

## 7. Notifications — built

A browser page can't send native phone push notifications on its own. Two mechanisms are implemented:

1. **`.ics` export (reliable, works with the browser closed).** Key Dates, Homework, and Schedule each have an "Export to calendar" button that downloads a `.ics` file with `VALARM` reminders — 3 days / 1 day before for Key Dates and Homework, 2 hours / 90 minutes before for each class (recurring weekly, Sep 2 – Dec 14). Opening the downloaded file adds it to the phone's calendar app (Google/Apple Calendar), which delivers the real native notification. The download-then-open flow is standard browser behavior, not a bug — the UI now shows a toast explaining it after each export.
2. **Live in-tab reminders (bonus, only fires while the tab is open).** A bell toggle in the header requests browser `Notification` permission; when granted, the app checks every 30s and fires a notification 2h/90min before each class and once daily for overdue/due-today homework. This is a convenience layer on top of the `.ics` export, not a replacement for it.

## 8. Data & persistence

- Personal, single-user data — stored via the artifact's built-in per-user key-value storage (not shared, not synced elsewhere).
- Planned keys: `schedule-data` (class list), `tasks-data` (homework list). Key Dates and Intl Hub/Transit content are static/hard-coded, not stored per-user.
- No accounts, no login, no server.

## 9. Current status / next steps

- [x] V1 built: 3 tabs (Schedule, Exams, Homework), fully working with add/edit/delete and persistent storage, violet color scheme.
- [x] V2 design pass: subway-line concept, English copy, 5 tabs, real NYU dates researched and loaded, Intl Hub + Transit tabs added. Schedule/Homework intentionally left as non-functional placeholders per student's request to focus on design first.
- [x] V3 built: Schedule and Homework tabs rebuilt as fully working (add/edit/delete + persistent localStorage) inside the subway-line design; static app (`index.html` + `css/` + `js/`), no build step.
- [x] `.ics` export with 3-day/1-day `VALARM` reminders, for Key Dates (all) and Homework (open items).
- [x] V4 built: `.ics` export extended to Schedule (weekly recurring, 2h/90min class reminders); optional live in-tab browser notifications (bell toggle); "Paste from email" quick-add on Homework (client-side date/title extraction, no inbox access — no backend exists to actually read mail); "Near your dorm — 55 Clark Street" neighborhood guide + embedded map on the Transit tab; smooth entrance/hover animations throughout, respecting `prefers-reduced-motion`; toasts explaining download/permission outcomes.
- [x] V5 design pass: Schedule moved to the first tab/station (default landing view) since it's the daily driver; station nav redesigned as a proper line-map panel — colored connector segments between stops (dimmed for stations ahead, vivid up through the current one, like a real transit progress indicator), a pulsing "you are here" ring and filled color-pill label on the active station, small route-signage micro-copy. Nav row scrolls horizontally instead of wrapping so the line is never broken/hidden at narrow widths.
- [x] V6: background replaced twice — dot grid → grid+color-bloom → final: an abstract transit-line map (`assets/bg-lines.svg`, hand-drawn, 5 line colors + interchange nodes) as a fixed, uncropped (`background-size: contain`) poster layer plus fine paper-grain texture; card opacity raised where needed so text stays readable over it.
- [x] V6: installable as a home-screen/desktop app (PWA) — `manifest.webmanifest`, `sw.js` (offline app-shell cache), and a custom icon (`assets/icon.svg` + rasterized 32/180/192/512px PNGs) — a violet station-bullet "B" roundel on ink, with the teal/amber line motif passing behind it, matching the nav's station-bullet style.
- [ ] Add Spring 2027 dates once NYU publishes them.
- [ ] Optional: another design iteration if current direction doesn't hold up.
