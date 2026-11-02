/* ============ TIMER ============
   Tutti i timer si basano sull'ORARIO DI FINE salvato: non perdono secondi se il telefono rallenta,
   se cambi schermata o se riapri l'app.
   - Recupero: parte da solo quando segni una serie (S.db.draft.rest)
   - Esercizi a tempo (plank & co.): conto 3-2-1, poi conto alla rovescia (S.db.draft.work)
   - Strumenti: timer libero, usabile anche senza allenamento */
import { S, save, cfg, riallineaTempo } from './dati.js';
import { $, mmss, vibra, toast, num, restSec, clamp } from './util.js';
import { ico, app } from './ui.js';

/* ---------- Suoni (generati, niente file) ---------- */
let ctx = null;
export function sbloccaAudio() {
  try { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
}
export function beep(freq = 880, dur = 0.15, volte = 1) {
  if (!cfg().suono || !ctx) return;
  try {
    for (let i = 0; i < volte; i++) {
      const t = ctx.currentTime + i * (dur + 0.08), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    }
  } catch (e) {}
}
const vib = p => { if (cfg().vibrazione) vibra(p); };

/* ---------- Notifica quando l'app è in secondo piano ---------- */
async function notifica(titolo, testo) {
  if (!cfg().notifiche || document.visibilityState === 'visible') return;
  try {
    if (Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.ready;
    if (reg) reg.showNotification(titolo, { body: testo, tag: 'palestra-timer', renotify: true, vibrate: [300, 150, 300], icon: 'icon-192.png' });
  } catch (e) {}
}
export async function chiediNotifiche() {
  try {
    if (!('Notification' in window)) { toast('Questo browser non supporta le notifiche'); return false; }
    const p = await Notification.requestPermission();
    if (p !== 'granted') { toast('Notifiche non consentite'); return false; }
    return true;
  } catch (e) { return false; }
}

/* ---------- Schermo acceso durante l'allenamento ---------- */
let wakeLock = null;
export async function schermoAcceso(on) {
  try {
    if (on && cfg().schermoAcceso && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if ((!on || !cfg().schermoAcceso) && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { wakeLock = null; }
}

/* ---------- Recupero ---------- */
export function startRest(sec, info = '') {
  if (!S.db.draft) return;
  sec = Math.round(sec);
  S.db.draft.rest = { endAt: Date.now() + sec * 1000, total: sec * 1000, info, avvisato: false };
  save(); tick();
}
export function stopRest() {
  if (S.db.draft?.rest) { S.db.draft.rest = null; save(); }
  chiudiRestFull(); drawRest();
}
export function addRest(sec) {
  const r = S.db.draft?.rest; if (!r) return;
  r.endAt = Math.max(Date.now() + 1000, r.endAt + sec * 1000);
  r.total = Math.max(r.total + sec * 1000, r.endAt - Date.now());
  save(); tick();
}
function drawRest() {
  let el = $('#rest');
  const r = S.db.draft?.rest;
  const nascondi = !r || (S.view === 'allena' && document.body.dataset.restInline === '1');
  if (nascondi) { if (el) el.classList.remove('show'); return; }
  if (!el) {
    el = document.createElement('div'); el.id = 'rest'; el.setAttribute('role', 'timer');
    document.body.appendChild(el);
  }
  if (!el.classList.contains('show')) {
    el.innerHTML = `<button class="rest-apri" data-action="rest-full" aria-label="Apri il timer a tutto schermo">
        <svg class="rest-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="trk"/><circle cx="18" cy="18" r="15.5" class="prg" pathLength="100"/></svg>
        <span class="rest-txt"><small>Recupero</small><b data-rest-time></b></span></button>
      <button class="btn small" data-action="rest-add" data-s="-15">−15</button><button class="btn small" data-action="rest-add" data-s="15">+15</button>
      <button class="btn small primary" data-action="rest-skip">Salta</button>`;
    el.classList.add('show');
  }
  const left = r.endAt - Date.now(), f = clamp(left / r.total, 0, 1);
  el.querySelector('[data-rest-time]').textContent = mmss(left);
  el.querySelector('.prg').style.strokeDashoffset = 100 - f * 100;
}
/* Timer a tutto schermo */
export function apriRestFull() {
  if (!S.db.draft?.rest || $('#rest-full')) return;
  const el = document.createElement('div'); el.id = 'rest-full'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Recupero');
  el.innerHTML = `<div class="rf-in"><span class="rf-lab">Recupero</span>
    <div class="rf-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" class="trk"/><circle cx="100" cy="100" r="92" class="prg" pathLength="100"/></svg>
    <b data-rf-time></b></div><span class="rf-info" data-rf-info></span>
    <div class="rf-btns"><button class="btn big" data-action="rest-add" data-s="-15">−15″</button><button class="btn big" data-action="rest-add" data-s="15">+15″</button>
    <button class="btn big primary" data-action="rest-skip">Salta</button></div>
    <button class="btn ghost" data-action="rest-full-chiudi">${ico('giu', 20)} Riduci</button></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('show')); tick();
}
export function chiudiRestFull() { const el = $('#rest-full'); if (el) { el.classList.remove('show'); setTimeout(() => el.remove(), 200); } }
function drawRestFull() {
  const el = $('#rest-full'); if (!el) return;
  const r = S.db.draft?.rest; if (!r) return chiudiRestFull();
  const left = r.endAt - Date.now();
  el.querySelector('[data-rf-time]').textContent = mmss(left);
  el.querySelector('[data-rf-info]').textContent = r.info || '';
  el.querySelector('.prg').style.strokeDashoffset = 100 - clamp(left / r.total, 0, 1) * 100;
}
/* Recupero mostrato dentro la schermata allenamento */
function drawRestInline() {
  const box = $('[data-ri-box]'); if (!box) return;
  const r = S.db.draft?.rest;
  if (!r) return;
  const left = r.endAt - Date.now();
  box.querySelectorAll('[data-ri-time]').forEach(x => x.textContent = mmss(left));
  box.querySelectorAll('[data-ri-prg]').forEach(x => x.style.strokeDashoffset = 100 - clamp(left / r.total, 0, 1) * 100);
  box.querySelectorAll('[data-ri-bar]').forEach(x => x.style.transform = `scaleX(${clamp(left / r.total, 0, 1)})`);
}

/* ---------- Esercizi a tempo ---------- */
export function workDur(e) {
  const w = S.db.draft?.work;
  if (w && w.ex === S.db.draft.cur) return w.dur;
  const s = e.sets.find(x => !x.done) || e.sets.at(-1);
  return num(s?.target) || num(String(e.rip).match(/\d+/)?.[0]) || 45;
}
export const workSetIndex = e => { const i = e.sets.findIndex(s => !s.done); return i < 0 ? e.sets.length - 1 : i; };
export function workStato() { const w = S.db.draft?.work; if (!w || w.ex !== S.db.draft.cur) return { state: 'idle' }; return w; }
export function workSetDur(sec) {
  const w = workStato(); if (w.state === 'run' || w.state === 'count') return;
  S.db.draft.work = { ex: S.db.draft.cur, dur: clamp(sec, 5, 600), state: 'idle' }; save(); app.render();
}
export function workStart() {
  const e = S.db.draft.exercises[S.db.draft.cur], dur = workDur(e);
  stopRest(); sbloccaAudio();
  const conto = cfg().conto321 ? 3000 : 0, countEnd = Date.now() + conto;
  S.db.draft.work = { ex: S.db.draft.cur, dur, set: workSetIndex(e), state: conto ? 'count' : 'run', countEnd, endAt: countEnd + dur * 1000 };
  save(); vib(40); schermoAcceso(true); app.render();
}
export function workPause() {
  const w = S.db.draft.work; if (!w) return;
  if (w.state === 'run') { w.left = w.endAt - Date.now(); w.state = 'pause'; } else if (w.state === 'count') w.state = 'idle';
  save(); app.render();
}
export function workResume() { const w = S.db.draft.work; if (!w || w.state !== 'pause') return; w.endAt = Date.now() + w.left; w.state = 'run'; save(); app.render(); }
export function workReset() { const w = S.db.draft.work; if (!w) return; S.db.draft.work = { ex: w.ex, dur: w.dur, state: 'idle' }; save(); app.render(); }
function workFine(secFatti) {
  const w = S.db.draft.work, e = S.db.draft.exercises[w.ex];
  const s = e.sets[w.set] || e.sets[workSetIndex(e)];
  if (s) { s.reps = String(Math.round(secFatti)); s.done = true; }
  S.db.draft.work = { ex: w.ex, dur: w.dur, state: 'idle' };
  save(); app.render();
  if (e.sets.some(x => !x.done) && cfg().recuperoAuto) startRest(restSec(e.recupero), `Prossima: serie ${workSetIndex(e) + 1}`);
}
export function workStop() {
  const w = S.db.draft.work; if (!w) return;
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
    if (n <= 0) { w.state = 'run'; save(); vib(150); beep(1046, 0.3); app.render(); return; }
    if (box.dataset.n != n) { box.dataset.n = n; vib(40); beep(660, 0.12); }
    txt = String(n); label = 'Preparati…';
  } else if (w.state === 'run') {
    const left = w.endAt - now;
    if (left <= 0) { vib([400, 150, 400]); beep(1046, 0.25, 3); notifica('Tempo!', 'Serie registrata'); toast('💪 Tempo! Serie registrata'); workFine(w.dur); return; }
    const s10 = Math.ceil(left / 1000);
    if (cfg().avviso10 && s10 <= 3 && box.dataset.s != s10) { box.dataset.s = s10; beep(660, 0.08); }
    txt = mmss(left); label = 'Tieni duro!'; f = left / (w.dur * 1000);
  } else if (w.state === 'pause') { txt = mmss(w.left); label = 'In pausa'; f = w.left / (w.dur * 1000); }
  else { txt = mmss(workDur(S.db.draft.exercises[S.db.draft.cur]) * 1000); label = 'Pronto'; }
  if (big) big.textContent = txt; if (lbl) lbl.textContent = label;
  box.classList.toggle('counting', w.state === 'count');
  if (ring) ring.style.strokeDashoffset = 100 - clamp(f, 0, 1) * 100;
}
function drawElapsed() {
  const els = document.querySelectorAll('[data-elapsed]'); if (!els.length || !S.db.draft?.startedAt) return;
  if (riallineaTempo(S.db.draft)) save();
  const m = Math.floor((Date.now() - S.db.draft.startedAt) / 60000);
  els.forEach(el => el.textContent = m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);
}

/* ---------- Strumenti: timer libero (in memoria + localStorage) ---------- */
const KS = 'palestra-strumenti';
export const ST = (() => { try { return JSON.parse(localStorage.getItem(KS)) || {}; } catch (e) { return {}; } })();
delete ST.crono; // il cronometro con i giri è stato tolto
ST.timer ||= { dur: 60, endAt: 0, left: 0 };
const salvaST = () => { try { localStorage.setItem(KS, JSON.stringify(ST)); } catch (e) {} };
export function timerLibero(azione, val) {
  const t = ST.timer;
  if (azione === 'dur') { if (!t.endAt) { t.dur = clamp(val, 5, 3600); t.left = 0; } }
  else if (azione === 'via') { sbloccaAudio(); t.endAt = Date.now() + (t.left || t.dur * 1000); t.left = 0; }
  else if (azione === 'pausa') { if (t.endAt) { t.left = t.endAt - Date.now(); t.endAt = 0; } }
  else if (azione === 'azzera') { t.endAt = 0; t.left = 0; }
  salvaST();
}
function drawStrumenti() {
  const t = ST.timer;
  if (t.endAt && t.endAt <= Date.now()) {
    t.endAt = 0; t.left = 0; salvaST(); vib([400, 150, 400]); beep(1046, 0.25, 3); notifica('Timer finito', ''); toast('⏰ Timer finito!');
    app.renderStrumenti?.();
  }
  const el = document.querySelector('[data-timer-libero]');
  if (el) el.textContent = mmss(t.endAt ? t.endAt - Date.now() : (t.left || t.dur * 1000));
}

/* ---------- Un solo orologio per tutto: ridisegna solo i numeri ---------- */
export function tick() {
  const d = S.db.draft;
  if (d) {
    const r = d.rest;
    if (r && !r.avvisato && cfg().avviso10 && r.endAt - Date.now() <= 10000 && r.endAt - Date.now() > 9000) { r.avvisato = true; beep(660, 0.1); vib(60); }
    if (r && r.endAt <= Date.now()) {
      const ritardo = Date.now() - r.endAt;
      d.rest = null; save(); chiudiRestFull();
      if (ritardo < 5000) { vib([300, 150, 300]); beep(1046, 0.22, 2); toast('💪 Recupero finito, vai!'); }
      notifica('Recupero finito', 'Vai con la prossima serie 💪');
      if (S.view === 'allena') app.render();
    }
    drawWork(); drawElapsed(); drawRestInline(); drawRestFull();
  }
  drawRest(); drawStrumenti();
}
setInterval(tick, 200);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { tick(); if (S.db.draft && S.view === 'allena') schermoAcceso(true); }
});
