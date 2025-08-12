// fa-baseline.js — Baseline v1 with stronger colors + note badge + click-to-detail
console.log('Baseline v1 external loaded');

let state = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selected: null,              // 'YYYY-MM-DD'
  daily: {}                    // { 'YYYY-MM-DD': { ratings:{physical,mental,emotional,spiritual,relational}, notes:'' } }
};

// expose globally so fa-checkin.js can update it
window.state = state;

function save(){ try{ localStorage.setItem('cm_dashboard_state', JSON.stringify(state)); }catch(e){} }
function load(){ try{ const s=localStorage.getItem('cm_dashboard_state'); if(s){ state={...state, ...JSON.parse(s)}; window.state = state; } }catch(e){} }

function fmt(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
function parseDate(str){ const [y,m,d]=str.split('-').map(n=>parseInt(n,10)); return new Date(y, m-1, d); }

function monthDays(y,m){
  const first = new Date(y,m,1), last = new Date(y,m+1,0);
  const out = [];
  const lead = first.getDay();
  for(let i=0;i<lead;i++) out.push({date:fmt(new Date(y,m, i - lead + 1)), other:true});
  for(let d=1; d<=last.getDate(); d++) out.push({date:fmt(new Date(y,m,d)), other:false});
  const trail = (7 - (out.length % 7)) % 7;
  for(let i=1;i<=trail;i++) out.push({date:fmt(new Date(y,m,last.getDate()+i)), other:true});
  return out;
}

// Base palette
const palette = {
  physical:   [124,139, 96],
  mental:     [ 95,115,155],
  emotional:  [180, 97,108],
  spiritual:  [140,120,168],
  relational: [153,142,123]
};

// Strong blended gradient
function blendBg(ratings){
  let R=0,G=0,B=0,W=0;
  for(const k in palette){
    const v = ratings && ratings[k] ? ratings[k]/5 : 0;
    R += palette[k][0]*v; G += palette[k][1]*v; B += palette[k][2]*v; W += v;
  }
  if(W>0){ R=Math.round(R/W); G=Math.round(G/W); B=Math.round(B/W); }
  else { R=124; G=139; B=96; }
  return `linear-gradient(135deg, rgba(${R},${G},${B}, .35), rgba(${R},${G},${B}, .65))`;
}

function showDetail(dateStr, data){
  state.selected = dateStr;
  const d = parseDate(dateStr);
  const elDate = document.getElementById('detailDate');
  if(elDate){
    elDate.textContent = d.toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric', year:'numeric'});
  }

  const fields = ['physical','mental','emotional','spiritual','relational'];
  const ratings = (data && data.ratings) ? data.ratings : {};
  const hasRatings = fields.some(f => (ratings?.[f]||0) > 0);

  const noRatings = document.getElementById('noRatings');
  if(noRatings) noRatings.style.display = hasRatings ? 'none' : 'block';

  fields.forEach(f=>{
    const slot = document.getElementById(`d-${f}`);
    if(slot) slot.textContent = ratings?.[f] || '—';
  });

  const note = document.getElementById('note');
  if(note) note.value = (data && data.notes) ? data.notes : '';

  // rebind Update button
  const btn = document.getElementById('saveNote');
  if(btn){ btn.replaceWith(btn.cloneNode(true)); }
  document.getElementById('saveNote')?.addEventListener('click', ()=>{
    state.daily[dateStr] = state.daily[dateStr] || {ratings:{physical:0,mental:0,emotional:0,spiritual:0,relational:0}, notes:''};
    if(note) state.daily[dateStr].notes = note.value || '';
    save();
    render();
    showDetail(dateStr, state.daily[dateStr]);
    alert('Day updated.');
  }, {once:true});

  document.getElementById('detail')?.scrollIntoView({behavior:'smooth', block:'start'});
}
window.showDetail = showDetail;

function makeDay(dateStr, other){
  const d = parseDate(dateStr);
  const data = state.daily[dateStr] || null;
  const el = document.createElement('div');
  el.className = 'day' + (other ? ' other' : '');

  if(fmt(new Date()) === dateStr) el.classList.add('today');
  if(state.selected === dateStr) el.classList.add('selected');

  const ratings = data?.ratings || null;
  const hasRatings = !!(ratings && ['physical','mental','emotional','spiritual','relational'].some(k=>ratings[k]>0));
  if(hasRatings){
    el.style.background = blendBg(ratings);
    const total = Object.values(ratings).reduce((a,b)=>a+(b||0),0);
    el.style.opacity = Math.max(.6, .55 + (total/25)*.45);
  }else{
    el.style.background = '';
    el.style.opacity = '';
  }

  const noteMark = (data && data.notes && data.notes.trim()) ? '📝' : '';
  const ratingMark = hasRatings ? '📊' : '';
  el.innerHTML = `<div class="num">${d.getDate()}</div>${
    (noteMark||ratingMark) ? `<div class="badge">${noteMark}${ratingMark}</div>` : ''
  }`;

  el.addEventListener('click', ()=>{
    document.querySelectorAll('.day.selected').forEach(n=>n.classList.remove('selected'));
    el.classList.add('selected');
    showDetail(dateStr, data);
  });

  return el;
}

function updateStats(){
  const start = new Date(state.viewYear, state.viewMonth, 1);
  const end   = new Date(state.viewYear, state.viewMonth+1, 0);
  const inMonth = d => d >= start && d <= end;

  const fields = ['physical','mental','emotional','spiritual','relational'];
  const sums   = {physical:0,mental:0,emotional:0,spiritual:0,relational:0};
  const counts = {physical:0,mental:0,emotional:0,spiritual:0,relational:0};

  let bestDay=null, bestTotal=-1;

  Object.entries(state.daily).forEach(([k,day])=>{
    const d = parseDate(k); if(!inMonth(d) || !day?.ratings) return;
    let total=0;
    fields.forEach(f=>{
      const v = Number(day.ratings[f]||0);
      if(v>0){ sums[f]+=v; counts[f]++; total+=v; }
    });
    if(total>bestTotal){ bestTotal=total; bestDay=d; }
  });

  const setVal=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = isFinite(val)? val.toFixed(1) : '—'; };
  setVal('avg-physical',  counts.physical?  sums.physical /counts.physical : NaN);
  setVal('avg-mental',    counts.mental?    sums.mental   /counts.mental   : NaN);
  setVal('avg-emotional', counts.emotional? sums.emotional/counts.emotional: NaN);
  setVal('avg-spiritual', counts.spiritual? sums.spiritual/counts.spiritual: NaN);
  setVal('avg-relational',counts.relational?sums.relational/counts.relational:NaN);

  const bestEl = document.getElementById('best-day');
  if(bestEl) bestEl.textContent = bestDay
    ? bestDay.toLocaleDateString(undefined,{month:'short', day:'numeric'})
    : '—';
}

