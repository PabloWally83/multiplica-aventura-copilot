const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function element() {
  return {
    innerHTML: '', textContent: '', hidden: false, classList: { toggle() {}, add() {}, remove() {} },
    focus() {}, appendChild() {}, addEventListener() {}, querySelector() { return null; },
    setAttribute() {}, closest() { return null; }
  };
}

const elements = new Map(['main','modal-root','daily-streak','stars','xp','review-dot','toast-root','confetti']
  .map(id => [id, element()]));
const saved = JSON.stringify({ version: 1, playerName: 'Test', planConfigured: true, planDays: 3, levels: {}, factStats: {} });
const sandbox = {
  console,
  Date,
  Math,
  setTimeout: () => 0,
  clearTimeout() {},
  localStorage: { getItem: () => saved, setItem() {}, removeItem() {} },
  document: {
    getElementById(id) { return elements.get(id) || element(); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {}
  },
  navigator: {},
  location: { protocol: 'file:' },
  window: {
    matchMedia: () => ({ matches: false }),
    addEventListener() {}
  }
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), sandbox);

const engine = sandbox.window.MultiplyEngine;
assert.ok(engine, 'The public test engine should be available');

const initial = engine.defaultState();
assert.equal(initial.planConfigured, false);
assert.equal(initial.planDays, 3);
assert.equal(initial.answerMode, 'choice');
assert.equal(initial.difficulty, 'normal');
assert.equal(Object.keys(initial.levels).length, 10);

assert.deepEqual(Array.from(engine.buildPlan(1), x => Array.from(x)), [[1,2,3,4,5,6,7,8,9,10]]);
assert.deepEqual(Array.from(engine.buildPlan(3), x => Array.from(x)), [[1,2,3,4],[5,6,7],[8,9,10]]);
assert.deepEqual(Array.from(engine.buildPlan(10), x => Array.from(x)), [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]]);

for (let i = 0; i < 100; i++) {
  const question = engine.makeQuestion((i % 10) + 1, ((i * 3) % 10) + 1);
  assert.equal(question.choices.length, 4);
  assert.equal(new Set(question.choices).size, 4);
  assert.ok(question.choices.includes(question.correct));
}

const practice = engine.buildQuestionSet('practice', 4, 10);
assert.equal(practice.length, 10);
assert.ok(practice.every(q => q.a === 4));
assert.deepEqual([...new Set(practice.map(q => q.b))].sort((a,b) => a-b), [1,2,3,4,5,6,7,8,9,10]);

const challenge = engine.buildQuestionSet('challenge', 5, 12);
assert.equal(challenge.length, 12);
assert.ok(challenge.every(q => q.a >= 1 && q.a <= 5 && q.b >= 1 && q.b <= 10));
assert.ok(challenge.filter(q => q.a === 5).length >= 7);

assert.equal(engine.DIFFICULTIES.calm.pass, 70);
assert.equal(engine.DIFFICULTIES.normal.pass, 80);
assert.equal(engine.DIFFICULTIES.expert.pass, 90);
console.log('All logic tests passed.');

const source = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
assert.match(html, /data-action="settings"/);
assert.match(source, /function renderAnswerReview\(/);
assert.match(source, /state\.answerMode === 'input'/);
assert.match(source, /function showPlanSetup\(/);
assert.match(source, /launchFireworks\('mini'\)/);
assert.match(source, /launchFireworks\('grand'\)/);
assert.doesNotMatch(source, /event\.stopPropagation|onclick=/);
assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, 'CSS braces should be balanced');
console.log('Feature contract checks passed.');
