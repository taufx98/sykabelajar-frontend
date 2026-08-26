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
  if(!window.__SYKA_MOBILE_OUTSIDE_BOUND){window.__SYKA_MOBILE_OUTSIDE_BOUND=true;document.addEventListener('click',e=>{if(window.innerWidth>800)return;const side=document.getElementById('syka-sidebar');const trigger=document.getElementById('mobile-menu-btn');if(document.body.classList.contains('mobile-nav-open')&&!side?.contains(e.target)&&!trigger?.contains(e.target))toggleMobileNav();});}window.addEventListener('online',()=>window.SYKA_STATE.patch('network.online',true));window.addEventListener('offline',()=>{window.SYKA_STATE.patch('network.online',false);window.SYKA_TOAST.show('Koneksi internet terputus.','warning');});bootstrapAuth().finally(()=>{ if(window.SYKA_V2_RUNTIME?.start){ window.SYKA_V2_RUNTIME.start(); } else { window.SYKA_ROUTER.render(); } });}
  window.SYKA_APP={init,openAuth,openForgotPassword,openPasswordRecovery,logout,toggleTheme,toggleSidebar,toggleMobileNav,disposeAuth:()=>authSubscription?.unsubscribe?.()};
})();
