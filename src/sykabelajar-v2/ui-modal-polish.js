/* Global controls that are rendered outside #page-root (auth modal/profile menu). */
(function(){
  if(window.__SYKA_MODAL_POLISH__)return;
  window.__SYKA_MODAL_POLISH__=true;
  const s=document.createElement('style');
  s.id='syka-modal-polish-style';
  s.textContent=`
    .modal .btn,.modal-content .btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;height:40px!important;min-height:40px!important;padding:0 14px!important;border-radius:11px!important;font-size:11px!important;font-weight:800!important;line-height:1!important}
    .modal .btn-sm,.modal-content .btn-sm{height:34px!important;min-height:34px!important;padding:0 11px!important;font-size:10px!important;border-radius:10px!important}
    .modal .btn-block,.modal-content .btn-block{width:100%!important}
    .modal .auth-form>.btn-block,.modal-content .auth-form>.btn-block{height:42px!important;min-height:42px!important;font-size:11px!important}
    .profile-menu button{display:flex!important;align-items:center!important;height:34px!important;min-height:34px!important;padding:0 10px!important;border-radius:9px!important;font-size:9px!important;line-height:1!important;box-sizing:border-box!important}
    .profile-menu{width:190px!important;padding:6px!important;border-radius:14px!important}
    .account-type-grid{gap:8px!important}.account-type-card{min-height:72px!important}
    .password-toggle{height:28px!important;min-height:28px!important;padding:0 8px!important;border-radius:8px!important;font-size:9px!important}
    .inline-error{font-size:10px!important;line-height:1.5!important;border-radius:10px!important;padding:9px 10px!important;margin-top:10px!important}
    @media(max-width:560px){.modal .auth-form>.btn-block,.modal-content .auth-form>.btn-block{height:40px!important;min-height:40px!important}.modal-dialog{width:calc(100vw - 20px)!important}}
  `;
  (document.head||document.documentElement).appendChild(s);
})();
