/* ============ STRUMENTI: TIMER LIBERO ============ */
import { ico, apriFoglio, aggiornaFoglio, foglioAperto, app } from '../ui.js';
import { ST, timerLibero, sbloccaAudio } from '../timer.js';
import { mmss, secTxt } from '../util.js';

function corpo() {
  const t = ST.timer, va = !!t.endAt;
  return `<div class="strum"><b class="strum-num" data-timer-libero>${mmss(t.endAt ? t.endAt - Date.now() : (t.left || t.dur * 1000))}</b>
    ${!va && !t.left ? `<div class="chips centro">${[30, 60, 90, 120, 180, 300].map(s => `<button class="pill ${t.dur === s ? 'on' : ''}" data-action="st-timer" data-a="dur" data-s="${s}">${secTxt(s)}</button>`).join('')}</div>
      <div class="row-btns centro"><button class="btn" data-action="st-timer" data-a="dur" data-s="${t.dur - 15}">−15″</button><button class="btn" data-action="st-timer" data-a="dur" data-s="${t.dur + 15}">+15″</button></div>` : ''}
    <div class="row-btns centro">${va ? `<button class="btn big primary" data-action="st-timer" data-a="pausa">${ico('pausa', 18)} Pausa</button>`
      : `<button class="btn big" data-action="st-timer" data-a="azzera">Azzera</button><button class="btn big primary" data-action="st-timer" data-a="via">${ico('play', 18)} ${t.left ? 'Riprendi' : 'Via'}</button>`}</div>
    <p class="muted small centro">Utile per plank, stretching o qualsiasi esercizio a tempo. Suona e vibra alla fine.</p></div>`;
}
export function foglioStrumenti() { apriFoglio(corpo(), { titolo: 'Timer', id: 'strumenti' }); }
app.renderStrumenti = () => { if (foglioAperto('strumenti')) aggiornaFoglio(corpo()); };
export const azioni = {
  strumenti: () => foglioStrumenti(),
  'st-timer': el => { sbloccaAudio(); timerLibero(el.dataset.a, +el.dataset.s); aggiornaFoglio(corpo()); },
};
