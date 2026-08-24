# Loader fix

The stable `dist/loader.js` is responsible for loading the fingerprinted CSS/vendor/app bundles and **must initialize `SYKA_APP` only after the app bundle has finished loading**.

Do not add a second unconditional `SYKA_APP.init()` before the app bundle is available. The Blogger theme may keep its guarded startup block; the loader callback is the authoritative startup path.
