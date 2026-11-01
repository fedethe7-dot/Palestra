/* ============ COACH ============
   Il "personal trainer": quanto caricare oggi, dischi da montare, muscoli pronti, serie per muscolo,
   proposta della nuova scheda quando il programma finisce. */
import { S, cfg, attrezzatura, sorted, lastFor, records } from './dati.js';
import { num, todayISO, isoFrom, daysBetween, fmt, addDays } from './util.js';
import { libreria, attrezzoDi, libDi } from './libreria.js';

export const rangeDi = rip => {
  const n = (String(rip ?? '').match(/\d+/g) || []).map(Number);
  if (!n.length) return null;
  return { lo: n[0], hi: n[1] ?? n[0] };
};

/* Passo di aumento del carico in base all'attrezzo */
export function passoKg(e) {
  const a = attrezzatura(), att = attrezzoDi(e);
  if (att === 'Bilanciere') return num(a.passoBilanciere) || 2;
  if (att === 'Carrucola alta') return num(a.passoCarrucola) || 1;
  return num(a.passoManubri) || 1;
}

/* ---------- Dischi ---------- */
/* Bilanciere: dischi per lato (ogni disco si usa a coppie). Restituisce null se non c'è un bilanciere */
export function dischiBilanciere(totale) {
  const a = attrezzatura(), bar = num(a.bilanciere) || 20;
  let lato = (totale - bar) / 2;
  if (lato < 0) return { lato: [], esatto: false, totale: bar, sotto: true };
  const disp = [...a.dischi].map(d => ({ kg: num(d.kg), n: Math.floor((num(d.qta) || 0) / 2) })).filter(d => d.kg > 0).sort((x, y) => y.kg - x.kg);
  const usati = [];
  for (const d of disp) { let n = d.n; while (n > 0 && lato >= d.kg - 1e-9) { usati.push(d.kg); lato -= d.kg; n--; } }
  const tot = bar + usati.reduce((s, x) => s + x, 0) * 2;
  return { lato: usati, esatto: Math.abs(lato) < 1e-6, totale: tot };
}
/* Carrucola: dischi caricati sul perno (solo quelli segnati come adatti) */
export function dischiCarrucola(totale) {
  const a = attrezzatura();
  const max = num(a.carrucolaMax) || 30;
  let resto = Math.min(totale, max);
  const disp = a.dischi.filter(d => d.carrucola).map(d => ({ kg: num(d.kg), n: num(d.qta) || 0 })).filter(d => d.kg > 0).sort((x, y) => y.kg - x.kg);
  const usati = [];
  for (const d of disp) { let n = d.n; while (n > 0 && resto >= d.kg - 1e-9) { usati.push(d.kg); resto -= d.kg; n--; } }
  return { dischi: usati, esatto: Math.abs(resto) < 1e-6 && totale <= max, totale: usati.reduce((s, x) => s + x, 0), oltre: totale > max, max };
}
/* Tutti i carichi realizzabili con i dischi (a coppie sul bilanciere, singoli sulla carrucola) */
function combinazioni(dischi, max) {
  const fatti = new Set([0]);
  for (const d of dischi) for (let k = 0; k < d.n; k++) { [...fatti].forEach(x => { const y = Math.round((x + d.kg) * 100) / 100; if (y <= max) fatti.add(y); }); }
  return [...fatti].sort((a, b) => a - b);
}
export function carichiPossibili(e) {
  const a = attrezzatura(), att = attrezzoDi(e);
  if (att === 'Bilanciere') {
    const bar = num(a.bilanciere) || 20;
    const lato = combinazioni(a.dischi.map(d => ({ kg: num(d.kg), n: Math.floor((num(d.qta) || 0) / 2) })).filter(d => d.kg > 0), 200);
    return lato.map(x => Math.round((bar + 2 * x) * 100) / 100);
  }
  if (att === 'Carrucola alta') return combinazioni(a.dischi.filter(d => d.carrucola).map(d => ({ kg: num(d.kg), n: num(d.qta) || 0 })).filter(d => d.kg > 0), num(a.carrucolaMax) || 30);
  return null;
}
/* Carico realizzabile più vicino (per i suggerimenti del coach); a parità sceglie quello più alto */
export function caricoFattibile(e, kg) {
  const poss = carichiPossibili(e);
  if (!poss || !poss.length) return Math.round(kg * 4) / 4;
  return poss.reduce((best, x) => Math.abs(x - kg) < Math.abs(best - kg) - 1e-9 || (Math.abs(Math.abs(x - kg) - Math.abs(best - kg)) < 1e-9 && x > best) ? x : best, poss[0]);
}

/* ---------- Progressione: quanto fare oggi ---------- */
/* Doppia progressione: quando completi il range di ripetizioni in tutte le serie, aumenti il carico
   e riparti dal basso del range; altrimenti stesso carico e una ripetizione in più. */
