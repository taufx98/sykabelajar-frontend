(function(){
  if(window.SYKA_V2_RUNTIME)return;

  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const currentRoute=()=>new URLSearchParams(location.search).get('route')||'/';
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
    sun:'M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4 M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8',
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
    const submit=form.querySelector('button[type=submit]');
    if(submit)submit.disabled=true;
    try{
      if(form.dataset.mode==='register'){
        const payload={email,password,fullName:document.getElementById('v2-name')?.value?.trim()||'',username:document.getElementById('v2-username')?.value?.trim()||'',accountType:document.querySelector('[data-account-type].active')?.dataset.accountType||'student'};
        if(auth()?.signUp){
          await auth().signUp(payload);
        }else if(auth()?.register){
          await auth().register(payload);
        }else{
          throw new Error('Register service tidak tersedia pada frontend existing.');
        }
        if(feedback)feedback.innerHTML='<div class="v2-success">Akun berhasil dibuat. Silakan cek email jika verifikasi diperlukan.</div>';
      }else{
        if(!auth()?.signIn)throw new Error('Login service tidak tersedia pada frontend existing.');
        await auth().signIn({email,password});
        navigate('/student');
        return;
      }
    }catch(err){
      if(feedback)feedback.innerHTML='<div class="v2-error">'+esc(err?.message||'Autentikasi gagal.')+'</div>';
    }finally{
      if(submit)submit.disabled=false;
    }
  }

  function bind(){
    document.querySelectorAll('[data-v2-route]').forEach(el=>el.onclick=()=>navigate(el.dataset.v2Route));
    document.querySelectorAll('[data-v2-theme]').forEach(el=>el.onclick=toggleTheme);
    document.querySelectorAll('[data-v2-logout]').forEach(el=>el.onclick=async()=>{try{await auth()?.signOut?.()}catch(_){}navigate('/')});
    const form=document.getElementById('v2-auth-form');
    if(form){
      form.addEventListener('submit',e=>{e.preventDefault();handleAuthSubmit(form)});
    }
    document.querySelectorAll('[data-account-type]').forEach(el=>el.addEventListener('click',()=>{
      document.querySelectorAll('[data-account-type]').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
    }));
  }

  async function landing(){
    let comps=[];
    try{const q=await supa()?.from('competitions').select('*').order('created_at',{ascending:false}).limit(6);comps=q?.data||[]}catch(_){}
    if(!comps.length)comps=[
      {title:'Uji Kompetensi Matematika Nasional 2026',category:'Matematika',participants:2840},
      {title:'Karya Tulis Ilmiah Sains Muda 2026',category:'Sains & IPA',participants:1120},
      {title:'Coding Pemula: Web Kita',category:'Teknologi',participants:680}
    ];

    const cards=comps.map(c=>`<article class="v2-comp-card"><div class="v2-comp-cover"></div><div class="v2-comp-body"><span class="v2-chip">${esc(c.category||'Kompetisi')}</span><h3>${esc(c.title||c.name||'Kompetisi')}</h3><p>${esc(c.description||'Uji kompetensi, raih prestasi, dan bangun profilmu.')}</p><div class="v2-comp-meta"><strong>+${Number(c.points||300)} XP</strong><span>${Number(c.participants||0).toLocaleString('id-ID')} peserta</span></div></div></article>`).join('');

    return `<div class="v2-landing">
      <header class="v2-landing-nav"><div class="v2-container">${brand()}<nav><button data-v2-route="/lomba">Kompetisi</button><button data-v2-route="/student">Belajar</button><button data-v2-route="/organizer">Organizer</button></nav><div class="v2-nav-actions"><button class="v2-icon" data-v2-theme>${theme()==='dark'?icon('sun'):icon('moon')}</button>${button('/login','Masuk','ghost')}${button('/register','Daftar Gratis')}</div></div></header>
      <section class="v2-hero"><div class="v2-container v2-hero-grid"><div><span class="v2-kicker">${icon('spark')} Platform Uji Kompetensi Nasional Non-Formal</span><h1>Belajar Jadi Seru,<br><span class="v2-gradient">Uji Kompetensi Setiap Hari</span></h1><p>Ikuti uji kompetensi, kumpulkan XP, naikkan peringkat, dan bangun portofolio prestasi yang bisa diverifikasi publik.</p><div class="v2-actions">${button('/register','Mulai Sekarang — Gratis','primary big')}${button('/lomba','Jelajahi Kompetisi','outline big')}</div><div class="v2-metrics"><div><strong>12,000+</strong><span>Peserta aktif</span></div><div><strong>150+</strong><span>Uji kompetensi</span></div><div><strong>8,500+</strong><span>Sertifikat</span></div></div></div><div class="v2-hero-board"><div class="v2-board-title">${icon('chart')} Papan Peringkat <span>LIVE</span></div>${['Aruna Putra','Mira Cendekia','Bagaskara Wibawa','Larasati Ayu','Dimas Pratama'].map((n,i)=>`<div class="v2-board-row"><b>${i+1}</b><span class="v2-mini-avatar">${n.slice(0,2)}</span><div><strong>${n}</strong><small>${['SMP Negeri 1 Bandung','MTs Negeri 2 Jakarta','SMA Negeri 8 Surabaya','SMP Negeri 3 Yogyakarta','SMA Negeri 5 Malang'][i]}</small></div><em>${[4820,9100,8450,7320,6810][i]}</em></div>`).join('')}</div></div></section>
      <section class="v2-section"><div class="v2-container"><div class="v2-section-head"><div><h2>Uji Kompetensi Unggulan</h2><p>Mulai perjalananmu dari kompetisi pilihan ini.</p></div><button data-v2-route="/lomba">Lihat semua</button></div><div class="v2-comp-grid">${cards}</div></div></section>
      <section class="v2-section"><div class="v2-container"><div class="v2-center-head"><h2>Kenapa sykabelajar.id?</h2><p>Satu ekosistem untuk kompetisi, pembelajaran, dan prestasi.</p></div><div class="v2-why-grid">${[['trophy','Uji Kompetensi','Ratusan kompetisi dari berbagai jenjang dan bidang.'],['spark','Daily Tasks','Bangun kebiasaan belajar lewat streak dan XP.'],['chart','Leaderboard','Pantau progres dan bersaing secara real-time.'],['award','Sertifikat','Prestasi digital yang dapat diverifikasi publik.'],['shield','Trust Layer','Kode unik menjaga keaslian sertifikat.'],['spark','Gamifikasi','XP, Edu Coin, badge, achievement, dan reward.']].map(([i,t,d])=>`<article class="v2-why-card"><div class="v2-why-icon">${icon(i)}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></div></section>
      <section class="v2-section"><div class="v2-container"><div class="v2-cta"><h2>Siap beruji kompetensi?</h2><p>Gabung dan mulai membangun prestasi digitalmu bersama Sykabelajar.</p><div class="v2-actions center">${button('/register','Daftar Sekarang','primary big')}${button('/login','Saya sudah punya akun','outline big')}</div></div></div></section>
      <footer class="v2-footer"><div class="v2-container">sykabelajar.id · Platform Uji Kompetensi Nasional Non-Formal</div></footer>
    </div>`
  }

  async function authPage(mode){
    const reg=mode==='register';
    return `<section class="v2-auth"><div class="v2-auth-card">${brand()}<span class="v2-kicker">SYKABELAJAR</span><h1>${reg?'Buat akun baru':'Selamat datang kembali'}</h1><p>${reg?'Mulai perjalanan belajar dan kompetisimu.':'Masuk untuk melanjutkan progresmu.'}</p><form id="v2-auth-form" data-mode="${reg?"register":"login"}">${reg?'<div class="v2-account-tabs"><button type="button" class="active" data-account-type="student">Pelajar</button><button type="button" data-account-type="organizer">Organizer</button></div><label>Nama lengkap<input id="v2-name" required></label><label>Username<input id="v2-username" required></label>':''}<label>Email<input id="v2-email" type="email" required></label><label>Password<input id="v2-password" type="password" minlength="8" required></label><button class="v2-btn primary big full" type="submit">${reg?'Buat akun':'Masuk'}</button></form><div id="v2-auth-feedback"></div><p class="v2-switch">${reg?'Sudah punya akun?':'Belum punya akun?'} <button data-v2-route="/${reg?'login':'register'}">${reg?'Masuk':'Daftar'}</button></p></div></section>`;
  }

  async function studentContent(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let profile=null,xp=0,coins=0,ach=0,certs=0,regs=0,tasks=0;
    try{
      const c=supa();
      const [pr,x,ec,a,ce,rg,dt]=await Promise.all([
        c.from('profiles').select('*').eq('id',s.user.id).single(),
        c.from('xp_ledger').select('amount').eq('user_id',s.user.id),
        c.from('edu_coin_ledger').select('amount').eq('user_id',s.user.id),
        c.from('user_achievements').select('id',{count:'exact',head:true}).eq('user_id',s.user.id),
        c.from('certificates').select('id',{count:'exact',head:true}).eq('user_id',s.user.id),
        c.from('registrations').select('id',{count:'exact',head:true}).eq('user_id',s.user.id),
        c.from('daily_task_claims').select('id',{count:'exact',head:true}).eq('user_id',s.user.id)
      ]);
      profile=pr?.data||null;
      xp=(x?.data||[]).reduce((n,v)=>n+Number(v.amount||0),0);
      coins=(ec?.data||[]).reduce((n,v)=>n+Number(v.amount||0),0);
      ach=a?.count||0; certs=ce?.count||0; regs=rg?.count||0; tasks=dt?.count||0;
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">STUDENT</span><h1>Halo, ${esc(profile?.full_name||profile?.name||s.user.email||'Student')}</h1><p class="v2-muted">Ringkas progresmu dan lanjutkan aktivitas hari ini.</p><div class="v2-stat-grid v2-stat-grid-6"><div><small>XP</small><strong>${xp.toLocaleString('id-ID')}</strong></div><div><small>Edu Coin</small><strong>${coins.toLocaleString('id-ID')}</strong></div><div><small>Achievement</small><strong>${ach}</strong></div><div><small>Sertifikat</small><strong>${certs}</strong></div><div><small>Kompetisi</small><strong>${regs}</strong></div><div><small>Daily Task</small><strong>${tasks}</strong></div></div><div class="v2-section-head v2-dashboard-section-head"><div><h2>Aktivitas Utama</h2><p>Pilih apa yang ingin kamu lanjutkan.</p></div></div><div class="v2-panel-grid"><article class="v2-panel"><div class="v2-panel-icon">${icon('trophy')}</div><h3>Kompetisi</h3><p>Temukan kompetisi terbaru dan lanjutkan progresmu.</p>${button('/lomba','Buka kompetisi')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('spark')}</div><h3>Daily Task</h3><p>Bangun streak dan klaim XP harian.</p>${button('/daily-tasks','Daily task','outline')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('award')}</div><h3>Prestasi & Sertifikat</h3><p>Lihat achievement dan sertifikat yang sudah kamu peroleh.</p>${button('/prestasi','Lihat prestasi','outline')}</article></div></section>`;
  }
  async function genericRoleContent(kind){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    const r=await getRole(s.user.id);
    if(kind==='organizer'&&!['organizer','admin'].includes(r)){navigate('/student');return ''}
    if(kind==='admin'&&r!=='admin'){navigate('/student');return ''}

    if(kind==='organizer'){
      let competitions=0,registrations=0,questionBanks=0;
      try{
        const c=supa();
        const [co,rg,qb]=await Promise.all([
          c.from('competitions').select('id',{count:'exact',head:true}),
          c.from('registrations').select('id',{count:'exact',head:true}),
          c.from('question_banks').select('id',{count:'exact',head:true})
        ]);
        competitions=co?.count||0;registrations=rg?.count||0;questionBanks=qb?.count||0;
      }catch(_){}
      return `<section class="v2-dashboard"><span class="v2-kicker">ORGANIZER</span><h1>Organizer Workspace</h1><p class="v2-muted">Satu ruang kerja untuk mengelola kompetisi, peserta, dan bank soal.</p><div class="v2-stat-grid"><div><small>Competitions</small><strong>${competitions}</strong></div><div><small>Registrations</small><strong>${registrations}</strong></div><div><small>Question Banks</small><strong>${questionBanks}</strong></div><div><small>Role</small><strong>${esc(r)}</strong></div></div><div class="v2-panel-grid"><article class="v2-panel"><div class="v2-panel-icon">${icon('trophy')}</div><h3>Competition Builder</h3><p>Buat dan konfigurasi kompetisi baru.</p>${button('/organizer/competition-builder','Buka builder')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('user')}</div><h3>Participants</h3><p>Pantau registrasi dan peserta.</p>${button('/organizer/participants','Kelola peserta','outline')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('chart')}</div><h3>Question Bank</h3><p>Kelola soal, grading items, dan attempt.</p>${button('/organizer/question-bank','Buka bank soal','outline')}</article></div></section>`;
    }

    let users=0,organizers=0,audits=0,flags=0;
    try{
      const c=supa();
      const [u,o,a,f]=await Promise.all([
        c.from('profiles').select('id',{count:'exact',head:true}),
        c.from('organizers').select('id',{count:'exact',head:true}),
        c.from('audit_logs').select('id',{count:'exact',head:true}),
        c.from('feature_flags').select('id',{count:'exact',head:true})
      ]);
      users=u?.count||0;organizers=o?.count||0;audits=a?.count||0;flags=f?.count||0;
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">ADMIN</span><h1>Admin Control Center</h1><p class="v2-muted">Pantau pengguna, organizer, konfigurasi fitur, dan audit platform.</p><div class="v2-stat-grid"><div><small>Users</small><strong>${users}</strong></div><div><small>Organizers</small><strong>${organizers}</strong></div><div><small>Audit Logs</small><strong>${audits}</strong></div><div><small>Feature Flags</small><strong>${flags}</strong></div></div><div class="v2-panel-grid"><article class="v2-panel"><div class="v2-panel-icon">${icon('user')}</div><h3>User Management</h3><p>Kelola user dan role.</p>${button('/admin/users','Buka users','outline')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('shield')}</div><h3>Feature Flags</h3><p>Kontrol release dan fitur.</p>${button('/admin/features','Buka flags','outline')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('chart')}</div><h3>Audit & Monitoring</h3><p>Periksa aktivitas platform.</p>${button('/admin/audit','Buka audit','outline')}</article></div></section>`;
  }
  async function shell(content, current){
    const s=await getSession(), r=s?await getRole(s.user.id):'guest';
    const items=[['/','home','Beranda'],['/lomba','trophy','Lomba'],['/juara','chart','Peringkat'],['/prestasi','award','Awards'],['/daily-tasks','spark','Daily Tasks']];
    if(r==='organizer'||r==='admin')items.push(['/organizer','shield','Organizer']);
    if(r==='admin')items.push(['/admin','shield','Admin']);
    const sidebar=`<aside class="v2-sidebar">${brand()}<nav class="v2-nav">${items.map(([rr,i,t])=>`<button class="${current===rr?'active':''}" data-v2-route="${rr}">${icon(i)}<span>${t}</span></button>`).join('')}</nav><div class="v2-sidebar-bottom">${s?`<button class="v2-profile-card" data-v2-route="/profile"><span class="v2-avatar">${esc((s.user.email||'U')[0].toUpperCase())}</span><span><strong>${esc(s.user.email||'Pengguna')}</strong><small>${esc(r)}</small></span></button><button class="v2-nav-plain" data-v2-logout>${icon('logout')}Keluar</button>`:`<div class="v2-guest"><strong>Jelajahi Sykabelajar</strong><p>Ikuti lomba dan bangun prestasi.</p>${button('/register','Daftar Gratis')}${button('/login','Masuk','outline')}</div>`}</div></aside>`;
    const rail=`<aside class="v2-rail"><div class="v2-rail-card"><div class="v2-search">${icon('search')}<input placeholder="Cari lomba, pengguna..." /></div></div><div class="v2-rail-card"><div class="v2-rail-title">${icon('spark')} Trending</div><button class="v2-trend" data-v2-route="/lomba"><b>01</b><span><strong>Uji Kompetensi Matematika Nasional 2026</strong><small>Matematika · 2.840 peserta</small></span></button><button class="v2-trend" data-v2-route="/lomba"><b>02</b><span><strong>Karya Tulis Ilmiah Sains Muda 2026</strong><small>Sains · 1.120 peserta</small></span></button></div><div class="v2-rail-card"><div class="v2-rail-title">${icon('chart')} Top Peringkat</div>${['Mira Cendekia','Bagaskara Wibawa','Larasati Ayu','Dimas Pratama','Naila Zahra'].map((n,i)=>`<div class="v2-rank-row"><span>${i+1}</span><span class="v2-mini-avatar">${n.slice(0,2)}</span><strong>${n}</strong><em>${[9100,8450,7320,6810,6200][i]}</em></div>`).join('')}</div></aside>`;
    const bottom=`<nav class="v2-bottom">${items.slice(0,4).map(([rr,i,t])=>`<button data-v2-route="${rr}">${icon(i)}<span>${t}</span></button>`).join('')}</nav>`;
    return `<div class="v2-app"><header class="v2-mobile-top">${brand()}<button class="v2-icon" data-v2-theme>${theme()==='dark'?icon('sun'):icon('moon')}</button></header><div class="v2-shell-grid">${sidebar}<main class="v2-main"><div class="v2-topbar"><span>${current.replace('/','')||'Beranda'}</span><button class="v2-icon" data-v2-theme>${theme()==='dark'?icon('sun'):icon('moon')}</button></div><div class="v2-main-body">${content}</div></main>${rail}</div>${bottom}</div>`;
  }


  async function competitionDetail(id){
    const s=await getSession();
    if(!s){navigate('/login');return ''}
    let comp=null,registration=null,attempts=[];
    try{
      const c=supa();
      const [co,rg,at]=await Promise.all([
        c.from('competitions').select('*').eq('id',id).single(),
        c.from('registrations').select('*').eq('competition_id',id).eq('user_id',s.user.id).maybeSingle(),
        c.from('attempts').select('*').eq('competition_id',id).eq('user_id',s.user.id).order('created_at',{ascending:false})
      ]);
      comp=co?.data;registration=rg?.data;attempts=at?.data||[];
    }catch(_){}
    if(!comp)return `<section class="v2-dashboard"><span class="v2-kicker">COMPETITION</span><h1>Kompetisi tidak ditemukan</h1><p class="v2-muted">Data kompetisi belum tersedia.</p>${button('/lomba','Kembali','outline')}</section>`;
    return `<section class="v2-dashboard"><span class="v2-kicker">${esc(comp.category||'COMPETITION')}</span><h1>${esc(comp.title||comp.name||'Kompetisi')}</h1><p class="v2-muted">${esc(comp.description||'Ikuti kompetisi dan raih prestasi.')}</p><div class="v2-stat-grid"><div><small>Status</small><strong>${esc(comp.status||'published')}</strong></div><div><small>Peserta</small><strong>${Number(comp.participants||0).toLocaleString('id-ID')}</strong></div><div><small>Poin</small><strong>${Number(comp.points||300)}</strong></div><div><small>Attempt</small><strong>${attempts.length}</strong></div></div><div class="v2-panel-grid"><article class="v2-panel"><div class="v2-panel-icon">${icon('trophy')}</div><h3>Registrasi</h3><p>${registration?'Kamu sudah terdaftar.':'Daftarkan dirimu ke kompetisi ini.'}</p><button class="v2-btn ${registration?'outline':'primary'}" data-v2-register="${esc(id)}">${registration?'Terdaftar':'Daftar Sekarang'}</button></article><article class="v2-panel"><div class="v2-panel-icon">${icon('chart')}</div><h3>Attempt</h3><p>${attempts.length?'Ada attempt yang tercatat.':'Belum ada attempt.'}</p><button class="v2-btn outline" data-v2-attempt="${esc(id)}">Mulai / Lanjutkan</button></article><article class="v2-panel"><div class="v2-panel-icon">${icon('award')}</div><h3>Hasil & Sertifikat</h3><p>Hasil akhir dan sertifikat akan mengikuti workflow existing.</p>${button('/prestasi','Lihat prestasi','outline')}</article></div></section>`;
  }

  async function registerForCompetition(id){
    const s=await getSession(); if(!s){navigate('/login');return}
    try{
      const q=await supa().from('registrations').insert({competition_id:id,user_id:s.user.id});
      if(q?.error) throw q.error;
    }catch(e){window.alert(e?.message||'Registrasi gagal.')}
    navigate('/competition/'+encodeURIComponent(id));
  }

  async function startAttempt(id){
    const s=await getSession(); if(!s){navigate('/login');return}
    try{
      const q=await supa().from('attempts').insert({competition_id:id,user_id:s.user.id,status:'in_progress'}).select().single();
      if(q?.error) throw q.error;
      const attemptId=q?.data?.id;
      if(attemptId)navigate('/attempt/'+encodeURIComponent(attemptId));
    }catch(e){window.alert(e?.message||'Attempt tidak dapat dimulai.')}
  }

  async function attemptPage(id){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let attempt=null,answers=[];
    try{
      const c=supa();
      const [a,an]=await Promise.all([
        c.from('attempts').select('*').eq('id',id).eq('user_id',s.user.id).single(),
        c.from('answers').select('*').eq('attempt_id',id)
      ]);
      attempt=a?.data;answers=an?.data||[];
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">ATTEMPT</span><h1>${esc(attempt?.title||'Uji Kompetensi')}</h1><p class="v2-muted">Jawaban tersimpan melalui service backend existing.</p><div class="v2-stat-grid"><div><small>Status</small><strong>${esc(attempt?.status||'in_progress')}</strong></div><div><small>Jawaban</small><strong>${answers.length}</strong></div><div><small>Attempt</small><strong>${esc(String(id).slice(0,8))}</strong></div><div><small>Grading</small><strong>Existing engine</strong></div></div><div class="v2-panel"><h3>Exam Engine</h3><p>Question engine tetap memakai tabel questions, question_options, answers, dan grading_items yang sudah tersedia.</p></div></section>`;
  }

  async function community(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let posts=[];
    try{const q=await supa()?.from('posts').select('*').order('created_at',{ascending:false}).limit(12);posts=q?.data||[]}catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">COMMUNITY</span><h1>Community Feed</h1><p class="v2-muted">Diskusi dan aktivitas komunitas.</p>${posts.length?`<div class="v2-feed">${posts.map(p=>`<article class="v2-post"><div class="v2-post-head"><span class="v2-avatar">${esc((p.author_name||p.user_name||'U').slice(0,1).toUpperCase())}</span><div><strong>${esc(p.author_name||p.user_name||'Pengguna')}</strong><small>${esc(p.created_at||'')}</small></div></div><p>${esc(p.content||p.body||p.text||'')}</p><div class="v2-post-actions"><button type="button">Like</button><button type="button">Komentar</button><button type="button">Bagikan</button></div></article>`).join('')}</div>`:'<div class="v2-empty-panel">Belum ada posting terbaru.</div>'}</section>`;
  }


  async function dataCount(table, filters={}){
    try{
      let q=supa().from(table).select('id',{count:'exact',head:true});
      Object.entries(filters).forEach(([k,v])=>{q=q.eq(k,v)});
      const r=await q; return r?.count||0;
    }catch(_){return 0}
  }

  async function certificatePage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    const count=await dataCount('certificates',{user_id:s.user.id});
    return `<section class="v2-dashboard"><span class="v2-kicker">CERTIFICATE</span><h1>Sertifikat Saya</h1><p class="v2-muted">Sertifikat digital yang terhubung dengan prestasi akunmu.</p><div class="v2-stat-grid"><div><small>Total</small><strong>${count}</strong></div><div><small>Verification</small><strong>Public</strong></div><div><small>Trust</small><strong>RLS</strong></div><div><small>Status</small><strong>Ready</strong></div></div><div class="v2-panel"><h3>Verification</h3><p>Public verification menggunakan tabel certificate_verifications dan asset existing.</p>${button('/verify','Buka verifikasi','outline')}</div></section>`;
  }

  async function gamificationPage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    const [xp,coin,ach,awards,tasks]=await Promise.all([
      (async()=>{try{const r=await supa().from('xp_ledger').select('amount').eq('user_id',s.user.id);return (r.data||[]).reduce((a,b)=>a+Number(b.amount||0),0)}catch(_){return 0}})(),
      (async()=>{try{const r=await supa().from('edu_coin_ledger').select('amount').eq('user_id',s.user.id);return (r.data||[]).reduce((a,b)=>a+Number(b.amount||0),0)}catch(_){return 0}})(),
      dataCount('user_achievements',{user_id:s.user.id}),
      dataCount('awards',{user_id:s.user.id}),
      dataCount('daily_task_claims',{user_id:s.user.id})
    ]);
    return `<section class="v2-dashboard"><span class="v2-kicker">GAMIFICATION</span><h1>Prestasi & Progress</h1><p class="v2-muted">Semua poin dan pencapaian dari sistem existing Sykabelajar.</p><div class="v2-stat-grid"><div><small>XP</small><strong>${xp}</strong></div><div><small>Edu Coin</small><strong>${coin}</strong></div><div><small>Achievement</small><strong>${ach}</strong></div><div><small>Awards</small><strong>${awards}</strong></div></div><div class="v2-panel-grid"><article class="v2-panel"><div class="v2-panel-icon">${icon('spark')}</div><h3>Daily Tasks</h3><p>${tasks} task telah diklaim.</p>${button('/daily-tasks','Buka daily task')}</article><article class="v2-panel"><div class="v2-panel-icon">${icon('award')}</div><h3>Achievements</h3><p>Badge dan achievement akunmu.</p></article><article class="v2-panel"><div class="v2-panel-icon">${icon('trophy')}</div><h3>Awards</h3><p>Penghargaan kompetisi yang telah diperoleh.</p></article></div></section>`;
  }

  async function notificationPage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let rows=[];
    try{const r=await supa().from('notifications').select('*').order('created_at',{ascending:false}).limit(20);rows=r.data||[]}catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">NOTIFICATIONS</span><h1>Notifikasi</h1><p class="v2-muted">Update kompetisi, achievement, dan aktivitas akun.</p><div class="v2-feed">${rows.length?rows.map(n=>`<article class="v2-post"><strong>${esc(n.title||'Notifikasi')}</strong><p>${esc(n.body||n.message||'')}</p><small>${esc(n.created_at||'')}</small></article>`).join(''):'<div class="v2-empty-panel">Belum ada notifikasi.</div>'}</div></section>`;
  }

  async function dailyTaskPage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let tasks=[],claims=0;
    try{
      const c=supa();const [t,cl]=await Promise.all([
        c.from('daily_tasks').select('*').limit(12),
        c.from('daily_task_claims').select('id',{count:'exact',head:true}).eq('user_id',s.user.id)
      ]);
      tasks=t.data||[];claims=cl.count||0;
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">DAILY TASKS</span><h1>Daily Tasks</h1><p class="v2-muted">Aktivitas singkat untuk membangun streak dan XP.</p><div class="v2-stat-grid"><div><small>Available</small><strong>${tasks.length}</strong></div><div><small>Claimed</small><strong>${claims}</strong></div><div><small>Streak</small><strong>7</strong></div><div><small>Reward</small><strong>XP</strong></div></div><div class="v2-panel-grid">${(tasks.length?tasks:[{title:'Daily Quiz',description:'Kerjakan kuis harian dan klaim XP.'},{title:'Read & Reflect',description:'Selesaikan aktivitas refleksi hari ini.'}]).map(t=>`<article class="v2-panel"><div class="v2-panel-icon">${icon('spark')}</div><h3>${esc(t.title||t.name||'Daily Task')}</h3><p>${esc(t.description||'Aktivitas harian Sykabelajar.')}</p><button class="v2-btn outline" type="button">Lihat task</button></article>`).join('')}</div></section>`;
  }

  async function marketplacePage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let products=[],orders=0,ents=0;
    try{
      const c=supa();const [p,o,e]=await Promise.all([
        c.from('commerce_products').select('*').limit(12),
        c.from('orders').select('id',{count:'exact',head:true}).eq('user_id',s.user.id),
        c.from('user_product_entitlements').select('id',{count:'exact',head:true}).eq('user_id',s.user.id)
      ]);
      products=p.data||[];orders=o.count||0;ents=e.count||0;
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">MARKETPLACE</span><h1>Store</h1><p class="v2-muted">Produk edukasi dan benefit digital.</p><div class="v2-stat-grid"><div><small>Products</small><strong>${products.length}</strong></div><div><small>Orders</small><strong>${orders}</strong></div><div><small>Entitlements</small><strong>${ents}</strong></div><div><small>Payment</small><strong>Secure</strong></div></div><div class="v2-comp-grid">${(products.length?products:[{name:'Edu Bundle',description:'Benefit digital untuk perjalanan belajar.'},{name:'Achievement Pack',description:'Paket benefit dan badge.'}]).map(p=>`<article class="v2-comp-card"><div class="v2-comp-cover"></div><div class="v2-comp-body"><span class="v2-chip">PRODUCT</span><h3>${esc(p.name||p.title||'Product')}</h3><p>${esc(p.description||'Benefit edukasi Sykabelajar.')}</p><div class="v2-comp-meta"><strong>${esc(String(p.price||'—'))}</strong><button class="v2-card-link" type="button">Lihat</button></div></div></article>`).join('')}</div></section>`;
  }

  async function profilePage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let p=null,settings=null;
    try{
      const c=supa();const [pr,us]=await Promise.all([
        c.from('profiles').select('*').eq('id',s.user.id).single(),
        c.from('user_settings').select('*').eq('user_id',s.user.id).maybeSingle()
      ]);
      p=pr.data;settings=us.data;
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">PROFILE</span><h1>${esc(p?.full_name||p?.name||s.user.email||'Profile')}</h1><p class="v2-muted">Profil dan preferensi pengguna dari backend existing.</p><div class="v2-panel-grid"><article class="v2-panel"><div class="v2-panel-icon">${icon('user')}</div><h3>Identity</h3><p>Email: ${esc(s.user.email||'')}</p><p>Username: ${esc(p?.username||'—')}</p></article><article class="v2-panel"><div class="v2-panel-icon">${icon('shield')}</div><h3>Settings</h3><p>Settings record: ${settings?'available':'not set'}</p></article><article class="v2-panel"><div class="v2-panel-icon">${icon('spark')}</div><h3>Security</h3><p>Session dan authorization tetap melalui Supabase Auth + RLS.</p></article></div></section>`;
  }

  async function referralPage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    let code=null,events=0;
    try{
      const c=supa();const [cc,ev]=await Promise.all([
        c.from('referral_codes').select('*').eq('user_id',s.user.id).limit(1).maybeSingle(),
        c.from('referral_events').select('id',{count:'exact',head:true}).eq('referrer_user_id',s.user.id)
      ]);
      code=cc.data;events=ev.count||0;
    }catch(_){}
    return `<section class="v2-dashboard"><span class="v2-kicker">REFERRAL</span><h1>Referral</h1><p class="v2-muted">Ajak teman dan lihat aktivitas referral.</p><div class="v2-stat-grid"><div><small>Code</small><strong>${esc(code?.code||'—')}</strong></div><div><small>Events</small><strong>${events}</strong></div><div><small>Status</small><strong>Active</strong></div><div><small>Reward</small><strong>Edu Coin</strong></div></div></section>`;
  }

  async function verifyPage(){
    return `<section class="v2-auth"><div class="v2-auth-card"><span class="v2-kicker">PUBLIC VERIFICATION</span><h1>Verifikasi Sertifikat</h1><p>Masukkan kode sertifikat untuk memeriksa keaslian melalui certificate_verifications.</p><label>Kode verifikasi<input id="v2-verify-code" placeholder="Contoh: SYKA-2026-XXXX"></label><button class="v2-btn primary big full" type="button">Verifikasi</button><div class="v2-muted" style="margin-top:12px;font-size:11px">Verification akan memakai service existing saat modul verify diaktifkan.</div></div></section>`;
  }

  async function storeOrderPage(){
    const s=await getSession(); if(!s){navigate('/login');return ''}
    const count=await dataCount('orders',{user_id:s.user.id});
    return `<section class="v2-dashboard"><span class="v2-kicker">ORDERS</span><h1>Pesanan Saya</h1><p class="v2-muted">Riwayat order dari commerce system existing.</p><div class="v2-stat-grid"><div><small>Total</small><strong>${count}</strong></div><div><small>Payment</small><strong>Intent</strong></div><div><small>Shipment</small><strong>—</strong></div><div><small>Entitlement</small><strong>Auto</strong></div></div></section>`;
  }

  async function start(){
    document.documentElement.dataset.sykabelajar='v2';
    document.documentElement.dataset.sykaV2Theme=theme();
    const root=document.getElementById('page-root');if(!root)return;
    root.setAttribute('aria-busy','true');
    root.innerHTML='<div class="v2-route-loading"><div class="v2-route-spinner"></div><span>Memuat Sykabelajar…</span></div>';
    const p=currentRoute();
    if(p==='/') root.innerHTML=await landing();
    else if(p==='/login'||p==='/register') root.innerHTML=await authPage(p.slice(1));
    else if(p==='/student'||p==='/dashboard'||p.startsWith('/student/')) root.innerHTML=await shell(await studentContent(),p);
    else if(p==='/profile') root.innerHTML=await shell(await profilePage(),p);
    else if(p==='/prestasi'||p==='/gamification') root.innerHTML=await shell(await gamificationPage(),p);
    else if(p==='/certificates') root.innerHTML=await shell(await certificatePage(),p);
    else if(p==='/notifications') root.innerHTML=await shell(await notificationPage(),p);
    else if(p==='/daily-tasks') root.innerHTML=await shell(await dailyTaskPage(),p);
    else if(p==='/store'||p==='/marketplace') root.innerHTML=await shell(await marketplacePage(),p);
    else if(p==='/orders') root.innerHTML=await shell(await storeOrderPage(),p);
    else if(p==='/referral') root.innerHTML=await shell(await referralPage(),p);
    else if(p==='/verify') root.innerHTML=await verifyPage();
    else if(p==='/organizer'||p.startsWith('/organizer/')) root.innerHTML=await shell(await genericRoleContent('organizer'),p);
    else if(p==='/admin'||p.startsWith('/admin/')) root.innerHTML=await shell(await genericRoleContent('admin'),p);
    else if(p.startsWith('/competition/')){ const id=decodeURIComponent(p.split('/')[2]||''); root.innerHTML=await shell(await competitionDetail(id),p); }
    else if(p.startsWith('/attempt/')){ const id=decodeURIComponent(p.split('/')[2]||''); root.innerHTML=await shell(await attemptPage(id),p); }
    else if(p==='/community'){ root.innerHTML=await shell(await community(),p); }
    else if(p==='/lomba'||p==='/competitions'||p.startsWith('/competition')){
      let rows=[];try{const q=await supa()?.from('competitions').select('*').order('created_at',{ascending:false}).limit(24);rows=q?.data||[]}catch(_){}
      if(!rows.length) rows=[{title:'Kompetisi Sykabelajar',category:'Kompetisi'}];
      root.innerHTML=await shell(`<section class="v2-dashboard"><span class="v2-kicker">COMPETITION</span><h1>Kompetisi Terbaru</h1><p class="v2-muted">Temukan uji kompetensi yang sedang dibuka.</p><div class="v2-comp-grid">${rows.map(c=>`<article class="v2-comp-card"><div class="v2-comp-cover"></div><div class="v2-comp-body"><span class="v2-chip">${esc(c.category||'Kompetisi')}</span><h3>${esc(c.title||c.name||'Kompetisi')}</h3><p>${esc(c.description||'Uji kemampuanmu dan raih prestasi.')}</p><div class="v2-comp-meta"><strong>${Number(c.participants||0).toLocaleString('id-ID')} peserta</strong><button data-v2-route="/student">Ikuti</button></div></div></article>`).join('')}</div></section>`,p);
    } else root.innerHTML=await shell(`<section class="v2-dashboard"><span class="v2-kicker">SYKABELAJAR V2</span><h1>Halaman siap dikembangkan</h1><p class="v2-muted">Route ini tetap berjalan pada V2 shell.</p></section>`,p);
    bind();
    root.setAttribute('aria-busy','false');
  }

  window.addEventListener('popstate',start);
  window.SYKA_V2_RUNTIME={start};
})();