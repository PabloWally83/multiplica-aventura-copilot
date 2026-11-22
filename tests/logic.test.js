'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'app.js');
const appSource = fs.readFileSync(appPath, 'utf8');

execFileSync(process.execPath, ['--check', appPath]);
assert.doesNotMatch(appSource, /onclick\s*=\s*["'][^"']*stopPropagation/);
assert.match(appSource, /'start-learn':\s*\(\)\s*=>\s*startLesson\(n\)/);
assert.ok(fs.existsSync(path.join(root, 'manifest.webmanifest')));

const listeners = {};
const storage = new Map();
storage.set('multiplicaAventura.v1', JSON.stringify({
  version: 1,
  playerName: 'Tester',
  levels: {},
  factStats: {},
  badges: []
}));

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      innerHTML: '',
      textContent: '',
      hidden: false,
      focus() {},
      appendChild() {},
      querySelector() { return null; }
    });
  }
  return elements.get(id);
}

const documentMock = {
  activeElement: null,
  getElementById: element,
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener(type, handler) { listeners[type] = handler; }
};

const windowMock = {
  matchMedia() { return { matches: true }; },
  addEventListener() {}
};

const context = vm.createContext({
  window: windowMock,
  document: documentMock,
  navigator: {},
  location: { protocol: 'https:' },
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  },
  requestAnimationFrame(callback) { callback(); },
  setTimeout,
  clearTimeout,
  console,
  Date,
  Math
});

vm.runInContext(appSource, context, { filename: 'app.js' });
assert.equal(typeof listeners.click, 'function');

function control(action, extra = {}) {
  return {
    disabled: false,
    dataset: { action, ...extra },
    classList: { contains(name) { return name === 'modal-backdrop' && action === 'close-modal-backdrop'; } }
  };
}

function clickControl(item) {
  listeners.click({ target: { closest() { return item; } } });
}

const modal = element('modal-root');
const main = element('main');

clickControl(control('open-level', { level: '1' }));
assert.match(modal.innerHTML, /data-action="start-learn"/);
assert.doesNotMatch(modal.innerHTML, /onclick=/);

clickControl(control('start-learn', { level: '1' }));
assert.equal(modal.innerHTML, '');
assert.match(main.innerHTML, /Descubrí la tabla del 1/);
assert.match(main.innerHTML, /data-action="lesson-next"/);

clickControl(control('home'));
clickControl(control('open-level', { level: '1' }));
clickControl(control('close-modal'));
assert.equal(modal.innerHTML, '');

console.log('OK: sintaxis, modal, Descubrir y cierre verificados.');