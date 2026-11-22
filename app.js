(() => {
  'use strict';

  const STORAGE_KEY = 'multiplicaAventura.v1';
  const PASS_SCORE = 80;
  const TABLES = 10;
  const PRACTICE_LENGTH = 10;
  const CHALLENGE_LENGTH = 12;
  const REVIEW_LENGTH = 10;
  const DAY_MS = 86400000;

  const defaultState = () => ({
    version: 1,
    playerName: '',
    xp: 0,
    stars: 0,
    dailyStreak: 1,
    bestAnswerStreak: 0,
    lastVisit: '',
    sessionsToday: 0,
    sessionDate: localDateKey(),
    sound: true,
    unlocked: 1,
    levels: Object.fromEntries(Array.from({ length: TABLES }, (_, i) => [i + 1, {
      learned: false,
      lessonStep: 0,
      practiceBest: 0,
      challengeBest: 0,
      completed: false
    }])),
    factStats: {},
    badges: [],
    totalCorrect: 0,
    totalAnswers: 0
  });

  let state = loadState();
  let view = 'home';
  let lesson = null;
  let quiz = null;
  let audioContext = null;

  const main = document.getElementById('main');
  const modalRoot = document.getElementById('modal-root');

  function localDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.version !== 1) return defaultState();
      const base = defaultState();
      return {
        ...base,
        ...saved,
        levels: Object.fromEntries(Array.from({ length: TABLES }, (_, i) => {
          const n = i + 1;
          return [n, { ...base.levels[n], ...(saved.levels?.[n] || {}) }];
        })),
        factStats: saved.factStats || {}
      };
    } catch (_) {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateTopbar();
  }

  function updateVisitStreak() {
    const today = localDateKey();
    if (state.sessionDate !== today) {
      state.sessionsToday = 0;
      state.sessionDate = today;
    }
    if (!state.lastVisit) {
      state.lastVisit = today;
    } else if (state.lastVisit !== today) {
      const previous = new Date(`${state.lastVisit}T12:00:00`);
      const current = new Date(`${today}T12:00:00`);
      const days = Math.round((current - previous) / DAY_MS);
      state.dailyStreak = days === 1 ? state.dailyStreak + 1 : 1;
      state.lastVisit = today;
    }
    saveState();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function levelState(n) {
    return state.levels[n];
  }

  function updateTopbar() {
    document.getElementById('daily-streak').textContent = state.dailyStreak;
    document.getElementById('stars').textContent = state.stars;
    document.getElementById('xp').textContent = state.xp;
    const due = getReviewFacts().length;
    document.getElementById('review-dot').hidden = due === 0;
  }

  function setActiveNav(name) {
    document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.action === name));
  }

  function completedCount() {
    return Object.values(state.levels).filter(l => l.completed).length;
  }

  function todayTarget() {
    const count = completedCount();
    if (count < 3) return { day: 1, tables: '1, 2 y 3', target: 3 };
    if (count < 7) return { day: 2, tables: '4, 5, 6 y 7', target: 7 };
    return { day: 3, tables: '8, 9 y 10', target: 10 };
  }

  function renderHome() {
    view = 'home';
    setActiveNav('home');
    const done = completedCount();
    const goal = Math.min(3, state.sessionsToday);
    const target = todayTarget();
    const nextLevel = Math.min(TABLES, state.unlocked);
    const levels = Array.from({ length: TABLES }, (_, i) => {
      const n = i + 1;
      const l = levelState(n);
      const isLocked = n > state.unlocked;
      const statusClass = l.completed ? 'done' : isLocked ? 'locked' : n === nextLevel ? 'current' : '';
      const icon = l.completed ? '✓' : isLocked ? '🔒' : n;
      const subtitle = l.completed ? `Dominada · Mejor ${l.challengeBest}%` : isLocked ? 'Completá el nivel anterior' : stageSubtitle(n);
      const meta = l.completed ? '<strong>⭐⭐⭐</strong><small>completo</small>' : isLocked ? '<strong>—</strong><small>bloqueado</small>' : `<strong>${levelProgress(n)}%</strong><small>progreso</small>`;
      return `<button class="level-card ${statusClass}" data-action="open-level" data-level="${n}" ${isLocked ? 'disabled' : ''} aria-label="Tabla del ${n}: ${subtitle}">
        <span class="level-orb">${icon}</span>
        <span class="level-info"><h3>Nivel ${n} · Tabla del ${n}</h3><p>${subtitle}</p></span>
        <span class="level-meta">${meta}</span>
      </button>`;
    }).join('');

    main.innerHTML = `
      <section class="hero">
        <div class="hero-row">
          <div><p class="eyebrow">DÍA ${target.day} DE 3</p><h1>¡Hola, ${escapeHtml(state.playerName || 'campeón')}!</h1><p>${done === TABLES ? '¡Dominaste todos los mundos! Seguí repasando para que no se escape ninguna tabla.' : `Tu misión de hoy: conquistar las tablas ${target.tables}.`}</p></div>
          <div class="goal-ring" style="--progress:${goal * 120}deg"><div class="goal-ring-inner"><strong>${goal}/3</strong><small>SESIONES</small></div></div>
        </div>
      </section>
      <section class="daily-card">
        <span class="daily-icon" aria-hidden="true">🎯</span>
        <div><h3>Meta diaria: 3 sesiones cortas</h3><p>${goal < 3 ? `Faltan ${3 - goal}. Descansá entre cada una.` : '¡Meta cumplida! Tu cerebro hizo un gran trabajo.'}</p></div>
        <div class="mini-progress" aria-label="${goal} de 3 sesiones"><span style="width:${goal / 3 * 100}%"></span></div>
      </section>
      <div class="section-head"><div><h2>Tu mapa de aventura</h2><p>Aprendé → practicá → superá el desafío</p></div><button class="link-btn" data-action="plan">Ver plan</button></div>
      <section class="level-map" aria-label="Niveles de las tablas">${levels}</section>`;
    main.focus({ preventScroll: true });
  }

  function stageSubtitle(n) {
    const l = levelState(n);
    if (!l.learned) return 'Primero descubrimos cómo funciona';
    if (l.practiceBest < PASS_SCORE) return 'Práctica solo esta tabla';
    return 'Desafío mezclado con tablas anteriores';
  }

  function levelProgress(n) {
    const l = levelState(n);
    if (l.completed) return 100;
    return Math.round((l.learned ? 25 : (l.lessonStep / 10) * 25) + Math.min(35, l.practiceBest * .35) + Math.min(40, l.challengeBest * .4));
  }

  function openLevel(n) {
    const l = levelState(n);
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="level-title" onclick="event.stopPropagation()">
        <div class="mascot"><span>${n}</span></div>
        <p class="eyebrow">NIVEL ${n}</p><h2 id="level-title">Tabla del ${n}</h2>
        <p>Para dominarla, completá las tres etapas en orden.</p>
        <div class="stage-list">
          ${stageItem('👀', '1. Descubrir', 'Mirá patrones y entendé cada cuenta.', l.learned, !l.learned, 'start-learn', n)}
          ${stageItem('🎯', '2. Practicar', '10 ejercicios solo de esta tabla · mínimo 80%.', l.practiceBest >= PASS_SCORE, l.learned && l.practiceBest < PASS_SCORE, 'start-practice', n, l.practiceBest)}
          ${stageItem('🧠', '3. Desafío mixto', `12 ejercicios con tablas del 1 al ${n} · mínimo 80%.`, l.completed, l.practiceBest >= PASS_SCORE && !l.completed, 'start-challenge', n, l.challengeBest)}
        </div>
        ${l.completed ? `<button class="primary-btn full" data-action="start-challenge" data-level="${n}">Volver a jugar</button>` : ''}
        <button class="link-btn" data-action="close-modal" style="margin-top:16px">Cerrar</button>
      </section></div>`;
  }

  function stageItem(icon, title, description, complete, active, action, n, best = null) {
    const right = complete ? '<span class="check">✓</span>' : active ? '<span aria-hidden="true">›</span>' : '<span aria-hidden="true">🔒</span>';
    return `<button class="stage-item" data-action="${action}" data-level="${n}" ${!active && !complete ? 'disabled' : ''}>
      <span class="stage-icon">${icon}</span><span><h3>${title}</h3><p>${description}${best ? ` · Récord ${best}%` : ''}</p></span>${right}
    </button>`;
  }

  function startLesson(n) {
    modalRoot.innerHTML = '';
    const savedStep = Math.min(levelState(n).lessonStep || 0, 9);
    lesson = { table: n, step: savedStep };
    renderLesson();
  }

  function renderLesson() {
    const { table, step } = lesson;
    const factor = step + 1;
    const result = table * factor;
    view = 'lesson';
    setActiveNav('');
    main.innerHTML = `
      <div class="screen-head"><button class="icon-btn" data-action="exit-lesson" aria-label="Salir">✕</button><div><h1>Descubrí la tabla del ${table}</h1><p>Paso ${step + 1} de 10</p></div></div>
      <section class="lesson-card">
        <div class="mascot"><span>${table}</span></div>
        <p class="eyebrow">SUMAR ${table}, ${factor} ${factor === 1 ? 'VEZ' : 'VECES'}</p>
        <div class="fact-big">${table} × ${factor} = <span class="fact-result">${result}</span></div>
        <div class="number-groups">${Array.from({ length: factor }, () => `<span class="number-group">${table}</span>`).join('<span aria-hidden="true">+</span>')}</div>
        <h2>${lessonTip(table, factor)}</h2><p>${table} multiplicado por ${factor} es lo mismo que sumar ${table} ${factor} ${factor === 1 ? 'vez' : 'veces'}.</p>
        <div class="lesson-actions">
          <button class="secondary-btn" data-action="lesson-back" ${step === 0 ? 'disabled' : ''}>← Anterior</button>
          <button class="primary-btn" data-action="lesson-next">${step === 9 ? '¡Listo para practicar!' : 'Entendido →'}</button>
        </div>
      </section>`;
    main.focus({ preventScroll: true });
  }

  function lessonTip(table, factor) {
    if (table === 1) return '¡Todo número queda igual!';
    if (factor === 1) return `Una sola vez ${table} es ${table}`;
    if (factor === 2) return `Es el doble de ${table}`;
    if (factor === 5) return 'El resultado termina en 0 o 5';
    if (factor === 10) return 'Solo agregá un cero';
    if (table === 2) return 'Contá de 2 en 2';
    if (table === 5) return 'Contá de 5 en 5';
    if (table === 9) return 'Los dígitos del resultado suman 9';
    return `¡Llegaste a ${resultWord(table * factor)}!`;
  }

  function resultWord(n) {
    const words = { 6:'seis', 8:'ocho', 12:'doce', 15:'quince', 16:'dieciséis', 18:'dieciocho', 20:'veinte', 21:'veintiuno', 24:'veinticuatro', 25:'veinticinco', 27:'veintisiete', 30:'treinta', 32:'treinta y dos', 35:'treinta y cinco', 36:'treinta y seis', 40:'cuarenta', 42:'cuarenta y dos', 45:'cuarenta y cinco', 48:'cuarenta y ocho', 49:'cuarenta y nueve', 50:'cincuenta', 54:'cincuenta y cuatro', 56:'cincuenta y seis', 60:'sesenta', 63:'sesenta y tres', 64:'sesenta y cuatro', 70:'setenta', 72:'setenta y dos', 80:'ochenta', 81:'ochenta y uno', 90:'noventa', 100:'cien' };
    return words[n] || n;
  }

  function completeLessonStep(direction) {
    if (direction === 'back') {
      lesson.step = Math.max(0, lesson.step - 1);
      renderLesson();
      return;
    }
    const l = levelState(lesson.table);
    l.lessonStep = Math.max(l.lessonStep, lesson.step + 1);
    if (lesson.step < 9) {
      lesson.step++;
      saveState();
      renderLesson();
    } else {
      l.learned = true;
      state.xp += 10;
      saveState();
      showToast('📖 ¡Lección completa! +10 XP');
      startQuiz('practice', lesson.table);
    }
  }

  function startQuiz(mode, table) {
    modalRoot.innerHTML = '';
    const count = mode === 'practice' ? PRACTICE_LENGTH : mode === 'challenge' ? CHALLENGE_LENGTH : REVIEW_LENGTH;
    quiz = { mode, table, questions: buildQuestionSet(mode, table, count), index: 0, correct: 0, answerStreak: 0, bestStreak: 0, answered: false, mistakes: [] };
    view = 'quiz';
    setActiveNav(mode === 'review' ? 'review' : '');
    renderQuiz();
  }

  function buildQuestionSet(mode, table, count, random = Math.random) {
    const questions = [];
    if (mode === 'practice') {
      const factors = shuffle(Array.from({ length: 10 }, (_, i) => i + 1), random);
      for (let i = 0; i < count; i++) questions.push(makeQuestion(table, factors[i % 10], random));
    } else if (mode === 'challenge') {
      const currentCount = Math.ceil(count * .58);
      const currentFactors = shuffle(Array.from({ length: 10 }, (_, i) => i + 1), random);
      for (let i = 0; i < currentCount; i++) questions.push(makeQuestion(table, currentFactors[i % 10], random));
      for (let i = currentCount; i < count; i++) {
        const weak = pickWeakFact(table, random, table - 1);
        const t = weak ? weak[0] : 1 + Math.floor(random() * Math.max(1, table - 1));
        const f = weak ? weak[1] : 1 + Math.floor(random() * 10);
        questions.push(makeQuestion(t, f, random));
      }
      return shuffle(questions, random);
    } else {
      const facts = getReviewFacts();
      const pool = facts.length ? facts : allUnlockedFacts();
      for (let i = 0; i < count; i++) {
        const fact = pool[i % pool.length] || [1, i % 10 + 1];
        questions.push(makeQuestion(fact[0], fact[1], random));
      }
      return shuffle(questions, random);
    }
    return questions;
  }

  function shuffle(array, random = Math.random) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function makeQuestion(a, b, random = Math.random) {
    const correct = a * b;
    const choices = new Set([correct]);
    const candidates = [correct + a, correct - a, correct + b, correct - b, correct + 1, correct - 1, correct + 10, correct - 10, a * Math.max(1, b - 2), a * Math.min(10, b + 2)];
    shuffle(candidates, random).forEach(value => { if (value > 0 && value <= 100 && choices.size < 4) choices.add(value); });
    while (choices.size < 4) choices.add(1 + Math.floor(random() * 100));
    return { a, b, correct, choices: shuffle([...choices], random) };
  }

  function renderQuiz() {
    const q = quiz.questions[quiz.index];
    const total = quiz.questions.length;
    const progress = (quiz.index / total) * 100;
    main.innerHTML = `<section class="quiz-shell">
      <div class="quiz-top">
        <button class="icon-btn" data-action="exit-quiz" aria-label="Salir del ejercicio">✕</button>
        <div class="stage-progress" aria-label="Progreso ${quiz.index} de ${total}"><span style="width:${progress}%"></span></div>
        <div class="quiz-status"><span title="Racha de respuestas">🔥 ${quiz.answerStreak}</span><span title="Aciertos">✅ ${quiz.correct}</span></div>
      </div>
      <div class="quiz-body">
        <p class="prompt-label">${quiz.mode === 'practice' ? `Practicá la tabla del ${quiz.table}` : quiz.mode === 'challenge' ? 'Desafío: ¡ahora están mezcladas!' : 'Repaso inteligente'}</p>
        <div class="question">${q.a} × ${q.b} = <span class="question-mark">?</span></div>
        <div class="answers">${q.choices.map((answer, i) => `<button class="answer-btn" data-action="answer" data-value="${answer}" aria-label="Respuesta ${answer}"><small>${i + 1}</small>&nbsp; ${answer}</button>`).join('')}</div>
        <div id="feedback-slot"></div>
      </div>
    </section>`;
    main.focus({ preventScroll: true });
  }

  function answerQuestion(value) {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.questions[quiz.index];
    const correct = Number(value) === q.correct;
    const buttons = [...document.querySelectorAll('.answer-btn')];
    buttons.forEach(button => {
      button.disabled = true;
      const v = Number(button.dataset.value);
      if (v === q.correct) button.classList.add('correct');
      else if (v === Number(value)) button.classList.add('wrong');
    });
    state.totalAnswers++;
    if (correct) {
      quiz.correct++;
      quiz.answerStreak++;
      quiz.bestStreak = Math.max(quiz.bestStreak, quiz.answerStreak);
      state.bestAnswerStreak = Math.max(state.bestAnswerStreak, quiz.answerStreak);
      state.totalCorrect++;
      state.xp += 2 + Math.min(3, Math.floor(quiz.answerStreak / 3));
      updateFact(q.a, q.b, true);
      playTone('good');
    } else {
      quiz.answerStreak = 0;
      quiz.mistakes.push(q);
      updateFact(q.a, q.b, false);
      playTone('bad');
    }
    saveState();
    const feedback = document.getElementById('feedback-slot');
    feedback.innerHTML = `<div class="feedback ${correct ? 'good' : 'bad'}"><div><h3>${correct ? praise() : 'Casi, ¡seguimos!'}</h3><p>${correct ? `${q.a} × ${q.b} = ${q.correct}` : `La respuesta es ${q.correct}. Pensá: ${Array.from({length:q.b},()=>q.a).join(' + ')}.`}</p></div><button class="primary-btn" data-action="next-question">Continuar</button></div>`;
    feedback.querySelector('button').focus();
  }

  function praise() {
    const words = ['¡Excelente!', '¡Genial!', '¡Imparable!', '¡Muy bien!', '¡Súper!', '¡Lo tenés!'];
    return words[Math.floor(Math.random() * words.length)];
  }

  function nextQuestion() {
    if (quiz.index < quiz.questions.length - 1) {
      quiz.index++;
      quiz.answered = false;
      renderQuiz();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const score = Math.round(quiz.correct / quiz.questions.length * 100);
    const passed = quiz.mode === 'review' || score >= PASS_SCORE;
    const earnedStars = quiz.mode === 'review' ? (score >= 80 ? 1 : 0) : passed ? (score === 100 ? 3 : score >= 90 ? 2 : 1) : 0;
    const table = quiz.table;
    if (quiz.mode === 'practice') {
      state.levels[table].practiceBest = Math.max(state.levels[table].practiceBest, score);
    } else if (quiz.mode === 'challenge') {
      state.levels[table].challengeBest = Math.max(state.levels[table].challengeBest, score);
      if (passed) {
        state.levels[table].completed = true;
        state.unlocked = Math.min(TABLES, Math.max(state.unlocked, table + 1));
      }
    }
    state.stars += earnedStars;
    state.sessionsToday = Math.min(3, state.sessionsToday + 1);
    unlockBadges();
    saveState();
    if (passed && quiz.mode !== 'review') launchConfetti();
    playTone(passed ? 'win' : 'bad');
    renderResults(score, passed, earnedStars);
  }

  function renderResults(score, passed, earnedStars) {
    view = 'result';
    setActiveNav(quiz.mode === 'review' ? 'review' : '');
    const mode = quiz.mode;
    let title;
    if (mode === 'review') title = score >= 80 ? '¡Repaso completado!' : '¡Tu memoria se está entrenando!';
    else title = passed ? (mode === 'challenge' ? '¡Nivel superado!' : '¡Práctica aprobada!') : '¡Una vuelta más!';
    const message = mode === 'review'
      ? 'Cada repaso hace que las respuestas aparezcan más rápido.'
      : passed
        ? (mode === 'practice' ? 'Ahora podés probar el desafío con tablas mezcladas.' : quiz.table === TABLES ? '¡Dominaste las 10 tablas! Sos una leyenda de la multiplicación.' : `Desbloqueaste la tabla del ${quiz.table + 1}.`)
        : `Necesitás ${PASS_SCORE}%. Repasaremos tus errores para que el próximo intento sea mejor.`;
    main.innerHTML = `<section class="result-card">
      <div class="result-emoji" aria-hidden="true">${passed ? (score === 100 ? '👑' : '🎉') : '💪'}</div>
      <p class="eyebrow">${mode === 'review' ? 'REPASO' : `TABLA DEL ${quiz.table}`}</p><h1>${title}</h1><p>${message}</p>
      <div class="score-circle" style="--score:${score * 3.6}deg"><div class="score-inner"><div><strong>${score}%</strong><small>${quiz.correct} DE ${quiz.questions.length}</small></div></div></div>
      <div class="result-stats">
        <div class="result-stat"><strong>+${earnedStars} ⭐</strong><small>estrellas</small></div>
        <div class="result-stat"><strong>${quiz.bestStreak} 🔥</strong><small>mejor racha</small></div>
        <div class="result-stat"><strong>${quiz.mistakes.length}</strong><small>para repasar</small></div>
      </div>
      ${resultActions(score, passed)}
    </section>`;
  }

  function resultActions(score, passed) {
    if (quiz.mode === 'review') return '<button class="primary-btn full" data-action="home">Volver al mapa</button>';
    if (!passed) return `<button class="primary-btn full" data-action="retry-quiz">Practicar errores</button><button class="link-btn" data-action="home" style="margin-top:18px">Volver al mapa</button>`;
    if (quiz.mode === 'practice') return `<button class="primary-btn full" data-action="start-challenge" data-level="${quiz.table}">Ir al desafío mixto</button><button class="link-btn" data-action="home" style="margin-top:18px">Hacer una pausa</button>`;
    return `<button class="primary-btn full" data-action="home">${quiz.table === TABLES ? 'Ver mi mapa completo' : 'Descubrir el próximo nivel'}</button>`;
  }

  function retryQuiz() {
    const errors = quiz.mistakes.length ? quiz.mistakes : quiz.questions;
    const mode = quiz.mode;
    const table = quiz.table;
    quiz = { mode, table, questions: shuffle([...errors, ...errors]).slice(0, Math.max(6, errors.length)), index: 0, correct: 0, answerStreak: 0, bestStreak: 0, answered: false, mistakes: [] };
    renderQuiz();
  }

  function factKey(a, b) { return `${a}x${b}`; }

  function updateFact(a, b, correct) {
    const key = factKey(a, b);
    const old = state.factStats[key] || { correct: 0, wrong: 0, streak: 0, interval: 0, due: 0 };
    if (correct) {
      old.correct++;
      old.streak++;
      const intervals = [5 * 60000, 4 * 3600000, 12 * 3600000, DAY_MS, 3 * DAY_MS, 7 * DAY_MS];
      old.interval = Math.min(intervals.length - 1, old.streak - 1);
      old.due = Date.now() + intervals[old.interval];
    } else {
      old.wrong++;
      old.streak = 0;
      old.interval = 0;
      old.due = Date.now();
    }
    state.factStats[key] = old;
  }

  function parseFactKey(key) { return key.split('x').map(Number); }

  function getReviewFacts(now = Date.now()) {
    const due = Object.entries(state.factStats)
      .filter(([, s]) => s.due <= now || s.wrong > s.correct)
      .sort((a, b) => (b[1].wrong - b[1].correct) - (a[1].wrong - a[1].correct) || a[1].due - b[1].due)
      .map(([key]) => parseFactKey(key));
    return due;
  }

  function allUnlockedFacts() {
    const max = Math.max(1, state.unlocked - (state.levels[state.unlocked]?.completed ? 0 : 1));
    return Array.from({ length: max }, (_, a) => Array.from({ length: 10 }, (_, b) => [a + 1, b + 1])).flat();
  }

  function pickWeakFact(maxTable, random = Math.random, restrictMax = maxTable) {
    const weak = Object.entries(state.factStats)
      .map(([key, stats]) => ({ fact: parseFactKey(key), weight: stats.wrong * 2 - stats.correct + (stats.due <= Date.now() ? 2 : 0) }))
      .filter(item => item.fact[0] <= restrictMax && item.weight > 0)
      .sort((a, b) => b.weight - a.weight);
    if (!weak.length) return null;
    return weak[Math.floor(random() * Math.min(4, weak.length))].fact;
  }

  function renderReview() {
    view = 'review';
    setActiveNav('review');
    const facts = getReviewFacts();
    const fallback = allUnlockedFacts().slice(0, 5);
    const list = (facts.length ? facts : fallback).slice(0, 8);
    const masteredTables = completedCount();
    main.innerHTML = `<div class="screen-head"><div><h1>🧠 Gimnasio de memoria</h1><p>Repasos cortos justo cuando tu cerebro los necesita.</p></div></div>
      <section class="panel">
        ${masteredTables === 0 ? `<div class="empty-state"><div>🌱</div><h2>Primero, aprendé la tabla del 1</h2><p>Después de practicarla aparecerán acá las cuentas para reforzar.</p><button class="primary-btn" data-action="home">Ir al mapa</button></div>` : `
          <h2>${facts.length ? `${facts.length} ${facts.length === 1 ? 'cuenta lista' : 'cuentas listas'} para repasar` : '¡Tu memoria está al día!'}</h2>
          <p class="subtle">Priorizamos las cuentas que costaron y las que están por olvidarse.</p>
          <div class="review-list">${list.map(([a,b]) => { const s=state.factStats[factKey(a,b)]||{}; const accuracy=(s.correct||s.wrong)?Math.round((s.correct||0)/((s.correct||0)+(s.wrong||0))*100):0; return `<div class="review-fact"><span>${a} × ${b}</span><span class="mastery">${accuracy ? `${accuracy}% de aciertos` : 'Nueva'}</span></div>`; }).join('')}</div>
          <button class="primary-btn full" data-action="start-review">Entrenar 10 cuentas</button>`}
      </section>
      <section class="panel"><h3>¿Por qué funciona?</h3><p class="subtle">Una cuenta correcta vuelve más adelante. Si cuesta, regresa pronto. Así practicás más lo difícil sin repetir de más lo que ya sabés.</p></section>`;
  }

  function renderPlan() {
    view = 'plan';
    setActiveNav('plan');
    main.innerHTML = `<div class="screen-head"><div><h1>📅 Misión de 3 días</h1><p>Intensiva, pero en bloques cortos para cuidar la atención.</p></div></div>
      <div class="plan-grid">
        ${dayCard(1, 'Bases y confianza', 'Tablas fáciles para entender el patrón y ganar velocidad.', [1,2,3])}
        ${dayCard(2, 'Construir conexiones', 'Usamos dobles, mitades y las tablas ya aprendidas.', [4,5,6,7])}
        ${dayCard(3, 'El gran desafío', 'Patrones del 9 y 10, mezcla total y consolidación.', [8,9,10])}
      </div>
      <section class="panel" style="margin-top:16px"><h2>Ritmo recomendado por día</h2><div class="schedule">
        <span class="schedule-time">Mañana</span><p><strong>15–20 min · Aprender</strong><br><small>Nuevas tablas, sin apuro. Pausa de 5 min al terminar.</small></p>
        <span class="schedule-time">Tarde</span><p><strong>15–20 min · Practicar</strong><br><small>Desafíos individuales y mezclados.</small></p>
        <span class="schedule-time">Noche</span><p><strong>10 min · Recordar</strong><br><small>Repaso inteligente, idealmente sin ayuda.</small></p>
      </div></section>
      <section class="panel"><h3>Consejos para el adulto</h3><p class="subtle">Celebrá el esfuerzo, no solo el resultado. Si aparecen frustración o muchos errores seguidos, conviene una pausa. En tres días se puede lograr mucha práctica; para retener de verdad, continuá con repasos breves durante las semanas siguientes.</p></section>`;
  }

  function dayCard(day, title, text, tables) {
    const done = tables.filter(n => levelState(n).completed).length;
    return `<section class="day-card"><p class="eyebrow">DÍA ${day} · ${done}/${tables.length} COMPLETADAS</p><h2>${title}</h2><p>${text}</p><div class="day-tables">${tables.map(n => `<span>${levelState(n).completed ? '✓ ' : ''}Tabla ${n}</span>`).join('')}</div></section>`;
  }

  const badgeDefs = [
    { id:'first', icon:'🌟', title:'Primera estrella', text:'Superá tu primer nivel.', test:() => completedCount() >= 1 },
    { id:'streak5', icon:'🔥', title:'En llamas', text:'Lográ 5 aciertos seguidos.', test:() => state.bestAnswerStreak >= 5 },
    { id:'perfect', icon:'💯', title:'Sin errores', text:'Conseguí 100% en un desafío.', test:() => Object.values(state.levels).some(l => l.challengeBest === 100) },
    { id:'half', icon:'🚀', title:'Mitad del viaje', text:'Dominá 5 tablas.', test:() => completedCount() >= 5 },
    { id:'hundred', icon:'⚡', title:'Cerebro veloz', text:'Respondé 100 cuentas.', test:() => state.totalAnswers >= 100 },
    { id:'master', icon:'👑', title:'Maestro ×10', text:'Dominá todas las tablas.', test:() => completedCount() === 10 }
  ];

  function unlockBadges() {
    for (const badge of badgeDefs) {
      if (badge.test() && !state.badges.includes(badge.id)) {
        state.badges.push(badge.id);
        showToast(`${badge.icon} ¡Nueva insignia: ${badge.title}!`);
      }
    }
  }

  function renderRewards() {
    view = 'rewards';
    setActiveNav('rewards');
    const accuracy = state.totalAnswers ? Math.round(state.totalCorrect / state.totalAnswers * 100) : 0;
    main.innerHTML = `<div class="screen-head"><div><h1>🏆 Sala de premios</h1><p>Todo lo que lograste con práctica y constancia.</p></div></div>
      <section class="panel reward-summary"><div class="big">👑</div><div><p class="eyebrow">AVENTURERO NIVEL ${completedCount() + 1}</p><h2>${escapeHtml(state.playerName || 'Jugador')}</h2><p class="subtle">${state.xp} XP · ${state.stars} estrellas · ${accuracy}% de aciertos</p></div></section>
      <div class="section-head"><div><h2>Insignias</h2><p>${state.badges.length} de ${badgeDefs.length} desbloqueadas</p></div></div>
      <section class="badge-grid">${badgeDefs.map(b => `<article class="badge ${state.badges.includes(b.id) ? '' : 'locked-badge'}"><div class="badge-icon">${b.icon}</div><h3>${b.title}</h3><p>${b.text}</p></article>`).join('')}</section>
      <div class="section-head"><div><h2>Ajustes</h2></div></div>
      <section class="panel">
        <div class="settings-row"><span><strong>Sonidos</strong><br><small class="subtle">Efectos al responder</small></span><button class="toggle ${state.sound ? 'on' : ''}" data-action="toggle-sound" role="switch" aria-checked="${state.sound}"><span></span></button></div>
        <div class="settings-row"><span><strong>Reiniciar aventura</strong><br><small class="subtle">Borra el progreso de este dispositivo</small></span><button class="danger-btn" data-action="confirm-reset">Reiniciar</button></div>
      </section>`;
  }

  function confirmReset() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true"><div style="font-size:3rem">🧹</div><h2>¿Reiniciar todo?</h2><p>Se borrarán niveles, puntos, premios y progreso. Esta acción no se puede deshacer.</p><button class="danger-btn full" data-action="reset-game">Sí, empezar de cero</button><button class="link-btn" data-action="close-modal" style="margin-top:16px">Cancelar</button></section></div>`;
  }

  function showWelcome() {
    const template = document.getElementById('welcome-template');
    modalRoot.appendChild(template.content.cloneNode(true));
    setTimeout(() => document.getElementById('player-name')?.focus(), 50);
  }

  function startGame() {
    const input = document.getElementById('player-name');
    const name = input.value.trim();
    if (!name) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      showToast('Escribí el nombre del jugador');
      return;
    }
    state.playerName = name.slice(0, 16);
    saveState();
    modalRoot.innerHTML = '';
    launchConfetti();
    renderHome();
  }

  function exitActivity() {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true"><div style="font-size:3rem">🤔</div><h2>¿Salir por ahora?</h2><p>El progreso de una práctica se guarda al terminarla.</p><button class="primary-btn full" data-action="home">Salir al mapa</button><button class="link-btn" data-action="close-modal" style="margin-top:16px">Seguir jugando</button></section></div>`;
  }

  function showToast(message) {
    const root = document.getElementById('toast-root');
    root.innerHTML = `<div class="toast">${message}</div>`;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { root.innerHTML = ''; }, 2800);
  }

  function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.getElementById('confetti');
    const colors = ['#6c4cff','#30c97b','#ffc83d','#ff5e71','#37a9ff'];
    root.innerHTML = Array.from({ length: 55 }, (_, i) => `<i class="confetti-piece" style="left:${Math.random()*100}%;background:${colors[i%colors.length]};--drift:${(Math.random()-.5)*180}px;animation-delay:${Math.random()*.35}s"></i>`).join('');
    setTimeout(() => { root.innerHTML = ''; }, 2300);
  }

  function playTone(type) {
    if (!state.sound) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = type === 'good' ? [440, 554] : type === 'win' ? [392, 523, 659] : [220, 180];
      frequencies.forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.type = type === 'bad' ? 'triangle' : 'sine';
        oscillator.frequency.value = frequency;
        const start = audioContext.currentTime + i * .1;
        gain.gain.setValueAtTime(.001, start);
        gain.gain.exponentialRampToValueAtTime(.12, start + .015);
        gain.gain.exponentialRampToValueAtTime(.001, start + .13);
        oscillator.start(start); oscillator.stop(start + .14);
      });
    } catch (_) { /* Audio is optional. */ }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const n = Number(button.dataset.level);
    const actions = {
      home: () => { modalRoot.innerHTML = ''; renderHome(); },
      review: renderReview,
      plan: renderPlan,
      rewards: renderRewards,
      'open-level': () => openLevel(n),
      'close-modal': () => { modalRoot.innerHTML = ''; },
      'start-game': startGame,
      'start-learn': () => startLesson(n),
      'start-practice': () => startQuiz('practice', n),
      'start-challenge': () => startQuiz('challenge', n),
      'start-review': () => startQuiz('review', Math.max(1, state.unlocked - 1)),
      'lesson-next': () => completeLessonStep('next'),
      'lesson-back': () => completeLessonStep('back'),
      'exit-lesson': exitActivity,
      'exit-quiz': exitActivity,
      answer: () => answerQuestion(button.dataset.value),
      'next-question': nextQuestion,
      'retry-quiz': retryQuiz,
      'toggle-sound': () => { state.sound = !state.sound; saveState(); renderRewards(); },
      'confirm-reset': confirmReset,
      'reset-game': () => { state = defaultState(); localStorage.removeItem(STORAGE_KEY); modalRoot.innerHTML = ''; renderHome(); showWelcome(); }
    };
    actions[action]?.();
  });

  document.addEventListener('keydown', event => {
    if (view === 'quiz' && !quiz?.answered && ['1','2','3','4'].includes(event.key)) {
      const button = document.querySelectorAll('.answer-btn')[Number(event.key) - 1];
      button?.click();
    } else if (view === 'quiz' && quiz?.answered && event.key === 'Enter') {
      document.querySelector('[data-action="next-question"]')?.click();
    } else if (event.key === 'Escape' && modalRoot.innerHTML) {
      modalRoot.innerHTML = '';
    } else if (event.key === 'Enter' && document.activeElement?.id === 'player-name') {
      startGame();
    }
  });

  // Small public surface used by automated tests; gameplay stays dependency-free.
  window.MultiplyEngine = { defaultState, makeQuestion, buildQuestionSet, shuffle, factKey, PASS_SCORE };

  updateVisitStreak();
  updateTopbar();
  renderHome();
  if (!state.playerName) showWelcome();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
