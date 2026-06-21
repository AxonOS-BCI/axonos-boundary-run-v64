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
    {name:"Safe Lane", kind:"safe", y:388, h:52},
    {name:"Audit Lane", kind:"audit", y:318, h:52},
    {name:"Fast Lane", kind:"fast", y:248, h:52},
  ];

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
  let touchActive = false;
  let screenShake = 0;
  let particles = [];
  let combo = 0;

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
    state = {
      x: 140 * Q,
      y: FLOOR * Q,
      vx: 0,
      vy: 0,
      lane: "safe",
      integrity: Q,
      consent: "Granted",
      score: 0,
      distance: 0,
      resumeVotes: 0,
      gameOver: false,
      proof: "pending"
    };
    for (let i = 0; i < 18; i++) spawnHazard(420 + i * 140);
    announce("Run started. Consent granted. Protect the choice.");
  }

  function spawnHazard(x) {
    const r = rng();
    let type;
    if (r > 0.80) type = "vault";
    else if (r > 0.62) type = "raw";
    else if (r > 0.45) type = "gate";
    else if (r > 0.28) type = "beam";
    else type = "artifact";
    hazards.push({
      x, y: 240 + Math.floor(rng() * 160), w: 36 + Math.floor(rng() * 30), h: 50 + Math.floor(rng() * 50), type,
      phase: Math.floor(rng() * 360), glow: 0
    });
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
    try {
      const data = new TextEncoder().encode(text);
      const h = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2,"0")).join("");
    } catch (e) {
      throw new Error("Proof generation failed: " + e.message);
    }
  }

  async function finalizeProof() {
    try {
      const payload = JSON.stringify({seed, frame, score: state.score, integrity: state.integrity, consent: state.consent, inputLog});
      const hash = await digest(payload);
      state.proof = hash.slice(0, 16);
      if (ui.proof) ui.proof.textContent = state.proof;
      return {seed, frames: frame, score: state.score, consent: state.consent, proof: hash, inputLog};
    } catch (e) {
      state.proof = "ERROR";
      if (ui.proof) ui.proof.textContent = "ERROR";
      announce("Proof generation failed.");
      return null;
    }
  }

  function announce(msg) {
    messages.unshift({msg, ttl: 200});
    messages = messages.slice(0, 5);
    if (ui.live) ui.live.textContent = msg;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (rng() - 0.5) * 8,
        vy: (rng() - 0.5) * 8 - 3,
        life: 30 + rng() * 20,
        color,
        size: 2 + rng() * 4
      });
    }
  }

  function weather() {
    const idx = Math.floor((seed + Math.floor(frame / 720)) % weatherNames.length);
    return weatherNames[idx];
  }

  function update() {
    if (paused || state.gameOver) return;
    frame++;
    const m = inputMask();
    inputLog.push([frame, m, state.integrity, state.consent]);
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
      if (state.resumeVotes > 30) {
        state.consent = "Granted";
        state.resumeVotes = 0;
        announce("Dual-control resume accepted. Consent granted.");
      }
    }

    let ax = 0;
    if (m & 1) ax -= 9000;
    if (m & 2) ax += 9000;
    state.vx += ax;
    state.vx = Math.max(-420000, Math.min(420000, state.vx));
    state.vx = Math.trunc(state.vx * 0.90);
    if ((m & 4) && state.y >= FLOOR * Q) state.vy = -1100000;
    state.vy += 48000;
    state.y += state.vy;
    if (state.y > FLOOR * Q) { state.y = FLOOR * Q; state.vy = 0; }
    state.x += state.vx;
    state.x = Math.max(40 * Q, Math.min(920 * Q, state.x));
    if (isNaN(state.x) || isNaN(state.y)) {
      state.gameOver = true; state.consent = "Withdrawn";
      announce("Integrity violation detected.");
      finalizeProof(); return;
    }

    const worldSpeed = 3.8 + Math.min(4.0, frame / 2400);
    state.distance += worldSpeed;
    state.score = Math.floor(state.distance + (state.integrity / Q) * 1000);

    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.3;
      p.life--;
    }
    particles = particles.filter(p => p.life > 0);
    if (screenShake > 0) screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;

    for (const h of hazards) {
      h.x -= worldSpeed;
      h.glow = Math.max(0, h.glow - 1);
      if (h.x < -100) {
        h.x = W + 100 + rng() * 300;
        h.y = 230 + Math.floor(rng() * 160);
        const r = rng();
        if (r > 0.80) h.type = "vault";
        else if (r > 0.62) h.type = "raw";
        else if (r > 0.45) h.type = "gate";
        else if (r > 0.28) h.type = "beam";
        else h.type = "artifact";
        h.w = 36 + Math.floor(rng() * 30);
        h.h = 50 + Math.floor(rng() * 50);
      }
      const px = state.x / Q, py = state.y / Q;
      const pLeft = px - 18, pRight = px + 18, pTop = py - 50, pBottom = py;
      if (pRight > h.x && pLeft < h.x + h.w && pBottom > h.y && pTop < h.y + h.h) {
        collide(h);
      }
    }

    const lane = lanes.find(l => py >= l.y - 10 && py <= l.y + l.h + 10);
    state.lane = lane ? lane.kind : "safe";
    if (state.lane === "audit" && state.consent === "Granted") state.integrity = Math.min(Q, state.integrity + 28);
    if (state.lane === "fast") state.integrity = Math.max(0, state.integrity - 6);

    if (weather() === "Storm" && frame % 600 === 0 && state.consent === "Granted") {
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
  }

  function collide(h) {
    if (h.hitFrame === frame) return;
    h.hitFrame = frame;
    h.glow = 20;
    screenShake = 8;
    if (h.type === "artifact") {
      state.integrity -= 2200; state.vx = -200000;
      spawnParticles(state.x/Q, state.y/Q - 30, "#a879ff", 12);
      announce("Artifact spike!"); combo = 0;
    }
    if (h.type === "raw") {
      state.integrity -= 6000;
      spawnParticles(state.x/Q, state.y/Q - 30, "#ff4c6d", 16);
      announce("Raw Signal Zone!"); combo = 0;
    }
    if (h.type === "beam") {
      state.vx += 260000; state.integrity -= 1100;
      spawnParticles(state.x/Q, state.y/Q - 30, "#ffe16b", 10);
      announce("Stimulation beam!"); combo = 0;
    }
    if (h.type === "gate") {
      state.consent = "Suspended";
      spawnParticles(state.x/Q, state.y/Q - 30, "#95a0ac", 8);
      announce("Stale consent gate!"); combo = 0;
    }
    if (h.type === "vault") {
      state.integrity = Math.min(Q, state.integrity + 4000);
      spawnParticles(state.x/Q, state.y/Q - 30, "#d6b45c", 20);
      combo++;
      announce("Sealed Vault! Combo x" + combo);
    }
  }

  function draw() {
    const shakeX = screenShake > 0 ? (rng() - 0.5) * screenShake * 2 : 0;
    const shakeY = screenShake > 0 ? (rng() - 0.5) * screenShake * 2 : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.clearRect(-10, -10, W + 20, H + 20);

    const w = weather();
    let bgTop = "#07101d", bgBot = "#020307";
    if (w === "Storm") { bgTop = "#0a1525"; bgBot = "#010205"; }
    if (w === "Solar Flare") { bgTop = "#1a1010"; bgBot = "#080303"; }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bgTop); g.addColorStop(1, bgBot);
    ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);

    ctx.globalAlpha = .12;
    for (let x = 0; x < W; x += 40) { ctx.fillStyle = "#7aa7ff"; ctx.fillRect((x - (frame % 40)), 0, 1, H); }
    for (let y = 0; y < H; y += 40) { ctx.fillStyle = "#7aa7ff"; ctx.fillRect(0, y, W, 1); }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(20,30,50,.8)";
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.strokeStyle = "rgba(100,150,255,.3)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();

    for (const l of lanes) {
      let fill, stroke, pattern;
      if (l.kind === "safe") { fill = "rgba(30,210,220,.12)"; stroke = "rgba(30,210,220,.4)"; pattern = 28; }
      else if (l.kind === "audit") { fill = "rgba(80,220,130,.10)"; stroke = "rgba(80,220,130,.35)"; pattern = 18; }
      else { fill = "rgba(230,170,60,.10)"; stroke = "rgba(230,170,60,.35)"; pattern = 28; }
      ctx.fillStyle = fill; ctx.fillRect(0, l.y, W, l.h);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1;
      ctx.strokeRect(0, l.y, W, l.h);
      if (colorblind) {
        ctx.globalAlpha = .18;
        ctx.fillStyle = stroke;
        for (let x = 0; x < W; x += pattern) ctx.fillRect(x, l.y, 2, l.h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = stroke; ctx.font = "600 11px ui-sans-serif";
      ctx.fillText(l.name, 8, l.y + l.h - 6);
    }

    for (const h of hazards) drawHazard(h);

    const px = state.x / Q, py = state.y / Q;
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(px, FLOOR + 4, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e7f4ff";
    ctx.beginPath(); ctx.arc(px, py - 38, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#c8ad6b";
    ctx.fillRect(px - 12, py - 22, 24, 36);
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 12, py - 22, 24, 36);
    ctx.strokeStyle = "#e7f4ff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px - 14, py - 18); ctx.lineTo(px - 22, py - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 14, py - 18); ctx.lineTo(px + 22, py - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px - 6, py + 14); ctx.lineTo(px - 8, py + 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 6, py + 14); ctx.lineTo(px + 8, py + 28); ctx.stroke();
    ctx.strokeStyle = "rgba(167,230,255," + (0.4 + Math.sin(frame/12)*0.2) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px - 32, py - 52 + Math.sin(frame/14)*4, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px - 32, py - 52 + Math.sin(frame/14)*4, 20, 0, Math.PI * 2); ctx.stroke();

    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life / 15);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / 30), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 0, W, 48);
    ctx.fillStyle = "#f4f7fb"; ctx.font = "700 16px ui-sans-serif";
    ctx.fillText("Score " + state.score, 16, 30);
    ctx.fillStyle = state.consent === "Granted" ? "#79f0c0" : state.consent === "Suspended" ? "#f4c76b" : "#ff6b6b";
    ctx.fillText("Consent: " + state.consent, 140, 30);
    ctx.fillStyle = "#cbd7e5"; ctx.fillText("Weather: " + weather(), 340, 30);
    ctx.fillStyle = "#a879ff"; ctx.fillText("Combo: " + combo + "x", 540, 30);

    let y = 68;
    ctx.font = "600 14px ui-sans-serif";
    for (const m of messages) {
      ctx.fillStyle = "rgba(238,243,248," + Math.min(1, m.ttl / 40) + ")";
      ctx.fillText("Kibo: " + m.msg, 16, y); y += 22;
    }

    if (paused) banner("PAUSED — Press P to resume");
    if (state.gameOver) banner("RUN SEALED — PROOF GENERATED");

    if (ui.integrity) ui.integrity.textContent = Math.max(0, Math.round(state.integrity / Q * 100)) + "%";
    if (ui.consent) ui.consent.textContent = state.consent;
    if (ui.weather) ui.weather.textContent = weather();

    ctx.restore();
  }

  function drawHazard(h) {
    const colors = {artifact:"#a879ff", raw:"#ff4c6d", beam:"#ffe16b", gate:"#95a0ac", vault:"#d6b45c"};
    const glowColors = {artifact:"rgba(168,121,255,.3)", raw:"rgba(255,76,109,.3)", beam:"rgba(255,225,107,.3)", gate:"rgba(149,160,172,.3)", vault:"rgba(214,180,92,.3)"};
    const c = colors[h.type] || "#fff";
    const gc = glowColors[h.type] || "rgba(255,255,255,.2)";

    if (h.glow > 0) {
      ctx.globalAlpha = h.glow / 20;
      ctx.fillStyle = gc;
      ctx.beginPath(); ctx.arc(h.x + h.w/2, h.y + h.h/2, h.w + 15, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = c;
    ctx.globalAlpha = h.type === "beam" ? .55 : .82;

    if (h.type === "beam") {
      ctx.fillRect(h.x, 120, h.w, 340);
      ctx.fillStyle = "rgba(255,255,255,.3)";
      ctx.fillRect(h.x + h.w/2 - 2, 120, 4, 340);
    } else if (h.type === "gate") {
      ctx.fillRect(h.x, h.y, h.w, h.h);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.strokeRect(h.x + 3, h.y + 3, h.w - 6, h.h - 6);
      ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "700 12px ui-sans-serif";
      ctx.fillText("GATE", h.x + 6, h.y + 20);
    } else if (h.type === "vault") {
      ctx.beginPath(); ctx.roundRect(h.x, h.y, h.w, h.h, 8); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(h.x + 3, h.y + 3, h.w - 6, h.h - 6, 6); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 11px ui-sans-serif";
      ctx.fillText("VAULT", h.x + 6, h.y + 18);
    } else if (h.type === "raw") {
      ctx.beginPath(); ctx.moveTo(h.x, h.y + h.h); ctx.lineTo(h.x + h.w/2, h.y); ctx.lineTo(h.x + h.w, h.y + h.h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "700 11px ui-sans-serif";
      ctx.fillText("RAW", h.x + 4, h.y + h.h - 6);
    } else {
      ctx.beginPath(); ctx.moveTo(h.x + h.w/2, h.y); ctx.lineTo(h.x + h.w, h.y + h.h/2);
      ctx.lineTo(h.x + h.w/2, h.y + h.h); ctx.lineTo(h.x, h.y + h.h/2); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function banner(text) {
    ctx.fillStyle = "rgba(0,0,0,.7)";
    ctx.fillRect(0, H/2 - 60, W, 120);
    ctx.strokeStyle = "rgba(200,173,107,.5)"; ctx.lineWidth = 2;
    ctx.strokeRect(20, H/2 - 50, W - 40, 100);
    ctx.fillStyle = "#fff"; ctx.font = "800 32px ui-sans-serif";
    ctx.textAlign = "center"; ctx.fillText(text, W/2, H/2 + 10); ctx.textAlign = "left";
    ctx.fillStyle = "#c8ad6b"; ctx.font = "600 14px ui-sans-serif";
    ctx.textAlign = "center";
    if (state.gameOver) ctx.fillText("Press Start to begin a new run", W/2, H/2 + 38);
    ctx.textAlign = "left";
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", e => {
    keys.add(e.code);
    if (e.code === "KeyP") paused = !paused;
    if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => keys.delete(e.code));

  const stage = canvas.parentElement || canvas;
  stage.addEventListener("touchstart", (e) => {
    e.preventDefault(); touchActive = true;
    const touch = e.touches[0];
    const rect = stage.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    keys.clear();
    if (x < rect.width * 0.25) keys.add("ArrowLeft");
    else if (x > rect.width * 0.75) keys.add("ArrowRight");
    if (y < rect.height * 0.35) keys.add("ArrowUp");
    else if (y > rect.height * 0.65) keys.add("ArrowDown");
  }, {passive: false});
  stage.addEventListener("touchend", (e) => { e.preventDefault(); touchActive = false; keys.clear(); }, {passive: false});
  stage.addEventListener("touchmove", (e) => e.preventDefault(), {passive: false});

  document.getElementById("start")?.addEventListener("click", reset);
  document.getElementById("pause")?.addEventListener("click", () => paused = !paused);
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
      const blob = new Blob([JSON.stringify(proof, null, 2)], {type: "application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      announce("Proof exported: " + filename);
    } catch (e) { announce("Proof export failed: " + e.message); }
  });

  window.addEventListener("beforeunload", () => { if (animId) cancelAnimationFrame(animId); });

  reset();
  loop();
})();