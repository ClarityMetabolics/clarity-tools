// fa-checkin.js — connect Daily Check-in to the same state/calendar
document.addEventListener('DOMContentLoaded', () => {
  if (typeof state === 'undefined') return; // safety

  const todayKey = (() => {
    const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  })();

  const anchors = ['physical','mental','emotional','spiritual','relational'];
  const pending = (state.daily[todayKey] && state.daily[todayKey].ratings)
    ? {...state.daily[todayKey].ratings}
    : {};

  // show existing selections
  anchors.forEach(a => {
    const v = pending[a];
    if (!v) return;
    const btn = document.querySelector(`#checkin .rates[data-a="${a}"] .rate[data-v="${v}"]`);
    if (btn) btn.classList.add('active');
  });

  // choose 1–5
  document.querySelectorAll('#checkin .rate').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.a, v = parseInt(btn.dataset.v,10);
      pending[a] = v;
      btn.closest('.rates').querySelectorAll('.rate').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // save → updates state, refreshes calendar/stats, shows today
  const saveBtn = document.getElementById('saveToday');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    state.daily[todayKey] = state.daily[todayKey] || {};
    state.daily[todayKey].ratings = {
      physical: pending.physical || 0,
      mental: pending.mental || 0,
      emotional: pending.emotional || 0,
      spiritual: pending.spiritual || 0,
      relational: pending.relational || 0,
    };
    if (typeof save==='function') save();
    if (typeof render==='function') render();
    if (typeof updateStats==='function') updateStats();
    if (typeof showDetail==='function') showDetail(todayKey, state.daily[todayKey]);
    alert('Today saved.');
  });
});
