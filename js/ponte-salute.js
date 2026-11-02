/* ============ COLLEGAMENTO CON CARTELLA SALUTE ============
   Usa ponte-peso.js (lo stesso file è anche nell'app Salute).
   - Pesate nei due sensi, anche le cancellazioni
   - Da Salute: altezza ed età (per il fabbisogno)
   - A Salute: riepilogo dell'attività delle ultime 4 settimane */
import { S, save, cfg, corpoCalcoli, attivitaMedia, obiettiviGiorno, sorted, BETA } from './dati.js';
import { uid, toast, isoFrom } from './util.js';
import { app } from './ui.js';
import { flush } from './sync.js';

const ponte = () => (BETA ? null : window.PontePeso);

/* Le pesate di Palestra, una per giorno */
function leggiLocali() {
  const out = {};
  S.db.weights.forEach(w => { out[w.date] = { kg: w.kg }; });
  S.db.body.forEach(b => {
    const x = out[b.date] || (out[b.date] = { kg: b.kg });
    if (b.fat != null && b.fat !== '') x.fat = b.fat;
    if (b.muscle != null && b.muscle !== '') x.muscle = b.muscle;
  });
  return out;
}
let cambiate = 0;
function applica(date, v) {
  S.db.pesiTolti = S.db.pesiTolti || {};
  S.db.weights = S.db.weights.filter(w => w.date !== date);
  S.db.body = S.db.body.filter(b => b.date !== date);
  if (!v) { S.db.pesiTolti[date] = Date.now(); cambiate++; return; }       // cancellata in Salute: non deve tornare dal foglio
  delete S.db.pesiTolti[date];
  S.db.weights.push({ id: uid(), date, kg: v.kg });
  if (v.fat != null || v.muscle != null) S.db.body.push({ id: uid(), date, kg: v.kg, fat: v.fat, muscle: v.muscle });
  S.db.outbox.push({ type: 'weight', date, kg: v.kg });                    // anche nel foglio Allenamenti
  cambiate++;
}

/* Riepilogo per Salute */
function riepilogo() {
  const da = isoFrom(27), r = corpoCalcoli(), a = attivitaMedia();
  const extra = (S.db.extra || []).filter(e => e.data >= da).length;
  return {
    dal: a.inizio, al: a.fine, giorniPassi: a.giorniPassi,
    passi: (() => { const g = Object.entries(S.db.orologio?.giorni || {}).filter(([d]) => d >= a.inizio && d <= a.fine).map(([, v]) => v[0]); return g.length ? Math.round(g.reduce((x, y) => x + y, 0) / g.length) : null; })(),
    kcalAttive: Math.round(a.totale), kcalPalestra: Math.round(a.palestra), kcalExtra: Math.round(a.extra),
    allenamenti: sorted().filter(w => w.date >= da).length, extra,
    fabbisogno: r.tdee ? Math.round(r.tdee) : null, obiettivo: obiettiviGiorno().kcal,
  };
}

let ultimoAvviso = 0;
export async function sincronizzaSalute({ avvisa = true } = {}) {
  const P = ponte(); if (!P) return null;
  try {
    cambiate = 0;
    const r = await P.sincronizza({ app: 'palestra', leggiLocali, applica });
    // Profilo da Salute: altezza ed età
    let profilo = false;
    const pr = P.leggiProfilo();
    if (pr && pr.agg && pr.agg > (cfg().profiloSaluteVisto || '')) {
      if (pr.altezza) cfg().altezza = String(pr.altezza);
      if (pr.anno) cfg().eta = String(new Date().getFullYear() - pr.anno);
      cfg().profiloSaluteVisto = pr.agg; profilo = true;
    }
    if (cambiate || profilo) { save(); app.renderSafe(); if (cambiate) flush(); }
    P.scriviAttivita(riepilogo());
    if (avvisa && r.applicate && Date.now() - ultimoAvviso > 3000) { ultimoAvviso = Date.now(); toast(`🩺 Da Salute: ${r.applicate} ${r.applicate === 1 ? 'pesata aggiornata' : 'pesate aggiornate'}`); }
    return r;
  } catch (e) { return null; }
}
