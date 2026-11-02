/* ============ RESOCONTO DELLA SETTIMANA ============
   La settimana appena finita confrontata con quella prima: allenamenti, volume, record,
   peso medio, calorie mangiate ed esercizi fermi. Compare nella schermata Oggi da lunedì a mercoledì. */
import { S, cfg, sorted, wVolume, exE1rm, obiettiviGiorno } from './dati.js';
import { addDays, weekStart, num, fmt } from './util.js';
import { stallo } from './coach.js';

const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

function datiSettimana(dal) {
  const al = addDays(dal, 6), dentro = d => d >= dal && d <= al;
  const ws = sorted().filter(w => dentro(w.date));
  const pesi = [...S.db.weights, ...S.db.body].filter(p => dentro(p.date) && num(p.kg)).map(p => num(p.kg));
  const giorniCibo = new Map();
  (S.db.pasti || []).filter(p => dentro(p.date)).forEach(p => giorniCibo.set(p.date, (giorniCibo.get(p.date) || 0) + (p.kcal || 0)));
  return { ws, n: ws.length, vol: ws.reduce((s, w) => s + wVolume(w), 0), peso: media(pesi), kcal: media([...giorniCibo.values()]), giorniCibo: giorniCibo.size };
}

/* Record battuti nella settimana: forza stimata più alta di tutte le volte precedenti */
function recordDi(dal) {
  const al = addDays(dal, 6), best = {}, nuovi = [];
  sorted().forEach(w => w.exercises.forEach(e => {
    if (e.tipo !== 'carico') return;
    const k = e.nome.toLowerCase(), v = exE1rm(e);
    if (w.date >= dal && w.date <= al && best[k] && v > best[k] + 0.01 && !nuovi.includes(e.nome)) nuovi.push(e.nome);
    if (v > (best[k] || 0)) best[k] = v;
  }));
  return nuovi;
}

export function resocontoSettimana(dal = addDays(weekStart(), -7)) {
  const a = datiSettimana(dal), b = datiSettimana(addDays(dal, -7));
  const fermi = [...new Set(a.ws.flatMap(w => w.exercises.filter(e => e.tipo === 'carico').map(e => e.nome)))].filter(n => stallo(n));
  const obj = num(cfg().giorniSettimana) || 3, ob = obiettiviGiorno();
  let consiglio;
  if (!a.n) consiglio = 'Settimana senza allenamenti: questa settimana riparti anche solo con una sessione.';
  else if (a.n < obj) consiglio = `Hai fatto ${a.n} allenamenti su ${obj}: prova a fissare i giorni in anticipo.`;
  else if (fermi.length) consiglio = `Bene la costanza. ${fermi.length === 1 ? `${fermi[0]} è fermo` : `${fermi.length} esercizi sono fermi`}: il coach ti propone uno scarico.`;
  else consiglio = 'Settimana completa: continua così.';
  return { dal, al: addDays(dal, 6), a, b, record: recordDi(dal), fermi, obj, kcalObj: ob.kcal, consiglio,
    dVol: b.vol ? Math.round((a.vol / b.vol - 1) * 100) : null, dPeso: a.peso != null && b.peso != null ? a.peso - b.peso : null };
}

/* Righe pronte da mostrare */
export function righeResoconto(r) {
  const fase = cfg().fase;
  const pesoCls = r.dPeso == null ? '' : (fase === 'massa' ? r.dPeso >= 0 : r.dPeso <= 0) ? 'su' : 'giu';
  return [
    ['Allenamenti', `${r.a.n} su ${r.obj}`, r.b.n !== r.a.n ? `settimana prima ${r.b.n}` : 'come la settimana prima', r.a.n >= r.obj ? 'su' : 'giu'],
    ['Volume', `${fmt(r.a.vol)} kg`, r.dVol == null ? '' : `${r.dVol >= 0 ? '+' : ''}${r.dVol}%`, r.dVol == null ? '' : r.dVol >= 0 ? 'su' : 'giu'],
    ['Record', r.record.length ? String(r.record.length) : 'nessuno', r.record.slice(0, 2).join(', ') + (r.record.length > 2 ? '…' : ''), r.record.length ? 'su' : ''],
    ['Peso medio', r.a.peso != null ? `${fmt(r.a.peso, 1)} kg` : '—', r.dPeso == null ? 'pesati qualche mattina' : `${r.dPeso > 0 ? '+' : ''}${fmt(r.dPeso, 1)} kg`, pesoCls],
    ['Kcal mangiate', r.a.kcal != null ? `${fmt(r.a.kcal)} al giorno` : '—', r.a.kcal != null ? `obiettivo ${fmt(r.kcalObj)} · ${r.a.giorniCibo} gg segnati` : 'nessun pasto segnato', ''],
  ];
}
