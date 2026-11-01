/* ============ ASPETTO ============
   4 stili (Vetro, Essenziale, Atleta, Officina), ognuno in versione chiara e scura,
   colore principale, dimensione del testo e animazioni. I colori stanno in css/temi.css. */
import { cfg } from './dati.js';

export const STILI = [
  ['vetro', 'Vetro', 'Liquid Glass, luci e trasparenze'],
  ['essenziale', 'Essenziale', 'Pulito e veloce, stile Hevy'],
  ['atleta', 'Atleta', 'Energico, titoli grandi, foto'],
  ['officina', 'Officina', 'Libretto tecnico, carta e arancio'],
];
export const ACCENTI = [
  ['viola', '#7c5cff', 'Viola'], ['ciano', '#16b4e0', 'Ciano'], ['blu', '#3d7bff', 'Blu'], ['verde', '#1fbf6e', 'Verde'],
  ['lime', '#b6e51f', 'Lime'], ['arancio', '#ff5a1f', 'Arancio'], ['rosa', '#ec4899', 'Rosa'], ['rosso', '#e5484d', 'Rosso'],
];
const FONT = {
  vetro: 'family=Unbounded:wght@500;700&family=Manrope:wght@400;500;600;700;800',
  essenziale: 'family=Instrument+Sans:wght@400;500;600;700',
  atleta: 'family=Anton&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800',
  leggibile: 'family=Atkinson+Hyperlegible:wght@400;700',
  officina: 'family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@400;500;600;700',
};
const caricati = new Set();
function caricaFont(stile) {
  if (caricati.has(stile) || !FONT[stile]) return;
  caricati.add(stile);
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?${FONT[stile]}&display=swap`;
  document.head.appendChild(l);
}
export const scuro = () => { const m = cfg().modo; return m === 'scuro' || (m === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); };
export function applicaTema() {
  const s = cfg(), r = document.documentElement, st = STILI.some(x => x[0] === s.stile) ? s.stile : 'vetro';
  caricaFont(st);
  if (s.carattere === 'leggibile') caricaFont('leggibile');
  r.dataset.stile = st; r.dataset.modo = scuro() ? 'scuro' : 'chiaro';
  r.dataset.anim = s.animazioni || 'normali';
  r.dataset.carattere = s.carattere || 'stile';
  const acc = ACCENTI.find(a => a[0] === s.accento);
  if (acc) r.style.setProperty('--accent', acc[1]); else r.style.removeProperty('--accent');
  if (acc) r.dataset.accento = acc[0]; else delete r.dataset.accento;
  r.style.setProperty('--scala', s.testo || 1);
  requestAnimationFrame(() => {
    const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0b0f1a';
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = bg;
  });
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (cfg().modo === 'auto') applicaTema(); });
