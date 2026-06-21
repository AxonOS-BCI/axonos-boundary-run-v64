/*
 * AxonOS Boundary Run v64 — The Sovereign Signal
 * Created by Denis Yermakou, Founder & CEO of AxonOS.
 * Copyright © 2026 Denis Yermakou / AxonOS.
 * License: AGPL-3.0-only OR AxonOS Commercial License
 */
(() => {
  "use strict";

  if (window.top !== window.self) {
    document.documentElement.innerHTML = "AxonOS Boundary Run v64 refuses embedded iframe execution.";
    throw new Error("Frame embedding blocked");
  }

  const canvas = document.getElementById("game");
  if (!canvas) { console.error("Game canvas not found"); return; }
  const ctx = canvas.getContext("2d");
  if (!ctx) { console.error("2D canvas context not available"); return; }

  const ui = {
    integrity: document.getElementById("integrity"),
    consent: document.getElementById("consent"),
    weather: document.getElementById("weather"),
    proof: document.getElementById("proof"),
    live: document.getElementById("live"),
    codex: document.getElementById("codex"),
  };

  const W = canvas.width;
  const H = canvas.height;
  const FLOOR = 440;
  const Q = 65536;
  const weatherNames = ["Clear", "Overcast", "Storm", "Solar Flare", "Quantum Calm"];
  const lanes = [
    { name: "Safe Lane", kind: "safe", y: 388, h: 52 },
    { name: "Audit Lane", kind: "audit", y: 318, h: 52 },
    { name: "Fast Lane", kind: "fast", y: 248, h: 52 },
  ];
  const hazardPlan = ["artifact", "beam", "vault", "raw", "gate", "artifact", "beam", "vault"];

  let keys = new Set();
  let paused = false;
  let colorblind = false;
  let frame = 0;
  let seed = 0xA50F0064;
  let inputLog = [];
  let hazards = [];
  let messages = [];
  let codexUnlocked = false;
  let state;
  let animId = null;
  let screenShake = 0;
  let particles = [];
  let combo = 0;
  let nextPattern = 0;
  let lastHitFrame = -999;

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function fixed(n) { return Math.trunc(n * Q); }
  function px(n) { return n / Q; }
  function safeRoundRect(x, y, w, h, r) {
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }

  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  let rng = mulberry32(seed);

  function reset() {
    frame = 0;
    seed = (Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) ^ 0xB0A5D64) >>> 0;
    rng = mulberry32(seed);
    inputLog = [];
    hazards = [];
    messages = [];
    particles = [];
    codexUnlocked = false;
    paused = false;
    screenShake = 0;
    combo = 0;
    nextPattern = 0;
    lastHitFrame = -999;
    state = {
      x: fixed(156),
      y: fixed(FLOOR),
      vx: 0,
      vy: 0,
      grounded: true,
      ducking: false,
      lane: "safe",
      integrity: Q,
      consent: "Granted",
      score: 0,
      distance: 0,
      resumeVotes: 0,
      gameOver: false,
      proof: "pending"
    };
    for (let i = 0; i < 12; i++) spawnHazard(520 + i * 185);
    announce("Run started. Consent granted. Protect the boundary.");
    updateHud();
  }

  function configureHazard(h, type) {
    h.type = type;
    h.hit = false;
    h.glow = 0;
    h.phase = Math.floor(rng() * 360);
    h.warning = 0;
    if (type === "artifact") {
      h.y = FLOOR - 34; h.w = 34; h.h = 34; h.damage = 1850;
    } else if (type === "raw") {
      h.y = FLOOR - 64; h.w = 42; h.h = 64; h.damage = 4800;
    } else if (type === "beam") {
      h.y = FLOOR - 72; h.w = 88; h.h = 24; h.damage = 2600;
    } else if (type === "gate") {
      h.y = FLOOR - 90; h.w = 38; h.h = 84; h.damage = 0;
    } else {
      h.y = FLOOR - 104; h.w = 36; h.h = 36; h.damage = -4500;
    }
  }

  function spawnHazard(x) {
    const h = { x, y: 0, w: 0, h: 0, type: "artifact", hit: false, phase: 0, glow: 0, warning: 0 };
    const type = hazardPlan[nextPattern % hazardPlan.length];
    nextPattern++;
    configureHazard(h, type);
    hazards.push(h);
  }

  function recycleHazard(h) {
    const furthest = hazards.reduce((m, item) => Math.max(m, item.x), W);
    h.x = furthest + 150 + Math.floor(rng() * 130);
    const type = hazardPlan[nextPattern % hazardPlan.length];
    nextPattern++;
    configureHazard(h, type);
  }

  function inputMask() {
    let m = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) m |= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) m |= 2;
    if (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space")) m |= 4;
    if (keys.has("ArrowDown") || keys.has("KeyS")) m |= 8;
    return m;
  }

  async function digest(text) {
    const cryptoApi = window.crypto || globalThis.crypto;
    if (!cryptoApi || !cryptoApi.subtle) throw new Error("SubtleCrypto unavailable");
    const data = new TextEncoder().encode(text);
    const h = await cryptoApi.subtle.digest("SHA-256", data);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function finalizeProof() {
    try {
      const payload = JSON.stringify({
        version: "64.0.0",
        seed,
        frame,
        score: state.score,
        integrity: state.integrity,
        consent: state.consent,
        inputLog
      });
      const hash = await digest(payload);
      state.proof = hash.slice(0, 16);
      updateHud();
      return { version: "64.0.0", seed, frames: frame, score: state.score, consent: state.consent, proof: hash, inputLog };
    } catch (e) {
      state.proof = "ERROR";
      updateHud();
      announce("Proof generation failed.");
      return null;
    }
  }

  function announce(msg) {
    messages.unshift({ msg, ttl: 190 });
    messages = messages.slice(0, 5);
    if (ui.live) ui.live.textContent = msg;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (rng() - 0.5) * 7,
        vy: (rng() - 0.5) * 7 - 3,
        life: 24 + rng() * 18,
        color,
        size: 2 + rng() * 3
      });
    }
  }

  function weather() {
    const idx = Math.floor((seed + Math.floor(frame / 900)) % weatherNames.length);
    return weatherNames[idx];
  }

  function playerBox() {
    const x = px(state.x);
    const y = px(state.y);
    const duck = state.ducking && state.grounded;
    const width = duck ? 44 : 34;
    const height = duck ? 28 : 54;
    return {
      left: x - width / 2,
      right: x + width / 2,
      top: y - height,
      bottom: y,
      centerX: x,
      centerY: y - height / 2,
      height,
      duck
    };
  }

  function hazardBox(h) {
    if (h.type === "vault") {
      return { left: h.x - 4, right: h.x + h.w + 4, top: h.y - 4, bottom: h.y + h.h + 4 };
    }
    return { left: h.x, right: h.x + h.w, top: h.y, bottom: h.y + h.h };
  }

  function overlaps(a, b) {
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  function update() {
    if (paused || state.gameOver) return;
    frame++;
    const m = inputMask();
    if (frame % 2 === 0) inputLog.push([frame, m, state.integrity, state.consent]);
    if (inputLog.length > 7200) inputLog.shift();

    if (keys.has("KeyR") && state.consent !== "Withdrawn") {
      state.consent = "Withdrawn";
      state.gameOver = true;
      announce("Consent withdrawn. Terminal state reached.");
      finalizeProof();
      return;
    }
    if (keys.has("KeyE") && state.consent === "Suspended") {
      state.resumeVotes++;
      if (state.resumeVotes > 24) {
        state.consent = "Granted";
        state.resumeVotes = 0;
        announce("Dual-control resume accepted. Consent granted.");
      }
    }

    let ax = 0;
    if (m & 1) ax -= 9500;
    if (m & 2) ax += 9500;
    state.ducking = Boolean(m & 8);
    if (state.ducking && state.grounded) state.vx = Math.trunc(state.vx * 0.92);

    state.vx += ax;
    state.vx = clamp(state.vx, -360000, 360000);
    state.vx = Math.trunc(state.vx * 0.88);
    if ((m & 4) && state.grounded && !state.ducking) {
      state.vy = -1010000;
      state.grounded = false;
    }
    state.vy += 47000;
    state.y += state.vy;
    if (state.y >= fixed(FLOOR)) {
      state.y = fixed(FLOOR);
      state.vy = 0;
      state.grounded = true;
    }
    state.x += state.vx;
    state.x = clamp(state.x, fixed(58), fixed(420));

    if (!Number.isFinite(state.x) || !Number.isFinite(state.y) || !Number.isFinite(state.vx) || !Number.isFinite(state.vy)) {
      state.gameOver = true;
      state.consent = "Withdrawn";
      announce("Integrity violation detected.");
      finalizeProof();
      return;
    }

    const worldSpeed = 3.25 + Math.min(2.9, frame / 3000);
    state.distance += worldSpeed;
    state.score = Math.max(0, Math.floor(state.distance + (state.integrity / Q) * 1000 + combo * 75));

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life--;
    }
    particles = particles.filter(p => p.life > 0);
    if (screenShake > 0) screenShake *= 0.84;
    if (screenShake < 0.5) screenShake = 0;

    const pb = playerBox();
    for (const h of hazards) {
      h.x -= worldSpeed;
      h.glow = Math.max(0, h.glow - 1);
      h.warning = h.x > 430 && h.x < 760 ? 1 : 0;
      if (h.x < -120) recycleHazard(h);
      const hb = hazardBox(h);
      if (!h.hit && overlaps(pb, hb)) collide(h);
    }

    const pMid = pb.centerY;
    const lane = lanes.find(l => pMid >= l.y && pMid <= l.y + l.h);
    state.lane = lane ? lane.kind : "safe";
    if (state.lane === "audit" && state.consent === "Granted") state.integrity = Math.min(Q, state.integrity + 32);
    if (state.lane === "fast") state.integrity = Math.max(0, state.integrity - 4);
    if (state.grounded && state.consent === "Granted") state.integrity = Math.min(Q, state.integrity + 7);

    if (weather() === "Storm" && frame % 780 === 0 && state.consent === "Granted") {
      state.consent = "Suspended";
      announce("Kibo suspended consent: storm-induced policy drift.");
    }
    if (state.integrity <= 0 && !state.gameOver) {
      state.integrity = 0;
      state.gameOver = true;
      state.consent = "Withdrawn";
      announce("Integrity collapsed. Consent withdrawn.");
      finalizeProof();
    }
    if (!codexUnlocked && state.distance > 420) {
      codexUnlocked = true;
      if (ui.codex) ui.codex.textContent = "Consent FSM unlocked: Granted permits bounded operation; Suspended reduces exposure; Withdrawn is terminal.";
      announce("Codex unlocked: Consent State Machine.");
    }
    for (const msg of messages) msg.ttl--;
    messages = messages.filter(m => m.ttl > 0);
    updateHud();
  }

  function collide(h) {
    h.hit = true;
    h.glow = 20;
    lastHitFrame = frame;
    if (h.type !== "vault") screenShake = 5;

    if (h.type === "artifact") {
      state.integrity = Math.max(0, state.integrity - h.damage);
      state.vx = -180000;
      spawnParticles(px(state.x), px(state.y) - 28, "#a879ff", 10);
      announce("Artifact spike. Jump earlier or move left.");
      combo = 0;
    } else if (h.type === "raw") {
      state.integrity = Math.max(0, state.integrity - h.damage);
      state.vx = -220000;
      spawnParticles(px(state.x), px(state.y) - 30, "#ff4c6d", 14);
      announce("Raw signal impact. Boundary degraded.");
      combo = 0;
    } else if (h.type === "beam") {
      state.integrity = Math.max(0, state.integrity - h.damage);
      state.vx = -120000;
      spawnParticles(px(state.x), px(state.y) - 36, "#ffe16b", 10);
      announce("Beam hit. Duck under gold beams.");
      combo = 0;
    } else if (h.type === "gate") {
      state.consent = "Suspended";
      state.resumeVotes = 0;
      spawnParticles(px(state.x), px(state.y) - 36, "#95a0ac", 8);
      announce("Stale consent gate. Hold E to resume.");
      combo = 0;
    } else if (h.type === "vault") {
      state.integrity = Math.min(Q, state.integrity + Math.abs(h.damage));
      state.score += 350;
      combo = Math.min(9, combo + 1);
      spawnParticles(px(state.x), px(state.y) - 48, "#d6b45c", 18);
      announce("Sealed vault collected. Combo x" + combo);
    }
  }

  function draw() {
    const shakeX = screenShake > 0 ? (rng() - 0.5) * screenShake * 2 : 0;
    const shakeY = screenShake > 0 ? (rng() - 0.5) * screenShake * 2 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.clearRect(-12, -12, W + 24, H + 24);

    const w = weather();
    let bgTop = "#07101d", bgBot = "#020307";
    if (w === "Storm") { bgTop = "#0a1525"; bgBot = "#010205"; }
    if (w === "Solar Flare") { bgTop = "#1a1010"; bgBot = "#080303"; }
    if (w === "Quantum Calm") { bgTop = "#101426"; bgBot = "#030408"; }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bgTop);
    g.addColorStop(1, bgBot);
    ctx.fillStyle = g;
    ctx.fillRect(-12, -12, W + 24, H + 24);

    drawGrid();
    drawLanes();
    for (const h of hazards) drawHazard(h);
    drawPlayer();
    drawParticles();
    drawHud();
    if (paused) banner("PAUSED — Press P to resume");
    if (state.gameOver) banner("RUN SEALED — PROOF GENERATED");
    ctx.restore();
  }

  function drawGrid() {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#7aa7ff";
    for (let x = 0; x < W + 40; x += 40) ctx.fillRect(x - (frame % 40), 0, 1, H);
    for (let y = 0; y < H; y += 40) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(20,30,50,.8)";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.strokeStyle = "rgba(100,150,255,.3)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();
  }

  function drawLanes() {
    for (const l of lanes) {
      let fill, stroke, pattern;
      if (l.kind === "safe") { fill = "rgba(30,210,220,.12)"; stroke = "rgba(30,210,220,.4)"; pattern = 28; }
      else if (l.kind === "audit") { fill = "rgba(80,220,130,.10)"; stroke = "rgba(80,220,130,.35)"; pattern = 18; }
      else { fill = "rgba(230,170,60,.10)"; stroke = "rgba(230,170,60,.35)"; pattern = 28; }
      ctx.fillStyle = fill;
      ctx.fillRect(0, l.y, W, l.h);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, l.y, W, l.h);
      if (colorblind) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = stroke;
        for (let x = 0; x < W; x += pattern) ctx.fillRect(x, l.y, 2, l.h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = stroke;
      ctx.font = "600 11px ui-sans-serif";
      ctx.fillText(l.name, 8, l.y + l.h - 6);
    }
  }

  function drawPlayer() {
    const pb = playerBox();
    const pxv = pb.centerX;
    const pyv = px(state.y);
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(pxv, FLOOR + 4, 18, 5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#e7f4ff";
    ctx.beginPath(); ctx.arc(pxv, pb.duck ? pyv - 24 : pyv - 42, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#c8ad6b";
    ctx.beginPath();
    safeRoundRect(pxv - (pb.duck ? 20 : 12), pb.duck ? pyv - 24 : pyv - 28, pb.duck ? 40 : 24, pb.duck ? 24 : 38, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "#e7f4ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pxv - 12, pyv - 18); ctx.lineTo(pxv - 22, pyv - 8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pxv + 12, pyv - 18); ctx.lineTo(pxv + 22, pyv - 8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pxv - 6, pyv + 10); ctx.lineTo(pxv - 9, pyv + 26); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pxv + 6, pyv + 10); ctx.lineTo(pxv + 9, pyv + 26); ctx.stroke();

    ctx.strokeStyle = `rgba(167,230,255,${0.4 + Math.sin(frame / 12) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pxv - 32, pyv - 52 + Math.sin(frame / 14) * 4, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(pxv - 32, pyv - 52 + Math.sin(frame / 14) * 4, 20, 0, Math.PI * 2); ctx.stroke();

    if (lastHitFrame + 20 > frame) {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#ff4c6d";
      ctx.fillRect(pb.left - 6, pb.top - 6, pb.right - pb.left + 12, pb.bottom - pb.top + 12);
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life / 15);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / 28), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    ctx.fillStyle = "rgba(0,0,0,.58)";
    ctx.fillRect(0, 0, W, 50);
    ctx.fillStyle = "#f4f7fb";
    ctx.font = "700 16px ui-sans-serif";
    ctx.fillText("Score " + state.score, 16, 31);
    ctx.fillStyle = state.consent === "Granted" ? "#79f0c0" : state.consent === "Suspended" ? "#f4c76b" : "#ff6b6b";
    ctx.fillText("Consent: " + state.consent, 140, 31);
    ctx.fillStyle = "#cbd7e5";
    ctx.fillText("Weather: " + weather(), 340, 31);
    ctx.fillStyle = "#a879ff";
    ctx.fillText("Combo: " + combo + "x", 540, 31);
    ctx.fillStyle = state.ducking ? "#c8ad6b" : "#7aa7ff";
    ctx.fillText(state.ducking ? "DUCK" : "RUN", 650, 31);

    let y = 70;
    ctx.font = "600 14px ui-sans-serif";
    for (const m of messages) {
      ctx.fillStyle = "rgba(238,243,248," + Math.min(1, m.ttl / 40) + ")";
      ctx.fillText("Kibo: " + m.msg, 16, y);
      y += 22;
    }
  }

  function drawHazard(h) {
    const colors = { artifact: "#a879ff", raw: "#ff4c6d", beam: "#ffe16b", gate: "#95a0ac", vault: "#d6b45c" };
    const glowColors = { artifact: "rgba(168,121,255,.3)", raw: "rgba(255,76,109,.3)", beam: "rgba(255,225,107,.3)", gate: "rgba(149,160,172,.3)", vault: "rgba(214,180,92,.3)" };
    const c = colors[h.type] || "#fff";
    const gc = glowColors[h.type] || "rgba(255,255,255,.2)";

    if (h.warning) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = c;
      ctx.fillRect(W - 14, h.y, 8, h.h);
      ctx.globalAlpha = 1;
    }
    if (h.glow > 0) {
      ctx.globalAlpha = h.glow / 20;
      ctx.fillStyle = gc;
      ctx.beginPath(); ctx.arc(h.x + h.w / 2, h.y + h.h / 2, Math.max(h.w, h.h) + 16, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = h.hit && h.type !== "vault" ? "rgba(110,110,120,.35)" : c;
    ctx.globalAlpha = h.type === "beam" ? 0.72 : 0.86;
    if (h.type === "beam") {
      ctx.beginPath();
      safeRoundRect(h.x, h.y, h.w, h.h, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(h.x + 8, h.y + h.h / 2 - 2, h.w - 16, 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.font = "700 11px ui-sans-serif";
      ctx.fillText("DUCK", h.x + 14, h.y - 6);
    } else if (h.type === "gate") {
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(h.x + 3, h.y + 3, h.w - 6, h.h - 6);
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.font = "700 12px ui-sans-serif";
      ctx.fillText("GATE", h.x + 3, h.y + 20);
    } else if (h.type === "vault") {
      ctx.beginPath(); safeRoundRect(h.x, h.y, h.w, h.h, 8); ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath(); safeRoundRect(h.x + 3, h.y + 3, h.w - 6, h.h - 6, 6); ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "700 11px ui-sans-serif";
      ctx.fillText("VAULT", h.x + 1, h.y + 22);
    } else if (h.type === "raw") {
      ctx.beginPath(); ctx.moveTo(h.x, h.y + h.h); ctx.lineTo(h.x + h.w / 2, h.y); ctx.lineTo(h.x + h.w, h.y + h.h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.font = "700 11px ui-sans-serif";
      ctx.fillText("RAW", h.x + 7, h.y + h.h - 7);
    } else {
      ctx.beginPath(); ctx.moveTo(h.x + h.w / 2, h.y); ctx.lineTo(h.x + h.w, h.y + h.h / 2);
      ctx.lineTo(h.x + h.w / 2, h.y + h.h); ctx.lineTo(h.x, h.y + h.h / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.font = "700 10px ui-sans-serif";
      ctx.fillText("JUMP", h.x + 2, h.y - 6);
    }
    ctx.globalAlpha = 1;
  }

  function banner(text) {
    ctx.fillStyle = "rgba(0,0,0,.72)";
    ctx.fillRect(0, H / 2 - 60, W, 120);
    ctx.strokeStyle = "rgba(200,173,107,.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, H / 2 - 50, W - 40, 100);
    ctx.fillStyle = "#fff";
    ctx.font = "800 32px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, H / 2 + 10);
    ctx.fillStyle = "#c8ad6b";
    ctx.font = "600 14px ui-sans-serif";
    if (state.gameOver) ctx.fillText("Press Start to begin a new run", W / 2, H / 2 + 38);
    ctx.textAlign = "left";
  }

  function updateHud() {
    if (!state) return;
    if (ui.integrity) ui.integrity.textContent = Math.max(0, Math.round(state.integrity / Q * 100)) + "%";
    if (ui.consent) ui.consent.textContent = state.consent;
    if (ui.weather) ui.weather.textContent = weather();
    if (ui.proof) ui.proof.textContent = state.proof;
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function setTouchKeys(touch, rect) {
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    keys.delete("ArrowLeft"); keys.delete("ArrowRight"); keys.delete("ArrowUp"); keys.delete("ArrowDown");
    if (x < rect.width * 0.33) keys.add("ArrowLeft");
    else if (x > rect.width * 0.67) keys.add("ArrowRight");
    if (y < rect.height * 0.35) keys.add("ArrowUp");
    else if (y > rect.height * 0.66) keys.add("ArrowDown");
  }

  window.addEventListener("keydown", e => {
    keys.add(e.code);
    if (e.code === "KeyP") paused = !paused;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => keys.delete(e.code));

  const stage = canvas.parentElement || canvas;
  stage.addEventListener("touchstart", e => {
    e.preventDefault();
    if (!e.touches || !e.touches.length) return;
    setTouchKeys(e.touches[0], stage.getBoundingClientRect());
  }, { passive: false });
  stage.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!e.touches || !e.touches.length) return;
    setTouchKeys(e.touches[0], stage.getBoundingClientRect());
  }, { passive: false });
  stage.addEventListener("touchend", e => {
    e.preventDefault();
    keys.delete("ArrowLeft"); keys.delete("ArrowRight"); keys.delete("ArrowUp"); keys.delete("ArrowDown");
  }, { passive: false });

  document.getElementById("start")?.addEventListener("click", reset);
  document.getElementById("pause")?.addEventListener("click", () => { paused = !paused; });
  document.getElementById("colorblind")?.addEventListener("click", () => {
    colorblind = !colorblind;
    document.body.classList.toggle("colorblind", colorblind);
  });
  document.getElementById("export")?.addEventListener("click", async () => {
    try {
      const proof = await finalizeProof();
      if (!proof || !proof.proof) { announce("Proof export failed."); return; }
      const safeHash = String(proof.proof).replace(/[^a-f0-9]/gi, "").slice(0, 12);
      const filename = "boundary-run-v64-proof-" + safeHash + ".json";
      const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      announce("Proof exported: " + filename);
    } catch (e) {
      announce("Proof export failed: " + e.message);
    }
  });

  window.addEventListener("beforeunload", () => { if (animId) cancelAnimationFrame(animId); });

  reset();
  loop();
})();