function render(){
  // Month title
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const title = document.querySelector('#calendar h2, #calendar .monthTitle, #monthTitle');
  if(title) title.textContent = `${months[state.viewMonth]} ${state.viewYear}`;

  // Grid container (support either .grid or .days)
  const grid = document.querySelector('#calendar .grid, #calendar .days');
  if(grid){
    grid.innerHTML = '';
    monthDays(state.viewYear, state.viewMonth).forEach(({date,other})=>{
      grid.appendChild(makeDay(date, other));
    });
  }
  updateStats();
}
window.render = render;

function goto(delta){
  const d = new Date(state.viewYear, state.viewMonth + delta, 1);
  state.viewYear = d.getFullYear();
  state.viewMonth = d.getMonth();
  save(); render();
}

function wireNav(){
  document.querySelector('#calendar .prev, button.prev, [data-nav="prev"]')?.addEventListener('click', ()=>goto(-1));
  document.querySelector('#calendar .next, button.next, [data-nav="next"]')?.addEventListener('click', ()=>goto(1));
}

load();
document.addEventListener('DOMContentLoaded', ()=>{
  wireNav();
  state.selected = state.selected || fmt(new Date());
  window.state = state; // keep global in sync after load()
  save();
  render();
  showDetail(state.selected, state.daily[state.selected]);
});
