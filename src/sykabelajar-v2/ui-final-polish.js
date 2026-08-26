/* Final Bolt UI visual normalizer. No business logic or data ownership lives here. */
(function(){
  if(window.__SYKA_UI_FINAL_POLISH__) return;
  window.__SYKA_UI_FINAL_POLISH__=true;
  const STYLE=`
  /* ---------------- tokens ---------------- */
  :root{
    --bolt-content-max:1160px;
    --bolt-sidebar:252px;
    --bolt-rail:292px;
    --bolt-gap:18px;
    --bolt-r:18px;
    --bolt-r-sm:12px;
  }

  /* ---------------- app frame ---------------- */
  #page-root{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
  #page-root .main-area{min-width:0!important}
  #page-root .content-shell,#page-root .app-content,#page-root .page-shell{width:100%!important;max-width:none!important}
  #page-root .app-grid,#page-root .dashboard-grid{align-items:start!important}

  /* ---------------- real Sykabelajar buttons ---------------- */
  #page-root .btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;box-sizing:border-box!important;height:40px!important;min-height:40px!important;padding:0 14px!important;border-radius:11px!important;font-size:11px!important;line-height:1!important;font-weight:800!important;white-space:nowrap!important}
  #page-root .btn.btn-sm{height:34px!important;min-height:34px!important;padding:0 11px!important;font-size:10px!important;border-radius:10px!important}
  #page-root .btn.btn-xs{height:30px!important;min-height:30px!important;padding:0 9px!important;font-size:9px!important;border-radius:9px!important}
  #page-root .btn.btn-lg{height:44px!important;min-height:44px!important;padding:0 18px!important;font-size:12px!important;border-radius:12px!important}
  #page-root .btn-block{width:100%!important}
  #page-root .header-actions .btn{width:auto!important;height:36px!important;min-height:36px!important;padding:0 13px!important}
  #page-root #header-login{width:auto!important;max-width:112px!important}
  #page-root #logout-btn{width:100%!important;height:36px!important;min-height:36px!important}
  #page-root .side-action{height:38px!important;min-height:38px!important;padding:0 10px!important;border-radius:10px!important;font-size:10px!important}
  #page-root .sidebar-collapse{width:32px!important;height:32px!important;min-height:32px!important;padding:0!important}

  /* ---------------- icon buttons / controls ---------------- */
  #page-root .icon-btn{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;padding:0!important;border-radius:11px!important}
  #page-root .profile-trigger{min-height:36px!important;padding:4px 8px 4px 4px!important;border-radius:13px!important}
  #page-root .profile-avatar-mini{width:30px!important;height:30px!important;border-radius:10px!important}
  #page-root .profile-text strong{font-size:10px!important}
  #page-root .profile-text small{font-size:8px!important}

  /* ---------------- sidebar ---------------- */
  #page-root .sidebar{width:var(--bolt-sidebar)!important}
  #page-root .sidebar-inner{padding:16px 14px!important}
  #page-root .sidebar-brand{margin-bottom:16px!important}
  #page-root .brand-logo{width:38px!important;height:38px!important;border-radius:12px!important;font-size:16px!important}
  #page-root .side-item{min-height:42px!important;padding:9px 11px!important;border-radius:11px!important;font-size:11px!important;gap:11px!important}
  #page-root .side-icon{width:20px!important;font-size:14px!important}
  #page-root .main-area{margin-left:var(--bolt-sidebar)!important}

  /* ---------------- header ---------------- */
  #page-root .header{height:60px!important}
  #page-root .header-inner{grid-template-columns:minmax(0,1fr) minmax(220px,.9fr) minmax(0,1fr)!important;gap:12px!important;padding:0 18px!important}
  #page-root .header-announcement{height:34px!important;padding:0 12px!important;font-size:9px!important;border-radius:999px!important;min-width:0!important}
  #page-root .announcement-marquee{min-width:0!important;overflow:hidden!important}
  #page-root .announcement-marquee span{font-size:9px!important}
  #page-root .header-actions{gap:7px!important}

  /* ---------------- content rhythm ---------------- */
  #page-root{font-size:12px!important}
  #page-root .page-title{margin-bottom:20px!important}
  #page-root .page-title h1{font-size:34px!important;line-height:1.05!important;margin:5px 0!important}
  #page-root .page-title p{font-size:11px!important;line-height:1.65!important}
  #page-root .content-section{margin-top:28px!important}
  #page-root .section-title{margin-bottom:13px!important}
  #page-root .section-title h2{font-size:22px!important}

  /* ---------------- cards ---------------- */
  #page-root .card,#page-root .syka-card,#page-root .panel-card,#page-root .kpi-card{border-radius:16px!important}
  #page-root .card-grid{gap:12px!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}
  #page-root .competition-card{height:100%!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
  #page-root .competition-card-media{aspect-ratio:16 / 9!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important;border-radius:16px 16px 0 0!important}
  #page-root .competition-card-media img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
  #page-root .competition-card-body{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;padding:14px!important}
  #page-root .competition-card-body h3{font-size:14px!important;line-height:1.35!important;min-height:38px!important;margin:7px 0 5px!important}
  #page-root .competition-card-body p{display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;font-size:10px!important;line-height:1.55!important;min-height:31px!important}
  #page-root .competition-card-meta{margin-top:auto!important;padding-top:13px!important}
  #page-root .chip,#page-root .status-pill{min-height:22px!important;padding:0 8px!important;border-radius:999px!important;font-size:8px!important}

  /* ---------------- feed ---------------- */
  #page-root .post-card,#page-root .feed-card,#page-root .post{overflow:hidden!important;border-radius:16px!important}
  #page-root .post-media img,#page-root .post-card img,#page-root .feed-card img{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:420px!important;object-fit:cover!important;border-radius:13px!important}
  #page-root .post-actions{min-height:34px!important;gap:16px!important}

  /* ---------------- home hero / stats ---------------- */
  #page-root .hero-v3{min-height:400px!important;gap:14px!important}
  #page-root .hero-main{padding:30px!important;border-radius:22px!important}
  #page-root .hero-main h1{font-size:52px!important;line-height:1!important}
  #page-root .hero-main p{font-size:12px!important;line-height:1.7!important}
  #page-root .hero-actions{gap:8px!important;margin-top:20px!important}
  #page-root .hero-stats{gap:8px!important;margin-top:24px!important}
  #page-root .stat-card{padding:12px!important;border-radius:13px!important}
  #page-root .stat-card strong{font-size:20px!important}

  /* ---------------- forms / auth ---------------- */
  #page-root .form-card{border-radius:18px!important;padding:20px!important}
  #page-root .form-card input,#page-root .form-card textarea,#page-root .form-card select,#page-root .input{min-height:40px!important;border-radius:11px!important;font-size:11px!important}
  #page-root .form-card textarea{min-height:90px!important}
  #page-root .form-card .btn-block{height:42px!important;min-height:42px!important}
  #page-root .auth-form>.btn-block{height:42px!important;font-size:11px!important}
  #page-root .account-type-grid{gap:8px!important}
  #page-root .account-type-card{min-height:68px!important;border-radius:13px!important;padding:11px!important}

  /* ---------------- admin / organizer ---------------- */
  #page-root .admin-shell,#page-root .organizer-shell{width:100%!important;max-width:none!important}
  #page-root .admin-nav,#page-root .organizer-nav{gap:5px!important}
  #page-root .admin-nav button,#page-root .organizer-nav button{height:38px!important;min-height:38px!important;padding:0 11px!important;border-radius:10px!important;font-size:10px!important}
  #page-root .admin-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}
  #page-root .admin-list-row,#page-root .organizer-list-row{min-height:60px!important;padding:10px 12px!important;border-radius:12px!important}
  #page-root .admin-list-row .btn,#page-root .organizer-list-row .btn{height:32px!important;min-height:32px!important;font-size:9px!important;padding:0 10px!important}
  #page-root .kpi-card{min-height:92px!important;padding:14px!important}
  #page-root .kpi-card strong{font-size:22px!important}

  /* ---------------- rail ---------------- */
  #page-root .right-rail,#page-root .rail{width:var(--bolt-rail)!important;min-width:var(--bolt-rail)!important}
  #page-root .rail-card{border-radius:15px!important;padding:13px!important}

  /* ---------------- ensure no giant media/buttons ---------------- */
  #page-root button img{max-width:100%!important;height:auto!important}
  #page-root button:not(.icon-btn):not(.sidebar-collapse):not(.mobile-menu){max-width:100%!important}

  /* ---------------- responsive ---------------- */
  @media(max-width:1100px){
    :root{--bolt-sidebar:224px;--bolt-rail:0px}
    #page-root .main-area{margin-left:var(--bolt-sidebar)!important}
    #page-root .sidebar{width:var(--bolt-sidebar)!important}
    #page-root .right-rail,#page-root .rail{display:none!important}
    #page-root .card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    #page-root .admin-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  }
  @media(max-width:760px){
    :root{--bolt-sidebar:0px}
    #page-root .sidebar{display:none!important}
    #page-root .main-area{margin-left:0!important}
    #page-root .header{height:56px!important}
    #page-root .header-inner{grid-template-columns:auto minmax(0,1fr) auto!important;padding:0 12px!important}
    #page-root .header-announcement{display:none!important}
    #page-root .page-title h1{font-size:30px!important}
    #page-root .hero-v3{display:block!important;min-height:0!important}
    #page-root .hero-main h1{font-size:40px!important}
    #page-root .hero-side{margin-top:12px!important}
    #page-root .card-grid,#page-root .admin-grid{grid-template-columns:1fr!important}
    #page-root .btn.btn-lg{height:42px!important;min-height:42px!important;padding:0 15px!important}
  }
  `;

  function mount(){
    if(!document.getElementById('syka-ui-final-polish')){
      const s=document.createElement('style');s.id='syka-ui-final-polish';s.textContent=STYLE;document.head.appendChild(s);
    }
    document.documentElement.classList.add('syka-ui-final');
  }
  mount();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
