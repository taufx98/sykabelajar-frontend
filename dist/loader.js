(function () {
  if (window.__SYKA_LOADER_STARTED__) return;
  window.__SYKA_LOADER_STARTED__ = true;

  const base =
    'https://cdn.jsdelivr.net/gh/taufx98/sykabelajar-frontend@main/dist';

  const manifestUrl =
    base + '/manifest.json?ts=' + Date.now();

  fetch(manifestUrl, {
    cache: 'no-store'
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Manifest request failed: ' + res.status);
      }
      return res.json();
    })
    .then(manifest => {
      window.__SYKA_RELEASE__ = manifest;

      window.SYKA_CONFIG =
        window.SYKA_CONFIG || {};

      window.SYKA_CONFIG.ASSET_RELEASE =
        manifest.commit;

      window.SYKA_CONFIG.ASSET_BASE_URL =
        base;

      const css =
        document.createElement('link');

      css.rel = 'stylesheet';
      css.href =
        base + '/' + manifest.styles;

      document.head.appendChild(css);

      function loadScript(src) {
        return new Promise((resolve, reject) => {
          const script =
            document.createElement('script');

          script.src = src;

          script.onload = resolve;
          script.onerror = () =>
            reject(
              new Error(
                'Failed to load ' + src
              )
            );

          document.head.appendChild(script);
        });
      }

      return loadScript(
        base + '/' + manifest.vendor
      ).then(() =>
        loadScript(
          base + '/' + manifest.app
        )
      );
    })
    .then(() => {
      if (
        window.SYKA_APP &&
        typeof window.SYKA_APP.init === 'function'
      ) {
        window.SYKA_APP.init();
      }
    })
    .catch(error => {
      console.error(
        '[Sykabelajar] Bootstrap failed:',
        error
      );
    });
})();
