import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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

// Validate the source of truth for Supabase role access instead of pattern
// matching minified production code. Minifiers can join unrelated strings and
// produce false positives. A real invalid query must exist in source code.
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else if (/\.(js|jsx|ts|tsx)$/.test(name.name)) out.push(p);
  }
  return out;
}
const sourceFiles = walk('src');
const invalidSource = [];
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  if (/from\(\s*['"]user_roles['"]\s*\)/i.test(source) && /select\(\s*['"][^'"]*roles\s*\(\s*name\s*\)[^'"]*['"]\s*\)/i.test(source)) {
    invalidSource.push(file);
  }
}
if (invalidSource.length) {
  throw new Error(`Invalid user_roles -> roles relationship query found in source: ${invalidSource.join(', ')}`);
}

if (!code.includes('SYKA_PROFILE_SERVICE') || !code.includes('SYKA_COMPETITION_SERVICE')) {
  throw new Error('Production bundle is missing core backend service adapters.');
}
if (!code.includes('syka-ui-final-polish') || !code.includes('syka-component-polish-style')) {
  throw new Error('Final Bolt UI normalization layers are missing from production bundle.');
}
new Script(code, { filename: app });
const m = JSON.parse(readFileSync(manifest, 'utf8'));
if (m.commit && !code.includes('SYKA_STATE')) throw new Error('Production bundle sanity check failed.');
console.log('Production preflight passed: syntax, SYKA_APP, backend adapters, UI normalizers, and source-level regression guards are clean.');
