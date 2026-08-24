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
