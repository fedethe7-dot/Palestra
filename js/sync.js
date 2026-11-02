/* ============ SINCRONIZZAZIONE CON FOGLI GOOGLE ============
   Stesso collegamento della versione precedente (script Apps Script "Palestra Sync"):
   - invio: POST con { type: 'workout' | 'weight' | 'ping', token, dashboard }
   - lettura: GET ?azione=leggi&token=... → { ok, righe, pesi, dashboard } */
import { S, save, cfg, BETA, sorted, bodyKg } from './dati.js';
import { normDate, num, uid, toast, parseISO } from './util.js';
import { libDi } from './libreria.js';
import { app } from './ui.js';
import { ESERCIZI_STORICI } from './dati.js';

let syncing = false, reading = false;

function dashboardInfo() {
  const ws = sorted(), last = ws[ws.length - 1];
  const pesi = [...S.db.weights].sort((a, b) => a.date.localeCompare(b.date));
  return {
    totale: ws.length,
    ultima: last ? `Sessione ${last.session} – ${parseISO(last.date).toLocaleDateString('it-IT')}` : '',
    peso: pesi.length ? pesi.at(-1).kg : '',
    obiettivo: num(cfg().goal) ?? '',
  };
}
export function workoutPayload(w) {
  return { type: 'workout', workout: {
    id: w.id, date: w.date, session: w.session, note: w.note || '',
    kcal: w.kcal || '', kcalFonte: w.kcalFonte || '', durata: w.durata || '',
    exercises: w.exercises.map(e => ({ nome: e.nome, tipo: e.tipo, serie: e.serie ?? '', rip: e.rip ?? '',
      carico: e.carico ?? '', recupero: e.recupero ?? '', note: e.note ?? '',
      sets: e.sets.map(s => ({ reps: s.reps, kg: s.kg, ...(s.rir != null ? { rir: s.rir } : {}) })) })) } };
}
async function inviaAlFoglio(item) {
  const url = (cfg().syncUrl || '').trim();
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...item, token: (cfg().syncToken || '').trim(), dashboard: dashboardInfo() }),
  });
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Errore sconosciuto');
}
export function queue(item) { S.db.outbox.push(item); save(); flush(); }

export async function flush() {
  if (syncing) return { sent: 0, busy: true };
  if (!S.db.outbox.length) return { sent: 0 };
  if (!(cfg().syncUrl || '').trim()) return { sent: 0, error: 'Collegamento non configurato' };
  if (BETA) return { sent: 0, error: 'Copia di prova: invio al foglio disattivato' };
  if (!navigator.onLine) return { sent: 0, error: 'Sei offline: invio appena torni online' };
  syncing = true; let sent = 0, error = '';
  try {
    while (S.db.outbox.length) {
      const item = S.db.outbox[0];
      await inviaAlFoglio(item);
      S.db.outbox.shift(); sent++;
      if (item.type === 'workout') { const w = S.db.workouts.find(x => x.id === item.workout.id); if (w) w.synced = true; }
      cfg().lastSync = new Date().toISOString(); cfg().syncError = '';
      save();
    }
  } catch (e) {
    error = String(e.message || e); cfg().syncError = error; save();
  } finally { syncing = false; app.renderSafe(); }
  return { sent, error };
}
export async function syncNow() {
  const inCoda = new Set(S.db.outbox.filter(o => o.type === 'workout').map(o => o.workout.id));
  S.db.workouts.filter(w => !w.synced && !inCoda.has(w.id)).forEach(w => S.db.outbox.push(workoutPayload(w)));
  save();
  if (!S.db.outbox.length) return toast('✅ Tutto già sincronizzato');
  toast('☁️ Invio in corso...');
  const r = await flush();
  toast(r.error ? `⚠️ ${r.error}` : `☁️ Inviati ${r.sent} elementi al foglio`);
}
export async function testSync() {
  if (!(cfg().syncUrl || '').trim()) return toast('Incolla prima il link dello script');
  try {
    await inviaAlFoglio({ type: 'ping' }); cfg().syncError = ''; save();
    toast('✅ Collegamento riuscito!');
    if (!cfg().lastRead) setTimeout(() => scaricaDalFoglio(), 1500);
  } catch (e) { toast(`⚠️ ${e.message || e}`); cfg().syncError = String(e.message || e); save(); }
  app.render();
}