export function obiettivo(e) {
  const last = lastFor(e.nome), r = rangeDi(e.rip), serie = num(e.serie) || 3;
  if (!last || !(last.ex.sets || []).length) {
    const kg = num(e.carico);
    return { tipo: 'prima', kg, reps: Array(serie).fill(r ? r.lo : null),
      testo: e.tipo === 'carico' ? `Prima volta: scegli un carico con cui chiudi ${r ? r.lo + '-' + r.hi : 'le'} ripetizioni lasciandone 2 in riserva.` : 'Prima volta: fai del tuo meglio con una buona tecnica.' };
  }
  const sets = last.ex.sets.map(s => ({ kg: num(s.kg), reps: num(s.reps) || 0, rir: num(s.rir) }));
  const reps = sets.map(s => s.reps), txtPrec = e.tipo === 'carico'
    ? (new Set(sets.map(s => s.kg)).size === 1 ? `${fmt(sets[0].kg, 2)} kg × ${reps.join(' · ')}` : sets.map(s => `${fmt(s.kg, 2)}×${s.reps}`).join(' · '))
    : reps.join(' · ') + (e.tipo === 'tempo' ? '″' : '');
  if (e.tipo === 'tempo') {
    const best = Math.max(...reps), t = best + 5;
    return { tipo: 'su', reps: Array(serie).fill(t), prec: txtPrec, testo: `L'ultima volta ${txtPrec}. Oggi prova ${t}″.` };
  }
  if (e.tipo !== 'carico') {
    const t = reps.map(x => x + 1);
    return { tipo: 'su', reps: Array(serie).fill(null).map((_, i) => t[i] ?? t.at(-1)), prec: txtPrec, testo: `L'ultima volta ${txtPrec}. Prova una ripetizione in più per serie.` };
  }
  const kgPrec = Math.max(...sets.map(s => s.kg || 0));
  const lavoro = sets.filter(s => s.kg === kgPrec);
  if (r && lavoro.length >= Math.min(serie, sets.length) && lavoro.every(s => s.reps >= r.hi)) {
    const kg = caricoFattibile(e, kgPrec + passoKg(e));
    return { tipo: 'su', kg, reps: Array(serie).fill(r.lo), prec: txtPrec,
      testo: `Hai chiuso il range (${txtPrec}). Oggi sali a ${fmt(kg, 2)} kg e riparti da ${r.lo} ripetizioni.` };
  }
  const t = [...reps]; while (t.length < serie) t.push(t.at(-1) ?? (r ? r.lo : 8));
  const iMin = t.indexOf(Math.min(...t.slice(0, serie))); t[iMin]++;
  if (r && t.some(x => x < r.lo) && sets.filter(s => s.kg === kgPrec).every(s => s.reps < r.lo)) {
    return { tipo: 'uguale', kg: kgPrec, reps: Array(serie).fill(r.lo), prec: txtPrec, testo: `L'ultima volta ${txtPrec}: resta a ${fmt(kgPrec, 2)} kg e punta a ${r.lo} ripetizioni pulite.` };
  }
  return { tipo: 'uguale', kg: kgPrec, reps: t.slice(0, serie), prec: txtPrec, testo: `L'ultima volta ${txtPrec}. Stesso carico, prova ${t.slice(0, serie).join(' · ')}.` };
}

/* Riscaldamento consigliato per il primo esercizio pesante con bilanciere */
export function riscaldamento(e, kg) {
  if (attrezzoDi(e) !== 'Bilanciere' || !kg || kg < 30) return [];
  const bar = num(attrezzatura().bilanciere) || 20;
  return [{ kg: bar, reps: 10 }, { kg: caricoFattibile(e, kg * 0.55), reps: 6 }, { kg: caricoFattibile(e, kg * 0.75), reps: 3 }]
    .filter((x, i, a) => i === 0 || x.kg > a[i - 1].kg);
}

/* ---------- Muscoli ---------- */
/* Pronto al 100% dopo 2 giorni, 65% il giorno dopo, 30% lo stesso giorno */
export function muscoliPronti() {
  const oggi = todayISO(), ult = {};
  sorted().forEach(w => w.exercises.forEach(e => { if (e.gruppo && (e.sets || []).length) ult[e.gruppo] = w.date; }));
  const gruppi = new Set(Object.values(S.db.schede).flatMap(sc => sc.esercizi.map(e => e.gruppo)).filter(Boolean));
  return [...gruppi].map(g => {
    const d = ult[g] ? daysBetween(ult[g], oggi) : 99;
    const pct = d >= 2 ? 100 : d === 1 ? 65 : 30;
    return { gruppo: g, pct, giorni: ult[g] ? d : null };
  }).sort((a, b) => b.pct - a.pct || a.gruppo.localeCompare(b.gruppo));
}
/* Serie fatte per gruppo muscolare negli ultimi 7 giorni (o nel periodo) */
export function seriePerGruppo(giorni = 7) {
  const da = isoFrom(giorni - 1), conta = {};
  Object.values(S.db.schede).forEach(sc => sc.esercizi.forEach(e => { if (e.gruppo) conta[e.gruppo] = 0; }));
  sorted().filter(w => w.date >= da).forEach(w => w.exercises.forEach(e => {
    if (!e.gruppo) return; conta[e.gruppo] = (conta[e.gruppo] || 0) + (e.sets || []).length;
  }));
  return Object.entries(conta).map(([gruppo, serie]) => ({ gruppo, serie })).sort((a, b) => b.serie - a.serie);
}
/* Serie a settimana previste dalla scheda (se fai tutte le sessioni una volta) */
export function seriePreviste() {
  const conta = {};
  Object.values(S.db.schede).forEach(sc => sc.esercizi.forEach(e => { if (e.gruppo) conta[e.gruppo] = (conta[e.gruppo] || 0) + (num(e.serie) || 3); }));
  return conta;
}
export function gruppiIndietro() {
  const obj = num(cfg().obiettivoSerie) || 8, prev = seriePreviste();
  const g = Object.entries(prev).filter(([, n]) => n < obj * 0.6).map(([gruppo, n]) => ({ gruppo, n }));
  return g.sort((a, b) => a.n - b.n);
}

