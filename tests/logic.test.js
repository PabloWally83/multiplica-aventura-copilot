'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert.match(app, /const ANSWER_LABELS = \['A', 'B', 'C', 'D'\]/, 'Debe definir las etiquetas A–D.');
assert.match(app, /class="answer-option"/, 'Cada respuesta debe usar un contenedor para separar etiqueta y botón.');
assert.match(app, /class="answer-label"/, 'La etiqueta debe ser un elemento externo al botón.');
assert.match(app, /<span class="answer-label"[^>]*>\$\{label\}<\/span><button class="answer-btn"/, 'La etiqueta A–D debe quedar antes y fuera del botón.');
assert.doesNotMatch(app, /<button class="answer-btn"[^>]*><small>\$\{i \+ 1\}<\/small>/, 'No deben quedar números 1–4 dentro de los botones.');
assert.match(app, /ANSWER_LABELS\.includes\(answerKey\)/, 'Los atajos de teclado deben aceptar A–D.');
assert.match(css, /\.answer-option\s*\{[^}]*grid-template-columns:/s, 'El diseño debe reservar una columna externa para la etiqueta.');
assert.match(css, /\.answer-label\s*\{/, 'Debe existir un estilo visible para A–D.');
assert.match(sw, /multiplica-aventura-v2-options-abcd/, 'El service worker debe renovar el caché.');
assert.doesNotMatch(app, /onclick="event\.stopPropagation\(\)"/, 'Los controles del modal deben llegar al manejador global de clics.');
assert.match(app, /event\.target\.matches\('\[data-modal-backdrop\]'\)/, 'El modal debe cerrarse solo al pulsar el fondo.');

console.log('✓ Opciones A–D externas, accesibles y sin etiquetas numéricas internas.');
