// fa-checkin.js — daily rating save + UI highlights
console.log('checkin loaded');

(function(){
  const root = document.getElementById('checkin');
  if(!root){ console.warn('checkin section not found'); return; }

  // tap to select 1..5 in each group
  root.querySelectorAll('.rate').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const grp = btn.closest('.rates');
      grp?.querySelectorAll('.rate').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const fields = ['physical','mental','emotional','spiritual','relational'];

  document.getElementById('saveToday')?.addEventListener('click', ()=>{
    // gather selections
    const values = {};
    const groups = root.querySelectorAll('.rates');
    fields.forEach((f,i)=>{
      const active = groups[i]?.querySelector('.rate.active');
      values[f] = active ? Number(active.dataset.val) : 0;
    });

    // ensure shared state exists
    window.state = window.state || {daily:{}};

    // save to today
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    window.state.daily[key] = window.state.daily[key] || {ratings:{}, notes:''};
    window.state.daily[key].ratings = values;

    try{ localStorage.setItem('cm_dashboard_state', JSON.stringify(window.state)); }catch(e){}

    // refresh UI
    if(typeof render==='function') render();
    if(typeof showDetail==='function') showDetail(key, window.state.daily[key]);

    alert('Saved today.');
  });
})();
