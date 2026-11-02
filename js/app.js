/* ============ PALESTRA 6 ============
   Avvio, navigazione tra le schermate e gestione centralizzata di tocchi e campi. */
import { S, save, cfg, VERSIONE } from './dati.js';
import { $, toast } from './util.js';
import { app, ico, chiudiFoglio, foglioAperto } from './ui.js';
import { applicaTema } from './tema.js';
import { attivaGrafici } from './grafici.js';
import { aggiornaTutto } from './sync.js';
import { tick, schermoAcceso, sbloccaAudio, chiudiRestFull } from './timer.js';
import * as Oggi from './viste/oggi.js';
import * as Allena from './viste/allena.js';
import * as Schede from './viste/schede.js';
import * as Progressi from './viste/progressi.js';
import * as Cucina from './viste/cucina.js';
import * as Imp from './viste/impostazioni.js';
import * as Strumenti from './viste/strumenti.js';
import * as Attivita from './viste/attivita.js';
import * as Cibo from './cibo.js';

const VISTE = {
  oggi: Oggi.viewOggi, allena: Allena.viewAllena,
  schede: Schede.viewSchede, modifica: Schede.viewModifica, libreria: Schede.viewLibreria, esercizio: Schede.viewEsercizio,
  'crea-esercizio': Schede.viewCreaEsercizio, storico: Schede.viewStorico, 'nuova-scheda': Schede.viewNuovaScheda,
  progressi: Progressi.viewProgressi, cucina: Cucina.viewCucina, ricetta: Cucina.viewRicetta, 'ricetta-nuova': Cucina.viewRicettaNuova, impostazioni: Imp.viewImpostazioni,
};
const TAB = { modifica: 'schede', libreria: 'schede', esercizio: 'schede', 'crea-esercizio': 'schede', storico: 'schede', 'nuova-scheda': 'schede', ricetta: 'cucina', 'ricetta-nuova': 'cucina', allena: 'allenati' };
const MODULI = [Allena, Schede, Progressi, Cucina, Imp, Oggi, Strumenti, Cibo, Attivita];
const AZIONI = Object.assign({}, ...MODULI.map(m => m.azioni || {}));

/* ---------- Barra di navigazione ---------- */
const NAV = [['oggi', 'Oggi', 'oggi'], ['schede', 'Schede', 'schede'], ['allenati', 'Allenati', 'manubrio'], ['progressi', 'Progressi', 'progressi'], ['cucina', 'Cucina', 'cucina']];
function disegnaNav() {
  const nav = $('#nav'), tab = TAB[S.view] || S.view;
  nav.innerHTML = NAV.map(([k, l, i]) => k === 'allenati'
    ? `<button class="nav-centro ${S.db.draft ? 'live' : ''}" data-action="allenati" aria-label="${S.db.draft ? 'Riprendi allenamento' : 'Allenati'}">${ico(S.db.draft ? 'play' : 'manubrio', 26)}<span>${S.db.draft ? 'Riprendi' : l}</span></button>`
    : `<button class="${tab === k ? 'on' : ''}" data-action="go" data-view="${k}" aria-current="${tab === k ? 'page' : 'false'}">${ico(i, 22)}<span>${l}</span></button>`).join('');
}

