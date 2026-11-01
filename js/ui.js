/* ============ PEZZI DI INTERFACCIA ============
   Icone, intestazioni, fogli a comparsa dal basso e piccoli componenti usati da tutte le schermate. */
import { esc } from './util.js';
import { S } from './dati.js';

/* app.render() viene collegato da app.js (evita dipendenze circolari) */
export const app = { render() {}, renderSafe() {}, go() {} };

/* Icone a tratto (24×24), stesso stile per tutta l'app */
const P = {
  oggi: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  schede: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  manubrio: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  progressi: '<path d="M3 20h18M5 16l4-5 4 3 6-8"/>',
  cucina: '<path d="M4 11h16a8 8 0 0 1-16 0zM9 21h6M12 3v4M8 4.5l1 2M16 4.5l-1 2"/>',
  indietro: '<path d="M15 18l-6-6 6-6"/>',
  avanti: '<path d="M9 6l6 6-6 6"/>',
  giu: '<path d="M6 9l6 6 6-6"/>',
  su: '<path d="M18 15l-6-6-6 6"/>',
  chiudi: '<path d="M18 6 6 18M6 6l12 12"/>',
  piu: '<path d="M12 5v14M5 12h14"/>',
  meno: '<path d="M5 12h14"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  pausa: '<path d="M8 5v14M16 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  cerca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  cuore: '<path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.7 5c2 0 3.5 1.1 5.3 3 1.8-1.9 3.3-3 5.3-3 3.4 0 5.5 3.4 4.2 6.7C19.5 16.4 12 21 12 21z"/>',
  stella: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  impostazioni: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  matita: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  cestino: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  lista: '<path d="M9 6h12M9 12h12M9 18h12M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  scambia: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
  trofeo: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  fuoco: '<path d="M12 22c4 0 7-3 7-7 0-5-4-6-5-11-2 2-3 4-3 6-1-1-2-2-2-4-2 2-4 5-4 9 0 4 3 7 7 7z"/>',
  bilancia: '<path d="M5 21h14M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  calendario: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  foto: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  carrello: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20.5" r="1"/><circle cx="17" cy="20.5" r="1"/>',
  nuvola: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
  salva: '<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7"/>',
  carica: '<path d="M12 15V3M7 8l5-5 5 5M4 15v5h16v-5"/>',
  scarica: '<path d="M12 3v12M7 10l5 5 5-5M4 15v5h16v-5"/>',
  occhio: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pennello: '<path d="M18 3l3 3-9 9-3-3zM9 12l-3 3c-2 0-3 2-3 4v2h2c2 0 4-1 4-3l3-3"/>',
  dischi: '<rect x="2" y="9" width="20" height="6" rx="1"/><rect x="5" y="5" width="3" height="14" rx="1"/><rect x="16" y="5" width="3" height="14" rx="1"/>',
  campana: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  utente: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  ripeti: '<path d="M4 4v6h6M20 20v-6h-6M20 10A8 8 0 0 0 6 6L4 10M4 14a8 8 0 0 0 14 4l2-4"/>',
  lampo: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  muscolo: '<path d="M4 15c2-1 4-1 5 1 1-4 4-6 7-5 3 1 4 5 3 8-1 2-4 3-7 2-3-1-6-2-8-6zM7 9c0-3 2-5 5-5"/>',
  stampa: '<path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M7 14h10v7H7z"/>',
  cronometro: '<circle cx="12" cy="14" r="7"/><path d="M12 10v4M9 3h6M12 3v4M18.5 7.5 20 6"/>',
  nota: '<path d="M4 4h16v12l-4 4H4zM16 20v-4h4M8 9h8M8 13h5"/>',
  suono: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
};
export const ico = (n, size = 22, extra = '') => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || ''}</svg>`;

/* Intestazione di pagina con titolo e avatar per le impostazioni */
export function testata(titolo, sotto = '', opz = {}) {
  const nome = (S.db.settings.name || '').trim();
  const back = opz.back ? `<button class="icon-btn" data-action="go" data-view="${esc(opz.back)}" aria-label="Indietro">${ico('indietro')}</button>` : '';
  return `<header class="testata">${back}<div class="testata-t">${sotto ? `<span class="eyebrow">${sotto}</span>` : ''}<h1>${titolo}</h1></div>
    ${opz.destra ?? `<button class="avatar" data-action="go" data-view="impostazioni" aria-label="Impostazioni e aspetto">${nome ? esc(nome[0].toUpperCase()) : ico('utente', 20)}</button>`}</header>`;
}
export const vuoto = (t, icona = '') => `<div class="vuoto">${icona ? ico(icona, 28) : ''}<p>${t}</p></div>`;
export const pill = (testo, attiva, attrs) => `<button class="pill ${attiva ? 'on' : ''}" ${attrs}>${testo}</button>`;
export function segmenti(opzioni, valore, azione, extra = '') {
  return `<div class="seg ${extra}" role="tablist">${opzioni.map(([v, l]) => `<button role="tab" aria-selected="${String(v) === String(valore)}" class="${String(v) === String(valore) ? 'on' : ''}" data-action="${azione}" data-v="${esc(v)}">${l}</button>`).join('')}</div>`;
}
/* Stepper con numero modificabile a mano */
export function stepper({ valore, azione, campo, passo, unita = '', label, extra = '' }) {
  return `<div class="stepper ${extra}"><span class="st-lab">${label}</span>
    <div class="st-row"><button class="st-btn" data-action="${azione}" data-campo="${campo}" data-d="-${passo}" aria-label="Diminuisci ${label}">${ico('meno', 22)}</button>
    <input class="st-val" type="text" inputmode="decimal" data-campo-input="${campo}" value="${esc(valore)}" aria-label="${label}" autocomplete="off">
    <button class="st-btn" data-action="${azione}" data-campo="${campo}" data-d="${passo}" aria-label="Aumenta ${label}">${ico('piu', 22)}</button></div>
    ${unita ? `<span class="st-unit">${unita}</span>` : ''}</div>`;
}
/* Interruttore */
export const interruttore = (chiave, on, label, desc = '') => `<label class="riga-sw"><span><b>${label}</b>${desc ? `<small>${desc}</small>` : ''}</span>
  <input type="checkbox" class="sw" data-setting-bool="${chiave}" ${on ? 'checked' : ''}><i aria-hidden="true"></i></label>`;

/* ---------- Foglio dal basso ---------- */
let foglio = null;
export function apriFoglio(html, opz = {}) {
  chiudiFoglio(true);
  const w = document.createElement('div');
  w.className = 'foglio-wrap'; w.dataset.id = opz.id || '';
  w.innerHTML = `<div class="foglio ${opz.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(opz.titolo || '')}">
    <div class="foglio-maniglia" aria-hidden="true"></div>
    ${opz.titolo ? `<div class="foglio-testa"><h3>${opz.titolo}</h3><button class="icon-btn" data-action="foglio-chiudi" aria-label="Chiudi">${ico('chiudi')}</button></div>` : ''}
    <div class="foglio-corpo">${html}</div></div>`;
  document.body.appendChild(w);
  requestAnimationFrame(() => w.classList.add('show'));
  w.addEventListener('click', e => { if (e.target === w) chiudiFoglio(); });
  foglio = { el: w, onClose: opz.onClose };
  return w;
}
export function chiudiFoglio(subito = false) {
  if (!foglio) return;
  const f = foglio; foglio = null;
  f.el.classList.remove('show');
  setTimeout(() => f.el.remove(), subito ? 0 : 220);
  if (f.onClose) f.onClose();
}
export const foglioAperto = id => foglio && (!id || foglio.el.dataset.id === id);
export function aggiornaFoglio(html) { const c = foglio?.el.querySelector('.foglio-corpo'); if (c) c.innerHTML = html; }

/* Coriandoli per i record (rispetta "animazioni ridotte") */
export function festa() {
  if (document.documentElement.dataset.anim === 'nessuna' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'festa'; c.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 36; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%'; p.style.animationDelay = Math.random() * 0.3 + 's';
    p.style.setProperty('--x', (Math.random() * 2 - 1) * 60 + 'px'); p.style.setProperty('--r', Math.random() * 720 + 'deg');
    p.style.background = `var(--c${i % 4})`;
    c.appendChild(p);
  }
  document.body.appendChild(c); setTimeout(() => c.remove(), 2200);
}
