// AxonOS Boundary Run v64 — JavaScript determinism cross-check.
// Created by Denis Yermakou, Founder & CEO of AxonOS.
//
// Re-runs each committed golden vector's inputLog through the *JavaScript*
// gameplay core and confirms the canonical SHA-256 — and the decisive outcome
// fields — match the stored proof. Paired with tools/boundary_run_verify_v3.py
// (the Python re-simulation), this proves the determinism contract holds
// identically in both languages, in CI, on every push.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await import(join(root, 'src/game.js')); // headless ESM: exports core to globalThis.BRV64
const CORE = globalThis.BRV64;
if (!CORE || typeof CORE.replay !== 'function' || typeof CORE.canonical !== 'function') {
  console.error('FAIL: gameplay core not exported (globalThis.BRV64)');
  process.exit(1);
}

const dir = join(root, 'qa', 'proofs');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
let n = 0;
for (const f of files) {
  const proof = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  if (!Array.isArray(proof.inputLog)) { console.error(`FAIL: ${f}: inputLog missing`); process.exit(1); }
  const s = CORE.replay(proof.seed >>> 0, proof.inputLog.slice());
  const hash = createHash('sha256').update(CORE.canonical(s)).digest('hex');
  if (hash !== proof.hash) {
    console.error(`FAIL: ${f}: JS hash ${hash.slice(0, 16)}… != proof ${String(proof.hash).slice(0, 16)}…`);
    process.exit(1);
  }
  if (s.tick !== proof.ticks || Math.floor(s.score) !== proof.score) {
    console.error(`FAIL: ${f}: outcome mismatch (ticks ${s.tick}/${proof.ticks}, score ${Math.floor(s.score)}/${proof.score})`);
    process.exit(1);
  }
  console.log(`OK: ${f} — JS replay matches proof (ticks ${s.tick}, score ${Math.floor(s.score)}, ${hash.slice(0, 16)}…)`);
  n++;
}
if (n === 0) { console.error('FAIL: no golden vectors found in qa/proofs'); process.exit(1); }
console.log(`OK: ${n} golden vector(s) reproduced byte-for-byte by the JavaScript core`);
