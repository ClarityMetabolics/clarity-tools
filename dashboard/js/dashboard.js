// /dashboard/js/dashboard.js
(function() {
  console.log('[CM] dashboard.js loaded');

  function localDateFromISO(iso) {
    const [yy, mm, dd] = iso.split('-').map(Number);
    return new Date(yy, mm - 1, dd);
  }

  function renderMentalTrendline() {
    const container = document.getElementById('mental-trendline');
    if (!container || !window.CM_Journal || !CM_Journal.getLast7DaysRatings) return;

    const data = CM_Journal.getLast7DaysRatings();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '120');
    svg.setAttribute('viewBox', '0 0 300 120');
    svg.setAttribute('class', 'trendline-svg');

    // grid + y labels
    for (let i = 1; i <= 5; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '40'); line.setAttribute('x2', '280');
      line.setAttribute('y1', 100 - (i * 15)); line.setAttribute('y2', 100 - (i * 15));
      line.setAttribute('stroke', 'var(--color-mental-accent)'); line.setAttribute('stroke-width', '1'); line.setAttribute('opacity', '0.5');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '30'); text.setAttribute('y', 105 - (i * 15));
      text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '12');
      text.setAttribute('fill', 'var(--color-mental-contrast)'); text.textContent = i;
      svg.appendChild(text);
    }

    const points = [];
    data.forEach((day, index) => {
      const x = 50 + (index * 35);
      if (day.hasEntry) {
        const y = 100 - (day.rating * 15);
        points.push({ x, y });
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', '4');
        circle.setAttribute('fill', 'var(--color-mental-main)'); circle.setAttribute('stroke', 'var(--color-mental-contrast)'); circle.setAttribute('stroke-width', '2');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        const localDate = localDateFromISO(day.date);
        title.textContent = `${localDate.toLocaleDateString()}: ${day.rating}/5`;
        circle.appendChild(title); svg.appendChild(circle);
      } else {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x); circle.setAttribute('cy', '50'); circle.setAttribute('r', '3');
        circle.setAttribute('fill', 'var(--color-mental-accent)'); circle.setAttribute('stroke', 'var(--color-mental-main)');
        circle.setAttribute('stroke-width', '1'); circle.setAttribute('opacity', '0.5');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        const localDate = localDateFromISO(day.date);
        title.textContent = `${localDate.toLocaleDateString()}: No entry`;
        circle.appendChild(title); svg.appendChild(circle);
      }
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x); label.setAttribute('y', '115'); label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10'); label.setAttribute('fill', 'var(--color-mental-contrast)');
      label.textContent = localDateFromISO(day.date).toLocaleDateString(undefined, { weekday: 'short' });
      svg.appendChild(label);
    });

    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', points[i].x); line.setAttribute('y1', points[i].y);
        line.setAttribute('x2', points[i + 1].x); line.setAttribute('y2', points[i + 1].y);
        line.setAttribute('stroke', 'var(--color-mental-main)'); line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }
    }

    container.innerHTML = '';
    container.appendChild(svg);
    updateKeyTruth(data);
  }

  function updateKeyTruth(data) {
    const el = document.getElementById('mental-key-truth'); if (!el) return;
    const entries = data.filter(d => d.hasEntry);
    const avg = entries.length ? (entries.reduce((s, d) => s + d.rating, 0) / entries.length) : 0;
    let truth = "Consistent mental clarity tracking builds self-awareness.";
    if (entries.length === 0) truth = "Start your mental clarity journey today.";
    else if (entries.length >= 5) truth = `Strong tracking habit! ${Math.round(avg * 10) / 10}/5 avg clarity.`;
    else if (avg >= 4) truth = "High clarity levels - keep up the great work!";
    else if (avg <= 2) truth = "Notice patterns in low clarity days to build resilience.";
    el.textContent = truth;
  }

  function setupExportButton() {
    const btn = document.getElementById('export-data');
    if (btn && window.CM_Journal && CM_Journal.exportJSON) btn.addEventListener('click', () => CM_Journal.exportJSON());
  }

  function setupJournalForm() {
    const form = document.getElementById('journal-form'); if (!form || !window.CM_Journal) return;
    const dateEl = form.querySelector('#dateISO'); const ratingEl = form.querySelector('#rating');
    if (dateEl && !dateEl.value) {
      const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
      dateEl.value = `${y}-${m}-${day}`;
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = CM_Journal.createEntry(
        dateEl.value, ratingEl.value,
        form.primaryThoughtPattern.value.trim(),
        form.practiceUsed.value.trim(),
        form.reflection.value.trim()
      );
      CM_Journal.saveEntry(entry);
      const status = document.getElementById('journal-status');
      if (status) { status.textContent = 'Saved!'; setTimeout(() => status.textContent = '', 2000); }
      renderMentalTrendline();
      if (window.CM_Calendar && CM_Calendar.renderCalendarList) CM_Calendar.renderCalendarList();
      form.reset();
      if (dateEl) {
        const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
        dateEl.value = `${y}-${m}-${day}`;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderMentalTrendline();
    setupExportButton();
    setupJournalForm();
  });
})();
