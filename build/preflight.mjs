import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

const app = 'dist/app.min.js';
const css = 'dist/styles.min.css';
const manifest = 'dist/manifest.json';

for (const file of [app, css, manifest]) {
  if (!existsSync(file)) throw new Error(`Missing production file: ${file}`);
}

const code = readFileSync(app, 'utf8');
if (!code.includes('window.SYKA_APP')) {
  throw new Error('Production bundle does not contain window.SYKA_APP.');
}
if (code.includes('Aruna Putra') || code.includes('Mira Cendekia') || code.includes('Bagaskara Wibawa') || code.includes('Larasati Ayu') || code.includes('Dimas Pratama')) {
  throw new Error('Production bundle still contains Bolt demo identity data.');
}
if (code.includes('header_announcements')) {
  throw new Error('Production bundle still queries the removed header_announcements table.');
}
if (code.includes("select('roles(name)')") || code.includes('select=roles%28name%29')) {
  throw new Error('Production bundle still uses the invalid user_roles -> roles relationship query.');
}
if (!code.includes('SYKA_PROFILE_SERVICE') || !code.includes('SYKA_COMPETITION_SERVICE')) {
  throw new Error('Production bundle is missing core backend service adapters.');
}
if (!code.includes('syka-ui-final-polish')) {
  throw new Error('Final Bolt UI normalization layer is missing from production bundle.');
}
new Script(code, { filename: app });
const m = JSON.parse(readFileSync(manifest, 'utf8'));
if (m.commit && !code.includes('SYKA_STATE')) throw new Error('Production bundle sanity check failed.');
console.log('Production preflight passed: syntax, SYKA_APP, backend adapters, UI normalizer, and regression guards are clean.');
