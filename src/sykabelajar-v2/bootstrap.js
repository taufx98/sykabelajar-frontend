(function () {
  if (window.__SYKA_V2_BOOTSTRAP__) return;
  window.__SYKA_V2_BOOTSTRAP__ = true;

  const legacyInit = window.SYKA_APP?.init;
  window.__SYKA_LEGACY_APP_INIT__ = legacyInit || null;

  window.SYKA_V2_BOOTSTRAP = async function () {
    if (window.SYKA_V2_RUNTIME?.start) {
      return window.SYKA_V2_RUNTIME.start();
    }
    throw new Error('Sykabelajar V2 runtime belum dimuat.');
  };
}());
