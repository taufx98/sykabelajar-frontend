/* Bolt layout controller: landing is marketing-first/full-bleed; application routes use the Bolt dashboard shell. */
(function () {
  if (window.__SYKA_BOLT_LAYOUT_CONTROLLER__) return;
  window.__SYKA_BOLT_LAYOUT_CONTROLLER__ = true;

  function getRoute() {
    try {
      const queryRoute = new URLSearchParams(location.search).get('route');
      if (queryRoute) return queryRoute.split('?')[0] || '/';
      const hash = String(location.hash || '').replace(/^#/, '');
      if (hash) return hash.split('?')[0] || '/';
    } catch (_) {}
    return '/';
  }

  function apply() {
    var root = document.getElementById('page-root');
    if (!root) return;

    var route = getRoute();
    var landing = route === '/' || route === '';

    document.documentElement.classList.add('bolt-layout-controlled');
    document.documentElement.classList.toggle('bolt-landing-route', landing);
    document.documentElement.classList.toggle('bolt-app-route', !landing);
    document.body.classList.toggle('bolt-landing-route', landing);
    document.body.classList.toggle('bolt-app-route', !landing);

    root.style.setProperty('display', 'block', 'important');
    root.style.setProperty('width', '100%', 'important');
    root.style.setProperty('max-width', 'none', 'important');
    root.style.setProperty('margin', '0', 'important');
    root.style.setProperty('padding', '0', 'important');
    root.style.setProperty('min-height', '100vh', 'important');

    root.querySelectorAll('.bolt-wrap').forEach(function (wrap) {
      wrap.classList.toggle('bolt-marketing-wrap', landing);
    });
    root.querySelectorAll('.bolt-side').forEach(function (el) {
      el.style.setProperty('display', landing ? 'none' : 'flex', 'important');
    });
    root.querySelectorAll('.bolt-rail').forEach(function (el) {
      el.style.setProperty('display', landing ? 'none' : 'flex', 'important');
    });
    root.querySelectorAll('.bolt-app').forEach(function (el) {
      el.classList.toggle('bolt-marketing-surface', landing);
    });
  }

  function boot() {
    apply();
    var root = document.getElementById('page-root');
    if (root && !window.__SYKA_BOLT_LAYOUT_OBSERVER__) {
      window.__SYKA_BOLT_LAYOUT_OBSERVER__ = new MutationObserver(function () { apply(); });
      window.__SYKA_BOLT_LAYOUT_OBSERVER__.observe(root, { childList: true, subtree: true });
    }
  }

  window.__SYKA_BOLT_APPLY_LAYOUT__ = apply;
  window.addEventListener('popstate', apply);
  window.addEventListener('hashchange', apply);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