function infoEsercizi() {
  const info = {};
  Object.values(ESERCIZI_STORICI).forEach(l => l.forEach(e => info[e.nome.toLowerCase()] = e));
  Object.values(S.db.schede).forEach(sc => sc.esercizi.forEach(e => info[e.nome.toLowerCase()] = e));
  return info;
}

/* Legge dal foglio allenamenti e pesate e li unisce a quelli dell'app */
export async function scaricaDalFoglio(silenzioso = false) {
  const url = (cfg().syncUrl || '').trim(), token = (cfg().syncToken || '').trim();
  if (!url) return silenzioso ? null : toast('Incolla prima il link dello script');
  if (reading) return;
  if (!silenzioso) toast('⬇️ Lettura del foglio in corso...');
  let r; reading = true;
  try {
    const res = await fetch(`${url}?azione=leggi&token=${encodeURIComponent(token)}`);
    r = await res.json();
    if (!r.ok) throw new Error(r.error || 'Errore sconosciuto');
  } catch (e) { reading = false; return silenzioso ? null : toast(`⚠️ ${e.message || e}`); }
  reading = false;

  const info = infoEsercizi(), gruppi = {};
  (r.righe || []).forEach(x => {
    x = { ...x, date: normDate(x.date) };
    if (!x.date || !x.nome) return;
    const key = x.date + '|' + x.session;
    const sets = (x.sets || []).map(s => ({ reps: num(s.reps), kg: num(s.kg) })).filter(s => s.reps != null);
    if (!sets.length) return;
    const ref = info[String(x.nome).toLowerCase()] || libDi(x.nome);
    const tipo = ref ? ref.tipo : (sets.some(s => s.kg) ? 'carico' : 'corpo');
    const w = (gruppi[key] ||= { date: x.date, session: x.session, exercises: [], note: '', kcal: null, durata: null });
    if (x.noteSessione && !w.note && !w.kcal) {
      const k = x.noteSessione.match(/kcal:\s*(\d+)(?:\s*\((\w+)\))?/i), d = x.noteSessione.match(/durata:\s*(\d+)/i);
      if (k) { w.kcal = +k[1]; w.kcalFonte = k[2] || 'stima'; }
      if (d) w.durata = +d[1];
      w.note = x.noteSessione.split('•').map(t => t.trim()).filter(t => t && !/^(kcal|durata):/i.test(t)).join(' • ');
    }
    w.exercises.push({ nome: x.nome, gruppo: ref ? ref.gruppo : 'Altro', tipo, serie: num(x.serie) ?? '', rip: x.rip,
      carico: x.carico, recupero: x.recupero, note: x.note,
      sets: sets.map(s => ({ reps: s.reps, kg: tipo === 'carico' ? s.kg : null })) });
  });

  let nuovi = 0, aggiornati = 0;
  Object.entries(gruppi).forEach(([key, g]) => {
    const i = S.db.workouts.findIndex(w => w.date + '|' + w.session === key);
    const w = { ...g, synced: true };
    if (!w.kcal) { delete w.kcal; delete w.kcalFonte; }
    if (!w.durata) delete w.durata;
    if (i < 0) { S.db.workouts.push({ id: uid(), ...w }); nuovi++; }
    else if (S.db.workouts[i].synced) {
      const old = S.db.workouts[i];
      // Il foglio non conosce RIR e note per serie: li tengo dall'app quando l'esercizio è lo stesso
      w.exercises.forEach(e => {
        const oe = old.exercises.find(x => x.nome === e.nome);
        if (oe) e.sets.forEach((s, j) => { if (oe.sets[j]?.rir != null) s.rir = oe.sets[j].rir; });
      });
      S.db.workouts[i] = { ...old, ...w, id: old.id, kcal: w.kcal || old.kcal, kcalFonte: w.kcalFonte || old.kcalFonte };
      aggiornati++;
    }
  });
  const datePesi = new Set(S.db.weights.map(p => p.date));
  let pesiNuovi = 0;
  (r.pesi || []).forEach(p => { const kg = num(p.kg); const date = normDate(p.date);
    if (kg && date && !datePesi.has(date) && !(S.db.pesiTolti || {})[date]) { S.db.weights.push({ id: uid(), date, kg }); datePesi.add(date); pesiNuovi++; } });
  const dash = r.dashboard || {};
  if (!cfg().goal && num(dash.obiettivo)) cfg().goal = String(num(dash.obiettivo));
  cfg().lastRead = new Date().toISOString(); save(); app.renderSafe();
  if (pesiNuovi) import('./ponte-salute.js').then(m => m.sincronizzaSalute({ avvisa: false })).catch(() => {});   // le pesate nuove dal foglio vanno anche in Salute
  if (!silenzioso || nuovi || pesiNuovi)
    toast(`✅ Dal foglio: ${nuovi} allenamenti nuovi${silenzioso ? '' : `, ${aggiornati} aggiornati`}, ${pesiNuovi} pesate`);
  return { nuovi, aggiornati, pesiNuovi };
}

