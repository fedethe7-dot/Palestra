'use strict';
/* ============ TIMER ============
   Tutti i timer si basano sull'ORARIO DI FINE salvato nella bozza dell'allenamento:
   non perdono secondi se il telefono rallenta, se cambi schermata o se riapri l'app.
   - Recupero: parte da solo quando spunti una serie (db.draft.rest)
   - Timer a tempo (plank & co.): conto 3-2-1, poi conto alla rovescia (db.draft.work) */

const PRESET_SEC = [30, 45, 60, 90];
const vibra = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* Schermo acceso durante l'allenamento */
let wakeLock = null;
async function schermoAcceso(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}

/* ---------- Recupero ---------- */
function startRest(sec) {
  if (!db.draft) return;
  db.draft.rest = { endAt: Date.now() + Math.round(sec) * 1000, total: Math.round(sec) * 1000 };
  save(); tick();
}
function stopRest() {
  if (db.draft && db.draft.rest) { db.draft.rest = null; save(); }
  const el = $('#rest'); if (el) el.classList.remove('show');
}
function addRest(sec) {
  const r = db.draft?.rest; if (!r) return;
  r.endAt += sec * 1000; r.total += sec * 1000; save(); tick();
}
function drawRest() {
  let el = $('#rest');
  const r = db.draft?.rest;
  if (!r) { if (el) el.classList.remove('show'); return; }
  if (!el) { el = document.createElement('div'); el.id = 'rest'; document.body.appendChild(el); }
  const left = r.endAt - Date.now(), f = Math.max(0, Math.min(1, left / r.total));
  if (!el.classList.contains('show')) {
    el.innerHTML = `<svg class="rest-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" class="trk"/><circle cx="18" cy="18" r="15.5" class="prg" pathLength="100"/></svg>
      <div class="rest-txt"><small>Recupero</small><b data-rest-time></b></div>
      <button class="btn small" data-action="rest-add">+15″</button><button class="btn small" data-action="rest-skip">Salta</button>`;
    el.classList.add('show');
  }
  el.querySelector('[data-rest-time]').textContent = mmss(left);
  el.querySelector('.prg').style.strokeDashoffset = 100 - f * 100;
}

/* ---------- Timer a tempo ---------- */
function workDur(e) {
  const w = db.draft?.work;
  if (w && w.ex === db.draft.cur) return w.dur;
  const last = lastFor(e.nome);
  const prec = last?.ex.sets.at(-1)?.reps;
  return prec || (String(e.rip).match(/\d+/) || [45])[0] * 1;
}
function workSetIndex(e) { const i = e.sets.findIndex(s => !s.done); return i < 0 ? e.sets.length - 1 : i; }
function workStato() {
  const w = db.draft?.work;
  if (!w || w.ex !== db.draft.cur) return { state: 'idle' };
  return w;
}
function workSetDur(sec) {
  const w = workStato();
  if (w.state === 'run' || w.state === 'count') return;
  db.draft.work = { ex: db.draft.cur, dur: Math.max(5, Math.min(600, sec)), state: 'idle' };
  save(); render();
}
function workStart() {
  const e = db.draft.exercises[db.draft.cur], dur = workDur(e);
  stopRest();
  const countEnd = Date.now() + 3000;
  db.draft.work = { ex: db.draft.cur, dur, set: workSetIndex(e), state: 'count', countEnd, endAt: countEnd + dur * 1000 };
  save(); vibra(40); schermoAcceso(true); render();
}
function workPause() {
  const w = db.draft.work; if (!w) return;
  if (w.state === 'run') { w.left = w.endAt - Date.now(); w.state = 'pause'; }
  else if (w.state === 'count') { w.state = 'idle'; }
  save(); render();
}
function workResume() {
  const w = db.draft.work; if (!w || w.state !== 'pause') return;
  w.endAt = Date.now() + w.left; w.state = 'run'; save(); render();
}
function workReset() {
  const w = db.draft.work; if (!w) return;
  db.draft.work = { ex: w.ex, dur: w.dur, state: 'idle' }; save(); render();
}
/* Registra i secondi fatti nella serie e fa partire il recupero */
function workFine(secFatti) {
  const w = db.draft.work, e = db.draft.exercises[w.ex];
  const s = e.sets[w.set] || e.sets[workSetIndex(e)];
  if (s) { s.reps = String(Math.round(secFatti)); s.done = true; }
  db.draft.work = { ex: w.ex, dur: w.dur, state: 'idle' };
  save(); render();
  if (e.sets.some(x => !x.done)) startRest(restSec(e.recupero));
}
function workStop() {
  const w = db.draft.work; if (!w) return;
  const left = w.state === 'pause' ? w.left : w.state === 'run' ? w.endAt - Date.now() : w.dur * 1000;
  const fatti = w.dur - Math.max(0, left) / 1000;
  if (fatti < 1) return workReset();
  workFine(fatti);
}
function drawWork() {
  const box = $('#work'); if (!box) return;
  const w = workStato(), now = Date.now();
  const ring = box.querySelector('.wprg'), big = box.querySelector('[data-work-time]'), lbl = box.querySelector('[data-work-label]');
  let f = 1, txt = '', label = '';
  if (w.state === 'count') {
    const n = Math.ceil((w.countEnd - now) / 1000);
    if (n <= 0) { w.state = 'run'; save(); vibra(120); render(); return; }
    if (box.dataset.n != n) { box.dataset.n = n; vibra(40); }
    txt = String(n); label = 'Preparati…'; f = 1;
  } else if (w.state === 'run') {
    const left = w.endAt - now;
    if (left <= 0) { vibra([400, 150, 400]); toast('💪 Tempo! Serie registrata'); workFine(w.dur); return; }
    txt = mmss(left); label = 'Tieni duro!'; f = left / (w.dur * 1000);
  } else if (w.state === 'pause') {
    txt = mmss(w.left); label = 'In pausa'; f = w.left / (w.dur * 1000);
  } else {
    const e = db.draft.exercises[db.draft.cur];
    txt = mmss(workDur(e) * 1000); label = 'Pronto'; f = 1;
  }
  big.textContent = txt; lbl.textContent = label;
  box.classList.toggle('counting', w.state === 'count');
  ring.style.strokeDashoffset = 100 - Math.max(0, Math.min(1, f)) * 100;
}

/* ---------- Durata allenamento ---------- */
function drawElapsed() {
  const el = $('[data-elapsed]'); if (!el || !db.draft?.startedAt) return;
  const m = Math.floor((Date.now() - db.draft.startedAt) / 60000);
  el.textContent = m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

/* Un solo orologio per tutto: ridisegna solo i numeri, mai la pagina intera */
function tick() {
  if (!db.draft) { drawRest(); return; }
  const r = db.draft.rest;
  if (r && r.endAt <= Date.now()) {
    const ritardo = Date.now() - r.endAt;
    db.draft.rest = null; save(); drawRest();
    if (ritardo < 5000) { vibra([300, 150, 300]); toast('💪 Recupero finito, vai!'); }
  } else drawRest();
  drawWork(); drawElapsed();
}
setInterval(tick, 250);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { tick(); if (db.draft && view === 'allena') schermoAcceso(true); }
});
