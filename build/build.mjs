import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  existsSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = resolve(root, 'dist');
const REPO = 'taufx98/sykabelajar-frontend';
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO}@main/dist`;
const RAW_MANIFEST = `https://raw.githubusercontent.com/${REPO}/refs/heads/main/dist/manifest.json`;

mkdirSync(dist, { recursive: true });

const files = [
  'src/core/config.js','src/core/state.js','src/core/events.js','src/lib/utils.js','src/lib/supabase.js','src/lib/cloudinary.js',
  'src/services/auth.service.js','src/services/profile.service.js','src/services/social.service.js','src/services/task.service.js','src/services/competition.service.js','src/services/registration.service.js','src/services/attempt.service.js','src/services/leaderboard.service.js','src/services/award.service.js','src/services/notification.service.js','src/services/order.service.js','src/services/store.service.js','src/services/admin.service.js','src/services/controlplane.service.js',
  'src/components/Toast.js','src/components/Modal.js','src/components/Skeleton.js','src/components/EmptyState.js','src/components/CompetitionCard.js','src/components/Header.js','src/components/Sidebar.js','src/components/BottomNav.js',
  'src/pages/Home.js','src/pages/Tasks.js','src/pages/Notifications.js','src/pages/Lomba.js','src/pages/Competition.js','src/pages/Registration.js','src/pages/Attempt.js','src/pages/Profile.js','src/pages/Leaderboard.js','src/pages/Awards.js','src/pages/Orders.js','src/pages/Store.js','src/pages/Verify.js','src/pages/Admin.js','src/pages/Organizer.js','src/pages/Placeholder.js','src/core/router.js','src/core/app.js',
  'src/sykabelajar-v2/bootstrap.js','src/sykabelajar-v2/runtime/v2-runtime.js','src/sykabelajar-v2/integration/syka-app-bridge.js'
];

function readList(list) {
  const missing = list.filter((file) => !existsSync(resolve(root, file)));
  if (!missing.length) {
    return {
      source: list.map((file) => `/* ${file} */\n${readFileSync(resolve(root, file), 'utf8')}`).join('\n\n'),
      mode: 'source-complete',
      missing: []
    };
  }

  // Compatibility mode for the incremental-source repository layout used by this project.
  // The previous release bundle remains the runtime baseline, then changed/present source modules
  // are appended so their window exports override the previous implementations before SYKA_APP.init().
  const baseline = resolve(dist, 'app.js');
  if (!existsSync(baseline)) {
    throw new Error(`Missing required source modules and no dist/app.js fallback is available: ${missing.join(', ')}`);
  }
  const overrideFiles = list
    .filter((file) => existsSync(resolve(root, file)))
    .filter((file) => !/^src\/(core\/(app|router|config)|styles\/)\.js$/.test(file));

  const baselineSource = `/* COMPATIBILITY BASELINE: dist/app.js */\n${readFileSync(baseline, 'utf8')}`;
  const overrides = overrideFiles.map((file) => `/* OVERRIDE ${file} */\n${readFileSync(resolve(root, file), 'utf8')}`).join('\n\n');
  console.warn(`[build] Compatibility mode: ${missing.length} source modules are absent. Using dist/app.js baseline and present-source overrides.`);
  console.warn(`[build] Missing: ${missing.join(', ')}`);
  return { source: `${baselineSource}\n\n${overrides}`, mode: 'compatibility', missing };
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function sourceCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim();
  } catch {
    return 'local-dev';
  }
}

function sourceDate(commit) {
  if (process.env.GITHUB_SHA) {
    try {
      return execSync(`git show -s --format=%cI ${commit}`, {
        cwd: root,
        encoding: 'utf8',
      }).trim();
    } catch {}
  }
  return new Date().toISOString();
}

function removeOldFingerprints() {
  for (const name of readdirSync(dist)) {
    if (/^(app|styles|vendor)\.[a-f0-9]{12}\.min\.(js|css)$/.test(name)) {
      unlinkSync(resolve(dist, name));
    }
  }
}

removeOldFingerprints();

const release = readList(files);
const source = release.source;
const app = source;
const appMin = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*\n/g, '\n');
const baseStyles = readFileSync(resolve(root, 'src/styles/styles.css'), 'utf8');
const v2Styles = existsSync(resolve(root, 'src/sykabelajar-v2/styles/v2-runtime.css'))
  ? readFileSync(resolve(root, 'src/sykabelajar-v2/styles/v2-runtime.css'), 'utf8')
  : '';
