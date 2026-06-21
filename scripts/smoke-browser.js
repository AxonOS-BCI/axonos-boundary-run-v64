'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto').webcrypto;

let rafCount = 0;
const listeners = Object.create(null);

function makeElement(id) {
  const handlers = Object.create(null);
  return {
    id,
    textContent: '',
    innerHTML: '',
    classList: { toggle() {} },
    style: {},
    parentElement: null,
    appendChild() {},
    removeChild() {},
    click() { if (handlers.click) handlers.click({ preventDefault() {} }); },
    addEventListener(type, cb) { handlers[type] = cb; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; },
  };
}

function makeContext() {
  const noop = () => {};
  return {
    save: noop, restore: noop, translate: noop, clearRect: noop, fillRect: noop, strokeRect: noop,
    beginPath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, closePath: noop,
    arc: noop, ellipse: noop, fill: noop, stroke: noop, fillText: noop, roundRect: noop,
    createLinearGradient() { return { addColorStop: noop }; },
    set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {}, set globalAlpha(_) {},
    set font(_) {}, set textAlign(_) {},
  };
}

const elements = Object.create(null);
for (const id of ['game', 'integrity', 'consent', 'weather', 'proof', 'live', 'codex', 'start', 'pause', 'colorblind', 'export']) {
  elements[id] = makeElement(id);
}
elements.game.width = 960;
elements.game.height = 540;
elements.game.getContext = () => makeContext();
elements.game.parentElement = makeElement('stage');

global.window = {
  top: null,
  self: null,
  crypto,
  addEventListener(type, cb) { listeners[type] = cb; },
};
window.top = window;
window.self = window;

global.document = {
  documentElement: makeElement('html'),
  body: makeElement('body'),
  getElementById(id) { return elements[id] || null; },
  createElement(tag) { return makeElement(tag); },
};

if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: crypto, configurable: true });
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.Blob = class Blob { constructor(parts, opts) { this.parts = parts; this.opts = opts; } };
global.URL = { createObjectURL() { return 'blob:mock'; }, revokeObjectURL() {} };
global.requestAnimationFrame = (cb) => {
  if (rafCount++ < 180) cb();
  return rafCount;
};
global.cancelAnimationFrame = () => {};

const script = fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8');
Function(script)();

if (!elements.integrity.textContent.endsWith('%')) throw new Error('Integrity HUD did not initialize');
if (!['Granted', 'Suspended', 'Withdrawn'].includes(elements.consent.textContent)) throw new Error('Consent HUD did not initialize');
if (!elements.weather.textContent) throw new Error('Weather HUD did not initialize');
console.log('smoke ok:', { frames: rafCount, integrity: elements.integrity.textContent, consent: elements.consent.textContent, weather: elements.weather.textContent });
