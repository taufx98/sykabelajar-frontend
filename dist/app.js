/* src/core/config.js */
(function () {
  const existing = window.SYKA_CONFIG || {};
  window.SYKA_CONFIG = Object.freeze({
    APP_NAME: 'Sykabelajar.id',
    APP_VERSION: '4.13.0-control-plane',
    ROUTE_MODE: existing.ROUTE_MODE || 'query',
    APP_PAGE: existing.APP_PAGE || '/p/app.html',
    ASSET_BASE_URL: existing.ASSET_BASE_URL || './dist',
    SUPABASE_URL: existing.SUPABASE_URL || 'https://jrfogwueytiddnanetth.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: existing.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_H3zjdAEE-ItQ08YRj8MieQ_kNMcsAHa',
    CLOUDINARY_CLOUD_NAME: existing.CLOUDINARY_CLOUD_NAME || 'sykabelajar',
    CLOUDINARY_UPLOAD_PRESET: existing.CLOUDINARY_UPLOAD_PRESET || 'sykabelajar_preset',
    CLOUDINARY_FOLDER: existing.CLOUDINARY_FOLDER || 'sykabelajar/users/profiles',
    CLOUDINARY_FOLDERS: {
      profile: 'sykabelajar/users/profiles',
      competition: 'sykabelajar/competitions/posters',
      promo: 'sykabelajar/home/promos',
      product: 'sykabelajar/store/products',
      paymentProof: 'sykabelajar/orders/payment-proofs',
      twibbon: 'sykabelajar/competitions/twibbon'
    },
    DEFAULT_PAGE_SIZE: 12,
    PROFILE_COLUMNS: {
      avatarUrl: 'avatar_url',
      avatarPublicId: 'avatar_public_id',
      avatarWidth: 'avatar_width',
      avatarHeight: 'avatar_height',
      avatarVersion: 'avatar_version',
      avatarResourceType: 'avatar_resource_type'
    }
  });
})();




/* src/core/state.js */
(function () {
  const listeners = new Set();
  const state = {
    auth: { session: null, user: null, profile: null, roles: [], permissions: [], status: 'booting' },
    route: { name: 'home', params: {}, query: {} },
    ui: { theme: 'dark', sidebar: true, modal: null, toastQueue: [] },
    network: { online: navigator.onLine, lastError: null, requestId: null },
    competition: { current: null, status: 'idle' },
    registration: { current: null, status: 'idle' },
    attempt: { current: null, status: 'idle', saving: 'idle' },
    notifications: { unreadCount: 0 },
    economy: { xp: 0, eduCoins: 0, season: null }
  };

  function getState() { return state; }
  function patch(path, value) {
    const parts = path.split('.');
    let target = state;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
    target[parts[parts.length - 1]] = value;
    listeners.forEach(fn => { try { fn(state, path); } catch (_) {} });
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function resetUserState() {
    state.auth = { session: null, user: null, profile: null, roles: [], permissions: [], status: 'anonymous' };
    state.registration = { current: null, status: 'idle' };
    state.attempt = { current: null, status: 'idle', saving: 'idle' };
    state.notifications = { unreadCount: 0 };
    state.economy = { xp: 0, eduCoins: 0, season: null };
    listeners.forEach(fn => { try { fn(state, 'auth.reset'); } catch (_) {} });
  }
  window.SYKA_STATE = { getState, patch, subscribe, resetUserState };
})();




/* src/core/events.js */
(function () {
  const bus = new EventTarget();
  window.SYKA_EVENTS = {
    on(name, fn) { const h = e => fn(e.detail); bus.addEventListener(name, h); return () => bus.removeEventListener(name, h); },
    emit(name, detail) { bus.dispatchEvent(new CustomEvent(name, { detail })); }
  };
})();




/* src/lib/utils.js */
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
  function dateTimeParts(value){
    const d=value?new Date(value):new Date();
    if(Number.isNaN(d.getTime())){
      const n=new Date();
      return {year:n.getFullYear(),month:n.getMonth()+1,day:n.getDate(),hour:n.getHours(),minute:Math.floor(n.getMinutes()/5)*5};
    }
    return {year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),hour:d.getHours(),minute:Math.floor(d.getMinutes()/5)*5};
  }
  function readDateTimeField(prefix,root=document){
    const q=s=>root.querySelector(s)?.value;
    const y=q(`[data-dt-year="${prefix}"]`),m=q(`[data-dt-month="${prefix}"]`),d=q(`[data-dt-day="${prefix}"]`),h=q(`[data-dt-hour="${prefix}"]`),mi=q(`[data-dt-minute="${prefix}"]`);
    if([y,m,d,h,mi].some(v=>v===undefined||v===null||v===''))return null;
    const dt=new Date(Number(y),Number(m)-1,Number(d),Number(h),Number(mi),0,0);
    return Number.isNaN(dt.getTime())?null:dt.toISOString();
  }
  function daysInMonth(year,month){return new Date(year,month,0).getDate();}
  function setDateTimeField(prefix,value,root=document){
    const p=dateTimeParts(value); const set=(sel,v)=>{const el=root.querySelector(sel);if(el)el.value=String(v);};
    set(`[data-dt-year="${prefix}"]`,p.year); set(`[data-dt-month="${prefix}"]`,p.month); set(`[data-dt-day="${prefix}"]`,p.day); set(`[data-dt-hour="${prefix}"]`,p.hour); set(`[data-dt-minute="${prefix}"]`,p.minute);
    const field=root.querySelector(`[data-schedule-field="${prefix}"]`); if(field){field.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  const CAL_MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const CAL_WEEK=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  function normalizeYmd(value,fallbackToday=true){
    if(value){
      const raw=String(value).slice(0,10);
      if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
        const [y,m,d]=raw.split('-').map(Number);
        const test=new Date(y,m-1,d);
        if(test.getFullYear()===y&&test.getMonth()===m-1&&test.getDate()===d)return raw;
      }
    }
    if(!fallbackToday)return '';
    const n=new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
  }
  function calendarGridHtml(year,month,selected,maxDate,minDate){
    const first=new Date(year,month-1,1);
    const mondayIndex=(first.getDay()+6)%7;
    const total=daysInMonth(year,month);
    const prevTotal=daysInMonth(year,month-1<=0?12:month-1);
    const cells=[];
    for(let i=0;i<mondayIndex;i++){
      const day=prevTotal-mondayIndex+i+1;
      const pm=month===1?12:month-1;
      const py=month===1?year-1:year;
      cells.push({year:py,month:pm,day,muted:true});
    }
    for(let d=1;d<=total;d++)cells.push({year,month,day:d,muted:false});
    while(cells.length%7) {
      const idx=cells.length-mondayIndex-total+1;
      const nextDay=idx;
      const nm=month===12?1:month+1;
      const ny=month===12?year+1:year;
      cells.push({year:ny,month:nm,day:nextDay,muted:true});
    }
    return `<div class="calendar-weekdays">${CAL_WEEK.map(x=>`<span>${x}</span>`).join('')}</div><div class="calendar-grid">${cells.map(c=>{
      const iso=`${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`;
      const disabled=(maxDate&&iso>maxDate)||(minDate&&iso<minDate);
      const selectedClass=selected===iso?' selected':'';
      const today=normalizeYmd('',true)===iso?' today':'';
      const weekend=(new Date(c.year,c.month-1,c.day).getDay()===0||new Date(c.year,c.month-1,c.day).getDay()===6)?' weekend':'';
      return `<button type="button" class="calendar-day${c.muted?' muted':''}${selectedClass}${today}${weekend}" data-calendar-date="${iso}" ${disabled?'disabled':''}>${c.day}</button>`;
    }).join('')}</div>`;
  }
  function formatCalendarDisplay(value,placeholder='Pilih tanggal'){
    const raw=normalizeYmd(value,false);if(!raw)return placeholder;
    const [y,m,d]=raw.split('-').map(Number);return `${String(d).padStart(2,'0')} ${CAL_MONTHS[m-1].slice(0,3)} ${y}`;
  }
  function calendarPickerMarkup(id,value='',options={}){
    const current=normalizeYmd(value,false);const base=current||normalizeYmd('',true);const [y,m,d]=base.split('-').map(Number);const maxDate=options.maxDate||'';const minDate=options.minDate||'';
    return `<div class="syka-date-picker" data-date-picker="${id}" data-max-date="${maxDate}" data-min-date="${minDate}">
      <button type="button" class="syka-date-trigger" data-date-open="${id}"><span class="syka-date-icon">▣</span><span data-date-text>${formatCalendarDisplay(current,options.placeholder||'Pilih tanggal')}</span><span class="syka-date-chevron">⌄</span></button>
      <div class="syka-date-popover" data-date-popover="${id}">
        <div class="syka-date-head"><div><strong data-calendar-title>${CAL_MONTHS[m-1]} ${y}</strong><small>${options.help||'Pilih tanggal dari kalender.'}</small></div><button type="button" class="syka-icon-btn" data-date-close aria-label="Tutup">×</button></div>
        <div class="calendar-toolbar calendar-toolbar-compact-v410"><button type="button" class="calendar-nav" data-calendar-prev aria-label="Bulan sebelumnya">‹</button><select class="calendar-month-select" data-calendar-month-select>${CAL_MONTHS.map((name,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${name}</option>`).join('')}</select><select class="calendar-year-select" data-calendar-year-select>${Array.from({length:151},(_,i)=>y-100+i).map(yr=>`<option value="${yr}" ${yr===y?'selected':''}>${yr}</option>`).join('')}</select><button type="button" class="calendar-nav" data-calendar-next aria-label="Bulan berikutnya">›</button></div>
        <div data-calendar-body>${calendarGridHtml(y,m,current,maxDate,minDate)}</div>
        <div class="syka-date-footer"><button type="button" class="btn btn-ghost btn-sm" data-calendar-today>Hari ini</button><button type="button" class="btn btn-primary btn-sm" data-date-done>Selesai</button></div>
      </div>
      <input type="hidden" id="${id}" value="${current}">
    </div>`;
  }
  function bindCalendarPickers(root=document){
    const fields=[...root.querySelectorAll('.syka-date-picker[data-date-picker]')];
    if(!fields.length)return;
    function closeAll(){fields.forEach(f=>f.classList.remove('open'));}
    fields.forEach(field=>{
      const id=field.dataset.datePicker;const input=field.querySelector(`#${CSS.escape(id)}`);const pop=field.querySelector('[data-date-popover]');
      if(!input||!pop)return;
      let current=normalizeYmd(input.value,false);const initial=current||normalizeYmd('',true);let [vy,vm]=initial.split('-').map(Number);let viewYear=vy,viewMonth=vm;
      const maxDate=field.dataset.maxDate||'';const minDate=field.dataset.minDate||'';
      function render(){
        field.querySelector('[data-calendar-title]').textContent=`${CAL_MONTHS[viewMonth-1]} ${viewYear}`;
        field.querySelector('[data-calendar-month]').textContent=`${CAL_MONTHS[viewMonth-1]} ${viewYear}`;
        field.querySelector('[data-calendar-body]').innerHTML=calendarGridHtml(viewYear,viewMonth,current,maxDate,minDate);
        field.querySelectorAll('[data-calendar-date]').forEach(btn=>btn.addEventListener('click',()=>{
          current=btn.dataset.calendarDate;input.value=current;field.querySelector('[data-date-text]').textContent=formatCalendarDisplay(current);viewYear=Number(current.slice(0,4));viewMonth=Number(current.slice(5,7));render();
        }));
      }
      function positionCalendar(){
        const trigger=field.querySelector('[data-date-open]');
        if(!trigger)return;
        const pop=field.querySelector('[data-date-popover]');
        if(!pop)return;
        const rect=trigger.getBoundingClientRect();
        const gutter=12;
        const width=Math.min(380,window.innerWidth-gutter*2);
        const maxHeight=Math.min(560,window.innerHeight-gutter*2);
        let left=Math.min(rect.left,window.innerWidth-width-gutter);
        left=Math.max(gutter,left);
        let top=rect.bottom+8;
        if(top+maxHeight>window.innerHeight-gutter){
          top=Math.max(gutter,rect.top-maxHeight-8);
        }
        pop.style.position='fixed';
        pop.style.left=left+'px';
        pop.style.top=top+'px';
        pop.style.width=width+'px';
        pop.style.maxHeight=maxHeight+'px';
        pop.style.overflow='auto';
        pop.style.zIndex='10001';
      }
      field.querySelector('[data-date-open]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const was=field.classList.contains('open');closeAll();if(!was){current=normalizeYmd(input.value,false)||'';const basis=current||normalizeYmd('',true);viewYear=Number(basis.slice(0,4));viewMonth=Number(basis.slice(5,7));render();field.classList.add('open');requestAnimationFrame(positionCalendar);}});
      window.addEventListener('resize',()=>{if(field.classList.contains('open'))positionCalendar();});
      window.addEventListener('scroll',()=>{if(field.classList.contains('open'))positionCalendar();},true);
      field.querySelector('[data-date-close]')?.addEventListener('click',()=>field.classList.remove('open'));
      field.querySelector('[data-date-done]')?.addEventListener('click',()=>field.classList.remove('open'));
      field.querySelector('[data-calendar-prev]')?.addEventListener('click',()=>{viewMonth--;if(viewMonth<1){viewMonth=12;viewYear--;}render();});
      field.querySelector('[data-calendar-next]')?.addEventListener('click',()=>{viewMonth++;if(viewMonth>12){viewMonth=1;viewYear++;}render();});
      field.querySelector('[data-calendar-month-select]')?.addEventListener('change',e=>{viewMonth=Number(e.target.value);render();});
      field.querySelector('[data-calendar-year-select]')?.addEventListener('change',e=>{viewYear=Number(e.target.value);render();});
      field.querySelector('[data-calendar-today]')?.addEventListener('click',()=>{const today=normalizeYmd('',true);if(maxDate&&today>maxDate||minDate&&today<minDate)return;current=today;input.value=today;field.querySelector('[data-date-text]').textContent=formatCalendarDisplay(today);viewYear=Number(today.slice(0,4));viewMonth=Number(today.slice(5,7));render();});
      render();
    });
  }
  function dateTimePickerMarkup(id,value='',options={}){
    const p=dateTimeParts(value); const pad=n=>String(n).padStart(2,'0');
    const current=`${p.year}-${pad(p.month)}-${pad(p.day)}`;
    const years=[]; const baseYear=new Date().getFullYear();
    for(let y=baseYear-20;y<=baseYear+20;y++) years.push(y);
    const monthYearOptions=[];
    for(const y of years) for(let m=1;m<=12;m++) monthYearOptions.push({value:`${y}-${pad(m)}`,label:`${CAL_MONTHS[m-1]} ${y}`,y,m});
    return `<div class="syka-datetime-picker" data-datetime-picker="${escapeHtml(id)}" data-max-date="${escapeHtml(options.maxDate||'')}" data-min-date="${escapeHtml(options.minDate||'')}" data-disabled="${options.disabled?'true':'false'}">
      <div class="syka-datetime-row">
        <label class="syka-datetime-date-field"><span>Tanggal${options.required?' *':''}</span><span class="syka-datetime-input-wrap"><input type="text" inputmode="numeric" maxlength="10" autocomplete="off" data-datetime-manual placeholder="dd/mm/yyyy" value="${pad(p.day)}/${pad(p.month)}/${p.year}" ${options.disabled?'disabled':''}><button type="button" class="syka-datetime-calendar-btn" data-datetime-open aria-label="Buka kalender" ${options.disabled?'disabled':''}>▣</button></span></label>
        <button type="button" class="syka-datetime-time-trigger" data-datetime-open ${options.disabled?'disabled':''}><span class="syka-datetime-time-icon">◷</span><span data-datetime-time-text>${pad(p.hour)}:${pad(Math.floor(p.minute/5)*5)}</span><span class="syka-datetime-chevron">⌄</span></button>
      </div>
      <div class="syka-datetime-popover" data-datetime-popover>
        <div class="syka-datetime-popover-head"><div><strong>${escapeHtml(options.title||'Pilih tanggal & waktu')}</strong><small>${escapeHtml(options.help||'Gunakan kalender atau ketik tanggal secara manual.')}</small></div><button type="button" class="syka-icon-btn" data-datetime-close aria-label="Tutup">×</button></div>
        <div class="syka-datetime-toolbar"><button type="button" class="calendar-nav" data-datetime-prev aria-label="Bulan sebelumnya">‹</button><select class="syka-datetime-month-year" data-datetime-month-year aria-label="Bulan dan tahun">${monthYearOptions.map(o=>`<option value="${o.value}" ${o.y===p.year&&o.m===p.month?'selected':''}>${o.label}</option>`).join('')}</select><button type="button" class="calendar-nav" data-datetime-next aria-label="Bulan berikutnya">›</button></div>
        <div class="syka-datetime-body"><div class="syka-datetime-calendar"><div data-datetime-calendar-body>${calendarGridHtml(p.year,p.month,current,options.maxDate||'',options.minDate||'')}</div></div><div class="syka-datetime-time-panel"><div class="syka-datetime-time-head"><strong>Waktu</strong><small>Interval 5 menit</small></div><div class="syka-time-columns"><div class="syka-time-col" data-datetime-hours>${Array.from({length:24},(_,h)=>`<button type="button" class="syka-time-option ${h===p.hour?'selected':''}" data-datetime-hour-option="${h}">${pad(h)}</button>`).join('')}</div><span>:</span><div class="syka-time-col" data-datetime-minutes>${Array.from({length:12},(_,i)=>i*5).map(mi=>`<button type="button" class="syka-time-option ${mi===Math.floor(p.minute/5)*5?'selected':''}" data-datetime-minute-option="${mi}">${pad(mi)}</button>`).join('')}</div></div></div></div>
        <div class="syka-datetime-footer"><button type="button" class="btn btn-ghost btn-sm" data-datetime-today>Hari ini</button><span>Waktu lokal perangkat</span><button type="button" class="btn btn-primary btn-sm" data-datetime-done>Selesai</button></div>
      </div>
      <input type="hidden" id="${escapeHtml(id)}" value="${escapeHtml(value||'')}">
      <input type="hidden" data-dt-year="${escapeHtml(id)}" value="${p.year}"><input type="hidden" data-dt-month="${escapeHtml(id)}" value="${p.month}"><input type="hidden" data-dt-day="${escapeHtml(id)}" value="${p.day}"><input type="hidden" data-dt-hour="${escapeHtml(id)}" value="${p.hour}"><input type="hidden" data-dt-minute="${escapeHtml(id)}" value="${Math.floor(p.minute/5)*5}">
    </div>`;
  }
  function bindDateTimePickers(root=document){
    const fields=[...root.querySelectorAll('.syka-datetime-picker[data-datetime-picker]')]; if(!fields.length)return;
    const pad=n=>String(n).padStart(2,'0'); const closeAll=()=>fields.forEach(f=>f.classList.remove('open'));
    const validManual=/^(\d{2})\/(\d{2})\/(\d{4})$/;
    const getState=field=>{const id=field.dataset.datetimePicker; const q=s=>field.querySelector(s)?.value; return {id,year:Number(q(`[data-dt-year="${id}"]`)),month:Number(q(`[data-dt-month="${id}"]`)),day:Number(q(`[data-dt-day="${id}"]`)),hour:Number(q(`[data-dt-hour="${id}"]`)),minute:Number(q(`[data-dt-minute="${id}"]`))};};
    const setValue=(field,key,val)=>{const id=field.dataset.datetimePicker; const el=field.querySelector(`[data-dt-${key}="${id}"]`); if(el)el.value=String(val);};
    function position(field){const trigger=field.querySelector('[data-datetime-open]');const pop=field.querySelector('[data-datetime-popover]');if(!trigger||!pop)return;const r=trigger.getBoundingClientRect();const gutter=12;const width=Math.min(690,innerWidth-gutter*2);const height=Math.min(520,innerHeight-gutter*2);let left=Math.max(gutter,Math.min(r.left,innerWidth-width-gutter));let top=r.bottom+10;if(top+height>innerHeight-gutter)top=Math.max(gutter,r.top-height-10);pop.style.left=`${left}px`;pop.style.top=`${top}px`;pop.style.width=`${width}px`;pop.style.maxHeight=`${height}px`;}
    fields.forEach(field=>{
      const id=field.dataset.datetimePicker; const manual=field.querySelector('[data-datetime-manual]'); const pop=field.querySelector('[data-datetime-popover]'); if(!manual||!pop)return;
      function render(){const st=getState(field);const raw=`${st.year}-${pad(st.month)}-${pad(st.day)}`;field.querySelector('[data-datetime-time-text]').textContent=`${pad(st.hour)}:${pad(st.minute)}`;manual.value=`${pad(st.day)}/${pad(st.month)}/${st.year}`;field.querySelector('[data-datetime-month-year]').value=`${st.year}-${pad(st.month)}`;field.querySelector('[data-datetime-calendar-body]').innerHTML=calendarGridHtml(st.year,st.month,raw,field.dataset.maxDate||'',field.dataset.minDate||'');field.querySelectorAll('[data-calendar-date]').forEach(btn=>btn.addEventListener('click',()=>{const [yy,mm,dd]=btn.dataset.calendarDate.split('-').map(Number);setValue(field,'year',yy);setValue(field,'month',mm);setValue(field,'day',dd);render();}));field.querySelectorAll('[data-datetime-hour-option]').forEach(btn=>{btn.classList.toggle('selected',Number(btn.dataset.datetimeHourOption)===st.hour);btn.addEventListener('click',()=>{setValue(field,'hour',Number(btn.dataset.datetimeHourOption));render();});});field.querySelectorAll('[data-datetime-minute-option]').forEach(btn=>{btn.classList.toggle('selected',Number(btn.dataset.datetimeMinuteOption)===st.minute);btn.addEventListener('click',()=>{setValue(field,'minute',Number(btn.dataset.datetimeMinuteOption));render();});});const hs=field.querySelector(`[data-datetime-hours] .selected`),ms=field.querySelector(`[data-datetime-minutes] .selected`);hs?.scrollIntoView({block:'center'});ms?.scrollIntoView({block:'center'});const dt=new Date(st.year,st.month-1,st.day,st.hour,st.minute,0,0);const hidden=field.querySelector(`#${CSS.escape(id)}`);if(hidden&&!Number.isNaN(dt.getTime()))hidden.value=dt.toISOString();}
      manual.addEventListener('input',()=>{let v=manual.value.replace(/\D/g,'').slice(0,8);if(v.length>4)v=v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4);else if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);manual.value=v;const m=v.match(validManual);if(!m)return;const dd=Number(m[1]),mm=Number(m[2]),yy=Number(m[3]);if(mm<1||mm>12||dd<1||dd>daysInMonth(yy,mm)||yy<1900||yy>2200)return;setValue(field,'day',dd);setValue(field,'month',mm);setValue(field,'year',yy);render();});
      field.querySelectorAll('[data-datetime-open]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const was=field.classList.contains('open');closeAll();if(!was){field.classList.add('open');render();requestAnimationFrame(()=>position(field));}}));
      field.querySelector('[data-datetime-close]')?.addEventListener('click',e=>{e.preventDefault();closeAll();});field.querySelector('[data-datetime-done]')?.addEventListener('click',()=>{render();closeAll();});
      field.querySelector('[data-datetime-prev]')?.addEventListener('click',()=>{const st=getState(field);st.month--;if(st.month<1){st.month=12;st.year--;}setValue(field,'month',st.month);setValue(field,'year',st.year);const max=daysInMonth(st.year,st.month);if(st.day>max)setValue(field,'day',max);render();});
      field.querySelector('[data-datetime-next]')?.addEventListener('click',()=>{const st=getState(field);st.month++;if(st.month>12){st.month=1;st.year++;}setValue(field,'month',st.month);setValue(field,'year',st.year);const max=daysInMonth(st.year,st.month);if(st.day>max)setValue(field,'day',max);render();});
      field.querySelector('[data-datetime-month-year]')?.addEventListener('change',e=>{const [yy,mm]=e.target.value.split('-').map(Number);setValue(field,'year',yy);setValue(field,'month',mm);const max=daysInMonth(yy,mm);if(getState(field).day>max)setValue(field,'day',max);render();});
      field.querySelector('[data-datetime-today]')?.addEventListener('click',()=>{const t=normalizeYmd('',true).split('-').map(Number);setValue(field,'year',t[0]);setValue(field,'month',t[1]);setValue(field,'day',t[2]);render();});
      render();
    });
    if(!root.__SYKA_DATETIME_OUTSIDE){root.__SYKA_DATETIME_OUTSIDE=true;const reposition=()=>fields.forEach(f=>{if(f.classList.contains('open'))position(f);});window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,{passive:true});document.addEventListener('click',e=>{if(!e.target.closest('.syka-datetime-picker'))closeAll();});}
  }

  function bindSchedulePickers(root=document){
    const fields=[...root.querySelectorAll('.schedule-field[data-schedule-field]')];
    if(!fields.length)return;
    const pad=n=>String(n).padStart(2,'0');
    const manualPattern=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const closeAll=()=>fields.forEach(f=>f.classList.remove('open'));
    const normalizeMinute=value=>Math.min(55,Math.max(0,Math.round(Number(value||0)/5)*5));

    fields.forEach(field=>{
      const id=field.dataset.scheduleField;
      let viewState={
        year:Number(field.querySelector(`[data-dt-year="${id}"]`)?.value)||new Date().getFullYear(),
        month:Number(field.querySelector(`[data-dt-month="${id}"]`)?.value)||(new Date().getMonth()+1)
      };

      function refresh(){
        const q=s=>field.querySelector(s)?.value;
        const y=Number(q(`[data-dt-year="${id}"]`))||new Date().getFullYear();
        const m=Number(q(`[data-dt-month="${id}"]`))||(new Date().getMonth()+1);
        const d=Number(q(`[data-dt-day="${id}"]`))||1;
        const h=Number(q(`[data-dt-hour="${id}"]`))||0;
        const mi=normalizeMinute(q(`[data-dt-minute="${id}"]`));
        const max=daysInMonth(y,m);
        const day=Math.min(Math.max(d,1),max);
        const set=(sel,v)=>{const el=field.querySelector(sel);if(el)el.value=String(v);};
        set(`[data-dt-day="${id}"]`,day);set(`[data-dt-minute="${id}"]`,mi);
        const manual=field.querySelector('[data-schedule-manual]');
        if(manual && document.activeElement!==manual)manual.value=`${pad(day)}/${pad(m)}/${y}`;
        field.querySelector('[data-schedule-date-text]')?.replaceChildren(document.createTextNode(`${pad(day)} ${CAL_MONTHS[m-1].slice(0,3)} ${y}`));
        field.querySelector('[data-schedule-time-text]')?.replaceChildren(document.createTextNode(`${pad(h)}:${pad(mi)}`));
        field.querySelector('[data-schedule-calendar-title]')?.replaceChildren(document.createTextNode(`${CAL_MONTHS[m-1]} ${y}`));
        const body=field.querySelector('[data-schedule-calendar-body]');
        if(body){
          const selected=`${y}-${pad(m)}-${pad(day)}`;
          body.innerHTML=calendarGridHtml(y,m,selected,field.dataset.maxDate||'',field.dataset.minDate||'');
          body.querySelectorAll('[data-calendar-date]').forEach(btn=>btn.addEventListener('click',()=>{
            const [yy,mm,dd]=btn.dataset.calendarDate.split('-').map(Number);
            set(`[data-dt-year="${id}"]`,yy);set(`[data-dt-month="${id}"]`,mm);set(`[data-dt-day="${id}"]`,dd);
            viewState={year:yy,month:mm};refresh();
          }));
        }
      }

      function positionPopover(){
        const pop=field.querySelector('.schedule-popover');
        const button=field.querySelector('button[data-schedule-open]');
        if(!pop||!button)return;
        const rect=button.getBoundingClientRect();
        const gutter=12,width=Math.min(390,window.innerWidth-gutter*2),height=Math.min(520,window.innerHeight-gutter*2);
        let left=Math.min(rect.left,window.innerWidth-width-gutter);left=Math.max(gutter,left);
        let top=rect.bottom+8;if(top+height>window.innerHeight-gutter)top=Math.max(gutter,rect.top-height-8);
        pop.style.position='fixed';pop.style.left=`${left}px`;pop.style.top=`${top}px`;pop.style.width=`${width}px`;pop.style.maxHeight=`${height}px`;pop.style.overflow='auto';pop.style.zIndex='10000';
      }

      const manual=field.querySelector('[data-schedule-manual]');
      manual?.addEventListener('input',()=>{
        let v=manual.value.replace(/\D/g,'').slice(0,8);
        if(v.length>4)v=v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4); else if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);
        manual.value=v;
        const m=v.match(manualPattern);
        if(!m)return;
        const dd=Number(m[1]),mm=Number(m[2]),yy=Number(m[3]);
        if(mm<1||mm>12||dd<1||dd>daysInMonth(yy,mm)||yy<1900||yy>2200)return;
        field.querySelector(`[data-dt-year="${id}"]`).value=String(yy);
        field.querySelector(`[data-dt-month="${id}"]`).value=String(mm);
        field.querySelector(`[data-dt-day="${id}"]`).value=String(dd);
        viewState={year:yy,month:mm};refresh();
      });
      field.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',refresh));
      field.querySelectorAll('[data-schedule-open]').forEach(btn=>btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();const was=field.classList.contains('open');closeAll();
        if(!was){field.classList.add('open');refresh();requestAnimationFrame(positionPopover);}
      }));
      field.querySelector('[data-schedule-done]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();refresh();closeAll();});
      field.querySelector('[data-schedule-close]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeAll();});
      field.querySelector('[data-schedule-prev]')?.addEventListener('click',()=>{viewState.month--;if(viewState.month<1){viewState.month=12;viewState.year--;}field.querySelector(`[data-dt-year="${id}"]`).value=String(viewState.year);field.querySelector(`[data-dt-month="${id}"]`).value=String(viewState.month);refresh();});
      field.querySelector('[data-schedule-next]')?.addEventListener('click',()=>{viewState.month++;if(viewState.month>12){viewState.month=1;viewState.year++;}field.querySelector(`[data-dt-year="${id}"]`).value=String(viewState.year);field.querySelector(`[data-dt-month="${id}"]`).value=String(viewState.month);refresh();});
      field.querySelector('[data-schedule-today]')?.addEventListener('click',()=>{const t=normalizeYmd('',true);const [ty,tm,td]=t.split('-').map(Number);field.querySelector(`[data-dt-year="${id}"]`).value=String(ty);field.querySelector(`[data-dt-month="${id}"]`).value=String(tm);field.querySelector(`[data-dt-day="${id}"]`).value=String(td);viewState={year:ty,month:tm};refresh();});
      refresh();
    });

    if(!root.__SYKA_SCHEDULE_OUTSIDE){
      root.__SYKA_SCHEDULE_OUTSIDE=true;
      window.addEventListener('resize',()=>fields.forEach(f=>f.classList.contains('open')&&(()=>{const b=f.querySelector('button[data-schedule-open]');const p=f.querySelector('.schedule-popover');if(!b||!p)return;const r=b.getBoundingClientRect(),g=12,w=Math.min(390,innerWidth-g*2),h=Math.min(520,innerHeight-g*2);p.style.left=`${Math.max(g,Math.min(r.left,innerWidth-w-g))}px`;p.style.top=`${Math.max(g,r.bottom+8+h>innerHeight-g?r.top-h-8:r.bottom+8)}px`;})()));
      window.addEventListener('scroll',()=>fields.forEach(f=>{if(f.classList.contains('open')){const p=f.querySelector('.schedule-popover'),b=f.querySelector('button[data-schedule-open]');if(p&&b){const r=b.getBoundingClientRect(),g=12,w=Math.min(390,innerWidth-g*2),h=Math.min(520,innerHeight-g*2);p.style.left=`${Math.max(g,Math.min(r.left,innerWidth-w-g))}px`;p.style.top=`${Math.max(g,r.bottom+8+h>innerHeight-g?r.top-h-8:r.bottom+8)}px`;}}}),{passive:true});
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
  window.SYKA_UTILS={escapeHtml,initials,formatNumber,formatDate,formatTime,formatDateTime,toLocalInputValue,localInputToISO,dateTimeParts,setDateTimeField,readDateTimeField,calendarPickerMarkup,dateTimePickerMarkup,bindDateTimePickers,bindCalendarPickers,bindSchedulePickers,normalizeYmd,debounce,routePath,queryParams,randomId,cloudinaryTransform,getStoredTheme,safeJson,statusClass};
})();


/* src/lib/supabase.js */
(function () {
  let client = null;

  function getStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return undefined;
    }
  }

  function init() {
    if (client) return client;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase JS belum dimuat.');
    }

    const cfg = window.SYKA_CONFIG;
    const storage = getStorage();
    const defaultStorageKey = 'sb-jrfogwueytiddnanetth-auth-token';
    const legacyStorageKey = 'sykabelajar-auth-v4_1';
    try {
      if (storage && !storage.getItem(defaultStorageKey)) {
        const legacy = storage.getItem(legacyStorageKey);
        if (legacy) storage.setItem(defaultStorageKey, legacy);
      }
    } catch (_) {}

    client = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          storage,
          storageKey: defaultStorageKey,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    );

    return client;
  }

  function get() {
    return client || init();
  }

  window.SYKA_SUPABASE = { init, get };
})();




/* src/lib/cloudinary.js */
(function () {
  const queues = new Map();

  function widgetConfig(options = {}) {
    const cfg = window.SYKA_CONFIG || {};
    return {
      cloudName: cfg.CLOUDINARY_CLOUD_NAME,
      uploadPreset: cfg.CLOUDINARY_UPLOAD_PRESET,
      folder: options.folder || cfg.CLOUDINARY_FOLDER || 'sykabelajar/uploads',
      sources: options.sources || ['local', 'camera'],
      multiple: false,
      resourceType: options.resourceType || 'image',
      cropping: options.crop || false,
      croppingAspectRatio: options.croppingAspectRatio,
      maxFileSize: options.maxFileSize || 8000000,
      clientAllowedFormats: options.formats || ['png', 'jpg', 'jpeg', 'webp'],
      showAdvancedOptions: false,
      singleUploadAutoClose: true,
      styles: { palette: { window:'#fff', windowBorder:'#e2e8f0', tabIcon:'#7c3aed', menuIcons:'#475569', textDark:'#0f172a', textLight:'#fff', link:'#7c3aed', action:'#7c3aed', inactiveTabIcon:'#94a3b8', error:'#dc2626', inProgress:'#7c3aed', complete:'#059669' } }
    };
  }

  function normalizeInfo(info) {
    if (!info || typeof info !== 'object') throw new Error('Cloudinary tidak mengembalikan informasi file.');
    const secure_url=String(info.secure_url||'').trim();
    if(!secure_url) throw new Error('Upload Cloudinary selesai tetapi URL file tidak tersedia.');
    return { secure_url, public_id:info.public_id||'', original_filename:info.original_filename||info.filename||'File', width:Number(info.width)||null, height:Number(info.height)||null, version:info.version!=null?String(info.version):'', resource_type:info.resource_type||'image', format:info.format||'', bytes:Number(info.bytes)||0 };
  }

  function openImageWidget(options={},onSuccess,onError){
    const key=JSON.stringify(widgetConfig(options));
    return new Promise((resolve,reject)=>{
      if(!window.cloudinary || typeof window.cloudinary.createUploadWidget!=='function'){reject(new Error('Cloudinary Upload Widget belum dimuat.'));return;}
      let entry=queues.get(key);
      if(!entry){
        entry={pending:[],widget:null};
        entry.widget=window.cloudinary.createUploadWidget(widgetConfig(options),(error,result)=>{
          const job=entry.pending.shift();
          if(!job)return;
          if(error){job.reject(error);return;}
          if(result?.event==='success'){try{job.resolve(normalizeInfo(result.info));}catch(e){job.reject(e);}}
        });
        queues.set(key,entry);
      }
      entry.pending.push({resolve:info=>{onSuccess?.(info);resolve(info);},reject:error=>{onError?.(error);reject(error);}});
      try{entry.widget.open();}catch(e){entry.pending.pop();reject(e);}
    });
  }

  const openAvatarWidget=(s,e)=>openImageWidget({folder:(window.SYKA_CONFIG?.CLOUDINARY_FOLDER||'sykabelajar/users/profiles'),crop:true,croppingAspectRatio:1,maxFileSize:5000000},s,e);
  const openCompetitionImageWidget=(s,e)=>openImageWidget({folder:'sykabelajar/competitions/posters',maxFileSize:10000000,crop:true,croppingAspectRatio:16/9},s,e);
  const openPromoImageWidget=(s,e)=>openImageWidget({folder:'sykabelajar/home/promos',maxFileSize:10000000,crop:true,croppingAspectRatio:16/9},s,e);
  const openProductImageWidget=(s,e)=>openImageWidget({folder:'sykabelajar/store/products',maxFileSize:8000000,crop:true,croppingAspectRatio:1},s,e);
  const openPaymentProofWidget=(s,e)=>openImageWidget({folder:'sykabelajar/orders/payment-proofs',maxFileSize:8000000,crop:false},s,e);
  const openTwibbonWidget=(s,e)=>openImageWidget({folder:'sykabelajar/competitions/twibbon',maxFileSize:10000000,crop:true,croppingAspectRatio:1},s,e);

  async function uploadFile(file, options={}) {
    if (!(file instanceof File)) throw new Error('File gambar belum dipilih.');
    const cfg = window.SYKA_CONFIG || {};
    const cloudName = cfg.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = cfg.CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error('Konfigurasi Cloudinary belum tersedia.');
    if (file.size > (options.maxFileSize || 10000000)) throw new Error('Ukuran file terlalu besar.');
    const resourceType = options.resourceType || 'image';
    const allowed = options.formats || (resourceType==='raw' ? ['pdf'] : ['png','jpg','jpeg','webp']);
    const ext = String(file.name.split('.').pop() || '').toLowerCase();
    if (ext && !allowed.includes(ext)) throw new Error(resourceType==='raw'?'Format file yang didukung hanya PDF.':'Format gambar harus PNG, JPG, JPEG, atau WEBP.');
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);
    if (options.folder) form.append('folder', options.folder);
    const res = await fetch(endpoint, { method:'POST', body:form });
    const data = await res.json().catch(()=>({}));
    if (!res.ok || !data.secure_url) throw new Error(data.error?.message || 'Upload Cloudinary gagal.');
    return normalizeInfo(data);
  }

    async function uploadDocumentFile(file,options={}){return uploadFile(file,{...options,resourceType:'raw',formats:['pdf'],maxFileSize:options.maxFileSize||15000000});}
  window.SYKA_CLOUDINARY={openImageWidget,openAvatarWidget,openCompetitionImageWidget,openPromoImageWidget,openProductImageWidget,openPaymentProofWidget,openTwibbonWidget,uploadFile,uploadDocumentFile};
})();


/* src/services/auth.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getSession() { const { data, error } = await client().auth.getSession(); if (error) throw error; return data.session; }
  async function signIn({ email, password }) { const { data, error } = await client().auth.signInWithPassword({ email, password }); if (error) throw error; return data; }
  async function signUp({ email, password, fullName, username, accountType='student', grade, birthDate, institution, schoolId, guardianName, whatsapp, subjects, organizerName, organizerSlug }) {
    const url = new URL(window.location.href); url.searchParams.delete('route'); url.hash = '';
    const metadata = {
      full_name: fullName || '',
      username: username || '',
      grade: grade || '',
      birth_date: birthDate || null,
      institution: institution || '',
      school_id: schoolId || null,
      guardian_name: guardianName || '',
      account_type: accountType || 'student',
      whatsapp: whatsapp || '',
      subjects: subjects || '',
      organizer_name: organizerName || '',
      organizer_slug: organizerSlug || ''
    };
    const { data, error } = await client().auth.signUp({ email, password, options: { emailRedirectTo: url.toString(), data: metadata } });
    if (error) throw error;
    return data;
  }
  async function signOut() { const { error } = await client().auth.signOut(); if (error) throw error; }
  async function reauthenticate({ email, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('Email dan password wajib diisi.');
    const { data, error } = await client().auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
    if (!data?.session?.user?.email || String(data.session.user.email).toLowerCase() !== normalizedEmail) {
      throw new Error('Akun terautentikasi tidak sesuai dengan akun Admin aktif.');
    }
    return data;
  }
  async function resetPassword(email) { const url = new URL(window.location.href); url.searchParams.set('route', '/profile'); url.searchParams.set('recovery', '1'); url.hash = ''; const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo: url.toString() }); if (error) throw error; }
  async function updatePassword(password) { const { data, error } = await client().auth.updateUser({ password }); if (error) throw error; return data; }
  window.SYKA_AUTH_SERVICE = { getSession, signIn, signUp, signOut, reauthenticate, resetPassword, updatePassword };
})();


/* src/services/profile.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function getMe(userId){if(!userId)return null;const{data,error}=await c().from('profiles').select('*').eq('id',userId).maybeSingle();if(error)throw error;return data;}
  async function updateProfile(userId,payload){if(!userId)throw new Error('LOGIN_REQUIRED');const{data,error}=await c().from('profiles').update(payload).eq('id',userId).select('*').single();if(error)throw error;return data;}
  async function getRoles(userId){if(!userId)return{roles:[],permissions:[]};const{data,error}=await c().from('user_roles').select('role,is_active').eq('user_id',userId).eq('is_active',true);if(error)throw error;return{roles:(data||[]).map(x=>x.role),permissions:[]};}
  window.SYKA_PROFILE_SERVICE={getMe,updateProfile,getRoles};
})();


/* src/services/social.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function listPosts({limit=20}= {}){const {data,error}=await c().from('posts').select('id,user_id,kind,body,media_url,created_at,like_count,comment_count').eq('visibility','PUBLIC').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return data||[];}
  async function like(postId){const {data,error}=await c().rpc('toggle_post_like',{p_post_id:postId});if(error)throw error;return data;}
  async function comment(postId,body){const {data,error}=await c().rpc('create_post_comment',{p_post_id:postId,p_body:body});if(error)throw error;return data;}
  async function listComments(postId){const {data,error}=await c().from('comments').select('id,user_id,body,created_at,like_count').eq('post_id',postId).eq('status','PUBLISHED').order('created_at',{ascending:true});if(error)throw error;return data||[];}
  window.SYKA_SOCIAL_SERVICE={listPosts,like,comment,listComments};
})();


/* src/services/task.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function listTasks(){const {data,error}=await c().from('daily_tasks').select('*').eq('is_active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function claim(taskId){const {data,error}=await c().rpc('claim_daily_task',{p_task_id:taskId});if(error)throw error;return data;}
  async function complete(taskId){const {data,error}=await c().rpc('complete_daily_task',{p_task_id:taskId});if(error)throw error;return data||{};}
  window.SYKA_TASK_SERVICE={listTasks,claim,complete};
})();


/* src/services/competition.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  function normalize(row){return {id:row.id,slug:row.slug||row.id,title:row.title||'Kompetisi',category:row.category||'Kompetisi',status:row.status||'DRAFT',poster:row.poster_url||row.cover_url||row.image_url||'',description:row.short_description||row.description||'',juknisUrl:row.juknis_url||'',kisiKisiPublished:!!row.kisi_kisi_published,kisiKisiContent:row.kisi_kisi_content||'',registrationStartsAt:row.registration_starts_at,registrationEndsAt:row.registration_ends_at,startsAt:row.starts_at,endsAt:row.ends_at,announcementAt:row.announcement_at,visibility:row.visibility||'PUBLIC',organizerId:row.organizer_id,data:row};}
  async function list({limit=12,status='PUBLIC_ONLY'}={}){let q=c().from('competitions').select('*').order('created_at',{ascending:false}).limit(limit);if(status==='PUBLIC_ONLY')q=q.eq('visibility','PUBLIC').neq('status','CANCELLED');if(status&&status!=='PUBLIC_ONLY')q=q.eq('status',status);const{data,error}=await q;if(error)throw error;return(data||[]).map(normalize);}
  async function getBySlug(slug){const{data,error}=await c().from('competitions').select('*').eq('slug',slug).maybeSingle();if(error)throw error;return data?normalize(data):null;}
  async function getLevels(id){const{data,error}=await c().from('competition_levels').select('*').eq('competition_id',id).order('created_at');if(error)throw error;return data||[];}
  async function getRules(id){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',id).maybeSingle();if(error)throw error;return data;}
  async function getRewards(id){const{data,error}=await c().from('competition_rewards').select('*').eq('competition_id',id).order('rank_code');if(error)throw error;return data||[];}
  async function getTwibbonTemplate(id){const{data,error}=await c().from('twibbon_templates').select('*').eq('competition_id',id).eq('is_active',true).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;return data;}
  window.SYKA_COMPETITION_SERVICE={list,getBySlug,getLevels,getRules,getRewards,getTwibbonTemplate};
})();


/* src/services/registration.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function getStatus(userId,competitionId){if(!userId||!competitionId)return null;const{data,error}=await c().from('registrations').select('*').eq('user_id',userId).eq('competition_id',competitionId).maybeSingle();if(error)throw error;return data;}
  async function getReferralCode(){const{data,error}=await c().rpc('ensure_referral_code');if(error)throw error;return data;}
  async function register({competitionId,participationKey=null,competitionLevelId=null,socialProofUrl=null,twibbonCompleted=false,socialPlatform=null,socialUsername=null,referralCode=null}){
    const{data:userData}=await c().auth.getUser();if(!userData.user)throw new Error('LOGIN_REQUIRED');
    const{data,error}=await c().rpc('register_for_competition_v4_8',{p_competition_id:competitionId,p_participation_key:participationKey,p_competition_level_id:competitionLevelId,p_social_proof_url:socialProofUrl,p_twibbon_completed:!!twibbonCompleted,p_social_platform:socialPlatform,p_social_username:socialUsername,p_referral_code:referralCode});
    if(error)throw error;return data;
  }
  async function checkEligibility({competitionId,grade}){if(!competitionId)return{eligible:false,reason:'COMPETITION_REQUIRED'};const{data,error}=await c().rpc('check_registration_eligibility',{p_competition_id:competitionId,p_grade:grade||null});if(error)throw error;return data||{eligible:true,reason:null};}
  window.SYKA_REGISTRATION_SERVICE={getStatus,register,checkEligibility,getReferralCode};
})();


/* src/services/attempt.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  async function start(competitionId){const{data,error}=await c().rpc('start_competition_attempt',{p_competition_id:competitionId});if(error)throw error;return data;}
  async function getResume(attemptId){const{data,error}=await c().rpc('get_attempt_resume',{p_attempt_id:attemptId});if(error)throw error;return data||null;}
  async function saveAnswer({attemptId,questionId,answerJson}){const{data,error}=await c().rpc('save_attempt_answer',{p_attempt_id:attemptId,p_question_id:questionId,p_answer_json:answerJson||{}});if(error)throw error;return data;}
  async function submit({attemptId,idempotencyKey}){const{data,error}=await c().rpc('submit_competition_attempt',{p_attempt_id:attemptId,p_idempotency_key:idempotencyKey||crypto.randomUUID()});if(error)throw error;return data;}
  window.SYKA_ATTEMPT_SERVICE={start,saveAnswer,submit,getResume};
})();


/* src/services/leaderboard.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function get({ seasonId, scope = 'global', limit = 50 } = {}) {
    let q = client().from('leaderboard').select('*').limit(limit);
    if (seasonId) q = q.eq('season_id', seasonId);
    if (scope && scope !== 'global') q = q.eq('scope', scope);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  window.SYKA_LEADERBOARD_SERVICE = { get };
})();




/* src/services/award.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function getAwards(userId) {
    if (!userId) return [];
    const { data, error } = await client().from('user_achievements').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function verify(code) {
    const { data, error } = await client().from('certificate_verifications').select('*').eq('verification_code', code).maybeSingle();
    if (error) throw error;
    return data;
  }
  window.SYKA_AWARD_SERVICE = { getAwards, verify };
})();




/* src/services/notification.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function list(userId) { if (!userId) return []; const { data, error } = await client().from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30); if (error) throw error; return data || []; }
  async function markRead(id) { const { error } = await client().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }
  window.SYKA_NOTIFICATION_SERVICE = { list, markRead };
})();




/* src/services/order.service.js */
(function () {
  function client() { return window.SYKA_SUPABASE.get(); }
  async function list(userId) { if (!userId) return []; const { data, error } = await client().from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) throw error; return data || []; }
  async function create(payload) { const { data, error } = await client().from('orders').insert(payload).select('*').single(); if (error) throw error; return data; }
  window.SYKA_ORDER_SERVICE = { list, create };
})();




/* src/services/store.service.js */
(function(){
  function client(){return window.SYKA_SUPABASE.get();}

  function roleAudience(){
    const roles=window.SYKA_STATE.getState().auth.roles||[];
    if(roles.includes('admin')) return ['student','teacher','organizer'];
    const out=[];
    if(roles.includes('student')) out.push('student');
    if(roles.includes('teacher')) out.push('teacher');
    if(roles.includes('organizer_member')) out.push('organizer');
    return out.length?out:['student'];
  }

  async function listProducts(){
    const {data,error}=await client().from('commerce_products').select('*').eq('is_active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(error)throw error;
    const products=data||[];
    const ids=products.map(p=>p.id);
    if(!ids.length)return[];
    const {data:benefits,error:be}=await client().from('commerce_product_benefits').select('*').in('product_id',ids).order('created_at',{ascending:true});
    if(be)throw be;
    const map={};
    (benefits||[]).forEach(b=>(map[b.product_id]??=[]).push(b));
    const audience=roleAudience();
    return products.filter(p=>p.audiences?.some(a=>audience.includes(a))).map(p=>({...p,benefits:map[p.id]||[]}));
  }

  async function listEntitlements(userId){
    if(!userId)return[];
    const {data,error}=await client().from('user_product_entitlements').select('*').eq('user_id',userId).order('created_at',{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function createProductOrder(productId,quantity=1,meta={}){
    const {data,error}=await client().rpc('create_product_order_with_proof',{p_product_id:productId,p_quantity:Math.max(1,Number(quantity)||1),p_whatsapp:meta.whatsapp||null,p_payment_method:meta.payment_method||'MANUAL_TRANSFER',p_proof_url:meta.proof_url||null,p_proof_public_id:meta.proof_public_id||null,p_proof_width:meta.proof_width||null,p_proof_height:meta.proof_height||null,p_proof_version:meta.proof_version||null,p_proof_resource_type:meta.proof_resource_type||null});
    if(error)throw error;
    return data;
  }

  window.SYKA_STORE_SERVICE={listProducts,listEntitlements,createProductOrder};
})();


/* src/services/admin.service.js */
(function(){
  function client(){ return window.SYKA_SUPABASE.get(); }
  async function platformStats(){
    const {data,error}=await client().from('platform_stats').select('*').limit(1).maybeSingle();
    if(error) throw error;
    return data || {};
  }
  async function listSlides({admin=false}={}){
    let q=client().from('home_slides').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(!admin){ const now=new Date().toISOString(); q=q.eq('is_active',true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`); }
    const {data,error}=await q;
    if(error) throw error;
    return data||[];
  }
  async function createSlide(payload){ const {data,error}=await client().from('home_slides').insert(payload).select('*').single(); if(error) throw error; return data; }
  async function updateSlide(id,payload){ const {data,error}=await client().from('home_slides').update(payload).eq('id',id).select('*').single(); if(error) throw error; return data; }
  async function deleteSlide(id){ const {error}=await client().from('home_slides').delete().eq('id',id); if(error) throw error; }
  async function searchSchools(term,limit=8){
    const value=String(term||'').trim();
    if(value.length<2) return [];
    const {data,error}=await client().from('schools').select('id,name,city,province').ilike('name',`%${value}%`).order('name').limit(limit);
    if(error) throw error;
    return data||[];
  }
  async function listCompetitions({organizerId=null,limit=50}={}){
    let q=client().from('competitions').select('*').order('created_at',{ascending:false}).limit(limit);
    if(organizerId) q=q.eq('organizer_id',organizerId);
    const {data,error}=await q; if(error) throw error; return data||[];
  }
  async function createCompetition(payload){ const {data,error}=await client().from('competitions').insert(payload).select('*').single(); if(error) throw error; return data; }
  async function updateCompetition(id,payload){ const {data,error}=await client().from('competitions').update(payload).eq('id',id).select('*').single(); if(error) throw error; return data; }
  async function listMyOrganizerMemberships(userId){
    if(!userId) return [];
    const {data,error}=await client().from('organizer_members').select('organizer_id,user_id,member_role,is_active,organizers(id,name,slug,status)').eq('user_id',userId).eq('is_active',true);
    if(error) throw error;
    return data||[];
  }
  window.SYKA_ADMIN_SERVICE={platformStats,listSlides,createSlide,updateSlide,deleteSlide,searchSchools,listCompetitions,createCompetition,updateCompetition,listMyOrganizerMemberships};
})();


/* src/services/controlplane.service.js */
(function(){
  const c=()=>window.SYKA_SUPABASE.get();
  const q=async(table,select='*',builder)=>{let query=c().from(table).select(select);query=builder?builder(query):query;const{data,error}=await query;if(error)throw error;return data||[];};
  const save=async(table,payload,id)=>{let r=id?await c().from(table).update(payload).eq('id',id).select('*').single():await c().from(table).insert(payload).select('*').single();if(r.error)throw r.error;return r.data;};
  async function platformStats(){const{data,error}=await c().from('platform_stats').select('*').limit(1).maybeSingle();if(error)throw error;return data||{};}
  async function listUsers({search='',limit=100}={}){let qy=c().from('profiles').select('id,username,full_name,grade,institution,avatar_url,status,created_at,updated_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())qy=qy.or(`username.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%,institution.ilike.%${search.trim()}%`);const{data,error}=await qy;if(error)throw error;const ids=(data||[]).map(x=>x.id);if(!ids.length)return[];const{data:roles,error:re}=await c().from('user_roles').select('user_id,role,is_active').in('user_id',ids);if(re)throw re;const map={};(roles||[]).forEach(r=>(map[r.user_id]??=[]).push(r));return(data||[]).map(p=>({...p,roles:map[p.id]||[]}));}
  async function setUserStatus(id,status,reason){const{data,error}=await c().rpc('admin_set_user_status',{p_user_id:id,p_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function setUserRole(id,role,active=true,reason){const{data,error}=await c().rpc('admin_set_user_role',{p_user_id:id,p_role:role,p_active:active,p_reason:reason||null});if(error)throw error;return data;}
  async function listOrganizers(){return q('organizers','id,name,slug,status,description,logo_asset_url,owner_user_id',qy=>qy.order('name',{ascending:true}).limit(200));}
  async function listMyOrganizerMemberships(userId){if(!userId)return[];return q('organizer_members','organizer_id,user_id,member_role,is_active,organizers(id,name,slug,status)',qy=>qy.eq('user_id',userId).eq('is_active',true));}
  async function checkCompetitionName(title, excludeId=null){
    const normalized=String(title||'').trim();
    if(normalized.length<3) return {available:false,reason:'Nama kompetisi minimal 3 karakter.'};
    let qy=c().from('competitions').select('id,title,slug,status').ilike('title',normalized).limit(1);
    const {data,error}=await qy;
    if(error) throw error;
    const hit=(data||[])[0];
    if(!hit || (excludeId && hit.id===excludeId)) return {available:true,slug:slugify(normalized)};
    return {available:false,reason:'Nama kompetisi sudah digunakan.',existing:hit,slug:hit.slug};
  }
  function slugify(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
  async function listCompetitionsAdmin({search='',status='',organizerId=null,limit=100}={}){let qy=c().from('competitions').select('id,organizer_id,title,slug,category,status,registration_starts_at,registration_ends_at,starts_at,ends_at,announcement_at,poster_url,poster_public_id,poster_width,poster_height,poster_version,poster_resource_type,juknis_url,juknis_public_id,kisi_kisi_published,kisi_kisi_content,visibility,short_description,created_at').order('created_at',{ascending:false}).limit(limit);if(search.trim())qy=qy.or(`title.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`);if(status)qy=qy.eq('status',status);if(organizerId)qy=qy.eq('organizer_id',organizerId);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function transitionCompetition(id,status,reason){const{data,error}=await c().rpc('transition_competition',{p_competition_id:id,p_to_status:status,p_reason:reason||null});if(error)throw error;return data;}
  async function saveCompetition(payload,id=null){return save('competitions',payload,id);}
  async function listLevels(id){return q('competition_levels','*',qy=>qy.eq('competition_id',id).order('created_at'));}
  async function saveLevel(payload,id=null){return save('competition_levels',payload,id);}
  async function getRegistrationRules(id){const{data,error}=await c().from('registration_rules').select('*').eq('competition_id',id).maybeSingle();if(error)throw error;return data;}
  async function saveRegistrationRules(payload,id){const{data,error}=await c().from('registration_rules').upsert({...payload,competition_id:id},{onConflict:'competition_id'}).select('*').single();if(error)throw error;return data;}
  async function listRewards(id){return q('competition_rewards','*',qy=>qy.eq('competition_id',id).order('rank_code'));}
  async function saveReward(payload,id=null){return save('competition_rewards',payload,id);}
  async function listQuestionBanks({organizerId=null,gradeCode=null}={}){return q('question_banks','*',qy=>{if(organizerId)qy=qy.eq('organizer_id',organizerId);if(gradeCode)qy=qy.eq('grade_code',gradeCode);return qy.order('created_at',{ascending:false});});}
  async function saveQuestionBank(payload,id=null){return save('question_banks',payload,id);}
  async function listQuestions({competitionId=null,bankId=null}={}){return q('questions','id,question_bank_id,competition_id,type,prompt,points,required,display_order,status,config,created_at',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);if(bankId)qy=qy.eq('question_bank_id',bankId);return qy.order('display_order',{ascending:true});});}
  async function saveQuestion(payload,id=null){return save('questions',payload,id);}
  async function listOptions(questionId){return q('question_options','id,question_id,label,value,is_correct,display_order',qy=>qy.eq('question_id',questionId).order('display_order'));}
  async function replaceOptions(questionId,opts){const{error:delError}=await c().from('question_options').delete().eq('question_id',questionId);if(delError)throw delError;if(opts?.length){const{error}=await c().from('question_options').insert(opts.map((o,i)=>({question_id:questionId,label:o.label,value:o.value,is_correct:!!o.is_correct,display_order:i})));if(error)throw error;}}
  async function listRegistrations({competitionId=null,status=''}={}){let qy=c().from('registrations').select('id,competition_id,user_id,status,twibbon_asset_url,social_proof_url,submitted_at,approved_at,rejected_at,rejection_reason,metadata,profiles:user_id(id,username,full_name,grade,institution,avatar_url),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function reviewRegistration(id,decision,reason){const{data,error}=await c().rpc('review_registration',{p_registration_id:id,p_decision:decision,p_reason:reason||null});if(error)throw error;return data;}
  async function listAttempts({competitionId=null,status=''}={}){let qy=c().from('attempts').select('id,competition_id,participant_id,registration_id,attempt_number,status,started_at,expires_at,submitted_at,finalized_at,score,profiles:participant_id(id,username,full_name,grade,institution),competitions:competition_id(id,title)').order('created_at',{ascending:false});if(competitionId)qy=qy.eq('competition_id',competitionId);if(status)qy=qy.eq('status',status);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listGradingItems(attemptId){return q('grading_items','*',qy=>qy.eq('attempt_id',attemptId).order('created_at'));}
  async function saveGrade(payload,id=null){return save('grading_items',payload,id);}
  async function finalizeAttempt(id,score){const{data,error}=await c().rpc('finalize_attempt_manual',{p_attempt_id:id,p_score:Number(score)||0,p_reason:'Manual finalization by organizer/admin'});if(error)throw error;return data;}
  async function listAwards({competitionId=null}={}){return q('awards','id,user_id,competition_id,rank_code,title,points,emblem_url,issued_at,visibility,profiles:user_id(id,username,full_name,avatar_url)',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);return qy.order('issued_at',{ascending:false});});}
  async function listCertificates({competitionId=null}={}){return q('certificates','id,user_id,competition_id,status,current_revision,created_at,updated_at,profiles:user_id(id,username,full_name)',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);return qy.order('created_at',{ascending:false});});}

  async function saveAdminAward(payload,id=null){return save('awards',payload,id);}
  async function updateCertificate(id,status){const{data,error}=await c().from('certificates').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listOrders({limit=100}={}){return q('orders','*,order_items(*),profiles:user_id(id,username,full_name,avatar_url)',qy=>qy.order('created_at',{ascending:false}).limit(limit));}
  async function updateOrder(id,status){const{data,error}=await c().from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return data;}
  async function listTwibbonTemplates({competitionId=null,organizerId=null}={}){return q('twibbon_templates','*',qy=>{if(competitionId)qy=qy.eq('competition_id',competitionId);if(organizerId)qy=qy.eq('organizer_id',organizerId);return qy.order('created_at',{ascending:false});});}
  async function saveTwibbonTemplate(payload,id=null){return save('twibbon_templates',payload,id);}
  async function listModeration(){const[posts,comments,reports]=await Promise.all([q('posts','id,title,status,created_at,author_user_id',qy=>qy.order('created_at',{ascending:false}).limit(50)),q('comments','id,body,moderation_state,created_at,user_id',qy=>qy.order('created_at',{ascending:false}).limit(50)),q('comment_reports','id,comment_id,reason,status,created_at',qy=>qy.order('created_at',{ascending:false}).limit(50))]);return{posts,comments,reports};}
  async function moderatePost(id,status){return save('posts',{status,updated_at:new Date().toISOString()},id);}
  async function moderateComment(id,moderation_state){return save('comments',{moderation_state,updated_at:new Date().toISOString()},id);}
  async function moderateQuestion(id,status){return save('questions',{status,updated_at:new Date().toISOString()},id);}
  async function listPlans({organizerId=null}={}){return q('organizer_plans','*',qy=>{if(organizerId)qy=qy.eq('organizer_id',organizerId);return qy.order('created_at',{ascending:false});});}
  async function listActiveOrganizerPlan(organizerId){const rows=await listPlans({organizerId});return rows.find(x=>x.is_active)||null;}
  async function getPendingOrganizerPlanOrder(organizerId){
    const user=window.SYKA_STATE.getState().auth.user;
    if(!user?.id || !organizerId) return null;
    const {data,error}=await c().from('orders').select('*,order_items(*)').eq('user_id',user.id).eq('status','PENDING_PAYMENT').order('created_at',{ascending:false}).limit(20);
    if(error)throw error;
    return (data||[]).find(o=>(o.order_items||[]).some(i=>i.product_type==='PLAN' && i.metadata?.organizer_id===organizerId))||null;
  }
  async function listPlanCatalog(){return q('plan_catalog','*',qy=>qy.eq('is_active',true).order('sort_order',{ascending:true}));}
  async function chooseOrganizerPlan(organizerId,planCode){const{data,error}=await c().rpc('choose_organizer_plan',{p_organizer_id:organizerId,p_plan_code:planCode});if(error)throw error;return data;}
  async function assignOrganizerPlan(organizerId,planCode,startsAt=null,endsAt=null){const{data,error}=await c().rpc('admin_assign_organizer_plan',{p_organizer_id:organizerId,p_plan_code:planCode,p_starts_at:startsAt,p_ends_at:endsAt});if(error)throw error;return data;}

  async function privilegedAssignOrganizerPlan(organizerId,planCode,startsAt,endsAt,reason){
    const{data,error}=await c().rpc('admin_privileged_assign_organizer_plan',{p_organizer_id:organizerId,p_plan_code:planCode,p_starts_at:startsAt,p_ends_at:endsAt,p_reason:reason||null});
    if(error)throw error; return data;
  }
  async function privilegedUpsertPlanCatalog(payload){
    const{data,error}=await c().rpc('admin_privileged_upsert_plan_catalog',{p_plan_code:payload.plan_code,p_name:payload.name,p_badge:payload.badge||null,p_description:payload.description||null,p_monthly_price:Number(payload.monthly_price)||0,p_yearly_price:Number(payload.yearly_price)||0,p_is_active:payload.is_active!==false,p_sort_order:Number(payload.sort_order)||0,p_reason:payload.reason||null});
    if(error)throw error; return data;
  }
  async function privilegedDeactivatePlan(planCode,reason){
    const{data,error}=await c().rpc('admin_privileged_deactivate_plan',{p_plan_code:planCode,p_reason:reason||null});
    if(error)throw error; return data;
  }
  async function createOrganizerPlanOrderV2(payload){
    const{data,error}=await c().rpc('create_organizer_plan_order_v2',{
      p_organizer_id:payload.organizer_id,
      p_plan_code:payload.plan_code,
      p_billing_period:payload.billing_period,
      p_whatsapp:payload.whatsapp,
      p_proof_url:payload.proof_url,
      p_proof_public_id:payload.proof_public_id||null,
      p_proof_width:payload.proof_width||null,
      p_proof_height:payload.proof_height||null,
      p_proof_version:payload.proof_version||null,
      p_proof_resource_type:payload.proof_resource_type||null
    });
    if(error)throw error; return data;
  }
  async function listEntitlements(){return q('plan_entitlements','*',qy=>qy.order('plan_code'));}
  async function saveEntitlement(payload,id=null){return save('plan_entitlements',payload,id);}
  async function deleteEntitlement(planCode,capability){const{error}=await c().from('plan_entitlements').delete().eq('plan_code',planCode).eq('capability',capability);if(error)throw error;}
  async function savePlanBundle(payload){const{data,error}=await c().rpc('admin_save_plan_bundle',{p_plan_code:payload.plan_code,p_name:payload.name,p_description:payload.description||null,p_badge:payload.badge||null,p_monthly_price:Number(payload.monthly_price)||0,p_yearly_price:Number(payload.yearly_price)||0,p_is_active:payload.is_active!==false,p_entitlements:payload.entitlements||[]});if(error)throw error;return data;}
  async function listCommerceProducts({admin=false}={}){let qy=c().from('commerce_products').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(!admin)qy=qy.eq('is_active',true);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listCommerceBenefits(productId){return q('commerce_product_benefits','*',qy=>qy.eq('product_id',productId).order('created_at',{ascending:true}));}
  async function saveCommerceProduct(payload,id=null){return save('commerce_products',payload,id);}
  async function deleteCommerceProduct(id){const{error}=await c().from('commerce_products').delete().eq('id',id);if(error)throw error;}
  async function replaceCommerceBenefits(productId,benefits=[]){const{error:de}=await c().from('commerce_product_benefits').delete().eq('product_id',productId);if(de)throw de;if(benefits.length){const{error}=await c().from('commerce_product_benefits').insert(benefits.map(b=>({...b,product_id:productId})));if(error)throw error;}}
  async function listFlags(){return q('feature_flags','*',qy=>qy.order('key'));}
  async function setFlag(key,enabled,config={}){const{data,error}=await c().from('feature_flags').upsert({key,enabled,config,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(error)throw error;return data;}
  async function listSettings(){return q('global_settings','*',qy=>qy.order('key'));}
  async function setSetting(key,value){const{data,error}=await c().from('global_settings').upsert({key,value,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(error)throw error;return data;}
  async function listAudit({limit=100,action=''}={}){let qy=c().from('audit_logs').select('*').order('created_at',{ascending:false}).limit(limit);if(action)qy=qy.ilike('action',`%${action}%`);const{data,error}=await qy;if(error)throw error;return data||[];}
  async function listTasksAdmin(){const{data,error}=await c().from('daily_tasks').select('id,title,description,task_type,points,exp,sort_order,is_active,requirements,created_at,updated_at').order('sort_order',{ascending:true});if(error)throw error;return data||[];}
  async function saveTask(payload,id=null){return save('daily_tasks',payload,id);}
  async function listAnnouncements({admin=false}={}){
    let qy=c().from('header_announcements').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false}).limit(20);
    if(!admin){
      qy=qy.eq('is_active',true);
      const now=new Date().toISOString();
      qy=qy.or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`);
    }
    const {data,error}=await qy; if(error) throw error; return data||[];
  }
  async function saveAnnouncement(payload,id=null){return save('header_announcements',payload,id);}
  async function deleteAnnouncement(id){const{error}=await c().from('header_announcements').delete().eq('id',id);if(error)throw error;}
  async function listSlides({admin=false}={}){let qy=c().from('home_slides').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(!admin){const now=new Date().toISOString();qy=qy.eq('is_active',true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`);}const{data,error}=await qy;if(error)throw error;return data||[];}
  async function saveSlide(payload,id=null){return save('home_slides',payload,id);}
  async function deleteSlide(id){const{error}=await c().from('home_slides').delete().eq('id',id);if(error)throw error;}
  window.SYKA_CONTROL_SERVICE={listTasksAdmin,saveTask,checkCompetitionName,listAnnouncements,saveAnnouncement,deleteAnnouncement,privilegedAssignOrganizerPlan,privilegedUpsertPlanCatalog,privilegedDeactivatePlan,createOrganizerPlanOrderV2,platformStats,listUsers,setUserStatus,setUserRole,listOrganizers,listMyOrganizerMemberships,listCompetitionsAdmin,transitionCompetition,saveCompetition,listLevels,saveLevel,getRegistrationRules,saveRegistrationRules,listRewards,saveReward,listQuestionBanks,saveQuestionBank,listQuestions,saveQuestion,listOptions,replaceOptions,listRegistrations,reviewRegistration,listAttempts,listGradingItems,saveGrade,finalizeAttempt,listAwards,listCertificates,saveAdminAward,updateCertificate,listOrders,updateOrder,listTwibbonTemplates,saveTwibbonTemplate,listModeration,moderatePost,moderateComment,moderateQuestion,listPlans,listActiveOrganizerPlan,getPendingOrganizerPlanOrder,chooseOrganizerPlan,assignOrganizerPlan,listPlanCatalog,listEntitlements,saveEntitlement,deleteEntitlement,savePlanBundle,listCommerceProducts,listCommerceBenefits,saveCommerceProduct,deleteCommerceProduct,replaceCommerceBenefits,listFlags,setFlag,listSettings,setSetting,listAudit,listSlides,saveSlide,deleteSlide};
})();


/* src/components/Toast.js */
(function () {
  function ensure() { return document.getElementById('syka-toast-root') || (() => { const el=document.createElement('div'); el.id='syka-toast-root'; document.body.appendChild(el); return el; })(); }
  function show(message, type='info') { const root=ensure(); const el=document.createElement('div'); el.className=`syka-toast syka-toast-${type}`; el.innerHTML=`<span>${window.SYKA_UTILS.escapeHtml(message)}</span><button aria-label="Tutup">×</button>`; el.querySelector('button').onclick=()=>el.remove(); root.appendChild(el); setTimeout(()=>el.remove(),4500); }
  window.SYKA_TOAST = { show };
})();




/* src/components/Modal.js */
(function () {
  let activeRoot = null;
  let previousOverflow = '';

  function open({ title = '', html = '', onOpen, onClose, wide = false, closeOnBackdrop = false, closeOnEscape = false } = {}) {
    close();

    const root = document.createElement('div');
    root.id = 'syka-modal-root';
    root.className = 'syka-modal-backdrop';
    root.dataset.closeOnBackdrop = closeOnBackdrop ? 'true' : 'false';

    root.innerHTML = `
      <div class="syka-modal ${wide ? 'syka-modal-wide' : ''}"
           role="dialog"
           aria-modal="true"
           aria-label="${window.SYKA_UTILS.escapeHtml(title)}">
        <div class="syka-modal-head">
          <div>
            <h2>${window.SYKA_UTILS.escapeHtml(title)}</h2>
          </div>
          <button
            class="syka-icon-btn"
            type="button"
            data-close
            aria-label="Tutup">
            ×
          </button>
        </div>
        <div class="syka-modal-body">${html}</div>
      </div>
    `;

    document.body.appendChild(root);
    activeRoot = root;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // IMPORTANT: modal backdrop clicks never close by default.
    // Forms/editors can safely be clicked outside their dialog without
    // accidentally losing the user's work. Only an explicit [data-close]
    // control closes the modal, unless a caller opts into closeOnBackdrop.
    root.addEventListener('click', (event) => {
      const closeControl = event.target.closest?.('[data-close]');
      if (closeControl) {
        event.preventDefault();
        close();
        return;
      }

      if (
        closeOnBackdrop &&
        event.target === root
      ) {
        close();
      }
    });

    const handleKeydown = (event) => {
      // Default is deliberately locked: Escape does not dismiss a form.
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    if (closeOnEscape) {
      root._sykaModalKeydown = handleKeydown;
      document.addEventListener('keydown', handleKeydown);
    }

    onOpen?.(root.querySelector('.syka-modal-body'), root);

    window._sykaModalClose = () => {
      onClose?.();

      if (root._sykaModalKeydown) {
        document.removeEventListener('keydown', root._sykaModalKeydown);
      }

      if (root.isConnected) {
        root.remove();
      }

      if (activeRoot === root) {
        activeRoot = null;
        document.body.style.overflow = previousOverflow || '';
      }

      window._sykaModalClose = null;
    };
  }

  function close() {
    if (window._sykaModalClose) {
      window._sykaModalClose();
      return;
    }

    const root = document.getElementById('syka-modal-root');
    if (root) root.remove();
    activeRoot = null;
    document.body.style.overflow = previousOverflow || '';
  }

  window.SYKA_MODAL = {
    open,
    close,
    isOpen: () => Boolean(activeRoot && activeRoot.isConnected)
  };
})();


/* src/components/Skeleton.js */
(function(){ function card(){return `<div class="syka-skeleton-card"><div class="skel skel-img"></div><div class="skel skel-line w70"></div><div class="skel skel-line w90"></div><div class="skel skel-line w50"></div></div>`} window.SYKA_SKELETON={card};})();




/* src/components/EmptyState.js */
(function(){ function render({icon='◌',title='Belum ada data',text='Data akan tampil di sini ketika tersedia.',actionHtml='' }={}){return `<div class="syka-empty"><div class="syka-empty-icon">${icon}</div><h3>${window.SYKA_UTILS.escapeHtml(title)}</h3><p>${window.SYKA_UTILS.escapeHtml(text)}</p>${actionHtml}</div>`} window.SYKA_EMPTY={render};})();




/* src/components/CompetitionCard.js */
(function(){
  function render(c){
    const u=window.SYKA_UTILS;
    const status=(c.status||'').replaceAll('_',' ');
    const poster=u.cloudinaryTransform(c.poster||c.poster_url,{width:900,height:506,crop:'fill'});
    const route=window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug));
    return `<article class="syka-card competition-card-v46">
      <a class="competition-media-v46" href="${route}" aria-label="Lihat ${u.escapeHtml(c.title)}">
        ${poster?`<img src="${u.escapeHtml(poster)}" alt="${u.escapeHtml(c.title)}" loading="lazy">`:'<div class="competition-media-placeholder"><span>✦</span><small>Sykabelajar.id</small></div>'}
        <span class="competition-status-overlay ${u.statusClass(c.status)}">${u.escapeHtml(status)}</span>
      </a>
      <div class="competition-card-body-v46">
        <div class="eyebrow-row"><span class="chip chip-purple">${u.escapeHtml(c.category||'Kompetisi')}</span><span class="competition-date-badge">${c.registrationEndsAt||c.registration_ends_at?`Daftar s/d ${u.formatDate(c.registrationEndsAt||c.registration_ends_at)}`:'Jadwal menyusul'}</span></div>
        <h3><a href="${route}">${u.escapeHtml(c.title)}</a></h3>
        <p>${u.escapeHtml(c.description||c.short_description||'Temukan persyaratan, timeline, hadiah, dan mekanisme kompetisi.')}</p>
        <div class="competition-meta-v46"><span><b>Mulai</b>${u.formatDate(c.startsAt||c.starts_at)}</span><span><b>Pengumuman</b>${u.formatDate(c.announcementAt||c.announcement_at)}</span></div>
        <a class="btn btn-primary btn-block" href="${route}">Lihat detail <span>→</span></a>
      </div>
    </article>`;
  }
  window.SYKA_COMPETITION_CARD={render};
})();


/* src/components/Header.js */
(function(){
  function roleLabel(roles){
    if(roles.includes('admin'))return 'Admin';
    if(roles.includes('organizer_member'))return 'Penyelenggara';
    if(roles.includes('teacher'))return 'Guru';
    return 'Pelajar';
  }
  const esc=()=>window.SYKA_UTILS.escapeHtml;
  async function renderNotifications(){
    const auth=window.SYKA_STATE.getState().auth;
    const panel=document.getElementById('header-notification-panel');
    if(!panel||!auth.user)return;
    panel.innerHTML='<div class="notif-loading">Memuat notifikasi…</div>';
    try{
      const rows=await window.SYKA_NOTIFICATION_SERVICE.list(auth.user.id);
      const unread=rows.filter(x=>!x.read_at).length;
      const badge=document.getElementById('notification-count');
      if(badge){badge.textContent=unread>99?'99+':String(unread);badge.classList.toggle('hidden',unread===0);}
      panel.innerHTML=rows.length?`<div class="notif-head"><div><strong>Notifikasi</strong><small>${unread?`${unread} belum dibaca`:'Semua sudah dibaca'}</small></div><button type="button" class="notif-close" id="notif-close">×</button></div><div class="notif-list">${rows.map(n=>`<button type="button" class="notif-item ${n.read_at?'read':''}" data-notif-id="${esc()(n.id)}"><span class="notif-icon">${n.read_at?'•':'●'}</span><span><strong>${esc()(n.title||n.type||'Notifikasi')}</strong><small>${esc()(n.body||'')}</small><time>${esc()(window.SYKA_UTILS.formatDateTime(n.created_at))}</time></span></button>`).join('')}</div>`:'<div class="notif-empty"><strong>Tidak ada notifikasi</strong><span>Kami akan menaruh pemberitahuan penting di sini.</span></div>';
      panel.querySelector('#notif-close')?.addEventListener('click',()=>panel.classList.add('hidden'));
      panel.querySelectorAll('[data-notif-id]').forEach(btn=>btn.addEventListener('click',async()=>{
        try{
          await window.SYKA_NOTIFICATION_SERVICE.markRead(btn.dataset.notifId);
          btn.classList.add('read');
          const count=document.getElementById('notification-count');
          if(count && !count.classList.contains('hidden')){
            const n=Math.max(0,Number(count.textContent||0)-1);
            count.textContent=String(n);count.classList.toggle('hidden',n===0);
          }
        }catch(e){window.SYKA_TOAST.show(e.message||'Notifikasi gagal diperbarui.','error');}
      }));
    }catch(error){
      panel.innerHTML=`<div class="notif-empty"><strong>Notifikasi tidak dapat dimuat</strong><span>${esc()(error.message||'Coba lagi beberapa saat.')}</span><button type="button" class="btn btn-secondary btn-sm" id="notif-retry">Coba lagi</button></div>`;
      panel.querySelector('#notif-retry')?.addEventListener('click',renderNotifications);
    }
  }
  async function render(){
    const auth=window.SYKA_STATE.getState().auth;const u=auth.user,p=auth.profile||{};
    const name=p.full_name||u?.user_metadata?.full_name||u?.email?.split('@')[0]||'Pengguna';
    const avatar=p.avatar_url||'';const canAdmin=auth.roles.includes('admin');const canOrganizer=auth.roles.includes('organizer_member')||canAdmin;const el=document.getElementById('syka-header');if(!el)return;
    let announcement='Kompetisi, prestasi, misi, dan pengalaman belajar dalam satu tempat.';
    try{const anns=await window.SYKA_CONTROL_SERVICE.listAnnouncements({admin:false});if(anns.length) announcement=anns.map(x=>x.message||x.title||'').filter(Boolean).join('   •   ');}catch(_){}
    el.innerHTML=`<div class="header-inner"><div class="header-left"><div class="header-mobile-left"><button class="icon-btn mobile-menu" id="mobile-menu-btn" aria-label="Menu">☰</button></div><a class="mobile-brand" href="${window.SYKA_ROUTER.href('/')}" aria-label="Sykabelajar"><span class="brand-logo-mini">S</span></a></div><div class="header-announcement" aria-label="Pengumuman"><span class="announcement-dot"></span><div class="announcement-marquee"><span>${esc()(announcement)}</span><span aria-hidden="true">${esc()(announcement)}</span></div></div><div class="header-actions"><button class="icon-btn header-notification-btn" id="notification-btn" title="Notifikasi" aria-label="Notifikasi"><span>♢</span><b id="notification-count" class="notification-badge hidden">0</b></button><button class="icon-btn" id="theme-btn" title="Ganti tema" aria-label="Tema">${document.documentElement.dataset.theme==='dark'?'☀':'◐'}</button>${u?`<div class="profile-quick"><button class="profile-trigger" id="profile-quick-btn" aria-label="Profil"><span class="profile-avatar-mini">${avatar?`<img src="${esc()(avatar)}" alt="">`:esc()(window.SYKA_UTILS.initials(name))}</span><span class="profile-text"><strong>${esc()(name)}</strong><small>${roleLabel(auth.roles)}</small></span><span class="profile-chevron">⌄</span></button><div class="profile-menu hidden" id="profile-menu">${canAdmin?`<button data-go="/admin">Panel Admin</button>`:''}${canOrganizer?`<button data-go="/organizer">Panel Penyelenggara</button>`:''}<button data-go="/profile">Profil Saya</button><button data-go="/prestasi">Prestasi</button><button data-go="/pesanan">Pesanan</button><button class="danger" id="logout-btn">Keluar</button></div></div>`:`<button class="btn btn-primary btn-sm" id="header-login">Masuk</button>`}</div><div class="header-notification-panel hidden" id="header-notification-panel"></div></div>`;
    document.getElementById('theme-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme());
    document.getElementById('mobile-menu-btn')?.addEventListener('click',()=>window.SYKA_APP.toggleMobileNav());
    document.getElementById('header-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login'));
    document.getElementById('notification-btn')?.addEventListener('click',async e=>{e.stopPropagation();const panel=document.getElementById('header-notification-panel');panel?.classList.toggle('hidden');if(!panel?.classList.contains('hidden'))await renderNotifications();});
    const trigger=document.getElementById('profile-quick-btn'),menu=document.getElementById('profile-menu');
    if(trigger&&menu){trigger.onclick=e=>{e.stopPropagation();menu.classList.toggle('hidden');document.getElementById('header-notification-panel')?.classList.add('hidden');};menu.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{menu.classList.add('hidden');window.SYKA_ROUTER.navigate(b.dataset.go);});document.getElementById('logout-btn')?.addEventListener('click',()=>window.SYKA_APP.logout());}
  }
  window.SYKA_HEADER={render,renderNotifications};
})();


/* src/components/Sidebar.js */
(function(){
  function render(){
    const auth=window.SYKA_STATE.getState().auth;const path=window.SYKA_UTILS.routePath();const admin=auth.roles.includes('admin');const organizer=auth.roles.includes('organizer_member')||admin;
    const items=[['/','Beranda','⌂'],['/lomba','Lomba','◈'],['/juara','Juara','♛'],['/prestasi','Prestasi','✦'],['/tugas','Misi','✓']];if(auth.user)items.push(['/toko','Toko','◇']);if(organizer)items.push(['/organizer','Penyelenggara','▣']);if(admin)items.push(['/admin','Admin','⚙']);
    const el=document.getElementById('syka-sidebar');if(!el)return;
    el.innerHTML=`<div class="sidebar-inner"><div class="sidebar-brand"><a href="${window.SYKA_ROUTER.href('/')}" class="brand-link"><span class="brand-logo">S</span><span><strong>Sykabelajar.id</strong><small>Platform kompetensi</small></span></a><button class="sidebar-collapse" id="sidebar-collapse" aria-label="Ciutkan sidebar">‹</button></div><nav class="sidebar-nav">${items.map(([href,label,icon])=>`<a href="${window.SYKA_ROUTER.href(href)}" class="side-item ${path===href?'active':''}" data-side-link><span class="side-icon">${icon}</span><span>${label}</span></a>`).join('')}</nav><div class="sidebar-spacer"></div><div class="sidebar-footer"><button class="side-action" id="side-profile"><span>◎</span>${auth.user?'Profil Saya':'Masuk / Daftar'}</button><button class="side-action" id="side-theme"><span>◐</span>Tema</button></div></div>`;
    document.getElementById('sidebar-collapse')?.addEventListener('click',()=>window.SYKA_APP.toggleSidebar());
    document.getElementById('side-theme')?.addEventListener('click',()=>window.SYKA_APP.toggleTheme());
    document.getElementById('side-profile')?.addEventListener('click',()=>auth.user?window.SYKA_ROUTER.navigate('/profile'):window.SYKA_APP.openAuth('login'));
    el.querySelectorAll('[data-side-link]').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('mobile-nav-open')));
    document.getElementById('mobile-nav-overlay')?.addEventListener('click',()=>document.body.classList.remove('mobile-nav-open'),{once:true});
  }
  window.SYKA_SIDEBAR={render};
})();


/* src/components/BottomNav.js */
(function(){function render(){const u=window.SYKA_STATE.getState().auth.user;const path=window.SYKA_UTILS.routePath();const el=document.getElementById('syka-bottom-nav');if(!el)return;const items=[['/','⌂','Home'],['/lomba','◈','Lomba'],['/juara','♛','Juara'],[u?'/profile':'/profile','◎',u?'Saya':'Masuk']];el.innerHTML=items.map(([href,icon,label])=>`<a href="${window.SYKA_ROUTER.href(href)}" class="bottom-item ${path===href?'active':''}"><span>${icon}</span><small>${label}</small></a>`).join('');}window.SYKA_BOTTOMNAV={render};})();


/* src/pages/Home.js */
(function(){
  const U=()=>window.SYKA_UTILS;const esc=x=>U().escapeHtml(x);const fmt=x=>U().formatNumber(x);
  function avatarHtml(p){const url=p?.avatar_url||'';return `<span class="feed-avatar">${url?`<img src="${esc(url)}" alt="">`:esc(U().initials(p?.full_name||'Sykabelajar'))}</span>`;}
  function feedCard(kind,item,index){
    const isComp=kind==='competition';
    const title=isComp?item.title:(item.title||item.badge||'Update Sykabelajar');
    const text=isComp?(item.short_description||item.description||'Kompetisi terbaru di Sykabelajar.'):(item.subtitle||item.description||'Informasi terbaru dari Sykabelajar.');
    const href=isComp?window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(item.slug||'')):window.SYKA_ROUTER.href('/lomba');
    return `<article class="social-post ${isComp?'post-competition':'post-update'}"><div class="social-post-head">${avatarHtml({full_name:isComp?(item.organizer_name||'Penyelenggara'):'Sykabelajar',avatar_url:item.organizer_avatar_url})}<div class="social-post-meta"><strong>${esc(isComp?(item.organizer_name||'Penyelenggara'):'Sykabelajar')}</strong><span>${esc(isComp?'· Lomba terbaru':'· Update platform')}</span><time>${esc(U().formatDate(item.created_at||item.published_at||new Date().toISOString()))}</time></div><button class="feed-more" type="button" aria-label="Lainnya">•••</button></div><a class="social-post-body" href="${href}"><span class="post-kicker">${esc(isComp?'LOMBA':'UPDATE')}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${item.image_url?`<div class="post-media"><img src="${esc(item.image_url)}" loading="lazy" alt=""></div>`:''}</a><div class="social-post-stats"><button type="button" disabled><span>♡</span> ${fmt(item.like_count||0)}</button><button type="button" disabled><span>◌</span> ${fmt(item.comment_count||0)}</button><button type="button" data-share-post="${esc(title)}"><span>↗</span> Bagikan</button></div></article>`;
  }
  async function render(root){
    root.innerHTML=`<div class="home-x-layout"><aside class="home-rail home-rail-left"><section class="x-user-card" id="home-left-profile"><div class="x-cover"></div><div class="x-user-body"><div class="x-avatar-lg" id="home-user-avatar">S</div><strong id="home-user-name">Sykabelajar</strong><small id="home-user-handle">@sykabelajar</small><div class="x-user-stats"><span><b id="home-following">0</b><small>Mengikuti lomba</small></span><span><b id="home-certificates">0</b><small>Sertifikat</small></span></div><a class="btn btn-secondary btn-block btn-sm" href="${window.SYKA_ROUTER.href('/profile')}">Lihat profil</a></div></section></aside><main class="home-feed"><section class="home-feed-header"><div><span class="eyebrow">DISCOVERY</span><h1>Beranda</h1><p>Temukan lomba, pengumuman, dan rekam prestasi dalam satu alur.</p></div><div class="home-feed-filters" role="tablist"><button class="active" data-home-filter="all" type="button">Semua</button><button data-home-filter="competition" type="button">Lomba</button><button data-home-filter="update" type="button">Update</button></div></section>${((window.SYKA_STATE.getState().auth.roles||[]).includes('admin')|| (window.SYKA_STATE.getState().auth.roles||[]).includes('organizer_member'))?`<section class="composer-compact composer-role-allowed"><div class="composer-avatar">S</div><button type="button" id="home-status-create" class="composer-input">Bagikan pembaruan resmi…</button></section>`:''}<div id="home-feed-list" class="home-feed-list"></div></main><aside class="home-rail home-rail-right"><section class="x-panel"><div class="x-panel-head"><h3>Statistik platform</h3></div><div id="home-stats" class="stats-compact"><div><b>—</b><span>Siswa</span></div><div><b>—</b><span>Sekolah</span></div><div><b>—</b><span>Penerima prestasi</span></div><div><b>—</b><span>Juara</span></div></div></section><section class="x-panel"><div class="x-panel-head"><h3>Lomba sedang populer</h3><a href="${window.SYKA_ROUTER.href('/lomba')}">Lihat semua</a></div><div id="home-trending" class="trending-list"></div></section><section class="x-panel x-muted-panel"><span class="eyebrow">SYKABELAJAR</span><h3>Belajar. Berkompetisi. Berprestasi.</h3><p>Gunakan misi untuk mengumpulkan XP/Koin Edu dan bangun rekam prestasi.</p><a class="btn btn-primary btn-sm" href="${window.SYKA_ROUTER.href('/tugas')}">Buka Misi</a></section></aside></div>`;
    document.getElementById('home-status-create')?.addEventListener('click',()=>window.SYKA_TOAST.show('Editor posting resmi akan tersedia dari control plane Admin/Penyelenggara.','info'));
    const list=document.getElementById('home-feed-list');list.innerHTML=[1,2,3].map(()=>'<div class="social-post skeleton-post"></div>').join('');
    const auth=window.SYKA_STATE.getState().auth;if(auth.user){const p=auth.profile||{};document.getElementById('home-user-name').textContent=p.full_name||auth.user.email?.split('@')[0]||'Pengguna';document.getElementById('home-user-handle').textContent='@'+(p.username||'user');if(p.avatar_url)document.getElementById('home-user-avatar').innerHTML=`<img src="${esc(p.avatar_url)}" alt="">`;}
    try{
      const [stats,slides,rows]=await Promise.allSettled([window.SYKA_CONTROL_SERVICE.platformStats(),window.SYKA_CONTROL_SERVICE.listSlides({admin:false}),window.SYKA_COMPETITION_SERVICE.list({limit:9})]);
      if(stats.status==='fulfilled'){const s=stats.value||{};const vals=[s.total_students,s.total_schools,s.total_award_recipients,s.total_champions];document.querySelectorAll('#home-stats b').forEach((el,i)=>el.textContent=fmt(vals[i]||0));}
      const competitions=rows.status==='fulfilled'?(rows.value||[]):[];document.getElementById('home-trending').innerHTML=competitions.slice(0,5).map((c,i)=>`<a class="trend-item" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(c.slug||''))}"><span>${i+1}</span><div><strong>${esc(c.title)}</strong><small>${esc(c.status||'')}</small></div></a>`).join('')||'<div class="empty-mini">Belum ada lomba.</div>';
      const updates=slides.status==='fulfilled'?(slides.value||[]):[];let active='all';const paint=()=>{const filtered=[...(active==='competition'||active==='all'?competitions:[]).map(c=>({kind:'competition',item:c})),...(active==='update'||active==='all'?updates:[]).map(s=>({kind:'update',item:s}))];list.innerHTML=filtered.length?filtered.slice(0,12).map((x,i)=>feedCard(x.kind,x.item,i)).join(''):'<div class="empty-card"><strong>Belum ada discovery</strong><span>Konten akan tampil ketika ada lomba atau update resmi.</span></div>';list.querySelectorAll('[data-share-post]').forEach(b=>b.addEventListener('click',async()=>{const text=b.dataset.sharePost;if(navigator.share){try{await navigator.share({title:text,url:location.href});}catch(_){}}else{await navigator.clipboard?.writeText(location.href);window.SYKA_TOAST.show('Link disalin.','success');}}));};paint();document.querySelectorAll('[data-home-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-home-filter]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');active=btn.dataset.homeFilter;paint();}));
    }catch(error){list.innerHTML=`<div class="empty-card"><strong>Discovery belum tersedia</strong><span>${esc(error.message||'Coba lagi nanti.')}</span><button type="button" class="btn btn-secondary btn-sm" id="retry-home">Coba lagi</button></div>`;document.getElementById('retry-home')?.addEventListener('click',()=>window.SYKA_ROUTER.refresh());}
  }
  window.SYKA_PAGE_HOME={render};
})();


/* src/pages/Tasks.js */
(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v); const fmt=v=>window.SYKA_UTILS.formatDateTime(v);
  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Masuk untuk melihat misi harian dan reward.',actionHtml:'<button class="btn btn-primary" id="task-login">Masuk</button>'});root.querySelector('#task-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/tugas'}));return;}
    let tasks=[]; try{tasks=await window.SYKA_TASK_SERVICE.listTasks();}catch(e){root.innerHTML=window.SYKA_EMPTY.render({title:'Tugas belum tersedia',text:e.message||'Modul task belum tersambung.'});return;}
    root.innerHTML=`<section class="page-title"><span class="eyebrow">DAILY TASK</span><h1>Misi & reward</h1><p>Selesaikan aktivitas ringan untuk mendapatkan Koin Edu dan EXP. Progress dan reward diselesaikan oleh server.</p></section><div class="task-grid-v410">${tasks.map(t=>`<article class="task-card-v410" data-task-card="${t.id}"><div class="task-icon-v410">✦</div><div class="task-body-v410"><div class="task-meta-v410"><span>${esc(t.task_type||'TASK')}</span><span>+${Number(t.points||0)} Koin</span><span>+${Number(t.exp||0)} EXP</span></div><h2>${esc(t.title)}</h2><p>${esc(t.description||'Selesaikan misi ini untuk mendapat reward.')}</p><div class="task-actions-v410"><button class="btn btn-primary btn-sm" data-task-claim="${t.id}">Mulai misi</button><button class="btn btn-secondary btn-sm hidden" data-task-complete="${t.id}">Tandai selesai</button></div></div></article>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada misi',text:'Misi akan muncul saat Admin mengaktifkannya.'})}</div>`;
    root.querySelectorAll('[data-task-claim]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{await window.SYKA_TASK_SERVICE.claim(btn.dataset.taskClaim);btn.classList.add('hidden');const complete=btn.closest('[data-task-card]')?.querySelector('[data-task-complete]');complete?.classList.remove('hidden');window.SYKA_TOAST.show('Misi dimulai. Selesaikan aktivitasnya lalu tandai selesai.','success');}catch(e){btn.disabled=false;window.SYKA_TOAST.show(e.message||'Misi gagal dibuka.','error');}});
    root.querySelectorAll('[data-task-complete]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{const r=await window.SYKA_TASK_SERVICE.complete(btn.dataset.taskComplete);btn.textContent='Selesai';window.SYKA_TOAST.show(r?.already?'Misi ini sudah selesai.':`Reward diterima: +${Number(r?.points||0)} Koin Edu · +${Number(r?.exp||0)} EXP.`,'success');}catch(e){btn.disabled=false;window.SYKA_TOAST.show(e.message||'Misi belum dapat diselesaikan.','error');}});
  }
  window.SYKA_PAGE_TASKS={render};
})();

/* src/pages/Notifications.js */
(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Masuk untuk melihat notifikasi.',actionHtml:'<button class="btn btn-primary" id="notif-login">Masuk</button>'});root.querySelector('#notif-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/notifikasi'}));return;}
    root.innerHTML='<section class="page-title"><span class="eyebrow">NOTIFIKASI</span><h1>Pemberitahuan</h1><p>Approval, lomba, hasil, pesanan, misi, dan aktivitas penting akunmu.</p></section><div id="notifications-page" class="notification-page-card"></div>';
    const el=document.getElementById('notifications-page');
    try{const rows=await window.SYKA_NOTIFICATION_SERVICE.list(auth.user.id);el.innerHTML=rows.length?rows.map(n=>`<button class="page-notif-row ${n.read_at?'read':''}" data-id="${esc(n.id)}"><span class="page-notif-dot">${n.read_at?'':'●'}</span><span><strong>${esc(n.title||n.type||'Notifikasi')}</strong><small>${esc(n.body||'')}</small><time>${esc(window.SYKA_UTILS.formatDateTime(n.created_at))}</time></span></button>`).join(''):'<div class="empty-card"><strong>Tidak ada notifikasi</strong><span>Semua pemberitahuan penting akan muncul di sini.</span></div>';
      el.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',async()=>{try{await window.SYKA_NOTIFICATION_SERVICE.markRead(btn.dataset.id);btn.classList.add('read');btn.querySelector('.page-notif-dot').textContent='';}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menandai notifikasi.','error');}}));
    }catch(e){el.innerHTML=`<div class="empty-card"><strong>Notifikasi gagal dimuat</strong><span>${esc(e.message||'Coba lagi.')}</span><button type="button" class="btn btn-secondary btn-sm" id="notif-retry-page">Coba lagi</button></div>`;el.querySelector('#notif-retry-page')?.addEventListener('click',()=>render(root));}
  }
  window.SYKA_PAGE_NOTIFICATIONS={render};
})();


/* src/pages/Lomba.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml,fmt=window.SYKA_UTILS.formatDate;
  async function render(root){root.innerHTML=`<section class="page-title"><span class="eyebrow">DISCOVERY</span><h1>Semua Lomba</h1><p>Temukan kompetisi berdasarkan status, kategori, dan waktu pendaftaran.</p></section><div class="catalog-toolbar"><div class="search-wrap"><span>⌕</span><input id="catalog-search" placeholder="Cari lomba atau kategori…"></div><div class="filter-pills"><button class="filter-pill active" data-status="ALL">Semua</button><button class="filter-pill" data-status="REGISTRATION_OPEN">Pendaftaran dibuka</button><button class="filter-pill" data-status="LIVE">Sedang berjalan</button><button class="filter-pill" data-status="PUBLISHED">Akan datang</button></div></div><div id="lomba-grid" class="card-grid"></div>`;const grid=document.getElementById('lomba-grid');grid.innerHTML=[0,1,2,3].map(()=>window.SYKA_SKELETON.card()).join('');try{const rows=await window.SYKA_COMPETITION_SERVICE.list({limit:60});let status='ALL';const paint=()=>{const q=document.getElementById('catalog-search').value.toLowerCase();const filtered=rows.filter(r=>(status==='ALL'||r.status===status)&&(!q||`${r.title} ${r.category}`.toLowerCase().includes(q)));grid.innerHTML=filtered.length?filtered.map(window.SYKA_COMPETITION_CARD.render).join(''):window.SYKA_EMPTY.render({title:'Tidak ada hasil',text:'Coba kata kunci atau filter lain.'});};document.getElementById('catalog-search').oninput=paint;root.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-status]').forEach(x=>x.classList.remove('active'));b.classList.add('active');status=b.dataset.status;paint();});paint();}catch(error){grid.innerHTML=window.SYKA_EMPTY.render({title:'Katalog belum tersedia',text:error.message||'Data kompetisi belum dapat dimuat.'});}}
  window.SYKA_PAGE_LOMBA={render};
})();


/* src/pages/Competition.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const fmt=window.SYKA_UTILS.formatDateTime;

  function registrationState(status){
    const map={
      PUBLISHED:{label:'Pendaftaran belum dibuka',detail:'Kompetisi sudah dipublikasikan. Pendaftaran akan dibuka sesuai jadwal.'},
      REGISTRATION_OPEN:{label:'Pendaftaran dibuka',detail:'Periksa syarat, buat twibbon bila diwajibkan, lalu kirim pendaftaran.'},
      REGISTRATION_CLOSED:{label:'Pendaftaran ditutup',detail:'Batas pendaftaran sudah berakhir.'},
      LIVE:{label:'Kompetisi sedang berjalan',detail:'Peserta aktif dapat mengikuti tahap kompetisi.'},
      SUBMISSION_CLOSED:{label:'Pengumpulan ditutup',detail:'Kompetisi masuk tahap penilaian.'},
      GRADING:{label:'Sedang dinilai',detail:'Penyelenggara sedang memproses hasil peserta.'},
      RESULT_PUBLISHED:{label:'Hasil telah diumumkan',detail:'Lihat hasil dan rekam prestasi dari akun kamu.'},
      ARCHIVED:{label:'Kompetisi selesai',detail:'Kompetisi ini sudah diarsipkan.'},
      SUSPENDED:{label:'Kompetisi ditangguhkan',detail:'Aksi pendaftaran sementara tidak tersedia.'},
      CANCELLED:{label:'Kompetisi dibatalkan',detail:'Pendaftaran tidak tersedia.'}
    };
    return map[status]||{label:'Pendaftaran belum tersedia',detail:'Ikuti informasi resmi penyelenggara.'};
  }

  function shareOptions(){
    return `<div class="share-sheet-v47">
      <button class="share-option" data-share="native"><span>↗</span><div><strong>Bagikan</strong><small>Gunakan menu share perangkat</small></div></button>
      <button class="share-option" data-share="whatsapp"><span>◉</span><div><strong>WhatsApp</strong><small>Kirim ke teman</small></div></button>
      <button class="share-option" data-share="copy"><span>⧉</span><div><strong>Salin link</strong><small>Tempel di mana saja</small></div></button>
    </div>`;
  }

  function openJuknis(url,title){
    if(!url){window.SYKA_TOAST.show('Juknis belum diunggah penyelenggara.','info');return;}
    window.SYKA_MODAL.open({
      title:'Juknis • '+title,
      wide:true,
      html:`<div class="pdf-viewer-v47"><iframe src="${esc(url)}" title="Juknis ${esc(title)}" loading="lazy"></iframe></div><div class="modal-pdf-actions"><a class="btn btn-secondary" href="${esc(url)}" target="_blank" rel="noopener">Buka penuh</a><a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener" download>Download PDF</a></div>`
    });
  }

  function openKisiKisi(c){
    window.SYKA_MODAL.open({
      title:'Kisi-kisi • '+c.title,
      wide:true,
      html:`<article class="kisi-kisi-v47"><div class="kisi-kisi-head"><span class="eyebrow">PERSIAPAN KOMPETISI</span><h2>${esc(c.title)}</h2><p>Materi persiapan yang sudah dipublikasikan penyelenggara.</p></div><div class="kisi-kisi-body">${c.kisiKisiContent?esc(c.kisiKisiContent).replace(/\n/g,'<br>'):'Kisi-kisi belum diisi.'}</div></article>`
    });
  }

  function validSocialUrl(value){
    try{
      const u=new URL(value);
      return u.protocol==='https:' && /(^|\\.)instagram\\.com$|(^|\\.)tiktok\\.com$/i.test(u.hostname);
    }catch(_){return false;}
  }

  async function openRegistrationFlow(c,template,rules,reg){
    if(reg){
      window.SYKA_MODAL.open({title:'Status pendaftaran',html:`<div class="registration-status-modal-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(reg.status)}">${esc(reg.status)}</span><h2>${reg.status==='ACTIVE'?'Pendaftaran disetujui':reg.status==='REJECTED'?'Pendaftaran ditolak':'Menunggu persetujuan'}</h2><p>${reg.status==='ACTIVE'?'Kamu sudah terdaftar sebagai peserta aktif.':reg.status==='REJECTED'?'Pendaftaran ditolak oleh penyelenggara.':'Pendaftaran sedang menunggu pemeriksaan penyelenggara.'}</p>${reg.rejection_reason?`<div class="inline-error">${esc(reg.rejection_reason)}</div>`:''}</div>`});
      return;
    }

    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){window.SYKA_APP.openAuth('login',{target:window.location.pathname+window.location.search});return;}

    const profile=auth.profile||{};
    const eligibility=await window.SYKA_REGISTRATION_SERVICE.checkEligibility({competitionId:c.id,grade:profile.grade});
    if(!eligibility?.eligible){
      const messages={LOGIN_REQUIRED:'Masuk diperlukan',COMPETITION_NOT_FOUND:'Kompetisi tidak ditemukan',REGISTRATION_NOT_OPEN:'Pendaftaran belum dibuka',REGISTRATION_CLOSED:'Pendaftaran sudah ditutup',ELIGIBILITY_FAILED:'Kamu belum memenuhi ketentuan jenjang/kelas',ALREADY_REGISTERED:'Kamu sudah memiliki pendaftaran untuk kompetisi ini',PARTICIPANT_LIMIT_REACHED:'Kuota peserta sudah penuh'};
      window.SYKA_MODAL.open({title:'Belum bisa mendaftar',html:`<div class="registration-guard-v47"><div class="guard-icon">!</div><h2>${esc(messages[eligibility.reason]||'Pendaftaran belum tersedia')}</h2><p>Aturan final berasal dari server. Periksa profil dan jadwal kompetisi sebelum mencoba lagi.</p></div>`});
      return;
    }

    const templateImg=template?.image_url||'';
    const needsTwibbon=true;
    const needsSocial=true;
    if(!templateImg){window.SYKA_MODAL.open({title:'Twibbon belum siap',html:`<div class="registration-guard-v47"><div class="guard-icon">!</div><h2>Template twibbon belum tersedia</h2><p>Penyelenggara mewajibkan twibbon tetapi belum menyiapkan template aktif.</p></div>`});return;}

    let stage=1;
    let twibbonReady=false;let twibbonDataUrl=null;let socialUrl='';let socialPlatform='';let socialUsername='';
    const referralCode=window.SYKA_STATE.getState().route.query?.ref||'';

    function progress(){
      const labels=['Twibbon','Social proof','Kirim'];
      const active=stage;
      return `<div class="flow-progress-v47">${labels.map((label,i)=>`<div class="flow-step ${i+1<active?'done':i+1===active?'active':''}"><span>${i+1<active?'✓':String(i+1).padStart(2,'0')}</span><b>${label}</b></div>${i<2?'<i></i>':''}`).join('')}</div>`;
    }
    function openStep(){window.SYKA_MODAL.open({title:`Daftar • ${stage===1?'Buat Twibbon':stage===2?'Social proof':'Selesai'}`,wide:true,html:stepHtml(),onOpen:bindStep});}
    function stepHtml(){
      if(stage===1){return `<div class="registration-flow-v48">${progress()}<section class="registration-step-card"><span class="eyebrow">LANGKAH 01</span><h2>Buat twibbon resmi</h2><p>Template sudah disiapkan penyelenggara. Foto kamu diproses lokal di perangkat dan hasil akhirnya tidak diunggah ke server.</p><div class="twibbon-local-box-v48"><div class="twibbon-template-strip"><img src="${esc(templateImg)}" alt="Template twibbon"><div><span class="eyebrow">TEMPLATE RESMI</span><strong>${esc(template?.name||'Twibbon resmi')}</strong><small>Asset organizer di Cloudinary</small></div></div><div class="twibbon-canvas-wrap-v47"><canvas id="twibbon-canvas" width="1080" height="1080"></canvas><span class="local-badge-v47">Lokal • tidak disimpan server</span></div><label class="btn btn-secondary twibbon-photo-picker"><input id="twibbon-photo" type="file" accept="image/png,image/jpeg,image/webp" hidden>Pilih foto</label><small>PNG, JPG, WEBP · maksimal 5 MB</small></div><div class="twibbon-actions-v47"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-secondary" id="tw-download" disabled>Download</button><button class="btn btn-primary" id="tw-next" disabled>Berikutnya</button></div><div id="tw-feedback"></div></section></div>`;}
      if(stage===2){return `<div class="registration-flow-v48">${progress()}<section class="registration-step-card"><span class="eyebrow">LANGKAH 02</span><h2>Bagikan twibbon</h2><p>Pilih platform tempat kamu mengunggah postingan. Link dan username akan divalidasi sebelum dapat dilanjutkan.</p><div class="social-platform-picker"><button type="button" class="social-platform ${socialPlatform==='instagram'?'active':''}" data-platform="instagram">Instagram</button><button type="button" class="social-platform ${socialPlatform==='tiktok'?'active':''}" data-platform="tiktok">TikTok</button></div><div class="form-grid-2"><label>Username *<input id="social-username" placeholder="@username" value="${esc(socialUsername)}"></label><label>Link postingan *<input id="social-url" type="url" placeholder="https://www.instagram.com/..." value="${esc(socialUrl)}"></label></div><div id="social-format-help" class="form-hint">Pilih platform terlebih dahulu.</div><div class="twibbon-actions-v47"><button class="btn btn-ghost" id="sp-back">Kembali</button><button class="btn btn-primary" id="sp-next">Berikutnya</button></div><div id="sp-feedback"></div></section></div>`;}
      return `<div class="registration-flow-v48">${progress()}<section class="registration-step-card registration-confirm-v48"><div class="confirm-icon">✓</div><span class="eyebrow">LANGKAH 03</span><h2>Selamat, kamu siap mendaftar</h2><p>Semua data akan dikirim ke server. ${rules?.approval_mode==='AUTO'?'Paket organizer mengizinkan persetujuan otomatis.':'Pendaftaran akan menunggu review penyelenggara.'}</p><div class="confirm-summary-v47"><div><span>Kompetisi</span><strong>${esc(c.title)}</strong></div><div><span>Twibbon</span><strong>✓ Selesai di perangkat</strong></div><div><span>Social proof</span><strong>${esc(socialPlatform)} · ${esc(socialUsername)}</strong></div><div><span>Status berikutnya</span><strong>${rules?.approval_mode==='AUTO'?'ACTIVE / otomatis':'PENDING / menunggu persetujuan'}</strong></div></div><div class="referral-panel-v48"><span class="eyebrow">AJAK TEMAN</span><h3>Dapatkan +5 Koin Edu</h3><p>Ajak teman mendaftar melalui link referral kamu. Reward dikreditkan server-side saat referral valid.</p><div class="referral-link-row"><input id="referral-link" readonly value="Mendapatkan link referral…"><button class="btn btn-secondary" id="copy-referral">Salin</button><button class="btn btn-secondary" id="share-referral">Share</button></div></div><div class="twibbon-actions-v47"><button class="btn btn-ghost" id="confirm-back">Kembali</button><button class="btn btn-primary" id="submit-registration">Kirim pendaftaran</button></div><div id="confirm-feedback"></div></section></div>`;
    }

    function drawCanvas(canvas,photoImg,overlayImg){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);if(photoImg){const scale=Math.max(canvas.width/photoImg.width,canvas.height/photoImg.height);const w=photoImg.width*scale,h=photoImg.height*scale;ctx.drawImage(photoImg,(canvas.width-w)/2,(canvas.height-h)/2,w,h);}if(overlayImg&&overlayImg.complete)ctx.drawImage(overlayImg,0,0,canvas.width,canvas.height);twibbonDataUrl=canvas.toDataURL('image/jpeg',0.92);twibbonReady=true;}
    function bindStep(b){
      b.querySelector('[data-close]')?.addEventListener('click',()=>window.SYKA_MODAL.close());
      if(stage===1){
        const canvas=b.querySelector('#twibbon-canvas'),file=b.querySelector('#twibbon-photo'),download=b.querySelector('#tw-download'),next=b.querySelector('#tw-next'),feedback=b.querySelector('#tw-feedback');let photoImg=null,overlayImg=null;
        overlayImg=new Image();overlayImg.crossOrigin='anonymous';overlayImg.onload=()=>{if(photoImg)drawCanvas(canvas,photoImg,overlayImg);};overlayImg.onerror=()=>{feedback.innerHTML='<div class="inline-error">Template tidak dapat diproses. Minta penyelenggara memperbaiki asset Cloudinary.</div>';};overlayImg.src=templateImg;
        file.onchange=()=>{const f=file.files?.[0];if(!f)return;if(f.size>5000000){feedback.innerHTML='<div class="inline-error">Ukuran foto maksimal 5 MB.</div>';return;}if(!['image/png','image/jpeg','image/webp'].includes(f.type)){feedback.innerHTML='<div class="inline-error">Gunakan PNG, JPG, atau WEBP.</div>';return;}const url=URL.createObjectURL(f);const img=new Image();img.onload=()=>{photoImg=img;drawCanvas(canvas,photoImg,overlayImg);download.disabled=false;next.disabled=false;feedback.innerHTML='<div class="success-inline">Twibbon siap. Download hasilnya atau lanjut ke langkah berikutnya.</div>';URL.revokeObjectURL(url);};img.onerror=()=>{feedback.innerHTML='<div class="inline-error">Foto tidak dapat dibaca.</div>';URL.revokeObjectURL(url);};img.src=url;};
        download.onclick=()=>{if(!twibbonReady)return;const a=document.createElement('a');a.href=twibbonDataUrl;a.download=(c.slug||'sykabelajar')+'-twibbon.jpg';a.click();};
        next.onclick=()=>{stage=2;openStep();};
      } else if(stage===2){
        const platformHelp=b.querySelector('#social-format-help');const updateHelp=()=>{platformHelp.textContent=socialPlatform==='instagram'?'Instagram: https://www.instagram.com/... dan username @...':'TikTok: https://www.tiktok.com/@username/video/... dan username @...';};b.querySelectorAll('[data-platform]').forEach(btn=>btn.onclick=()=>{socialPlatform=btn.dataset.platform;b.querySelectorAll('[data-platform]').forEach(x=>x.classList.toggle('active',x===btn));updateHelp();});if(socialPlatform)updateHelp();b.querySelector('#sp-back').onclick=()=>{stage=1;openStep();};b.querySelector('#sp-next').onclick=()=>{socialUsername=b.querySelector('#social-username').value.trim().replace(/^@/,'');socialUrl=b.querySelector('#social-url').value.trim();const fb=b.querySelector('#sp-feedback');const goodPlatform=(socialPlatform==='instagram'&&/^https:\/\/(www\.)?instagram\.com\/(?:p|reel|tv)\/[^\s/]+/i.test(socialUrl))||(socialPlatform==='tiktok'&&/^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9._-]+\/video\/\d+/i.test(socialUrl));if(!socialPlatform){fb.innerHTML='<div class="inline-error">Pilih Instagram atau TikTok.</div>';return;}if(!socialUsername){fb.innerHTML='<div class="inline-error">Username wajib diisi.</div>';return;}if(!goodPlatform){fb.innerHTML='<div class="inline-error">Link tidak sesuai dengan platform yang dipilih.</div>';return;}stage=3;openStep();};
      } else {
        b.querySelector('#confirm-back').onclick=()=>{stage=2;openStep();};
        window.SYKA_REGISTRATION_SERVICE.getReferralCode().then(code=>{const link=window.location.origin+window.location.pathname+'?route=/lomba/'+encodeURIComponent(c.slug)+'&ref='+encodeURIComponent(code);const input=b.querySelector('#referral-link');if(input)input.value=link;}).catch(()=>{});
        b.querySelector('#copy-referral').onclick=async()=>{try{const code=await window.SYKA_REGISTRATION_SERVICE.getReferralCode();const link=window.location.origin+window.location.pathname+'?route=/lomba/'+encodeURIComponent(c.slug)+'&ref='+encodeURIComponent(code);b.querySelector('#referral-link').value=link;await navigator.clipboard.writeText(link);window.SYKA_TOAST.show('Link referral disalin.','success');}catch(e){b.querySelector('#confirm-feedback').innerHTML=`<div class="inline-error">${esc(e.message)}</div>`;}};
        b.querySelector('#share-referral').onclick=async()=>{try{const code=await window.SYKA_REGISTRATION_SERVICE.getReferralCode();const link=window.location.origin+window.location.pathname+'?route=/lomba/'+encodeURIComponent(c.slug)+'&ref='+encodeURIComponent(code);if(navigator.share)await navigator.share({title:c.title,text:'Ikut kompetisi ini di Sykabelajar',url:link});else await navigator.clipboard.writeText(link);}catch(_){}};
        b.querySelector('#submit-registration').onclick=async()=>{const btn=b.querySelector('#submit-registration'),feedback=b.querySelector('#confirm-feedback');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Mengirim…';try{const result=await window.SYKA_REGISTRATION_SERVICE.register({competitionId:c.id,socialProofUrl:needsSocial?socialUrl:null,twibbonCompleted:needsTwibbon?twibbonReady:false,socialPlatform:needsSocial?socialPlatform:null,socialUsername:needsSocial?socialUsername:null,referralCode});window.SYKA_MODAL.close();window.SYKA_MODAL.open({title:'Pendaftaran berhasil',html:`<div class="registration-success-v48"><div class="confirm-icon">✓</div><span class="eyebrow">SELESAI</span><h2>Selamat, kamu sudah mendaftar</h2><p>${result?.status==='ACTIVE'?'Pendaftaran langsung aktif sesuai paket organizer.':'Pendaftaran masuk antrean review penyelenggara.'}</p><div class="success-status-card"><span class="status-pill ${window.SYKA_UTILS.statusClass(result?.status||'PENDING')}">${esc(result?.status||'PENDING')}</span><strong>${result?.status==='ACTIVE'?'Kamu bisa menunggu jadwal kompetisi.':'Tunggu persetujuan penyelenggara.'}</strong></div></div>`});window.SYKA_TOAST.show(result?.status==='ACTIVE'?'Pendaftaran aktif.':'Pendaftaran menunggu persetujuan.','success');window.SYKA_ROUTER.refresh();}catch(error){btn.disabled=false;btn.textContent='Kirim pendaftaran';feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Pendaftaran gagal.')}</div>`;}};
      }
    }
    openStep();
  }

  async function render(root,slug){
    root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div><span>Memuat detail kompetisi…</span></div>';
    const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug);
    if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Slug kompetisi tidak tersedia atau sudah diarsipkan.',actionHtml:`<a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba')}">Kembali ke katalog</a>`});return;}
    const [levels,rules,rewards,template]=await Promise.all([
      window.SYKA_COMPETITION_SERVICE.getLevels(c.id).catch(()=>[]),
      window.SYKA_COMPETITION_SERVICE.getRules(c.id).catch(()=>null),
      window.SYKA_COMPETITION_SERVICE.getRewards(c.id).catch(()=>[]),
      window.SYKA_COMPETITION_SERVICE.getTwibbonTemplate(c.id).catch(()=>null)
    ]);
    const auth=window.SYKA_STATE.getState().auth;
    const reg=auth.user?await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id).catch(()=>null):null;
    const poster=window.SYKA_UTILS.cloudinaryTransform(c.poster||c.poster_url,{width:1400,height:900,crop:'fill'});
    const state=registrationState(c.status);
    const canRegister=c.status==='REGISTRATION_OPEN';
    const active=reg?.status==='ACTIVE';
    const showKisi=active&&!!c.kisiKisiPublished;
    let primary='Daftar';
    if(reg?.status==='PENDING')primary='Menunggu persetujuan';
    else if(reg?.status==='REJECTED')primary='Daftar ulang';
    else if(active&&showKisi)primary='Kisi-kisi';
    else if(active)primary='Sudah terdaftar';
    else if(!canRegister)primary=state.label;

    root.innerHTML=`<div class="competition-page-v47">
      <div class="competition-breadcrumb"><a href="${window.SYKA_ROUTER.href('/lomba')}">Lomba</a><span>›</span><strong>${esc(c.category||'Kompetisi')}</strong><span>›</span><strong>${esc(c.title)}</strong></div>
      <section class="competition-hero-v47 competition-hero-polished-v47">
        <div class="competition-poster-wrap-v47">${poster?`<img src="${esc(poster)}" alt="${esc(c.title)}" loading="eager">`:'<div class="competition-cover-empty"><span>✦</span><strong>Poster kompetisi</strong><small>Belum ditambahkan penyelenggara.</small></div>'}<div class="poster-badges-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><span class="chip chip-white">${esc(c.category||'Kompetisi')}</span></div></div>
        <div class="competition-hero-copy-v47"><div class="competition-label-row-v47"><span class="eyebrow">SYKABELAJAR COMPETITION</span><span class="competition-id-badge">PUBLIC</span></div><h1>${esc(c.title)}</h1><p>${esc(c.description||'Ikuti kompetisi, selesaikan prosesnya, dan bangun rekam prestasi yang dapat diverifikasi.')}</p><div class="competition-countdown-card-v47"><div><span>Pendaftaran</span><strong>${fmt(c.registrationStartsAt)}</strong><small>sampai ${fmt(c.registrationEndsAt)}</small></div><div><span>Kompetisi</span><strong>${fmt(c.startsAt)}</strong><small>sampai ${fmt(c.endsAt)}</small></div><div><span>Pengumuman</span><strong>${fmt(c.announcementAt)}</strong><small>hasil resmi</small></div></div><div class="competition-cta-bar-v47"><button class="btn ${primary==='Menunggu persetujuan'||primary==='Sudah terdaftar'?'btn-secondary':'btn-primary'} btn-lg" id="primary-action" ${primary==='Menunggu persetujuan'?'disabled':''}>${esc(primary)}${primary!=='Sudah terdaftar'&&primary!=='Menunggu persetujuan'?' <span>→</span>':''}</button><button class="btn btn-secondary btn-lg" id="juknis-action">Juknis</button><button class="btn btn-secondary btn-lg" id="share-action">Share</button></div>${reg?`<div class="registration-inline-status-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(reg.status)}">${esc(reg.status)}</span><div><strong>${reg.status==='ACTIVE'?'Peserta aktif':reg.status==='PENDING'?'Menunggu persetujuan penyelenggara':reg.status==='REJECTED'?'Pendaftaran ditolak':'Status pendaftaran'}</strong><small>${reg.rejection_reason?esc(reg.rejection_reason):'Status berasal dari server.'}</small></div></div>`:`<div class="registration-inline-status-v47"><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><div><strong>${esc(state.label)}</strong><small>${esc(state.detail)}</small></div></div>`}</div>
      </section>
      <section class="detail-grid-v47">
        <article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">ELIGIBILITY</span><h2>Siapa yang bisa ikut?</h2><p>Persyaratan yang diterapkan penyelenggara.</p></div></div><div class="detail-list-v47">${[['Jenjang / kelas',levels.length?levels.map(x=>x.label||x.code).join(' · '):((rules?.allowed_grades||[]).join(' · ')||'Mengikuti aturan kompetisi')],['Twibbon',rules?.require_twibbon?'Wajib':'Opsional'],['Social proof',rules?.require_social_proof?'Wajib':'Opsional'],['Approval',rules?.approval_mode==='AUTO'?'Otomatis sesuai paket':'Manual oleh penyelenggara'],['Kuota',rules?.max_participants?Number(rules.max_participants).toLocaleString('id-ID'):'Tanpa batas khusus']].map(([l,v])=>`<div><span>${l}</span><strong>${esc(v)}</strong></div>`).join('')}</div></article>
        <article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">PANDUAN</span><h2>Dokumen & persiapan</h2><p>Semua bahan penting sebelum mengikuti kompetisi.</p></div></div><div class="guide-actions-v47"><button class="guide-action" id="guide-juknis"><span>PDF</span><div><strong>Juknis</strong><small>${c.juknisUrl?'Panduan resmi siap dibaca':'Belum diunggah'}</small></div><b>→</b></button><button class="guide-action" id="guide-kisi" ${showKisi?'':'disabled'}><span>KI</span><div><strong>Kisi-kisi</strong><small>${showKisi?'Sudah dipublikasikan':'Muncul setelah organizer publish'}</small></div><b>→</b></button><div class="guide-action static"><span>03</span><div><strong>Timeline</strong><small>Ikuti seluruh jadwal kompetisi.</small></div></div></div></article>
      </section>
      <section class="detail-grid-v47 detail-grid-equal-v47"><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">REWARD</span><h2>Hadiah & penghargaan</h2><p>Reward yang dikonfigurasi penyelenggara.</p></div></div><div class="reward-list-v47">${rewards.length?rewards.map((r,i)=>`<div class="reward-card-v47"><span class="reward-rank-v47">${esc(r.rank_code||String(i+1))}</span><div><strong>${esc(r.title||'Reward')}</strong><small>${Number(r.points||0).toLocaleString('id-ID')} points${r.emblem_name?' · '+esc(r.emblem_name):''}</small></div><b>✦</b></div>`).join(''):'<div class="reward-empty-v47"><span>✦</span><strong>Reward belum dipublikasikan</strong><small>Penyelenggara belum mengisi reward kompetisi.</small></div>'}</div></article><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">TWIBBON</span><h2>Template peserta</h2><p>Template tetap disimpan sebagai asset organizer.</p></div></div><div class="twibbon-info-v47">${template?`<img src="${esc(window.SYKA_UTILS.cloudinaryTransform(template.image_url,{width:240,height:240,crop:'fit'}))}" alt="Twibbon template"><div><strong>${esc(template.name)}</strong><small>Hasil twibbon dibuat lokal, diunduh, dan tidak disimpan ke server.</small></div>`:'<div class="empty-inline">Template belum tersedia.</div>'}</div></article></section>
      <section class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">CHECKLIST</span><h2>Yang perlu disiapkan</h2><p>Ikuti urutan ini supaya proses pendaftaran lancar.</p></div></div><div class="prep-grid-v47"><div><span>01</span><strong>Lengkapi profil</strong><small>Nama, kelas, sekolah, dan data pendukung harus sesuai.</small></div><div><span>02</span><strong>Buat twibbon</strong><small>Gunakan template resmi dan simpan hasilnya di perangkat.</small></div><div><span>03</span><strong>Share & bukti URL</strong><small>Posting di Instagram/TikTok lalu tempel link publik.</small></div><div><span>04</span><strong>Siap ikut</strong><small>Soal peserta hanya tersedia ketika kompetisi LIVE.</small></div></div></section>
      <section class="detail-grid-v47"><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">SUPPORT</span><h2>Butuh bantuan?</h2><p>Pastikan profil dan dokumenmu siap sebelum mendaftar.</p></div></div><a class="support-callout-v47" href="${window.SYKA_ROUTER.href('/profile')}"><strong>Periksa profil saya</strong><span>Buka profil →</span></a></article><article class="panel-card detail-panel-v47"><div class="panel-head"><div><span class="eyebrow">ASSESSMENT</span><h2>Soal kompetisi</h2><p>${c.status==='LIVE'?'Soal hanya dibuka untuk peserta aktif saat tahap LIVE.':'Soal belum dibuka. Tunggu tahap LIVE setelah pendaftaran ditutup.'}</p></div></div><div class="assessment-state-v47"><span>${c.status==='LIVE'?'LIVE':'LOCKED'}</span><strong>${c.status==='LIVE'?'Peserta aktif dapat masuk ke tahap ujian.':'Belum tersedia untuk peserta.'}</strong>${c.status==='LIVE'&&reg?.status==='ACTIVE'?`<button class="btn btn-primary" id="start-attempt">Mulai kompetisi</button>`:''}</div></article></section>
    </div>`;

    document.getElementById('primary-action')?.addEventListener('click',()=>{
      if(primary==='Kisi-kisi'){openKisiKisi(c);return;}
      if(reg?.status==='PENDING'||reg?.status==='REJECTED'){openRegistrationFlow(c,template,rules,reg?.status==='PENDING'?reg:null);return;}
      if(reg?.status==='ACTIVE'){window.SYKA_MODAL.open({title:'Pendaftaran aktif',html:`<div class="registration-status-modal-v47"><span class="status-pill status-success">ACTIVE</span><h2>Kamu sudah terdaftar</h2><p>${c.status==='LIVE'?'Kompetisi sedang LIVE. Soal peserta hanya dibuka untuk peserta aktif.':'Ikuti timeline dan tunggu tahap LIVE.'}</p></div>`});return;}
      if(canRegister){openRegistrationFlow(c,template,rules,null);return;}
      window.SYKA_TOAST.show(state.detail,'info');
    });

    document.getElementById('juknis-action')?.addEventListener('click',()=>openJuknis(c.juknisUrl,c.title));
    document.getElementById('guide-juknis')?.addEventListener('click',()=>openJuknis(c.juknisUrl,c.title));
    document.getElementById('guide-kisi')?.addEventListener('click',()=>showKisi&&openKisiKisi(c));
    document.getElementById('start-attempt')?.addEventListener('click',async()=>{const b=document.getElementById('start-attempt');b.disabled=true;b.textContent='Menyiapkan…';try{const a=await window.SYKA_ATTEMPT_SERVICE.start(c.id);window.SYKA_ROUTER.navigate('/ujian/'+encodeURIComponent(a.id));}catch(e){b.disabled=false;b.textContent='Mulai kompetisi';window.SYKA_TOAST.show(e.message||'Ujian belum dapat dimulai.','error');}});
    document.getElementById('share-action')?.addEventListener('click',()=>window.SYKA_MODAL.open({title:'Bagikan kompetisi',html:shareOptions(),onOpen:b=>{
      b.querySelector('[data-share="native"]')?.addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:c.title,url:location.href});else await navigator.clipboard.writeText(location.href);window.SYKA_MODAL.close();}catch(_){}});
      b.querySelector('[data-share="whatsapp"]')?.addEventListener('click',()=>window.open(`https://wa.me/?text=${encodeURIComponent(c.title+' '+location.href)}`,'_blank','noopener'));
      b.querySelector('[data-share="copy"]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);window.SYKA_TOAST.show('Link kompetisi disalin.','success');window.SYKA_MODAL.close();}catch(_){}});
    }}));
  }

  window.SYKA_PAGE_COMPETITION={render};
})();


/* src/pages/Registration.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml;const grades=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
  async function render(root,slug){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Login diperlukan',text:'Kamu perlu login sebelum mendaftar kompetisi.',actionHtml:'<button class="btn btn-primary" id="rlogin">Masuk</button>'});document.getElementById('rlogin').onclick=()=>window.SYKA_APP.openAuth('login',{target:`/lomba/${encodeURIComponent(slug)}/daftar`});return;}const c=await window.SYKA_COMPETITION_SERVICE.getBySlug(slug);if(!c){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Periksa kembali link kompetisi.'});return;}const p=window.SYKA_STATE.getState().auth.profile||{};const existing=await window.SYKA_REGISTRATION_SERVICE.getStatus(auth.user.id,c.id).catch(()=>null);if(existing){root.innerHTML=`<section class="page-title"><span class="eyebrow">REGISTRATION</span><h1>${esc(c.title)}</h1><p>Kamu sudah memiliki registration record untuk kompetisi ini.</p></section><div class="registration-result syka-card"><span class="status-pill ${window.SYKA_UTILS.statusClass(existing.status)}">${esc(existing.status)}</span><h2>Pendaftaran sudah tercatat</h2><p>Status final berasal dari backend. Kamu tidak perlu mengirim formulir berulang.</p><a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug))}">Kembali ke detail</a></div>`;return;}
    root.innerHTML=`<section class="page-title"><span class="eyebrow">REGISTRATION</span><h1>Daftar ${esc(c.title)}</h1><p>Lengkapi data peserta. Data profil akan disimpan di akun dan digunakan untuk proses kompetisi.</p></section><div class="registration-layout"><aside class="summary-card syka-card"><span class="summary-label">KOMPETISI</span><h3>${esc(c.title)}</h3><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span><dl><div><dt>Pendaftaran</dt><dd>${window.SYKA_UTILS.formatDateTime(c.registrationStartsAt)} → ${window.SYKA_UTILS.formatDateTime(c.registrationEndsAt)}</dd></div><div><dt>Kompetisi</dt><dd>${window.SYKA_UTILS.formatDateTime(c.startsAt)}</dd></div></dl></aside><form id="registration-form" class="syka-card form-card"><div class="form-section-title"><div><span class="eyebrow">DATA PESERTA</span><h2>Periksa dan lengkapi</h2></div><span class="form-required">* wajib</span></div><div class="form-grid-2"><label>Nama lengkap *<input id="rg-name" required value="${esc(p.full_name||'')}"></label><label>Username *<input id="rg-username" required value="${esc(p.username||'')}"></label></div><div class="form-grid-2"><label>Email *<input id="rg-email" type="email" readonly value="${esc(auth.user.email||'')}"><small class="field-help">Email mengikuti akun Sykabelajar.</small></label><label>Tanggal lahir *${window.SYKA_UTILS.calendarPickerMarkup('rg-birth',p.birth_date||'', {required:true,maxDate:new Date().toISOString().slice(0,10),minDate:'1900-01-01',placeholder:'Pilih tanggal lahir',help:'Gunakan tanggal lahir sesuai dokumen resmi.'})}</label></div><div class="form-grid-2"><label>Kelas *<select id="rg-grade" required>${grades.map(([v,l])=>`<option value="${v}" ${p.grade===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Pembina / guru pendamping<input id="rg-guardian" value="${esc(p.guardian_name||'')}"></label></div><label>Sekolah *<input id="rg-school" required value="${esc(p.institution||'')}" placeholder="Mulai ketik nama sekolah"></label><div id="rg-school-suggest" class="suggest-list hidden"></div><div class="form-hint">Nama sekolah akan dinormalisasi menjadi uppercase di database. Pilih rekomendasi bila tersedia.</div><div class="form-actions"><a class="btn btn-secondary" href="${window.SYKA_ROUTER.href('/lomba/'+encodeURIComponent(slug))}">Kembali</a><button class="btn btn-primary" type="submit">Kirim pendaftaran</button></div><div id="rg-feedback"></div></form></div>`;
    window.SYKA_UTILS.bindCalendarPickers(root);
    const school=document.getElementById('rg-school'),suggest=document.getElementById('rg-school-suggest');let selected=p.school_id||null,timer;school.oninput=()=>{selected=null;clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(s=>`<button type="button" data-id="${esc(s.id)}" data-name="${esc(s.name)}"><b>${esc(s.name)}</b><small>${esc([s.city,s.province].filter(Boolean).join(' · '))}</small></button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;selected=b.dataset.id;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},220);};
    document.getElementById('registration-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type="submit"]'),feedback=document.getElementById('rg-feedback');if(!f.querySelector('#rg-birth').value){feedback.innerHTML='<div class="inline-error">Tanggal lahir wajib diisi.</div>';return;}btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Mengirim…';try{await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,{full_name:f.querySelector('#rg-name').value.trim(),username:f.querySelector('#rg-username').value.trim().toLowerCase(),birth_date:f.querySelector('#rg-birth').value,grade:f.querySelector('#rg-grade').value,institution:f.querySelector('#rg-school').value.trim().toUpperCase(),school_id:selected,guardian_name:f.querySelector('#rg-guardian').value.trim()||null});const reg=await window.SYKA_REGISTRATION_SERVICE.register({competitionId:c.id});window.SYKA_STATE.patch('auth.profile',await window.SYKA_PROFILE_SERVICE.getMe(auth.user.id));feedback.innerHTML=`<div class="success-inline">Pendaftaran berhasil dikirim. Status saat ini: <b>${esc(reg?.status||'PENDING')}</b>.</div>`;btn.disabled=true;window.SYKA_TOAST.show('Pendaftaran berhasil dikirim.','success');}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Pendaftaran gagal.')}</div>`;btn.disabled=false;btn.textContent='Kirim pendaftaran';}};
  }
  window.SYKA_PAGE_REGISTRATION={render};
})();


/* src/pages/Attempt.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const fmt=window.SYKA_UTILS.formatDateTime;

  function optionValue(question){
    const cfg=question.config||{};
    return cfg.options||[];
  }

  function renderQuestion(q,idx,answer){
    const type=q.type;
    const current=answer?.answer_json;
    let body='';
    if(['multiple_choice','true_false'].includes(type)){
      const options=q.options||[];
      body=options.map(o=>`<label class="attempt-option"><input type="radio" name="q-${q.id}" value="${esc(o.value)}" ${current?.value===o.value?'checked':''}><span>${esc(o.label)}</span></label>`).join('');
    }else if(type==='multiple_checkbox'){
      const selected=Array.isArray(current?.values)?current.values:[];
      body=(q.options||[]).map(o=>`<label class="attempt-option"><input type="checkbox" data-multi-q="${q.id}" value="${esc(o.value)}" ${selected.includes(o.value)?'checked':''}><span>${esc(o.label)}</span></label>`).join('');
    }else if(type==='short_answer'){
      body=`<input class="attempt-text-input" data-short-q="${q.id}" value="${esc(current?.value||'')}" placeholder="Tulis jawaban singkat…">`;
    }else if(type==='essay'){
      body=`<textarea class="attempt-essay" data-essay-q="${q.id}" rows="8" placeholder="Tulis jawabanmu di sini…">${esc(current?.value||'')}</textarea>`;
    }else if(type==='file_upload'){
      body=`<input type="file" class="attempt-file" data-file-q="${q.id}"><small class="field-help">File dikirim saat jawaban disimpan sesuai aturan kompetisi.</small>`;
    }else{
      body='<div class="inline-error">Jenis soal belum didukung.</div>';
    }
    return `<article class="attempt-question" data-question="${q.id}"><div class="attempt-question-head"><span>${String(idx+1).padStart(2,'0')}</span><div><span class="eyebrow">${esc(q.type)}</span><h3>${esc(q.prompt)}</h3></div><b>${Number(q.points||0)} pts</b></div><div class="attempt-question-body">${body}</div><div class="attempt-save-state" data-save-state="${q.id}"></div></article>`;
  }

  async function render(root,attemptId){
    try{
      const state=await window.SYKA_ATTEMPT_SERVICE.getResume(attemptId);
      if(!state){root.innerHTML=window.SYKA_EMPTY.render({title:'Attempt tidak ditemukan',text:'Sesi ujian tidak tersedia atau sudah berakhir.'});return;}
      const attempt=state.attempt||state;
      const questions=state.questions||[];
      const answers=state.answers||[];
      const map=new Map(answers.map(a=>[a.question_id,a]));
      root.innerHTML=`<div class="attempt-page-v48"><div class="attempt-topbar"><div><span class="eyebrow">ASSESSMENT</span><h1>${esc(state.competition?.title||'Kompetisi')}</h1><small>Mulai ${fmt(attempt.started_at)} · Berakhir ${fmt(attempt.expires_at)}</small></div><div class="attempt-clock" id="attempt-clock">--:--</div></div><div class="attempt-progress"><div class="attempt-progress-track"><span id="attempt-progress-fill"></span></div><span id="attempt-progress-label">0 / ${questions.length} terjawab</span></div><form id="attempt-form">${questions.map((q,i)=>renderQuestion(q,i,map.get(q.id))).join('')}<div class="attempt-submit-bar"><span id="attempt-submit-feedback"></span><button class="btn btn-primary btn-lg" type="submit">Kirim jawaban</button></div></form></div>`;
      const form=root.querySelector('#attempt-form');
      const dirtyTimers=new Map();
      const pending=new Map();
      function readAnswer(q){
        if(q.type==='multiple_choice'||q.type==='true_false'){
          const el=form.querySelector(`input[name="q-${q.id}"]:checked`);return {value:el?.value||null};
        }
        if(q.type==='multiple_checkbox'){
          return {values:[...form.querySelectorAll(`[data-multi-q="${q.id}"]:checked`)].map(x=>x.value)};
        }
        if(q.type==='short_answer') return {value:form.querySelector(`[data-short-q="${q.id}"]`)?.value||''};
        if(q.type==='essay') return {value:form.querySelector(`[data-essay-q="${q.id}"]`)?.value||''};
        return {value:null};
      }
      async function persist(q){
        const answerJson=readAnswer(q);
        const stateEl=form.querySelector(`[data-save-state="${q.id}"]`);
        stateEl.textContent='Menyimpan…';
        try{pending.set(q.id,true);await window.SYKA_ATTEMPT_SERVICE.saveAnswer({attemptId,questionId:q.id,answerJson});stateEl.textContent='Tersimpan';}catch(e){stateEl.textContent='Gagal menyimpan';console.error('[Sykabelajar] answer save failed',e);}finally{pending.delete(q.id);updateProgress();}
      }
      function queue(q){clearTimeout(dirtyTimers.get(q.id));dirtyTimers.set(q.id,setTimeout(()=>persist(q),700));}
      function updateProgress(){let n=0;for(const q of questions){const a=readAnswer(q);if(a.value||Array.isArray(a.values)&&a.values.length)n++;}root.querySelector('#attempt-progress-fill').style.width=(questions.length?Math.round(n/questions.length*100):0)+'%';root.querySelector('#attempt-progress-label').textContent=`${n} / ${questions.length} terjawab`;}
      questions.forEach(q=>{form.querySelectorAll(`[data-question="${q.id}"] input, [data-question="${q.id}"] textarea`).forEach(el=>el.addEventListener('input',()=>queue(q)));form.querySelectorAll(`[data-question="${q.id}"] input[type="radio"], [data-question="${q.id}"] input[type="checkbox"]`).forEach(el=>el.addEventListener('change',()=>{queue(q);updateProgress();}));});
      updateProgress();
      const expires=new Date(attempt.expires_at||Date.now()).getTime();
      const tick=()=>{const left=Math.max(0,expires-Date.now());const sec=Math.floor(left/1000);const mm=String(Math.floor(sec/60)).padStart(2,'0');const ss=String(sec%60).padStart(2,'0');root.querySelector('#attempt-clock').textContent=`${mm}:${ss}`;if(left<=0){clearInterval(timer);root.querySelector('#attempt-submit-feedback').textContent='Waktu habis. Mengirim jawaban…';form.requestSubmit();}};
      const timer=setInterval(tick,1000);tick();
      form.onsubmit=async e=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');btn.disabled=true;root.querySelector('#attempt-submit-feedback').textContent='Mengirim jawaban…';try{for(const q of questions)await persist(q);const result=await window.SYKA_ATTEMPT_SERVICE.submit({attemptId});clearInterval(timer);root.innerHTML=`<div class="attempt-result-panel"><div class="confirm-icon">✓</div><span class="eyebrow">SUBMITTED</span><h2>Jawaban sudah dikirim</h2><p>${result?.status==='FINALIZED'?'Hasil otomatis sudah diproses.':'Jawaban terkirim dan masuk tahap penilaian.'}</p><a class="btn btn-primary" href="${window.SYKA_ROUTER.href('/lomba')}" >Kembali ke lomba</a></div>`;}catch(err){btn.disabled=false;root.querySelector('#attempt-submit-feedback').innerHTML=`<span class="inline-error">${esc(err.message||'Submit gagal.')}</span>`;}};
    }catch(e){console.error('[Sykabelajar] attempt render failed',e);root.innerHTML=window.SYKA_EMPTY.render({title:'Ujian gagal dimuat',text:e.message||'Silakan coba lagi.',actionHtml:`<button class="btn btn-primary" id="retry-attempt">Coba lagi</button>`});root.querySelector('#retry-attempt')?.addEventListener('click',()=>render(root,attemptId));}
  }
  window.SYKA_PAGE_ATTEMPT={render};
})();


/* src/pages/Profile.js */
(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  const grades=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
  const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  function roleOf(auth){
    if(auth.roles.includes('admin')) return 'admin';
    if(auth.roles.includes('organizer_member')) return 'organizer';
    if(auth.roles.includes('teacher')) return 'teacher';
    return 'student';
  }
  function roleLabel(role){return ({student:'Pelajar / Peserta',teacher:'Guru',organizer:'Penyelenggara',admin:'Administrator'})[role]||'Pengguna';}
  function roleIntro(role){return ({student:'Profil menjadi sumber identitas untuk pendaftaran, verifikasi sekolah, dan rekam prestasi.',teacher:'Kelola identitas profesional, institusi, dan informasi yang akan tampil pada aktivitas guru.',organizer:'Kelola identitas penanggung jawab dan informasi workspace penyelenggara.',admin:'Kelola identitas akun administrator tanpa memaksakan field pendidikan siswa.'})[role]||'Kelola identitas akun kamu.';}
  function normalizeBirthDate(value){
    if(!value)return '';
    const raw=String(value).slice(0,10);
    const d=new Date(raw+'T00:00:00');
    const now=new Date();
    if(Number.isNaN(d.getTime())||d>now||d.getFullYear()<1900)return '';
    return raw;
  }
  function birthParts(value){
    const raw=normalizeBirthDate(value);
    const d=raw?new Date(raw+'T00:00:00'):new Date(2009,0,1);
    return {day:d.getDate(),month:d.getMonth()+1,year:d.getFullYear()};
  }
  function birthField(value){
    const p=birthParts(value);const current=new Date().getFullYear();
    const years=Array.from({length:100},(_,i)=>current-i);
    const day=Array.from({length:31},(_,i)=>i+1);
    return `<div class="profile-date-field" data-profile-date-field>
      <button type="button" class="profile-date-trigger" id="pf-birth-trigger"><span class="profile-date-icon">◷</span><span id="pf-birth-text">${normalizeBirthDate(value)?`${String(p.day).padStart(2,'0')} ${months[p.month-1].slice(0,3)} ${p.year}`:'Pilih tanggal lahir'}</span><span>⌄</span></button>
      <div class="profile-date-popover" id="pf-birth-popover">
        <div class="profile-date-popover-head"><strong>Tanggal lahir</strong><small>Pilih tanggal yang benar.</small></div>
        <div class="profile-date-grid"><label>Hari<select id="pf-birth-day">${day.map(x=>`<option value="${x}" ${x===p.day?'selected':''}>${String(x).padStart(2,'0')}</option>`).join('')}</select></label><label>Bulan<select id="pf-birth-month">${months.map((m,i)=>`<option value="${i+1}" ${i+1===p.month?'selected':''}>${m}</option>`).join('')}</select></label><label>Tahun<select id="pf-birth-year">${years.map(y=>`<option value="${y}" ${y===p.year?'selected':''}>${y}</option>`).join('')}</select></label></div>
        <div class="profile-date-popover-footer"><span>Pastikan sesuai dokumen resmi.</span><button type="button" class="btn btn-primary btn-sm" id="pf-birth-done">Selesai</button></div>
      </div>
      <input type="hidden" id="pf-birth" value="${esc(normalizeBirthDate(value))}">
    </div>`;
  }
  function syncBirth(root){
    const day=Number(root.querySelector('#pf-birth-day')?.value);const month=Number(root.querySelector('#pf-birth-month')?.value);const year=Number(root.querySelector('#pf-birth-year')?.value);
    const max=new Date(year,month,0).getDate();const safe=Math.min(day,max);const d=new Date(year,month-1,safe);
    const value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    root.querySelector('#pf-birth').value=value;
    root.querySelector('#pf-birth-text').textContent=`${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  }

  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      root.innerHTML=`<div class="auth-gate"><div class="auth-gate-card"><span class="eyebrow">ACCOUNT</span><h1>Profil Saya</h1><p>Masuk untuk mengelola identitas, sekolah, foto profil, dan rekam prestasi.</p><button class="btn btn-primary" id="profile-login">Masuk ke akun</button></div></div>`;
      document.getElementById('profile-login').onclick=()=>window.SYKA_APP.openAuth('login',{target:'/profile'});
      return;
    }
    const p=auth.profile||{};const role=roleOf(auth);const name=p.full_name||auth.user.email?.split('@')[0]||'Pengguna';const avatar=p.avatar_url||'';const birth=normalizeBirthDate(p.birth_date);const roleText=roleLabel(role);
    const education=role==='student';
    const orgFields=role==='organizer'||role==='teacher';

    root.innerHTML=`<section class="profile-hero-v46"><div><span class="eyebrow">ACCOUNT</span><h1>Profil Saya</h1><p>${roleIntro(role)}</p></div><div class="profile-hero-badge"><span class="profile-role-dot"></span><strong>${esc(roleText)}</strong><small>${esc(auth.user.email||'')}</small></div></section>
    <div class="profile-layout-v46">
      <aside class="profile-side-v46 syka-card">
        <div class="profile-avatar-wrap"><div class="avatar-xl profile-avatar-v46" id="profile-avatar">${avatar?`<img src="${esc(avatar)}" alt="Foto profil">`:`<span>${window.SYKA_UTILS.initials(name)}</span>`}</div><button type="button" class="avatar-edit-btn" id="change-avatar" aria-label="Ubah foto profil">✎</button></div>
        <div class="profile-identity-name"><h2>${esc(name)}</h2><p>@${esc(p.username||'user')}</p><span>${esc(auth.user.email||'')}</span></div>
        <div class="profile-role-chip">${esc(roleText)}</div>
        <div class="profile-note-v46"><b>Foto profil</b><span>PNG, JPG, JPEG, WebP · maksimal 5 MB</span></div>
        <div class="profile-summary-v46">${education?`<div><b>${esc(p.grade||'—')}</b><span>Kelas</span></div><div><b>${esc(p.institution||'—')}</b><span>Sekolah</span></div>`:orgFields?`<div><b>${esc(p.institution||'—')}</b><span>Institusi</span></div><div><b>${esc(p.whatsapp||'—')}</b><span>WhatsApp</span></div>`:`<div><b>${esc(p.status||'ACTIVE')}</b><span>Status akun</span></div><div><b>${esc(roleText)}</b><span>Peran</span></div>`}</div>
        <div class="profile-side-links"><a href="${window.SYKA_ROUTER.href('/prestasi')}"><span>◈</span><div><strong>Rekam prestasi</strong><small>Lihat awards dan sertifikat.</small></div><b>→</b></a><a href="${window.SYKA_ROUTER.href('/verifikasi/demo')}"><span>✓</span><div><strong>Verifikasi</strong><small>Cek sertifikat publik.</small></div><b>→</b></a></div>
      </aside>
      <section class="profile-content-v46">
        <form id="profile-form" class="syka-card form-card profile-form-v46">
          <div class="form-section-title"><div><span class="eyebrow">IDENTITAS</span><h2>Data pribadi</h2><p>Gunakan data yang sesuai dengan dokumen atau identitas resmi.</p></div><span class="form-required">* wajib</span></div>
          <div class="form-grid-2"><label>Nama lengkap *<input id="pf-name" required value="${esc(p.full_name||'')}" autocomplete="name"></label><label>Username *<input id="pf-username" required value="${esc(p.username||'')}" autocomplete="username" readonly aria-readonly="true"><small class="field-help">Username permanen dan tidak dapat diubah.</small></label></div>
          <div class="form-grid-2"><div class="field-group"><span class="field-label">Email</span><div class="readonly-field"><input value="${esc(auth.user.email||'')}" disabled><small class="field-help">Email akun tidak diubah dari halaman ini.</small></div></div><label>Tanggal lahir ${education||role==='teacher'?'*':''}${birthField(birth)}</label></div>
          ${education?`<div class="form-section-title compact"><div><span class="eyebrow">PENDIDIKAN</span><h2>Sekolah & pembina</h2><p>Data ini dipakai saat pendaftaran kompetisi dan verifikasi eligibility.</p></div></div><div class="form-grid-2"><label>Sekolah *<input id="pf-school" required value="${esc(p.institution||'')}" placeholder="Mulai ketik nama sekolah"></label><label>Kelas *<select id="pf-grade" required>${grades.map(([v,l])=>`<option value="${v}" ${p.grade===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="form-grid-2"><label>Pembina / guru pendamping<input id="pf-guardian" value="${esc(p.guardian_name||'')}" placeholder="Opsional"></label><label>Nomor WhatsApp<input id="pf-whatsapp" inputmode="tel" value="${esc(p.whatsapp||'')}" placeholder="08xxxxxxxxxx"></label></div>`:''}
          ${orgFields?`<div class="form-section-title compact"><div><span class="eyebrow">PROFESIONAL</span><h2>${role==='organizer'?'Identitas penyelenggara':'Identitas guru'}</h2></div></div><div class="form-grid-2"><label>${role==='organizer'?'Nama organisasi / institusi':'Sekolah / institusi'} ${role==='teacher'?'*':''}<input id="pf-school" ${role==='teacher'?'required':''} value="${esc(p.institution||'')}" placeholder="Mulai ketik nama institusi"></label><label>Nomor WhatsApp<input id="pf-whatsapp" inputmode="tel" value="${esc(p.whatsapp||'')}" placeholder="08xxxxxxxxxx"></label></div><div class="form-grid-2"><label>${role==='teacher'?'Bidang / mata pelajaran':'Nama penanggung jawab'}<input id="pf-role-extra" value="${esc(role==='teacher'?(p.subject||''):(p.contact_name||''))}"></label><label>Bio singkat<input id="pf-bio-short" value="${esc(p.bio||'')}" placeholder="Ringkasan singkat"></label></div>`:''}
          ${role==='admin'?`<div class="profile-admin-note"><span>✓</span><div><strong>Akun administrator</strong><p>Field sekolah, kelas, dan pembina tidak diwajibkan untuk akun administrator.</p></div></div>`:''}
          ${!orgFields&&!education&&role!=='admin'?`<div class="form-section-title compact"><div><span class="eyebrow">TENTANG</span><h2>Bio singkat</h2></div></div><label>Bio<textarea id="pf-bio" rows="4" placeholder="Ceritakan sedikit tentang dirimu…">${esc(p.bio||'')}</textarea></label>`:''}
          ${role==='admin'?`<label>Bio singkat<textarea id="pf-bio" rows="4" placeholder="Opsional">${esc(p.bio||'')}</textarea></label>`:''}
          <div id="profile-feedback"></div><div class="form-actions profile-form-actions"><span class="save-hint">Perubahan tersimpan ke profil akun kamu.</span><button class="btn btn-primary" type="submit">Simpan perubahan</button></div>
        </form>
      </section>
    </div>`;

    root.querySelector('#change-avatar').onclick=()=>window.SYKA_CLOUDINARY.openAvatarWidget(async info=>{try{const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,{avatar_url:info.secure_url,avatar_public_id:info.public_id,avatar_width:info.width||null,avatar_height:info.height||null,avatar_version:info.version?String(info.version):null,avatar_resource_type:info.resource_type||'image'});window.SYKA_STATE.patch('auth.profile',updated);root.querySelector('#profile-avatar').innerHTML=`<img src="${esc(updated.avatar_url)}" alt="Foto profil">`;window.SYKA_TOAST.show('Foto profil berhasil diperbarui.','success');window.SYKA_HEADER.render();window.SYKA_SIDEBAR.render();}catch(error){window.SYKA_TOAST.show(error.message||'Upload foto gagal.','error');}});

    const dateField=root.querySelector('[data-profile-date-field]');
    const toggle=()=>dateField?.classList.toggle('open');
    root.querySelector('#pf-birth-trigger')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle();});
    root.querySelectorAll('#pf-birth-day,#pf-birth-month,#pf-birth-year').forEach(el=>el.addEventListener('change',()=>syncBirth(root)));
    root.querySelector('#pf-birth-done')?.addEventListener('click',()=>dateField?.classList.remove('open'));
    document.addEventListener('click',e=>{if(!e.target.closest('[data-profile-date-field]'))dateField?.classList.remove('open');},{once:true,capture:true});

    const school=root.querySelector('#pf-school');
    const suggest=document.createElement('div');
    suggest.id='school-suggest';suggest.className='suggest-list hidden';school?.parentElement?.appendChild(suggest);
    let timer,selectedSchoolId=p.school_id||null;
    if(school){school.addEventListener('input',()=>{selectedSchoolId=null;clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(s=>`<button type="button" data-id="${esc(s.id)}" data-name="${esc(s.name)}"><b>${esc(s.name)}</b><small>${esc([s.city,s.province].filter(Boolean).join(' · '))}</small></button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;selectedSchoolId=b.dataset.id||null;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},220);});}

    root.querySelector('#profile-form').onsubmit=async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button[type="submit"]'),feedback=root.querySelector('#profile-feedback');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Menyimpan…';try{const birthValue=root.querySelector('#pf-birth').value||null;if((education||role==='teacher')&&!birthValue){throw new Error('Tanggal lahir wajib diisi.');}const payload={full_name:root.querySelector('#pf-name').value.trim(),birth_date:birthValue,bio:root.querySelector('#pf-bio')?.value.trim()||root.querySelector('#pf-bio-short')?.value.trim()||null};if(education){payload.grade=root.querySelector('#pf-grade').value;payload.institution=root.querySelector('#pf-school').value.trim().toUpperCase();payload.school_id=selectedSchoolId;payload.guardian_name=root.querySelector('#pf-guardian').value.trim()||null;payload.whatsapp=root.querySelector('#pf-whatsapp')?.value.trim()||null;}else if(orgFields){payload.institution=root.querySelector('#pf-school').value.trim().toUpperCase();payload.whatsapp=root.querySelector('#pf-whatsapp')?.value.trim()||null;if(role==='teacher')payload.subject=root.querySelector('#pf-role-extra')?.value.trim()||null;else payload.contact_name=root.querySelector('#pf-role-extra')?.value.trim()||null;}const updated=await window.SYKA_PROFILE_SERVICE.updateProfile(auth.user.id,payload);window.SYKA_STATE.patch('auth.profile',updated);feedback.innerHTML='<div class="success-inline">Profil berhasil diperbarui.</div>';window.SYKA_HEADER.render();window.SYKA_SIDEBAR.render();}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Profil gagal disimpan.')}</div>`;}finally{btn.disabled=false;btn.textContent='Simpan perubahan';}};
  }
  window.SYKA_PAGE_PROFILE={render};
})();


/* src/pages/Leaderboard.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml,fmt=window.SYKA_UTILS.formatNumber;
  const medals={1:'♛',2:'◇',3:'✦'};
  function podium(r,rank,cls){
    const name=r?.name||r?.full_name||'';
    const ready=Boolean(name);
    return `<article class="podium-card ${cls} ${ready?'has-data':'is-empty'}">
      <div class="podium-rank-badge"><span>${medals[rank]}</span><small>${rank===1?'JUARA 1':rank===2?'JUARA 2':'JUARA 3'}</small></div>
      <div class="podium-avatar">${ready?esc(window.SYKA_UTILS.initials(name)):'—'}</div>
      <strong>${ready?esc(name):'Belum tersedia'}</strong>
      <small>${ready?esc(r?.grade||'Peserta'):'Akan muncul ketika leaderboard aktif'}</small>
      <b>${ready?fmt(r?.xp||r?.total_xp||0)+' XP':'—'}</b>
    </article>`;
  }
  async function render(root){
    root.innerHTML=`<section class="page-title leaderboard-title-v46"><span class="eyebrow">LEADERBOARD</span><h1>Juara & Peringkat</h1><p>Peringkat prestasi akan dihitung dari hasil kompetisi resmi dan XP yang tervalidasi di server.</p></section>
      <section class="leaderboard-status-card"><div class="leaderboard-status-icon">◈</div><div><span class="eyebrow">COMING SOON</span><h2>Peringkat sedang disiapkan</h2><p>Read model leaderboard akan diaktifkan setelah season dan scope penilaian resmi tersedia. Tampilan juara tetap disiapkan dari sekarang.</p></div><span class="status-pill status-warning">SEGERA</span></section>
      <div id="podium" class="podium-grid podium-grid-v46"></div>
      <section class="panel-card leaderboard-list-card"><div class="panel-head"><div><span class="eyebrow">TOP 4–50</span><h2>Daftar juara</h2><p>10 peserta per halaman setelah data leaderboard tersedia.</p></div><span class="chip">TOP 50</span></div><div id="rank-list"></div><div id="rank-pagination" class="pagination"></div></section>`;
    try{
      const rows=await window.SYKA_LEADERBOARD_SERVICE.get({scope:'global',limit:50});
      const podiumRoot=document.getElementById('podium');
      podiumRoot.innerHTML=[1,2,3].map((r,i)=>podium(rows[i],r,['gold','silver','bronze'][i])).join('');
      const lower=rows.slice(3);
      if(!lower.length){
        document.getElementById('rank-list').innerHTML=`<div class="leaderboard-empty-state"><div class="leaderboard-empty-icon">4–50</div><h3>Daftar juara belum tersedia</h3><p>Peserta peringkat 4–50 akan muncul otomatis saat read model leaderboard diaktifkan.</p></div>`;
        document.getElementById('rank-pagination').innerHTML='';
        return;
      }
      let page=1;const per=10;const list=document.getElementById('rank-list'),pagination=document.getElementById('rank-pagination');
      const paint=()=>{const start=(page-1)*per;const chunk=lower.slice(start,start+per);list.innerHTML=chunk.map((r,i)=>`<div class="rank-row rank-row-v46"><span class="rank-number">${start+i+4}</span><div class="rank-user"><div class="avatar-mini">${esc(window.SYKA_UTILS.initials(r.name||r.full_name||'U'))}</div><div><strong>${esc(r.name||r.full_name||'Peserta')}</strong><small>${esc(r.grade||'')}</small></div></div><b>${fmt(r.xp||r.total_xp||0)} XP</b></div>`).join('');const pages=Math.max(1,Math.ceil(lower.length/per));pagination.innerHTML=`<button class="page-btn" data-page="${page-1}" ${page===1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>`<button class="page-btn ${page===i+1?'active':''}" data-page="${i+1}">${i+1}</button>`).join('')}<button class="page-btn" data-page="${page+1}" ${page===pages?'disabled':''}>›</button>`;pagination.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);paint();});};
      paint();
    }catch(error){
      document.getElementById('podium').innerHTML=[1,2,3].map((r,i)=>podium(null,r,['gold','silver','bronze'][i])).join('');
      document.getElementById('rank-list').innerHTML=`<div class="leaderboard-empty-state"><div class="leaderboard-empty-icon">!</div><h3>Peringkat belum aktif</h3><p>${esc(error.message||'Read model leaderboard belum tersedia.')}</p></div>`;
    }
  }
  window.SYKA_PAGE_LEADERBOARD={render};
})();


/* src/pages/Awards.js */
(function(){async function render(root){const a=window.SYKA_STATE.getState().auth;if(!a.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk melihat prestasi',text:'Awards pribadi bersifat private.',actionHtml:'<button class="btn btn-primary" id="award-login">Masuk</button>'});document.getElementById('award-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/prestasi'}));return;}root.innerHTML=`<section class="page-title"><span class="eyebrow">ACHIEVEMENTS</span><h1>Prestasi Saya</h1><p>Awards dan proof of achievement tersimpan di akunmu.</p></section><div id="awards" class="award-grid"></div>`;try{const rows=await window.SYKA_AWARD_SERVICE.getAwards(a.user.id);document.getElementById('awards').innerHTML=rows.length?rows.map(r=>`<article class="award-card syka-card"><span class="award-medal">✦</span><div><span class="chip">${window.SYKA_UTILS.escapeHtml(r.rank_code||'ACHIEVEMENT')}</span><h3>${window.SYKA_UTILS.escapeHtml(r.title||'Achievement')}</h3><p>${Number(r.points||0).toLocaleString('id-ID')} points · ${window.SYKA_UTILS.formatDate(r.created_at||r.issued_at)}</p></div></article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada prestasi',text:'Achievement akan muncul setelah result dan reward event difinalisasi backend.'});}catch(error){document.getElementById('awards').innerHTML=window.SYKA_EMPTY.render({title:'Prestasi belum dapat dimuat',text:error.message||'Coba lagi.'});}}
window.SYKA_PAGE_AWARDS={render};})();


/* src/pages/Orders.js */
(function(){
  const esc=window.SYKA_UTILS.escapeHtml;
  const money=(v,c='IDR')=>new Intl.NumberFormat('id-ID',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(v)||0);
  async function render(root){
    const a=window.SYKA_STATE.getState().auth;
    if(!a.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk melihat pesanan',text:'Riwayat order, bukti transfer, dan status verifikasi ada di sini.',actionHtml:'<button class="btn btn-primary" id="order-login">Masuk</button>'});document.getElementById('order-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/pesanan'}));return;}
    root.innerHTML=`<section class="page-title"><span class="eyebrow">COMMERCE</span><h1>Pesanan Saya</h1><p>Setiap pembayaran manual akan masuk review admin. Status <b>PAID</b> hanya setelah pembayaran diverifikasi.</p></section><div id="orders" class="orders-grid-v46"></div>`;
    try{
      const rows=await window.SYKA_ORDER_SERVICE.list(a.user.id);
      document.getElementById('orders').innerHTML=rows.length?rows.map(o=>`<article class="order-card-v46"><div class="order-card-head"><div><span class="eyebrow">ORDER</span><h3>#${esc(String(o.id).slice(0,10))}</h3><small>${window.SYKA_UTILS.formatDateTime(o.created_at)}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(o.status)}">${esc(o.status||'DRAFT')}</span></div><div class="order-summary-grid"><div><span>Total</span><strong>${money(o.total,o.currency)}</strong></div><div><span>WhatsApp</span><strong>${esc(o.contact_whatsapp||'—')}</strong></div><div><span>Metode</span><strong>${esc(o.payment_method||'—')}</strong></div></div>${o.payment_proof_url?`<div class="order-proof"><img src="${esc(window.SYKA_UTILS.cloudinaryTransform(o.payment_proof_url,{width:320,height:220,crop:'fit'}))}" alt="Bukti transfer" loading="lazy"><div><strong>Bukti transfer</strong><small>Status: ${esc(o.payment_proof_status||'SUBMITTED')}</small></div></div>`:'<div class="order-proof-empty">Bukti transfer belum diunggah.</div>'}</article>`).join(''):window.SYKA_EMPTY.render({title:'Belum ada pesanan',text:'Katalog Toko dan pembelian yang kamu kirim akan muncul di sini.'});
    }catch(error){document.getElementById('orders').innerHTML=window.SYKA_EMPTY.render({title:'Pesanan belum dapat dimuat',text:error.message||'Coba lagi.'});}
  }
  window.SYKA_PAGE_ORDERS={render};
})();


/* src/pages/Store.js */
(function(){
  const esc=v=>window.SYKA_UTILS.escapeHtml(v);
  const money=(v,currency='IDR')=>new Intl.NumberFormat('id-ID',{style:'currency',currency,maximumFractionDigits:0}).format(Number(v)||0);
  const typeLabel={EDU_COIN_TOPUP:'Koin Edu',FEATURE_UNLOCK:'Fitur akun',DIGITAL_ITEM:'Item digital',DONATION:'Dukungan',PLAN:'Paket'};
  const audienceLabel={student:'Pelajar',teacher:'Guru',organizer:'Penyelenggara'};

  function currentAudience(){
    const roles=window.SYKA_STATE.getState().auth.roles||[];
    if(roles.includes('admin'))return 'Semua';
    if(roles.includes('organizer_member'))return 'Penyelenggara';
    if(roles.includes('teacher'))return 'Guru';
    return 'Pelajar';
  }

  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk untuk membuka Toko',text:'Beli Koin Edu, buka fitur khusus, dukung Sykabelajar, dan kelola pembelianmu dalam satu tempat.',actionHtml:'<button class="btn btn-primary" id="store-login">Masuk</button>'});
      document.getElementById('store-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/toko'}));
      return;
    }

    root.innerHTML=`
      <section class="store-hero">
        <div>
          <span class="eyebrow">SYKABELAJAR STORE</span>
          <h1>Fitur, Koin Edu, &amp; Dukungan</h1>
          <p>Semua pembelian dirancang modular agar bisa dipakai pelajar, guru, dan penyelenggara sesuai kebutuhan.</p>
        </div>
        <div class="store-audience"><span class="store-audience-dot"></span><strong>${esc(currentAudience())}</strong><small>katalog yang relevan untuk akunmu</small></div>
      </section>
      <div class="store-notice"><span class="support-icon">◈</span><div><strong>Belum ada pembayaran langsung di browser</strong><p>Pesanan dibuat sebagai draft dan baru dianggap lunas setelah provider payment terverifikasi melalui webhook backend.</p></div></div>
      <section class="store-section"><div class="section-head"><div><span class="eyebrow">CATALOG</span><h2>Yang bisa kamu gunakan</h2></div><a class="btn btn-ghost btn-sm" href="${window.SYKA_ROUTER.href('/pesanan')}">Pesanan saya →</a></div><div id="store-grid" class="store-grid"></div></section>
    `;

    try{
      const products=await window.SYKA_STORE_SERVICE.listProducts();
      const grid=document.getElementById('store-grid');
      grid.innerHTML=products.map(productCard).join('')||window.SYKA_EMPTY.render({title:'Belum ada produk',text:'Katalog sedang disiapkan oleh Sykabelajar.'});
      grid.querySelectorAll('[data-buy]').forEach(btn=>btn.addEventListener('click',()=>openBuy(products.find(p=>p.id===btn.dataset.buy))));
    }catch(error){
      document.getElementById('store-grid').innerHTML=window.SYKA_EMPTY.render({title:'Katalog belum dapat dimuat',text:error.message||'Coba lagi beberapa saat.'});
    }
  }

  function productCard(p){
    const benefit=(p.benefits||[])[0];
    const benefits=(p.benefits||[]).map(b=>{
      if(b.benefit_type==='EDU_COIN') return `<span>+${Number(b.quantity||0).toLocaleString('id-ID')} Koin Edu</span>`;
      if(b.benefit_type==='FEATURE') return `<span>${esc(b.benefit_key||'Fitur khusus')}${b.duration_days?` · ${b.duration_days} hari`:''}</span>`;
      if(b.benefit_type==='PLAN') return `<span>Paket ${esc(b.benefit_key||'')}</span>`;
      return `<span>Benefit khusus</span>`;
    }).join('');
    const donation=p.product_type==='DONATION';
    return `<article class="store-card ${p.is_featured?'featured':''}">
      ${p.image_url?`<div class="store-card-media"><img src="${esc(window.SYKA_UTILS.cloudinaryTransform(p.image_url,{width:640,height:400,crop:'fill'}))}" alt="${esc(p.name)}" loading="lazy"></div>`:`<div class="store-card-media placeholder">${donation?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':'◆'}</div>`}
      <div class="store-card-top"><span class="store-icon">${donation?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':p.product_type==='FEATURE_UNLOCK'?'◈':'◆'}</span><span class="chip">${esc(typeLabel[p.product_type]||p.product_type)}</span></div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.short_description||p.description||'')}</p>
      <div class="store-benefits">${benefits||'<span>Produk digital Sykabelajar</span>'}</div>
      <div class="store-card-bottom"><div><small>${donation?'Dukungan':'Mulai dari'}</small><strong>${money(p.price,p.currency)}</strong></div><button type="button" class="btn btn-primary" data-buy="${esc(p.id)}">${donation?'Dukung':'Beli'}</button></div>
    </article>`;
  }

  function openBuy(product){
    if(!product)return;
    const donation=product.product_type==='DONATION';
    const price=Number(product.price)||0;
    const requiresProof=price>0;
    window.SYKA_MODAL.open({title:donation?'Dukung Sykabelajar':'Pembayaran manual',wide:true,html:`
      <div class="purchase-modal purchase-modal-v46">
        <div class="purchase-summary purchase-summary-v46"><div class="store-icon">${donation?'♥':'✦'}</div><div><span class="eyebrow">${esc(typeLabel[product.product_type]||'PRODUK')}</span><h3>${esc(product.name)}</h3><p>${esc(product.short_description||'')}</p></div></div>
        <div class="purchase-flow-v46"><div class="purchase-step active"><span>1</span><div><strong>Data pembayaran</strong><small>Nomor WhatsApp untuk konfirmasi.</small></div></div><div class="purchase-step"><span>2</span><div><strong>Bukti transfer</strong><small>Upload gambar langsung ke Cloudinary.</small></div></div><div class="purchase-step"><span>3</span><div><strong>Review admin</strong><small>Benefit aktif setelah pembayaran diverifikasi.</small></div></div></div>
        <div class="purchase-price"><span>Total</span><strong id="purchase-total">${money(price,product.currency)}</strong></div>
        <div class="form-grid-2"><label>Nomor WhatsApp *<input id="purchase-whatsapp" inputmode="tel" placeholder="08xxxxxxxxxx" required></label><label>Jumlah *<input id="purchase-qty" type="number" min="1" max="20" value="1"></label></div>
        ${requiresProof?`<div class="upload-field-card"><div><span class="eyebrow">BUKTI TRANSFER</span><h3>Upload foto / screenshot</h3><p>Jangan tempel link. Gambar akan diunggah ke Cloudinary dan URL aman akan disimpan ke order.</p></div><div class="upload-preview" id="payment-proof-preview"><div class="upload-placeholder"><span>↑</span><strong>Belum ada bukti</strong><small>PNG, JPG, WEBP • maksimal 8 MB</small></div></div><div class="upload-actions"><button type="button" class="btn btn-secondary" id="payment-proof-upload">Pilih gambar</button><button type="button" class="btn btn-ghost hidden" id="payment-proof-remove">Ganti gambar</button></div><div id="payment-proof-info"></div></div>`:'<div class="store-notice"><span>♥</span><div><strong>Dukungan tanpa nominal</strong><p>Kamu tetap dapat mengirim dukungan setelah mengisi nomor WhatsApp.</p></div></div>'}
        <div class="form-hint">Setelah order dibuat, status awal <b>PENDING_PAYMENT</b>. Admin akan memeriksa bukti transfer. Jangan kirim uang di luar instruksi resmi Sykabelajar.</div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button type="button" class="btn btn-primary" id="purchase-confirm">${donation?'Kirim dukungan':'Kirim pesanan'}</button></div>
        <div id="purchase-feedback"></div>
      </div>`,onOpen:body=>{
      body.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
      const qty=body.querySelector('#purchase-qty'),total=body.querySelector('#purchase-total');
      const recalc=()=>total.textContent=money((Number(qty.value)||1)*price,product.currency);
      qty.addEventListener('input',recalc);
      let proof=null;
      body.querySelector('#payment-proof-upload')?.addEventListener('click',async()=>{
        try{proof=await window.SYKA_CLOUDINARY.openPaymentProofWidget();const preview=body.querySelector('#payment-proof-preview');preview.innerHTML=`<img src="${esc(proof.secure_url)}" alt="Bukti transfer"><div class="upload-file-meta"><strong>${esc(proof.original_filename||'Bukti transfer')}</strong><small>${Math.round((proof.bytes||0)/1024)} KB</small></div>`;body.querySelector('#payment-proof-remove')?.classList.remove('hidden');body.querySelector('#payment-proof-upload').textContent='Ganti gambar';}catch(error){body.querySelector('#purchase-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Upload gagal.')}</div>`;}});
      body.querySelector('#payment-proof-remove')?.addEventListener('click',()=>{proof=null;body.querySelector('#payment-proof-preview').innerHTML='<div class="upload-placeholder"><span>↑</span><strong>Belum ada bukti</strong><small>PNG, JPG, WEBP • maksimal 8 MB</small></div>';body.querySelector('#payment-proof-upload').textContent='Pilih gambar';});
      body.querySelector('#purchase-confirm').onclick=async()=>{
        const btn=body.querySelector('#purchase-confirm');const wa=body.querySelector('#purchase-whatsapp').value.trim();
        if(wa.length<8){body.querySelector('#purchase-feedback').innerHTML='<div class="inline-error">Masukkan nomor WhatsApp yang valid.</div>';return;}
        if(requiresProof&&!proof){body.querySelector('#purchase-feedback').innerHTML='<div class="inline-error">Upload bukti transfer sebelum mengirim pesanan.</div>';return;}
        btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Mengirim…';
        try{const order=await window.SYKA_STORE_SERVICE.createProductOrder(product.id,Math.max(1,Math.min(20,Number(qty.value)||1)),{whatsapp:wa,payment_method:'MANUAL_TRANSFER',proof_url:proof?.secure_url,proof_public_id:proof?.public_id,proof_width:proof?.width,proof_height:proof?.height,proof_version:proof?.version,proof_resource_type:proof?.resource_type});window.SYKA_MODAL.close();window.SYKA_TOAST.show(`Pesanan #${String(order.id).slice(0,8)} terkirim. Tunggu verifikasi admin.`,'success');setTimeout(()=>window.SYKA_ROUTER.navigate('/pesanan'),250);}catch(error){btn.disabled=false;btn.textContent=donation?'Kirim dukungan':'Kirim pesanan';body.querySelector('#purchase-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Pesanan gagal dibuat.')}</div>`;}}
    }});
  }

  window.SYKA_PAGE_STORE={render};
})();


/* src/pages/Verify.js */
(function(){
  async function render(root,code){
    root.innerHTML=`<section class="page-title"><span class="eyebrow">VERIFICATION</span><h1>Verifikasi Certificate</h1><p>Masukkan kode publik untuk memeriksa proof of achievement.</p></section><form id="verify-form" class="verify-search"><input id="verify-code" value="${window.SYKA_UTILS.escapeHtml(code||'')}" placeholder="Masukkan kode verifikasi"><button class="btn btn-primary">Verifikasi</button></form><div id="verify-result"></div>`;
    document.getElementById('verify-form').onsubmit=e=>{e.preventDefault();const value=document.getElementById('verify-code').value.trim();if(value)window.SYKA_ROUTER.navigate('/verifikasi/'+encodeURIComponent(value));};
    if(!code){document.getElementById('verify-result').innerHTML=window.SYKA_EMPTY.render({title:'Masukkan kode verifikasi',text:'Kode dapat diperoleh dari QR/halaman certificate publik.'});return;}
    try{const row=await window.SYKA_AWARD_SERVICE.verify(code);document.getElementById('verify-result').innerHTML=row?`<section class="verification-card syka-card"><div class="verification-icon">✓</div><span class="status-pill status-success">TERVERIFIKASI</span><h2>${window.SYKA_UTILS.escapeHtml(row.public_name||'Certificate')}</h2><p>Status ${window.SYKA_UTILS.escapeHtml(row.status||'PUBLISHED')} · kode ${window.SYKA_UTILS.escapeHtml(row.verification_code||code)}</p><small>Data private certificate tidak dibuka oleh public verification view.</small></section>`:window.SYKA_EMPTY.render({title:'Kode tidak ditemukan',text:'Periksa kembali kode verifikasi dan pastikan certificate sudah dipublikasikan.'});}
    catch(error){document.getElementById('verify-result').innerHTML=window.SYKA_EMPTY.render({title:'Verifikasi belum tersedia',text:error.message||'Read model verification belum dapat diakses.'});}
  }
  window.SYKA_PAGE_VERIFY={render};
})();


/* src/pages/Admin.js */
(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE;const esc=window.SYKA_UTILS.escapeHtml;const fmt=window.SYKA_UTILS.formatDateTime;const fn=window.SYKA_UTILS.formatNumber;
  const tabs=[['dashboard','Dashboard'],['users','Pengguna'],['competitions','Kompetisi'],['questions','Soal'],['twibbon','Twibbon'],['results','Hasil'],['certificates','Sertifikat'],['orders','Pesanan'],['moderation','Moderasi'],['plans','Paket'],['monetization','Monetisasi'],['organizer_settings','Pengaturan Penyelenggara'],['settings','Pengaturan'],['audit','Audit']];
  const transitions={DRAFT:['PUBLISHED','SUSPENDED','CANCELLED'],PUBLISHED:['REGISTRATION_OPEN','SUSPENDED','CANCELLED'],REGISTRATION_OPEN:['REGISTRATION_CLOSED','SUSPENDED','CANCELLED'],REGISTRATION_CLOSED:['LIVE','SUSPENDED','CANCELLED'],LIVE:['SUBMISSION_CLOSED','SUSPENDED','CANCELLED'],SUBMISSION_CLOSED:['GRADING','SUSPENDED','CANCELLED'],GRADING:['RESULT_PUBLISHED','SUSPENDED'],RESULT_PUBLISHED:['ARCHIVED','SUSPENDED'],SUSPENDED:['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','CANCELLED']};
  function shell(tab,title,subtitle){return `<div class="control-head"><div><span class="eyebrow">ADMIN CONTROL PLANE</span><h1>${title}</h1><p>${subtitle}</p></div><div class="control-head-meta"><span class="security-badge">RLS · server authoritative</span></div></div><div class="control-tabs">${tabs.map(([k,l])=>`<button type="button" class="control-tab ${k===tab?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div><div id="control-content"></div>`;}
  async function render(root){const auth=window.SYKA_STATE.getState().auth;if(!auth.user){root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel admin hanya dapat diakses oleh administrator.',actionHtml:'<button class="btn btn-primary" id="admin-login">Masuk</button>'});document.getElementById('admin-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/admin'}));return;}if(!auth.roles.includes('admin')){root.innerHTML=window.SYKA_EMPTY.render({title:'Akses ditolak',text:'Akun ini belum memiliki role admin.',icon:'⊘'});return;}const q=window.SYKA_STATE.getState().route.query;const tab=tabs.some(([k])=>k===q.tab)?q.tab:'dashboard';root.innerHTML=shell(tab,'Panel Admin','Kelola platform, moderasi, kompetisi, transaksi, feature flags, dan audit dari satu control plane.');root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/admin',{tab:b.dataset.tab}));try{await renderTab(document.getElementById('control-content'),tab);}catch(error){document.getElementById('control-content').innerHTML=window.SYKA_EMPTY.render({title:'Modul gagal dimuat',text:error.message||'Periksa migration/RLS dan coba lagi.',actionHtml:'<button class="btn btn-ghost" id="cp-retry">Coba lagi</button>'});document.getElementById('cp-retry')?.addEventListener('click',()=>render(root));}}

  let privilegedUntil = 0;
  async function ensurePrivilegedAccess(){
    if(Date.now() < privilegedUntil) return true;

    const authState = window.SYKA_STATE.getState().auth || {};
    const email = authState.user?.email || '';
    if(!email){
      window.SYKA_TOAST?.show?.('Sesi Admin tidak ditemukan. Silakan login ulang.','error');
      return false;
    }

    return await new Promise(resolve=>{
      let settled = false;
      const finish = value => {
        if(settled) return;
        settled = true;
        resolve(Boolean(value));
      };

      const submit = async body => {
        const form = body?.querySelector?.('#step-up-form');
        if(!form) return finish(false);

        const password = body.querySelector('#privileged-password')?.value || '';
        const btn = form.querySelector('#privileged-submit');
        const feedback = body.querySelector('#privileged-feedback');

        if(!btn || !feedback){
          console.error('[Sykabelajar] Privileged auth UI incomplete.');
          return finish(false);
        }

        if(!password){
          feedback.innerHTML = '<div class="inline-error">Masukkan password Admin.</div>';
          body.querySelector('#privileged-password')?.focus();
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Memverifikasi…';
        feedback.innerHTML = '';

        try{
          const result = await window.SYKA_AUTH_SERVICE.reauthenticate({ email, password });
          if(!result?.session || result.session.user?.email?.toLowerCase() !== email.toLowerCase()){
            throw new Error('Sesi autentikasi tidak dapat diverifikasi.');
          }

          privilegedUntil = Date.now() + 15 * 60 * 1000;
          window.__SYKA_PRIVILEGED_UNTIL__ = privilegedUntil;

          // Close only after the privileged state is established.
          window.SYKA_MODAL.close();
          finish(true);
        }catch(error){
          btn.disabled = false;
          btn.textContent = 'Verifikasi & lanjutkan';
          const msg = String(error?.message || '').toLowerCase();
          let friendly = 'Verifikasi gagal. Coba lagi.';
          if(msg.includes('invalid login credentials') || msg.includes('invalid credentials')) friendly = 'Email atau password Admin salah.';
          else if(msg.includes('rate limit')) friendly = 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
          else if(msg.includes('email not confirmed')) friendly = 'Email Admin belum terverifikasi di Supabase Auth.';
          else if(error?.message) friendly = error.message;
          feedback.innerHTML = `<div class="inline-error">${esc(friendly)}</div>`;
          body.querySelector('#privileged-password')?.focus();
        }
      };

      window.SYKA_MODAL.open({
        title:'Verifikasi akses khusus Admin',
        wide:false,
        closeOnBackdrop:false,
        closeOnEscape:false,
        html:`<form id="step-up-form" class="form-card privileged-gate-form" novalidate>
          <div class="privileged-gate-icon">⌁</div>
          <span class="eyebrow">STEP-UP SECURITY</span>
          <h3>Konfirmasi identitas</h3>
          <p>Fitur ini mengubah paket penyelenggara dan masa berlaku subscription. Password diverifikasi melalui Supabase Auth.</p>
          <label>Email Admin<input value="${esc(email)}" readonly autocomplete="username"></label>
          <label>Password Admin<div class="password-field"><input id="privileged-password" type="password" autocomplete="current-password" required></div></label>
          <div id="privileged-feedback" role="alert" aria-live="polite"></div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost" data-close>Batal</button>
            <button type="button" class="btn btn-primary" id="privileged-submit">Verifikasi &amp; lanjutkan</button>
          </div>
        </form>`,
        onClose:()=>finish(false),
        onOpen:body=>{
          const form=body.querySelector('#step-up-form');
          const submitBtn=body.querySelector('#privileged-submit');
          const passwordInput=body.querySelector('#privileged-password');

          body.querySelector('[data-close]')?.addEventListener('click',()=>{
            window.SYKA_MODAL.close();
            finish(false);
          }, { once:true });

          // Use an explicit click handler instead of relying on form submit so
          // this critical auth action works consistently across browsers.
          submitBtn?.addEventListener('click',()=>submit(body));
          form?.addEventListener('submit',e=>{ e.preventDefault(); submit(body); });
          passwordInput?.addEventListener('keydown',e=>{
            if(e.key==='Enter'){
              e.preventDefault();
              submit(body);
            }
          });

          setTimeout(()=>passwordInput?.focus(),0);
        }
      });
    });
  }

  async function organizerSettings(root){
    const ok=Date.now()<privilegedUntil;
    if(!ok){
      root.innerHTML=`<section class="panel-card privileged-lock-card">
        <div class="privileged-lock-icon">⌁</div>
        <span class="eyebrow">STEP-UP SECURITY</span>
        <h2>Pengaturan Penyelenggara</h2>
        <p>Area ini digunakan untuk mengubah tier, tanggal mulai/berakhir, serta override paket workspace. Akses memerlukan verifikasi password Admin.</p>
        <button class="btn btn-primary" id="unlock-organizer-settings">Verifikasi akses</button>
      </section>`;
      root.querySelector('#unlock-organizer-settings').onclick=async()=>{if(await ensurePrivilegedAccess()) window.SYKA_ROUTER.refresh();};
      return;
    }
    const [orgs,catalog,orders]=await Promise.all([
      svc().listOrganizers(),
      svc().listPlanCatalog(),
      svc().listOrders({limit:300}).catch(()=>[])
    ]);
    const planMap=Object.fromEntries((catalog||[]).map(p=>[p.plan_code,p]));
    const orgData=await Promise.all((orgs||[]).map(async org=>({
      org,
      active:await svc().listActiveOrganizerPlan(org.id).catch(()=>null),
      history:await svc().listPlans({organizerId:org.id}).catch(()=>[])
    })));
    const orderRows=(orders||[]).filter(o=>(o.order_items||[]).some(it=>String(it.metadata?.organizer_id||'') && orgs.some(x=>x.id===it.metadata.organizer_id)));
    root.innerHTML=`<div class="toolbar">
      <div><span class="eyebrow">PRIVILEGED ORGANIZER SETTINGS</span><h2>Pengaturan paket penyelenggara</h2><p>Manual override, masa berlaku, dan riwayat pembelian. Semua perubahan dicatat ke audit.</p></div>
      <div class="toolbar-actions"><span class="privileged-session-chip">Akses aktif ${Math.max(0,Math.ceil((privilegedUntil-Date.now())/60000))} menit</span><button class="btn btn-ghost" id="lock-organizer-settings">Kunci</button></div>
    </div>
    <section class="privileged-warning"><strong>Zona sensitif</strong><span>Gunakan override hanya untuk koreksi pembayaran, sponsor, kompensasi, migrasi, atau perpanjangan manual.</span></section>
    <div class="privileged-organizer-grid">${orgData.map(({org,active,history})=>`
      <article class="panel-card organizer-subscription-card">
        <div class="panel-head"><div><span class="eyebrow">WORKSPACE</span><h3>${esc(org.name)}</h3><small>${esc(org.slug||'')}</small></div><span class="status-pill ${active?'status-success':'status-neutral'}">${active?esc(active.plan_code):'FREE / BELUM ADA'}</span></div>
        <div class="subscription-facts">
          <div><span>Paket aktif</span><strong>${active?.plan_code?esc(active.plan_code):'—'}</strong></div>
          <div><span>Mulai</span><strong>${active?.starts_at?fmt(active.starts_at):'—'}</strong></div>
          <div><span>Berakhir</span><strong>${active?.ends_at?fmt(active.ends_at):'—'}</strong></div>
        </div>
        <form class="organizer-plan-override" data-org="${esc(org.id)}">
          <div class="form-grid-2">
            <label>Paket<select data-plan><option value="">Pilih paket…</option>${catalog.map(p=>`<option value="${esc(p.plan_code)}" ${active?.plan_code===p.plan_code?'selected':''}>${esc(p.name)} — ${p.is_active?'Aktif':'Nonaktif'}</option>`).join('')}</select></label>
            <label>Masa berlaku<select data-term><option value="30">30 hari</option><option value="365">1 tahun (365 hari)</option><option value="CUSTOM">Custom</option></select></label>
          </div>
          <div class="form-grid-2">
            ${window.SYKA_UTILS.dateTimePickerMarkup(`org-start-${org.id}` ,active?.starts_at||'',{title:'Mulai masa paket',help:'Pilih tanggal dan waktu mulai.'})}
            ${window.SYKA_UTILS.dateTimePickerMarkup(`org-end-${org.id}` ,active?.ends_at||'',{title:'Berakhir masa paket',help:'Dipakai untuk masa berlaku custom.'})}
          </div>
          <label>Alasan wajib<textarea data-reason rows="2" placeholder="Alasan override / perubahan paket"></textarea></label>
          <div class="form-actions"><button type="submit" class="btn btn-primary">Simpan perubahan paket</button></div>
        </form>
        <details class="subscription-history"><summary>Riwayat paket (${history.length})</summary>${history.slice(0,10).map(h=>`<div class="history-row"><strong>${esc(h.plan_code)}</strong><span>${h.starts_at?fmt(h.starts_at):'—'} → ${h.ends_at?fmt(h.ends_at):'aktif'}</span><small>${h.is_active?'AKTIF':'SELESAI'}</small></div>`).join('')||'<div class="muted">Belum ada histori.</div>'}</details>
      </article>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada workspace',text:'Buat organizer terlebih dahulu.'})}</div>
    <section class="panel-card"><div class="panel-head"><div><span class="eyebrow">PURCHASE HISTORY</span><h3>Order paket penyelenggara</h3></div></div>
      ${orderRows.slice(0,50).map(o=>{const item=(o.order_items||[]).find(i=>i.product_type==='PLAN');return `<div class="data-row"><div><strong>#${esc(String(o.id).slice(0,8))} · ${esc(item?.name||item?.product_ref||'Plan')}</strong><small>${esc(o.status)} · dibuat ${fmt(o.created_at)} · ${esc(item?.metadata?.billing_period||'MONTHLY')}</small></div><strong>${money(o.total)}</strong></div>`;}).join('')||'<div class="empty-inline">Belum ada order paket.</div>'}
    </section>`;
    window.SYKA_UTILS.bindDateTimePickers(root);
    root.querySelector('#lock-organizer-settings')?.addEventListener('click',()=>{privilegedUntil=0;window.SYKA_ROUTER.refresh();});
    root.querySelectorAll('.organizer-plan-override').forEach(form=>{
      const term=form.querySelector('[data-term]');
      const startPrefix=`org-start-${form.dataset.org}`;
      const endPrefix=`org-end-${form.dataset.org}`;
      const sync=()=>{
        if(term.value==='CUSTOM')return;
        const startIso=window.SYKA_UTILS.readDateTimeField(startPrefix,form);
        if(!startIso)return;
        const v=new Date(startIso);
        if(Number.isNaN(v.getTime()))return;
        v.setDate(v.getDate()+Number(term.value));
        window.SYKA_UTILS.setDateTimeField(endPrefix,v.toISOString(),form);
        const endField=form.querySelector(`[data-datetime-picker="${endPrefix}"]`);
        if(endField){
          const endDt=window.SYKA_UTILS.dateTimeParts(v.toISOString());
          const pad=n=>String(n).padStart(2,'0');
          endField.querySelector('[data-datetime-manual]')?.setAttribute('value',`${pad(endDt.day)}/${pad(endDt.month)}/${endDt.year}`);
          if(endField.querySelector('[data-datetime-manual]')) endField.querySelector('[data-datetime-manual]').value=`${pad(endDt.day)}/${pad(endDt.month)}/${endDt.year}`;
          if(endField.querySelector('[data-datetime-time-text]')) endField.querySelector('[data-datetime-time-text]').textContent=`${pad(endDt.hour)}:${pad(endDt.minute)}`;
        }
      };
      term.addEventListener('change',sync);
      form.querySelector(`[data-dt-value="${endPrefix}"]`);
      form.addEventListener('submit',async e=>{
        e.preventDefault();
        const plan=form.querySelector('[data-plan]').value;
        const reason=form.querySelector('[data-reason]').value.trim();
        if(!plan||!reason){window.SYKA_TOAST.show('Paket dan alasan wajib diisi.','warning');return;}
        const btn=form.querySelector('button[type="submit"]');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Menyimpan…';
        try{
          await svc().privilegedAssignOrganizerPlan(form.dataset.org,plan,window.SYKA_UTILS.readDateTimeField(startPrefix,form),window.SYKA_UTILS.readDateTimeField(endPrefix,form),reason);
          window.SYKA_TOAST.show('Paket penyelenggara diperbarui.','success');
          window.SYKA_ROUTER.refresh();
        }catch(error){
          btn.disabled=false;btn.textContent='Simpan perubahan paket';
          window.SYKA_TOAST.show(error.message||'Perubahan paket gagal.','error');
        }
      });
    });
  }

  async function audit(root){
    const rows = await svc().listAudit({limit:200});
    root.innerHTML = `
      <div class="toolbar">
        <div>
          <span class="eyebrow">SYSTEM AUDIT</span>
          <h2>Audit Log</h2>
          <p>Riwayat mutation privileged dan aktivitas administratif.</p>
        </div>
        <div class="filter-line">
          <input class="control-search" id="audit-search" placeholder="Cari action, entity, atau ID…">
        </div>
      </div>
      <section class="panel-card">
        <div class="audit-list" id="audit-list">
          ${
            rows.length
              ? rows.map(item => `
                <div class="audit-row">
                  <div class="audit-row-icon">↗</div>
                  <div class="audit-row-main">
                    <strong>${esc(item.action || 'unknown.action')}</strong>
                    <small>
                      ${esc(item.entity_type || '—')}
                      ${item.entity_id ? ` · ${esc(item.entity_id)}` : ''}
                    </small>
                    ${item.reason ? `<p>${esc(item.reason)}</p>` : ''}
                  </div>
                  <time>${fmt(item.created_at)}</time>
                </div>
              `).join('')
              : window.SYKA_EMPTY.render({
                  title:'Audit masih kosong',
                  text:'Belum ada aktivitas administratif yang tercatat.'
                })
          }
        </div>
      </section>
    `;
    document.getElementById('audit-search')?.addEventListener('input', e => {
      const q = String(e.target.value || '').trim().toLowerCase();
      root.querySelectorAll('.audit-row').forEach(row => {
        row.style.display = !q || row.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
  async function renderTab(root,tab){const map={dashboard,users,competitions,questions,twibbon,results,certificates,orders,moderation,plans,monetization,organizer_settings:organizerSettings,settings,audit};return map[tab]?.(root);}
  async function dashboard(root){
    const results=await Promise.allSettled([
      svc().platformStats(),
      svc().listCompetitionsAdmin({limit:50}),
      svc().listUsers({limit:50}),
      svc().listAudit({limit:8}),
      svc().listSlides({admin:true})
    ]);
    const stats=results[0].status==='fulfilled'?(results[0].value||{}):{};
    const comps=results[1].status==='fulfilled'?results[1].value:[];
    const users=results[2].status==='fulfilled'?results[2].value:[];
    const audit=results[3].status==='fulfilled'?results[3].value:[];
    const slides=results[4].status==='fulfilled'?results[4].value:[];
    const failed=results.filter(x=>x.status==='rejected').length;
    root.innerHTML=`<div class="kpi-grid"><div class="kpi-card"><span>Siswa</span><strong>${fn(stats.total_students)}</strong><small>akun aktif</small></div><div class="kpi-card"><span>Sekolah</span><strong>${fn(stats.total_schools)}</strong><small>institusi terdaftar</small></div><div class="kpi-card"><span>Penerima prestasi</span><strong>${fn(stats.total_award_recipients)}</strong><small>awards publik</small></div><div class="kpi-card"><span>Juara</span><strong>${fn(stats.total_champions)}</strong><small>peraih posisi 1</small></div></div>${failed?`<div class="inline-warning admin-soft-error"><strong>${failed} modul dashboard tidak merespons.</strong><span>Data yang tersedia tetap ditampilkan. Coba lagi dari modul terkait.</span></div>`:''}<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">PLATFORM</span><h2>Ringkasan operasional</h2></div><span class="live-dot">LIVE</span></div><div class="metric-grid"><div><b>${comps.length}</b><span>Kompetisi teratas</span></div><div><b>${users.length}</b><span>Pengguna teratas</span></div><div><b>${slides.length}</b><span>Promo slide</span></div><div><b>${audit.length}</b><span>Audit terbaru</span></div></div></section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">AUDIT</span><h2>Aktivitas terakhir</h2></div></div>${audit.length?audit.map(a=>`<div class="activity-row"><div class="activity-icon">↗</div><div><strong>${esc(a.action)}</strong><small>${esc(a.entity_type)} · ${esc(a.entity_id||'')}</small></div><time>${fmt(a.created_at)}</time></div>`).join(''):window.SYKA_EMPTY.render({title:'Audit masih kosong',text:'Mutation privileged akan muncul di sini.'})}</section></div><section class="panel-card admin-section"><div class="panel-head"><div><span class="eyebrow">HOME PROMO</span><h2>Hero slides</h2></div><button class="btn btn-primary btn-sm" id="quick-slide">+ Tambah slide</button></div><div class="mini-list">${slides.slice(0,5).map(s=>`<div class="mini-list-row"><div class="media-thumb">${s.image_url?`<img src="${esc(s.image_url)}" alt="">`:'✦'}</div><div><strong>${esc(s.title)}</strong><small>${esc(s.subtitle||'—')}</small></div><span class="status-pill ${s.is_active?'status-success':'status-neutral'}">${s.is_active?'Aktif':'Draft'}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada slide',text:'Tambahkan banner promosi dari menu.'})}</div></section>`;
    document.getElementById('quick-slide')?.addEventListener('click',()=>slideModal());
  }
  async function users(root){
    const rows=await svc().listUsers({limit:250});
    root.innerHTML=`<div class="toolbar"><div><span class="eyebrow">DIRECTORY</span><h2>Pengguna</h2><p>${rows.length} akun ditemukan. Detail dibuka hanya saat Admin memilihnya.</p></div><input class="control-search" id="user-search" placeholder="Cari nama, username, sekolah…"></div><div class="data-table admin-user-table" id="user-table">${rows.map(u=>`<div class="data-row admin-user-row"><div class="row-main"><div class="avatar-mini">${u.avatar_url?`<img src="${esc(u.avatar_url)}" alt="">`:esc(window.SYKA_UTILS.initials(u.full_name))}</div><div><div class="row-title"><strong>${esc(u.full_name||u.username||'Tanpa nama')}</strong><span class="status-pill ${window.SYKA_UTILS.statusClass(u.status)}">${esc(u.status)}</span></div><small>@${esc(u.username||'—')} · ${esc(u.institution||'—')} · ${esc(u.grade||'—')}</small><div class="chip-row">${(u.roles||[]).map(r=>`<span class="chip">${esc(r.role)}</span>`).join('')}</div></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-user-detail="${u.id}">Detail</button><button class="btn btn-secondary btn-sm" data-user-role="${u.id}">Role</button><button class="btn ${u.status==='ACTIVE'?'btn-danger-outline':'btn-primary'} btn-sm" data-user-status="${u.id}" data-status="${u.status==='ACTIVE'?'SUSPENDED':'ACTIVE'}">${u.status==='ACTIVE'?'Suspend':'Aktifkan'}</button></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada pengguna',text:'Akun baru akan muncul di sini setelah registrasi.'})}</div>`;
    document.getElementById('user-search').oninput=e=>{const q=e.target.value.toLowerCase();root.querySelectorAll('.admin-user-row').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'flex':'none');};
    root.querySelectorAll('[data-user-detail]').forEach(b=>b.onclick=()=>userDetailModal(rows.find(u=>u.id===b.dataset.userDetail)));
    root.querySelectorAll('[data-user-role]').forEach(b=>b.onclick=()=>roleModal(b.dataset.userRole));
    root.querySelectorAll('[data-user-status]').forEach(b=>b.onclick=async()=>{try{await svc().setUserStatus(b.dataset.userStatus,b.dataset.status,'Perubahan admin');window.SYKA_TOAST.show('Status pengguna diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});
  }
  function userDetailModal(u){
    if(!u)return;
    window.SYKA_MODAL.open({title:'Detail pengguna',wide:true,html:`<div class="admin-user-detail-v47"><div class="admin-user-detail-head"><div class="avatar-xl-v47">${u.avatar_url?`<img src="${esc(u.avatar_url)}" alt="">`:esc(window.SYKA_UTILS.initials(u.full_name))}</div><div><span class="eyebrow">ACCOUNT</span><h2>${esc(u.full_name||u.username||'Tanpa nama')}</h2><p>@${esc(u.username||'—')} · ${esc(u.status||'UNKNOWN')}</p></div></div><div class="detail-list-v47"><div><span>Email</span><strong>${esc(u.email||'—')}</strong></div><div><span>Sekolah / institusi</span><strong>${esc(u.institution||'—')}</strong></div><div><span>Kelas / grade</span><strong>${esc(u.grade||'—')}</strong></div><div><span>Role</span><strong>${(u.roles||[]).map(r=>esc(r.role)).join(' · ')||'—'}</strong></div></div></div>`});
  }
  function roleModal(userId){window.SYKA_MODAL.open({title:'Kelola role pengguna',html:`<form id="role-form" class="form-card"><label>Role<select id="role"><option value="student">Pelajar</option><option value="teacher">Guru</option><option value="organizer_member">Penyelenggara</option><option value="admin">Admin</option></select></label><label class="checkline"><input id="active" type="checkbox" checked> Role aktif</label><label>Alasan<textarea id="reason" rows="3" placeholder="Alasan perubahan role"></textarea></label><button class="btn btn-primary">Simpan</button><div id="role-feedback"></div></form>`,onOpen:body=>body.querySelector('#role-form').onsubmit=async e=>{e.preventDefault();try{await svc().setUserRole(userId,body.querySelector('#role').value,body.querySelector('#active').checked,body.querySelector('#reason').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Role diperbarui.','success');window.SYKA_ROUTER.refresh();}catch(error){body.querySelector('#role-feedback').innerHTML=`<div class="inline-error">${esc(error.message)}</div>`;}}});}
  async function competitions(root){const rows=await svc().listCompetitionsAdmin({limit:250});root.innerHTML=`<div class="toolbar"><div><h2>Kompetisi</h2><p>CRUD dan state machine server-authoritative.</p></div><button class="btn btn-primary" id="new-comp">+ Kompetisi</button></div><div class="filter-line"><input class="control-search" id="comp-search" placeholder="Cari kompetisi…"><select class="compact-select" id="comp-status"><option value="">Semua status</option>${['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED','SUSPENDED','CANCELLED'].map(s=>`<option>${s}</option>`).join('')}</select></div><div class="data-table" id="comp-table">${rows.map(c=>competitionRow(c)).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama untuk mulai menggunakan control plane.'})}</div>`;document.getElementById('new-comp').onclick=()=>competitionModal();const filter=()=>{const q=document.getElementById('comp-search').value.toLowerCase();const s=document.getElementById('comp-status').value;root.querySelectorAll('.data-row[data-comp-row]').forEach(r=>r.style.display=(!q||r.innerText.toLowerCase().includes(q))&&(!s||r.dataset.status===s)?'flex':'none');};document.getElementById('comp-search').oninput=filter;document.getElementById('comp-status').onchange=filter;bindCompetitionRows(root,rows);}
  function competitionRow(c){const poster=window.SYKA_UTILS.cloudinaryTransform(c.poster_url,{width:120,height:80,crop:'fill'});return `<div class="data-row competition-admin-row" data-comp-row data-status="${esc(c.status)}"><div class="row-main"><div class="media-thumb">${poster?`<img src="${esc(poster)}" alt="" loading="lazy">`:'✦'}</div><div><div class="row-title"><strong>${esc(c.title)}</strong><span class="status-pill ${window.SYKA_UTILS.statusClass(c.status)}">${esc(c.status)}</span></div><small>${esc(c.category||'Kompetisi')} · ${esc(c.slug||'')} · ${esc(c.visibility||'PUBLIC')}</small><div class="chip-row"><span class="chip">Registrasi ${fmt(c.registration_starts_at)} → ${fmt(c.registration_ends_at)}</span><span class="chip">Mulai ${fmt(c.starts_at)}</span></div></div></div><div class="row-actions"><button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button><button class="btn btn-secondary btn-sm" data-config="${c.id}">Config</button><button class="btn btn-primary btn-sm" data-transition="${c.id}">Transisi</button></div></div>`;}
  function bindCompetitionRows(root,rows){root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>competitionModal(rows.find(x=>x.id===b.dataset.edit)));root.querySelectorAll('[data-config]').forEach(b=>b.onclick=()=>competitionConfigModal(rows.find(x=>x.id===b.dataset.config)));root.querySelectorAll('[data-transition]').forEach(b=>b.onclick=()=>transitionModal(rows.find(x=>x.id===b.dataset.transition)));}
  function dateField(id,label,value,required=false){
    return window.SYKA_UTILS.dateTimePickerMarkup(id,value,{title:label,required,help:'Pilih tanggal dan waktu lokal.'});
  }

  async function competitionModal(current=null){
    const organizers=await svc().listOrganizers().catch(()=>[]); const p=current||{};
    window.SYKA_MODAL.open({title:current?'Edit kompetisi':'Buat kompetisi baru',wide:true,html:`<form id="comp-form" class="form-card"><div class="form-section-title"><div><span class="eyebrow">BASIC INFO</span><h2>${current?'Edit':'Buat'} kompetisi</h2></div><span class="form-required">* wajib</span></div><div class="form-grid-2"><label>Judul *<input id="title" required value="${esc(p.title||'')}"></label><label>Slug *<input id="slug" required value="${esc(p.slug||'')}"><small class="field-help">Contoh: olimpiade-sains-2026</small></label></div><div class="form-grid-2"><label>Kategori<select id="category"><option ${p.category==='Kompetisi'||!p.category?'selected':''}>Kompetisi</option><option ${p.category==='Olimpiade'?'selected':''}>Olimpiade</option><option ${p.category==='Tryout'?'selected':''}>Tryout</option><option ${p.category==='Lomba Kreatif'?'selected':''}>Lomba Kreatif</option><option ${p.category==='Uji Kompetensi'?'selected':''}>Uji Kompetensi</option></select></label><label>Visibility<select id="visibility"><option ${p.visibility==='PUBLIC'||!p.visibility?'selected':''}>PUBLIC</option><option ${p.visibility==='UNLISTED'?'selected':''}>UNLISTED</option><option ${p.visibility==='PRIVATE'?'selected':''}>PRIVATE</option></select></label></div><label>Deskripsi singkat<textarea id="short" rows="4" placeholder="Jelaskan kompetisi dengan ringkas…">${esc(p.short_description||'')}</textarea></label><div class="upload-field-card"><div><span class="eyebrow">POSTER KOMPETISI</span><h3>Upload poster</h3><p>Gambar langsung ke Cloudinary. Rasio ideal 16:9.</p></div><div class="upload-preview" id="admin-poster-preview">${p.poster_url?`<img src="${esc(p.poster_url)}" alt="Poster"><div class="upload-file-meta"><strong>Poster tersimpan</strong></div>`:'<div class="upload-placeholder"><span>↑</span><strong>Belum ada poster</strong><small>PNG, JPG, WEBP • maksimal 10 MB</small></div>'}</div><button type="button" class="btn btn-secondary" id="admin-poster-upload">${p.poster_url?'Ganti poster':'Upload poster'}</button><input type="hidden" id="poster" value="${esc(p.poster_url||'')}"><input type="hidden" id="poster-public-id" value="${esc(p.poster_public_id||'')}"><input type="hidden" id="poster-width" value="${p.poster_width||''}"><input type="hidden" id="poster-height" value="${p.poster_height||''}"><input type="hidden" id="poster-version" value="${esc(p.poster_version||'')}"><input type="hidden" id="poster-resource" value="${esc(p.poster_resource_type||'')}"></div>${!current?`<label>Organizer *<select id="organizer_id" required>${organizers.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label>`:''}<div class="form-section-title compact"><div><span class="eyebrow">TIMELINE</span><h2>Tanggal & jam</h2><p>Pilih tanggal dan jam lokal dengan kontrol yang mudah dibaca.</p></div></div><div class="form-grid-2">${dateField('registration_start','Pendaftaran mulai',p.registration_starts_at,true)}${dateField('registration_end','Pendaftaran berakhir',p.registration_ends_at,true)}</div><div class="form-grid-2">${dateField('start_at','Kompetisi mulai',p.starts_at,true)}${dateField('end_at','Kompetisi berakhir',p.ends_at,true)}</div>${dateField('announcement_at','Pengumuman hasil',p.announcement_at,false)}<div id="comp-feedback"></div><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">${current?'Simpan perubahan':'Buat kompetisi'}</button></div></form>`,onOpen:body=>{
      window.SYKA_UTILS.bindDateTimePickers(body);
      body.querySelector('#admin-poster-upload').onclick=async()=>{try{const info=await window.SYKA_CLOUDINARY.openCompetitionImageWidget();if(!info?.secure_url)throw new Error('Cloudinary tidak mengembalikan file poster.');body.querySelector('#poster').value=info.secure_url||'';body.querySelector('#poster-public-id').value=info.public_id||'';body.querySelector('#poster-width').value=info.width||'';body.querySelector('#poster-height').value=info.height||'';body.querySelector('#poster-version').value=info.version||'';body.querySelector('#poster-resource').value=info.resource_type||'image';body.querySelector('#admin-poster-preview').innerHTML=`<img src="${esc(info.secure_url)}" alt="Poster"><div class="upload-file-meta"><strong>${esc(info.original_filename||'Poster kompetisi')}</strong></div>`;body.querySelector('#admin-poster-upload').textContent='Ganti poster';}catch(e){window.SYKA_TOAST.show(e.message||'Upload gagal.','error');}};
      body.querySelector('#comp-form').onsubmit=async e=>{e.preventDefault();const feedback=body.querySelector('#comp-feedback');const payload={title:body.querySelector('#title').value.trim(),slug:body.querySelector('#slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,''),category:body.querySelector('#category').value.trim()||'Kompetisi',short_description:body.querySelector('#short').value.trim()||null,visibility:body.querySelector('#visibility').value,poster_url:body.querySelector('#poster').value.trim()||null,poster_public_id:body.querySelector('#poster-public-id').value.trim()||null,poster_width:Number(body.querySelector('#poster-width').value)||null,poster_height:Number(body.querySelector('#poster-height').value)||null,poster_version:body.querySelector('#poster-version').value.trim()||null,poster_resource_type:body.querySelector('#poster-resource').value.trim()||'image',registration_starts_at:window.SYKA_UTILS.readDateTimeField('registration_start', body),registration_ends_at:window.SYKA_UTILS.readDateTimeField('registration_end', body),starts_at:window.SYKA_UTILS.readDateTimeField('start_at', body),ends_at:window.SYKA_UTILS.readDateTimeField('end_at', body),announcement_at:window.SYKA_UTILS.readDateTimeField('announcement_at', body)};if(!current)payload.organizer_id=body.querySelector('#organizer_id')?.value||null;try{await svc().saveCompetition(payload,current?.id||null);window.SYKA_MODAL.close();window.SYKA_TOAST.show(current?'Kompetisi diperbarui.':'Kompetisi dibuat sebagai DRAFT.','success');window.SYKA_ROUTER.refresh();}catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Gagal menyimpan kompetisi.')}</div>`;}};
    }});
  }
  function competitionConfigModal(c){window.SYKA_MODAL.open({title:'Konfigurasi kompetisi',wide:true,html:`<div class="config-grid"><button class="config-card" id="cfg-level"><span>◫</span><strong>Jenjang & kelas</strong><small>Atur level, allowed grades, points.</small></button><button class="config-card" id="cfg-rules"><span>◌</span><strong>Aturan pendaftaran</strong><small>Twibbon, social proof, quota.</small></button><button class="config-card" id="cfg-reward"><span>✦</span><strong>Reward</strong><small>Juara, poin, emblem, sertifikat.</small></button></div>`,onOpen:body=>{body.querySelector('#cfg-level').onclick=()=>levelModal(c.id);body.querySelector('#cfg-rules').onclick=()=>rulesModal(c.id);body.querySelector('#cfg-reward').onclick=()=>rewardModal(c.id);}});}
  async function levelModal(compId){const rows=await svc().listLevels(compId);window.SYKA_MODAL.open({title:'Jenjang kompetisi',wide:true,html:`<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-level">+ Level</button></div><div class="stack-list">${rows.map(r=>`<div class="list-card"><strong>${esc(r.label)}</strong><small>${esc(r.code)} · ${esc((r.allowed_grades||[]).join(', '))}</small><span>${r.points} pts</span></div>`).join('')||'<div class="empty-inline">Belum ada level.</div>'}</div>`,onOpen:body=>body.querySelector('#new-level').onclick=()=>{window.SYKA_MODAL.open({title:'Tambah level',html:`<form id="lf" class="form-card"><label>Kode<input id="code" required placeholder="SD6"></label><label>Label<input id="label" required placeholder="Kelas 6 SD"></label><label>Allowed grades<textarea id="grades">SD6</textarea></label><label>Points<input id="points" type="number" value="0"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#lf').onsubmit=async e=>{e.preventDefault();try{await svc().saveLevel({competition_id:compId,code:b.querySelector('#code').value.trim(),label:b.querySelector('#label').value.trim(),allowed_grades:b.querySelector('#grades').value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean),points:Number(b.querySelector('#points').value||0),config:{} });window.SYKA_MODAL.close();window.SYKA_TOAST.show('Level tersimpan.','success');levelModal(compId);}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}});}
  async function rulesModal(compId){const r=await svc().getRegistrationRules(compId)||{};window.SYKA_MODAL.open({title:'Aturan pendaftaran',wide:false,html:`<form id="rf" class="form-card"><label>Allowed grades<textarea id="grades">${esc((r.allowed_grades||[]).join('\n'))}</textarea></label><label class="checkline"><input id="twibbon" type="checkbox" ${r.require_twibbon?'checked':''}> Wajib twibbon</label><label class="checkline"><input id="social" type="checkbox" ${r.require_social_proof?'checked':''}> Wajib social proof</label><label>Maximum peserta<input id="max" type="number" min="1" value="${r.max_participants||''}"></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#rf').onsubmit=async e=>{e.preventDefault();try{await svc().saveRegistrationRules({allowed_grades:b.querySelector('#grades').value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean),require_twibbon:b.querySelector('#twibbon').checked,require_social_proof:b.querySelector('#social').checked,max_participants:b.querySelector('#max').value?Number(b.querySelector('#max').value):null,config:{}},compId);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Aturan tersimpan.','success');}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function rewardModal(compId){
    const rows=await svc().listRewards(compId);
    const listHtml=rows.length?rows.map(r=>`<div class="list-card"><strong>${esc(r.rank_code)}</strong><small>${esc(r.title||'Reward')}</small><span>${r.points} pts</span></div>`).join(''):'<div class="empty-inline">Belum ada reward.</div>';
    window.SYKA_MODAL.open({
      title:'Reward kompetisi',
      wide:true,
      html:`<div class="modal-toolbar"><button class="btn btn-primary btn-sm" id="new-reward">+ Reward</button></div><div class="stack-list">${listHtml}</div>`,
      onOpen:body=>{
        body.querySelector('#new-reward').onclick=()=>{
          window.SYKA_MODAL.open({
            title:'Tambah reward',
            html:`<form id="rewf" class="form-card"><label>Rank code<input id="rank" required placeholder="1ST"></label><label>Title<input id="title" required placeholder="Juara 1"></label><label>Points<input id="points" type="number" value="0"></label><label>Emblem name<input id="emblem"></label><label class="checkline"><input id="cert" type="checkbox" checked> Certificate</label><button class="btn btn-primary">Simpan</button></form>`,
            onOpen:b=>{
              b.querySelector('#rewf').onsubmit=async e=>{
                e.preventDefault();
                try{
                  await svc().saveReward({
                    competition_id:compId,
                    rank_code:b.querySelector('#rank').value.trim(),
                    title:b.querySelector('#title').value.trim(),
                    points:Number(b.querySelector('#points').value||0),
                    emblem_name:b.querySelector('#emblem').value.trim()||null,
                    certificate_enabled:b.querySelector('#cert').checked,
                    config:{}
                  });
                  window.SYKA_MODAL.close();
                  window.SYKA_TOAST.show('Reward tersimpan.','success');
                  rewardModal(compId);
                }catch(error){
                  b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);
                }
              };
            }
          });
        };
      }
    });
  }
  async function questions(root){const banks=await svc().listQuestionBanks();root.innerHTML=`<div class="toolbar"><div><h2>Question Builder</h2><p>Bank soal, moderation, answer key—tetap dibatasi RLS.</p></div><button class="btn btn-primary" id="new-bank">+ Bank soal</button></div><div class="data-table">${banks.map(b=>`<div class="data-row"><div><strong>${esc(b.name)}</strong><small>${esc(b.description||'—')}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(b.status||'DRAFT')}">${esc(b.status||'DRAFT')}</span></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada bank soal',text:'Buat bank soal untuk mulai menyusun question set.'})}</div>`;document.getElementById('new-bank').onclick=()=>window.SYKA_MODAL.open({title:'Bank soal baru',html:`<form id="bf" class="form-card"><label>Nama bank soal<input id="name" required></label><label>Deskripsi<textarea id="desc"></textarea></label><label>Status<select id="status"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button class="btn btn-primary">Simpan</button></form>`,onOpen:b=>b.querySelector('#bf').onsubmit=async e=>{e.preventDefault();try{await svc().saveQuestionBank({name:b.querySelector('#name').value.trim(),description:b.querySelector('#desc').value.trim()||null,status:b.querySelector('#status').value,config:{}});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Bank soal dibuat.','success');window.SYKA_ROUTER.refresh();}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message)}</div>`);}}});}
  async function twibbon(root){const rows=await svc().listTwibbonTemplates();root.innerHTML=`<div class="toolbar"><div><h2>Twibbon</h2><p>Template promosi yang dipakai kompetisi.</p></div><button class="btn btn-primary" id="new-tw">+ Template</button></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.name)}</strong><small>${esc(r.competition_id||'Global')} · ${r.image_url?'Asset tersedia':'Belum ada asset'}</small></div><div class="chip-row"><span class="chip">${r.is_required?'Wajib':'Opsional'}</span><span class="chip">${r.is_active?'Aktif':'Nonaktif'}</span></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada template',text:'Tambahkan template twibbon dari sini.'})}</div>`;document.getElementById('new-tw').onclick=()=>slideOrTwibbonModal();}
  function slideOrTwibbonModal(){
    window.SYKA_MODAL.open({
      title:'Twibbon template',
      wide:true,
      html:`<form id="twf" class="form-card">
        <div class="form-grid-2">
          <label>Organizer ID<input id="oid" placeholder="Pilih dari workspace jika perlu"></label>
          <label>Competition ID<input id="cid" placeholder="UUID competition"></label>
        </div>
        <label>Nama template<input id="name" required></label>
        <div class="upload-field-card">
          <div><span class="eyebrow">TWIBBON</span><h3>Upload template</h3><p>Gambar langsung ke Cloudinary. Tidak ada input URL.</p></div>
          <div class="upload-preview" id="tw-preview"><div class="upload-placeholder"><span>↑</span><strong>Belum ada template</strong><small>PNG, JPG, WEBP • maksimal 10 MB</small></div></div>
          <div class="upload-actions"><button type="button" class="btn btn-secondary" id="tw-upload">Pilih gambar</button></div>
          <input type="hidden" id="url"><input type="hidden" id="pid"><input type="hidden" id="width"><input type="hidden" id="height"><input type="hidden" id="version"><input type="hidden" id="resource">
        </div>
        <label class="checkline"><input id="req" type="checkbox"> Wajib digunakan</label>
        <div id="tw-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan template</button></div>
      </form>`,
      onOpen:b=>{
        let tw=null;
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#tw-upload').onclick=async()=>{
          try{
            tw=await window.SYKA_CLOUDINARY.openTwibbonWidget();
            b.querySelector('#url').value=tw.secure_url||'';
            b.querySelector('#pid').value=tw.public_id||'';
            b.querySelector('#width').value=tw.width||'';
            b.querySelector('#height').value=tw.height||'';
            b.querySelector('#version').value=tw.version||'';
            b.querySelector('#resource').value=tw.resource_type||'image';
            b.querySelector('#tw-preview').innerHTML=`<img src="${esc(tw.secure_url)}" alt="Twibbon"><div class="upload-file-meta"><strong>${esc(tw.original_filename||'Twibbon')}</strong><small>Cloudinary • asset tersimpan</small></div>`;
            b.querySelector('#tw-upload').textContent='Ganti gambar';
          }catch(e){window.SYKA_TOAST.show(e.message||'Upload gagal.','error');}
        };
        b.querySelector('#twf').onsubmit=async e=>{
          e.preventDefault();
          const feedback=b.querySelector('#tw-feedback');
          try{
            const url=b.querySelector('#url').value.trim();
            if(!url){feedback.innerHTML='<div class="inline-error">Upload template terlebih dahulu.</div>';return;}
            await svc().saveTwibbonTemplate({
              organizer_id:b.querySelector('#oid').value.trim()||null,
              competition_id:b.querySelector('#cid').value.trim()||null,
              name:b.querySelector('#name').value.trim(),
              image_url:url,
              public_id:b.querySelector('#pid').value.trim()||null,
              is_required:b.querySelector('#req').checked,
              is_active:true,
              config:{width:Number(b.querySelector('#width').value)||null,height:Number(b.querySelector('#height').value)||null,version:b.querySelector('#version').value||null,resource_type:b.querySelector('#resource').value||'image'}
            });
            window.SYKA_MODAL.close();
            window.SYKA_TOAST.show('Template twibbon tersimpan.','success');
            window.SYKA_ROUTER.refresh();
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Template gagal disimpan.')}</div>`;}
        };
      }
    });
  }

  async function results(root){const rows=await svc().listAttempts({status:'FINALIZED'});root.innerHTML=`<div class="toolbar"><div><h2>Hasil</h2><p>Attempt final siap ditinjau dan dipakai untuk award event.</p></div></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||r.participant_id)}</strong><small>${esc(r.competitions?.title||'')} · ${fmt(r.finalized_at)}</small></div><strong>${Number(r.score||0).toLocaleString('id-ID')} pts</strong></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada hasil final',text:'Finalized attempts akan muncul di sini.'})}</div>`;}
  async function certificates(root){const rows=await svc().listCertificates();root.innerHTML=`<div class="toolbar"><div><h2>Sertifikat</h2><p>Lifecycle: Generated → Review → Approved → Published → Revoked.</p></div></div><div class="data-table">${rows.map(r=>`<div class="data-row"><div><strong>${esc(r.user_id)}</strong><small>${esc(r.competition_id||'')} · revisi ${r.current_revision}</small></div><div class="row-actions">${['GENERATED','REVIEW','APPROVED','PUBLISHED','REVOKED'].map(s=>`<button class="btn btn-ghost btn-xs" data-cert="${r.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada sertifikat',text:'Sertifikat akan muncul setelah award/hasil diproses.'})}</div>`;root.querySelectorAll('[data-cert]').forEach(b=>b.onclick=async()=>{try{await svc().updateCertificate(b.dataset.cert,b.dataset.status);window.SYKA_TOAST.show('Status sertifikat diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  async function orders(root){
    const rows=await svc().listOrders({limit:200});
    root.innerHTML=`<div class="toolbar"><div><span class="eyebrow">COMMERCE REVIEW</span><h2>Pesanan</h2><p>Review pembayaran manual, bukti transfer, dan aktivasi benefit.</p></div><div class="filter-line"><select class="compact-select" id="order-filter"><option value="">Semua</option><option>PENDING_PAYMENT</option><option>PAID</option><option>PROCESSING</option><option>CANCELLED</option></select></div></div><div class="orders-admin-grid" id="admin-orders">${rows.map(o=>`<article class="order-admin-card" data-order-status="${esc(o.status||'DRAFT')}"><div class="order-card-head"><div><span class="eyebrow">ORDER</span><h3>#${esc(String(o.id).slice(0,10))}</h3><small>${fmt(o.created_at)}</small></div><span class="status-pill ${window.SYKA_UTILS.statusClass(o.status)}">${esc(o.status||'DRAFT')}</span></div><div class="order-summary-grid"><div><span>User</span><strong>${esc(String(o.user_id).slice(0,12))}</strong></div><div><span>Total</span><strong>Rp ${Number(o.total||0).toLocaleString('id-ID')}</strong></div><div><span>WhatsApp</span><strong>${esc(o.contact_whatsapp||'—')}</strong></div></div>${o.payment_proof_url?`<div class="order-proof order-proof-admin"><img src="${esc(window.SYKA_UTILS.cloudinaryTransform(o.payment_proof_url,{width:360,height:240,crop:'fit'}))}" alt="Bukti transfer" loading="lazy"><div><strong>Bukti transfer tersedia</strong><small>${esc(o.payment_proof_status||'SUBMITTED')}</small></div></div>`:'<div class="order-proof-empty">Tidak ada bukti transfer.</div>'}<div class="order-admin-actions">${o.status==='PENDING_PAYMENT'?`<button class="btn btn-primary btn-sm" data-order-approve="${o.id}">Setujui</button><button class="btn btn-danger btn-sm" data-order-reject="${o.id}">Tolak</button>`:''}<button class="btn btn-ghost btn-sm" data-order-detail="${o.id}">Detail</button></div></article>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada order',text:'Order dari Toko dan paket penyelenggara akan muncul setelah user mengirim pembayaran.'})}</div>`;
    const filter=document.getElementById('order-filter');filter.onchange=()=>root.querySelectorAll('[data-order-status]').forEach(r=>r.style.display=!filter.value||r.dataset.orderStatus===filter.value?'grid':'none');
    root.querySelectorAll('[data-order-approve]').forEach(b=>b.onclick=()=>reviewOrder(b.dataset.orderApprove,'APPROVE'));
    root.querySelectorAll('[data-order-reject]').forEach(b=>b.onclick=()=>reviewOrder(b.dataset.orderReject,'REJECT'));
  }
  function reviewOrder(id,decision){window.SYKA_MODAL.open({title:decision==='APPROVE'?'Setujui pembayaran':'Tolak pembayaran',html:`<form id="review-order" class="form-card"><p>${decision==='APPROVE'?'Order akan menjadi PAID. Jika ini pembelian paket, plan organizer akan otomatis aktif.':'Order akan ditandai CANCELLED dan bukti pembayaran ditolak.'}</p><label>Catatan admin<textarea id="reason" rows="3" placeholder="Catatan untuk audit…"></textarea></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn ${decision==='APPROVE'?'btn-primary':'btn-danger'}">${decision==='APPROVE'?'Setujui':'Tolak'}</button></div><div id="review-feedback"></div></form>`,onOpen:b=>b.querySelector('#review-order').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_SUPABASE.get().rpc('admin_review_manual_order',{p_order_id:id,p_decision:decision,p_reason:b.querySelector('#reason').value.trim()||null});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Review order tersimpan.','success');window.SYKA_ROUTER.refresh();}catch(error){b.querySelector('#review-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Review gagal.')}</div>`;}}});}
  async function moderation(root){const m=await svc().listModeration();root.innerHTML=`<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">POSTS</span><h2>Moderasi posting</h2></div></div>${m.posts.map(p=>`<div class="data-row compact"><div><strong>${esc(p.title||'Untitled')}</strong><small>${fmt(p.created_at)}</small></div><select class="compact-select" data-post="${p.id}">${['PUBLISHED','HIDDEN','ARCHIVED'].map(s=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p class="muted">Tidak ada post.</p>'}</section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">COMMENTS</span><h2>Moderasi komentar</h2></div></div>${m.comments.map(c=>`<div class="data-row compact"><div><strong>${esc(c.body).slice(0,90)}</strong><small>${fmt(c.created_at)}</small></div><select class="compact-select" data-comment="${c.id}">${['PUBLISHED','HIDDEN','QUARANTINED'].map(s=>`<option ${s===c.moderation_state?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p class="muted">Tidak ada komentar.</p>'}</section></div>`;root.querySelectorAll('[data-post]').forEach(s=>s.onchange=async()=>{try{await svc().moderatePost(s.dataset.post,s.value);window.SYKA_TOAST.show('Post dimoderasi.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-comment]').forEach(s=>s.onchange=async()=>{try{await svc().moderateComment(s.dataset.comment,s.value);window.SYKA_TOAST.show('Komentar dimoderasi.','success');}catch(error){window.SYKA_TOAST.show(error.message,'error');}});}
  const PLAN_FEATURES=[
    {key:'competition_create',label:'Buat kompetisi',help:'Jumlah kompetisi yang dapat dibuat',kind:'limit',defaultLimit:1},
    {key:'participant_limit',label:'Batas peserta',help:'Maksimum peserta per kompetisi',kind:'limit',defaultLimit:50},
    {key:'question_bank',label:'Bank soal',help:'Jumlah bank soal yang dapat dikelola',kind:'limit',defaultLimit:1},
    {key:'question_limit',label:'Batas soal',help:'Maksimum soal yang tersedia',kind:'limit',defaultLimit:100},
    {key:'manual_grading',label:'Penilaian manual',help:'Essay / file dapat dinilai manual',kind:'toggle'},
    {key:'certificate',label:'Sertifikat',help:'Generate dan publish certificate',kind:'toggle'},
    {key:'twibbon',label:'Twibbon',help:'Template dan review twibbon',kind:'toggle'},
    {key:'analytics',label:'Analytics',help:'Insight kompetisi dan peserta',kind:'toggle'},
    {key:'advanced_reports',label:'Laporan lanjutan',help:'Export dan laporan operasional lebih lengkap',kind:'toggle'},
    {key:'bulk_notification',label:'Notifikasi massal',help:'Kirim pengumuman ke banyak peserta',kind:'toggle'},
    {key:'custom_branding',label:'Branding khusus',help:'Logo, warna, dan identitas organizer',kind:'toggle'},
    {key:'priority_support',label:'Priority support',help:'Dukungan prioritas',kind:'toggle'},
    {key:'auto_registration_approval',label:'Auto approval peserta',help:'Pendaftaran peserta dapat disetujui otomatis pada kompetisi yang mengaktifkan mode AUTO.',kind:'toggle'}
  ];
  async function plans(root){
    const [catalog,ents]=await Promise.all([svc().listPlanCatalog(),svc().listEntitlements()]);
    const fallback={FREE:{name:'Free',badge:'Mulai',description:'Untuk penyelenggara yang baru mulai.',monthly_price:0,yearly_price:0,is_active:true},PREMIUM:{name:'Premium',badge:'Populer',description:'Untuk penyelenggara aktif.',monthly_price:149000,yearly_price:1490000,is_active:true},PRO:{name:'Pro',badge:'Paling lengkap',description:'Untuk organizer skala besar.',monthly_price:349000,yearly_price:3490000,is_active:true}};
    const byCode=Object.fromEntries((catalog||[]).map(p=>[p.plan_code,p]));
    const entitlementByPlan={};(ents||[]).forEach(e=>((entitlementByPlan[e.plan_code]??=[]).push(e)));
    let selected=byCode.PREMIUM?'PREMIUM':(catalog[0]?.plan_code||'FREE');
    const planCard=(code)=>{const p=byCode[code]||{plan_code:code,...fallback[code]};const count=(entitlementByPlan[code]||[]).length;return `<button type="button" class="plan-preset-card ${selected===code?'selected':''}" data-plan-preset="${code}"><div class="plan-preset-top"><span class="plan-badge ${code.toLowerCase()}">${esc(p.badge||code)}</span><span class="chip">${p.is_active?'AKTIF':'NONAKTIF'}</span></div><h3>${esc(p.name||code)}</h3><p>${esc(p.description||'')}</p><strong>${p.monthly_price?money(p.monthly_price)+'/bulan':'Gratis'}</strong><small>${count} capability aktif</small></button>`;};
    const renderEditor=()=>{const p=byCode[selected]||{plan_code:selected,...fallback[selected]};const current=Object.fromEntries((entitlementByPlan[selected]||[]).map(e=>[e.capability,e]));const cards=PLAN_FEATURES.map(f=>{const e=current[f.key];const checked=!!e;return `<label class="plan-feature-row"><span class="check-wrap"><input type="checkbox" data-cap="${f.key}" ${checked?'checked':''}></span><span class="plan-feature-copy"><strong>${esc(f.label)}</strong><small>${esc(f.help)}</small></span>${f.kind==='limit'?`<span class="plan-limit"><input type="number" min="0" step="1" data-limit="${f.key}" value="${e?.limit_value??f.defaultLimit??''}" ${checked?'':'disabled'} placeholder="∞"></span>`:`<span class="plan-enabled-dot">${checked?'ON':'OFF'}</span>`}</label>`}).join('');const editor=document.getElementById('plan-editor');editor.innerHTML=`<div class="plan-editor-head"><div><span class="eyebrow">PLAN BUILDER</span><h2>${esc(p.name||selected)}</h2><p>Pilih kemampuan dengan checkbox. Limit hanya perlu diisi pada fitur kuota.</p></div><div class="plan-editor-price"><label>Harga / bulan<input id="plan-monthly" type="number" min="0" value="${Number(p.monthly_price)||0}"></label><label>Harga / tahun<input id="plan-yearly" type="number" min="0" value="${Number(p.yearly_price)||0}"></label></div></div><div class="form-grid-2 plan-meta-grid"><label>Nama paket<input id="plan-name" value="${esc(p.name||selected)}"></label><label>Badge<input id="plan-badge" value="${esc(p.badge||'')}"></label><label class="span-2">Deskripsi<textarea id="plan-description" rows="2">${esc(p.description||'')}</textarea></label></div><div class="plan-feature-list">${cards}</div><div class="plan-editor-actions"><label class="switch-line"><input id="plan-active" type="checkbox" ${p.is_active!==false?'checked':''}><span>Plan aktif dan boleh dipakai</span></label><button class="btn btn-primary" id="save-plan-bundle">Simpan paket ${esc(selected)}</button></div>`;editor.querySelectorAll('[data-cap]').forEach(cb=>cb.onchange=()=>{const limit=editor.querySelector(`[data-limit="${cb.dataset.cap}"]`);if(limit)limit.disabled=!cb.checked;});editor.querySelector('#save-plan-bundle').onclick=async()=>{const ent=PLAN_FEATURES.flatMap(f=>{const cb=editor.querySelector(`[data-cap="${f.key}"]`);if(!cb?.checked)return[];const limitEl=editor.querySelector(`[data-limit="${f.key}"]`);return[{capability:f.key,limit_value:f.kind==='limit'?(limitEl.value===''?null:Number(limitEl.value)):1,config:{}}];});const btn=editor.querySelector('#save-plan-bundle');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Menyimpan…';try{if(!(await ensurePrivilegedAccess())){btn.disabled=false;btn.textContent=`Simpan paket ${selected}`;return;}await svc().savePlanBundle({plan_code:selected,name:editor.querySelector('#plan-name').value.trim(),badge:editor.querySelector('#plan-badge').value.trim(),description:editor.querySelector('#plan-description').value.trim(),monthly_price:editor.querySelector('#plan-monthly').value,yearly_price:editor.querySelector('#plan-yearly').value,is_active:editor.querySelector('#plan-active').checked,entitlements:ent});window.SYKA_TOAST.show(`Paket ${selected} berhasil diperbarui.`,'success');window.SYKA_ROUTER.refresh();}catch(error){window.SYKA_TOAST.show(error.message||'Paket gagal disimpan.','error');btn.disabled=false;btn.textContent=`Simpan paket ${selected}`;}};};
    root.innerHTML=`<div class="plans-page"><div class="toolbar"><div><h2>Paket Penyelenggara</h2><p>Kelola paket, harga bulanan/tahunan, capability, dan status katalog.</p></div><div class="toolbar-actions"><button class="btn btn-secondary" id="add-plan">+ Tambah paket</button></div></div><div class="plan-preset-grid">${(catalog||[]).map(p=>planCard(p.plan_code)).join('')}</div><section class="panel-card plan-builder-card" id="plan-editor"></section><section class="panel-card plan-guide"><div class="panel-head"><div><span class="eyebrow">CARA KERJA</span><h3>Capability yang mudah dipahami</h3></div></div><div class="guide-grid">${PLAN_FEATURES.map(f=>`<div><strong>${esc(f.label)}</strong><small>${esc(f.help)}</small></div>`).join('')}</div></section></div>`;
    root.querySelectorAll('[data-plan-preset]').forEach(b=>b.onclick=()=>{selected=b.dataset.planPreset;root.querySelectorAll('[data-plan-preset]').forEach(x=>x.classList.toggle('selected',x===b));renderEditor();});
    renderEditor();


    const packageManagement=document.createElement('section');
    packageManagement.className='panel-card plan-admin-actions';
    packageManagement.innerHTML=`<div class="panel-head"><div><span class="eyebrow">CATALOG MANAGEMENT</span><h3>Tambah / nonaktifkan paket</h3><p>Paket dinonaktifkan secara aman agar histori subscription dan order tetap utuh.</p></div></div><div class="package-management-list">${(catalog||[]).map(p=>{const code=p.plan_code;return `<div class="data-row"><div><strong>${esc(p.name||code)}</strong><small>${esc(code)} · ${p.is_active?'AKTIF':'NONAKTIF'} · ${money(p.monthly_price)}/bulan · ${money(p.yearly_price)}/tahun</small></div><button class="btn ${p.is_active?'btn-danger-outline':'btn-secondary'} btn-sm" data-package-toggle="${esc(code)}">${p.is_active?'Nonaktifkan':'Sudah nonaktif'}</button></div>`}).join('')}</div>`;
    root.querySelector('.plans-page').appendChild(packageManagement);
    root.querySelector('#add-plan')?.addEventListener('click',async()=>{
      if(!(await ensurePrivilegedAccess()))return;
      planCreateModal();
    });
    root.querySelectorAll('[data-package-toggle]').forEach(btn=>btn.addEventListener('click',async()=>{
      const code=btn.dataset.packageToggle;
      if(btn.textContent.includes('Sudah'))return;
      if(!(await ensurePrivilegedAccess()))return;
      window.SYKA_MODAL.open({
        title:`Nonaktifkan paket ${code}`,
        html:`<form id="deactivate-plan" class="form-card"><p>Paket ini tidak akan tersedia untuk pembelian baru. Subscription aktif yang sudah ada tetap mengikuti masa berlakunya.</p><label>Alasan wajib<textarea id="reason" rows="3" required></textarea></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger">Nonaktifkan paket</button></div><div id="deactivate-feedback"></div></form>`,
        onOpen:b=>{
          b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
          b.querySelector('#deactivate-plan').onsubmit=async e=>{
            e.preventDefault();
            try{
              const reason=b.querySelector('#reason').value.trim();
              if(!reason){b.querySelector('#deactivate-feedback').innerHTML='<div class="inline-error">Alasan wajib diisi.</div>';return;}
              await svc().privilegedDeactivatePlan(code,reason);
              window.SYKA_MODAL.close();
              window.SYKA_TOAST.show(`Paket ${code} dinonaktifkan.`,'success');
              window.SYKA_ROUTER.refresh();
            }catch(error){
              b.querySelector('#deactivate-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Gagal menonaktifkan paket.')}</div>`;
            }
          };
        }
      });
    }));
    const assignmentSection=document.createElement('section');
    assignmentSection.className='panel-card plan-assignment-card';
    root.querySelector('.plans-page').appendChild(assignmentSection);

    async function renderAssignments(){
      try{
        const organizers=await svc().listOrganizers();
        const rows=await Promise.all(organizers.map(async org=>({org,plan:await svc().listActiveOrganizerPlan(org.id).catch(()=>null)})));
        assignmentSection.innerHTML=`<div class="panel-head"><div><span class="eyebrow">WORKSPACE ASSIGNMENT</span><h3>Plan aktif per penyelenggara</h3><p>Perubahan paket dan masa berlaku sekarang dilakukan di Pengaturan Penyelenggara dengan step-up security.</p></div></div><div class="assignment-grid">${rows.map(({org,plan})=>`<div class="assignment-row"><div><strong>${esc(org.name)}</strong><small>${esc(org.slug||'')} · ${plan?.plan_code?`Paket ${esc(plan.plan_code)}`:'Belum memilih paket'}</small></div><div class="assignment-actions"><button class="btn btn-secondary btn-sm" data-assign-open="${esc(org.id)}">Kelola masa berlaku</button></div></div>`).join('')||'<div class="empty-inline">Belum ada workspace organizer.</div>'}</div>`;
        assignmentSection.querySelectorAll('[data-assign-open]').forEach(btn=>btn.onclick=()=>window.SYKA_ROUTER.navigate('/admin',{tab:'organizer_settings',organizer:btn.dataset.assignOpen}));
      }catch(error){assignmentSection.innerHTML=`<div class="inline-error">${esc(error.message||'Assignment plan gagal dimuat.')}</div>`;}
    }
    renderAssignments();
  }
  function money(v){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);}

  function planCreateModal(){
    window.SYKA_MODAL.open({
      title:'Tambah paket penyelenggara',
      wide:true,
      html:`<form id="create-plan-form" class="form-card">
        <div class="form-section-title"><div><span class="eyebrow">NEW PLAN</span><h2>Paket baru</h2><p>Gunakan kode unik, misalnya EDU atau ENTERPRISE.</p></div></div>
        <div class="form-grid-2">
          <label>Kode paket *<input id="code" pattern="[A-Za-z0-9_\\-]+" required placeholder="ENTERPRISE"></label>
          <label>Nama paket *<input id="name" required placeholder="Enterprise"></label>
          <label>Badge<input id="badge" placeholder="Skala besar"></label>
          <label>Urutan<input id="sort" type="number" min="0" value="10"></label>
          <label>Harga / bulan<input id="monthly" type="number" min="0" step="1000" value="0"></label>
          <label>Harga / tahun<input id="yearly" type="number" min="0" step="1000" value="0"></label>
        </div>
        <label>Deskripsi<textarea id="description" rows="3" placeholder="Untuk siapa paket ini?"></textarea></label>
        <label class="switch-line"><input id="active" type="checkbox" checked><span>Aktif dan tampil di katalog</span></label>
        <label>Alasan pencatatan *<textarea id="reason" rows="2" required placeholder="Alasan membuat paket baru"></textarea></label>
        <div id="create-plan-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Buat paket</button></div>
      </form>`,
      onOpen:b=>{
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#create-plan-form').onsubmit=async e=>{
          e.preventDefault();
          const code=b.querySelector('#code').value.trim().toUpperCase();
          if(!code){return;}
          const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Menyimpan…';
          try{
            await svc().privilegedUpsertPlanCatalog({
              plan_code:code,
              name:b.querySelector('#name').value.trim(),
              badge:b.querySelector('#badge').value.trim(),
              description:b.querySelector('#description').value.trim(),
              monthly_price:b.querySelector('#monthly').value,
              yearly_price:b.querySelector('#yearly').value,
              is_active:b.querySelector('#active').checked,
              sort_order:b.querySelector('#sort').value,
              reason:b.querySelector('#reason').value.trim()
            });
            window.SYKA_MODAL.close();window.SYKA_TOAST.show(`Paket ${code} berhasil dibuat.`,'success');window.SYKA_ROUTER.refresh();
          }catch(error){
            btn.disabled=false;btn.textContent='Buat paket';
            b.querySelector('#create-plan-feedback').innerHTML=`<div class="inline-error">${esc(error.message||'Paket gagal dibuat.')}</div>`;
          }
        };
      }
    });
  }

  async function monetization(root){
    const products=await svc().listCommerceProducts({admin:true});
    const benefits={};
    await Promise.all(products.map(async p=>{benefits[p.id]=await svc().listCommerceBenefits(p.id);}));
    const audienceLabels={student:'Pelajar',teacher:'Guru',organizer:'Penyelenggara'};
    const typeLabels={EDU_COIN_TOPUP:'Koin Edu',FEATURE_UNLOCK:'Fitur',DIGITAL_ITEM:'Item digital',DONATION:'Donasi',PLAN:'Paket'};
    root.innerHTML=`<div class="toolbar"><div><h2>Monetisasi &amp; Katalog</h2><p>Atur apa yang boleh tampil untuk Pelajar, Guru, dan Penyelenggara. Semua item pembayaran tetap menunggu verifikasi webhook backend.</p></div><button class="btn btn-primary" id="new-product">+ Produk baru</button></div><div class="catalog-notice"><strong>Arsitektur siap untuk 3 audience</strong><span>Pelajar · Guru · Penyelenggara</span><small>Gunakan katalog ini untuk Koin Edu, fitur khusus, item digital, donasi, dan paket.</small></div><div class="data-table catalog-table">${products.map(p=>`<div class="data-row product-admin-row"><div class="product-admin-info"><div class="store-icon">${p.product_type==='DONATION'?'♥':p.product_type==='EDU_COIN_TOPUP'?'✦':'◆'}</div><div><strong>${esc(p.name)}</strong><small>${esc(p.code)} · ${esc(typeLabels[p.product_type]||p.product_type)}</small><div class="audience-chips">${(p.audiences||[]).map(a=>`<span class="chip">${audienceLabels[a]||a}</span>`).join('')}</div></div></div><div class="product-admin-meta"><span class="status-pill ${p.is_active?'status-success':'status-muted'}">${p.is_active?'ACTIVE':'DRAFT'}</span><strong>${money(p.price)}</strong><div class="row-actions"><button class="btn btn-ghost btn-xs" data-edit-product="${p.id}">Edit</button><button class="btn btn-ghost btn-xs" data-toggle-product="${p.id}" data-active="${p.is_active?'false':'true'}">${p.is_active?'Nonaktifkan':'Aktifkan'}</button></div></div></div>`).join('')||window.SYKA_EMPTY.render({title:'Katalog masih kosong',text:'Buat produk pertama untuk mulai mengatur monetisasi.'})}</div>`;
    document.getElementById('new-product').onclick=()=>openProductModal();
    root.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>openProductModal(products.find(p=>p.id===b.dataset.editProduct),benefits[b.dataset.editProduct]||[]));
    root.querySelectorAll('[data-toggle-product]').forEach(b=>b.onclick=async()=>{const product=products.find(p=>p.id===b.dataset.toggleProduct);try{await svc().saveCommerceProduct({...product,is_active:b.dataset.active==='true'},product.id);window.SYKA_TOAST.show('Status produk diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});

    function openProductModal(product=null,existingBenefits=[]){
      const isEdit=!!product;const audiences=product?.audiences||[];const benefit=existingBenefits[0]||{};
      window.SYKA_MODAL.open({title:isEdit?'Edit produk':'Produk baru',wide:true,html:`<form id="product-form" class="form-card"><div class="form-grid-2"><label>Nama produk *<input id="pr-name" required value="${esc(product?.name||'')}"></label><label>Kode *<input id="pr-code" required value="${esc(product?.code||'')}" ${isEdit?'readonly':''}></label></div><div class="form-grid-2"><label>Slug *<input id="pr-slug" required value="${esc(product?.slug||'')}"></label><label>Tipe *<select id="pr-type">${Object.entries(typeLabels).map(([v,l])=>`<option value="${v}" ${product?.product_type===v?'selected':''}>${l}</option>`).join('')}</select></label></div><label>Deskripsi singkat<textarea id="pr-short" rows="2">${esc(product?.short_description||'')}</textarea></label><label>Deskripsi lengkap<textarea id="pr-desc" rows="4">${esc(product?.description||'')}</textarea></label><div class="form-grid-2"><label>Harga (IDR) *<input id="pr-price" type="number" min="0" step="1000" required value="${Number(product?.price)||0}"></label><label>Urutan tampil<input id="pr-order" type="number" min="0" value="${Number(product?.sort_order)||0}"></label></div><fieldset class="check-group"><legend>Tampilkan untuk</legend>${[['student','Pelajar'],['teacher','Guru'],['organizer','Penyelenggara']].map(([v,l])=>`<label class="check-option"><input type="checkbox" data-audience="${v}" ${audiences.includes(v)?'checked':''}><span>${l}</span></label>`).join('')}</fieldset><fieldset class="check-group"><legend>Benefit produk</legend><div class="form-grid-2"><label>Benefit type<select id="pr-benefit-type"><option value="EDU_COIN" ${benefit.benefit_type==='EDU_COIN'?'selected':''}>Koin Edu</option><option value="FEATURE" ${benefit.benefit_type==='FEATURE'?'selected':''}>Feature unlock</option><option value="ITEM" ${benefit.benefit_type==='ITEM'?'selected':''}>Item digital</option><option value="PLAN" ${benefit.benefit_type==='PLAN'?'selected':''}>Plan</option></select></label><label>Benefit key<input id="pr-benefit-key" value="${esc(benefit.benefit_key||product?.metadata?.feature||'')}"></label><label>Jumlah<input id="pr-benefit-qty" type="number" min="0" value="${benefit.quantity??product?.metadata?.coin_amount??''}"></label><label>Durasi (hari)<input id="pr-benefit-days" type="number" min="0" value="${benefit.duration_days??product?.metadata?.duration_days??''}"></label></div></fieldset><div class="upload-field-card"><div><span class="eyebrow">PRODUCT IMAGE</span><h3>Upload gambar produk</h3><p>Disimpan langsung ke Cloudinary, tanpa input URL.</p></div><div class="upload-preview" id="product-image-preview">${product?.image_url?`<img src="${esc(product.image_url)}" alt="Produk"><div class="upload-file-meta"><strong>Asset tersimpan</strong></div>`:`<div class="upload-placeholder"><span>↑</span><strong>Belum ada gambar</strong><small>Square image • maksimal 8 MB</small></div>`}</div><button type="button" class="btn btn-secondary" id="product-image-upload">${product?.image_url?'Ganti gambar':'Upload gambar'}</button><input type="hidden" id="pr-image" value="${esc(product?.image_url||'')}"><input type="hidden" id="pr-public-id" value="${esc(product?.public_id||'')}"></div><label class="switch-line"><input id="pr-featured" type="checkbox" ${product?.is_featured?'checked':''}><span>Tampilkan sebagai produk unggulan</span></label><label class="switch-line"><input id="pr-active" type="checkbox" ${product?.is_active?'checked':''}><span>Produk aktif dan tampil di katalog</span></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batalkan</button><button class="btn btn-primary" type="submit">${isEdit?'Simpan perubahan':'Buat produk'}</button></div></form>`,onOpen:b=>{b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();b.querySelector('#product-image-upload')?.addEventListener('click',async()=>{try{const info=await window.SYKA_CLOUDINARY.openProductImageWidget();b.querySelector('#pr-image').value=info.secure_url||'';b.querySelector('#pr-public-id').value=info.public_id||'';b.querySelector('#product-image-preview').innerHTML=`<img src="${esc(info.secure_url)}" alt="Produk"><div class="upload-file-meta"><strong>${esc(info.original_filename||'Produk')}</strong></div>`;b.querySelector('#product-image-upload').textContent='Ganti gambar';}catch(e){window.SYKA_TOAST.show(e.message||'Upload gagal.','error');}});b.querySelector('#product-form').onsubmit=async e=>{e.preventDefault();const audiences=[...b.querySelectorAll('[data-audience]:checked')].map(x=>x.dataset.audience);if(!audiences.length){window.SYKA_TOAST.show('Pilih minimal satu audience.','error');return;}const payload={code:b.querySelector('#pr-code').value.trim().toUpperCase(),slug:b.querySelector('#pr-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-'),name:b.querySelector('#pr-name').value.trim(),short_description:b.querySelector('#pr-short').value.trim()||null,description:b.querySelector('#pr-desc').value.trim()||null,product_type:b.querySelector('#pr-type').value,audiences,price:Number(b.querySelector('#pr-price').value)||0,currency:'IDR',image_url:b.querySelector('#pr-image').value.trim()||null,public_id:b.querySelector('#pr-public-id').value.trim()||null,is_active:b.querySelector('#pr-active').checked,is_featured:b.querySelector('#pr-featured').checked,sort_order:Number(b.querySelector('#pr-order').value)||0,metadata:{}};try{const saved=await svc().saveCommerceProduct(payload,product?.id||null);const benefits=[];const btype=b.querySelector('#pr-benefit-type').value;const bkey=b.querySelector('#pr-benefit-key').value.trim()||null;const qty=b.querySelector('#pr-benefit-qty').value===''?null:Number(b.querySelector('#pr-benefit-qty').value);const days=b.querySelector('#pr-benefit-days').value===''?null:Number(b.querySelector('#pr-benefit-days').value);if(btype)benefits.push({benefit_type:btype,benefit_key:bkey,quantity:qty,duration_days:days,config:{}});await svc().replaceCommerceBenefits(saved.id,benefits);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Produk tersimpan.','success');render(root);}catch(error){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(error.message||'Produk gagal disimpan.')}</div>`);}};}});
    }
  }
  async function settings(root){const[flags,settings]=await Promise.all([svc().listFlags(),svc().listSettings()]);root.innerHTML=`<div class="control-grid-2"><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">FLAGS</span><h2>Feature flags</h2></div></div>${flags.map(f=>`<div class="data-row"><div><strong>${esc(f.key)}</strong><small>${f.enabled?'Enabled':'Disabled'}</small></div><button class="btn btn-ghost btn-sm" data-flag="${esc(f.key)}" data-enabled="${!f.enabled}">${f.enabled?'Matikan':'Nyalakan'}</button></div>`).join('')||'<p class="muted">Belum ada flag.</p>'}</section><section class="panel-card"><div class="panel-head"><div><span class="eyebrow">GLOBAL SETTINGS</span><h2>Pengaturan</h2></div></div>${settings.map(s=>`<div class="data-row"><div><strong>${esc(s.key)}</strong><small>${esc(JSON.stringify(s.value))}</small></div><button class="btn btn-ghost btn-sm" data-setting="${esc(s.key)}">Edit</button></div>`).join('')||'<p class="muted">Belum ada setting.</p>'}</section></div>`;root.querySelectorAll('[data-flag]').forEach(b=>b.onclick=async()=>{try{await svc().setFlag(b.dataset.flag,b.dataset.enabled==='true',{});window.SYKA_TOAST.show('Feature flag diperbarui.','success');render(root);}catch(error){window.SYKA_TOAST.show(error.message,'error');}});root.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>settingModal(b.dataset.setting));}
  function settingModal(key){
    window.SYKA_MODAL.open({
      title:'Global setting',
      html:`<form id="setting-form" class="form-card">
        <label>Key<input id="key" value="${esc(key)}" required></label>
        <label>Value JSON<textarea id="value" rows="8">{}</textarea><small class="field-help">Harus berupa JSON valid.</small></label>
        <div id="setting-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div>
      </form>`,
      onOpen:b=>{
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#setting-form').onsubmit=async e=>{
          e.preventDefault();
          const feedback=b.querySelector('#setting-feedback');
          try{
            const value=JSON.parse(b.querySelector('#value').value||'{}');
            await svc().setSetting(b.querySelector('#key').value.trim(),value);
            window.SYKA_MODAL.close();
            window.SYKA_TOAST.show('Setting tersimpan.','success');
            window.SYKA_ROUTER.refresh();
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Setting tidak valid.')}</div>`;}
        };
      }
    });
  }

  function slideModal(){
    window.SYKA_MODAL.open({
      title:'Promo slide',
      wide:true,
      html:`<form id="slide-form" class="form-card">
        <div class="form-grid-2"><label>Judul *<input id="title" required></label><label>Badge<input id="badge" value="PROMO"></label></div>
        <label>Subtitle<textarea id="subtitle" rows="3" placeholder="Pesan singkat promo…"></textarea></label>
        <div class="upload-field-card">
          <div><span class="eyebrow">PROMO IMAGE</span><h3>Upload gambar slide</h3><p>Rasio ideal 16:9. Gambar langsung diunggah ke Cloudinary.</p></div>
          <div class="upload-preview" id="promo-preview"><div class="upload-placeholder"><span>↑</span><strong>Belum ada gambar</strong><small>PNG, JPG, WEBP • maksimal 10 MB</small></div></div>
          <button type="button" class="btn btn-secondary" id="promo-upload">Pilih gambar</button>
          <input type="hidden" id="url"><input type="hidden" id="pid"><input type="hidden" id="w"><input type="hidden" id="h"><input type="hidden" id="v"><input type="hidden" id="r">
        </div>
        <div class="form-grid-2"><label>CTA label<input id="cta" placeholder="Jelajahi lomba"></label><label>CTA route<input id="route" value="/lomba"></label></div>
        <div class="form-grid-2">${dateField('start','Mulai tayang',null,false)}${dateField('end','Berakhir',null,false)}</div>
        <div id="slide-feedback"></div>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan slide</button></div>
      </form>`,
      onOpen:b=>{
        window.SYKA_UTILS.bindDateTimePickers(b);
        let info=null;
        b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();
        b.querySelector('#promo-upload').onclick=async()=>{
          try{
            info=await window.SYKA_CLOUDINARY.openPromoImageWidget();
            b.querySelector('#url').value=info.secure_url||'';
            b.querySelector('#pid').value=info.public_id||'';
            b.querySelector('#w').value=info.width||'';
            b.querySelector('#h').value=info.height||'';
            b.querySelector('#v').value=info.version||'';
            b.querySelector('#r').value=info.resource_type||'image';
            b.querySelector('#promo-preview').innerHTML=`<img src="${esc(info.secure_url)}" alt="Promo"><div class="upload-file-meta"><strong>${esc(info.original_filename||'Promo')}</strong><small>Cloudinary • asset tersimpan</small></div>`;
            b.querySelector('#promo-upload').textContent='Ganti gambar';
          }catch(e){b.querySelector('#slide-feedback').innerHTML=`<div class="inline-error">${esc(e.message||'Upload gagal.')}</div>`;}
        };
        b.querySelector('#slide-form').onsubmit=async e=>{
          e.preventDefault();
          const feedback=b.querySelector('#slide-feedback');
          try{
            const imageUrl=b.querySelector('#url').value.trim();
            if(!imageUrl) throw new Error('Upload gambar promo terlebih dahulu.');
            await svc().saveSlide({
              title:b.querySelector('#title').value.trim(),
              subtitle:b.querySelector('#subtitle').value.trim()||null,
              badge:b.querySelector('#badge').value.trim()||'PROMO',
              image_url:imageUrl,
              cta_label:b.querySelector('#cta').value.trim()||null,
              cta_route:b.querySelector('#route').value.trim()||'/lomba',
              starts_at:window.SYKA_UTILS.readDateTimeField('start', b),
              ends_at:window.SYKA_UTILS.readDateTimeField('end', b),
              is_active:true,
              sort_order:0,
              config:{public_id:b.querySelector('#pid').value||null,width:Number(b.querySelector('#w').value)||null,height:Number(b.querySelector('#h').value)||null,version:b.querySelector('#v').value||null,resource_type:b.querySelector('#r').value||'image'}
            });
            window.SYKA_MODAL.close();
            window.SYKA_TOAST.show('Promo slide tersimpan.','success');
            window.SYKA_ROUTER.refresh();
          }catch(error){feedback.innerHTML=`<div class="inline-error">${esc(error.message||'Promo slide gagal disimpan.')}</div>`;}
        };
      }
    });
  }

  window.SYKA_PAGE_ADMIN={render};
})();


/* src/pages/Organizer.js */
(function(){
  const svc=()=>window.SYKA_CONTROL_SERVICE;
  const U=window.SYKA_UTILS;
  const esc=U.escapeHtml;
  const fmt=U.formatDateTime;

  // Organizer is intentionally a competition workspace, not a collection of
  // UUID-driven sub-pages. Server ids remain internal implementation details.
  const tabs=[
    ['dashboard','Dashboard'],
    ['competitions','Kompetisi'],
    ['participants','Peserta'],
    ['awards','Hadiah & penghargaan'],
    ['notifications','Notifikasi'],
    ['plan','Plan & Usage']
  ];

  const TYPE_META={
    multiple_choice:{label:'Pilihan ganda',options:true,multi:false},
    multiple_checkbox:{label:'Pilihan ganda multi-jawaban',options:true,multi:true},
    true_false:{label:'Benar / Salah',options:true,multi:false,locked:true},
    short_answer:{label:'Isian singkat',options:false},
    essay:{label:'Essay',options:false},
    file_upload:{label:'Upload file',options:false}
  };

  const transitions={
    DRAFT:['PUBLISHED','SUSPENDED','CANCELLED'],
    PUBLISHED:['REGISTRATION_OPEN','SUSPENDED','CANCELLED'],
    REGISTRATION_OPEN:['REGISTRATION_CLOSED','SUSPENDED','CANCELLED'],
    REGISTRATION_CLOSED:['LIVE','SUSPENDED','CANCELLED'],
    LIVE:['SUBMISSION_CLOSED','SUSPENDED','CANCELLED'],
    SUBMISSION_CLOSED:['GRADING','SUSPENDED','CANCELLED'],
    GRADING:['RESULT_PUBLISHED','SUSPENDED'],
    RESULT_PUBLISHED:['ARCHIVED','SUSPENDED'],
    SUSPENDED:['DRAFT','PUBLISHED','REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','CANCELLED']
  };

  async function membership(){
    const a=window.SYKA_STATE.getState().auth;
    const list=await svc().listMyOrganizerMemberships(a.user?.id).catch(()=>[]);
    return list[0]?.organizer_id||null;
  }

  function workspaceSwitcher(rows,selected){
    const options=(rows||[]).map(r=>{
      const id=r.id||r.organizer_id;
      const label=r.name||r.organizers?.name||'Workspace';
      return `<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(label)}</option>`;
    }).join('');
    return `<label class="workspace-picker"><span>Workspace</span><select id="organizer-workspace-select">${options}</select></label>`;
  }

  function shell(tab,activePlan){
    return `<div class="control-head organizer-control-head-v49">
      <div><span class="eyebrow">ORGANIZER CONTROL PLANE</span><h1>Panel Penyelenggara</h1><p>Bangun satu kompetisi dalam satu workspace: informasi, peserta, soal, grading, hasil, awards, sertifikat, dan twibbon.</p></div>
      <div class="control-head-meta"><span class="security-badge">Plan ${esc(activePlan?.plan_code||'FREE')} · server-side</span></div>
    </div>
    <div class="control-tabs">${tabs.map(([k,l])=>`<button type="button" class="control-tab ${tab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div id="organizer-content"></div>`;
  }

  async function render(root){
    const auth=window.SYKA_STATE.getState().auth;
    if(!auth.user){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Masuk diperlukan',text:'Panel penyelenggara membutuhkan akun yang memiliki workspace.',actionHtml:'<button class="btn btn-primary" id="org-login">Masuk</button>'});
      document.getElementById('org-login')?.addEventListener('click',()=>window.SYKA_APP.openAuth('login',{target:'/organizer'}));
      return;
    }
    if(!auth.roles.includes('organizer_member')&&!auth.roles.includes('admin')){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Akses belum tersedia',text:'Akun ini belum memiliki jalur Penyelenggara.'});
      return;
    }

    try{
      const q=window.SYKA_STATE.getState().route.query||{};
      const competitionId=q.competition||null;
      const orgRows=auth.roles.includes('admin')?await svc().listOrganizers():await svc().listMyOrganizerMemberships(auth.user.id);
      let orgId=q.organizer||null;
      if(!orgId) orgId=orgRows[0]?.id||orgRows[0]?.organizer_id||null;
      if(!orgId){
        root.innerHTML=window.SYKA_EMPTY.render({title:'Belum ada workspace penyelenggara',text:auth.roles.includes('admin')?'Belum ada organizer yang terdaftar.':'Workspace penyelenggara akun ini belum tersedia.'});
        return;
      }
      if(auth.roles.includes('admin')&&!q.organizer){
        window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:q.tab||'dashboard'});
        return;
      }

      const activePlan=await svc().listActiveOrganizerPlan(orgId).catch(()=>null);
      const tab=tabs.some(([k])=>k===q.tab)?q.tab:'dashboard';
      if(!activePlan&&tab!=='plan'){
        root.innerHTML=shell('plan',activePlan);
        root.querySelector('.control-head-meta').innerHTML=`${auth.roles.includes('admin')?workspaceSwitcher(orgRows,orgId):'<span class="workspace-chip">Workspace aktif</span>'}<span class="security-badge">Pilih paket sebelum mengelola workspace</span>`;
        bindShell(root,orgId);
        await renderPlan(root.querySelector('#organizer-content'),orgId,true);
        return;
      }

      root.innerHTML=shell(tab,activePlan);
      root.querySelector('.control-head-meta').innerHTML=`${auth.roles.includes('admin')?workspaceSwitcher(orgRows,orgId):'<span class="workspace-chip">Workspace aktif</span>'}<span class="security-badge">Paket ${esc(activePlan?.plan_code||'FREE')}</span>`;
      bindShell(root,orgId);
      await renderTab(root.querySelector('#organizer-content'),tab,orgId,competitionId);
    }catch(error){
      root.innerHTML=window.SYKA_EMPTY.render({title:'Modul gagal dimuat',text:error.message||'Periksa workspace dan RLS lalu coba lagi.'});
    }
  }

  function bindShell(root,orgId){
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:b.dataset.tab}));
    root.querySelector('#organizer-workspace-select')?.addEventListener('change',e=>window.SYKA_ROUTER.navigate('/organizer',{organizer:e.target.value,tab:'competitions'}));
  }

  async function renderTab(root,tab,orgId,competitionId=null){
    if(tab==='dashboard') return dashboard(root,orgId);
    if(tab==='competitions') return workspaceCompetition(root,orgId,competitionId);
    if(tab==='participants') return participantsPage(root,orgId,competitionId);
    if(tab==='awards') return awardsPage(root,orgId,competitionId);
    if(tab==='notifications') return notifications(root);
    if(tab==='plan') return renderPlan(root,orgId,false);
  }

  async function dashboard(root,orgId){
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:20});
    const active=comps.filter(c=>!['ARCHIVED','CANCELLED'].includes(String(c.status))).length;
    const published=comps.filter(c=>String(c.status)==='PUBLISHED'||String(c.status)==='REGISTRATION_OPEN').length;
    root.innerHTML=`<div class="workspace-dashboard-v49">
      <div class="workspace-dashboard-hero"><div><span class="eyebrow">WORKSPACE OVERVIEW</span><h2>Semua kebutuhan kompetisi dalam satu tempat.</h2><p>Pilih kompetisi untuk membuka workspace lengkap tanpa UUID, popup form besar, atau perpindahan modul.</p></div><button class="btn btn-primary" id="dash-new-competition">+ Buat kompetisi</button></div>
      <div class="workspace-stat-grid-v49"><div><span>Kompetisi aktif</span><strong>${active}</strong></div><div><span>Pendaftaran terbuka</span><strong>${published}</strong></div><div><span>Total kompetisi</span><strong>${comps.length}</strong></div></div>
      <section class="panel-card"><div class="panel-head"><div><span class="eyebrow">RECENT</span><h3>Kompetisi terbaru</h3></div><button class="btn btn-ghost btn-sm" id="dash-go-competitions">Buka workspace</button></div><div class="data-table">${comps.slice(0,6).map(c=>`<button class="data-row data-row-button" data-open-comp="${esc(c.id)}"><div><strong>${esc(c.title)}</strong><small>${esc(c.category||'Kompetisi')} · ${fmt(c.created_at)}</small></div><span class="status-pill ${U.statusClass(c.status)}">${esc(c.status)}</span></button>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Mulai dari tombol Buat kompetisi.'})}</div></section>
    </div>`;
    root.querySelector('#dash-new-competition').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:'new'});
    root.querySelector('#dash-go-competitions').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions'});
    root.querySelectorAll('[data-open-comp]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:b.dataset.openComp}));
  }

  function dateField(id,label,value,required=false){
    return U.dateTimePickerMarkup(id,value,{title:label,required,help:'Pilih tanggal dan waktu lokal.'});
  }

  async function workspaceCompetition(root,orgId,competitionId){
    if(competitionId==='new') return renderNewWorkspace(root,orgId);
    if(!competitionId){
      const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:100});
      const readiness=await Promise.all((comps||[]).map(async c=>({c,ready:await competitionReady(c,orgId)})));
      root.innerHTML=`<div class="competition-workspace-v49"><div class="workspace-list-hero"><div><span class="eyebrow">COMPETITION WORKSPACE</span><h2>Pilih kompetisi untuk dikelola</h2><p>Satu workspace untuk semua konfigurasi. UUID, foreign key, dan ID internal tidak ditampilkan.</p></div><button class="btn btn-primary" id="ws-create-new">+ Buat kompetisi</button></div><div class="competition-picker-grid-v49">${readiness.map(({c,ready})=>`<article class="competition-picker-card-v49"><div class="competition-picker-top"><span class="status-pill ${U.statusClass(c.status)}">${esc(c.status)}</span><small>${fmt(c.created_at)}</small></div><h3>${esc(c.title)}</h3><p>${esc(c.short_description||'Belum ada deskripsi.')}</p><div class="competition-picker-foot"><span>${esc(c.category||'Kompetisi')}</span><span class="competition-ready-chip ${ready?'ready':'not-ready'}">${ready?'Siap dipublikasikan':'Belum lengkap'}</span></div><div class="competition-picker-actions"><button class="btn btn-secondary btn-sm" data-pick-comp="${esc(c.id)}">Kelola</button><button class="btn btn-ghost btn-sm" data-awards-comp="${esc(c.id)}">Hadiah</button><button class="btn btn-primary btn-sm" data-publish-comp="${esc(c.id)}" ${!ready||String(c.status)!=='DRAFT'?'disabled':''}>Publish</button></div></article>`).join('')||window.SYKA_EMPTY.render({title:'Belum ada kompetisi',text:'Buat kompetisi pertama untuk membuka workspace lengkap.'})}</div></div>`;
      root.querySelector('#ws-create-new').onclick=()=>renderNewWorkspace(root,orgId);
      root.querySelectorAll('[data-pick-comp]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:b.dataset.pickComp}));
      root.querySelectorAll('[data-awards-comp]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'awards',competition:b.dataset.awardsComp}));
      root.querySelectorAll('[data-publish-comp]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;try{await svc().transitionCompetition(b.dataset.publishComp,'PUBLISHED','Publish dari daftar Competition Workspace');window.SYKA_TOAST.show('Kompetisi berhasil dipublikasikan.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Publish gagal.','error');}});
      return;
    }
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:100});
    const comp=comps.find(x=>x.id===competitionId);
    if(!comp){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Pilih kompetisi lain dari workspace.'});return;}
    await renderWorkspaceEditor(root,orgId,comp);
  }

  async function renderNewWorkspace(root,orgId){
    const c={status:'DRAFT',visibility:'PUBLIC'};
    await renderWorkspaceEditor(root,orgId,c,true);
  }

  async function renderWorkspaceEditor(root,orgId,comp,isNew=false){
    const existingId=comp.id||null;
    const [rules,levels,rewards,banks,templates]=await Promise.all([
      existingId?svc().getRegistrationRules(existingId).catch(()=>null):Promise.resolve(null),
      existingId?svc().listLevels(existingId).catch(()=>[]):Promise.resolve([]),
      existingId?svc().listRewards(existingId).catch(()=>[]):Promise.resolve([]),
      svc().listQuestionBanks({organizerId:orgId}),
      existingId?svc().listTwibbonTemplates({competitionId:existingId}):Promise.resolve([])
    ]);

    root.innerHTML=`<div class="competition-workspace-v49">
      <div class="workspace-editor-hero-v49"><div><button class="btn btn-ghost btn-sm" id="ws-back">← Semua kompetisi</button><span class="eyebrow">COMPETITION WORKSPACE</span><h2>${esc(comp.title||'Kompetisi baru')}</h2><p>${isNew?'Selesaikan bagian-bagian berikut lalu simpan. Semua relation diisi otomatis oleh sistem.':'Kelola seluruh lifecycle kompetisi dari satu halaman.'}</p></div><div class="workspace-editor-actions"><span class="status-pill ${U.statusClass(comp.status||'DRAFT')}" id="ws-current-status">${esc(comp.status||'DRAFT')}</span><button class="btn btn-secondary" id="ws-save-all">${isNew?'Simpan draft':'Simpan perubahan'}</button><button class="btn btn-ghost" id="ws-awards-top" ${isNew?'disabled':''}>Hadiah</button><button class="btn btn-primary" id="ws-publish-top" disabled>Publish</button></div></div>
      <div class="workspace-layout-v410"><aside class="workspace-progress-v410" id="workspace-progress"><div class="workspace-progress-title"><span class="eyebrow">PROGRESS</span><strong>Checklist kompetisi</strong><small>Merah = wajib diisi · hijau = siap</small></div><button type="button" class="active" data-ws-nav="ws-info"><span>1</span><b>Informasi</b></button><button type="button" data-ws-nav="ws-eligibility"><span>2</span><b>Eligibility</b></button><button type="button" data-ws-nav="ws-timeline"><span>3</span><b>Jadwal</b></button><button type="button" data-ws-nav="ws-lifecycle"><span>4</span><b>Status</b></button><button type="button" data-ws-nav="ws-twibbon"><span>5</span><b>Twibbon</b></button><button type="button" data-ws-nav="ws-questions"><span>6</span><b>Soal</b></button><button type="button" data-ws-nav="ws-publish"><span>7</span><b>Publikasi</b></button></aside><main class="workspace-layout-content-v410"><div id="ws-info">${competitionBasicsHtml(comp)}</div>
      <div id="ws-eligibility">${eligibilityHtml(rules)}</div>
      <div id="ws-timeline">${timelineHtml(comp)}</div>
      <div id="ws-lifecycle">${lifecycleSection(comp)}</div>
      <div id="ws-twibbon">${twibbonSection(templates,comp)}</div>
      <div id="ws-questions">${questionsSection()}</div>
      <div id="ws-publish"><section class="workspace-section-v49 workspace-publish-section-v410"><div class="workspace-section-head"><div><span class="eyebrow">08 · PUBLIKASI</span><h2>Siap dipublikasikan?</h2><p>Semua checklist wajib harus hijau. Tombol Publish akan aktif hanya jika data inti kompetisi, jadwal, eligibility, reward, twibbon, juknis, dan bank soal sudah siap.</p></div><span class="status-pill status-warning workspace-progress-current">Lengkapi bagian merah terlebih dahulu</span></div><div class="publish-checklist-v410" id="ws-publish-checklist"></div><div class="workspace-actions"><button class="btn btn-primary" id="ws-publish-inline" disabled>Publish kompetisi</button></div></section></div>
      <div id="ws-grading">${gradingSection()}</div>
      <div id="ws-results">${resultsSection()}</div>
      <div id="ws-awards">${awardsSection()}</div>
      <div id="ws-certificates">${certificatesSection()}</div>
      <div class="workspace-bottom-actions-v410"><button class="btn btn-secondary" id="ws-save-all-bottom">${isNew?'Buat kompetisi':'Simpan semua perubahan'}</button><button class="btn btn-primary" id="ws-publish-final" disabled>Publish</button></div><div id="ws-feedback"></div></main></div></div>`;

    root.querySelector('#ws-back').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions'});
    U.bindDateTimePickers(root);
    bindWorkspaceEvents(root,orgId,comp,isNew,banks);
    if(existingId){
      await refreshWorkspaceData(root,orgId,comp.id);
    }
  }

  function lifecycleSection(comp){
    const current=String(comp?.status||'DRAFT').toUpperCase();
    const next=transitions[current]||[];
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">04 · STATUS & PUBLIKASI</span><h2>Lifecycle kompetisi</h2><p>Gunakan status sesuai urutan lifecycle RPD. Perubahan tetap divalidasi server-side.</p></div><span class="status-pill ${U.statusClass(current)}">${esc(current)}</span></div><div class="lifecycle-workspace-v49"><div class="lifecycle-current-card"><span>Status sekarang</span><strong>${esc(current)}</strong><small>Perubahan status dicatat di backend dan audit.</small></div><div class="lifecycle-action-card"><label>Ubah ke<select id="ws-next-status"><option value="">Pilih status…</option>${next.map(s=>`<option value="${s}">${s.replaceAll('_',' ')}</option>`).join('')}</select></label><label>Alasan perubahan<textarea id="ws-transition-reason" rows=2 placeholder="Opsional untuk perubahan biasa; wajib sesuai policy server jika diperlukan."></textarea></label><button class="btn btn-primary" type="button" id="ws-transition" ${next.length?'':'disabled'}>Terapkan perubahan</button></div></div></section>`;
  }

  function rewardSection(rows){
    const ranks=['FIRST','SECOND','THIRD','PARTICIPANT'];
    const byRank=Object.fromEntries((rows||[]).map(r=>[r.rank_code,r]));
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">04 · HADIAH</span><h2>Hadiah & penghargaan</h2><p>Atur hanya poin penilaian lomba. XP dan Koin Edu ditetapkan oleh Admin.</p></div></div><div class="reward-editor-grid-v49">${ranks.map(rank=>{const r=byRank[rank]||{};return `<div class="reward-editor-card-v49"><span class="reward-rank-v47">${rank==='FIRST'?'1':rank==='SECOND'?'2':rank==='THIRD'?'3':'•'}</span><div><strong>${rank==='PARTICIPANT'?'Peserta':'Juara '+rank.replace('FIRST','1').replace('SECOND','2').replace('THIRD','3')}</strong><label>Judul<input data-reward-title="${rank}" value="${esc(r.title||'')}" placeholder="Contoh: Juara ${rank==='FIRST'?'1':''}"></label><label>Poin<input data-reward-points="${rank}" type="number" min="0" value="${Number(r.points)||0}"></label><div class="reward-asset-note-v410"><span>Emblem / ribbon</span><strong>Diatur sebagai asset hasil/Admin</strong><small>Organizer tidak memasukkan URL.</small></div></div></div>`;}).join('')}</div><div class="workspace-actions"><button class="btn btn-primary" id="ws-save-reward">Simpan hadiah</button></div></section>`;
  }

  function twibbonSection(rows,comp){
    const t=rows?.[0];
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">05 · TWIBBON</span><h2>Template twibbon</h2><p>Penyelenggara menyimpan template PNG/JPG di Cloudinary. Hasil twibbon peserta dibuat lokal di perangkat.</p></div><span class="status-pill ${t?.is_active?'status-success':'status-neutral'}">${t?'Template aktif':'Belum ada template'}</span></div><div class="twibbon-editor-v49"><div class="upload-preview" id="ws-tw-preview">${t?.image_url?`<img src="${esc(t.image_url)}" alt="Twibbon"><div class="upload-file-meta"><strong>${esc(t.name||'Template')}</strong><small>Template tersimpan di Cloudinary</small></div>`:'<div class="upload-placeholder"><span>↑</span><strong>Belum ada template</strong><small>Upload PNG transparan untuk peserta.</small></div>'}</div><div class="twibbon-editor-form-v49"><label>Nama template<input id="ws-tw-name" value="${esc(t?.name||'Twibbon '+(comp.title||''))}"></label><label class="checkline"><input id="ws-tw-required" type="checkbox" ${t?.is_required?'checked':''}> Wajib saat pendaftaran</label><input type="file" id="ws-tw-file" accept="image/png,image/jpeg,image/webp" hidden><div class="upload-actions"><button type="button" class="btn btn-secondary" id="ws-tw-upload">${t?'Ganti template':'Upload template'}</button><button type="button" class="btn btn-primary" id="ws-tw-save">Simpan template</button></div><div id="ws-tw-feedback"></div></div></div></section>`;
  }

  function questionsSection(){
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">06 · SOAL</span><h2>Bank soal & pertanyaan</h2><p>Bank soal adalah aset organizer. Di kompetisi ini kamu cukup memilih bank soal atau membuat soal baru.</p></div></div><div class="question-inline-workspace-v49"><div class="question-bank-tools-v49"><label>Bank soal yang dipakai<select id="ws-bank-select"><option value="">Pilih bank soal…</option></select></label><div class="inline-create-grid"><input id="ws-bank-name" placeholder="Nama bank soal baru"><select id="ws-bank-grade"><option value="">Pilih kelas bank…</option><option value="SD4">Kelas 4 SD</option><option value="SD5">Kelas 5 SD</option><option value="SD6">Kelas 6 SD</option><option value="SMP1">Kelas 1 SMP</option><option value="SMP2">Kelas 2 SMP</option><option value="SMP3">Kelas 3 SMP</option><option value="SMA1">Kelas 1 SMA</option><option value="SMA2">Kelas 2 SMA</option><option value="SMA3">Kelas 3 SMA</option></select><button class="btn btn-secondary" type="button" id="ws-bank-create">+ Buat bank</button></div><button class="btn btn-primary btn-sm" type="button" id="ws-bank-bind" disabled>Gunakan bank ini untuk kompetisi</button><div class="question-import-tools-v410"><button class="btn btn-secondary btn-sm" type="button" id="ws-download-template">Download template Excel</button><label class="btn btn-secondary btn-sm">Import Excel / CSV<input type="file" id="ws-import-sheet" accept=".xlsx,.xls,.csv,.tsv" hidden></label></div><small class="form-hint">Bank soal tetap menjadi milik organizer. Untuk Free, siapkan bank/soal per kelas secara manual. Premium/Pro dapat memakai template Excel.</small></div><div class="question-inline-editor-v49"><div id="ws-question-list"></div><div class="question-builder-inline-v49"><div class="question-builder-head-v49"><div><span class="eyebrow">QUESTION BUILDER</span><strong>Tambah soal</strong></div></div><div class="form-grid-2"><label>Jenis<select id="ws-q-type">${Object.entries(TYPE_META).map(([v,m])=>`<option value="${v}">${m.label}</option>`).join('')}</select></label><label>Poin<input id="ws-q-points" type="number" min="0" step="0.5" value="1"></label></div><label class="checkline"><input id="ws-q-bind-competition" type="checkbox" checked> Gunakan soal ini langsung untuk kompetisi ini</label><label>Pertanyaan<textarea id="ws-q-prompt" rows="4" placeholder="Tulis pertanyaan…"></textarea></label><div id="ws-q-type-fields"></div><label class="checkline"><input id="ws-q-required" type="checkbox" checked> Wajib dijawab</label><button class="btn btn-primary" type="button" id="ws-q-save">Simpan soal</button><div id="ws-q-feedback"></div></div></div></div></section>`;
  }

  function participantsSection(){
    return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">07 · PESERTA</span><h2>Peserta & persetujuan</h2><p>Semua peserta tampil di tabel yang sama. Tidak ada UUID manual.</p></div><label class="compact-filter">Status<select id="ws-participant-filter"><option value="">Semua</option><option value="PENDING">Menunggu</option><option value="ACTIVE">Disetujui</option><option value="REJECTED">Ditolak</option></select></label></div><div id="ws-participant-table" class="data-table"></div></section>`;
  }

  function gradingSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">08 · GRADING</span><h2>Penilaian</h2><p>Pilih attempt dari peserta dan beri score/feedback tanpa memasukkan ID.</p></div></div><div id="ws-grading-table" class="data-table"></div></section>`;}
  function resultsSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">09 · HASIL</span><h2>Hasil kompetisi</h2><p>Menampilkan attempt yang sudah finalized.</p></div></div><div id="ws-results-table" class="data-table"></div></section>`;}
  function awardsSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">10 · AWARDS</span><h2>Awards & emblem</h2><p>Award event akan mengikuti hasil final dan konfigurasi reward.</p></div></div><div id="ws-awards-table" class="data-table"></div></section>`;}
  function certificatesSection(){return `<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">11 · SERTIFIKAT</span><h2>Sertifikat</h2><p>Kelola status sertifikat peserta dari workspace ini. Template final dapat diproses backend tanpa UUID.</p></div></div><div id="ws-cert-table" class="data-table"></div></section>`;}

  async function refreshWorkspaceData(root,orgId,competitionId){
    const [banks,questions,participants,attempts,finalized,awards,certificates]=await Promise.all([
      svc().listQuestionBanks({organizerId:orgId}),
      svc().listQuestions({competitionId}),
      svc().listRegistrations({competitionId}),
      svc().listAttempts({competitionId,status:'SUBMITTED'}).catch(()=>[]),
      svc().listAttempts({competitionId,status:'FINALIZED'}).catch(()=>[]),
      svc().listAwards({competitionId}),
      svc().listCertificates({competitionId})
    ]);
    const bankSelect=root.querySelector('#ws-bank-select');
    if(bankSelect){bankSelect.innerHTML='<option value="">Pilih bank soal…</option>'+banks.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');}
    const qList=root.querySelector('#ws-question-list');
    if(qList){ const selectedBank=bankSelect?.value||''; const shown=(questions||[]).filter(q=>!selectedBank||q.question_bank_id===selectedBank); qList.innerHTML=shown.length?shown.map((q,i)=>`<div class="question-inline-row-v49"><span>${i+1}</span><div><strong>${esc(q.prompt)}</strong><small>${esc(TYPE_META[q.type]?.label||q.type)} · ${Number(q.points||0)} poin · ${q.required?'Wajib':'Opsional'} · ${q.competition_id?'Terikat kompetisi':'Bank soal umum'}</small></div><button class="btn btn-ghost btn-xs" data-q-delete="${esc(q.id)}">Hapus</button></div>`).join(''):'<div class="inline-empty">Belum ada soal pada pilihan bank ini.</div>'; }
    root.querySelectorAll('[data-q-delete]').forEach(b=>b.onclick=async()=>{try{await svc().moderateQuestion(b.dataset.qDelete,'ARCHIVED');b.closest('.question-inline-row-v49')?.remove();window.SYKA_TOAST.show('Soal diarsipkan.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal mengarsipkan soal.','error');}});
    renderParticipants(root,participants);
    renderGrading(root,attempts);
    renderResults(root,finalized);
    renderAwards(root,awards);
    renderCertificates(root,certificates);
  }

  function renderParticipants(root,rows){
    const el=root.querySelector('#ws-participant-table');if(!el)return;
    const filter=root.querySelector('#ws-participant-filter')?.value||'';
    const list=(rows||[]).filter(r=>!filter||r.status===filter);
    el.innerHTML=list.map(r=>`<div class="data-row organizer-participant-row-v49"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>@${esc(r.profiles?.username||'—')} · ${esc(r.profiles?.institution||'')} · ${esc(r.profiles?.grade||'')}</small><small>Social proof: ${esc(r.social_proof_url||'—')}</small></div><div class="row-actions-v49"><span class="status-pill ${U.statusClass(r.status)}">${esc(r.status)}</span>${r.status==='PENDING'?`<button class="btn btn-secondary btn-sm" data-approve="${esc(r.id)}">Approve</button><button class="btn btn-ghost btn-sm" data-reject="${esc(r.id)}">Reject</button>`:''}</div></div>`).join('')||'<div class="inline-empty">Belum ada peserta pada filter ini.</div>';
    el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{try{await svc().reviewRegistration(b.dataset.approve,'APPROVE');window.SYKA_TOAST.show('Peserta disetujui.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Approve gagal.','error');}});
    el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>rejectParticipant(b.dataset.reject));
  }

  function rejectParticipant(id){
    window.SYKA_MODAL.open({title:'Tolak peserta',html:`<form id="ws-reject-form" class="form-card"><label>Alasan penolakan *<textarea id="ws-reason" rows="4" required placeholder="Tuliskan alasan yang akan diterima peserta…"></textarea></label><div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Tolak peserta</button></div></form>`,onOpen:b=>{b.querySelector('[data-close]').onclick=()=>window.SYKA_MODAL.close();b.querySelector('#ws-reject-form').onsubmit=async e=>{e.preventDefault();try{await svc().reviewRegistration(id,'REJECT',b.querySelector('#ws-reason').value.trim());window.SYKA_MODAL.close();window.SYKA_TOAST.show('Peserta ditolak.','success');window.SYKA_ROUTER.refresh();}catch(err){b.insertAdjacentHTML('beforeend',`<div class="inline-error">${esc(err.message||'Reject gagal.')}</div>`);}};}});
  }

  async function awardsPage(root,orgId,competitionId){
    if(!competitionId){root.innerHTML=window.SYKA_EMPTY.render({title:'Pilih kompetisi terlebih dahulu',text:'Buka Kompetisi lalu pilih Hadiah.'});return;}
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:200});
    const comp=comps.find(c=>c.id===competitionId);
    if(!comp){root.innerHTML=window.SYKA_EMPTY.render({title:'Kompetisi tidak ditemukan',text:'Pilih kompetisi yang tersedia di workspace.'});return;}
    const attempts=await svc().listAttempts({competitionId});
    const awards=await svc().listAwards({competitionId});
    const finished=['SUBMISSION_CLOSED','GRADING','RESULT_PUBLISHED','ARCHIVED'].includes(String(comp.status||''));
    root.innerHTML=`<div class="awards-management-page">
      <div class="awards-page-head"><div><span class="eyebrow">HADIAH & PENGHARGAAN</span><h1>${esc(comp.title)}</h1><p>Kelola ribbon/emblem, pemenang, dan sertifikat dari satu tempat. Data peserta tetap mengikuti hasil kompetisi.</p></div><div class="awards-page-actions"><button class="btn btn-ghost" id="awards-back">← Kompetisi</button><span class="status-pill ${U.statusClass(comp.status)}">${esc(comp.status)}</span></div></div>
      <div class="awards-status-note ${finished?'ready':'locked'}"><strong>${finished?'Hasil tersedia':'Sertifikat belum dibuka'}</strong><span>${finished?'Daftar peserta dan hasil dapat difilter berdasarkan tingkat.':'Sebelum lomba selesai, hanya ribbon/emblem untuk Juara 1–3 dan Peserta yang dapat dikelola.'}</span></div>
      <section class="panel-card awards-config-card"><div class="panel-head"><div><span class="eyebrow">EMBLEM / RIBBON</span><h3>Asset penghargaan</h3><p>PNG/JPG maksimal 1080×1080 px.</p></div></div><div class="award-asset-grid"><label>Juara 1<input type="file" accept="image/png,image/jpeg" data-award-asset="FIRST"></label><label>Juara 2<input type="file" accept="image/png,image/jpeg" data-award-asset="SECOND"></label><label>Juara 3<input type="file" accept="image/png,image/jpeg" data-award-asset="THIRD"></label><label>Peserta<input type="file" accept="image/png,image/jpeg" data-award-asset="PARTICIPANT"></label></div></section>
      <section class="panel-card awards-results-card"><div class="panel-head"><div><span class="eyebrow">HASIL</span><h3>Pemenang & sertifikat</h3></div><label class="compact-filter">Tingkat<select id="awards-grade-filter"><option value="">Semua tingkat</option><option value="SD4">SD 4</option><option value="SD5">SD 5</option><option value="SD6">SD 6</option><option value="SMP7">SMP 7</option><option value="SMP8">SMP 8</option><option value="SMP9">SMP 9</option><option value="SMA10">SMA 10</option><option value="SMA11">SMA 11</option><option value="SMA12">SMA 12</option><option value="UMUM">Umum</option></select></label></div><div class="awards-table-wrap"><table class="awards-table"><thead><tr><th>No</th><th>Juara / Status</th><th>Nilai</th><th>Nama Peserta</th><th>Sekolah / Instansi</th><th>Upload Sertifikat</th></tr></thead><tbody id="awards-results-body"></tbody></table></div></section>
    </div>`;
    const body=root.querySelector('#awards-results-body');
    function renderRows(){
      const grade=root.querySelector('#awards-grade-filter').value;
      let rows=(attempts||[]).filter(r=>['FINALIZED','GRADING','SUBMITTED'].includes(String(r.status||'')) && (!grade||String(r.profiles?.grade||'').toUpperCase()===grade));
      const ranked=rows.slice().sort((a,b)=>Number(b.score||0)-Number(a.score||0));
      body.innerHTML=ranked.map((r,i)=>{const rank=i<3?`Juara ${i+1}`:'Peserta';const certDisabled=!finished;return `<tr><td>${i+1}</td><td><span class="status-pill ${i<3?'status-success':'status-neutral'}">${rank}</span></td><td>${Number(r.score||0).toLocaleString('id-ID')}</td><td>${esc(r.profiles?.full_name||'Peserta')}</td><td>${esc(r.profiles?.institution||'—')}</td><td><button type="button" class="btn btn-secondary btn-sm" ${certDisabled?'disabled':''} data-cert-upload="${esc(r.participant_id||'')}">${certDisabled?'Tersedia setelah hasil':'Upload'}</button></td></tr>`;}).join('')||`<tr><td colspan="6"><div class="inline-empty">Belum ada hasil untuk filter ini.</div></td></tr>`;
    }
    renderRows(); root.querySelector('#awards-grade-filter').addEventListener('change',renderRows); root.querySelector('#awards-back').onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'competitions',competition:competitionId});
  }

  function renderGrading(root,rows){
    const el=root.querySelector('#ws-grading-table');if(!el)return;
    el.innerHTML=(rows||[]).map(r=>`<div class="data-row grading-row-v49"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>${esc(r.status)} · Mulai ${fmt(r.started_at)}</small></div><div class="inline-score"><input data-score="${esc(r.id)}" type="number" step="0.01" min="0" placeholder="Score" value="${r.score??''}"><button class="btn btn-secondary btn-sm" data-finalize="${esc(r.id)}">Finalisasi</button></div></div>`).join('')||'<div class="inline-empty">Belum ada attempt yang siap dinilai.</div>';
    el.querySelectorAll('[data-finalize]').forEach(b=>b.onclick=async()=>{const input=el.querySelector(`[data-score="${CSS.escape(b.dataset.finalize)}"]`);try{await svc().finalizeAttempt(b.dataset.finalize,Number(input?.value||0));window.SYKA_TOAST.show('Hasil difinalisasi.','success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Finalisasi gagal.','error');}});
  }

  function renderResults(root,rows){const el=root.querySelector('#ws-results-table');if(!el)return;el.innerHTML=(rows||[]).map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>Final ${fmt(r.finalized_at)} · ${esc(r.status)}</small></div><strong>${Number(r.score||0).toLocaleString('id-ID')} pts</strong></div>`).join('')||'<div class="inline-empty">Belum ada hasil final.</div>';}
  function renderAwards(root,rows){const el=root.querySelector('#ws-awards-table');if(!el)return;el.innerHTML=(rows||[]).map(r=>`<div class="data-row"><div><strong>${esc(r.title||'Award')}</strong><small>${esc(r.rank_code||'PARTICIPANT')} · ${esc(r.profiles?.full_name||'Peserta')}</small></div><span class="chip">${Number(r.points||0)} pts</span></div>`).join('')||'<div class="inline-empty">Award akan muncul setelah result event dipublish.</div>';}
  function renderCertificates(root,rows){const el=root.querySelector('#ws-cert-table');if(!el)return;el.innerHTML=(rows||[]).map(r=>`<div class="data-row"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>@${esc(r.profiles?.username||'user')} · Revisi ${esc(r.current_revision||1)} · ${fmt(r.updated_at||r.created_at)}</small></div><span class="status-pill ${U.statusClass(r.status)}">${esc(r.status)}</span></div>`).join('')||'<div class="inline-empty">Belum ada sertifikat yang terbit.</div>';}

  function bindWorkspaceEvents(root,orgId,comp,isNew,banks){
    root.querySelectorAll('[data-ws-nav]').forEach(btn=>btn.onclick=()=>{root.querySelectorAll('[data-ws-nav]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById(btn.dataset.wsNav)?.scrollIntoView({behavior:'smooth',block:'start'}); if(btn.dataset.wsNav==='ws-info') root.querySelector('#ws-title')?.focus();});
    const updateProgress=()=>{
      const checks={
        'ws-info':!!root.querySelector('#ws-title')?.value.trim() && !!root.querySelector('#ws-poster-preview img') && (!!root.querySelector('#ws-juknis-preview .upload-file-meta') || !!root.querySelector('#ws-juknis-preview a') || !!root.querySelector('#ws-juknis-preview embed')),
        'ws-eligibility':root.querySelectorAll('[data-grade-scope]:checked').length>0,
        'ws-timeline':['ws-rs','ws-re','ws-start','ws-end'].every(id=>!!root.querySelector(`[data-dt-value="${id}"]`)?.value),
        'ws-lifecycle':true,
        'ws-twibbon':!!root.querySelector('#ws-tw-name')?.value.trim() && !!root.querySelector('#ws-tw-preview img'),
        'ws-questions':!!root.querySelector('#ws-bank-select')?.value,
        'ws-publish':true
      };
      root.querySelectorAll('[data-ws-nav]').forEach(b=>{const ok=checks[b.dataset.wsNav];b.classList.toggle('is-complete',!!ok);b.classList.toggle('is-required',!ok);const mark=b.querySelector('span');if(mark)mark.textContent=ok?'✓':'✕';});
      const ready=!isNew&&checks['ws-info']&&checks['ws-eligibility']&&checks['ws-timeline']&&checks['ws-twibbon']&&checks['ws-questions']&&((rewards||[]).length>0);
      root.querySelector('#ws-publish-top')?.toggleAttribute('disabled',!ready);
      root.querySelector('#ws-publish-final')?.toggleAttribute('disabled',!ready);
      const label=root.querySelector('.workspace-progress-current');
      if(label){label.textContent=ready?'Siap dipublikasikan':'Lengkapi bagian merah terlebih dahulu';label.className='status-pill '+(ready?'status-success':'status-warning')+' workspace-progress-current';}
      const checklist=root.querySelector('#ws-publish-checklist');
      if(checklist){const labels={info:'Informasi & poster',eligibility:'Eligibility',timeline:'Jadwal',lifecycle:'Status',twibbon:'Template twibbon',questions:'Bank soal',awards:'Hadiah tersedia'};checklist.innerHTML=Object.entries(labels).map(([key,labelText])=>{const map={'info':'ws-info','eligibility':'ws-eligibility','timeline':'ws-timeline','lifecycle':'ws-lifecycle','twibbon':'ws-twibbon','questions':'ws-questions','awards':'__awards'};const ok=key==='awards'?((rewards||[]).length>0):checks[map[key]];return `<div class="publish-check-item ${ok?'ok':'bad'}"><span>${ok?'✓':'!'}</span><strong>${labelText}</strong><small>${ok?'Siap':'Wajib dilengkapi'}</small></div>`}).join('');}
      root.querySelector('#ws-publish-inline')?.toggleAttribute('disabled',!ready);
    };
    root.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',updateProgress));
    root.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('change',updateProgress));
    root.querySelector('#ws-awards-top')?.addEventListener('click',()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'awards',competition:comp.id}));
    root.querySelector('#ws-publish-top')?.addEventListener('click',()=>root.querySelector('#ws-publish-final')?.click());
    root.querySelector('#ws-publish-final')?.addEventListener('click',async()=>{try{await saveWorkspace(root,orgId,comp,isNew);const id=comp.id||window.SYKA_STATE.getState().route.query.competition;if(id&&id!=='new'){await svc().transitionCompetition(id,'PUBLISHED','Publish dari Competition Workspace');window.SYKA_TOAST.show('Kompetisi berhasil dipublikasikan.','success');window.SYKA_ROUTER.refresh();}}catch(e){window.SYKA_TOAST.show(e.message||'Publish gagal.','error');}});
    root.querySelector('#ws-publish-inline')?.addEventListener('click',()=>root.querySelector('#ws-publish-final')?.click());

    root.querySelector('#ws-check-name')?.addEventListener('click',async()=>{const out=root.querySelector('#ws-name-check');out.textContent='Memeriksa ketersediaan nama…';try{const r=await svc().checkCompetitionName(root.querySelector('#ws-title').value.trim(),comp.id||null);out.textContent=r.available?`✓ Nama tersedia · slug otomatis: ${r.slug}`:`✕ ${r.reason}`;out.className=r.available?'field-success':'field-error';}catch(e){out.textContent=e.message||'Gagal memeriksa nama.';out.className='field-error';}});
    let pendingPoster=null,pendingPosterUrl=null,pendingJuknis=null,pendingTwibbon=null,pendingTwibbonUrl=null;
    const saveButtons=[root.querySelector('#ws-save-all'),root.querySelector('#ws-save-all-bottom')].filter(Boolean);
    const posterInput=root.querySelector('#ws-poster-file');
    root.querySelector('#ws-poster-btn')?.addEventListener('click',()=>posterInput.click());
    posterInput?.addEventListener('change',()=>{const f=posterInput.files?.[0];if(!f)return;if(f.size>10000000){window.SYKA_TOAST.show('Poster maksimal 10 MB.','error');return;}pendingPoster=f;pendingPosterUrl=URL.createObjectURL(f);root.querySelector('#ws-poster-preview').innerHTML=`<img src="${pendingPosterUrl}" alt="Poster baru"><div class="upload-file-meta"><strong>${esc(f.name)}</strong><small>Belum diupload. Akan dikirim saat disimpan.</small></div>`;});
    const juknisInput=root.querySelector('#ws-juknis-file');
    root.querySelector('#ws-juknis-btn')?.addEventListener('click',()=>juknisInput.click());
    juknisInput?.addEventListener('change',()=>{const f=juknisInput.files?.[0];if(!f)return;if(f.size>15000000){window.SYKA_TOAST.show('Juknis maksimal 15 MB.','error');return;}pendingJuknis=f;root.querySelector('#ws-juknis-preview').innerHTML=`<div class="upload-file-meta"><strong>${esc(f.name)}</strong><small>Belum diupload. Akan dikirim saat disimpan.</small></div>`;});

    async function saveBasics(){
      const title=root.querySelector('#ws-title').value.trim(); if(!title)throw new Error('Nama kompetisi wajib diisi.'); const nameCheck=await svc().checkCompetitionName(title,comp.id||null); if(!nameCheck.available)throw new Error(nameCheck.reason); const payload={organizer_id:orgId,title,slug:nameCheck.slug,category:root.querySelector('#ws-category').value,visibility:root.querySelector('#ws-visibility').value,short_description:root.querySelector('#ws-short').value.trim()||null};
      let saved=comp.id?await svc().saveCompetition(payload,comp.id):await svc().saveCompetition({...payload,status:'DRAFT'});
      if(pendingPoster){const media=await window.SYKA_CLOUDINARY.uploadFile(pendingPoster,{folder:'sykabelajar/competitions/posters',maxFileSize:10000000});saved=await svc().saveCompetition({poster_url:media.secure_url,poster_public_id:media.public_id||null,poster_width:media.width||null,poster_height:media.height||null,poster_version:media.version||null,poster_resource_type:media.resource_type||'image'},saved.id);}
      if(pendingJuknis){const doc=await window.SYKA_CLOUDINARY.uploadDocumentFile(pendingJuknis,{folder:'sykabelajar/competitions/juknis',maxFileSize:15000000});saved=await svc().saveCompetition({juknis_url:doc.secure_url,juknis_public_id:doc.public_id||null},saved.id);}
      if(isNew)window.history.replaceState({},'',`${location.pathname}?route=/organizer&organizer=${encodeURIComponent(orgId)}&tab=competitions&competition=${encodeURIComponent(saved.id)}`);
      window.SYKA_TOAST.show('Informasi kompetisi tersimpan.','success');return saved;
    }

    saveButtons.forEach(b=>b.onclick=async()=>{try{b.disabled=true;const saved=await saveBasics();window.location.href=location.pathname+`?route=/organizer&organizer=${encodeURIComponent(orgId)}&tab=competitions&competition=${encodeURIComponent(saved.id)}`;}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan kompetisi.','error');}finally{b.disabled=false;}});

    root.querySelector('#ws-save-basic')?.addEventListener('click',async()=>{try{await saveBasics();window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan informasi.','error');}});
    root.querySelector('#ws-save-rules')?.addEventListener('click',async()=>{try{if(!comp.id)throw new Error('Simpan informasi kompetisi terlebih dahulu.');await svc().saveRegistrationRules({allowed_grades:[...root.querySelectorAll('[data-grade-scope]:checked')].map(x=>x.dataset.gradeScope),twibbon_required:root.querySelector('#ws-tw-required').checked,social_proof_required:root.querySelector('#ws-social-required').checked},comp.id);window.SYKA_TOAST.show('Aturan peserta tersimpan.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan aturan.','error');}});
    root.querySelector('#ws-save-timeline')?.addEventListener('click',async()=>{try{if(!comp.id)throw new Error('Simpan informasi kompetisi terlebih dahulu.');await svc().saveCompetition({registration_starts_at:U.readDateTimeField('ws-rs',root),registration_ends_at:U.readDateTimeField('ws-re',root),starts_at:U.readDateTimeField('ws-start',root),ends_at:U.readDateTimeField('ws-end',root),announcement_at:U.readDateTimeField('ws-ann',root)},comp.id);window.SYKA_TOAST.show('Jadwal tersimpan.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal menyimpan jadwal.','error');}});
    root.querySelector('#ws-transition')?.addEventListener('click',async()=>{try{const next=root.querySelector('#ws-next-status').value;if(!next)throw new Error('Pilih status tujuan terlebih dahulu.');await svc().transitionCompetition(comp.id,next,root.querySelector('#ws-transition-reason').value.trim()||null);window.SYKA_TOAST.show(`Status diubah menjadi ${next}.`,'success');window.SYKA_ROUTER.refresh();}catch(e){window.SYKA_TOAST.show(e.message||'Perubahan status gagal.','error');}});


    const twInput=root.querySelector('#ws-tw-file');
    root.querySelector('#ws-tw-upload')?.addEventListener('click',()=>twInput.click());
    twInput?.addEventListener('change',()=>{const f=twInput.files?.[0];if(!f)return;if(f.size>10000000){window.SYKA_TOAST.show('Template maksimal 10 MB.','error');return;}pendingTwibbon=f;pendingTwibbonUrl=URL.createObjectURL(f);root.querySelector('#ws-tw-preview').innerHTML=`<img src="${pendingTwibbonUrl}" alt="Template"><div class="upload-file-meta"><strong>${esc(f.name)}</strong><small>Belum diupload. Akan dikirim saat template disimpan.</small></div>`;});
    root.querySelector('#ws-tw-save')?.addEventListener('click',async()=>{try{if(!comp.id)throw new Error('Simpan informasi kompetisi terlebih dahulu.');if(!pendingTwibbon&&!root.querySelector('#ws-tw-name').value.trim())throw new Error('Nama template wajib diisi.');let media=null;if(pendingTwibbon)media=await window.SYKA_CLOUDINARY.uploadFile(pendingTwibbon,{folder:'sykabelajar/competitions/twibbon',maxFileSize:10000000,formats:['png','jpg','jpeg','webp']});if(media||root.querySelector('#ws-tw-name').value.trim()){await svc().saveTwibbonTemplate({organizer_id:orgId,competition_id:comp.id,name:root.querySelector('#ws-tw-name').value.trim(),image_url:media?.secure_url||null,public_id:media?.public_id||null,is_required:root.querySelector('#ws-tw-required').checked,is_active:true,config:{width:media?.width||null,height:media?.height||null,version:media?.version||null,resource_type:media?.resource_type||'image'}},null);}window.SYKA_TOAST.show('Template twibbon tersimpan.','success');}catch(e){root.querySelector('#ws-tw-feedback').innerHTML=`<div class="inline-error">${esc(e.message||'Gagal menyimpan template.')}</div>`;}});

    root.querySelector('#ws-bank-create')?.addEventListener('click',async()=>{try{const name=root.querySelector('#ws-bank-name').value.trim();if(!name)throw new Error('Nama bank soal wajib diisi.');await svc().saveQuestionBank({organizer_id:orgId,name,description:null,grade_code:root.querySelector('#ws-bank-grade')?.value||null,is_active:true});root.querySelector('#ws-bank-name').value='';await refreshWorkspaceData(root,orgId,comp.id);window.SYKA_TOAST.show('Bank soal dibuat.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Gagal membuat bank soal.','error');}});
    root.querySelector('#ws-bank-bind')?.addEventListener('click',async()=>{const bankId=root.querySelector('#ws-bank-select')?.value;if(!bankId) return; try{const rows=await svc().listQuestions({bankId}); if(!rows.length){window.SYKA_TOAST.show('Bank soal ini belum memiliki pertanyaan.','warning');return;} for(const q of rows){ if(q.competition_id!==comp.id){ await svc().saveQuestion({competition_id:comp.id},q.id); } } window.SYKA_TOAST.show(`${rows.length} soal dikaitkan ke kompetisi.`,'success'); await refreshWorkspaceData(root,orgId,comp.id);}catch(e){window.SYKA_TOAST.show(e.message||'Gagal mengaitkan bank soal.','error');}});
    root.querySelector('#ws-bank-select')?.addEventListener('change',async e=>{const bankId=e.target.value; const bind=root.querySelector('#ws-bank-bind'); if(bind)bind.disabled=!bankId;if(!bankId){await refreshWorkspaceData(root,orgId,comp.id);return;}try{const rows=await svc().listQuestions({bankId});const qList=root.querySelector('#ws-question-list');qList.innerHTML=rows.length?rows.map((q,i)=>`<div class="question-inline-row-v49"><span>${i+1}</span><div><strong>${esc(q.prompt)}</strong><small>${esc(TYPE_META[q.type]?.label||q.type)} · ${Number(q.points||0)} poin · ${q.competition_id?'Terikat kompetisi':'Bank soal umum'}</small></div><button class="btn btn-ghost btn-xs" data-q-delete="${esc(q.id)}">Arsipkan</button></div>`).join(''):'<div class="inline-empty">Belum ada soal dalam bank ini.</div>';qList.querySelectorAll('[data-q-delete]').forEach(b=>b.onclick=async()=>{try{await svc().moderateQuestion(b.dataset.qDelete,'ARCHIVED');b.closest('.question-inline-row-v49')?.remove();window.SYKA_TOAST.show('Soal diarsipkan.','success');}catch(err){window.SYKA_TOAST.show(err.message||'Gagal mengarsipkan soal.','error');}});}catch(err){window.SYKA_TOAST.show(err.message||'Gagal memuat bank soal.','error');}});
    root.querySelector('#ws-q-type')?.addEventListener('change',()=>renderQuestionFields(root,root.querySelector('#ws-q-type').value));
    renderQuestionFields(root,root.querySelector('#ws-q-type')?.value||'multiple_choice');
    root.querySelector('#ws-download-template')?.addEventListener('click',async()=>{try{await downloadQuestionTemplate();}catch(e){window.SYKA_TOAST.show(e.message||'Template gagal dibuat.','error');}});
    root.querySelector('#ws-import-sheet')?.addEventListener('change',async e=>{try{const plan=await svc().listActiveOrganizerPlan(orgId);if(!['PREMIUM','PRO'].includes(plan?.plan_code)){throw new Error('Import Excel tersedia untuk paket Premium dan Pro.');}const file=e.target.files?.[0];if(!file)return;const rows=await parseQuestionSheet(file);const bankId=root.querySelector('#ws-bank-select')?.value;if(!bankId)throw new Error('Pilih bank soal terlebih dahulu.');const imported=await importQuestionRows(rows,bankId,comp.id);window.SYKA_TOAST.show(`${imported} soal berhasil diimport.`,'success');await refreshWorkspaceData(root,orgId,comp.id);}catch(err){window.SYKA_TOAST.show(err.message||'Import gagal.','error');}e.target.value='';});
    root.querySelector('#ws-q-save')?.addEventListener('click',async()=>saveInlineQuestion(root,orgId,comp.id));
    root.querySelector('#ws-participant-filter')?.addEventListener('change',async()=>{const rows=await svc().listRegistrations({competitionId:comp.id,status:''});renderParticipants(root,rows);});
  }

  function renderQuestionFields(root,type){
    const box=root.querySelector('#ws-q-type-fields'); if(!box)return;
    if(type==='true_false'){
      box.innerHTML=`<div class="option-builder-v49"><div class="inline-option-row"><label><input type="radio" name="ws-tf" value="true" checked> Benar</label><label><input type="radio" name="ws-tf" value="false"> Salah</label></div></div>`;
      return;
    }
    if(TYPE_META[type]?.options){
      box.innerHTML=`<div class="option-builder-v49" id="ws-inline-options"><div class="option-builder-head-v49"><strong>Opsi jawaban</strong><small>Pilih satu jawaban benar untuk Pilihan Ganda, atau beberapa untuk Multi-jawaban.</small></div>${['A','B','C','D'].map((l,i)=>`<div class="option-row-v47"><input data-inline-label value="${l}" class="input" placeholder="Label"><input data-inline-value class="input" placeholder="Teks jawaban"><label><input data-inline-correct type="${type==='multiple_checkbox'?'checkbox':'radio'}" name="ws-correct"> Benar</label></div>`).join('')}</div>`;
      return;
    }
    if(type==='short_answer'){
      box.innerHTML=`<div class="option-builder-v49"><label>Jawaban yang diterima<textarea id="ws-short-answers" rows="3" placeholder="Satu jawaban per baris"></textarea></label></div>`;return;
    }
    if(type==='essay'){
      box.innerHTML=`<div class="option-builder-v49"><label>Rubrik penilaian<textarea id="ws-rubric" rows="4" placeholder="Kriteria penilaian essay…"></textarea></label></div>`;return;
    }
    box.innerHTML=`<div class="option-builder-v49"><div class="form-grid-2"><label>Format<select id="ws-file-format"><option value="pdf">PDF</option><option value="image">Gambar</option><option value="document">Dokumen</option><option value="mixed">Campuran</option></select></label><label>Maksimal ukuran (MB)<input id="ws-file-size" type="number" min="1" max="50" value="10"></label></div><label class="checkline"><input id="ws-file-required" type="checkbox" checked> File wajib</label></div>`;
  }

  async function saveInlineQuestion(root,orgId,competitionId){
    try{
      const bankId=root.querySelector('#ws-bank-select').value;
      if(!bankId)throw new Error('Pilih bank soal terlebih dahulu.');
      const type=root.querySelector('#ws-q-type').value;
      const prompt=root.querySelector('#ws-q-prompt').value.trim();
      if(!prompt)throw new Error('Pertanyaan wajib diisi.');
      const config={}; let options=[];
      if(TYPE_META[type]?.options){options=[...root.querySelectorAll('[data-inline-value]')].map((el,i)=>({label:root.querySelectorAll('[data-inline-label]')[i]?.value.trim()||String.fromCharCode(65+i),value:el.value.trim(),is_correct:!!root.querySelectorAll('[data-inline-correct]')[i]?.checked})).filter(x=>x.value);if(options.length<2)throw new Error('Minimal 2 opsi.');const correct=options.filter(x=>x.is_correct).length;if(type==='multiple_choice'||type==='true_false'){if(correct!==1)throw new Error('Pilih tepat satu jawaban benar.');}else if(correct<1)throw new Error('Pilih minimal satu jawaban benar.');config.options=options.map(x=>x.value);}else if(type==='short_answer'){config.accepted_answers=(root.querySelector('#ws-short-answers').value||'').split('\n').map(x=>x.trim()).filter(Boolean);if(!config.accepted_answers.length)throw new Error('Isi minimal satu jawaban yang diterima.');}else if(type==='essay'){config.rubric=root.querySelector('#ws-rubric').value.trim()||null;}else{config.allowed_mime=root.querySelector('#ws-file-format').value;config.max_size_mb=Number(root.querySelector('#ws-file-size').value)||10;config.file_required=root.querySelector('#ws-file-required').checked;}
      const bindToCompetition=root.querySelector('#ws-q-bind-competition')?.checked!==false; const currentQuestions=await svc().listQuestions({bankId}); const q=await svc().saveQuestion({question_bank_id:bankId,competition_id:bindToCompetition?competitionId:null,type,prompt,points:Number(root.querySelector('#ws-q-points').value)||0,required:root.querySelector('#ws-q-required').checked,display_order:currentQuestions.length,status:'DRAFT',config});
      if(options.length)await svc().replaceOptions(q.id,options);
      root.querySelector('#ws-q-prompt').value='';window.SYKA_TOAST.show('Soal tersimpan.','success');await refreshWorkspaceData(root,orgId,competitionId);
    }catch(e){root.querySelector('#ws-q-feedback').innerHTML=`<div class="inline-error">${esc(e.message||'Gagal menyimpan soal.')}</div>`;}
  }

  async function participantsPage(root,orgId,competitionId=null){
    const comps=await svc().listCompetitionsAdmin({organizerId:orgId,limit:100});
    const activeId=competitionId||comps[0]?.id||null;
    root.innerHTML=`<section class="control-section-v410"><div class="control-section-head-v410"><div><span class="eyebrow">PESERTA & PERSETUJUAN</span><h2>Review peserta</h2><p>Pilih program dari daftar. Sistem mengisi konteks kompetisi otomatis.</p></div><label class="context-select-v410">Program<select id="participant-competition-select">${comps.map(c=>`<option value="${esc(c.id)}" ${c.id===activeId?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label></div><div class="participant-toolbar-v410"><select id="participant-status-filter"><option value="">Semua status</option><option value="PENDING">Menunggu persetujuan</option><option value="ACTIVE">Disetujui</option><option value="REJECTED">Ditolak</option></select></div><div id="participants-page-table" class="data-table"></div></section>`;
    async function load(){const id=root.querySelector('#participant-competition-select')?.value;if(!id)return;const status=root.querySelector('#participant-status-filter')?.value||'';const rows=await svc().listRegistrations({competitionId:id,status});const el=root.querySelector('#participants-page-table');el.innerHTML=rows.map(r=>`<div class="data-row organizer-participant-row-v49"><div><strong>${esc(r.profiles?.full_name||'Peserta')}</strong><small>@${esc(r.profiles?.username||'—')} · ${esc(r.profiles?.institution||'')} · ${esc(r.profiles?.grade||'')}</small><small>${esc(r.social_proof_url||'Belum ada social proof')}</small></div><div class="row-actions-v49"><span class="status-pill ${U.statusClass(r.status)}">${esc(r.status)}</span>${r.status==='PENDING'?`<button class="btn btn-secondary btn-sm" data-approve="${esc(r.id)}">Approve</button><button class="btn btn-danger btn-sm" data-reject="${esc(r.id)}">Reject</button>`:''}</div></div>`).join('')||'<div class="inline-empty">Belum ada peserta pada filter ini.</div>';el.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{try{await svc().reviewRegistration(b.dataset.approve,'APPROVE');await load();window.SYKA_TOAST.show('Peserta disetujui.','success');}catch(e){window.SYKA_TOAST.show(e.message||'Approve gagal.','error');}});el.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>rejectParticipant(b.dataset.reject));}
    root.querySelector('#participant-competition-select')?.addEventListener('change',load);root.querySelector('#participant-status-filter')?.addEventListener('change',load);await load();
  }

  async function downloadQuestionTemplate(){
    const rows=[
      ['nomor','soal','A','B','C','D','jawaban'],
      ['1','Contoh pilihan ganda','Opsi A','Opsi B','Opsi C','Opsi D','A'],
      ['2','Contoh benar/salah','Benar','Salah','','','A'],
      ['3','Contoh pilihan ganda 3 opsi','Opsi A','Opsi B','Opsi C','','B'],
      ['4','Contoh multi-jawaban','Opsi A','Opsi B','Opsi C','Opsi D','A,C'],
      ['5','Contoh essay','','','','',''],
      ['6','Contoh isian singkat','','','','','jawaban yang benar']
    ];
    await loadXlsx();
    if(window.XLSX){
      const ws=window.XLSX.utils.aoa_to_sheet(rows); const wb=window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb,ws,'Soal');
      window.XLSX.writeFile(wb,'template-bank-soal-sykabelajar.xlsx'); return;
    }
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='template-bank-soal-sykabelajar.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
  }
  async function parseQuestionSheet(file){
    const text=await file.text();
    if(!/\.(csv|tsv)$/i.test(file.name) && !window.XLSX){await loadXlsx();}
    if(window.XLSX){const wb=window.XLSX.read(await file.arrayBuffer(),{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return window.XLSX.utils.sheet_to_json(ws,{defval:''});}
    const sep=file.name.toLowerCase().endsWith('.tsv')?'\t':',';const lines=text.split(/\r?\n/).filter(Boolean);const heads=lines.shift().split(sep).map(x=>x.replace(/^"|"$/g,''));return lines.map(line=>{const vals=line.split(sep).map(x=>x.replace(/^"|"$/g,''));return Object.fromEntries(heads.map((h,i)=>[h,vals[i]||'']));});
  }
  async function loadXlsx(){if(window.XLSX)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('Library Excel tidak dapat dimuat.'));document.head.appendChild(s);});}
  function inferImportedType(row){const has=['A','B','C','D'].filter(k=>String(row[k]||'').trim()!=='');const answer=String(row.jawaban||'').trim();if(!has.length){return answer?{type:'short_answer',config:{accepted_answers:[answer]}}:{type:'essay',config:{}};}if(has.length===2)return {type:'true_false',config:{options:has.map(k=>String(row[k]).trim()),correct:answer}};if(has.length===3||has.length===4){const answers=answer.split(/[\s,;]+/).filter(Boolean).map(x=>x.toUpperCase());return {type:answers.length>1?'multiple_checkbox':'multiple_choice',config:{answers}};}return {type:'essay',config:{}};}
  async function importQuestionRows(rows,bankId,competitionId){let count=0;for(const row of rows){const prompt=String(row.soal||row.Soal||'').trim();if(!prompt)continue;const inf=inferImportedType(row);const opts=['A','B','C','D'].filter(k=>String(row[k]||'').trim()!=='').map(k=>({label:k,value:String(row[k]).trim(),is_correct:String(row.jawaban||'').toUpperCase().split(/[\s,;]+/).includes(k)}));const q=await svc().saveQuestion({question_bank_id:bankId,competition_id:competitionId||null,type:inf.type,prompt,points:1,required:true,display_order:count,status:'DRAFT',config:inf.config});if(opts.length)await svc().replaceOptions(q.id,opts);count++;}return count;}

  async function notifications(root){
    const a=window.SYKA_STATE.getState().auth;
    const rows=await window.SYKA_NOTIFICATION_SERVICE.list(a.user.id);
    root.innerHTML=`<section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">NOTIFIKASI</span><h2>Notifikasi</h2><p>Event approval, order, grading, dan update workspace.</p></div></div><div class="data-table">${rows.map(n=>`<div class="data-row"><div><strong>${esc(n.title||'Notifikasi')}</strong><small>${esc(n.body||'')} · ${fmt(n.created_at)}</small></div><span class="status-pill ${n.read_at?'status-neutral':'status-success'}">${n.read_at?'Sudah dibaca':'Baru'}</span></div>`).join('')||'<div class="inline-empty">Belum ada notifikasi.</div>'}</div></section>`;
  }

  async function renderPlan(root,orgId,onboarding=false){
    const [active,entitlements,catalog]=await Promise.all([svc().listActiveOrganizerPlan(orgId),svc().listEntitlements(),svc().listPlanCatalog()]);
    const current=active?.plan_code||null;
    const rank={FREE:0,PREMIUM:1,PRO:2};
    const ordered=catalog.filter(p=>!current||((rank[p.plan_code]??0)>=(rank[current]??0)));
    root.innerHTML=`<div class="plan-usage-workspace-v49"><section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">PLAN & USAGE</span><h2>${onboarding?'Pilih paket workspace':`Paket aktif: ${esc(current||'FREE')}`}</h2><p>${current?'Downgrade tidak tersedia untuk self-service. Kamu hanya dapat mempertahankan atau upgrade.':'Pilih paket untuk mengaktifkan workspace.'}</p></div></div><div class="plan-choice-grid-v47">${ordered.map(p=>{const isCurrent=current===p.plan_code;const higher=current&&(rank[p.plan_code]??0)>(rank[current]??0);return `<article class="plan-choice-card-v47 ${p.plan_code==='PREMIUM'?'featured':''} ${isCurrent?'current':''}"><div class="plan-choice-top"><span class="plan-badge ${p.plan_code.toLowerCase()}">${esc(p.badge||p.plan_code)}</span><span>${isCurrent?'DIGUNAKAN':higher?'UPGRADE':'TERSEDIA'}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><strong>${Number(p.monthly_price||0)?`Rp ${Number(p.monthly_price).toLocaleString('id-ID')} / bulan`:'Gratis'}</strong><button class="btn ${isCurrent?'btn-secondary':'btn-primary'} btn-block" ${isCurrent?'disabled':''} data-plan-select="${esc(p.plan_code)}">${isCurrent?'Digunakan':higher||!current?'Pilih paket':'Tidak tersedia'}</button></article>`;}).join('')}</div></section><section class="workspace-section-v49"><div class="workspace-section-head"><div><span class="eyebrow">CAPABILITY</span><h2>Fitur aktif</h2></div></div><div class="plan-entitlement-grid-v46">${entitlements.filter(e=>e.plan_code===current).map(e=>`<div class="entitlement-card-v46"><span>✓</span><div><strong>${esc(e.capability.replaceAll('_',' '))}</strong><small>${e.limit_value==null?'Tanpa batas':`Limit ${Number(e.limit_value).toLocaleString('id-ID')}`}</small></div></div>`).join('')||'<div class="inline-empty">Belum ada paket aktif.</div>'}</div></section></div>`;
    root.querySelectorAll('[data-plan-select]').forEach(b=>b.onclick=()=>window.SYKA_ROUTER.navigate('/organizer',{organizer:orgId,tab:'plan'}));
  }

  window.SYKA_PAGE_ORGANIZER={render};
})();


/* src/pages/Placeholder.js */
(function(){function render(root,title,desc){root.innerHTML=`<div class="placeholder-page"><span class="eyebrow">APPLICATION SURFACE</span><h1>${window.SYKA_UTILS.escapeHtml(title)}</h1><p>${window.SYKA_UTILS.escapeHtml(desc)}</p><div class="syka-card placeholder-box"><b>Shell frontend sudah siap.</b><small>Modul domain berikutnya tinggal menghubungkan service contract ke Supabase RPC / Edge Functions sesuai RPD v4.1.</small></div></div>`;} window.SYKA_PAGE_PLACEHOLDER={render};})();




/* src/core/router.js */
(function(){
  const routes=[
    {name:'home',match:p=>p==='/'||p==='/home'},
    {name:'lomba',match:p=>p==='/lomba'},
    {name:'competition',match:p=>/^\/lomba\/[^/]+$/.test(p)},
    {name:'registration',match:p=>/^\/lomba\/[^/]+\/daftar$/.test(p)},
    {name:'attempt',match:p=>/^\/ujian\/[^/]+$/.test(p)},
    {name:'leaderboard',match:p=>p==='/juara'},
    {name:'awards',match:p=>p==='/prestasi'},
    {name:'profile',match:p=>p==='/profile'},
    {name:'orders',match:p=>p==='/pesanan'},
    {name:'store',match:p=>p==='/toko'||p==='/shop'},
    {name:'tasks',match:p=>p==='/tugas'||p==='/misi'},
    {name:'notifications',match:p=>p==='/notifikasi'},
    {name:'organizer',match:p=>p==='/organizer'},
    {name:'admin',match:p=>p==='/admin'},
    {name:'verify',match:p=>/^\/verifikasi\/[^/]+$/.test(p)},
  ];
  function parse(path){
    const clean=decodeURIComponent((path||'/').split('?')[0].replace(/\/+$/,'')||'/');
    const found=routes.find(r=>r.match(clean));
    if(!found)return {name:'not_found',params:{},query:window.SYKA_UTILS.queryParams()};
    const seg=clean.split('/').filter(Boolean);const params={};
    if(found.name==='competition'||found.name==='registration')params.slug=seg[1];
    if(found.name==='attempt')params.attemptId=seg[1];
    if(found.name==='verify')params.code=seg[1];
    return {name:found.name,params,query:window.SYKA_UTILS.queryParams()};
  }
  function href(path,query={}){const cfg=window.SYKA_CONFIG;const u=new URL(window.location.href);u.pathname=cfg.APP_PAGE;u.search='';u.hash='';u.searchParams.set('route',path);Object.entries(query||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')u.searchParams.set(k,String(v));});return u.pathname+u.search;}
  function navigate(path,query={}){history.pushState({},'',href(path,query));return render();}
  async function render(){
    const parsed=parse(window.SYKA_UTILS.routePath());window.SYKA_STATE.patch('route',parsed);
    window.SYKA_SIDEBAR?.render?.();window.SYKA_HEADER?.render?.();window.SYKA_BOTTOMNAV?.render?.();
    const fallback=document.getElementById('blogger-content');if(fallback)fallback.style.display=parsed.name==='not_found'?'block':'none';
    const root=document.getElementById('page-root');if(!root)return;root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div><span>Memuat halaman…</span></div>';
    try{
      if(parsed.name==='home')return await window.SYKA_PAGE_HOME.render(root);
      if(parsed.name==='lomba')return await window.SYKA_PAGE_LOMBA.render(root);
      if(parsed.name==='competition')return await window.SYKA_PAGE_COMPETITION.render(root,parsed.params.slug);
      if(parsed.name==='registration')return await window.SYKA_PAGE_REGISTRATION.render(root,parsed.params.slug);
      if(parsed.name==='profile')return await window.SYKA_PAGE_PROFILE.render(root);
      if(parsed.name==='leaderboard')return await window.SYKA_PAGE_LEADERBOARD.render(root);
      if(parsed.name==='awards')return await window.SYKA_PAGE_AWARDS.render(root);
      if(parsed.name==='orders')return await window.SYKA_PAGE_ORDERS.render(root);
      if(parsed.name==='store')return await window.SYKA_PAGE_STORE.render(root);if(parsed.name==='tasks')return await window.SYKA_PAGE_TASKS.render(root);if(parsed.name==='notifications')return await window.SYKA_PAGE_NOTIFICATIONS.render(root);
      if(parsed.name==='attempt')return await window.SYKA_PAGE_ATTEMPT.render(root,parsed.params.attemptId);
      if(parsed.name==='verify')return await window.SYKA_PAGE_VERIFY.render(root,parsed.params.code);
      if(parsed.name==='organizer')return await window.SYKA_PAGE_ORGANIZER.render(root);
      if(parsed.name==='admin')return await window.SYKA_PAGE_ADMIN.render(root);
      return window.SYKA_PAGE_PLACEHOLDER.render(root,'Halaman tidak ditemukan','Route aplikasi tidak dikenali. Gunakan navigasi Sykabelajar untuk kembali ke halaman yang tersedia.');
    }catch(error){console.error('[Sykabelajar] route render failed',error);root.innerHTML=window.SYKA_EMPTY.render({title:'Halaman gagal dimuat',text:error.message||'Terjadi kesalahan saat memuat halaman.',actionHtml:'<button class="btn btn-primary" id="route-retry">Coba lagi</button>'});document.getElementById('route-retry')?.addEventListener('click',()=>render());}
  }
  function refresh(){return render();}
  window.addEventListener('popstate',render);window.addEventListener('hashchange',render);window.SYKA_ROUTER={parse,href,navigate,render,refresh};
})();


/* src/core/app.js */
(function(){
  let authSubscription=null;let authBootstrapped=false;
  async function bootstrapAuth(){
    if(authBootstrapped)return;authBootstrapped=true;const client=window.SYKA_SUPABASE.get();
    const result=client.auth.onAuthStateChange((event,session)=>{if(event==='INITIAL_SESSION'&&!session)return;setTimeout(()=>hydrate(session,event),0);});
    authSubscription=result?.data?.subscription||null;
    try{const session=await window.SYKA_AUTH_SERVICE.getSession();if(session)await hydrate(session,'SESSION_RESTORED');else{window.SYKA_STATE.patch('auth.status','anonymous');refreshAuthChrome();}}
    catch(error){console.warn('[Sykabelajar] session bootstrap',error);const current=window.SYKA_STATE.getState();if(!current.auth.user){window.SYKA_STATE.patch('auth.status','anonymous');refreshAuthChrome();}}
  }
  function refreshAuthChrome(){window.SYKA_SIDEBAR?.render?.();window.SYKA_HEADER?.render?.();window.SYKA_BOTTOMNAV?.render?.();}
  async function hydrate(session,event){const current=window.SYKA_STATE.getState();
    if(session?.user){
      window.SYKA_STATE.patch('auth.session',session);window.SYKA_STATE.patch('auth.user',session.user);window.SYKA_STATE.patch('auth.status','authenticated');
      try{const [profile,roles]=await Promise.all([window.SYKA_PROFILE_SERVICE.getMe(session.user.id),window.SYKA_PROFILE_SERVICE.getRoles(session.user.id)]);window.SYKA_STATE.patch('auth.profile',profile);window.SYKA_STATE.patch('auth.roles',roles.roles||[]);window.SYKA_STATE.patch('auth.permissions',roles.permissions||[]);}catch(error){console.warn('[Sykabelajar] profile hydration',error);}
      refreshAuthChrome();if(event==='PASSWORD_RECOVERY')window.SYKA_APP.openPasswordRecovery?.();return;
    }
    if(event==='SIGNED_OUT'){window.SYKA_STATE.resetUserState();refreshAuthChrome();}
    else if(!current.auth.user){window.SYKA_STATE.patch('auth.status','anonymous');refreshAuthChrome();}
  }
  function openAuth(mode='login',opts={}){
    const target=opts.target||window.SYKA_UTILS.routePath();
    const isRegister=mode==='register';
    const classes=[['SD4','Kelas 4 SD'],['SD5','Kelas 5 SD'],['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
    const gradeOptions=classes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    const registerHtml=isRegister?`
      <div class="account-type-grid">
        <button type="button" class="account-type-card active" data-account-type="student"><span class="account-type-icon">🎓</span><span><strong>Pelajar / Peserta</strong><small>Ikut lomba, bangun prestasi, dan gunakan Koin Edu.</small></span></button>
        <button type="button" class="account-type-card" data-account-type="teacher"><span class="account-type-icon">📚</span><span><strong>Guru</strong><small>Pendamping peserta dan kontributor bank soal.</small></span></button>
        <button type="button" class="account-type-card" data-account-type="organizer"><span class="account-type-icon">🏢</span><span><strong>Penyelenggara</strong><small>Membuat lomba dan mengelola peserta.</small></span></button>
      </div>
      <input type="hidden" id="auth-account-type" value="student">
      <div id="account-form-student" class="account-form-panel">
        <div class="form-grid-2"><label>Nama lengkap *<input id="auth-name" autocomplete="name"></label><label>Username *<input id="auth-username" autocomplete="username" pattern="[A-Za-z0-9._-]{3,30}"><small class="field-help">3–30 karakter, tanpa spasi.</small></label></div>
        <div class="form-grid-2"><label>Email *<input id="auth-email" type="email" autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" minlength="8" autocomplete="new-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div><small class="field-help">Minimal 8 karakter.</small></label></div>
        <div class="form-grid-2"><label>Tanggal lahir *${window.SYKA_UTILS.calendarPickerMarkup("auth-birth","",{placeholder:"Pilih tanggal lahir"})}</label><label>Kelas *<select id="auth-grade">${gradeOptions}</select></label></div>
        <div class="form-grid-2"><label>Sekolah *<input id="auth-school" placeholder="Ketik nama sekolah"></label><label>Pembina / guru pendamping<input id="auth-guardian" placeholder="Opsional"></label></div>
        <div id="auth-school-suggest" class="suggest-list hidden"></div>
      </div>
      <div id="account-form-teacher" class="account-form-panel hidden">
        <div class="form-grid-2"><label>Nama lengkap *<input id="teacher-name"></label><label>Username *<input id="teacher-username" pattern="[A-Za-z0-9._-]{3,30}"></label></div>
        <div class="form-grid-2"><label>Email *<input id="teacher-email" type="email" autocomplete="email"></label><label>Password *<div class="password-field"><input id="teacher-password" type="password" minlength="8" autocomplete="new-password"><button type="button" class="password-toggle" data-target="teacher-password">Lihat</button></div></label></div>
        <div class="form-grid-2"><label>Sekolah / Institusi *<input id="teacher-school" placeholder="Nama sekolah / institusi"></label><label>Tanggal lahir *${window.SYKA_UTILS.calendarPickerMarkup("teacher-birth","",{placeholder:"Pilih tanggal lahir"})}</label></div><div class="form-grid-2"><label>Bidang / mapel<input id="teacher-subjects" placeholder="Contoh: IPA, Matematika"></label><label>Bio singkat<input id="teacher-bio" placeholder="Contoh: Guru IPA kelas SMP"></label></div>
        <div class="form-hint">Kontak WhatsApp tidak diminta saat daftar. Setelah akun aktif, gunakan menu Bantuan untuk menghubungi Admin.</div>
      </div>
      <div id="account-form-organizer" class="account-form-panel hidden">
        <div class="form-grid-2"><label>Nama penanggung jawab *<input id="org-name"></label><label>Username *<input id="org-username" pattern="[A-Za-z0-9._-]{3,30}"></label></div>
        <div class="form-grid-2"><label>Email *<input id="org-email" type="email" autocomplete="email"></label><label>Password *<div class="password-field"><input id="org-password" type="password" minlength="8" autocomplete="new-password"><button type="button" class="password-toggle" data-target="org-password">Lihat</button></div></label></div>
        <div class="form-grid-2"><label>Nama organisasi / penyelenggara *<input id="org-organization" placeholder="Contoh: Sykabelajar Academy"></label><label>Tanggal lahir *${window.SYKA_UTILS.calendarPickerMarkup("org-birth","",{placeholder:"Pilih tanggal lahir"})}</label></div>
        <div class="form-hint">Kontak WhatsApp tidak diminta saat daftar. Setelah akun aktif, penyelenggara dapat menghubungi Admin melalui menu Bantuan.</div>
        <div class="form-hint">Workspace akan dibuat otomatis. Paket Free, Premium, atau Pro dipilih setelah akun aktif.</div>
      </div>
      <div class="auth-consent"><span>🔒</span><small>Role dan permission ditentukan server. Pilihan di atas menentukan onboarding akun.</small></div>
    `:`<div class="form-grid-2"><label>Email *<input id="auth-email" type="email" autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" minlength="8" autocomplete="current-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><button type="button" class="link-button" id="forgot-password">Lupa password?</button>`;

    window.SYKA_MODAL.open({title:isRegister?'Buat akun Sykabelajar':'Masuk ke Sykabelajar',wide:true,html:`<div class="auth-tabs"><button type="button" class="auth-tab ${!isRegister?'active':''}" data-mode="login">Masuk</button><button type="button" class="auth-tab ${isRegister?'active':''}" data-mode="register">Daftar</button></div><form id="auth-form" class="form-card auth-form">${registerHtml}<button class="btn btn-primary btn-block" type="submit">${isRegister?'Buat akun':'Masuk'}</button><div id="auth-feedback"></div></form>`,onOpen:body=>{
      body.querySelectorAll('.auth-tab').forEach(btn=>btn.onclick=()=>openAuth(btn.dataset.mode,opts));
      body.querySelectorAll('.password-toggle').forEach(btn=>btn.onclick=()=>{const input=body.querySelector('#'+btn.dataset.target);input.type=input.type==='password'?'text':'password';btn.textContent=input.type==='password'?'Lihat':'Sembunyikan';});

      if(isRegister){
        const typeInput=body.querySelector('#auth-account-type');
        const cards=body.querySelectorAll('[data-account-type]');
        const panels={student:body.querySelector('#account-form-student'),teacher:body.querySelector('#account-form-teacher'),organizer:body.querySelector('#account-form-organizer')};
        const req={
          student:['auth-name','auth-username','auth-email','auth-password','auth-birth','auth-grade','auth-school'],
          teacher:['teacher-name','teacher-username','teacher-email','teacher-password','teacher-school','teacher-birth'],
          organizer:['org-name','org-username','org-email','org-password','org-organization','org-birth']
        };
        const setType=(type)=>{
          typeInput.value=type;
          cards.forEach(card=>card.classList.toggle('active',card.dataset.accountType===type));
          Object.entries(panels).forEach(([key,panel])=>panel?.classList.toggle('hidden',key!==type));
          body.querySelectorAll('.account-form-panel input,.account-form-panel select').forEach(el=>el.removeAttribute('required'));
          (req[type]||[]).forEach(id=>body.querySelector('#'+id)?.setAttribute('required','required'));
        };
        cards.forEach(card=>card.onclick=()=>setType(card.dataset.accountType));
        setType('student');
        window.SYKA_UTILS.bindCalendarPickers(body);

        const school=body.querySelector('#auth-school'),suggest=body.querySelector('#auth-school-suggest');let timer;
        school?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(r=>`<button type="button" data-name="${window.SYKA_UTILS.escapeHtml(r.name)}"><b>${window.SYKA_UTILS.escapeHtml(r.name)}</b><small>${window.SYKA_UTILS.escapeHtml([r.city,r.province].filter(Boolean).join(' · '))}</small></button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},220);});
      }

      body.querySelector('#auth-form').onsubmit=async e=>{
        e.preventDefault();const button=e.currentTarget.querySelector('button[type="submit"]');const feedback=body.querySelector('#auth-feedback');button.disabled=true;button.innerHTML='<span class="spinner"></span> Memproses…';
        try{
          if(!isRegister){
            await window.SYKA_AUTH_SERVICE.signIn({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value});
            window.SYKA_MODAL.close();window.SYKA_TOAST.show('Login berhasil.','success');setTimeout(()=>window.SYKA_ROUTER.navigate(target||'/profile'),0);
          }else{
            const type=body.querySelector('#auth-account-type').value;
            const data=type==='student'?{
              email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value,fullName:body.querySelector('#auth-name').value.trim(),username:body.querySelector('#auth-username').value.trim().toLowerCase(),accountType:'student',grade:body.querySelector('#auth-grade').value,birthDate:body.querySelector('#auth-birth').value,institution:body.querySelector('#auth-school').value.trim().toUpperCase(),guardianName:body.querySelector('#auth-guardian').value.trim()||null
            }:type==='teacher'?{
              email:body.querySelector('#teacher-email').value.trim(),password:body.querySelector('#teacher-password').value,fullName:body.querySelector('#teacher-name').value.trim(),username:body.querySelector('#teacher-username').value.trim().toLowerCase(),accountType:'teacher',birthDate:body.querySelector('#teacher-birth').value,institution:body.querySelector('#teacher-school').value.trim().toUpperCase(),subjects:body.querySelector('#teacher-subjects').value.trim()||null,guardianName:body.querySelector('#teacher-bio').value.trim()||null
            }:{
              email:body.querySelector('#org-email').value.trim(),password:body.querySelector('#org-password').value,fullName:body.querySelector('#org-name').value.trim(),username:body.querySelector('#org-username').value.trim().toLowerCase(),accountType:'organizer',birthDate:body.querySelector('#org-birth').value,organizerName:body.querySelector('#org-organization').value.trim(),organizerSlug:body.querySelector('#org-organization').value.trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,50)
            };
            const authResult=await window.SYKA_AUTH_SERVICE.signUp(data);window.SYKA_MODAL.close();
            if(authResult.session){window.SYKA_TOAST.show('Akun berhasil dibuat.','success');window.SYKA_ROUTER.navigate(target||(type==='organizer'?'/organizer':'/profile'));}else window.SYKA_MODAL.open({title:'Cek email',html:`<div class="success-panel"><div class="success-icon">✉</div><h3>Konfirmasi email</h3><p>Akun ${type} berhasil dibuat. Cek inbox untuk verifikasi email sebelum masuk.</p></div>`});
          }
        }catch(error){button.disabled=false;button.textContent=isRegister?'Buat akun':'Masuk';feedback.innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(error.message||'Terjadi kesalahan.')}</div>`;}
      };
      body.querySelector('#forgot-password')?.addEventListener('click',openForgotPassword);
    }});
  }

  function openForgotPassword(){window.SYKA_MODAL.open({title:'Reset password',html:`<form id="forgot-form" class="form-card"><label>Email<input id="forgot-email" type="email" required placeholder="nama@email.com"></label><button class="btn btn-primary btn-block">Kirim link reset</button><div id="forgot-feedback"></div></form>`,onOpen:body=>body.querySelector('#forgot-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.resetPassword(body.querySelector('#forgot-email').value.trim());window.SYKA_MODAL.close();window.SYKA_TOAST.show('Link reset password dikirim jika email terdaftar.','success');}catch(error){body.querySelector('#forgot-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(error.message)}</div>`;}}});}
  function openPasswordRecovery(){window.SYKA_MODAL.open({title:'Buat password baru',html:`<form id="recovery-form" class="form-card"><label>Password baru<div class="password-field"><input id="new-password" type="password" minlength="6" required><button class="password-toggle" type="button" data-target="new-password">Lihat</button></div></label><button class="btn btn-primary btn-block">Simpan password</button><div id="recovery-feedback"></div></form>`,onOpen:body=>{body.querySelector('.password-toggle').onclick=()=>{const i=body.querySelector('#new-password');i.type=i.type==='password'?'text':'password';body.querySelector('.password-toggle').textContent=i.type==='password'?'Lihat':'Sembunyikan';};body.querySelector('#recovery-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.updatePassword(body.querySelector('#new-password').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Password berhasil diperbarui.','success');}catch(error){body.querySelector('#recovery-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(error.message)}</div>`;}};}});}
  async function logout(){try{await window.SYKA_AUTH_SERVICE.signOut();window.SYKA_ROUTER.navigate('/');}catch(error){window.SYKA_TOAST.show(error.message||'Logout gagal.','error');}}
  function toggleTheme(){const current=document.documentElement.dataset.theme==='dark'?'dark':'light';const next=current==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('syka_theme',next);window.SYKA_STATE.patch('ui.theme',next);}
  function setTheme(theme){const t=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=t;window.SYKA_STATE.patch('ui.theme',t);}
  function toggleSidebar(){const collapsed=document.body.classList.toggle('sidebar-collapsed');localStorage.setItem('syka_sidebar',collapsed?'0':'1');const btn=document.getElementById('sidebar-collapse');if(btn)btn.textContent=collapsed?'›':'‹';}
  function toggleMobileNav(){const open=document.body.classList.toggle('mobile-nav-open');const overlay=document.getElementById('mobile-nav-overlay');if(overlay)overlay.classList.toggle('visible',open);}
  function bindInternalNavigation(){if(window.__SYKA_INTERNAL_NAV_BOUND)return;window.__SYKA_INTERNAL_NAV_BOUND=true;document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const raw=a.getAttribute('href');if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:'))return;try{const u=new URL(raw,window.location.href);if(u.origin!==window.location.origin)return;if(u.pathname===(window.SYKA_CONFIG?.APP_PAGE||'/p/app.html')){e.preventDefault();const route=u.searchParams.get('route')||window.SYKA_UTILS.routePath();const query={};u.searchParams.forEach((value,key)=>{if(key!=='route')query[key]=value;});window.SYKA_ROUTER.navigate(route||'/',query);}}catch(_){}});}
  function init(){if(window.__SYKA_APP_INITIALIZED)return;window.__SYKA_APP_INITIALIZED=true;bindInternalNavigation();setTheme(window.SYKA_UTILS.getStoredTheme());if(localStorage.getItem('syka_sidebar')==='0')document.body.classList.add('sidebar-collapsed');window.SYKA_SIDEBAR.render();window.SYKA_HEADER.render();window.SYKA_BOTTOMNAV.render();window.__SYKA_AUTH_UI_UNSUB=window.SYKA_STATE.subscribe((state,path)=>{if(path?.startsWith('auth.'))refreshAuthChrome();});document.getElementById('mobile-nav-overlay')?.addEventListener('click',toggleMobileNav);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('mobile-nav-open'))toggleMobileNav();});
  if(!window.__SYKA_MOBILE_OUTSIDE_BOUND){window.__SYKA_MOBILE_OUTSIDE_BOUND=true;document.addEventListener('click',e=>{if(window.innerWidth>800)return;const side=document.getElementById('syka-sidebar');const trigger=document.getElementById('mobile-menu-btn');if(document.body.classList.contains('mobile-nav-open')&&!side?.contains(e.target)&&!trigger?.contains(e.target))toggleMobileNav();});}window.addEventListener('online',()=>window.SYKA_STATE.patch('network.online',true));window.addEventListener('offline',()=>{window.SYKA_STATE.patch('network.online',false);window.SYKA_TOAST.show('Koneksi internet terputus.','warning');});bootstrapAuth().finally(()=>window.SYKA_ROUTER.render());}
  window.SYKA_APP={init,openAuth,openForgotPassword,openPasswordRecovery,logout,toggleTheme,toggleSidebar,toggleMobileNav,disposeAuth:()=>authSubscription?.unsubscribe?.()};
})();


/* src/sykabelajar-v2/bootstrap.js */
(function () {
  if (window.__SYKA_V2_BOOTSTRAP__) return;
  window.__SYKA_V2_BOOTSTRAP__ = true;

  const legacyInit = window.SYKA_APP?.init;
  window.__SYKA_LEGACY_APP_INIT__ = legacyInit || null;

  window.SYKA_V2_BOOTSTRAP = async function () {
    if (window.SYKA_V2_RUNTIME?.start) {
      return window.SYKA_V2_RUNTIME.start();
    }
    throw new Error('Sykabelajar V2 runtime belum dimuat.');
  };
}());


/* src/sykabelajar-v2/runtime/v2-runtime.js */
(function () {
  const V2_PREFIX = '__SYKA_V2_ACTIVE__';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const routePath = () => window.SYKA_UTILS?.routePath?.() || '/';
  const client = () => window.SYKA_SUPABASE?.get?.();
  const isV2Route = (route) => /^\/(login|register|student|dashboard|profile|organizer|admin|competitions|competition)(\/|$)/.test(route) || route === '/' || route === '/home';
  const getRole = async (userId) => {
    try {
      const result = await client().from('user_roles').select('role_id, roles(name)').eq('user_id', userId);
      const role = result?.data?.[0]?.roles?.name || result?.data?.[0]?.role || 'student';
      return String(role).toLowerCase();
    } catch (_) { return 'student'; }
  };
  const ensureRoot = () => document.getElementById('page-root');
  const navigate = (route) => {
    const cfg = window.SYKA_CONFIG || {};
    const u = new URL(window.location.href);
    u.pathname = cfg.APP_PAGE || '/';
    u.search = '';
    u.hash = '';
    u.searchParams.set('route', route);
    history.pushState({}, '', u.pathname + u.search);
    renderCurrent();
  };
  const layout = (content, opts = {}) => `
    <div class="sy-v2-shell">
      <nav class="sy-v2-nav">
        <div class="sy-v2-brand"><button class="sy-v2-ghost" data-route="/">SYKA<span>belajar</span></button></div>
        <div class="sy-v2-navlinks">
          <button data-route="/competitions">Kompetisi</button>
          <button data-route="/student">Belajar</button>
          <button data-route="/organizer">Organizer</button>
        </div>
        <div class="sy-v2-actions">${opts.authenticated ? '<button class="sy-v2-btn secondary" data-route="/student">Dashboard</button>' : '<button class="sy-v2-btn secondary" data-route="/login">Masuk</button>'}<button class="sy-v2-btn primary" data-route="/register">Daftar</button></div>
      </nav>
      <main class="sy-v2-container">${content}</main>
      <footer class="sy-v2-footer"><div class="sy-v2-container">Sykabelajar · Platform kompetisi dan edukasi</div></footer>
    </div>`;
  const bind = () => {
    document.querySelectorAll('[data-route]').forEach((el) => el.addEventListener('click', () => navigate(el.dataset.route)));
    document.querySelectorAll('[data-action="login"]').forEach((el) => el.addEventListener('click', () => navigate('/login')));
  };
  const render = (html, opts) => { const root = ensureRoot(); if (!root) return; root.innerHTML = layout(html, opts); bind(); };
  const getSession = async () => { try { return await window.SYKA_AUTH_SERVICE?.getSession?.(); } catch (_) { return null; } };

  async function landing() {
    let slides = [], competitions = [];
    try {
      const c = client();
      const [s, comp] = await Promise.all([
        c.from('home_slides').select('*').order('sort_order', { ascending: true }).limit(5),
        c.from('competitions').select('*').order('created_at', { ascending: false }).limit(6)
      ]);
      slides = s.data || []; competitions = comp.data || [];
    } catch (_) {}
    render(`
      <section class="sy-v2-hero"><div class="sy-v2-hero-grid"><div><span class="sy-v2-kicker">PLATFORM KOMPETISI & EDUKASI</span><h1 class="sy-v2-title">Belajar. Bertanding. Berkembang.</h1><p class="sy-v2-lead">Temukan kompetisi, bangun prestasi, kumpulkan XP, raih achievement, dan buktikan perjalanan belajarmu dalam satu ekosistem.</p><div class="sy-v2-actions"><button class="sy-v2-btn primary" data-route="/register">Mulai Sekarang</button><button class="sy-v2-btn secondary" data-route="/competitions">Lihat Kompetisi</button></div></div><div class="sy-v2-panel"><div class="sy-v2-muted">Kompetisi terbaru</div><h3>${escapeHtml(competitions[0]?.title || competitions[0]?.name || 'Kompetisi Sykabelajar')}</h3><p class="sy-v2-muted">${escapeHtml(competitions[0]?.description || 'Ikuti event edukasi yang sedang dibuka.')}</p><div class="sy-v2-meta"><span class="sy-v2-chip">Competition</span><span class="sy-v2-chip">Certificate</span></div></div></div></section>
      <section class="sy-v2-section"><h2>Kompetisi Terbaru</h2><div class="sy-v2-grid">${competitions.length ? competitions.map((x) => `<article class="sy-v2-card"><h3>${escapeHtml(x.title || x.name || 'Kompetisi')}</h3><p class="sy-v2-muted">${escapeHtml(x.description || x.summary || 'Kompetisi edukasi Sykabelajar.')}</p><div class="sy-v2-meta"><span class="sy-v2-chip">${escapeHtml(x.status || 'published')}</span><button class="sy-v2-btn secondary" data-route="/competitions">Detail</button></div></article>`).join('') : '<div class="sy-v2-empty">Belum ada kompetisi aktif.</div>'}</div></section>
      ${slides.length ? `<section class="sy-v2-section"><h2>Highlight</h2><div class="sy-v2-grid">${slides.slice(0,3).map((x) => `<article class="sy-v2-card"><h3>${escapeHtml(x.title || x.heading || 'Sykabelajar')}</h3><p class="sy-v2-muted">${escapeHtml(x.subtitle || x.description || '')}</p></article>`).join('')}</div></section>` : ''}
      <section class="sy-v2-section"><h2>Satu ekosistem untuk berkembang</h2><div class="sy-v2-grid"><article class="sy-v2-card"><h3>Competition</h3><p class="sy-v2-muted">Ikuti kompetisi dan ukur kemampuanmu.</p></article><article class="sy-v2-card"><h3>Achievement</h3><p class="sy-v2-muted">Kumpulkan XP, badge, dan penghargaan.</p></article><article class="sy-v2-card"><h3>Certificate</h3><p class="sy-v2-muted">Simpan bukti prestasi digitalmu.</p></article></div></section>
      <section class="sy-v2-section"><div class="sy-v2-panel"><h2>Bangun kompetisimu sendiri</h2><p class="sy-v2-muted">Organizer dapat membuat event, mengelola peserta, dan menjalankan sistem kompetisi dalam satu workspace.</p><button class="sy-v2-btn primary" data-route="/organizer">Masuk sebagai Organizer</button></div></section>
    `, { authenticated: !!(await getSession()) });
  }

  async function auth(mode) {
    const title = mode === 'register' ? 'Buat akun Sykabelajar' : 'Masuk ke Sykabelajar';
    const extra = mode === 'register' ? `<div class="sy-v2-field"><label>Tipe akun</label><select id="v2-account-type"><option value="student">Pelajar / Peserta</option><option value="teacher">Guru</option><option value="organizer">Penyelenggara</option></select></div><div class="sy-v2-field"><label>Nama lengkap</label><input id="v2-name" required></div><div class="sy-v2-field"><label>Username</label><input id="v2-username" required></div>` : '';
    render(`<section class="sy-v2-form"><h1>${title}</h1><div id="v2-auth-feedback"></div><form id="v2-auth-form">${extra}<div class="sy-v2-field"><label>Email</label><input id="v2-email" type="email" required></div><div class="sy-v2-field"><label>Password</label><input id="v2-password" type="password" minlength="8" required></div>${mode==='register'?'<div class="sy-v2-field"><label>Sekolah / Institusi</label><input id="v2-institution"></div>':''}<button class="sy-v2-btn primary" type="submit">${mode==='register'?'Buat akun':'Masuk'}</button></form><p class="sy-v2-muted">${mode==='register'?'Sudah punya akun?':'Belum punya akun?'} <button class="sy-v2-ghost" data-route="/${mode==='register'?'login':'register'}">${mode==='register'?'Masuk':'Daftar'}</button></p></section>`, { authenticated:false });
    const form = document.getElementById('v2-auth-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault(); const btn = form.querySelector('button[type=submit]'); const feedback = document.getElementById('v2-auth-feedback'); btn.disabled = true;
      try {
        if (mode === 'login') {
          await window.SYKA_AUTH_SERVICE.signIn({ email: document.getElementById('v2-email').value.trim(), password: document.getElementById('v2-password').value });
          navigate('/student');
        } else {
          const type = document.getElementById('v2-account-type').value;
          await window.SYKA_AUTH_SERVICE.signUp({ email: document.getElementById('v2-email').value.trim(), password: document.getElementById('v2-password').value, fullName: document.getElementById('v2-name').value.trim(), username: document.getElementById('v2-username').value.trim(), accountType:type, institution: document.getElementById('v2-institution').value.trim() });
          feedback.innerHTML = '<div class="sy-v2-success">Akun berhasil dibuat. Silakan cek email bila verifikasi diperlukan.</div>';
          btn.disabled = false;
          return;
        }
      } catch (error) { feedback.innerHTML = `<div class="sy-v2-error">${escapeHtml(error.message || 'Autentikasi gagal.')}</div>`; }
      btn.disabled = false;
    });
  }

  async function student() {
    const session = await getSession(); if (!session) return navigate('/login');
    const uid = session.user.id; let profile = null, achievements = [], xp = 0, coins = 0, registrations = [];
    try {
      const c = client();
      const [p,a,x,co,r] = await Promise.all([
        c.from('profiles').select('*').eq('id', uid).single(),
        c.from('user_achievements').select('*').eq('user_id', uid),
        c.from('xp_ledger').select('amount').eq('user_id', uid),
        c.from('edu_coin_ledger').select('amount').eq('user_id', uid),
        c.from('registrations').select('*').eq('user_id', uid).limit(6)
      ]);
      profile=p.data; achievements=a.data||[]; xp=(x.data||[]).reduce((s,i)=>s+Number(i.amount||0),0); coins=(co.data||[]).reduce((s,i)=>s+Number(i.amount||0),0); registrations=r.data||[];
    } catch (_) {}
    render(`<section class="sy-v2-dashboard"><h1>Halo, ${escapeHtml(profile?.full_name || profile?.name || session.user.email || 'Student')}</h1><p class="sy-v2-muted">Lanjutkan perjalanan belajar dan kompetisimu.</p><div class="sy-v2-statgrid"><div class="sy-v2-stat"><small>XP</small><strong>${xp}</strong></div><div class="sy-v2-stat"><small>Edu Coin</small><strong>${coins}</strong></div><div class="sy-v2-stat"><small>Achievement</small><strong>${achievements.length}</strong></div><div class="sy-v2-stat"><small>Kompetisi</small><strong>${registrations.length}</strong></div></div><section class="sy-v2-section"><h2>Aksi cepat</h2><div class="sy-v2-grid"><article class="sy-v2-card"><h3>Kompetisi</h3><p class="sy-v2-muted">Cari dan ikuti kompetisi terbaru.</p><button class="sy-v2-btn primary" data-route="/competitions">Buka Competition</button></article><article class="sy-v2-card"><h3>Profil</h3><p class="sy-v2-muted">Kelola profil dan pengaturan akun.</p></article><article class="sy-v2-card"><h3>Certificate</h3><p class="sy-v2-muted">Sertifikat prestasi digitalmu.</p></article></div></section></section>`, {authenticated:true});
  }

  async function competitions() {
    let items=[]; try { const r=await client().from('competitions').select('*').order('created_at',{ascending:false}).limit(30); items=r.data||[]; } catch (_) {}
    render(`<section class="sy-v2-section"><h1>Competition Center</h1><p class="sy-v2-muted">Temukan kompetisi yang sedang dibuka.</p><div class="sy-v2-grid">${items.length?items.map(x=>`<article class="sy-v2-card"><h3>${escapeHtml(x.title||x.name||'Kompetisi')}</h3><p class="sy-v2-muted">${escapeHtml(x.description||x.summary||'')}</p><div class="sy-v2-meta"><span class="sy-v2-chip">${escapeHtml(x.status||'published')}</span><button class="sy-v2-btn primary" data-route="/student">Ikuti</button></div></article>`).join(''):'<div class="sy-v2-empty">Belum ada kompetisi yang dapat ditampilkan.</div>'}</div></section>`, {authenticated:!!(await getSession())});
  }

  async function organizer() {
    const session=await getSession(); if(!session)return navigate('/login'); const role=await getRole(session.user.id); if(!['organizer','admin'].includes(role))return navigate('/student');
    let competitions=[]; try { const r=await client().from('competitions').select('*').limit(20); competitions=r.data||[]; } catch (_) {}
    render(`<section class="sy-v2-dashboard"><h1>Organizer Workspace</h1><p class="sy-v2-muted">Kelola event kompetisi dan peserta.</p><div class="sy-v2-statgrid"><div class="sy-v2-stat"><small>Competition</small><strong>${competitions.length}</strong></div><div class="sy-v2-stat"><small>Role</small><strong>${role}</strong></div></div><div class="sy-v2-grid"><article class="sy-v2-card"><h3>Competition Builder</h3><p class="sy-v2-muted">Konfigurasi kompetisi baru.</p><button class="sy-v2-btn primary" data-route="/organizer/competition-builder">Buka Builder</button></article><article class="sy-v2-card"><h3>Participants</h3><p class="sy-v2-muted">Kelola peserta kompetisi.</p></article><article class="sy-v2-card"><h3>Question Bank</h3><p class="sy-v2-muted">Siapkan bank soal.</p></article></div></section>`, {authenticated:true});
  }

  async function organizerBuilder() {
    const session=await getSession(); if(!session)return navigate('/login');
    render(`<section class="sy-v2-form"><h1>Competition Builder</h1><p class="sy-v2-muted">Buat konfigurasi dasar kompetisi.</p><div id="v2-builder-feedback"></div><form id="v2-builder"><div class="sy-v2-field"><label>Nama Kompetisi</label><input id="cb-title" required></div><div class="sy-v2-field"><label>Deskripsi</label><textarea id="cb-description"></textarea></div><div class="sy-v2-field"><label>Status</label><select id="cb-status"><option value="draft">draft</option><option value="published">published</option></select></div><button class="sy-v2-btn primary">Simpan</button></form></section>`, {authenticated:true});
    document.getElementById('v2-builder')?.addEventListener('submit',async(e)=>{e.preventDefault();const f=document.getElementById('v2-builder-feedback');try{const payload={title:document.getElementById('cb-title').value.trim(),description:document.getElementById('cb-description').value.trim(),status:document.getElementById('cb-status').value};const r=await client().from('competitions').insert(payload).select().single();if(r.error)throw r.error;f.innerHTML='<div class="sy-v2-success">Kompetisi berhasil dibuat.</div>';e.currentTarget.reset();}catch(err){f.innerHTML=`<div class="sy-v2-error">${escapeHtml(err.message||'Gagal menyimpan kompetisi.')}</div>`;}});
  }

  async function admin() {
    const session=await getSession(); if(!session)return navigate('/login'); const role=await getRole(session.user.id); if(role!=='admin')return navigate('/student');
    let users=0, logs=0, flags=[]; try { const c=client(); const [u,l,f]=await Promise.all([c.from('profiles').select('id',{count:'exact',head:true}),c.from('audit_logs').select('id',{count:'exact',head:true}),c.from('feature_flags').select('*')]); users=u.count||0; logs=l.count||0; flags=f.data||[]; } catch (_) {}
    render(`<section class="sy-v2-dashboard"><h1>Admin Control Center</h1><p class="sy-v2-muted">Kelola pengguna, konfigurasi, dan audit platform.</p><div class="sy-v2-statgrid"><div class="sy-v2-stat"><small>Total Users</small><strong>${users}</strong></div><div class="sy-v2-stat"><small>Audit Logs</small><strong>${logs}</strong></div><div class="sy-v2-stat"><small>Feature Flags</small><strong>${flags.length}</strong></div><div class="sy-v2-stat"><small>Role</small><strong>admin</strong></div></div><section class="sy-v2-section"><h2>Feature Flags</h2><div class="sy-v2-grid">${flags.length?flags.map(x=>`<article class="sy-v2-card"><h3>${escapeHtml(x.name||x.key||'Feature')}</h3><p class="sy-v2-muted">${escapeHtml(String(x.enabled ?? x.status ?? 'unknown'))}</p></article>`).join(''):'<div class="sy-v2-empty">Belum ada feature flag.</div>'}</div></section></section>`, {authenticated:true});
  }

  async function renderCurrent() {
    const route=routePath();
    if(!isV2Route(route)) { window.__SYKA_V2_ACTIVE__=false; return window.__SYKA_LEGACY_APP_INIT__?.(); }
    window.__SYKA_V2_ACTIVE__=true;
    try {
      const root=ensureRoot(); if(!root)return;
      root.innerHTML='<div class="sy-v2-loading">Memuat Sykabelajar V2…</div>';
      if(route==='/'||route==='/home') return landing();
      if(route==='/login') return auth('login');
      if(route==='/register') return auth('register');
      if(route==='/student'||route==='/dashboard'||route==='/profile'||route.startsWith('/student/')) return student();
      if(route==='/competitions'||route.startsWith('/competition/')) return competitions();
      if(route==='/organizer/competition-builder') return organizerBuilder();
      if(route==='/organizer'||route.startsWith('/organizer/')) return organizer();
      if(route==='/admin'||route.startsWith('/admin/')) return admin();
      return navigate('/');
    } catch (error) { const root=ensureRoot(); if(root)root.innerHTML=`<div class="sy-v2-container sy-v2-error"><h2>Gagal memuat V2</h2><p>${escapeHtml(error.message||'Terjadi kesalahan.')}</p><button class="sy-v2-btn primary" data-route="/">Kembali</button></div>`; bind(); }
  }

  async function start() {
    if (!window.__SYKA_V2_EVENTS_BOUND__) {
      window.__SYKA_V2_EVENTS_BOUND__ = true;
      window.addEventListener('popstate', renderCurrent);
    }
    return renderCurrent();
  }

  window.SYKA_V2_RUNTIME = { start, render:renderCurrent, navigate, isV2Route };
}());


/* src/sykabelajar-v2/integration/syka-app-bridge.js */
(function () {
  window.SYKA_APP = {
    async init() {
      document.documentElement.dataset.sykabelajar = 'v2';
      return window.SYKA_V2_BOOTSTRAP();
    }
  };
}());
