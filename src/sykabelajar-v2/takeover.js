/* Sykabelajar V2 UI takeover: V2 is the authoritative application renderer. */
(function () {
  if (window.__SYKA_V2_TAKEOVER__) return;
  window.__SYKA_V2_TAKEOVER__ = true;

  function hideLegacyShell() {
    var legacy = document.querySelectorAll('#app-shell > .sidebar, #app-shell > .main-area > .header, #app-shell > .main-area > #blogger-content, #app-shell > .bottom-nav, #mobile-nav-overlay');
    legacy.forEach(function (el) { el.style.setProperty('display', 'none', 'important'); });
    var root = document.getElementById('page-root');
    if (root) {
      root.style.setProperty('display', 'block', 'important');
      root.style.setProperty('width', '100%', 'important');
      root.style.setProperty('min-height', '100vh', 'important');
    }
    document.documentElement.dataset.sykabelajar = 'v2';
    document.body.classList.add('syka-v2-takeover');
  }

  async function start() {
    hideLegacyShell();
    if (window.SYKA_V2_RUNTIME && typeof window.SYKA_V2_RUNTIME.start === 'function') {
      try {
        await window.SYKA_V2_RUNTIME.start();
        hideLegacyShell();
        return;
      } catch (error) {
        console.error('[Sykabelajar V2] takeover start failed:', error);
      }
    }
    if (window.SYKA_V2_BOOTSTRAP && typeof window.SYKA_V2_BOOTSTRAP === 'function') {
      try {
        await window.SYKA_V2_BOOTSTRAP();
        hideLegacyShell();
      } catch (error) {
        console.error('[Sykabelajar V2] bootstrap failed:', error);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.addEventListener('popstate', function () {
    hideLegacyShell();
  });
}());
