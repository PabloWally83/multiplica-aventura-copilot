'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

function element() {
  return {
    innerHTML: '', textContent: '', hidden: false, classList: { toggle() {}, add() {}, contains() { return false; } },
    style: {}, dataset: {}, focus() {}, appendChild() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return element(); }, querySelectorAll() { return []; }, insertAdjacentHTML() {},
    content: { cloneNode() { return {}; } }
  };
}

function boot(saved = {}) {
  const elements = new Map();
  ['main','modal-root','daily-streak','stars','xp','review-dot','welcome-template','toast-root','confetti'].forEach(id => elements.set(id, element()));
  const storage = { 'multiplicaAventura.v1': JSON.stringify({ version: 1, playerName: 'Test', ...saved }) };
  const document = {
    documentElement: { dataset: {} },
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
    querySelectorAll() { return []; },
    querySelector() { return { setAttribute() {} }; },
    addEventListener() {}
  };
  const context = {
    console, document,
    localStorage: { getItem(k) { return storage[k] || null; }, setItem(k,v) { storage[k] = v; }, removeItem(k) { delete storage[k]; } },
    window: { matchMedia() { return { matches: true }; }, addEventListener() {} },
    navigator: {}, location: { protocol: 'file:' }, Date, Math, setTimeout() { return 0; }, clearTimeout() {}
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(appSource, context, { filename: 'app.js' });
  return context.window.MultiplyEngine;
}

// JavaScript and JSON validity.
new Function(appSource);
JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// Pure gameplay logic: tables 1-10, unique choices and mixed challenges.
const normal = boot({ difficulty: 'normal', planMode: 'distributed', planDays: 3 });
assert.strictEqual(normal.currentPassScore(), 80);
assert.strictEqual(normal.planGroups().length, 3);
assert.deepStrictEqual(Array.from(normal.planGroups()[0]), [1,2,3,4]);
const practice = normal.buildQuestionSet('practice', 10, 10, () => 0.37);
assert.strictEqual(practice.length, 10);
assert(practice.every(q => q.a === 10 && q.b >= 1 && q.b <= 10));
for (const q of practice) {
  assert.strictEqual(q.correct, q.a * q.b);
  assert.strictEqual(q.choices.length, 4);
  assert.strictEqual(new Set(q.choices).size, 4);
  assert(q.choices.includes(q.correct));
}
const challenge = normal.buildQuestionSet('challenge', 5, 12, () => 0.41);
assert.strictEqual(challenge.length, 12);
assert(challenge.every(q => q.a >= 1 && q.a <= 5 && q.b >= 1 && q.b <= 10));

const calm = boot({ difficulty: 'tranquilo', planMode: 'all', planDays: 10 });
assert.strictEqual(calm.currentPassScore(), 70);
assert.strictEqual(calm.planGroups().length, 1);
assert.strictEqual(calm.planGroups()[0].length, 10);
const expert = boot({ difficulty: 'experto', planMode: 'distributed', planDays: 10 });
assert.strictEqual(expert.currentPassScore(), 90);
assert.strictEqual(expert.planGroups().length, 10);
assert(expert.planGroups().every(group => group.length === 1));

// Regression and cumulative-feature checks.
assert(html.includes('data-action="settings"') && html.includes('<span>Ajustes</span>'));
assert(html.includes('Todo de una vez') && html.includes('Distribuir por días'));
assert((html.match(/<option value="(?:[2-9]|10)"/g) || []).length === 9);
assert(!appSource.includes('onclick="event.stopPropagation()"'));
assert(appSource.includes("ANSWER_LETTERS = ['A', 'B', 'C', 'D']"));
assert(appSource.includes('class="answer-letter"') && appSource.includes('class="answer-btn"'));
assert(appSource.includes('Número que repetimos') && appSource.includes('Cantidad de veces'));
assert(appSource.includes('Resultado de cada operación'));
assert(appSource.includes("tranquilo: 70, normal: 80, experto: 90"));
assert(appSource.includes("answerMode: 'multiple'") && appSource.includes("'answer-manual'"));
assert(appSource.includes('launchFireworks(false)') && appSource.includes("playTone('good')"));
assert(appSource.includes("'toggle-dark-mode'") && appSource.includes('state.darkMode'));
assert(css.includes(':root[data-theme="dark"]') && css.includes('.firework-particle'));
assert(css.includes('.answer-option { display:grid; grid-template-columns:38px 1fr'));

console.log('OK: 36 cumulative logic, configuration and regression assertions passed.');