/* ---------- Disegno ---------- */
function render() {
  const fn = VISTE[S.view] || VISTE.oggi;
  const html = fn();
  if (S.view === 'allena' && !S.db.draft) return;
  const main = $('#app');
  const y = window.scrollY;
  main.innerHTML = html;
  document.body.classList.toggle('in-allenamento', S.view === 'allena');
  document.body.dataset.view = S.view;
  if (S.view !== 'allena') document.body.dataset.restInline = '0';
  disegnaNav(); attivaGrafici(main); tick();
  if (render.mantieni) window.scrollTo(0, y);
}
function renderSafe() {
  const a = document.activeElement;
  if (!a || !['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) { render.mantieni = true; render(); render.mantieni = false; }
}
function go(v, param = null, { storia = true } = {}) {
  if (v === 'allenati') return AZIONI.allenati();
  chiudiFoglio(true); chiudiRestFull();
  const prima = S.view;
  if (prima === 'ricetta' && v !== 'ricetta') Cucina.esci();
  if (prima === 'ricetta-nuova' && v !== 'ricetta-nuova') Cucina.esciBozza();
  S.view = VISTE[v] ? v : 'oggi'; S.param = param;
  if (storia) history.pushState({ v: S.view, p: param }, '', '#' + S.view);
  render(); window.scrollTo(0, 0);
  const main = $('#app'); main.classList.remove('entra'); void main.offsetWidth; if (prima !== S.view) main.classList.add('entra');
  schermoAcceso(S.view === 'allena' && !!S.db.draft);
}
app.render = () => { render.mantieni = true; render(); render.mantieni = false; };
app.renderSafe = renderSafe;
app.go = go;

/* Tasto indietro di Android: chiude prima i fogli aperti, poi torna alla schermata precedente */
window.addEventListener('popstate', e => {
  if (foglioAperto()) { chiudiFoglio(); history.pushState({ v: S.view, p: S.param }, '', '#' + S.view); return; }
  if ($('#rest-full')) { chiudiRestFull(); history.pushState({ v: S.view, p: S.param }, '', '#' + S.view); return; }
  const st = e.state || { v: 'oggi' };
  go(st.v, st.p, { storia: false });
});

/* ---------- File (backup, CSV) ---------- */
let modoFile = 'json';
app.pickFile = modo => { modoFile = modo; const f = $('#file'); f.value = ''; f.multiple = modo === 'orologio'; f.accept = modo === 'json' ? '.json,application/json' : modo === 'orologio' ? '.csv,text/csv,text/comma-separated-values' : '.csv,text/csv'; f.click(); };

/* ---------- Eventi ---------- */
document.addEventListener('click', e => {
  sbloccaAudio();
  const el = e.target.closest('[data-action]'); if (!el || el.disabled) return;
  const a = el.dataset.action;
  if (a === 'go') { e.preventDefault(); return go(el.dataset.view, el.dataset.p ?? null); }
  if (a === 'foglio-chiudi') return chiudiFoglio();
  const fn = AZIONI[a];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-action]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Enter' && e.target.id === 'sp-nuovo') AZIONI['spesa-add']();
});
document.addEventListener('input', e => { if (e.target.classList?.contains('st-val')) e.target.style.setProperty('--ch', Math.max(2, e.target.value.length)); for (const m of MODULI) if (m.input && m.input(e.target)) return; });
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'file' && t.files[0] && modoFile === 'orologio') return Attivita.importaOrologio(t.files);
  if (t.id === 'file' && t.files[0]) {
    const testo = await t.files[0].text();
    if (modoFile === 'ricette') Cucina.importRicetteCSV(testo); else Imp.importatori[modoFile](testo);
    return;
  }
  for (const m of MODULI) if (m.change && await m.change(t)) return;
});

/* Foto che non si caricano (offline la prima volta): restano icona e colore di sfondo */
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);

/* ---------- Avvio ---------- */
applicaTema();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
window.addEventListener('online', aggiornaTutto);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aggiornaTutto(); });
const iniziale = (location.hash.slice(1) in VISTE && !['allena', 'ricetta', 'esercizio'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'oggi');
history.replaceState({ v: iniziale }, '', '#' + iniziale);
S.view = iniziale; render();
if (location.hash === '#allenati' || /[?&]azione=allenati/.test(location.search)) setTimeout(() => AZIONI.allenati(), 300);
aggiornaTutto();
Cucina.caricaRicetteBase();
window.PALESTRA = { versione: VERSIONE, S };

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  let ricaricata = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!ricaricata && !S.db.draft) { ricaricata = true; location.reload(); } });
}
