/* ============ DATI ============
   Tutto quello che l'app ricorda sta in un unico oggetto (S.db) salvato nel telefono (localStorage).
   La struttura è compatibile con le versioni precedenti: migra() aggiunge solo i campi nuovi. */
import { normDate, todayISO, uid, num, parseISO, isoOf, weekStart, addDays, isoFrom, daysBetween } from './util.js';

export const VERSIONE = '6.4.1';

/* ---------- Le tue schede di partenza (carichi aggiornati dalla Dashboard del foglio) ---------- */
export const SCHEDE_DEFAULT = {
  A: { nome: 'Petto • Spalle • Tricipiti', esercizi: [
    { nome: 'Panca Piana', gruppo: 'Petto', tipo: 'carico', serie: 3, rip: '8-12', carico: '42', recupero: '2 min', note: 'Bilanciere' },
    { nome: 'Croci su Panca', gruppo: 'Petto', tipo: 'carico', serie: 3, rip: '10-12', carico: '11', recupero: '90 sec', note: 'Manubri • discesa in 3 sec' },
    { nome: 'Alzate Laterali', gruppo: 'Spalle', tipo: 'carico', serie: 3, rip: '12-15', carico: '2.5', recupero: '60 sec', note: 'Manubri • pausa in alto' },
    { nome: 'Pushdown Corda', gruppo: 'Tricipiti', tipo: 'carico', serie: 3, rip: '10-15', carico: '13', recupero: '60 sec', note: 'Carrucola alta • corda' },
  ]},
  B: { nome: 'Schiena • Bicipiti • Spalle post.', esercizi: [
    { nome: 'Rematore Bilanciere', gruppo: 'Schiena', tipo: 'carico', serie: 3, rip: '8-12', carico: '40', recupero: '2 min', note: 'Bilanciere' },
    { nome: 'Lat Machine Cavo', gruppo: 'Schiena', tipo: 'carico', serie: 3, rip: '10-12', carico: '23', recupero: '90 sec', note: 'Carrucola alta • in ginocchio' },
    { nome: 'Curl Manubri', gruppo: 'Bicipiti', tipo: 'carico', serie: 3, rip: '8-12', carico: '10', recupero: '90 sec', note: 'Manubri' },
    { nome: 'Face Pull Cavo', gruppo: 'Spalle post.', tipo: 'carico', serie: 3, rip: '12-15', carico: '17', recupero: '60 sec', note: 'Carrucola alta • corda, gomiti alti' },
  ]},
  C: { nome: 'Richiamo e Core', esercizi: [
    { nome: 'Piegamenti', gruppo: 'Petto', tipo: 'corpo', serie: 3, rip: 'Max', carico: '', recupero: '90 sec', note: 'Corpo libero' },
    { nome: 'Pullover Cavo', gruppo: 'Schiena', tipo: 'carico', serie: 3, rip: '12-15', carico: '18', recupero: '60 sec', note: 'Carrucola alta • braccia tese' },
    { nome: 'Hammer Curl', gruppo: 'Bicipiti', tipo: 'carico', serie: 3, rip: '10-12', carico: '10', recupero: '90 sec', note: 'Manubri' },
    { nome: 'Plank', gruppo: 'Core', tipo: 'tempo', serie: 3, rip: '45-60', carico: '', recupero: '60 sec', note: 'Corpo libero' },
  ]},
};
/* Esercizi del vecchio programma: servono solo a riconoscere lo storico */
export const ESERCIZI_STORICI = {
  A: [{ nome: 'Estensioni Tricipiti', gruppo: 'Tricipiti', tipo: 'carico' }],
  B: [{ nome: 'Rematore manubrio', gruppo: 'Schiena', tipo: 'carico' }, { nome: 'Face Pull', gruppo: 'Spalle post.', tipo: 'carico' }],
  C: [{ nome: 'Pullover', gruppo: 'Schiena', tipo: 'carico' }],
};
export const copiaSchede = () => JSON.parse(JSON.stringify(SCHEDE_DEFAULT));

