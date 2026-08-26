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
if (code.includes('Aruna Putra') || code.includes('Mira Cendekia') || code.includes('Bagaskara Wibawa')) {
  throw new Error('Production bundle still contains Bolt demo identity data.');
}
new Script(code, { filename: app });
const m = JSON.parse(readFileSync(manifest, 'utf8'));
if (m.commit && !code.includes('SYKA_STATE')) throw new Error('Production bundle sanity check failed.');
console.log('Production preflight passed: syntax, SYKA_APP, and demo-data guard are clean.');
