/* Sykabelajar V2 runtime coordinator.
 * The application remains a web app inside Blogger. This runtime coordinates
 * the built Sykabelajar router/Bolt UI and owns no business data.
 */
(function(){
  if(window.SYKA_V2_RUNTIME)return;

  function installGlobalUiGuard(){
    if(document.getElementById('syka-v2-ui-guard'))return;
    const style=document.createElement('style');
    style.id='syka-v2-ui-guard';
    style.textContent=`
      /* One sizing contract across every page, including auth modals. */
      #page-root .btn, body > .modal .btn, body > .syka-modal .btn,
      body > button.btn, button.btn, a.btn{
        box-sizing:border-box!important;min-height:40px!important;height:40px!important;
        padding:0 14px!important;border-radius:11px!important;font-size:11px!important;
        line-height:1!important;font-weight:800!important;display:inline-flex!important;
        align-items:center!important;justify-content:center!important;gap:7px!important;
        white-space:nowrap!important;
      }
      #page-root .btn.btn-sm, body > .modal .btn.btn-sm, body > .syka-modal .btn.btn-sm,
      button.btn-sm, a.btn-sm{min-height:34px!important;height:34px!important;padding:0 11px!important;font-size:9px!important;border-radius:10px!important}
      #page-root .btn.btn-lg, body > .modal .btn.btn-lg, body > .syka-modal .btn.btn-lg,
      button.btn-lg, a.btn-lg{min-height:44px!important;height:44px!important;padding:0 18px!important;font-size:12px!important;border-radius:12px!important}
      #page-root .btn.btn-block, body > .modal .btn.btn-block, body > .syka-modal .btn.btn-block,
      button.btn-block, a.btn-block{width:100%!important}
      #page-root .card-grid{gap:16px!important}
      #page-root .competition-card, #page-root .competition-card-v46{height:100%!important;min-width:0!important}
      #page-root .competition-card-media, #page-root .competition-media-v46{aspect-ratio:16/9!important;height:auto!important;min-height:0!important;overflow:hidden!important}
      #page-root .competition-card-media img, #page-root .competition-media-v46 img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
      #page-root .competition-card-body, #page-root .competition-card-body-v46{display:flex!important;flex-direction:column!important;min-height:190px!important;padding:15px!important}
      #page-root .competition-card-body h3, #page-root .competition-card-body-v46 h3{font-size:15px!important;line-height:1.35!important;min-height:40px!important;margin:9px 0 6px!important}
      #page-root .competition-card-body p, #page-root .competition-card-body-v46 p{font-size:11px!important;line-height:1.55!important;min-height:34px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important}
      #page-root .competition-card-meta, #page-root .competition-meta-v46{margin-top:auto!important;padding-top:12px!important}
      #page-root .task-grid-v410{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important}
      #page-root .task-card-v410{min-height:148px!important;padding:16px!important;border-radius:18px!important}
      #page-root .task-icon-v410{width:42px!important;height:42px!important;min-width:42px!important;border-radius:12px!important}
      #page-root .home-welcome h1{font-size:32px!important;line-height:1.08!important}
      #page-root .home-tabs button{min-height:36px!important;height:36px!important;padding:0 14px!important;font-size:10px!important}
      #page-root .quick-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
      #page-root .quick-action{min-height:82px!important;padding:14px!important;border-radius:16px!important}
      #page-root .home-right-rail{gap:14px!important}
      #page-root .home-right-rail .card,#page-root .home-right-rail .panel-card{border-radius:16px!important}
      #page-root .catalog-toolbar{gap:12px!important;border-radius:16px!important}
      #page-root .control-tabs{gap:4px!important;border-radius:14px!important;overflow-x:auto!important}
      #page-root .control-tab{height:34px!important;min-height:34px!important;padding:0 11px!important;border-radius:9px!important;font-size:9px!important;white-space:nowrap!important}
      body > .modal, body > .syka-modal{box-sizing:border-box!important}
      body > .modal .modal-card, body > .syka-modal .modal-card,
      body > .modal .modal-content, body > .syka-modal .modal-content,
      body > .modal .form-card, body > .syka-modal .form-card{width:min(520px,calc(100vw - 32px))!important;max-width:520px!important;border-radius:20px!important}
      @media(max-width:980px){#page-root .task-grid-v410{grid-template-columns:1fr!important}.bolt-wrap{grid-template-columns:240px minmax(0,1fr)!important}.bolt-rail{display:none!important}}
      @media(max-width:680px){#page-root .quick-actions{grid-template-columns:1fr!important}.bolt-wrap{display:block!important}.bolt-side{display:none!important}.bolt-main{border:0!important}.bolt-body{padding:14px!important}.bolt-top{min-height:58px!important;padding:0 14px!important}}
    `;
    document.head.appendChild(style);

    /* Bolt UI has a few explicit '?route=/' links. Inside the application that
       must mean Home, while the public Blogger root remains the landing page. */
    document.addEventListener('click',function(event){
      const target=event.target.closest?.('[data-bolt-nav="/"] , a[href="?route=/"], a[href="?route=%2F"]');
      if(!target)return;
      if(location.pathname.replace(/\/+$/,'')===(window.SYKA_CONFIG?.APP_PAGE||'/p/app.html').replace(/\/+$/,'')){
        event.preventDefault();event.stopPropagation();
        if(window.SYKA_ROUTER?.navigate)window.SYKA_ROUTER.navigate('/home');
      }
    },true);
  }

  function start(){
    installGlobalUiGuard();
    if(window.SYKA_BOLT_UI?.start)return window.SYKA_BOLT_UI.start();
    if(window.SYKA_ROUTER?.render)return window.SYKA_ROUTER.render();
    throw new Error('Sykabelajar UI runtime belum siap.');
  }

  window.SYKA_V2_RUNTIME={start};
})();