/* Attrezzatura (dalla scheda "Pesi" del foglio): dischi in kg con quantità totale */
export const ATTREZZATURA_DEFAULT = {
  bilanciere: 20,
  dischi: [
    { kg: 20, qta: 2, carrucola: false }, { kg: 5, qta: 4, carrucola: true }, { kg: 2.5, qta: 4, carrucola: true },
    { kg: 2, qta: 8, carrucola: true }, { kg: 1.25, qta: 4, carrucola: true }, { kg: 0.5, qta: 8, carrucola: true },
  ],
  carrucolaMax: 30,
  passoBilanciere: 2, passoManubri: 1, passoCarrucola: 1,
};

/* Sezioni della schermata Oggi, nell'ordine scelto */
export const SEZIONI_HOME = [
  ['allenamento', 'Allenamento di oggi'], ['programma', 'Avviso cambio scheda'], ['resoconto', 'Resoconto della settimana (lun-mer)'], ['settimana', 'La tua settimana'],
  ['muscoli', 'Muscoli pronti'], ['numeri', 'Numeri rapidi'], ['attivita', 'Movimento e attività extra'], ['cucina', 'Cucina di oggi'],
  ['record', 'Ultimo record'], ['ultimo', 'Ultimo allenamento'],
];

export const SETTINGS_DEFAULT = {
  name: '', goal: '', syncUrl: '', syncToken: '', backupUrl: '', ultimoBackup: '', backupErrore: '', resocontoVisto: '', lastSync: '', syncError: '', lastRead: '',
  altezza: '', eta: '', attivita: '1.55', fase: 'massa', grassoObj: '', ricetteVer: 0,
  // Aspetto
  stile: 'vetro', modo: 'auto', accento: '', testo: 1, carattere: 'stile', animazioni: 'normali',
  home: SEZIONI_HOME.map(([k]) => ({ k, on: true })),
  // Allenamento
  programmaInizio: '', programmaSettimane: 8, programmaRimanda: '',
  recuperoAuto: true, obiettivoSerie: 8, giorniSettimana: 3,
  // Timer
  suono: true, vibrazione: true, conto321: true, avviso10: true, schermoAcceso: true, notifiche: false,
  attrezzatura: null,
  // Nomi dei tipi di sessione dell'orologio (es. { 18: 'Calcetto' })
  tipiOrologio: {},
};

/* ---------- Copia di prova (/Palestra/beta/): dati copiati, niente invio al foglio ---------- */
export const BETA = /\/beta\/?/.test(location.pathname);
export const KEY = BETA ? 'palestra-dati-beta' : 'palestra-dati';
try { if (BETA && !localStorage.getItem(KEY) && localStorage.getItem('palestra-dati')) localStorage.setItem(KEY, localStorage.getItem('palestra-dati')); } catch (e) {}

/* Sistema le date e toglie righe senza data o doppie (stesso giorno + stessa sessione) */
export function pulisciAllenamenti(list) {
  const out = {};
  (list || []).forEach(w => {
    const date = normDate(w.date); if (!date) return;
    const x = { ...w, date, exercises: w.exercises || [] }, k = date + '|' + x.session, old = out[k];
    const nSet = y => (y.exercises || []).reduce((t, e) => t + (e.sets || []).length, 0);
    if (!old || (old.synced && !x.synced) || (old.synced === x.synced && nSet(x) > nSet(old))) out[k] = x;
  });
  return Object.values(out);
}

