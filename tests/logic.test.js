const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function element() {
  return {
    textContent: '', innerHTML: '', hidden: false, style: {}, classList: { toggle() {}, add() {} },
    focus() {}, appendChild() {}, setAttribute() {}, querySelector() { return element(); }
  };
}

const elements = new Map();
const document = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {}
};
const saved = JSON.stringify({ version: 1, playerName: 'Test', levels: {}, factStats: {}, lastVisit: '' });
const localStorage = { getItem: () => saved, setItem() {}, removeItem() {} };
const sandbox = {
  window: {}, document, localStorage, navigator: {}, location: { protocol: 'file:' },
  console, Date, Math, JSON, Object, Array, String, Number, Set, Map,
  setTimeout: () => 0, clearTimeout() {}
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8'), sandbox);

const engine = sandbox.MultiplyEngine;
assert(engine, 'El motor debe exponerse para pruebas');
assert.strictEqual(engine.PASS_SCORE, 80, 'El umbral de aprobación debe ser 80%');

for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    const q = engine.makeQuestion(a, b, Math.random);
    assert.strictEqual(q.correct, a * b);
    assert.strictEqual(q.choices.length, 4, 'Cada pregunta debe tener cuatro opciones');
    assert.strictEqual(new Set(q.choices).size, 4, 'Las opciones no deben repetirse');
    assert(q.choices.includes(q.correct), 'La respuesta correcta debe estar entre las opciones');
    assert(q.choices.every(n => n > 0 && n <= 100), 'Las opciones deben estar entre 1 y 100');
  }
}

const practice = engine.buildQuestionSet('practice', 7, 10, Math.random);
assert.strictEqual(practice.length, 10);
assert(practice.every(q => q.a === 7), 'La práctica individual solo debe usar la tabla actual');
assert.deepStrictEqual([...practice.map(q => q.b)].sort((a,b) => a-b), [1,2,3,4,5,6,7,8,9,10]);

const challenge = engine.buildQuestionSet('challenge', 6, 12, Math.random);
assert.strictEqual(challenge.length, 12);
assert(challenge.filter(q => q.a === 6).length >= 7, 'El desafío debe priorizar la tabla nueva');
assert(challenge.some(q => q.a < 6), 'El desafío debe mezclar tablas anteriores');
assert(challenge.every(q => q.a <= 6), 'No debe incluir tablas aún no aprendidas');

const state = engine.defaultState();
assert.strictEqual(state.unlocked, 1);
assert.strictEqual(Object.keys(state.levels).length, 10);
assert(Object.values(state.levels).every(l => !l.completed));

console.log('✓ 100 operaciones generan preguntas válidas');
console.log('✓ Práctica individual: tabla actual completa');
console.log('✓ Desafío combinado: tabla nueva + anteriores');
console.log('✓ Progresión inicial y umbral de dominio correctos');
