// Baseline v1 (external) — calendar + notes only

let state = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selected: null, // 'YYYY-MM-DD'
  daily: {}       // 'YYYY-MM-DD': { ratings:{physical,mental,emotional,spiritual,relational}, notes:'' }
};

function save(){ localStorage.setItem('cm_dashboard_state', JSON.stringify(state)); }
function load(){ try{ const s=localStorage.getItem('cm_dashboard_state'); if(s){ const o=JSON.parse(s); state={...state,...o}; } }catch(e){} }

function fmt(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
function parseDate(str){ const [y,m,d]=str.split('-').map(n=>parseInt(n,10)); return new Date(y,m-1,d); }

function monthDays(y,m){
  const start=new Date(y,m,1), end=new Date(y,m+1,0);
  const first=start.getDay(), total=end.getDate();
  const out=[];
  for(let i=0;i<first;i++){ const d=new Date(y,m,-(first-1-i)); out.push({date:fmt(d), other:true}); }
  for(let i=1;i<=total;i++){ const d=new Date(y,m,i); out.push({date:fmt(d), other:false}); }
  while(out.length%7!==0){ const d=new Date(y,m,total+(out.length%7)); out.push({date:fmt(d), other:true}); }
  return out;
}

function blendBg(r){
  const palette={physical:[124,139,96],mental:[95,115,155],emotional:[180,97,108],spiritual:[140,120,168],relational:[153,142,123]};
  let R=0,G=0,B=0,W=0;
  for(const k in palette){ const v=r && r[k] ? r[k]/5 : 0; R+=palette[k][0]*v; G+=palette[k][1]*v; B+=palette[k][2]*v; W+=v; }
  if(W>0){ R/=W; G/=W; B/=W; } else { R=124; G=139; B=96; }
  const a=x=>Math.round(x);
  return `linear-gradient(135deg, rgba(${a(R)},${a(G)},${a(B)}, .22), rgba(${a(R)},${a(G)},${a(B)}, .38))`;
}

function makeDay(dateStr, other){
  const data = state.daily[dateStr] || null;
  const d = parseDate(dateStr);
  const el = document.createElement('div');
  el.className='day'+(other?' other':'');
  if(dateStr===fmt(new Date())) el.classList.add('today');

  const hasRatings = !!(data && data.ratings);
  if(hasRatings){
    const avg = Object.values(data.ratings).reduce((a,b)=>a+b,0)/5;
    el.style.background = blendBg(data.ratings);
    el.style.opacity = Math.max(.6, .55 + (avg/5)*.45);
  }

  el.innerHTML = `<div class="num">${d.getDate()}</div>${hasRatings?'<div class="badge">📊</div>':''}`;
  el.addEventListener('click', ()=> {
    document.querySelectorAll('.day.selected').forEach(x=>x.classList.remove('selected'));
    el.classList.add('selected');
    showDetail(dateStr, data);
  });
  return el;
}

function render(){
  const y=state.viewYear, m=state.viewMonth;
  document.getElementById('monthLabel').textContent =
    new Date(y,m,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const grid=document.getElementById('grid'); grid.innerHTML='';
  monthDays(y,m).forEach(x=> grid.appendChild(makeDay(x.date, x.other)));
}

function updateStats(){
  const y=state.viewYear, m=state.viewMonth;
  const first=new Date(y,m,1), last=new Date(y,m+1,0);
  const list=[];
  for(let d=new Date(first); d<=last; d.setDate(d.getDate()+1)){
    const key=fmt(d); list.push({date:key, ...state.daily[key]});
  }
  const keys=['physical','mental','emotional','spiritual','relational'];
  const acc={physical:0,mental:0,emotional:0,spiritual:0,relational:0,count:0};
  list.forEach(day=>{ if(day && day.ratings){ keys.forEach(k=> acc[k]+=day.ratings[k]||0); acc.count++; }});
  keys.forEach(k=>{ const el=document.getElementById('avg-'+k); if(!el) return; el.textContent = acc.count ? (acc[k]/acc.count).toFixed(1) : '—'; });

  let best=-Infinity, days=[];
  list.forEach(d=>{ if(d && d.ratings){ const tot=Object.values(d.ratings).reduce((a,b)=>a+b,0);
    if(tot>best){best=tot;days=[d];} else if(tot===best){days.push(d);} }});
  const bestEl=document.getElementById('best-day');
  if(bestEl){
    if(!days.length){ bestEl.textContent='—'; }
    else{
      const labels=days.map(d=> new Date(d.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}));
      bestEl.textContent = labels.length<=2 ? labels.join(' & ') : labels.slice(0,2).join(' & ') + ` (+${labels.length-2})`;
    }
  }
}

function showDetail(key, data){
  state.selected = key; save();
  const d=parseDate(key);
  document.getElementById('detailDate').textContent =
    d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const r = data && data.ratings ? data.ratings : null;
  const val = (k)=> r ? (r[k] ?? '—') : '—';
  document.getElementById('d-physical').textContent  = val('physical');
  document.getElementById('d-mental').textContent    = val('mental');
  document.getElementById('d-emotional').textContent = val('emotional');
  document.getElementById('d-spiritual').textContent = val('spiritual');
  document.getElementById('d-relational').textContent= val('relational');

  const notes = document.getElementById('note');
  notes.value = (data && data.notes) ? data.notes : '';

  const hint = document.getElementById('noRatings');
  hint.style.display = r ? 'none' : 'block';

  const detail=document.getElementById('detail');
  detail.style.display='block';
  setTimeout(()=>{ detail.scrollIntoView({behavior:'smooth',block:'nearest'}); detail.classList.remove('flash'); void detail.offsetWidth; detail.classList.add('flash');}, 100);
}

function wire(){
  document.getElementById('prev').addEventListener('click', ()=>{
    state.viewMonth--; if(state.viewMonth<0){state.viewMonth=11;state.viewYear--;}
    save(); render(); updateStats();
  });
  document.getElementById('next').addEventListener('click', ()=>{
    state.viewMonth++; if(state.viewMonth>11){state.viewMonth=0;state.viewYear++;}
    save(); render(); updateStats();
  });

  document.getElementById('saveNote').addEventListener('click', ()=>{
    const key = state.selected; if(!key) return;
    const val = document.getElementById('note').value || '';
    if(!state.daily[key]) state.daily[key]={};
    state.daily[key].notes = val;
    state.daily[key].timestamp = new Date().toISOString();
    save();
    render();
    alert('Day updated.');
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  console.log('Baseline v1 external loaded');
  load(); wire(); render(); updateStats();
  const today=fmt(new Date());
  const prefix = `${state.viewYear}-${String(state.viewMonth+1).padStart(2,'0')}`;
  if(today.startsWith(prefix)){ showDetail(today, state.daily[today]||null); }
});

