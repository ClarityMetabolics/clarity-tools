// /dashboard/js/journal.js
(function () {
  console.log('[CM] journal.js loaded');
  const STORAGE_KEY = 'cm_journal_v1';

  // Journal entry schema (5 fields)
  const createEntry = (dateISO, rating, primaryThoughtPattern, practiceUsed, reflection) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    dateISO, // 'YYYY-MM-DD' (local)
    rating: parseInt(rating, 10),
    primaryThoughtPattern,
    practiceUsed,
    reflection,
    createdAt: new Date().toISOString()
  });

  function loadEntries() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveEntry(entry) {
    const list = loadEntries();
    list.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  }

  // helpers for local dates + 7-day view
  function toLocalISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getEntriesByDateRange(startDate, endDate) {
    const s = toLocalISODate(startDate);
    const e = toLocalISODate(endDate);
    return loadEntries().filter(entry => entry.dateISO >= s && entry.dateISO <= e);
  }

  function getLast7DaysRatings() {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const entries = getEntriesByDateRange(sevenDaysAgo, today);

    const byDate = {};
    entries.forEach(entry => {
      const k = entry.dateISO;
      if (!byDate[k] || (entry.createdAt && entry.createdAt > byDate[k].createdAt)) {
        byDate[k] = { rating: entry.rating, createdAt: entry.createdAt || '' };
      }
    });

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      days.push(toLocalISODate(d));
    }

    return days.map(dateISO => {
      const hit = byDate[dateISO];
      return { date: dateISO, rating: hit ? hit.rating : null, hasEntry: !!hit };
    });
  }

  function getEntryByDate(dateISO) {
    return loadEntries().find(e => e.dateISO === dateISO);
  }

  function exportJSON() {
    const data = JSON.stringify(loadEntries(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mental-journal-entries.json'; a.click();
    URL.revokeObjectURL(url);
  }

  window.CM_Journal = {
    createEntry, loadEntries, saveEntry,
    getEntriesByDateRange, getEntryByDate, getLast7DaysRatings, exportJSON
  };
})();
