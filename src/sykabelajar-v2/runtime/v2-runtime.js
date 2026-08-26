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
