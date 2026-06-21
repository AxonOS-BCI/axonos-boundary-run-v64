// Created by Denis Yermakou, Founder & CEO of AxonOS.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const required = ['index.html', 'src/game.js', 'src/styles.css', 'src/manifest.json', 'README.md', 'SECURITY.md', 'DONATIONS.md'];
for (const f of required) readFileSync(join(root, f), 'utf8');

const runtimeText = ['index.html', 'src/game.js', 'src/styles.css', 'src/manifest.json']
  .map(f => readFileSync(join(root, f), 'utf8'))
  .join('
');

const forbidden = [/fetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /serviceWorker/];
for (const rx of forbidden) {
  if (rx.test(runtimeText)) throw new Error(`Forbidden API found: ${rx}`);
}

const donationText = readFileSync(join(root, 'DONATIONS.md'), 'utf8');
if (!donationText.includes('DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp')) throw new Error('Donation address missing');

const readmeText = readFileSync(join(root, 'README.md'), 'utf8');
if (!readmeText.includes('Denis Yermakou')) throw new Error('Attribution missing: Denis Yermakou');
if (!readmeText.includes('https://axonos-bci.github.io/axonos-boundary-run-v64/')) throw new Error('README launch link missing');

const htmlText = readFileSync(join(root, 'index.html'), 'utf8');
if (!htmlText.includes('Content-Security-Policy')) throw new Error('CSP meta tag missing from index.html');
if (!htmlText.includes('frame-ancestors')) throw new Error('frame-ancestors directive missing from CSP');

const gameText = readFileSync(join(root, 'src/game.js'), 'utf8');
if (!gameText.includes('replace(/[^a-f0-9]/gi')) throw new Error('Proof filename sanitization missing');
if (!gameText.includes('try {')) throw new Error('Error handling missing in game.js');
if (!gameText.includes('vault')) throw new Error('Vault hazard type missing');
if (!gameText.includes('screenShake')) throw new Error('Screen shake missing');
if (!gameText.includes('spawnParticles')) throw new Error('Particle effects missing');

console.log('OK: static smoke passed for v64');