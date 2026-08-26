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
  function normalize(path){
    let value=decodeURIComponent(String(path||'/').split('?')[0].trim());
    if(!value.startsWith('/')) value='/'+value;
    value=value.replace(/\/{2,}/g,'/').replace(/\/+$/,'')||'/';
    return value;
  }
  function parse(path){
    const clean=normalize(path);const found=routes.find(r=>r.match(clean));
    if(!found)return {name:'not_found',params:{},query:window.SYKA_UTILS.queryParams()};
    const seg=clean.split('/').filter(Boolean);const params={};
    if(found.name==='competition'||found.name==='registration')params.slug=seg[1];
    if(found.name==='attempt')params.attemptId=seg[1];
    if(found.name==='verify')params.code=seg[1];
    return {name:found.name,params,query:window.SYKA_UTILS.queryParams()};
  }
  function href(path,query={}){
    const cfg=window.SYKA_CONFIG||{};
    let target=normalize(path);
    // '/' is the public marketing homepage. Inside the app, every brand/home
    // action must explicitly resolve to /home so it never falls back to landing.
    if(target==='/') target='/home';
    const u=new URL(window.location.href);
    u.pathname=cfg.APP_PAGE||'/p/app.html';u.hash='';u.search='';u.searchParams.set('route',target);
    Object.entries(query||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')u.searchParams.set(k,String(v));});
    return u.pathname+u.search;
  }
  function navigate(path,query={}){return renderWithUrl(href(path,query));}
  async function renderWithUrl(url){history.pushState({},'',url);return render();}
  async function render(){
    let current=window.SYKA_UTILS.routePath();
    const queryRoute=new URLSearchParams(window.location.search).get('route');
    if(queryRoute!==null) current=queryRoute||'/home';
    const parsed=parse(current);window.SYKA_STATE.patch('route',parsed);
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
      if(parsed.name==='store')return await window.SYKA_PAGE_STORE.render(root);
      if(parsed.name==='tasks')return await window.SYKA_PAGE_TASKS.render(root);
      if(parsed.name==='notifications')return await window.SYKA_PAGE_NOTIFICATIONS.render(root);
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