/* All'apertura: prima invia la coda, poi rilegge il foglio (al massimo ogni 10 minuti) */
export async function aggiornaTutto() {
  await flush();
  const ultima = cfg().lastRead ? Date.now() - new Date(cfg().lastRead) : Infinity;
  if (ultima > 10 * 60 * 1000 && navigator.onLine && cfg().syncUrl) scaricaDalFoglio(true);
  backupAutomatico();
}
export { bodyKg };

/* ---------- Backup completo nel foglio (script "Palestra Backup") ----------
   Uno script a parte, così quello degli allenamenti resta com'è.
   POST { type:'ping' } → { ok, funzioni:['backup'] }   POST { type:'backup', dati, quando } → { ok, backup:true }
   GET ?azione=backup&token=... → { ok, dati, quando } */
const OGNI_GIORNI = 7;
const urlBackup = () => (cfg().backupUrl || '').trim();
async function chiamaBackup(item) {
  const res = await fetch(urlBackup(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...item, token: (cfg().syncToken || '').trim() }) });
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Errore sconosciuto');
  return r;
}
export const copiaPerBackup = () => { const { draft, outbox, ...resto } = S.db; return resto; };
export async function backupNelFoglio(manuale = false) {
  if (!urlBackup()) { if (manuale) toast('Incolla prima il link dello script di backup'); return false; }
  if (BETA || !navigator.onLine) { if (manuale) toast('Sei offline: riprova con internet'); return false; }
  if (manuale) toast('☁️ Backup in corso...');
  try {
    const p = await chiamaBackup({ type: 'ping' });
    if (!(p.funzioni || []).includes('backup')) throw new Error('Questo link non è lo script di backup');
    await chiamaBackup({ type: 'backup', quando: new Date().toISOString(), dati: JSON.stringify(copiaPerBackup()) });
    cfg().ultimoBackup = new Date().toISOString(); cfg().backupErrore = ''; save();
    if (manuale) toast('✅ Backup salvato nel foglio');
    return true;
  } catch (e) {
    cfg().backupErrore = String(e.message || e); save();
    if (manuale) toast(`⚠️ ${cfg().backupErrore}`);
    return false;
  } finally { app.renderSafe(); }
}
/* All'apertura: se l'ultimo backup ha più di 7 giorni lo rifà da solo */
export function backupAutomatico() {
  if (!urlBackup()) return;
  const u = cfg().ultimoBackup ? new Date(cfg().ultimoBackup).getTime() : 0;
  if (Date.now() - u > OGNI_GIORNI * 86400000) backupNelFoglio(false);
}
export async function leggiBackup() {
  const res = await fetch(`${urlBackup()}?azione=backup&token=${encodeURIComponent((cfg().syncToken || '').trim())}`);
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Errore sconosciuto');
  if (!r.dati) throw new Error('Nel foglio non c\'è ancora nessun backup');
  return { dati: JSON.parse(r.dati), quando: r.quando };
}
