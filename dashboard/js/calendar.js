// /dashboard/js/calendar.js
(function () {
  console.log('[CM] calendar.js loaded');

  function latestByDate(entries) {
    const byDate = {};
    entries.forEach(e => {
      const k = e.dateISO;
      if (!byDate[k] || (e.createdAt && e.createdAt > byDate[k].createdAt)) byDate[k] = e;
    });
    return byDate;
  }

  function renderCalendarList() {
    const container = document.getElementById('calendar-list');
    if (!container) return;

    const entries = (window.CM_Journal && CM_Journal.loadEntries) ? CM_Journal.loadEntries() : [];
    container.innerHTML = '';

    if (!entries.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No journal entries yet.';
      empty.setAttribute('aria-live', 'polite');
      container.appendChild(empty);
      return;
    }

    const map = latestByDate(entries);
    const dates = Object.keys(map).sort((a, b) => b.localeCompare(a)); // newest first

    const list = document.createElement('ul');
    list.className = 'calendar-list';
    list.setAttribute('role', 'list');

    dates.forEach(dateISO => {
      const e = map[dateISO];
      const [yy, mm, dd] = dateISO.split('-').map(Number);
      const d = new Date(yy, mm - 1, dd);
      const human = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

      const li = document.createElement('li');
      li.className = 'calendar-item';
      li.innerHTML = `
        <div class="calendar-left">
          <div class="calendar-date"><strong>${human}</strong><span class="calendar-date-iso" aria-hidden="true"> · ${dateISO}</span></div>
          <div class="calendar-meta">
            <span class="badge">Rating: ${e.rating ?? '—'}/5</span>
            ${e.primaryThoughtPattern ? `<span class="meta">• Pattern: ${e.primaryThoughtPattern}</span>` : ''}
            ${e.practiceUsed ? `<span class="meta">• Practice: ${e.practiceUsed}</span>` : ''}
          </div>
          ${e.reflection ? `<div class="calendar-reflection">${e.reflection}</div>` : ''}
        </div>`;
      list.appendChild(li);
    });

    container.appendChild(list);
  }

  window.CM_Calendar = { renderCalendarList };
  document.addEventListener('DOMContentLoaded', renderCalendarList);
})();
