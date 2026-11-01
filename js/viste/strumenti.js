/* ============ STRUMENTI: CRONOMETRO E TIMER ============ */
import { ico, apriFoglio, aggiornaFoglio, foglioAperto, segmenti, app } from '../ui.js';
import { ST, crono, cronoMs, timerLibero, fmtCrono, sbloccaAudio } from '../timer.js';
import { mmss, secTxt } from '../util.js';

let tab = 'crono';
function corpo() {
  if (tab === 'crono') {
    const c = ST.crono, va = !!c.start;
    return `${segmenti([['crono', 'Cronometro'], ['timer', 'Timer']], tab, 'st-tab')}
      <div class="strum"><b class="strum-num" data-crono>${fmtCrono(cronoMs())}</b>
      <div class="row-btns centro">${va ? `<button class="btn big" data-action="st-crono" data-a="giro">Giro</button><button class="btn big primary" data-action="st-crono" data-a="pausa">${ico('pausa', 18)} Pausa</button>`
        : `<button class="btn big" data-action="st-crono" data-a="azzera">Azzera</button><button class="btn big primary" data-action="st-crono" data-a="via">${ico('play', 18)} ${cronoMs() ? 'Riprendi' : 'Via'}</button>`}</div>
      ${c.giri.length ? `<ol class="giri">${c.giri.map((g, i) => `<li><span>Giro ${c.giri.length - i}</span><b>${fmtCrono(g)}</b></li>`).join('')}</ol>` : ''}</div>`;
  }
  const t = ST.timer, va = !!t.endAt;
  return `${segmenti([['crono', 'Cronometro'], ['timer', 'Timer']], tab, 'st-tab')}
    <div class="strum"><b class="strum-num" data-timer-libero>${mmss(t.endAt ? t.endAt - Date.now() : (t.left || t.dur * 1000))}</b>
    ${!va && !t.left ? `<div class="chips centro">${[30, 60, 90, 120, 180, 300].map(s => `<button class="pill ${t.dur === s ? 'on' : ''}" data-action="st-timer" data-a="dur" data-s="${s}">${secTxt(s)}</button>`).join('')}</div>
      <div class="row-btns centro"><button class="btn" data-action="st-timer" data-a="dur" data-s="${t.dur - 15}">−15″</button><button class="btn" data-action="st-timer" data-a="dur" data-s="${t.dur + 15}">+15″</button></div>` : ''}
    <div class="row-btns centro">${va ? `<button class="btn big primary" data-action="st-timer" data-a="pausa">${ico('pausa', 18)} Pausa</button>`
      : `<button class="btn big" data-action="st-timer" data-a="azzera">Azzera</button><button class="btn big primary" data-action="st-timer" data-a="via">${ico('play', 18)} ${t.left ? 'Riprendi' : 'Via'}</button>`}</div>
    <p class="muted small centro">Utile per plank, stretching o qualsiasi esercizio a tempo. Suona e vibra alla fine.</p></div>`;
}
export function foglioStrumenti(t) { if (t) tab = t; apriFoglio(corpo(), { titolo: 'Strumenti', id: 'strumenti' }); }
app.renderStrumenti = () => { if (foglioAperto('strumenti')) aggiornaFoglio(corpo()); };
export const azioni = {
  strumenti: () => foglioStrumenti(),
  'st-tab': el => { tab = el.dataset.v; aggiornaFoglio(corpo()); },
  'st-crono': el => { crono(el.dataset.a); aggiornaFoglio(corpo()); },
  'st-timer': el => { sbloccaAudio(); timerLibero(el.dataset.a, +el.dataset.s); aggiornaFoglio(corpo()); },
};
