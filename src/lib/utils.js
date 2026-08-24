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
