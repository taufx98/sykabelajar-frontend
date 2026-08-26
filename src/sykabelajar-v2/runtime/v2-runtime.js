/* V2 runtime coordinator.
 * The application remains a web app inside Blogger. This runtime only coordinates
 * the already-built Sykabelajar router/Bolt UI; it does not own business data.
 */
(function(){
  if(window.SYKA_V2_RUNTIME)return;
  function start(){
    if(window.SYKA_BOLT_UI?.start)return window.SYKA_BOLT_UI.start();
    if(window.SYKA_ROUTER?.render)return window.SYKA_ROUTER.render();
    throw new Error('Sykabelajar UI runtime belum siap.');
  }
  window.SYKA_V2_RUNTIME={start};
})();