export function migra(d) {
  d = d || {};
  const settings = { ...SETTINGS_DEFAULT, ...(d.settings || {}) };
  // Vecchi temi (viola, aurora...) → nuovi stili
  if (!d.settings?.stile && d.settings?.accent) settings.stile = ['aurora', 'natura'].includes(d.settings.accent) ? 'vetro' : 'essenziale';
  if (d.settings?.theme && !d.settings?.modo) settings.modo = { auto: 'auto', light: 'chiaro', dark: 'scuro' }[d.settings.theme] || 'auto';
  // Sezioni della home: quelle nuove entrano nella loro posizione (dopo la sezione che le precede)
  const note = new Set((settings.home || []).map(x => x.k));
  const home = (settings.home || []).filter(x => SEZIONI_HOME.some(([k]) => k === x.k));
  SEZIONI_HOME.forEach(([k], i) => { if (note.has(k)) return; const prima = i ? home.findIndex(x => x.k === SEZIONI_HOME[i - 1][0]) : -1; home.splice(prima + 1, 0, { k, on: true }); });
  settings.home = home;
  settings.attrezzatura = { ...JSON.parse(JSON.stringify(ATTREZZATURA_DEFAULT)), ...(settings.attrezzatura || {}) };
  const workouts = pulisciAllenamenti(d.workouts);
  // Fabbisogno dai dati reali (orologio + attività + palestra): attivato una volta, si può cambiare in Impostazioni
  if (!settings.attivitaAutoAttivata) { settings.attivita = 'auto'; settings.attivitaAutoAttivata = true; }
  if (!settings.programmaInizio) {
    const primo = workouts.map(w => w.date).sort()[0];
    settings.programmaInizio = primo || todayISO();
  }
  return {
    version: 3,
    workouts,
    weights: (d.weights || []).map(p => ({ ...p, id: p.id || uid(), date: normDate(p.date) })).filter(p => p.date),
    body: (d.body || []).map(p => ({ ...p, id: p.id || uid(), date: normDate(p.date) })).filter(p => p.date),
    misure: (d.misure || []).filter(m => normDate(m.date)),
    settings,
    schede: d.schede || copiaSchede(),
    programmi: d.programmi || [],
    eserciziMiei: d.eserciziMiei || [],
    draft: d.draft ? { cur: 0, ...d.draft } : null,
    outbox: d.outbox || [],
    ricette: d.ricette || [],
    ricetteTolte: d.ricetteTolte || [],
    pasti: d.pasti || [],
    piatti: d.piatti || [],
    spesa: d.spesa || [],
    // Orologio: giorni { 'AAAA-MM-GG': [passi, metri, kcal] } e sessioni; attività extra scritte a mano
    orologio: d.orologio && d.orologio.giorni ? d.orologio : { giorni: {}, sport: [] },
    extra: d.extra || [],
    // Pesate cancellate (qui o in Salute): non devono tornare rileggendo il foglio
    pesiTolti: d.pesiTolti || {},
  };
}

/* Stato condiviso dell'app: dati + schermata corrente */
export const S = { db: null, view: 'oggi', param: null };

export function carica() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.workouts) return migra(d); } catch (e) {}
  return migra({});
}
S.db = carica();
let salvaErr = false;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S.db)); salvaErr = false; }
  catch (e) { if (!salvaErr) { salvaErr = true; alertSpazio(); } }
}
function alertSpazio() { import('./util.js').then(u => u.toast('⚠️ Memoria del telefono piena: fai un backup', 'err')); }
export const cfg = () => S.db.settings;
export const attrezzatura = () => S.db.settings.attrezzatura;

/* ============ CALCOLI SUGLI ALLENAMENTI ============ */
export const sorted = () => [...S.db.workouts].sort((a, b) => a.date.localeCompare(b.date));
export const inPeriod = days => days ? sorted().filter(w => w.date >= isoFrom(days)) : sorted();
export const exVolume = e => e.tipo === 'carico' ? (e.sets || []).reduce((s, x) => s + (num(x.reps) || 0) * (num(x.kg) || 0), 0) : 0;
export const wVolume = w => w.exercises.reduce((s, e) => s + exVolume(e), 0);
export const exMaxKg = e => Math.max(0, ...(e.sets || []).map(s => num(s.kg) || 0));
export const exReps = e => (e.sets || []).reduce((s, x) => s + (num(x.reps) || 0), 0);
/* Massimale stimato (formula di Epley), affidabile fino a circa 12 ripetizioni */
export const e1rm = (kg, reps) => !kg || !reps ? 0 : reps === 1 ? kg : kg * (1 + Math.min(reps, 15) / 30);
export const exE1rm = e => Math.max(0, ...(e.sets || []).map(s => e1rm(num(s.kg), num(s.reps))));

