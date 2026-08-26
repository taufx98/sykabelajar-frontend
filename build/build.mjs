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
  'src/sykabelajar-v2/bootstrap.js','src/sykabelajar-v2/runtime/v2-runtime.js','src/sykabelajar-v2/integration/syka-app-bridge.js','src/sykabelajar-v2/takeover.js','src/sykabelajar-v2/bolt-ui.js'
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
      return execSync(`git show -s --format=%cI ${commit}`, { cwd: root, encoding: 'utf8' }).trim();
    } catch {}
  }
  return new Date().toISOString();
}

function removeOldFingerprints() {
  for (const name of readdirSync(dist)) {
    if (/^(app|styles|vendor)\.[a-f0-9]{12}\.min\.(js|css)$/.test(name)) unlinkSync(resolve(dist, name));
  }
}

removeOldFingerprints();

const release = readList(files);
const source = release.source;
const app = source;
const appMin = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n/g, '\n');
const baseStyles = readFileSync(resolve(root, 'src/styles/styles.css'), 'utf8');
const v2Styles = existsSync(resolve(root, 'src/sykabelajar-v2/styles/v2-runtime.css')) ? readFileSync(resolve(root, 'src/sykabelajar-v2/styles/v2-runtime.css'), 'utf8') : '';
const takeoverStyles = `\n/* V2 authoritative shell: legacy Blogger application chrome must never compete with V2. */\nhtml[data-sykabelajar="v2"] #app-shell > .sidebar,\nhtml[data-sykabelajar="v2"] #app-shell > .main-area > .header,\nhtml[data-sykabelajar="v2"] #app-shell > .main-area > #blogger-content,\nhtml[data-sykabelajar="v2"] #app-shell > .bottom-nav,\nhtml[data-sykabelajar="v2"] #mobile-nav-overlay { display:none !important; }\nhtml[data-sykabelajar="v2"] body { margin:0 !important; background:var(--v2-bg,#060b14) !important; }\nhtml[data-sykabelajar="v2"] #page-root { display:block !important; width:100% !important; min-height:100vh !important; }\n`;
const styles = `${baseStyles}\n${v2Styles}\n${takeoverStyles}`.replace(/\/\*[^]*?\*\//g, '').replace(/\n+/g, '\n');
const vendor = '/* Vendor libraries are loaded by the Blogger theme from official CDNs. */';

const appFile = `app.${hashContent(appMin)}.min.js`;
const stylesFile = `styles.${hashContent(styles)}.min.css`;
const vendorFile = `vendor.${hashContent(vendor)}.min.js`;

writeFileSync(resolve(dist, appFile), appMin);
writeFileSync(resolve(dist, stylesFile), styles);
writeFileSync(resolve(dist, vendorFile), vendor);
writeFileSync(resolve(dist, 'app.js'), app);
writeFileSync(resolve(dist, 'app.min.js'), appMin);
writeFileSync(resolve(dist, 'styles.min.css'), styles);
writeFileSync(resolve(dist, 'vendor.min.js'), vendor);

const commit = sourceCommit();
const generatedAt = sourceDate(commit);

const loader = `/* Sykabelajar stable release loader - generated by build/build.mjs */\n(function(){\n  if (window.__SYKA_LOADER_STARTED__) return;\n  window.__SYKA_LOADER_STARTED__ = true;\n  var BASE = ${JSON.stringify(CDN_BASE)};\n  var MANIFEST = ${JSON.stringify(RAW_MANIFEST)};\n  var CACHE_BUSTER = Date.now().toString(36);\n  function loadScript(url){return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=url;s.async=false;s.onload=resolve;s.onerror=function(){reject(new Error('Failed to load '+url));};document.head.appendChild(s);});}\n  function loadCss(url){return new Promise(function(resolve,reject){var l=document.createElement('link');l.rel='stylesheet';l.href=url;l.onload=resolve;l.onerror=function(){reject(new Error('Failed to load '+url));};document.head.appendChild(l);});}\n  function applyConfig(manifest){window.__SYKA_RELEASE__=manifest;window.SYKA_CONFIG=window.SYKA_CONFIG||{};window.SYKA_CONFIG.ASSET_RELEASE=manifest.commit||'unknown';window.SYKA_CONFIG.ASSET_BASE_URL=manifest.base||BASE;}\n  fetch(MANIFEST+'?cb='+CACHE_BUSTER,{cache:'no-store',credentials:'omit'}).then(function(res){if(!res.ok)throw new Error('Manifest HTTP '+res.status);return res.json();}).then(function(manifest){if(!manifest||!manifest.app||!manifest.styles||!manifest.vendor)throw new Error('Invalid Sykabelajar release manifest');applyConfig(manifest);return loadCss((manifest.base||BASE)+'/'+manifest.styles).then(function(){return loadScript((manifest.base||BASE)+'/'+manifest.vendor);}).then(function(){return loadScript((manifest.base||BASE)+'/'+manifest.app);});}).then(function(){if(window.SYKA_APP&&typeof window.SYKA_APP.init==='function'){return window.SYKA_APP.init();}throw new Error('SYKA_APP.init() tidak ditemukan setelah release bundle dimuat.');}).catch(function(error){console.error('[Sykabelajar] Bootstrap failed:',error);document.documentElement.classList.add('syka-boot-error');var root=document.getElementById('page-root');if(root){root.innerHTML='<div style="max-width:720px;margin:40px auto;padding:24px;font-family:Inter,system-ui,sans-serif"><h2>Sykabelajar sedang memuat ulang</h2><p>Asset aplikasi belum berhasil dimuat. Silakan refresh halaman.</p><button onclick="location.reload()" style="padding:10px 16px;cursor:pointer">Refresh</button></div>';}});\n})();\n`;
writeFileSync(resolve(dist, 'loader.js'), loader);

const manifest = { schema:2, version:'4.15.0-bolt-ui', repo:REPO, base:CDN_BASE, app:appFile, styles:stylesFile, vendor:vendorFile, loader:'loader.js', commit, generatedAt, buildMode:release.mode, missingSourceModules:release.missing };
writeFileSync(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2)+'\n');
console.log(JSON.stringify(manifest,null,2));
