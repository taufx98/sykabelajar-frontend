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
    {name:'organizer',match:p=>p==='/organizer'},
    {name:'admin',match:p=>p==='/admin'},
    {name:'verify',match:p=>/^\/verifikasi\/[^/]+$/.test(p)},
  ];
  function parse(p){ const clean=decodeURIComponent((p||'/').split('?')[0].replace(/\/+$/,'')||'/'); let r=routes.find(x=>x.match(clean)); if(!r) return {name:'not_found',params:{},query:window.SYKA_UTILS.queryParams()}; const seg=clean.split('/').filter(Boolean); const params={}; if(r.name==='competition')params.slug=seg[1]; if(r.name==='registration')params.slug=seg[1]; if(r.name==='attempt')params.attemptId=seg[1]; if(r.name==='verify')params.code=seg[1]; return {name:r.name,params,query:window.SYKA_UTILS.queryParams()}; }
  function href(path){ const cfg=window.SYKA_CONFIG; if(cfg.ROUTE_MODE==='hash') return '#'+path; if(cfg.ROUTE_MODE==='path') return path; const u=new URL(window.location.href); u.pathname=cfg.APP_PAGE; u.search=''; u.searchParams.set('route',path); u.hash=''; return u.pathname+u.search; }
  function navigate(path){ const cfg=window.SYKA_CONFIG; if(cfg.ROUTE_MODE==='hash'){window.location.hash='#'+path; return;} if(cfg.ROUTE_MODE==='path'){history.pushState({},'',path); render(); return;} const u=new URL(window.location.href); u.pathname=cfg.APP_PAGE; u.search=''; u.searchParams.set('route',path); u.hash=''; history.pushState({},'',u.pathname+u.search); render(); }
  async function render(){ const p=window.SYKA_UTILS.routePath(); const parsed=parse(p); window.SYKA_STATE.patch('route',parsed); window.SYKA_SIDEBAR.render(); window.SYKA_HEADER.render(); window.SYKA_BOTTOMNAV.render(); const blogFallback=document.getElementById('blogger-content'); if(blogFallback) blogFallback.style.display = parsed.name==='not_found' ? 'block' : 'none'; const root=document.getElementById('page-root'); root.innerHTML='<div class="page-loading"><div class="loading-spinner"></div></div>'; if(parsed.name==='home')return window.SYKA_PAGE_HOME.render(root); if(parsed.name==='lomba')return window.SYKA_PAGE_LOMBA.render(root); if(parsed.name==='competition')return window.SYKA_PAGE_COMPETITION.render(root,parsed.params.slug); if(parsed.name==='registration')return window.SYKA_PAGE_REGISTRATION.render(root,parsed.params.slug); if(parsed.name==='profile')return window.SYKA_PAGE_PROFILE.render(root); if(parsed.name==='leaderboard')return window.SYKA_PAGE_LEADERBOARD.render(root); if(parsed.name==='awards')return window.SYKA_PAGE_AWARDS.render(root); if(parsed.name==='orders')return window.SYKA_PAGE_ORDERS.render(root); if(parsed.name==='verify')return window.SYKA_PAGE_VERIFY.render(root,parsed.params.code); if(parsed.name==='attempt')return window.SYKA_PAGE_PLACEHOLDER.render(root,'Attempt engine','Timer server-authoritative, autosave debounce, resume, submit idempotency, dan grading akan berada di service contract attempt.'); if(parsed.name==='organizer')return window.SYKA_PAGE_ORGANIZER.render(root); if(parsed.name==='admin')return window.SYKA_PAGE_ADMIN.render(root); return window.SYKA_PAGE_PLACEHOLDER.render(root,'Halaman tidak ditemukan','Route belum tersedia di application shell.'); }
  function refresh(){return render();}
  window.addEventListener('popstate',render); window.addEventListener('hashchange',render);
  window.SYKA_ROUTER={parse,href,navigate,render,refresh};
})();


