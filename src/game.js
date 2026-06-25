/*
 * AxonOS Boundary Run v64 — The Sovereign Signal
 * Created by Denis Yermakou, Founder & CEO of AxonOS.
 * Copyright © 2026 Denis Yermakou / AxonOS.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AxonOS-Commercial
 *
 * Determinism contract
 * --------------------
 * Gameplay advances on a FIXED 60 Hz timestep, decoupled from the display
 * refresh rate. The simulation uses one seeded RNG (sim.rng) and only exact
 * IEEE-754 arithmetic — no transcendental functions — so the same
 * (seed, inputLog) reproduces the same canonical SHA-256 hash in any language.
 * finalizeProof() re-simulates the recorded input log on export to confirm the
 * hash (`verified`).
 *
 * The render layer is cosmetic. It never reads or writes sim state and never
 * advances sim.rng, so it cannot affect the hash. Cosmetic randomness (particle
 * jitter, the star field) flows through a SEPARATE cosmetic RNG (cos) — there is
 * no Math.random anywhere — and cosmetic motion may use Math.sin/atan2 freely;
 * the simulation never does.
 */
(() => {
  "use strict";

  /* ===================== deterministic core (no DOM, no time) ===================== */
  const W = 960, H = 540;
  const FIELD_TOP = 66, FIELD_BOT = H - 16;
  const AUDIT = { y0: 318, y1: 398 };   // restore band (heal while Granted)
  const FAST  = { y0: 92,  y1: 172 };   // risk band (x2 score, slow drain)
  const PW = 30, PH = 32;               // player hitbox
  const ACC = 1.25, FRICT = 0.80, VMAX = 7.2, STOP = 0.06;
  const DASH_CD = 100, DASH_IFRAMES = 15, DASH_KICK = 7.0, DASH_VMAX = 11.0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function aabb(px, py, h) { return px + PW > h.x && px < h.x + h.w && py + PH > h.y && py < h.y + h.h; }

  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    let t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function makeHazard(s, x) {
    const r = rnd(s);
    let type = "artifact";
    if (r > 0.86) type = "vault";
    else if (r > 0.70) type = "raw";
    else if (r > 0.55) type = "gate";
    const w = 30 + Math.floor(rnd(s) * 22);
    const h = 34 + Math.floor(rnd(s) * 26);
    const y = FIELD_TOP + 8 + Math.floor(rnd(s) * (FIELD_BOT - FIELD_TOP - h - 16));
    const vy = (rnd(s) * 2 - 1) * 0.9;   // deterministic vertical drift (exact float)
    return { x, y, w, h, type, vy, hit: false, passed: false };
  }

  function newSim(seed) {
    const s = {
      seed: seed >>> 0, rng: seed >>> 0, tick: 0,
      x: 150, y: 300, vx: 0, vy: 0,
      integrity: 100, consent: "Granted", suspend: 0,
      score: 0, distance: 0, combo: 0, bestCombo: 0, mult: 1,
      dashCd: 0, iframes: 0, spawnIn: 0, hazards: [], over: false, inputLog: []
    };
    for (let i = 0; i < 6; i++) s.hazards.push(makeHazard(s, W + 140 + i * 175));
    return s;
  }

  // Pure deterministic step. mask bits: 1=left 2=right 4=up 8=down 16=dash.
  // Returns a cosmetic-only event bitfield (not hashed):
  //   1=raw 2=artifact 4=vault 8=gate 16=near-miss 32=dash 64=surge 128=purge
  function stepSim(s, mask) {
    if (s.over) return 0;
    s.tick++;
    s.inputLog.push(mask & 31);
    let ev = 0;

    // --- snappy movement: full acceleration, friction only decays idle axes ---
    let ax = 0, ay = 0;
    if (mask & 1) ax -= 1;
    if (mask & 2) ax += 1;
    if (mask & 4) ay -= 1;
    if (mask & 8) ay += 1;
    s.vx += ax * ACC;
    s.vy += ay * ACC;
    if (ax === 0) { s.vx *= FRICT; if (Math.abs(s.vx) < STOP) s.vx = 0; }
    if (ay === 0) { s.vy *= FRICT; if (Math.abs(s.vy) < STOP) s.vy = 0; }
    s.vx = clamp(s.vx, -VMAX, VMAX);
    s.vy = clamp(s.vy, -VMAX, VMAX);

    // --- dash: burst + brief i-frames on a cooldown ---
    if (s.dashCd > 0) s.dashCd--;
    if (s.iframes > 0) s.iframes--;
    if ((mask & 16) && s.dashCd <= 0) {
      s.iframes = DASH_IFRAMES; s.dashCd = DASH_CD;
      let dx = (mask & 2 ? 1 : 0) - (mask & 1 ? 1 : 0);
      let dy = (mask & 8 ? 1 : 0) - (mask & 4 ? 1 : 0);
      if (dx === 0 && dy === 0) dx = 1;
      s.vx = clamp(s.vx + dx * DASH_KICK, -DASH_VMAX, DASH_VMAX);
      s.vy = clamp(s.vy + dy * DASH_KICK, -DASH_VMAX, DASH_VMAX);
      ev |= 32;
    }

    s.x = clamp(s.x + s.vx, 22, W * 0.6);
    s.y = clamp(s.y + s.vy, FIELD_TOP + 2, FIELD_BOT - PH);
    if (!(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.vx) && Number.isFinite(s.vy))) {
      s.over = true; s.consent = "Withdrawn"; return ev;
    }

    if (s.suspend > 0) { s.suspend--; if (s.suspend === 0 && s.consent === "Suspended") s.consent = "Granted"; }

    const surge = (s.tick % 1500) < 240;
    if (s.tick % 1500 === 1) ev |= 64;
    const speed = (2.6 + Math.min(3.4, s.tick / 2400)) * (surge ? 1.35 : 1);
    s.distance += speed;

    const cy = s.y + PH / 2;
    const inAudit = cy >= AUDIT.y0 && cy <= AUDIT.y1;
    const inFast = cy >= FAST.y0 && cy <= FAST.y1;
    s.mult = inFast ? 2 : 1;
    if (s.consent === "Granted") {
      if (inAudit) s.integrity = Math.min(100, s.integrity + 0.10);
      if (inFast) s.integrity = Math.max(0, s.integrity - 0.04);
      s.score += speed * 0.10 * s.mult * (surge ? 1.5 : 1);
    }

    for (const h of s.hazards) {
      h.x -= speed;
      // deterministic vertical drift with bounce (exact arithmetic only)
      h.y += h.vy;
      if (h.y < FIELD_TOP + 4) { h.y = FIELD_TOP + 4; h.vy = -h.vy; }
      else if (h.y > FIELD_BOT - h.h - 4) { h.y = FIELD_BOT - h.h - 4; h.vy = -h.vy; }

      if (!h.hit && aabb(s.x, s.y, h)) {
        h.hit = true;
        if (h.type === "vault") {
          if (s.consent === "Granted") { s.integrity = Math.min(100, s.integrity + 12); s.combo++; if (s.combo > s.bestCombo) s.bestCombo = s.combo; s.score += 50 + s.combo * 8; ev |= 4; }
        } else if (s.iframes > 0) {
          // dashing THROUGH a threat purges it for score and keeps the combo
          if (h.type === "raw") { s.score += 22 * s.mult; ev |= 128; }
          else if (h.type === "artifact") { s.score += 11 * s.mult; ev |= 128; }
          /* gate: phase through harmlessly */
        } else if (h.type === "raw") { s.integrity -= 18; s.combo = 0; ev |= 1; }
        else if (h.type === "artifact") { s.integrity -= 7; s.combo = 0; ev |= 2; }
        else if (h.type === "gate") { if (s.consent !== "Withdrawn") { s.consent = "Suspended"; s.suspend = 180; ev |= 8; } }
      }
      if (!h.hit && !h.passed && (h.x + h.w) < s.x) {
        h.passed = true;
        if ((h.type === "raw" || h.type === "artifact") && s.consent === "Granted") {
          const gap = Math.min(Math.abs((h.y + h.h) - s.y), Math.abs(h.y - (s.y + PH)));
          if (gap < 16) { s.score += 12 * s.mult; ev |= 16; }
        }
      }
    }
    s.hazards = s.hazards.filter(h => h.x + h.w > -24);

    s.spawnIn -= speed;
    if (s.spawnIn <= 0) {
      s.hazards.push(makeHazard(s, W + 30 + rnd(s) * 70));
      s.spawnIn = (surge ? 78 : 165) + rnd(s) * 120 - Math.min(95, s.tick / 38);
    }

    if (s.integrity <= 0 && !s.over) { s.integrity = 0; s.over = true; s.consent = "Withdrawn"; }
    return ev;
  }

  function canonical(s) {
    return "brv3:" + s.seed + ":" + s.tick + ":" + Math.floor(s.score) + ":" +
      Math.round(s.integrity) + ":" + s.consent + ":" + s.inputLog.join(",");
  }
  function replay(seed, log) { const s = newSim(seed); for (let i = 0; i < log.length; i++) stepSim(s, log[i] & 31); return s; }

  if (typeof document === "undefined") {
    const CORE = { newSim, stepSim, canonical, replay, W, H, FIELD_TOP, FIELD_BOT };
    if (typeof module !== "undefined" && module.exports) module.exports = CORE;
    else if (typeof globalThis !== "undefined") globalThis.BRV64 = CORE;
    return; // headless (node): no DOM wiring
  }

  /* ===================== browser layer (premium render) ===================== */
  const TAU = Math.PI * 2;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const byId = (id) => document.getElementById(id);
  const ui = { proof: byId("proof"), live: byId("live"), score: byId("hud-score"),
    integrity: byId("hud-integrity"), consent: byId("hud-consent") };
  const STEP = 1000 / 60;

  // Restrained, coherent palette — one signal hue, purposeful accents.
  const C = {
    signal: "#41e3ff", signalSoft: "#bfeeff", core: "#ffffff",
    good: "#37e0bf", warn: "#f6bd4d", danger: "#ff5f73",
    raw: "#ff5f73", artifact: "#9d8cff", vault: "#f3cf72", gate: "#8290a6",
    ink: "#eaf2ff", muted: "#9db0cb", faint: "#5b6c86",
    audit: "#37e0bf", fast: "#f6bd4d"
  };
  const HZCOL = { artifact: C.artifact, raw: C.raw, gate: C.gate, vault: C.vault };

  // cosmetic RNG (sim.rng untouched → never affects the hash)
  const cos = { rng: 0x9e3779b9 };
  const crand = () => rnd(cos);
  function makeStars(seed) {
    const c = { rng: (seed ^ 0x57a45) >>> 0 }, a = [];
    for (let i = 0; i < 70; i++) a.push({ x: rnd(c) * W, y: FIELD_TOP + rnd(c) * (FIELD_BOT - FIELD_TOP), z: 0.3 + rnd(c) * 1.4, s: rnd(c) * 1.5 + 0.4 });
    return a;
  }

  let sim = newSim(dailySeed());
  let keys = new Set();
  let paused = false, colorblind = false, started = false;
  let acc = 0, last = 0, rafT = 0;
  let particles = [], trail = [], shake = 0, punch = 0, flash = 0, intro = 1, msgs = [];
  let stars = makeStars(sim.seed);

  function dailySeed() { const d = new Date(); return (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) ^ 0xb0a5d52) >>> 0; }
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function note(msg) { msgs.unshift({ msg, ttl: 170 }); msgs = msgs.slice(0, 2); if (ui.live) ui.live.textContent = msg; }

  function reset() {
    sim = newSim(dailySeed());
    cos.rng = (sim.seed ^ 0x57a45) >>> 0;
    stars = makeStars(sim.seed);
    particles = []; trail = []; shake = 0; punch = 0; flash = 0; msgs = []; intro = 0.55;
    paused = false; started = true; acc = 0; last = performance.now();
    note("Hold the signal. Dodge red and violet, gather gold, dash through danger.");
  }

  function burst(x, y, color, n, spread, glow) {
    spread = spread || 6;
    for (let i = 0; i < n; i++) particles.push({ x, y, color, glow: !!glow, vx: (crand() - 0.5) * spread, vy: (crand() - 0.5) * spread - 1.4, life: 22 + crand() * 16, size: 1.6 + crand() * 2.4 });
    if (particles.length > 280) particles = particles.slice(-280);
  }
  function ring(x, y, color) { particles.push({ ring: true, x, y, color, ringR: 6, ringMax: 40, life: 20, size: 0 }); }

  function react(ev) {
    const px = sim.x + PW / 2, py = sim.y + PH / 2;
    if (ev & 32) { burst(px, py, C.signal, 14, 10, true); ring(px, py, C.signal); }          // dash
    if (ev & 128) { burst(px, py, C.signalSoft, 12, 8, true); note("Threat purged mid-dash — combo held."); }
    if (ev & 1) { burst(px, py, C.danger, 18, 9, true); shake = 12; punch = 0.5; flash = 0.42; note("Raw-signal breach — integrity −18, combo lost."); }
    if (ev & 2) { burst(px, py, C.artifact, 9, 6, true); shake = 5; punch = 0.2; note("Artifact spike — integrity −7."); }
    if (ev & 4) { burst(px, py, C.vault, 16, 7, true); ring(px, py, C.vault); note("Vault sealed — +12 integrity, combo " + sim.combo + "."); }
    if (ev & 8) { burst(px, py, C.gate, 9, 5, false); note("Consent gate — suspended briefly, scoring paused."); }
    if (ev & 16) burst(px, py, C.good, 6, 4, true);                                            // near-miss
    if (ev & 64) { shake = Math.max(shake, 6); note("Surge wave — denser and faster, +50% score."); }
  }

  function inputMask() {
    let m = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) m |= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) m |= 2;
    if (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space")) m |= 4;
    if (keys.has("ArrowDown") || keys.has("KeyS")) m |= 8;
    if (keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("KeyK")) m |= 16;
    return m;
  }

  function tickLogic() {
    touchSteer();
    if (paused || sim.over || !started) return;
    const wasOver = sim.over;
    const ev = stepSim(sim, inputMask());
    if (ev) react(ev);
    if (sim.over && !wasOver) { note("Run sealed — integrity exhausted. Export your proof."); finalizeProof(true); }
  }

  /* ---------- proof ---------- */
  async function sha256hex(text) {
    if (!globalThis.crypto || !crypto.subtle || typeof crypto.subtle.digest !== "function")
      throw new Error("WebCrypto SHA-256 unavailable. Use HTTPS or a modern browser.");
    const data = new TextEncoder().encode(String(text));
    const h = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function finalizeProof(silent) {
    try {
      const liveHash = await sha256hex(canonical(sim));
      const rep = replay(sim.seed, sim.inputLog.slice());
      const verified = (await sha256hex(canonical(rep))) === liveHash;
      const proof = {
        schema: "boundary-run-replay-v3", creator: "Denis Yermakou, Founder & CEO of AxonOS",
        seed: sim.seed, ticks: sim.tick, score: Math.floor(sim.score), integrity: Math.round(sim.integrity),
        consent: sim.consent, bestCombo: sim.bestCombo, hash: liveHash, verified, inputLog: sim.inputLog
      };
      if (ui.proof) ui.proof.textContent = (verified ? "\u2713 verified " : "? ") + liveHash.slice(0, 12);
      if (!silent) {
        const safe = String(liveHash).replace(/[^a-f0-9]/gi, "").slice(0, 12) || "unavailable";
        const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "boundary-run-v64-proof-" + safe + ".json";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        note("Proof exported (verified=" + verified + ").");
      }
      return proof;
    } catch (e) {
      if (ui.proof) ui.proof.textContent = "unavailable";
      note("Proof unavailable: " + e.message);
      return { schema: "boundary-run-replay-v3", seed: sim.seed, ticks: sim.tick, proof: "unavailable", error: e.message };
    }
  }

  /* ---------- render ---------- */
  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a1020"); g.addColorStop(0.6, "#060a14"); g.addColorStop(1, "#03050b");
    ctx.fillStyle = g; ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.globalCompositeOperation = "lighter";
    for (const st of stars) {
      const x = ((st.x - sim.distance * st.z * 0.22) % W + W) % W;
      ctx.globalAlpha = 0.05 + 0.07 * st.z; ctx.fillStyle = C.signalSoft;
      ctx.fillRect(x, st.y, st.s, st.s);
    }
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }

  function drawBand(band, hex, label) {
    const t = rafT, h = band.y1 - band.y0;
    const a = 0.07 + 0.03 * (0.5 + 0.5 * Math.sin(t / 700));
    ctx.fillStyle = hexA(hex, a); ctx.fillRect(0, band.y0, W, h);
    ctx.strokeStyle = hexA(hex, 0.32); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, band.y0 + 0.5); ctx.lineTo(W, band.y0 + 0.5);
    ctx.moveTo(0, band.y1 - 0.5); ctx.lineTo(W, band.y1 - 0.5); ctx.stroke();
    ctx.fillStyle = hexA(hex, 0.66); ctx.font = "600 10px ui-sans-serif, system-ui"; ctx.textAlign = "right";
    ctx.fillText(label, W - 12, band.y0 + 14); ctx.textAlign = "left";
  }

  function telegraph() {
    // fairness: show an edge chevron for hazards still off the right edge
    for (const hz of sim.hazards) {
      if (hz.x < W) continue;
      const prox = clamp(1 - (hz.x - W) / 180, 0, 1); if (prox <= 0.02) continue;
      const cy = hz.y + hz.h / 2, col = HZCOL[hz.type] || "#fff";
      ctx.globalAlpha = 0.25 + 0.5 * prox; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(W - 4, cy - 5); ctx.lineTo(W - 11, cy); ctx.lineTo(W - 4, cy + 5); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawHazard(h) {
    const c = HZCOL[h.type] || "#fff", cx = h.x + h.w / 2, cy = h.y + h.h / 2;
    ctx.save();
    ctx.shadowColor = c; ctx.shadowBlur = h.type === "vault" ? 14 : 8; ctx.fillStyle = c;
    if (h.type === "gate") {
      ctx.globalAlpha = 0.9; rr(h.x, h.y, h.w, h.h, 5); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.2;
      rr(h.x + 4, h.y + 4, h.w - 8, h.h - 8, 3); ctx.stroke();
    } else if (h.type === "vault") {
      rr(h.x, h.y, h.w, h.h, 5); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(60,40,0,.55)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy - 2, 4.5, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "rgba(60,40,0,.55)"; ctx.fillRect(cx - 2, cy - 2, 4, 7);
    } else if (h.type === "raw") {
      ctx.beginPath(); ctx.moveTo(h.x, h.y + h.h); ctx.lineTo(cx, h.y); ctx.lineTo(h.x + h.w, h.y + h.h); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(h.w, h.h) / 2, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (colorblind) { ctx.fillStyle = "#fff"; ctx.font = "700 9px ui-sans-serif"; ctx.textAlign = "center"; ctx.fillText(h.type[0].toUpperCase(), cx, h.y - 4); ctx.textAlign = "left"; }
  }

  function drawPlayer() {
    const cx = sim.x + PW / 2, cy = sim.y + PH / 2, t = rafT;
    const spd = Math.sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
    const tilt = clamp(sim.vy * 0.05, -0.45, 0.45) + clamp(sim.vx * 0.012, -0.16, 0.16);
    const dashing = sim.iframes > 0, suspended = sim.consent === "Suspended", low = sim.integrity <= 25;
    const hw = PW / 2, hh = PH / 2;
    const accent = suspended ? C.warn : dashing ? C.signal : C.signal;

    // dash afterimages
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i], a = (i / trail.length) * 0.28 * (dashing ? 1 : 0.5);
      ctx.globalAlpha = a; ctx.fillStyle = accent;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, hw * 0.8, hh * 0.8, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
    // thruster
    ctx.globalCompositeOperation = "lighter";
    const flame = 7 + spd * 2.2 + (dashing ? 14 : 0);
    const fg = ctx.createLinearGradient(-hw - flame, 0, -hw + 2, 0);
    fg.addColorStop(0, hexA(accent, 0)); fg.addColorStop(0.6, hexA(accent, 0.55)); fg.addColorStop(1, hexA(C.signalSoft, 0.95));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-hw + 2, -6); ctx.lineTo(-hw - flame, 0); ctx.lineTo(-hw + 2, 6); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    // hull
    function hull() {
      ctx.beginPath(); ctx.moveTo(hw + 3, 0); ctx.lineTo(hw * 0.42, -hh); ctx.lineTo(-hw * 0.66, -hh * 0.82);
      ctx.lineTo(-hw, -hh * 0.28); ctx.lineTo(-hw, hh * 0.28); ctx.lineTo(-hw * 0.66, hh * 0.82); ctx.lineTo(hw * 0.42, hh); ctx.closePath();
    }
    const hg = ctx.createLinearGradient(0, -hh, 0, hh);
    if (suspended) { hg.addColorStop(0, "#ffe6b3"); hg.addColorStop(1, "#d89a3f"); }
    else { hg.addColorStop(0, "#f0f8ff"); hg.addColorStop(0.55, "#cfecff"); hg.addColorStop(1, "#7fc4ec"); }
    ctx.save(); ctx.shadowColor = accent; ctx.shadowBlur = dashing ? 24 : 14; hull(); ctx.fillStyle = hg; ctx.fill(); ctx.restore();
    hull(); ctx.strokeStyle = low ? hexA(C.danger, 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t / 90))) : "rgba(255,255,255,.9)"; ctx.lineWidth = low ? 2.2 : 1.4; ctx.stroke();
    // core
    const pulse = 0.6 + 0.4 * Math.sin(t / 170);
    ctx.save(); ctx.shadowColor = accent; ctx.shadowBlur = 10;
    const cg = ctx.createRadialGradient(-1, 0, 0, -1, 0, 5 + pulse * 2);
    cg.addColorStop(0, "#fff"); cg.addColorStop(0.6, hexA(C.signalSoft, 1)); cg.addColorStop(1, hexA(C.signal, 0));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(-1, 0, 5 + pulse * 2, 0, TAU); ctx.fill(); ctx.restore();
    // dash shield arc
    if (dashing) { const a = sim.iframes / DASH_IFRAMES; ctx.strokeStyle = hexA(C.signal, 0.3 + 0.5 * a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, hw * 1.5, t / 50, t / 50 + Math.PI * 1.5); ctx.stroke(); }
    ctx.restore();
  }

  function bar(x, y, w, h, frac, col) {
    ctx.fillStyle = "rgba(255,255,255,.10)"; rr(x, y, w, h, h / 2); ctx.fill();
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 7; ctx.fillStyle = col;
    rr(x, y, Math.max(h, w * frac), h, h / 2); ctx.fill(); ctx.restore();
  }
  function drawHud() {
    ctx.save();
    // top scrim
    const sg = ctx.createLinearGradient(0, 0, 0, 54); sg.addColorStop(0, "rgba(4,8,16,.72)"); sg.addColorStop(1, "rgba(4,8,16,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, 54);
    ctx.textAlign = "left";
    // brand + score
    ctx.fillStyle = C.signal; ctx.font = "800 12px ui-sans-serif, system-ui"; ctx.fillText("AXONOS", 18, 26);
    ctx.fillStyle = C.ink; ctx.font = "700 22px ui-sans-serif, system-ui"; ctx.fillText(String(Math.floor(sim.score)).padStart(5, "0"), 84, 28);
    // combo / mult
    let lx = 190;
    if (sim.combo > 0) { ctx.fillStyle = C.vault; ctx.font = "700 13px ui-sans-serif"; ctx.fillText("\u2726 " + sim.combo, lx, 25); lx += 56; }
    if (sim.mult > 1) { ctx.fillStyle = C.fast; ctx.font = "800 13px ui-sans-serif"; ctx.fillText("\u00d72", lx, 25); lx += 36; }
    // consent pill
    const ccol = sim.consent === "Granted" ? C.good : sim.consent === "Suspended" ? C.warn : C.danger;
    ctx.fillStyle = ccol; ctx.font = "700 12px ui-sans-serif"; ctx.textAlign = "center";
    ctx.fillText("\u25cf " + sim.consent, W / 2, 25);
    // integrity bar (right)
    const bw = 168, bx = W - bw - 18;
    ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.font = "700 9px ui-sans-serif"; ctx.fillText("INTEGRITY", W - 18, 14);
    const ig = clamp(sim.integrity / 100, 0, 1), ic = ig > 0.5 ? C.good : ig > 0.25 ? C.warn : C.danger;
    bar(bx, 19, bw, 9, ig, ic);
    // dash readiness
    ctx.textAlign = "left"; ctx.fillStyle = sim.dashCd <= 0 ? C.signal : hexA(C.signal, 0.3);
    ctx.font = "700 11px ui-sans-serif"; ctx.fillText(sim.dashCd <= 0 ? "DASH \u25c8" : "dash \u25c7", bx - 64, 27);
    ctx.restore();
  }

  function drawMessages() {
    let y = 80; ctx.textAlign = "left"; ctx.font = "600 13px ui-sans-serif, system-ui";
    for (const m of msgs) { ctx.globalAlpha = Math.min(1, m.ttl / 40) * 0.92; ctx.fillStyle = C.muted; ctx.fillText(m.msg, 20, y); y += 20; }
    ctx.globalAlpha = 1;
  }

  function overlay(title, sub, accent) {
    ctx.save();
    ctx.fillStyle = "rgba(3,6,13,.62)"; ctx.fillRect(0, 0, W, H);
    const pw = 540, ph = 156, x = (W - pw) / 2, y = (H - ph) / 2;
    ctx.save(); ctx.shadowColor = hexA(accent || C.signal, 0.35); ctx.shadowBlur = 34;
    ctx.fillStyle = "rgba(9,14,24,.94)"; rr(x, y, pw, ph, 18); ctx.fill(); ctx.restore();
    ctx.strokeStyle = hexA(accent || C.signal, 0.28); ctx.lineWidth = 1; rr(x, y, pw, ph, 18); ctx.stroke();
    ctx.fillStyle = hexA(accent || C.signal, 0.9); ctx.font = "800 11px ui-sans-serif"; ctx.textAlign = "center";
    ctx.fillText("BOUNDARY RUN \u00b7 v64", W / 2, y + 34);
    const tg = ctx.createLinearGradient(0, y + 48, 0, y + 84); tg.addColorStop(0, "#fff"); tg.addColorStop(1, "#a8cfff");
    ctx.fillStyle = tg; ctx.font = "800 30px ui-sans-serif, system-ui"; ctx.fillText(title, W / 2, y + 80);
    ctx.fillStyle = C.muted; ctx.font = "600 13px ui-sans-serif"; ctx.fillText(sub, W / 2, y + 112);
    ctx.textAlign = "left"; ctx.restore();
  }

  function draw() {
    const t = rafT;
    if (intro > 0) intro = Math.max(0, intro - 0.02);
    if (punch > 0) punch *= 0.86;
    if (shake > 0.2) shake *= 0.85; else shake = 0;
    const sx = shake ? (crand() - 0.5) * shake : 0, sy = shake ? (crand() - 0.5) * shake : 0;
    const zoom = 1 + punch * 0.03;

    ctx.save();
    ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);

    drawBg();
    drawBand(FAST, C.fast, "FAST \u00b7 \u00d72 score \u00b7 drains");
    drawBand(AUDIT, C.audit, "AUDIT \u00b7 restores integrity");
    telegraph();
    for (const h of sim.hazards) drawHazard(h);
    drawPlayer();

    // particles
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      if (p.ring) { ctx.globalAlpha = Math.max(0, p.life / 20) * 0.7; ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.ringR, 0, TAU); ctx.stroke(); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 26)); ctx.fillStyle = p.color;
      if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 7; }
      ctx.fillRect(p.x, p.y, p.size, p.size); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    // vignette + flash + intro
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.42)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (flash > 0) { ctx.fillStyle = hexA(C.danger, flash); ctx.fillRect(0, 0, W, H); flash *= 0.82; }
    if (intro > 0) { ctx.fillStyle = "rgba(2,5,12," + intro + ")"; ctx.fillRect(0, 0, W, H); }

    drawHud();
    drawMessages();

    if (!started) overlay("Hold the boundary", "Start \u00b7 WASD / arrows move \u00b7 Shift dashes", C.signal);
    else if (paused) overlay("Paused", "Press P or Pause to resume", C.signal);
    else if (sim.over) overlay("Run sealed", "Score " + Math.floor(sim.score) + " \u00b7 best combo " + sim.bestCombo + " \u00b7 Start to run again", C.good);

    ctx.restore();

    // external mirrors (a11y / secondary)
    if (ui.score) ui.score.textContent = String(Math.floor(sim.score)).padStart(5, "0");
    if (ui.integrity) ui.integrity.textContent = Math.max(0, Math.round(sim.integrity)) + "%";
    if (ui.consent) ui.consent.textContent = sim.consent;
  }

  /* ---------- loop ---------- */
  function frame(now) {
    if (!last) last = now; rafT = now;
    let dt = now - last; last = now; if (dt > 250) dt = 250;
    acc += dt; let steps = 0;
    while (acc >= STEP && steps < 6) { tickLogic(); acc -= STEP; steps++; }
    // cosmetic trail of player positions
    if (started && !sim.over && !paused) { trail.push({ x: sim.x + PW / 2, y: sim.y + PH / 2 }); if (trail.length > 7) trail.shift(); }
    for (const p of particles) { if (p.ring) { p.ringR += (p.ringMax - p.ringR) * 0.2; p.life--; continue; } p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; }
    particles = particles.filter(p => p.life > 0);
    for (const m of msgs) m.ttl--; msgs = msgs.filter(m => m.ttl > 0);
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  window.addEventListener("keydown", e => {
    keys.add(e.code);
    if (e.code === "KeyP") paused = !paused;
    if (e.code === "Enter" && (!started || sim.over)) reset();
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => keys.delete(e.code));
  if (byId("start")) byId("start").addEventListener("click", reset);
  if (byId("pause")) byId("pause").addEventListener("click", () => { if (started && !sim.over) paused = !paused; });
  if (byId("colorblind")) byId("colorblind").addEventListener("click", () => { colorblind = !colorblind; document.body.classList.toggle("colorblind", colorblind); });
  if (byId("export")) byId("export").addEventListener("click", () => finalizeProof(false));

  /* ---------- donation copy ---------- */
  function flashCopied(el, ok) {
    const n = byId("copy-note");
    if (n) { n.textContent = ok ? "Copied to clipboard" : "Copy failed \u2014 select manually"; n.classList.add("show"); setTimeout(() => n.classList.remove("show"), 1800); }
    if (el) { el.classList.add("copied"); setTimeout(() => el.classList.remove("copied"), 1200); }
  }
  function copyWallet(el) {
    const addr = (byId("doge-addr") && byId("doge-addr").textContent.trim()) || "DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(() => flashCopied(el, true), () => flashCopied(el, false));
      else { const ta = document.createElement("textarea"); ta.value = addr; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); document.body.removeChild(ta); flashCopied(el, ok); }
    } catch (e) { flashCopied(el, false); }
  }
  if (byId("copy-doge")) {
    byId("copy-doge").addEventListener("click", () => copyWallet(byId("copy-doge")));
    byId("copy-doge").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copyWallet(byId("copy-doge")); } });
  }

  /* ---------- touch: drag to steer, two-finger tap to dash ---------- */
  const stage = document.querySelector(".stage") || canvas;
  let touching = false, tx = 0, ty = 0, dashTouch = false;
  function touchPos(e) { const r = canvas.getBoundingClientRect(), tt = e.touches[0]; tx = (tt.clientX - r.left) * (W / r.width); ty = (tt.clientY - r.top) * (H / r.height); dashTouch = e.touches.length >= 2; }
  function touchSteer() {
    keys.delete("ArrowLeft"); keys.delete("ArrowRight"); keys.delete("ArrowUp"); keys.delete("ArrowDown"); keys.delete("KeyK");
    if (!touching) return;
    const cx = sim.x + PW / 2, cy = sim.y + PH / 2;
    if (tx < cx - 10) keys.add("ArrowLeft"); else if (tx > cx + 10) keys.add("ArrowRight");
    if (ty < cy - 10) keys.add("ArrowUp"); else if (ty > cy + 10) keys.add("ArrowDown");
    if (dashTouch) keys.add("KeyK");
  }
  stage.addEventListener("touchstart", e => { e.preventDefault(); touching = true; if (!started || sim.over) reset(); touchPos(e); }, { passive: false });
  stage.addEventListener("touchmove", e => { e.preventDefault(); touchPos(e); }, { passive: false });
  stage.addEventListener("touchend", e => { e.preventDefault(); if (e.touches.length === 0) { touching = false; dashTouch = false; } }, { passive: false });
  stage.addEventListener("touchcancel", () => { touching = false; dashTouch = false; });

  // small color helper: "#rrggbb" + alpha -> rgba()
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  requestAnimationFrame(frame);
})();
