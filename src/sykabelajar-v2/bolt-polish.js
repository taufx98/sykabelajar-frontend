/* Sykabelajar Bolt polish layer.
 * Visual-only layer: normalizes sizing, spacing, image ratios, buttons,
 * app shell proportions, and the right-rail visual treatment to match the Bolt
 * reference. Existing services/routes/data remain the source of truth.
 */
(function(){
  if(window.__SYKA_BOLT_POLISH__) return;
  window.__SYKA_BOLT_POLISH__=true;

  const SEARCH_ICON='M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13 M16 16l5 5';
  const SPARK_ICON='M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z';
  const CHART_ICON='M4 19V5 M4 19h16 M8 16v-4 M12 16V8 M16 16v-6';
  const svg=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+d+'"></path></svg>';

  const STYLE=`
    /* ---------- layout tokens ---------- */
    :root{
      --bolt-max:1360px;
      --bolt-side:276px;
      --bolt-rail:312px;
      --bolt-gap:0px;
      --bolt-radius:18px;
      --bolt-card-bg:rgba(14,22,38,.86);
      --bolt-card-bg2:rgba(10,18,31,.92);
      --bolt-border:rgba(255,255,255,.075);
      --bolt-border-hi:rgba(255,255,255,.12);
      --bolt-green:#10b981;
      --bolt-green-hi:#34d399;
    }

    /* ---------- global normalization ---------- */
    html.bolt-ui,html.bolt-ui body{min-width:0!important;overflow-x:hidden!important}
    #page-root.bolt-root{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
    #page-root.bolt-root a{color:inherit}
    #page-root.bolt-root img{display:block}
    .bolt-app{min-height:100vh!important;width:100%!important}
    .bolt-wrap{width:min(var(--bolt-max),100%)!important;grid-template-columns:var(--bolt-side) minmax(0,1fr) var(--bolt-rail)!important;margin:0 auto!important}
    .bolt-main{min-width:0!important}
    .bolt-body{padding:24px 22px 38px!important}
    .bolt-content{width:100%!important;max-width:820px!important;margin:0 auto!important}

    /* ---------- sidebar / navigation ---------- */
    .bolt-side{width:auto!important;min-width:0!important;padding:20px 12px 16px!important;background:rgba(6,12,22,.9)!important;border-right:1px solid var(--bolt-border)!important}
    .bolt-logo{height:44px!important;padding:3px 10px!important;margin:0 0 18px!important;gap:10px!important;white-space:nowrap!important}
    .bolt-mark{width:36px!important;height:36px!important;min-width:36px!important;border-radius:11px!important}
    .bolt-nav{gap:5px!important}
    .bolt-nav a{min-height:44px!important;padding:10px 12px!important;border-radius:12px!important;gap:12px!important;font-size:13px!important;line-height:1!important}
    .bolt-nav a svg{width:19px!important;height:19px!important;flex:0 0 19px!important}
    .bolt-nav a.active{background:rgba(16,185,129,.115)!important;color:#6ee7b7!important;box-shadow:inset 3px 0 0 rgba(16,185,129,.72)!important}
    .bolt-user{margin-top:12px!important;padding-top:12px!important}
    .bolt-user-card{min-height:52px!important;padding:8px!important}
    .bolt-rank-card{padding:12px!important}
    .bolt-logout{min-height:40px!important}

    /* ---------- top bar ---------- */
    .bolt-top{min-height:58px!important;padding:0 20px!important}
    .bolt-top-title{font-size:14px!important;color:#b7c2d4!important}
    .bolt-top-actions{gap:8px!important}
    .bolt-icon-btn{width:36px!important;height:36px!important;min-width:36px!important;padding:0!important}
    .bolt-icon-btn svg{width:17px!important;height:17px!important}

    /* ---------- buttons: one visual language ---------- */
    .bolt-btn{height:40px!important;min-height:40px!important;padding:0 16px!important;border-radius:11px!important;line-height:1!important;white-space:nowrap!important;font-size:12px!important;font-weight:700!important;vertical-align:middle!important;box-sizing:border-box!important}
    .bolt-btn.primary{background:linear-gradient(180deg,#10b981,#059669)!important;box-shadow:0 8px 22px rgba(16,185,129,.15)!important}
    .bolt-btn.primary:hover{background:linear-gradient(180deg,#34d399,#10b981)!important;transform:translateY(-1px)!important}
    .bolt-btn.outline{border:1px solid rgba(255,255,255,.12)!important;background:rgba(255,255,255,.015)!important}
    .bolt-btn.ghost{background:transparent!important;border:1px solid transparent!important}
    .bolt-actions{gap:10px!important;align-items:center!important}
    .bolt-actions .bolt-btn{min-width:0!important}
    .bolt-top-actions .bolt-btn{height:38px!important;min-height:38px!important}
    .bolt-btn.full{display:flex!important;width:100%!important}

    /* ---------- cards and consistent grids ---------- */
    .bolt-card{border-radius:var(--bolt-radius)!important;border:1px solid var(--bolt-border)!important;background:var(--bolt-card-bg)!important;box-shadow:0 10px 30px rgba(0,0,0,.16)!important}
    .bolt-card.hover{transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease!important}
    .bolt-card.hover:hover{transform:translateY(-2px)!important;border-color:var(--bolt-border-hi)!important;box-shadow:0 16px 40px rgba(0,0,0,.22)!important}
    .bolt-grid-2,.bolt-grid-3,.bolt-feature-grid,.bolt-admin-grid{align-items:stretch!important}
    .bolt-grid-2>.bolt-card,.bolt-grid-2>a.bolt-card,.bolt-grid-3>.bolt-card,.bolt-grid-3>a.bolt-card{display:flex!important;flex-direction:column!important;height:100%!important;min-height:0!important}
    .bolt-grid-2>.bolt-card .bolt-card-body,.bolt-grid-2>a.bolt-card .bolt-card-body,.bolt-grid-3>.bolt-card .bolt-card-body,.bolt-grid-3>a.bolt-card .bolt-card-body{display:flex!important;flex:1 1 auto!important;flex-direction:column!important;min-height:126px!important}
    .bolt-grid-2>.bolt-card .bolt-meta,.bolt-grid-2>a.bolt-card .bolt-meta,.bolt-grid-3>.bolt-card .bolt-meta,.bolt-grid-3>a.bolt-card .bolt-meta{margin-top:auto!important;padding-top:14px!important}
    .bolt-section{padding:24px 0 34px!important}
    .bolt-section-head{min-height:40px!important;margin-bottom:16px!important;align-items:end!important}
    .bolt-section-head h2{font-size:22px!important;line-height:1.15!important}
    .bolt-section-head p{font-size:11px!important;line-height:1.5!important}
    .bolt-grid-2{gap:14px!important}
    .bolt-grid-3,.bolt-feature-grid,.bolt-admin-grid{gap:12px!important}

    /* ---------- image consistency ---------- */
    .bolt-cover{height:auto!important;aspect-ratio:16 / 7.25!important;min-height:164px!important;max-height:200px!important;border-radius:17px 17px 0 0!important;overflow:hidden!important;position:relative!important;background:linear-gradient(135deg,#12243a 0%,#0b302e 100%)!important}
    .bolt-cover img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;opacity:.72!important}
    .bolt-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,10,19,.03),rgba(4,10,19,.2))!important;pointer-events:none}
    .bolt-card-body{padding:15px 16px 16px!important}
    .bolt-title{font-size:15px!important;line-height:1.35!important;min-height:40px!important}
    .bolt-desc{font-size:11px!important;line-height:1.55!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
    .bolt-chip{min-height:24px!important;padding:0 9px!important;font-size:9px!important;line-height:1!important}

    /* ---------- feed/media */
    .bolt-post-actions{gap:18px!important}
    .bolt-post-actions button{min-height:30px!important}
    .bolt-post img{width:100%!important;max-height:360px!important;object-fit:cover!important;border-radius:12px!important}

    /* ---------- forms ---------- */
    .bolt-input{height:42px!important;min-height:42px!important;border-radius:11px!important;padding-top:0!important;padding-bottom:0!important}
    textarea.bolt-input{height:auto!important;min-height:94px!important;padding-top:11px!important;padding-bottom:11px!important}
    .bolt-label{font-size:10px!important;line-height:1.4!important}
    .bolt-field{margin-bottom:13px!important}
    .bolt-auth{padding:32px 16px!important}
    .bolt-auth-card{width:min(440px,100%)!important}
    .bolt-auth-card>.bolt-card{padding:24px!important}

    /* ---------- stats ---------- */
    .bolt-stat-grid{gap:10px!important}
    .bolt-stat{min-height:90px!important;padding:14px!important;border-radius:14px!important}
    .bolt-stat strong{font-size:21px!important}

    /* ---------- right rail: reference-style visual blocks ---------- */
    .bolt-rail{width:auto!important;padding:14px 12px 18px!important;gap:12px!important;overflow:auto!important}
    .bolt-rail-card{padding:14px!important;border-radius:16px!important;overflow:hidden!important;background:rgba(14,22,38,.88)!important}
    .bolt-rail-card.polish-search{height:140px!important;display:flex!important;align-items:stretch!important}
    .bolt-rail-card.polish-trending{height:286px!important}
    .bolt-rail-card.polish-ranking{height:350px!important}
    .bolt-rail-card.polish-deadline{min-height:135px!important}
    .bolt-rail-visual{height:150px!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#e8eef8!important;position:relative!important}
    .bolt-rail-visual svg{width:105px!important;height:105px!important;stroke-width:1.35!important}
    .polish-search .bolt-search{height:100%!important;display:flex!important;align-items:center!important;position:relative!important}
    .polish-search .bolt-search>span{position:absolute!important;left:14px!important;top:50%!important;transform:translateY(-50%)!important;width:94px!important;height:94px!important;color:#aebbd0!important;display:grid!important;place-items:center!important;z-index:2!important;pointer-events:none!important}
    .polish-search .bolt-search>span svg{width:78px!important;height:78px!important;stroke-width:1.35!important}
    .polish-search .bolt-input{height:100%!important;padding-left:104px!important;padding-right:10px!important;border:1px solid transparent!important;background:transparent!important;font-size:11px!important;color:#8492a7!important}
    .polish-search .bolt-input::placeholder{color:#7f8ca0!important;opacity:1!important}
    .polish-trending .bolt-rail-title,.polish-ranking .bolt-rail-title{margin:0 4px 6px!important;font-size:11px!important;min-height:24px!important}
    .polish-trending .bolt-rail-visual{height:146px!important;margin-top:-2px!important}
    .polish-ranking .bolt-rail-visual{height:156px!important;margin-top:-4px!important}
    .polish-trending .bolt-rail-visual svg{width:104px!important;height:104px!important}
    .polish-ranking .bolt-rail-visual svg{width:118px!important;height:118px!important}
    .polish-trending .bolt-trend{padding:7px 2px!important;gap:8px!important}
    .polish-ranking .bolt-board-row{padding:6px 2px!important}
    .polish-ranking .bolt-avatar{width:28px!important;height:28px!important;min-width:28px!important}
    .polish-ranking .bolt-rank-num{width:18px!important}
    .polish-ranking .bolt-board-copy strong{font-size:10px!important}
    .polish-ranking .bolt-board-copy small{font-size:8px!important}
    .polish-ranking .bolt-score{font-size:9px!important}

    /* ---------- landing: match Bolt reference ---------- */
    .bolt-landing{width:100%!important;min-height:100vh!important}
    .bolt-landing>.bolt-top{width:min(1200px,calc(100% - 32px))!important;margin:0 auto!important;padding:0!important;border-bottom:1px solid rgba(255,255,255,.06)!important;background:rgba(7,11,20,.72)!important}
    .bolt-landing>.bolt-top .bolt-logo{padding:0!important;margin:0!important}
    .bolt-landing-nav{display:flex;align-items:center;gap:18px!important}
    .bolt-landing-nav-links{display:flex!important;align-items:center!important;gap:4px!important;margin-left:auto!important}
    .bolt-landing-nav-links a{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:36px!important;padding:0 11px!important;border-radius:9px!important;color:#91a0b5!important;text-decoration:none!important;font-size:11px!important;font-weight:600!important}
    .bolt-landing-nav-links a:hover{color:#fff!important;background:rgba(255,255,255,.04)!important}
    .bolt-landing>.bolt-top .bolt-top-actions{margin-left:0!important}
    .bolt-landing .bolt-hero{padding:56px 0 66px!important}
    .bolt-landing .bolt-hero-grid{width:min(1200px,calc(100% - 32px))!important;margin:0 auto!important;grid-template-columns:minmax(0,1.08fr) minmax(430px,.92fr)!important;gap:60px!important}
    .bolt-landing .bolt-hero h1{font-size:clamp(44px,5vw,68px)!important;letter-spacing:-.045em!important;line-height:1.01!important;max-width:620px!important}
    .bolt-landing .bolt-hero p{font-size:14px!important;line-height:1.75!important;max-width:600px!important}
    .bolt-landing .bolt-metrics{gap:24px!important}
    .bolt-landing .bolt-metrics strong{font-size:18px!important}
    .bolt-landing .bolt-metrics span{font-size:9px!important}
    .bolt-landing .bolt-board .bolt-card{padding:18px!important}
    .bolt-landing .bolt-board{max-width:none!important}
    .bolt-landing .bolt-board-row{padding:8px 4px!important}
    .bolt-landing>.bolt-section{width:min(1200px,calc(100% - 32px))!important;margin:0 auto!important;padding-top:24px!important}
    .bolt-landing .bolt-section-head h2{font-size:23px!important}
    .bolt-landing .bolt-feature-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .bolt-landing .bolt-feature{min-height:128px!important;padding:16px!important}
    .bolt-landing .bolt-cta{padding:34px!important}
    .bolt-landing .bolt-btn{height:40px!important}

    /* ---------- responsive ---------- */
    @media(max-width:1180px){
      :root{--bolt-side:250px;--bolt-rail:292px}
      .bolt-landing .bolt-hero-grid{gap:38px!important}
    }
    @media(max-width:980px){
      :root{--bolt-side:224px;--bolt-rail:0px}
      .bolt-wrap{grid-template-columns:var(--bolt-side) minmax(0,1fr)!important}
      .bolt-rail{display:none!important}
      .bolt-content{max-width:840px!important}
      .bolt-landing .bolt-hero-grid{grid-template-columns:1fr!important;max-width:760px!important}
      .bolt-landing .bolt-board{max-width:620px!important}
      .bolt-landing .bolt-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:760px){
      :root{--bolt-side:0px}
      .bolt-wrap{display:block!important}
      .bolt-body{padding:14px 12px 84px!important}
      .bolt-content{max-width:none!important}
      .bolt-main{border:0!important}
      .bolt-top{padding:0 14px!important}
      .bolt-side{display:none!important}
      .bolt-grid-2,.bolt-grid-3,.bolt-feature-grid,.bolt-admin-grid{grid-template-columns:1fr!important}
      .bolt-cover{min-height:160px!important;aspect-ratio:16 / 8!important}
      .bolt-landing>.bolt-top{width:calc(100% - 24px)!important}
      .bolt-landing .bolt-hero{padding:38px 0 44px!important}
      .bolt-landing .bolt-hero-grid{width:calc(100% - 24px)!important}
      .bolt-landing .bolt-feature-grid{grid-template-columns:1fr!important}
      .bolt-landing .bolt-metrics{gap:14px!important}
      .bolt-landing .bolt-metrics>div+div{padding-left:14px!important}
      .bolt-landing-nav-links{display:none!important}
      .bolt-landing>.bolt-top .bolt-top-actions .ghost{display:none!important}
      .bolt-auth-card>.bolt-card{padding:20px!important}
    }
  `;

  function addStyle(){
    if(document.getElementById('syka-bolt-polish-style')) return;
    const s=document.createElement('style');
    s.id='syka-bolt-polish-style';
    s.textContent=STYLE;
    document.head.appendChild(s);
  }

  function addLandingNav(){
    const top=document.querySelector('.bolt-landing>.bolt-top');
    if(!top || top.querySelector('.bolt-landing-nav-links')) return;
    const actions=top.querySelector('.bolt-top-actions');
    if(!actions) return;
    const nav=document.createElement('nav');
    nav.className='bolt-landing-nav-links';
    nav.innerHTML='<a href="?route=/lomba">Kompetisi</a><a href="?route=/student">Belajar</a><a href="?route=/organizer">Organizer</a>';
    top.insertBefore(nav,actions);
  }

  function decorateRail(){
    document.querySelectorAll('.bolt-rail-card').forEach(card=>{
      if(card.dataset.boltPolished==='1') return;
      card.dataset.boltPolished='1';
      const title=card.querySelector('.bolt-rail-title')?.textContent?.toLowerCase()||'';
      if(card.querySelector('.bolt-search')){
        card.classList.add('polish-search');
        return;
      }
      if(title.includes('trending')){
        card.classList.add('polish-trending');
        const vis=document.createElement('div');
        vis.className='bolt-rail-visual';
        vis.innerHTML=svg(SPARK_ICON);
        const heading=card.querySelector('.bolt-rail-title');
        if(heading) heading.after(vis); else card.prepend(vis);
        return;
      }
      if(title.includes('top 5')){
        card.classList.add('polish-ranking');
        const vis=document.createElement('div');
        vis.className='bolt-rail-visual';
        vis.innerHTML=svg(CHART_ICON);
        const heading=card.querySelector('.bolt-rail-title');
        if(heading) heading.after(vis); else card.prepend(vis);
        return;
      }
      if(title.includes('deadline')) card.classList.add('polish-deadline');
    });
  }

  function fixInteractiveSizing(){
    document.querySelectorAll('#page-root.bolt-root button').forEach(btn=>{
      if(btn.classList.contains('bolt-icon-btn')) return;
      if(btn.closest('.bolt-nav')) return;
      if(btn.matches('[data-bolt-menu]')) return;
      if(!btn.classList.contains('bolt-btn') && !btn.classList.contains('bolt-logout')){
        btn.style.minHeight=btn.style.minHeight||'36px';
        btn.style.boxSizing='border-box';
      }
    });
  }

  function paint(){
    addStyle();
    if(document.querySelector('.bolt-landing')) addLandingNav();
    decorateRail();
    fixInteractiveSizing();
    document.documentElement.dataset.sykabelajar='v2';
  }

  paint();
  const observer=new MutationObserver(()=>paint());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',paint,{once:true});
}());
