(function(){
  if(window.SYKA_V2_RUNTIME)return;

  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const currentRoute=()=>{const hash=(location.hash||'').replace(/^#/,'');if(hash&&hash.charAt(0)==='/')return hash.split('?')[0]||'/';return new URLSearchParams(location.search).get('route')||'/';};
  const supa=()=>window.SYKA_SUPABASE?.get?.();
  const auth=()=>window.SYKA_AUTH_SERVICE;
  const theme=()=>localStorage.getItem('syka-v2-theme')||'dark';

  const iconMap={
    home:'M3 10 12 3l9 7v11H3z',
    trophy:'M7 4h10v6a5 5 0 0 1-10 0z M4 6H2v2a4 4 0 0 0 4 4 M20 6h2v2a4 4 0 0 1-4 4 M9 21h6 M12 15v6',
    chart:'M4 19V5 M4 19h16 M8 16v-4 M12 16V8 M16 16v-6',
    award:'M12 3a5 5 0 1 0 0 10a5 5 0 0 0 0-10 M9 13l-1 8 4-2 4 2-1-8',
    shield:'M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
    search:'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13 M16 16l5 5',
    sun:'M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4 M12 8a4 4 0 1 0 0 8a4 4 0 0 0-0-8',
    moon:'M20 15.5A8 8 0 0 1 8.5 4A8 8 0 1 0 20 15.5',
    user:'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8 M4 21a8 8 0 0 1 16 0',
    logout:'M10 17l5-5-5-5 M15 12H3 M19 4v16',
    spark:'M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z'
  };
  const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${iconMap[n]||''}"/></svg>`;

  async function getSession(){try{return await auth()?.getSession?.()}catch(_){return null}}
  async function getRole(uid){
    try{
      const q=await supa()?.from('user_roles').select('roles(name)').eq('user_id',uid).limit(1);
      return String(q?.data?.[0]?.roles?.name||'student').toLowerCase();
    }catch(_){return 'student'}
  }

  function setTheme(mode){localStorage.setItem('syka-v2-theme',mode);document.documentElement.dataset.sykaV2Theme=mode}
  function toggleTheme(){setTheme(localStorage.getItem('syka-v2-theme')==='light'?'dark':'light');start()}
  function navigate(route){const u=new URL(location.href);u.searchParams.set('route',route);history.pushState({},'',u.pathname+'?'+u.searchParams.toString());start()}
  function button(route,label,cls='primary'){return `<button class="v2-btn ${cls}" data-v2-route="${route}">${label}</button>`}
  function brand(){return `<button class="v2-brand" data-v2-route="/"><span class="v2-brand-mark">${icon('trophy')}</span><span>sykabelajar<span class="v2-brand-accent">.id</span></span></button>`}

  async function handleAuthSubmit(form){
    const feedback=document.getElementById('v2-auth-feedback');
    const email=document.getElementById('v2-email')?.value?.trim();
    const password=document.getElementById('v2-password')?.value||'';
    if(!email||!password)return;
    const submit=form.querySelector('button[type=submit]');if(submit)submit.disabled=true;
    try{
      if(form.dataset.mode==='register'){
        const payload={email,password,fullName:document.getElementById('v2-name')?.value?.trim()||'',username:document.getElementById('v2-username')?.value?.trim()||'',accountType:document.querySelector('[data-account-type].active')?.dataset.accountType||'student'};
        if(auth()?.signUp)await auth().signUp(payload);else if(auth()?.register)await auth().register(payload);else throw new Error('Register service tidak tersedia pada frontend existing.');
        if(feedback)feedback.innerHTML='<div class="v2-success">Akun berhasil dibuat. Silakan cek email jika verifikasi diperlukan.</div>';
      }else{
        if(!auth()?.signIn)throw new Error('Login service tidak tersedia pada frontend existing.');
        await auth().signIn({email,password});navigate('/student');return;
      }
    }catch(err){if(feedback)feedback.innerHTML='<div class="v2-error">'+esc(err?.message||'Autentikasi gagal.')+'</div>'}finally{if(submit)submit.disabled=false;}
  }
  function bind(){
    document.querySelectorAll('[data-v2-route]').forEach(el=>el.onclick=()=>navigate(el.dataset.v2Route));
    document.querySelectorAll('[data-v2-theme]').forEach(el=>el.onclick=toggleTheme);
    document.querySelectorAll('[data-v2-logout]').forEach(el=>el.onclick=async()=>{try{await auth()?.signOut?.()}catch(_){}navigate('/')});
    const form=document.getElementById('v2-auth-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();handleAuthSubmit(form)});
    document.querySelectorAll('[data-account-type]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-account-type]').forEach(x=>x.classList.remove('active'));el.classList.add('active')}));
  }

  async function landing(){
    const client=supa();let comps=[];
    try{const q=await client?.from('competitions').select('*').eq('visibility','PUBLIC').neq('status','CANCELLED').order('created_at',{ascending:false}).limit(6);if(!q?.error)comps=q.data||[]}catch(_){}
    const cards=comps.length?comps.map(c=>`<a class="v2-comp-card" href="${window.SYKA_CONFIG.APP_PAGE}?route=/lomba/${encodeURIComponent(c.slug||c.id)}"><div class="v2-comp-cover" style="${c.poster_url?`background-image:url('${esc(c.poster_url)}')`:''}"></div><div class="v2-comp-body"><span class="v2-chip">${esc(c.category||'Kompetisi')}</span><h3>${esc(c.title||c.name||'Kompetisi')}</h3><p>${esc(c.short_description||c.description||'Uji kompetensi, raih prestasi, dan bangun profilmu.')}</p><div class="v2-comp-meta"><strong>${Number(c.points||300).toLocaleString('id-ID')} XP</strong><span>${c.registration_starts_at?esc(new Date(c.registration_starts_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})):'Terbuka'}</span></div></div></a>`).join(''):'<div class="v2-empty">Belum ada kompetisi publik.</div>';
    return `<div class="v2-landing"><header class="v2-landing-nav"><div class="v2-container">${brand()}<nav><button data-v2-route="/lomba">Kompetisi</button><button data-v2-route="/student">Belajar</button><button data-v2-route="/organizer">Organizer</button></nav><div class="v2-nav-actions"><button class="v2-icon" data-v2-theme>${theme()==='dark'?icon('sun'):icon('moon')}</button>${button('/login','Masuk','ghost')}${button('/register','Daftar Gratis')}</div></div></header><section class="v2-hero"><div class="v2-container v2-hero-grid"><div><span class="v2-kicker">${icon('spark')} Platform Uji Kompetensi Nasional Non-Formal</span><h1>Belajar Jadi Seru,<br><span class="v2-gradient">Uji Kompetensi Setiap Hari</span></h1><p>Ikuti uji kompetensi, kumpulkan XP, naikkan peringkat, dan bangun portofolio prestasi yang bisa diverifikasi publik.</p><div class="v2-actions">${button('/register','Mulai Sekarang — Gratis','primary big')}${button('/lomba','Jelajahi Kompetisi','outline big')}</div><div class="v2-metrics"><div><strong>${comps.length}</strong><span>Kompetisi publik</span></div><div><strong>—</strong><span>Peserta terdaftar</span></div><div><strong>—</strong><span>Sertifikat</span></div></div></div><div class="v2-hero-board"><div class="v2-board-title">${icon('chart')} Papan Peringkat <span>LIVE</span></div><div class="v2-empty">Data peringkat publik akan ditampilkan dari backend.</div></div></div></section><section class="v2-section"><div class="v2-container"><div class="v2-section-head"><div><h2>Uji Kompetensi Unggulan</h2><p>Mulai perjalananmu dari kompetisi yang tersedia.</p></div><button data-v2-route="/lomba">Lihat semua</button></div><div class="v2-comp-grid">${cards}</div></div></section><section class="v2-section"><div class="v2-container"><div class="v2-center-head"><h2>Kenapa sykabelajar.id?</h2><p>Satu ekosistem untuk kompetisi, pembelajaran, dan prestasi.</p></div><div class="v2-why-grid">${[['trophy','Uji Kompetensi','Kompetisi untuk berbagai jenjang dan bidang.'],['spark','Daily Tasks','Bangun kebiasaan belajar lewat streak dan XP.'],['chart','Leaderboard','Pantau progres dan bersaing secara real-time.'],['award','Sertifikat','Prestasi digital yang dapat diverifikasi.'],['shield','Trust Layer','Kode unik membantu menjaga keaslian sertifikat.'],['spark','Gamifikasi','XP, Edu Coin, badge, achievement, dan reward.']].map(([i,t,d])=>`<article class="v2-why-card"><div class="v2-why-icon">${icon(i)}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></div></section><section class="v2-section"><div class="v2-container"><div class="v2-cta"><h2>Siap beruji kompetensi?</h2><p>Gabung dan mulai membangun prestasi digitalmu bersama Sykabelajar.</p><div class="v2-actions center">${button('/register','Daftar Sekarang','primary big')}${button('/login','Saya sudah punya akun','outline big')}</div></div></div></section><footer class="v2-footer"><div class="v2-container">sykabelajar.id · Platform Uji Kompetensi Nasional Non-Formal</div></footer></div>`;
  }

  async function authPage(mode){const reg=mode==='register';return `<section class="v2-auth"><div class="v2-auth-card">${brand()}<span class="v2-kicker">SYKABELAJAR</span><h1>${reg?'Buat akun baru':'Selamat datang kembali'}</h1><p>${reg?'Mulai perjalanan belajar dan kompetisimu.':'Masuk untuk melanjutkan progresmu.'}</p><form id="v2-auth-form" data-mode="${reg?'register':'login'}">${reg?'<div class="v2-account-tabs"><button type="button" class="active" data-account-type="student">Pelajar</button><button type="button" data-account-type="organizer">Organizer</button></div><label>Nama lengkap<input id="v2-name" required></label><label>Username<input id="v2-username" required></label>':''}<label>Email<input id="v2-email" type="email" required></label><label>Password<input id="v2-password" type="password" minlength="8" required></label><button class="v2-btn primary big full" type="submit">${reg?'Buat akun':'Masuk'}</button></form><div id="v2-auth-feedback"></div><p class="v2-switch">${reg?'Sudah punya akun?':'Belum punya akun?'} <button data-v2-route="/${reg?'login':'register'}">${reg?'Masuk':'Daftar'}</button></p></div></section>`}

  async function studentContent(){const s=await getSession();if(!s){navigate('/login');return ''}let profile=null;try{profile=(await supa()?.from('profiles').select('*').eq('id',s.user.id).maybeSingle())?.data||null}catch(_){}return `<section class="v2-dashboard"><span class="v2-kicker">STUDENT</span><h1>Halo, ${esc(profile?.full_name||profile?.name||s.user.email||'Student')}</h1><p class="v2-muted">Ringkas progresmu dan lanjutkan aktivitas hari ini.</p></section>`}

  async function start(){
    const route=currentRoute();
    let html='';
    if(route==='/login')html=await authPage('login');
    else if(route==='/register')html=await authPage('register');
    else if(route==='/student'||route==='/home')html=await studentContent();
    else if(route==='/lomba')html=await landing();
    else if(route==='/organizer')html='<section class="v2-dashboard"><span class="v2-kicker">ORGANIZER</span><h1>Organizer</h1><p class="v2-muted">Kelola kompetisi dan peserta melalui backend Sykabelajar.</p></section>';
    else html=await landing();
    const root=document.getElementById('page-root');if(!root)return;root.innerHTML=html;bind();
  }
  window.SYKA_V2_RUNTIME={start};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else setTimeout(start,20);
})();