/* ---------- Nuova scheda ---------- */
const ATT_OK = ['Bilanciere', 'Manubri', 'Carrucola alta', 'Corpo libero', 'Elastici'];
/* Prepara una proposta: il primo esercizio di ogni sessione resta (per non perdere la progressione)
   ma cambia il range; gli altri ruotano con alternative dello stesso gruppo; i gruppi indietro prendono una serie in più. */
export function propostaScheda() {
  const fase = (S.db.programmi || []).length % 2 === 0 ? 'forza' : 'ipertrofia';
  const usatiPrima = new Set((S.db.programmi || []).flatMap(p => Object.values(p.schede || {}).flatMap(sc => sc.esercizi.map(e => e.nome.toLowerCase()))));
  const attuali = new Set(Object.values(S.db.schede).flatMap(sc => sc.esercizi.map(e => e.nome.toLowerCase())));
  const presi = new Set();
  const indietro = new Set(gruppiIndietro().map(x => x.gruppo));
  const lib = libreria().filter(x => ATT_OK.includes(x.attrezzo) && x.nome !== 'Trazioni');
  const nuove = {};
  for (const [k, sc] of Object.entries(S.db.schede)) {
    const es = sc.esercizi.map((e, i) => {
      if (i === 0 && e.tipo === 'carico') {
        const rip = fase === 'forza' ? '6-8' : '8-12';
        presi.add(e.nome.toLowerCase());
        return { ...e, rip, recupero: fase === 'forza' ? '150 sec' : e.recupero, motivo: `Resta: cambia il range a ${rip} ripetizioni` };
      }
      const cand = lib.filter(x => x.gruppo === e.gruppo && x.tipo === e.tipo && !presi.has(x.nome.toLowerCase()) && !attuali.has(x.nome.toLowerCase()));
      const nuovo = cand.find(x => !usatiPrima.has(x.nome.toLowerCase())) || cand[0];
      if (!nuovo) { presi.add(e.nome.toLowerCase()); return { ...e, motivo: 'Resta: nessuna alternativa con la tua attrezzatura' }; }
      presi.add(nuovo.nome.toLowerCase());
      const last = lastFor(nuovo.nome);
      return { nome: nuovo.nome, gruppo: nuovo.gruppo, tipo: nuovo.tipo, serie: num(e.serie) || 3, rip: nuovo.rip, carico: last ? String(Math.max(...last.ex.sets.map(s => num(s.kg) || 0)) || '') : '',
        recupero: nuovo.recupero, note: nuovo.attrezzo, motivo: `Al posto di ${e.nome}` };
    });
    // Gruppi indietro: una serie in più sull'esercizio di quel gruppo (massimo 4)
    es.forEach(e => { if (indietro.has(e.gruppo) && (num(e.serie) || 3) < 4) { e.serie = (num(e.serie) || 3) + 1; e.motivo += ' • +1 serie (gruppo indietro)'; indietro.delete(e.gruppo); } });
    nuove[k] = { nome: sc.nome, esercizi: es };
  }
  return { fase, schede: nuove };
}
export function applicaScheda(schede) {
  const s = cfg();
  S.db.programmi = [...(S.db.programmi || []), { inizio: s.programmaInizio, fine: todayISO(), schede: JSON.parse(JSON.stringify(S.db.schede)) }];
  S.db.schede = JSON.parse(JSON.stringify(schede));
  Object.values(S.db.schede).forEach(sc => sc.esercizi.forEach(e => delete e.motivo));
  s.programmaInizio = todayISO(); s.programmaRimanda = '';
}
export const rimandaScheda = giorni => { cfg().programmaRimanda = addDays(todayISO(), giorni); };

/* Record battuto durante l'allenamento? */
export function eRecord(nome, kg, reps) {
  const r = records()[nome];
  if (!kg || !reps) return false;
  return !r || kg > r.kg || (kg === r.kg && reps > r.reps);
}
export { libDi };