const styles = `${baseStyles}\n${v2Styles}`
  .replace(/\/\*[^]*?\*\//g, '')
  .replace(/\n+/g, '\n');
const vendor = '/* Vendor libraries are loaded by the Blogger theme from official CDNs. */';

const appFile = `app.${hashContent(appMin)}.min.js`;
const stylesFile = `styles.${hashContent(styles)}.min.css`;
const vendorFile = `vendor.${hashContent(vendor)}.min.js`;

writeFileSync(resolve(dist, appFile), appMin);
writeFileSync(resolve(dist, stylesFile), styles);
writeFileSync(resolve(dist, vendorFile), vendor);

// Stable compatibility artifacts for local inspection/manual fallback.
writeFileSync(resolve(dist, 'app.js'), app);
writeFileSync(resolve(dist, 'app.min.js'), appMin);
writeFileSync(resolve(dist, 'styles.min.css'), styles);
writeFileSync(resolve(dist, 'vendor.min.js'), vendor);

const commit = sourceCommit();
const generatedAt = sourceDate(commit);

// IMPORTANT: loader.js contains NO asset filenames. manifest.json is the only release source of truth.
const loader = `/* Sykabelajar stable release loader - generated by build/build.mjs */\n(function(){\n  if (window.__SYKA_LOADER_STARTED__) return;\n  window.__SYKA_LOADER_STARTED__ = true;\n\n  var BASE = ${JSON.stringify(CDN_BASE)};\n  var MANIFEST = ${JSON.stringify(RAW_MANIFEST)};\n  var CACHE_BUSTER = Date.now().toString(36);\n\n  function loadScript(url) {\n    return new Promise(function(resolve, reject) {\n      var s = document.createElement('script');\n      s.src = url;\n      s.async = false;\n      s.onload = resolve;\n      s.onerror = function(){ reject(new Error('Failed to load ' + url)); };\n      document.head.appendChild(s);\n    });\n  }\n\n  function loadCss(url) {\n    return new Promise(function(resolve, reject) {\n      var l = document.createElement('link');\n      l.rel = 'stylesheet';\n      l.href = url;\n      l.onload = resolve;\n      l.onerror = function(){ reject(new Error('Failed to load ' + url)); };\n      document.head.appendChild(l);\n    });\n  }\n\n  function applyConfig(manifest){\n    window.__SYKA_RELEASE__ = manifest;\n    window.SYKA_CONFIG = window.SYKA_CONFIG || {};\n    window.SYKA_CONFIG.ASSET_RELEASE = manifest.commit || 'unknown';\n    window.SYKA_CONFIG.ASSET_BASE_URL = manifest.base || BASE;\n  }\n\n  fetch(MANIFEST + '?cb=' + CACHE_BUSTER, { cache: 'no-store', credentials: 'omit' })\n    .then(function(res){\n      if (!res.ok) throw new Error('Manifest HTTP ' + res.status);\n      return res.json();\n    })\n    .then(function(manifest){\n      if (!manifest || !manifest.app || !manifest.styles || !manifest.vendor) {\n        throw new Error('Invalid Sykabelajar release manifest');\n      }\n\n      applyConfig(manifest);\n\n      return loadCss((manifest.base || BASE) + '/' + manifest.styles)\n        .then(function(){ return loadScript((manifest.base || BASE) + '/' + manifest.vendor); })\n        .then(function(){ return loadScript((manifest.base || BASE) + '/' + manifest.app); });\n    })\n    .then(function(){\n      if (window.SYKA_APP && typeof window.SYKA_APP.init === 'function') {\n        window.SYKA_APP.init();\n        return;\n      }\n      throw new Error('SYKA_APP.init() tidak ditemukan setelah release bundle dimuat.');\n    })\n    .catch(function(error){\n      console.error('[Sykabelajar] Bootstrap failed:', error);\n      document.documentElement.classList.add('syka-boot-error');\n      var root = document.getElementById('page-root');\n      if (root) {\n        root.innerHTML = '<div style="max-width:720px;margin:40px auto;padding:24px;font-family:Inter,system-ui,sans-serif"><h2>Sykabelajar sedang memuat ulang</h2><p>Asset aplikasi belum berhasil dimuat. Silakan refresh halaman.</p><button onclick="location.reload()" style="padding:10px 16px;cursor:pointer">Refresh</button></div>';\n      }\n    });\n})();\n`;

writeFileSync(resolve(dist, 'loader.js'), loader);

// Single source of truth for release asset names.
const manifest = {
  schema: 2,
  version: '4.13.0',
  repo: REPO,
  base: CDN_BASE,
  app: appFile,
  styles: stylesFile,
  vendor: vendorFile,
  loader: 'loader.js',
  commit,
  generatedAt,
  buildMode: release.mode,
  missingSourceModules: release.missing,
};

writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(JSON.stringify(manifest, null, 2));