export function lastFor(name, date) {
  const ws = sorted().reverse(), n = String(name).toLowerCase();
  for (const w of ws) {
    if (date && w.date > date) continue;
    const e = w.exercises.find(x => x.nome.toLowerCase() === n);
    if (e) return { date: w.date, ex: e, w };
  }
  return null;
}
export function nextSession() {
  const keys = Object.keys(S.db.schede), ws = sorted();
  if (!ws.length || !keys.length) return keys[0];
  const i = keys.indexOf(ws[ws.length - 1].session);
  return keys[(i + 1) % keys.length];
}
export function records() {
  const r = {};
  sorted().forEach(w => w.exercises.forEach(e => {
    if (e.tipo !== 'carico') return;
    (e.sets || []).forEach(s => {
      const kg = num(s.kg), reps = num(s.reps);
      if (!kg || !reps) return;
      const c = r[e.nome];
      if (!c || kg > c.kg || (kg === c.kg && reps > c.reps)) r[e.nome] = { kg, reps, date: w.date };
    });
  }));
  return r;
}
export function streakWeeks() {
  const set = new Set(S.db.workouts.map(w => weekStart(parseISO(w.date))));
  const d = parseISO(weekStart()); let n = 0;
  if (!set.has(isoOf(d))) d.setDate(d.getDate() - 7);
  while (set.has(isoOf(d))) { n++; d.setDate(d.getDate() - 7); }
  return n;
}

