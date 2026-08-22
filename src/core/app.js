(function(){
  let authSubscription = null;
  let authBootstrapped = false;

  async function bootstrapAuth(){
    const client=window.SYKA_SUPABASE.get();
    if(authBootstrapped) return;
    authBootstrapped = true;

    // Subscribe immediately so SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT
    // events cannot be missed during initial session recovery.
    const result = client.auth.onAuthStateChange((event,session)=>{
      // INITIAL_SESSION may be emitted while the client is restoring storage.
      // Never treat a transient null session as a real logout during boot.
      if(event === 'INITIAL_SESSION' && !session){
        return;
      }
      setTimeout(()=>hydrate(session,event),0);
    });
    authSubscription = result?.data?.subscription || null;

    try{
      // getSession reads persisted storage and refreshes when necessary.
      const session=await window.SYKA_AUTH_SERVICE.getSession();
      if(session){
        await hydrate(session,'SESSION_RESTORED');
      } else {
        window.SYKA_STATE.patch('auth.status','anonymous');
      }
    }catch(e){
      // Do not destroy an already restored in-memory user because of a
      // transient database/profile error.
      const current=window.SYKA_STATE.getState();
      if(!current.auth.user){
        window.SYKA_STATE.patch('auth.status','anonymous');
        window.SYKA_TOAST.show('Session belum dapat dipulihkan. Coba refresh sekali lagi.','warning');
      }
    }
  }

  function refreshAuthChrome(){
    try{
      window.SYKA_SIDEBAR?.render?.();
      window.SYKA_HEADER?.render?.();
      window.SYKA_BOTTOMNAV?.render?.();
    }catch(_){}
  }

  async function hydrate(session,event='INITIAL_SESSION'){
    const current=window.SYKA_STATE.getState();

    if(session?.user){
      window.SYKA_STATE.patch('auth.session',session);
      window.SYKA_STATE.patch('auth.user',session.user);
      window.SYKA_STATE.patch('auth.status','authenticated');

      try{
        const [profile,roles]=await Promise.all([
          window.SYKA_PROFILE_SERVICE.getMe(session.user.id),
          window.SYKA_PROFILE_SERVICE.getRoles(session.user.id)
        ]);
        window.SYKA_STATE.patch('auth.profile',profile);
        window.SYKA_STATE.patch('auth.roles',roles.roles);
        window.SYKA_STATE.patch('auth.permissions',roles.permissions);
      }catch(e){
        // Auth remains authenticated even if profile hydration temporarily fails.
        window.SYKA_STATE.patch('auth.profile',null);
        window.SYKA_STATE.patch('auth.roles',[]);
        window.SYKA_STATE.patch('auth.permissions',[]);
      }

      refreshAuthChrome();
      if(event==='PASSWORD_RECOVERY') openPasswordRecovery();
      return;
    }

    // Only a confirmed SIGNED_OUT should clear the current authenticated state.
    // This prevents transient null sessions from causing an apparent logout.
    if(event==='SIGNED_OUT'){
      window.SYKA_STATE.resetUserState();
      refreshAuthChrome();
      return;
    }

    if(!current.auth.user){
      window.SYKA_STATE.patch('auth.status','anonymous');
      refreshAuthChrome();
    }
  }

  function openAuth(mode='login',opts={}){
    const target=opts.target||window.SYKA_UTILS.routePath(); const title=mode==='register'?'Buat akun Sykabelajar':'Masuk ke Sykabelajar';
    const classes=[['SD6','Kelas 6 SD'],['SMP1','Kelas 1 SMP / MTs'],['SMP2','Kelas 2 SMP / MTs'],['SMP3','Kelas 3 SMP / MTs'],['SMA1','Kelas 1 SMA / MA / SMK'],['SMA2','Kelas 2 SMA / MA / SMK'],['SMA3','Kelas 3 SMA / MA / SMK']];
    const gradeOptions=classes.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    window.SYKA_MODAL.open({title,wide:true,html:`<div class="auth-tabs"><button class="auth-tab ${mode==='login'?'active':''}" data-mode="login">Masuk</button><button class="auth-tab ${mode==='register'?'active':''}" data-mode="register">Daftar</button></div><form id="auth-form" class="form-card auth-form">${mode==='register'?`<div class="form-grid-2"><label>Nama lengkap *<input id="auth-name" required autocomplete="name"></label><label>Username *<input id="auth-username" required autocomplete="username" pattern="[A-Za-z0-9._-]{3,30}"></label></div><div class="form-grid-2"><label>Email *<input id="auth-email" type="email" required autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" required minlength="6" autocomplete="new-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><div class="form-grid-2"><label>Tanggal lahir *<input id="auth-birth" type="date" required></label><label>Kelas *<select id="auth-grade" required>${gradeOptions}</select></label></div><div class="form-grid-2"><label>Sekolah *<input id="auth-school" required placeholder="Ketik nama sekolah"></label><label>Pembina / guru pendamping<input id="auth-guardian" placeholder="Opsional"></label></div><div id="auth-school-suggest" class="suggest-list hidden"></div><div class="state-banner">Sekolah akan disimpan dalam format uppercase. Ketika kamu mengetik minimal 2 karakter, rekomendasi sekolah yang mirip akan muncul.</div>`:`<div class="form-grid-2"><label>Email *<input id="auth-email" type="email" required autocomplete="email"></label><label>Password *<div class="password-field"><input id="auth-password" type="password" required minlength="6" autocomplete="current-password"><button type="button" class="password-toggle" data-target="auth-password">Lihat</button></div></label></div><button type="button" class="link-button" id="forgot-password">Lupa password?</button>`}<button class="btn btn-primary btn-block" type="submit">${mode==='register'?'Daftar':'Masuk'}</button><div id="auth-feedback"></div></form>`,onOpen:(body)=>{
      body.querySelectorAll('.auth-tab').forEach(b=>b.onclick=()=>openAuth(b.dataset.mode,opts));
      body.querySelectorAll('.password-toggle').forEach(btn=>btn.onclick=()=>{const i=body.querySelector('#'+btn.dataset.target);i.type=i.type==='password'?'text':'password';btn.textContent=i.type==='password'?'Lihat':'Sembunyikan';});
      if(mode==='register'){
        const school=body.querySelector('#auth-school'),suggest=body.querySelector('#auth-school-suggest'); let timer;
        school.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=school.value.trim();if(q.length<2){suggest.classList.add('hidden');return;}try{const rows=await window.SYKA_ADMIN_SERVICE.searchSchools(q);suggest.innerHTML=rows.map(r=>`<button type="button" data-name="${window.SYKA_UTILS.escapeHtml(r.name)}">${window.SYKA_UTILS.escapeHtml(r.name)}${r.city?`<small>${window.SYKA_UTILS.escapeHtml(r.city)}</small>`:''}</button>`).join('');suggest.classList.toggle('hidden',!rows.length);suggest.querySelectorAll('button').forEach(b=>b.onclick=()=>{school.value=b.dataset.name;suggest.classList.add('hidden');});}catch(_){suggest.classList.add('hidden');}},250);});
      }
      body.querySelector('#auth-form').onsubmit=async e=>{e.preventDefault();const btn=body.querySelector('button[type=submit]');const feedback=body.querySelector('#auth-feedback');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Memproses...';try{if(mode==='login'){await window.SYKA_AUTH_SERVICE.signIn({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value});window.SYKA_MODAL.close();window.SYKA_TOAST.show('Login berhasil.','success');setTimeout(()=>window.SYKA_ROUTER.navigate(target||'/profile'),0);}else{const res=await window.SYKA_AUTH_SERVICE.signUp({email:body.querySelector('#auth-email').value.trim(),password:body.querySelector('#auth-password').value,fullName:body.querySelector('#auth-name').value.trim(),username:body.querySelector('#auth-username').value.trim().toLowerCase(),grade:body.querySelector('#auth-grade').value,birthDate:body.querySelector('#auth-birth').value||null,institution:body.querySelector('#auth-school').value.trim().toUpperCase(),guardianName:body.querySelector('#auth-guardian').value.trim()||null});window.SYKA_MODAL.close();if(res.session){window.SYKA_TOAST.show('Akun berhasil dibuat dan langsung masuk.','success');window.SYKA_ROUTER.navigate(target||'/profile');}else window.SYKA_MODAL.open({title:'Cek email',html:'<div class="verify-success"><div class="verify-icon">✉</div><h2>Konfirmasi email</h2><p>Supabase meminta verifikasi email sebelum session dibuat. Cek inbox kamu lalu buka link konfirmasi.</p></div>'});}}catch(err){btn.disabled=false;btn.textContent=mode==='register'?'Daftar':'Masuk';feedback.innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message||'Terjadi kesalahan.')}</div>`;}};
      body.querySelector('#forgot-password')?.addEventListener('click',()=>openForgotPassword());
    }});
  }
  function openForgotPassword(){window.SYKA_MODAL.open({title:'Reset password',html:'<form id="forgot-form" class="form-card"><label>Email<input id="forgot-email" type="email" required placeholder="nama@email.com"></label><button class="btn btn-primary btn-block" type="submit">Kirim link reset</button><div id="forgot-feedback"></div></form>',onOpen:body=>{body.querySelector('#forgot-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.resetPassword(body.querySelector('#forgot-email').value.trim());window.SYKA_MODAL.close();window.SYKA_TOAST.show('Link reset password dikirim jika email terdaftar.','success');}catch(err){body.querySelector('#forgot-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message)}</div>`;}};}})}
  function openPasswordRecovery(){window.SYKA_MODAL.open({title:'Buat password baru',html:'<form id="recovery-form" class="form-card"><label>Password baru<input id="new-password" type="password" minlength="6" required></label><button class="btn btn-primary btn-block" type="submit">Simpan password</button><div id="recovery-feedback"></div></form>',onOpen:body=>{body.querySelector('#recovery-form').onsubmit=async e=>{e.preventDefault();try{await window.SYKA_AUTH_SERVICE.updatePassword(body.querySelector('#new-password').value);window.SYKA_MODAL.close();window.SYKA_TOAST.show('Password berhasil diperbarui.','success');}catch(err){body.querySelector('#recovery-feedback').innerHTML=`<div class="inline-error">${window.SYKA_UTILS.escapeHtml(err.message)}</div>`;}};}})}
  async function logout(){window.SYKA_MODAL.open({title:'Keluar dari akun?',html:'<p class="confirm-copy">Session browser akan diakhiri dan area privat akan kembali menjadi mode guest.</p><div class="form-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="confirm-logout">Keluar</button></div>',onOpen:body=>{body.querySelector('#confirm-logout').onclick=async()=>{try{await window.SYKA_AUTH_SERVICE.signOut();window.SYKA_STATE.resetUserState();window.SYKA_MODAL.close();window.SYKA_TOAST.show('Kamu sudah keluar.','success');window.SYKA_ROUTER.navigate('/');}catch(e){window.SYKA_TOAST.show(e.message||'Logout gagal.','error');}};}})}
  function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('syka_theme',theme);window.SYKA_STATE.patch('ui.theme',theme);}
  function toggleTheme(){setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');}
  function toggleSidebar(){document.body.classList.toggle('sidebar-collapsed');localStorage.setItem('syka_sidebar',document.body.classList.contains('sidebar-collapsed')?'0':'1');}
  function toggleMobileNav(){document.body.classList.toggle('mobile-nav-open');}
  function bindInternalNavigation(){
    if(window.__SYKA_INTERNAL_NAV_BOUND) return;
    window.__SYKA_INTERNAL_NAV_BOUND=true;
    document.addEventListener('click',(e)=>{
      const link=e.target.closest?.('a[href]');
      if(!link) return;
      if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const raw=link.getAttribute('href');
      if(!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
      try{
        const u=new URL(raw, window.location.href);
        const cfg=window.SYKA_CONFIG;
        if(u.origin!==window.location.origin) return;
        if(cfg.ROUTE_MODE==='query' && u.pathname===cfg.APP_PAGE && u.searchParams.has('route')){
          e.preventDefault();
          const route=u.searchParams.get('route') || '/';
          window.SYKA_ROUTER.navigate(route);
        }
      }catch(_){}
    });
  }
  function init(){
    if(window.__SYKA_APP_INITIALIZED) return;
    window.__SYKA_APP_INITIALIZED=true;
    bindInternalNavigation();
    const theme=window.SYKA_UTILS.getStoredTheme();setTheme(theme);if(localStorage.getItem('syka_sidebar')==='0')document.body.classList.add('sidebar-collapsed');window.SYKA_SIDEBAR.render();window.SYKA_HEADER.render();window.SYKA_BOTTOMNAV.render();window.__SYKA_AUTH_UI_UNSUB=window.SYKA_STATE.subscribe((state,path)=>{if(path && path.startsWith('auth.')) refreshAuthChrome();});document.getElementById('mobile-nav-overlay')?.addEventListener('click',toggleMobileNav);window.addEventListener('online',()=>window.SYKA_STATE.patch('network.online',true));window.addEventListener('offline',()=>{window.SYKA_STATE.patch('network.online',false);window.SYKA_TOAST.show('Koneksi internet terputus.','warning');});window.SYKA_ROUTER.render();bootstrapAuth();}
  window.SYKA_APP={init,openAuth,openForgotPassword,logout,toggleTheme,toggleSidebar,toggleMobileNav,disposeAuth:()=>authSubscription?.unsubscribe?.()};
})();
