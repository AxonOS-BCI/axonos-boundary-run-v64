// Created by Denis Yermakou, Founder & CEO of AxonOS.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = [
  'index.html',
  'src/game.js',
  'src/styles.css',
  'src/manifest.json',
  'README.md',
  'SECURITY.md',
  'DONATIONS.md',
  'LICENSE-AGPL',
  'package.json',
  'docs/AxonOS_Boundary_Run_v64_Technical_Specification.md'
];
for (const f of required) readFileSync(join(root, f), 'utf8');

const runtimeText = ['index.html', 'src/game.js', 'src/styles.css', 'src/manifest.json']
  .map(f => readFileSync(join(root, f), 'utf8'))
  .join('\\n');

const forbidden = [/fetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /serviceWorker/];
for (const rx of forbidden) {
  if (rx.test(runtimeText)) throw new Error(`Forbidden API found: ${rx}`);
}

const doge = 'DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp';
for (const f of ['README.md', 'DONATIONS.md', 'index.html']) {
  const text = readFileSync(join(root, f), 'utf8');
  if (!text.includes(doge)) throw new Error(`Donation address missing from ${f}`);
}

const readmeText = readFileSync(join(root, 'README.md'), 'utf8');
if (!readmeText.includes('Denis Yermakou')) throw new Error('Attribution missing: Denis Yermakou');
if (!readmeText.includes('https://axonos-bci.github.io/axonos-boundary-run-v64/')) throw new Error('README launch link missing');
if (!readmeText.includes('Foundation') || !readmeText.includes('Target Architecture')) throw new Error('Foundation vs Target table missing');

const htmlText = readFileSync(join(root, 'index.html'), 'utf8');
if (!htmlText.includes('Content-Security-Policy')) throw new Error('CSP meta tag missing from index.html');
if (!htmlText.includes('frame-ancestors')) throw new Error('frame-ancestors directive missing from CSP');

const gameText = readFileSync(join(root, 'src/game.js'), 'utf8');
if (!gameText.includes('replace(/[^a-f0-9]/gi')) throw new Error('Proof filename sanitization missing');
if (!gameText.includes('crypto.subtle.digest failed')) throw new Error('crypto.subtle error handling missing');
if (!gameText.includes('touchstart')) throw new Error('Touch controls missing');
if (!gameText.includes('isNaN(state.x)')) throw new Error('NaN guard missing');
if (!gameText.includes('Frame embedding blocked')) throw new Error('Frame guard missing');

const license = readFileSync(join(root, 'LICENSE-AGPL'), 'utf8');
if (!license.includes('GNU AFFERO GENERAL PUBLIC LICENSE') || !license.includes('END OF TERMS AND CONDITIONS')) {
  throw new Error('Full AGPL text missing');
}

console.log('OK: static smoke passed for v64');
