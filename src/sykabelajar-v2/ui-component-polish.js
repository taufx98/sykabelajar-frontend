/* Component-level Bolt UI normalization. Visual only; backend/services remain unchanged. */
(function(){
  if(window.__SYKA_COMPONENT_POLISH__)return;
  window.__SYKA_COMPONENT_POLISH__=true;
  const css=`
  /* HOME: Bolt-style single content column + right rail */
  #page-root .bolt-home-layout{display:grid!important;grid-template-columns:minmax(0,1fr) 292px!important;gap:18px!important;align-items:start!important;width:100%!important;max-width:1160px!important;margin:0 auto!important}
  #page-root .bolt-home-main{min-width:0!important}
  #page-root .home-right-rail{display:grid!important;gap:12px!important;min-width:0!important}
  #page-root .home-welcome{padding:6px 0 14px!important}
  #page-root .home-welcome h1{margin:5px 0!important;font-size:34px!important;line-height:1.05!important;letter-spacing:-.045em!important}
  #page-root .home-welcome p{margin:0!important;max-width:700px!important;color:var(--muted)!important;font-size:11px!important;line-height:1.65!important}
  #page-root .home-tabs-card{padding:0!important;overflow:hidden!important}
  #page-root .home-tabs{display:flex!important;gap:4px!important;padding:5px!important;border-bottom:1px solid var(--border)!important}
  #page-root .home-tabs button{height:36px!important;min-height:36px!important;padding:0 14px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:var(--muted)!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important}
  #page-root .home-tabs button.active{background:var(--brandSoft)!important;color:var(--brand)!important}
  #page-root .quick-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;margin-top:12px!important}
  #page-root .quick-action{display:flex!important;align-items:center!important;gap:12px!important;min-height:86px!important;padding:14px!important;border:1px solid var(--border)!important;border-radius:16px!important;background:var(--surface)!important;box-shadow:var(--shadowSm)!important;text-decoration:none!important;transition:.16s ease!important}
  #page-root .quick-action:hover{transform:translateY(-2px)!important;border-color:#7c3aed30!important}
  #page-root .quick-action-icon{width:40px!important;height:40px!important;min-width:40px!important;border-radius:12px!important;background:var(--brandSoft)!important;color:var(--brand)!important;display:grid!important;place-items:center!important;font-size:17px!important}
  #page-root .quick-action>div{min-width:0!important;display:flex!important;flex-direction:column!important;flex:1!important}
  #page-root .quick-action strong{font-size:11px!important;color:var(--text)!important}
  #page-root .quick-action small{margin-top:4px!important;color:var(--muted)!important;font-size:9px!important;line-height:1.5!important}
  #page-root .quick-arrow{font-size:15px!important;color:var(--muted)!important}
  #page-root .section-title.compact{margin-bottom:10px!important}
  #page-root .section-title.compact h2{font-size:18px!important;margin-top:4px!important}
  #page-root .home-profile-summary{overflow:hidden!important;padding:0!important}
  #page-root .profile-summary-cover{height:92px!important;background:radial-gradient(circle at 80% 20%,rgba(124,58,237,.45),transparent 45%),linear-gradient(135deg,#24173c,#0d1a31)!important}
  #page-root .profile-summary-body{padding:0 14px 14px!important;text-align:left!important;margin-top:-18px!important;position:relative!important}
  #page-root .profile-summary-body .x-avatar-lg{width:54px!important;height:54px!important;border:4px solid var(--surface)!important;border-radius:16px!important;overflow:hidden!important;background:var(--brandSoft)!important;color:var(--brand)!important;display:grid!important;place-items:center!important}
  #page-root .profile-summary-body .x-avatar-lg img{width:100%!important;height:100%!important;object-fit:cover!important}
  #page-root .profile-summary-body strong{display:block!important;margin-top:8px!important;font-size:13px!important}
  #page-root .profile-summary-body>small{display:block!important;margin-top:2px!important;color:var(--muted)!important;font-size:9px!important}
  #page-root .profile-summary-body .btn{margin-top:12px!important}
  #page-root .home-progress-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important}
  #page-root .home-progress-stats>div{min-height:67px!important;padding:10px!important;border:1px solid var(--border)!important;border-radius:12px!important;background:var(--surface2)!important}
  #page-root .home-progress-stats b{display:block!important;font-size:16px!important;letter-spacing:-.03em!important}
  #page-root .home-progress-stats small{display:block!important;color:var(--muted)!important;font-size:8px!important;margin-top:3px!important}
  #page-root .home-feed-list{display:grid!important;gap:12px!important}
  #page-root .social-post{overflow:hidden!important}
  #page-root .social-post-head{display:flex!important;align-items:center!important;gap:10px!important;padding:13px 14px 7px!important}
  #page-root .feed-avatar{width:34px!important;height:34px!important;min-width:34px!important;border-radius:11px!important;display:grid!important;place-items:center!important;overflow:hidden!important;background:var(--brandSoft)!important;color:var(--brand)!important;font-size:10px!important;font-weight:900!important}
  #page-root .feed-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}
  #page-root .social-post-meta{min-width:0!important;display:flex!important;flex-direction:column!important;flex:1!important}
  #page-root .social-post-meta strong{font-size:10px!important}
  #page-root .social-post-meta span,#page-root .social-post-meta time{font-size:8px!important;color:var(--muted)!important;margin-top:2px!important}
  #page-root .social-post-body{display:block!important;padding:9px 14px 13px!important;text-decoration:none!important}
  #page-root .post-kicker{font-size:8px!important;font-weight:900!important;letter-spacing:.12em!important;color:var(--brand)!important}
  #page-root .social-post-body h3{margin:6px 0!important;font-size:16px!important;line-height:1.35!important;letter-spacing:-.025em!important}
  #page-root .social-post-body p{margin:0!important;font-size:10px!important;line-height:1.6!important;color:var(--muted)!important}
  #page-root .social-post-stats{display:flex!important;gap:8px!important;padding:9px 14px 12px!important;border-top:1px solid var(--border)!important}
  #page-root .social-post-stats button{height:28px!important;min-height:28px!important;padding:0 8px!important;border:0!important;background:transparent!important;color:var(--muted)!important;font-size:8px!important;border-radius:8px!important}
  #page-root .social-post-stats button:hover{background:var(--surface2)!important;color:var(--text)!important}

  /* COMPETITION CATALOG / CARDS */
  #page-root .catalog-toolbar{padding:12px!important;border:1px solid var(--border)!important;background:var(--surface)!important;border-radius:16px!important;box-shadow:var(--shadowSm)!important}
  #page-root .search-wrap{height:40px!important;min-width:300px!important;border-radius:11px!important}
  #page-root .filter-pill{height:32px!important;padding:0 10px!important;display:inline-flex!important;align-items:center!important}
  #page-root .competition-card-v46{display:flex!important;flex-direction:column!important;height:100%!important;overflow:hidden!important;background:var(--surface)!important;border:1px solid var(--border)!important;border-radius:18px!important;box-shadow:var(--shadowSm)!important}
  #page-root .competition-media-v46{display:block!important;position:relative!important;aspect-ratio:16 / 9!important;overflow:hidden!important;background:var(--surface2)!important}
  #page-root .competition-media-v46 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
  #page-root .competition-card-body-v46{display:flex!important;flex:1!important;flex-direction:column!important;padding:14px!important}
  #page-root .competition-card-body-v46 h3{min-height:38px!important;font-size:14px!important;line-height:1.35!important;margin:8px 0 5px!important;letter-spacing:-.02em!important}
  #page-root .competition-card-body-v46 h3 a{color:var(--text)!important}
  #page-root .competition-card-body-v46 p{min-height:31px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;color:var(--muted)!important;font-size:10px!important;line-height:1.55!important;margin:0!important}
  #page-root .competition-meta-v46{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin-top:auto!important;padding:12px 0!important}
  #page-root .competition-meta-v46 span{font-size:8px!important;color:var(--muted)!important;line-height:1.4!important}
  #page-root .competition-meta-v46 b{display:block!important;color:var(--text)!important;font-size:8px!important;margin-bottom:2px!important}
  #page-root .competition-card-body-v46>.btn{margin-top:2px!important}

  /* DAILY TASKS */
  #page-root .task-grid-v410{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
  #page-root .task-card-v410{display:flex!important;gap:13px!important;min-height:138px!important;padding:15px!important;border:1px solid var(--border)!important;border-radius:18px!important;background:var(--surface)!important;box-shadow:var(--shadowSm)!important;transition:.16s ease!important}
  #page-root .task-card-v410:hover{transform:translateY(-2px)!important;border-color:#7c3aed30!important}
  #page-root .task-icon-v410{width:42px!important;height:42px!important;min-width:42px!important;border-radius:13px!important;background:var(--brandSoft)!important;color:var(--brand)!important;display:grid!important;place-items:center!important;font-size:18px!important}
  #page-root .task-body-v410{min-width:0!important;display:flex!important;flex-direction:column!important;flex:1!important}
  #page-root .task-meta-v410{display:flex!important;flex-wrap:wrap!important;gap:5px!important}
  #page-root .task-meta-v410 span{height:22px!important;display:inline-flex!important;align-items:center!important;padding:0 7px!important;border-radius:999px!important;background:var(--surface2)!important;color:var(--muted)!important;font-size:7px!important;font-weight:900!important}
  #page-root .task-body-v410 h2{font-size:15px!important;line-height:1.35!important;margin:8px 0 5px!important;letter-spacing:-.02em!important}
  #page-root .task-body-v410 p{font-size:9px!important;line-height:1.55!important;color:var(--muted)!important;margin:0!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
  #page-root .task-actions-v410{display:flex!important;gap:7px!important;margin-top:auto!important;padding-top:12px!important}

  /* ADMIN / ORGANIZER CONTROL PLANE */
  #page-root .control-head{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:18px!important;margin-bottom:16px!important}
  #page-root .control-head h1{font-size:30px!important;line-height:1.05!important;margin:5px 0!important;letter-spacing:-.04em!important}
  #page-root .control-head p{font-size:10px!important;color:var(--muted)!important;margin:0!important;line-height:1.5!important}
  #page-root .security-badge{display:inline-flex!important;align-items:center!important;height:28px!important;padding:0 9px!important;border:1px solid var(--border)!important;border-radius:999px!important;background:var(--surface)!important;color:var(--muted)!important;font-size:8px!important;font-weight:900!important}
  #page-root .control-tabs{display:flex!important;gap:4px!important;overflow-x:auto!important;padding:4px!important;margin-bottom:16px!important;border:1px solid var(--border)!important;background:var(--surface)!important;border-radius:14px!important;scrollbar-width:none!important}
  #page-root .control-tab{height:34px!important;min-height:34px!important;padding:0 10px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:var(--muted)!important;font-size:9px!important;font-weight:900!important;white-space:nowrap!important}
  #page-root .control-tab.active{background:var(--brandSoft)!important;color:var(--brand)!important}
  #page-root .control-content,.control-panel{min-width:0!important}
  #page-root .control-table{width:100%!important;overflow:auto!important;border:1px solid var(--border)!important;border-radius:16px!important;background:var(--surface)!important}
  #page-root table{width:100%!important;border-collapse:collapse!important;font-size:9px!important}
  #page-root th{padding:10px!important;text-align:left!important;color:var(--muted)!important;background:var(--surface2)!important;font-size:8px!important;text-transform:uppercase!important;letter-spacing:.06em!important}
  #page-root td{padding:10px!important;border-top:1px solid var(--border)!important;color:var(--text)!important;vertical-align:middle!important}
  #page-root td .btn{height:30px!important;min-height:30px!important;padding:0 9px!important;font-size:8px!important}

  /* MODAL / AUTH: never huge */
  .modal-dialog{width:min(620px,calc(100vw - 30px))!important;max-width:620px!important;border-radius:20px!important}
  .modal-header{min-height:54px!important;padding:12px 16px!important}
  .modal-title{font-size:15px!important}
  .modal-body{padding:14px 16px!important}
  .auth-tabs{display:flex!important;gap:5px!important;padding:4px!important;background:var(--surface2)!important;border-radius:12px!important;margin-bottom:12px!important}
  .auth-tab{height:34px!important;min-height:34px!important;flex:1!important;border:0!important;border-radius:9px!important;background:transparent!important;font-size:10px!important;font-weight:900!important;color:var(--muted)!important}
  .auth-tab.active{background:var(--surface)!important;color:var(--text)!important;box-shadow:var(--shadowSm)!important}
  .account-type-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important}
  .account-type-card{min-height:76px!important;padding:10px!important;border-radius:12px!important}
  .account-type-icon{font-size:18px!important}
  .account-type-card strong{font-size:9px!important}
  .account-type-card small{font-size:7px!important;line-height:1.4!important}

  @media(max-width:1100px){
    #page-root .bolt-home-layout{grid-template-columns:1fr!important}
    #page-root .home-right-rail{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    #page-root .task-grid-v410{grid-template-columns:1fr 1fr!important}
  }
  @media(max-width:760px){
    #page-root .quick-actions,#page-root .task-grid-v410{grid-template-columns:1fr!important}
    #page-root .home-right-rail{grid-template-columns:1fr!important}
    #page-root .card-grid{grid-template-columns:1fr!important}
    #page-root .catalog-toolbar{align-items:stretch!important}
    #page-root .search-wrap{min-width:0!important;width:100%!important}
    #page-root .control-head{align-items:flex-start!important;flex-direction:column!important}
    #page-root .account-type-grid{grid-template-columns:1fr!important}
    #page-root .task-card-v410{min-height:122px!important}
  }
  `;
  function mount(){if(document.getElementById('syka-component-polish-style'))return;const s=document.createElement('style');s.id='syka-component-polish-style';s.textContent=css;document.head.appendChild(s)}
  mount();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