/* ============ CORPO E CALORIE ============ */
export const MET_PESI = 4, PESO_DEFAULT = 73;
export function bodyKg() {
  const w = [...S.db.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  return w ? w.kg : PESO_DEFAULT;
}
export function durataAuto(d) {
  if (d.startedAt) return Math.min(180, Math.max(1, Math.round((Date.now() - d.startedAt) / 60000)));
  return Math.round(d.exercises.reduce((s, e) => s + e.sets.length, 0) * 2.5);
}
/* Tempo dell'allenamento: non conta le ore in cui l'app è rimasta aperta senza fare niente */
const ORA = 3600000;
export function riallineaTempo(d) {
  if (!d || !d.startedAt) return false;
  const ora = Date.now(), fatte = d.exercises.some(e => e.sets.some(s => s.done));
  if (!fatte) { if (ora - d.startedAt > ORA) { d.startedAt = ora; return true; } return false; }
  const ult = d.ultimaAttivita || d.startedAt;
  if (ora - ult > 2 * ORA) { d.startedAt += ora - ult; d.ultimaAttivita = ora; return true; }
  return false;
}
export const durataDraft = d => num(d.durata) || durataAuto(d);
export function kcalAlMinuto() {
  const o = S.db.workouts.filter(w => w.kcalFonte === 'orologio' && w.kcal && w.durata).slice(-10);
  if (o.length) return o.reduce((s, w) => s + w.kcal / w.durata, 0) / o.length;
  return MET_PESI * bodyKg() / 60;
}
export const stimaKcal = min => Math.round(kcalAlMinuto() * min);

export const ATTIVITA = [
  ['auto', 'Automatico', 'passi dell\'orologio + attività extra + palestra'],
  ['1.2', 'Sedentario', 'lavoro seduto, niente sport'],
  ['1.375', 'Leggero', 'lavoro seduto + 1-2 allenamenti'],
  ['1.55', 'Moderato', 'lavoro seduto + 3 allenamenti o calcio'],
  ['1.725', 'Alto', 'allenamenti + sport quasi ogni giorno'],
];
export const FASI = [
  ['definizione', 'Definizione', 'Perdere grasso tenendo il muscolo'],
  ['mantenimento', 'Mantenimento', 'Stesso peso, migliorare la forma'],
  ['massa', 'Massa pulita', 'Aumento lento, poco grasso'],
];
/* ---------- Orologio e attività: kcal attive reali ---------- */
export const TIPI_OROLOGIO = { 1: 'Corsa', 6: 'Camminata', 9: 'Bici', 18: 'Calcetto', 52: 'Palestra' };
export const nomeTipoOrologio = t => (cfg().tipiOrologio || {})[t] || TIPI_OROLOGIO[t] || `Attività (tipo ${t})`;
export const sessionePalestra = s => s.tipo === '52' || /palestra|pesi|forza/i.test(nomeTipoOrologio(s.tipo));
/* Stessa attività anche con nomi diversi ("Calcio" scritto a mano = "Calcetto" dell'orologio) */
export function categoriaAttivita(nome) {
  const n = String(nome || '').toLowerCase();
  return /calc|partit|footb|soccer/.test(n) ? 'calcio' : /palestr|pesi|forza|gym/.test(n) ? 'palestra' : /cors|run/.test(n) ? 'corsa'
    : /cammin|passegg|escurs|trek|hik/.test(n) ? 'camminata' : /bici|cicl|mtb|bike/.test(n) ? 'bici' : /nuot|swim|piscin/.test(n) ? 'nuoto' : n.trim();
}
export const chiaveAttivita = (data, nome) => data + '|' + categoriaAttivita(nome);
export const BASE_SEDENTARIO = 1.2, GIORNI_MEDIA = 28;
/* Media al giorno delle kcal attive nelle ultime 4 settimane, senza doppioni:
   - passi: kcal del giorno dell'orologio meno le sessioni che l'orologio ha registrato quel giorno
   - palestra: kcal degli allenamenti dell'app (o la sessione dell'orologio nei giorni senza allenamento nell'app)
   - extra: attività scritte a mano (calcio…) + sessioni dell'orologio che non hai scritto tu (se le scrivi tu vale la tua)
   Il periodo finisce all'ultimo giorno importato dall'orologio (se è recente), così i giorni non ancora importati non abbassano la media. */
export function attivitaMedia(giorni = GIORNI_MEDIA) {
  const o = S.db.orologio || { giorni: {}, sport: [] }, oggi = todayISO();
  const dateOro = Object.keys(o.giorni || {}).sort(), ultimo = dateOro.at(-1);
  const fine = ultimo && ultimo <= oggi && daysBetween(ultimo, oggi) <= 14 ? ultimo : oggi, inizio = addDays(fine, -(giorni - 1));
  const dentro = d => d >= inizio && d <= fine;
  const sess = (o.sport || []).filter(s => dentro(s.data));
  const kcalSess = d => sess.filter(s => s.data === d).reduce((t, s) => t + (s.kcal || 0), 0);
  const passiGiorni = dateOro.filter(dentro).map(d => Math.max(0, (o.giorni[d][2] || 0) - kcalSess(d)));
  const ws = S.db.workouts.filter(w => dentro(w.date)), giorniApp = new Set(ws.map(w => w.date));
  let palestra = ws.reduce((t, w) => t + (num(w.kcal) || stimaKcal(num(w.durata) || 50)), 0), extra = 0;
  const scritte = (S.db.extra || []).filter(e => dentro(e.data)), chiaviScritte = new Set(scritte.map(e => chiaveAttivita(e.data, e.nome)));
  scritte.forEach(e => {
    if (categoriaAttivita(e.nome) !== 'palestra') extra += num(e.kcal) || 0;
    else if (!giorniApp.has(e.data)) { palestra += num(e.kcal) || 0; giorniApp.add(e.data); }   // palestra scritta come attività: una volta per giorno
  });
  sess.forEach(s => {
    if (sessionePalestra(s)) { if (!giorniApp.has(s.data)) palestra += s.kcal || 0; }
    else if (!chiaviScritte.has(chiaveAttivita(s.data, nomeTipoOrologio(s.tipo)))) extra += s.kcal || 0;
  });
  const passi = passiGiorni.length ? passiGiorni.reduce((a, b) => a + b, 0) / passiGiorni.length : 0;
  return { inizio, fine, giorni, giorniPassi: passiGiorni.length, passi, palestra: palestra / giorni, extra: extra / giorni, totale: passi + (palestra + extra) / giorni };
}

export const bodySorted = () => [...S.db.body].sort((a, b) => a.date.localeCompare(b.date));
export function corpoCalcoli() {
  const s = cfg(), ms = bodySorted();
  const pesi = [...S.db.weights].sort((a, b) => a.date.localeCompare(b.date));
  const ultimaMis = ms.at(-1), ultimoPeso = pesi.at(-1);
  const kg = ultimaMis && (!ultimoPeso || ultimaMis.date >= ultimoPeso.date) ? ultimaMis.kg : ultimoPeso ? ultimoPeso.kg : null;
  const conGrasso = ms.filter(m => m.fat != null && m.fat !== '').at(-1);
  const fat = conGrasso ? num(conGrasso.fat) : null;
  const h = num(s.altezza), eta = num(s.eta), auto = String(s.attivita) === 'auto', att = auto ? 1.55 : num(s.attivita) || 1.55;
  const r = { kg, fat, h, eta, att, fase: s.fase || 'massa', dataGrasso: conGrasso?.date };
  if (kg && h) r.bmi = kg / Math.pow(h / 100, 2);
  if (kg && fat != null) { r.magra = kg * (1 - fat / 100); r.grassoKg = kg - r.magra; }
  // Metabolismo basale: Katch-McArdle se conosco la % di grasso, altrimenti Mifflin-St Jeor
  if (r.magra) { r.bmr = 370 + 21.6 * r.magra; r.formula = 'Katch-McArdle (usa la massa magra)'; }
  else if (kg && h && eta) { r.bmr = 10 * kg + 6.25 * h - 5 * eta + 5; r.formula = 'Mifflin-St Jeor (peso, altezza, età)'; }
  if (r.bmr) {
    if (auto) {
      r.attivita = attivitaMedia();
      if (r.attivita.giorniPassi >= 7) { r.tdee = r.bmr * BASE_SEDENTARIO + r.attivita.totale; r.att = r.tdee / r.bmr; r.attAuto = true; }
      else { r.tdee = r.bmr * att; r.attAutoManca = true; }   // pochi dati dell'orologio: livello moderato
    } else r.tdee = r.bmr * att;
    r.delta = r.fase === 'definizione' ? -Math.min(500, Math.round(r.tdee * 0.2)) : r.fase === 'massa' ? 200 : 0;
    r.kcal = Math.round((r.tdee + r.delta) / 10) * 10;
    const pg = r.fase === 'definizione' ? 2.2 : 2.0, gg = r.fase === 'definizione' ? 0.8 : 0.9;
    r.prot = Math.round(kg * pg); r.grassi = Math.round(kg * gg);
    r.carbo = Math.max(0, Math.round((r.kcal - r.prot * 4 - r.grassi * 9) / 4));
  }
  const obj = num(s.grassoObj);
  if (obj && r.magra && obj > 3 && obj < 40) {
    r.obj = obj; r.pesoObj = r.magra / (1 - obj / 100); r.daPerdere = kg - r.pesoObj;
    if (r.daPerdere > 0.2) r.settimane = Math.ceil(r.daPerdere / Math.max(0.3, kg * 0.006));
  }
  return r;
}
/* Obiettivi del giorno per la cucina: dal calcolo del corpo, oppure una stima col peso */
export function obiettiviGiorno() {
  const r = corpoCalcoli();
  if (r.kcal) return { kcal: r.kcal, p: r.prot, c: r.carbo, f: r.grassi, stimato: false };
  const kg = bodyKg(), kcal = Math.round(kg * 33 / 10) * 10 + (cfg().fase === 'massa' ? 200 : cfg().fase === 'definizione' ? -400 : 0);
  const p = Math.round(kg * 2), f = Math.round(kg * 0.9);
  return { kcal, p, f, c: Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4)), stimato: true };
}

/* Settimane passate dall'inizio del programma */
export function statoProgramma() {
  const s = cfg(), inizio = s.programmaInizio || todayISO(), sett = num(s.programmaSettimane) || 8;
  const fine = addDays(inizio, sett * 7), oggi = todayISO();
  const fatte = Math.max(0, daysBetween(inizio, oggi)) / 7;
  const mancano = daysBetween(oggi, fine);
  const rimandato = s.programmaRimanda && s.programmaRimanda > oggi;
  return { inizio, fine, settimane: sett, fatte, mancano, scaduto: mancano <= 0, vicino: mancano <= 10, rimandato, pct: Math.min(1, fatte / sett) };
}
