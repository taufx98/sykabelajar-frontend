(function(){
  const APP_PAGE_FALLBACK='/p/app.html';
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function initials(name){return (String(name||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('')||'U').toUpperCase();}
  function formatNumber(value){return Number(value||0).toLocaleString('id-ID');}
  function formatDate(value,opts={}){
    if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';
    return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',...opts}).format(d);
  }
  function formatTime(value){if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(d);}
  function formatDateTime(value){if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';return `${formatDate(d)} · ${formatTime(d)}`;}
  function toLocalInputValue(value){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
  function localInputToISO(value){if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
  function dateTimeParts(value){const d=value?new Date(value):new Date();if(Number.isNaN(d.getTime())){const n=new Date();return {year:n.getFullYear(),month:n.getMonth()+1,day:n.getDate(),hour:9,minute:0};}return {year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),hour:d.getHours(),minute:d.getMinutes()};}
  function readDateTimeField(prefix,root=document){const q=s=>root.querySelector(s)?.value;const y=q(`[data-dt-year="${prefix}"]`),m=q(`[data-dt-month="${prefix}"]`),d=q(`[data-dt-day="${prefix}"]`),h=q(`[data-dt-hour="${prefix}"]`),mi=q(`[data-dt-minute="${prefix}"]`);if(!y||!m||!d||h===undefined||mi===undefined)return null;const dt=new Date(Number(y),Number(m)-1,Number(d),Number(h),Number(mi),0,0);return Number.isNaN(dt.getTime())?null:dt.toISOString();}
  function daysInMonth(year, month){return new Date(year, month, 0).getDate();}
  function bindSchedulePickers(root=document){
    const fields=[...root.querySelectorAll('.schedule-field[data-schedule-field]')];
    if(!fields.length)return;
    const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const pad=n=>String(n).padStart(2,'0');
    const closeAll=()=>fields.forEach(f=>f.classList.remove('open'));
    function refresh(field){
      const id=field.dataset.scheduleField;
      const y=Number(field.querySelector(`[data-dt-year="${id}"]`)?.value);
      const m=Number(field.querySelector(`[data-dt-month="${id}"]`)?.value);
      const d=Number(field.querySelector(`[data-dt-day="${id}"]`)?.value);
      const h=Number(field.querySelector(`[data-dt-hour="${id}"]`)?.value);
      const mi=Number(field.querySelector(`[data-dt-minute="${id}"]`)?.value);
      const max=daysInMonth(y,m);
      const day=field.querySelector(`[data-dt-day="${id}"]`);
      if(day){
        const current=Math.min(d||1,max);
        day.innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}">${pad(i+1)}</option>`).join('');
        day.value=String(current);
      }
      const dateText=field.querySelector('[data-schedule-date-text]');
      const timeText=field.querySelector('[data-schedule-time-text]');
      if(dateText)dateText.textContent=`${pad(day?.value||d)} ${months[Math.max(0,m-1)].slice(0,3)} ${y}`;
      if(timeText)timeText.textContent=`${pad(h)}:${pad(mi)}`;
    }
    fields.forEach(field=>{
      refresh(field);
      field.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',()=>refresh(field)));
      field.querySelectorAll('[data-schedule-open]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const was=field.classList.contains('open');closeAll();if(!was)field.classList.add('open');}));
      field.querySelector('[data-schedule-done]')?.addEventListener('click',()=>field.classList.remove('open'));
    });
    if(!root.__SYKA_SCHEDULE_OUTSIDE){
      root.__SYKA_SCHEDULE_OUTSIDE=true;
      document.addEventListener('click',e=>{if(!e.target.closest('.schedule-field'))closeAll();},{capture:true});
    }
  }

  function debounce(fn,wait){let t=null;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait);};}
  function routePath(){
    const url=new URL(window.location.href);const appPage=window.SYKA_CONFIG?.APP_PAGE||APP_PAGE_FALLBACK;
    const explicit=url.searchParams.get('route');if(explicit)return explicit;
    if(window.location.hash?.startsWith('#/'))return window.location.hash.slice(1);
    if(url.pathname===appPage){
      const tab=(url.searchParams.get('tab')||'').toLowerCase();
      const aliases={competitions:'/lomba',competition:'/lomba',lomba:'/lomba',ranking:'/juara',leaderboard:'/juara',juara:'/juara',awards:'/prestasi',achievement:'/prestasi',prestasi:'/prestasi',profile:'/profile',profil:'/profile',orders:'/pesanan',order:'/pesanan',pesanan:'/pesanan',store:'/toko',shop:'/toko',toko:'/toko',organizer:'/organizer',penyelenggara:'/organizer',admin:'/admin'};
      return aliases[tab]||'/';
    }
    return url.pathname||'/';
  }
  function queryParams(){const url=new URL(window.location.href);const p=Object.fromEntries(url.searchParams.entries());delete p.route;return p;}
  function randomId(prefix='req'){return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;}
  function cloudinaryTransform(url,opts={}){if(!url||!url.includes('/upload/'))return url||'';const [base,file]=url.split('/upload/');const t=[];if(opts.width)t.push(`w_${Math.round(opts.width)}`);if(opts.height)t.push(`h_${Math.round(opts.height)}`);if(opts.crop)t.push(`c_${opts.crop}`);if(opts.gravity)t.push(`g_${opts.gravity}`);t.push('q_auto','f_auto');return `${base}/upload/${t.join(',')}/${file}`;}
  function getStoredTheme(){return localStorage.getItem('syka_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}
  function safeJson(value,fallback=null){try{return JSON.parse(value);}catch(_){return fallback;}}
  function statusClass(status){const s=String(status||'').toUpperCase();if(['ACTIVE','APPROVED','PUBLISHED','RESULT_PUBLISHED','COMPLETED','PAID'].includes(s))return 'status-success';if(['PENDING','DRAFT','REGISTRATION_OPEN','GRADING','PROCESSING','REVIEW'].includes(s))return 'status-warning';if(['CANCELLED','REJECTED','REVOKED','SUSPENDED','FAILED'].includes(s))return 'status-danger';return 'status-neutral';}
  window.SYKA_UTILS={escapeHtml,initials,formatNumber,formatDate,formatTime,formatDateTime,toLocalInputValue,localInputToISO,dateTimeParts,readDateTimeField,bindSchedulePickers,debounce,routePath,queryParams,randomId,cloudinaryTransform,getStoredTheme,safeJson,statusClass};
})();
