/* Final app-wide Bolt design system + modal/auth polish.
 * Presentation only. Backend/service ownership is unchanged.
 */
(function(){
  if(window.__SYKA_APP_WIDE_UI_FINAL__) return;
  window.__SYKA_APP_WIDE_UI_FINAL__=true;

  const STYLE=`
  :root{
    --bolt-bg:#f7f8fc;--bolt-surface:#fff;--bolt-surface-2:#f7f5ff;--bolt-text:#0f172a;
    --bolt-muted:#64748b;--bolt-dim:#94a3b8;--bolt-border:#e7e8f0;--bolt-brand:#7c3aed;
    --bolt-brand-2:#6d28d9;--bolt-brand-soft:#f1eaff;--bolt-success:#059669;
    --bolt-warning:#d97706;--bolt-danger:#dc2626;--bolt-sidebar:252px;--bolt-rail:292px;
    --bolt-radius:18px;--bolt-shadow:0 16px 45px rgba(15,23,42,.08);--bolt-shadow-sm:0 8px 22px rgba(15,23,42,.06)
  }
  :root[data-theme=dark]{--bolt-bg:#090611;--bolt-surface:#120d1e;--bolt-surface-2:#18112a;--bolt-text:#f8fafc;--bolt-muted:#a1a1b5;--bolt-dim:#73738a;--bolt-border:#2b2140;--bolt-brand:#8b5cf6;--bolt-brand-2:#7c3aed;--bolt-brand-soft:#2b1d49;--bolt-shadow:0 20px 60px rgba(0,0,0,.35);--bolt-shadow-sm:0 8px 25px rgba(0,0,0,.25)}
  html,body{background:var(--bolt-bg)!important;color:var(--bolt-text)!important}
  button,input,select,textarea{font:inherit}button,a{cursor:pointer}

  /* Global sizing: these selectors intentionally are NOT limited to #page-root. */
  .btn,.modal .btn,.syka-modal .btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;height:40px!important;min-height:40px!important;padding:0 14px!important;border-radius:11px!important;border:1px solid transparent!important;font-size:10px!important;line-height:1!important;font-weight:900!important;white-space:nowrap!important;box-sizing:border-box!important}
  .btn-sm,.modal .btn-sm,.syka-modal .btn-sm{height:34px!important;min-height:34px!important;padding:0 11px!important;border-radius:10px!important;font-size:9px!important}
  .btn-xs{height:30px!important;min-height:30px!important;padding:0 9px!important;border-radius:9px!important;font-size:8px!important}
  .btn-lg{height:44px!important;min-height:44px!important;padding:0 18px!important;border-radius:12px!important;font-size:11px!important}
  .btn-block{width:100%!important}
  .btn-primary{background:var(--bolt-brand)!important;color:#fff!important;border-color:var(--bolt-brand)!important;box-shadow:0 8px 18px rgba(124,58,237,.16)!important}
  .btn-primary:hover{background:var(--bolt-brand-2)!important;border-color:var(--bolt-brand-2)!important;transform:translateY(-1px)!important}
  .btn-secondary{background:var(--bolt-surface)!important;color:var(--bolt-text)!important;border-color:var(--bolt-border)!important}
  .btn-ghost{background:transparent!important;color:var(--bolt-text)!important;border-color:var(--bolt-border)!important}
  .btn-danger,.btn-danger-outline{color:var(--bolt-danger)!important}
  .btn-danger{background:var(--bolt-danger)!important;color:#fff!important;border-color:var(--bolt-danger)!important}

  /* App frame / Bolt three-column composition */
  #app-shell{min-height:100vh!important;background:var(--bolt-bg)!important}
  .main-area{margin-left:var(--bolt-sidebar)!important;min-height:100vh!important;background:var(--bolt-bg)!important}
  .sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;width:var(--bolt-sidebar)!important;background:var(--bolt-surface)!important;border-right:1px solid var(--bolt-border)!important;z-index:40!important}
  .sidebar-inner{height:100%!important;padding:18px!important;display:flex!important;flex-direction:column!important}
  .sidebar-brand{margin-bottom:18px!important}.brand-logo{width:40px!important;height:40px!important;border-radius:14px!important;background:linear-gradient(135deg,var(--bolt-brand),#a78bfa)!important;color:#fff!important}
  .side-item{min-height:42px!important;padding:10px 12px!important;border-radius:12px!important;color:var(--bolt-muted)!important;font-size:11px!important;gap:11px!important}
  .side-item.active{background:var(--bolt-brand-soft)!important;color:var(--bolt-brand)!important}
  .side-icon{width:20px!important;text-align:center!important;font-size:14px!important}
  .side-action{height:36px!important;min-height:36px!important;padding:0 11px!important;border-radius:10px!important;color:var(--bolt-muted)!important;font-size:9px!important}
  .sidebar-collapse{width:32px!important;height:32px!important;min-height:32px!important;border-radius:10px!important;background:var(--bolt-brand)!important;color:#fff!important}

  .header{position:sticky!important;top:0!important;height:60px!important;background:color-mix(in srgb,var(--bolt-surface) 92%,transparent)!important;border-bottom:1px solid var(--bolt-border)!important;z-index:30!important}
  .header-inner{height:100%!important;padding:0 18px!important;gap:12px!important}
  .header-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important}
  .icon-btn{width:36px!important;height:36px!important;min-width:36px!important;border-radius:10px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;color:var(--bolt-text)!important}
  .profile-trigger{min-height:36px!important;padding:4px 8px 4px 4px!important;border-radius:12px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important}
  .profile-avatar-mini{width:30px!important;height:30px!important;border-radius:9px!important}
  .profile-text strong{font-size:9px!important}.profile-text small{font-size:8px!important}
  .profile-menu{width:196px!important;padding:6px!important;border-radius:14px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;box-shadow:var(--bolt-shadow)!important}
  .profile-menu button{height:34px!important;min-height:34px!important;padding:0 10px!important;border-radius:9px!important;font-size:9px!important;color:var(--bolt-text)!important}
  .profile-menu button.danger,#logout-btn{height:34px!important;min-height:34px!important;color:var(--bolt-danger)!important}

  /* Universal page rhythm */
  #page-root{max-width:1160px!important;margin:0 auto!important;padding:26px 24px 44px!important}
  .page-title{margin-bottom:22px!important}.page-title h1{font-size:36px!important;line-height:1.04!important;letter-spacing:-.045em!important}.page-title p{font-size:11px!important;line-height:1.65!important;color:var(--bolt-muted)!important}
  .content-section{margin-top:30px!important}.section-title{margin-bottom:14px!important}.section-title h2{font-size:22px!important;letter-spacing:-.035em!important}
  .card-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}
  .card,.syka-card,.panel-card,.kpi-card,.form-card{background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;border-radius:18px!important;box-shadow:var(--bolt-shadow-sm)!important}

  /* Competition cards */
  .competition-card,.competition-card-v46{height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
  .competition-card-media,.competition-media-v46{display:block!important;position:relative!important;aspect-ratio:16/9!important;height:auto!important;min-height:0!important;overflow:hidden!important;background:var(--bolt-surface-2)!important}
  .competition-card-media img,.competition-media-v46 img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important}
  .competition-card-body,.competition-card-body-v46{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;padding:14px!important}
  .competition-card-body h3,.competition-card-body-v46 h3{font-size:14px!important;line-height:1.35!important;min-height:38px!important;margin:8px 0 5px!important}
  .competition-card-body p,.competition-card-body-v46 p{font-size:10px!important;line-height:1.55!important;min-height:31px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;color:var(--bolt-muted)!important}
  .competition-card-meta,.competition-meta-v46{margin-top:auto!important;padding-top:12px!important}
  .chip,.status-pill,.competition-date-badge{min-height:22px!important;padding:0 8px!important;border-radius:999px!important;font-size:8px!important;display:inline-flex!important;align-items:center!important}

  /* Home composition */
  .bolt-home-layout{display:grid!important;grid-template-columns:minmax(0,1fr) var(--bolt-rail)!important;gap:18px!important;align-items:start!important;width:100%!important;max-width:1160px!important;margin:0 auto!important}
  .bolt-home-main{min-width:0!important}.home-right-rail{display:grid!important;gap:12px!important;min-width:0!important}
  .home-welcome{padding:5px 0 12px!important}.home-welcome h1{font-size:34px!important;line-height:1.05!important;margin:5px 0!important}.home-welcome p{font-size:11px!important;line-height:1.65!important;color:var(--bolt-muted)!important}
  .home-tabs-card{padding:0!important;overflow:hidden!important}.home-tabs{display:flex!important;gap:4px!important;padding:5px!important}.home-tabs button{height:36px!important;min-height:36px!important;padding:0 14px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:var(--bolt-muted)!important;font-size:10px!important;font-weight:900!important}.home-tabs button.active{background:var(--bolt-brand-soft)!important;color:var(--bolt-brand)!important}
  .quick-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;margin-top:12px!important}.quick-action{display:flex!important;align-items:center!important;gap:12px!important;min-height:82px!important;padding:14px!important;border:1px solid var(--bolt-border)!important;border-radius:16px!important;background:var(--bolt-surface)!important;box-shadow:var(--bolt-shadow-sm)!important}.quick-action-icon{width:40px!important;height:40px!important;min-width:40px!important;border-radius:12px!important;background:var(--bolt-brand-soft)!important;color:var(--bolt-brand)!important;display:grid!important;place-items:center!important}.quick-action strong{font-size:11px!important}.quick-action small{font-size:9px!important;line-height:1.5!important;color:var(--bolt-muted)!important}.quick-arrow{font-size:15px!important;color:var(--bolt-muted)!important}
  .home-profile-summary{overflow:hidden!important;padding:0!important}.profile-summary-cover{height:88px!important;background:radial-gradient(circle at 80% 20%,rgba(139,92,246,.35),transparent 45%),linear-gradient(135deg,#27183f,#10182d)!important}.profile-summary-body{padding:0 14px 14px!important;margin-top:-18px!important;position:relative!important}.profile-summary-body .x-avatar-lg{width:54px!important;height:54px!important;border:4px solid var(--bolt-surface)!important;border-radius:16px!important}.home-progress-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important}.home-progress-stats>div{min-height:64px!important;padding:10px!important;border:1px solid var(--bolt-border)!important;border-radius:12px!important;background:var(--bolt-surface-2)!important}.home-progress-stats b{font-size:16px!important}.home-progress-stats small{font-size:8px!important;color:var(--bolt-muted)!important}
  .home-feed-list{display:grid!important;gap:12px!important}.social-post{overflow:hidden!important}.social-post-head{padding:12px 14px 7px!important}.social-post-body{padding:8px 14px 12px!important}.social-post-body h3{font-size:15px!important;line-height:1.35!important}.social-post-body p{font-size:10px!important;line-height:1.6!important}.social-post-stats{padding:8px 14px 10px!important}

  /* Tasks */
  .task-grid-v410{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.task-card-v410{display:flex!important;gap:13px!important;min-height:136px!important;padding:15px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;border-radius:18px!important;box-shadow:var(--bolt-shadow-sm)!important}.task-icon-v410{width:42px!important;height:42px!important;min-width:42px!important;border-radius:13px!important;background:var(--bolt-brand-soft)!important;color:var(--bolt-brand)!important;display:grid!important;place-items:center!important}.task-body-v410{display:flex!important;flex:1!important;min-width:0!important;flex-direction:column!important}.task-body-v410 h2{font-size:15px!important;line-height:1.35!important;margin:8px 0 5px!important}.task-body-v410 p{font-size:9px!important;line-height:1.55!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;color:var(--bolt-muted)!important}.task-meta-v410{gap:5px!important}.task-meta-v410 span{height:22px!important;padding:0 7px!important;font-size:7px!important;border-radius:999px!important;background:var(--bolt-surface-2)!important;color:var(--bolt-muted)!important}.task-actions-v410{margin-top:auto!important;padding-top:10px!important;display:flex!important;gap:7px!important}

  /* Catalog / filter */
  .catalog-toolbar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap!important;padding:12px!important;border-radius:16px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;box-shadow:var(--bolt-shadow-sm)!important}.search-wrap{min-width:280px!important;height:40px!important;border-radius:11px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important}.filter-pill{height:32px!important;padding:0 10px!important;border-radius:999px!important;font-size:9px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;color:var(--bolt-muted)!important}.filter-pill.active{background:var(--bolt-brand-soft)!important;border-color:#7c3aed30!important;color:var(--bolt-brand)!important}

  /* Admin / organizer */
  .control-head{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:18px!important;margin-bottom:16px!important}.control-head h1{font-size:30px!important;line-height:1.05!important;margin:5px 0!important}.control-head p{font-size:10px!important;color:var(--bolt-muted)!important}.control-tabs{display:flex!important;gap:4px!important;overflow:auto!important;padding:4px!important;margin-bottom:16px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;border-radius:14px!important;scrollbar-width:none!important}.control-tab{height:34px!important;min-height:34px!important;padding:0 10px!important;border:0!important;border-radius:9px!important;font-size:9px!important;font-weight:900!important;background:transparent!important;color:var(--bolt-muted)!important;white-space:nowrap!important}.control-tab.active{background:var(--bolt-brand-soft)!important;color:var(--bolt-brand)!important}.control-table{overflow:auto!important;border:1px solid var(--bolt-border)!important;border-radius:16px!important;background:var(--bolt-surface)!important}.control-table table{width:100%!important;font-size:9px!important}.control-table th{background:var(--bolt-surface-2)!important;color:var(--bolt-muted)!important;padding:10px!important}.control-table td{padding:10px!important;border-top:1px solid var(--bolt-border)!important}

  /* Auth + modal: modal is appended to body, not #page-root */
  .syka-modal-backdrop{position:fixed!important;inset:0!important;z-index:9999!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(15,23,42,.58)!important;backdrop-filter:blur(8px)!important}
  .syka-modal{width:min(560px,calc(100vw - 28px))!important;max-height:calc(100vh - 36px)!important;overflow:auto!important;border-radius:20px!important;background:var(--bolt-surface)!important;color:var(--bolt-text)!important;border:1px solid var(--bolt-border)!important;box-shadow:0 28px 90px rgba(15,23,42,.22)!important}
  .syka-modal-wide{width:min(760px,calc(100vw - 28px))!important}.syka-modal-head{min-height:58px!important;padding:12px 16px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-bottom:1px solid var(--bolt-border)!important}.syka-modal-head h2{font-size:16px!important;margin:0!important}.syka-icon-btn{width:34px!important;height:34px!important;min-width:34px!important;border-radius:9px!important;background:var(--bolt-surface-2)!important;color:var(--bolt-muted)!important;border:1px solid var(--bolt-border)!important}.syka-modal-body{padding:16px!important}
  .auth-tabs{display:flex!important;gap:4px!important;padding:4px!important;margin-bottom:12px!important;border-radius:12px!important;background:var(--bolt-surface-2)!important}.auth-tab{height:34px!important;min-height:34px!important;flex:1!important;border:0!important;border-radius:9px!important;background:transparent!important;color:var(--bolt-muted)!important;font-size:10px!important;font-weight:900!important}.auth-tab.active{background:var(--bolt-surface)!important;color:var(--bolt-text)!important;box-shadow:var(--bolt-shadow-sm)!important}
  .form-card{padding:20px!important}.form-card label{font-size:9px!important;color:var(--bolt-muted)!important}.form-card input,.form-card select,.form-card textarea{min-height:40px!important;border-radius:11px!important;background:var(--bolt-surface)!important;border:1px solid var(--bolt-border)!important;color:var(--bolt-text)!important;font-size:10px!important}.form-card textarea{min-height:88px!important}.account-type-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important}.account-type-card{min-height:72px!important;padding:10px!important;border-radius:12px!important;border:1px solid var(--bolt-border)!important;background:var(--bolt-surface)!important}.account-type-card.active{border-color:var(--bolt-brand)!important;background:var(--bolt-brand-soft)!important}.password-toggle{height:28px!important;min-height:28px!important;padding:0 8px!important;border-radius:8px!important;font-size:8px!important}

  @media(max-width:1100px){:root{--bolt-sidebar:224px;--bolt-rail:0px}.main-area{margin-left:var(--bolt-sidebar)!important}.sidebar{width:var(--bolt-sidebar)!important}.bolt-home-layout{grid-template-columns:1fr!important}.home-right-rail{grid-template-columns:repeat(3,minmax(0,1fr))!important}.card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.task-grid-v410{grid-template-columns:1fr 1fr!important}}
  @media(max-width:760px){:root{--bolt-sidebar:0px}.sidebar{display:none!important}.main-area{margin-left:0!important}#page-root{padding:20px 14px 34px!important}.header-inner{padding:0 12px!important}.card-grid,.task-grid-v410{grid-template-columns:1fr!important}.quick-actions{grid-template-columns:1fr!important}.home-right-rail{grid-template-columns:1fr!important}.account-type-grid{grid-template-columns:1fr!important}.catalog-toolbar{align-items:stretch!important}.search-wrap{min-width:0!important;width:100%!important}.control-head{align-items:flex-start!important;flex-direction:column!important}}
  `;
  const mount=()=>{if(!document.getElementById('syka-app-wide-ui-final-style')){const s=document.createElement('style');s.id='syka-app-wide-ui-final-style';s.textContent=STYLE;document.head.appendChild(s)}};
  mount();

  function addTasksToHome(){
    if(!window.SYKA_PAGE_HOME||window.__SYKA_HOME_TASK_BRIDGE__)return;
    window.__SYKA_HOME_TASK_BRIDGE__=true;
    const original=window.SYKA_PAGE_HOME.render;
    window.SYKA_PAGE_HOME.render=async function(root){
      await original(root);
      const auth=window.SYKA_STATE?.getState?.().auth;if(!auth?.user||!window.SYKA_TASK_SERVICE?.listTasks)return;
      const feed=root.querySelector('#home-feed-section');if(!feed||root.querySelector('#home-daily-tasks'))return;
      const section=document.createElement('section');section.id='home-daily-tasks';section.className='content-section';
      section.innerHTML='<div class="section-title"><div><span class="eyebrow">DAILY TASK</span><h2>Misi & reward</h2><p>Selesaikan aktivitas untuk mendapatkan Koin Edu dan EXP.</p></div><a class="text-link" href="'+(window.SYKA_ROUTER?.href?.('/tugas')||'/')+'">Lihat semua →</a></div><div id="home-task-grid" class="task-grid-v410"><div class="empty-card"><strong>Memuat misi…</strong></div></div>';
      feed.parentNode.insertBefore(section,feed);
      const grid=section.querySelector('#home-task-grid');
      try{
        const tasks=await window.SYKA_TASK_SERVICE.listTasks();
        grid.innerHTML=tasks?.length?tasks.slice(0,4).map(t=>'<article class="task-card-v410"><div class="task-icon-v410">✦</div><div class="task-body-v410"><div class="task-meta-v410"><span>'+String(t.task_type||'TASK').replace(/[<>]/g,'')+'</span><span>+'+Number(t.points||0)+' Koin</span><span>+'+Number(t.exp||0)+' EXP</span></div><h2>'+String(t.title||'Misi harian').replace(/[<>]/g,'')+'</h2><p>'+String(t.description||'Selesaikan misi untuk mendapatkan reward.').replace(/[<>]/g,'')+'</p><div class="task-actions-v410"><a class="btn btn-primary btn-sm" href="'+(window.SYKA_ROUTER?.href?.('/tugas')||'/')+'">Mulai misi</a></div></div></article>').join(''):'<div class="empty-card"><strong>Belum ada misi</strong><span>Misi akan muncul saat Admin mengaktifkannya.</span></div>';
      }catch(e){grid.innerHTML='<div class="empty-card"><strong>Misi belum tersedia</strong><span>Coba lagi beberapa saat.</span></div>'}
    };
  }
  function bridgeAuthRoutes(){
    if(window.__SYKA_AUTH_ROUTE_BRIDGE__)return;
    window.__SYKA_AUTH_ROUTE_BRIDGE__=true;
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path!=='/p/app.html'||!window.SYKA_APP?.openAuth)return;
    const q=new URLSearchParams(location.search);const route=q.get('route');
    if(route==='/login'||route==='/register')setTimeout(()=>window.SYKA_APP.openAuth(route==='/register'?'register':'login',{target:'/home'}),0);
  }
  const poll=setInterval(()=>{addTasksToHome();bridgeAuthRoutes();if(window.SYKA_PAGE_HOME&&window.SYKA_APP)clearInterval(poll)},250);
  setTimeout(()=>clearInterval(poll),8000);
})();