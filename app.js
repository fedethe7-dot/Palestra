'use strict';

/* ============ 1. LE TUE SCHEDE ============ */
const SCHEDE_DEFAULT = {
  A: { nome: 'Petto • Spalle • Tricipiti', esercizi: [
    { nome: 'Panca Piana', gruppo: 'Petto', tipo: 'carico', serie: 3, rip: '8-12', carico: '38', recupero: '2 min', note: 'Bilanciere' },
    { nome: 'Croci su Panca', gruppo: 'Petto', tipo: 'carico', serie: 3, rip: '10-12', carico: '10', recupero: '90 sec', note: 'Manubri • discesa in 3 sec' },
    { nome: 'Alzate Laterali', gruppo: 'Spalle', tipo: 'carico', serie: 3, rip: '12-15', carico: '2.5', recupero: '60 sec', note: 'Manubri • pausa in alto, discesa in 3 sec' },
    { nome: 'Pushdown Corda', gruppo: 'Tricipiti', tipo: 'carico', serie: 3, rip: '10-15', carico: '10', recupero: '60 sec', note: 'Carrucola alta • corda' },
  ]},
  B: { nome: 'Schiena • Bicipiti • Spalle post.', esercizi: [
    { nome: 'Rematore Bilanciere', gruppo: 'Schiena', tipo: 'carico', serie: 3, rip: '8-12', carico: '38', recupero: '2 min', note: 'Bilanciere' },
    { nome: 'Lat Machine Cavo', gruppo: 'Schiena', tipo: 'carico', serie: 3, rip: '10-12', carico: '15', recupero: '90 sec', note: 'Carrucola alta • in ginocchio' },
    { nome: 'Curl Manubri', gruppo: 'Bicipiti', tipo: 'carico', serie: 3, rip: '8-12', carico: '10', recupero: '90 sec', note: 'Manubri' },
    { nome: 'Face Pull Cavo', gruppo: 'Spalle post.', tipo: 'carico', serie: 3, rip: '12-15', carico: '5', recupero: '60 sec', note: 'Carrucola alta • corda' },
  ]},
  C: { nome: 'Richiamo e Core', esercizi: [
    { nome: 'Piegamenti', gruppo: 'Petto', tipo: 'corpo', serie: 3, rip: 'Max (15x2)', carico: '', recupero: '90 sec' },
    { nome: 'Pullover Cavo', gruppo: 'Schiena', tipo: 'carico', serie: 3, rip: '12-15', carico: '10', recupero: '60 sec', note: 'Carrucola alta • braccia tese' },
    { nome: 'Hammer Curl', gruppo: 'Bicipiti', tipo: 'carico', serie: 3, rip: '10-12', carico: '8', recupero: '90 sec' },
    { nome: 'Plank', gruppo: 'Core', tipo: 'tempo', serie: 3, rip: '45-60', carico: '', recupero: '60 sec' },
  ]},
};
/* Esercizi del vecchio programma: servono solo a riconoscere lo storico (gruppo muscolare e sessione) */
const ESERCIZI_STORICI = {
  A: [{ nome: 'Estensioni Tricipiti', gruppo: 'Tricipiti', tipo: 'carico' }],
  B: [{ nome: 'Rematore manubrio', gruppo: 'Schiena', tipo: 'carico' }, { nome: 'Face Pull', gruppo: 'Spalle post.', tipo: 'carico' }],
  C: [{ nome: 'Pullover', gruppo: 'Schiena', tipo: 'carico' }],
};
function infoEsercizi() {
  const info = {}, sesOf = {};
  const add = (k, e) => { info[e.nome.toLowerCase()] = e; sesOf[e.nome.toLowerCase()] = k; };
  Object.entries(ESERCIZI_STORICI).forEach(([k, l]) => l.forEach(e => add(k, e)));
  Object.entries(db.schede).forEach(([k, sc]) => sc.esercizi.forEach(e => add(k, e)));
  return { info, sesOf };
}
const copiaSchede = () => JSON.parse(JSON.stringify(SCHEDE_DEFAULT));

/* Calorie: MET per allenamento con i pesi (≈300 kcal/ora a 73 kg) e peso corporeo di riserva.
   Se inserisci le kcal dell'orologio, la stima si tara da sola sui tuoi dati. */
const MET_PESI = 4;
const PESO_DEFAULT = 73;

/* ============ 2. SALVATAGGIO SUL TELEFONO ============ */
const KEY = 'palestra-dati';
function migrate(d) {
  return {
    version: 2,
    workouts: d.workouts || [],
    weights: d.weights || [],
    settings: { name: '', theme: 'auto', goal: '', syncUrl: '', syncToken: '', lastSync: '', syncError: '', lastRead: '', ...(d.settings || {}) },
    schede: d.schede || copiaSchede(),
    draft: d.draft || null,
    outbox: d.outbox || [],
  };
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.workouts) return migrate(d); } catch (e) {}
  return migrate({});
}
let db = load();
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }

/* ============ 3. FUNZIONI DI SUPPORTO ============ */
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isoOf = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const todayISO = () => isoOf(new Date());
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const isoFrom = days => addDays(todayISO(), -days);
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const fmtDate = s => parseISO(s).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
const fmtDateLong = s => parseISO(s).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
const fmt = (n, d = 0) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString('it-IT', { maximumFractionDigits: d });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const head = (t, p = '') => `<div class="header"><h1>${t}</h1>${p ? `<p>${p}</p>` : ''}</div>`;
const emptyBox = t => `<div class="empty">${t}</div>`;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function weekStart(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return isoOf(x); }
function restSec(s) { const n = num(s); if (n == null) return 90; return /min/i.test(s) ? n * 60 : n; }

/* ============ 4. CALCOLI ============ */
const sorted = () => [...db.workouts].sort((a, b) => a.date.localeCompare(b.date));
const inPeriod = days => days ? sorted().filter(w => w.date >= isoFrom(days)) : sorted();
const exVolume = e => e.tipo === 'carico' ? e.sets.reduce((s, x) => s + (x.reps || 0) * (x.kg || 0), 0) : 0;
const wVolume = w => w.exercises.reduce((s, e) => s + exVolume(e), 0);
const exMaxKg = e => Math.max(0, ...e.sets.map(s => s.kg || 0));
const exReps = e => e.sets.reduce((s, x) => s + (x.reps || 0), 0);

function lastFor(name, date) {
  const ws = sorted().reverse();
  for (const w of ws) {
    if (date && w.date > date) continue;
    const e = w.exercises.find(x => x.nome.toLowerCase() === name.toLowerCase());
    if (e) return { date: w.date, ex: e };
  }
  return null;
}
function nextSession() {
  const keys = Object.keys(db.schede), ws = sorted();
  if (!ws.length || !keys.length) return keys[0];
  const i = keys.indexOf(ws[ws.length - 1].session);
  return keys[(i + 1) % keys.length];
}
function records() {
  const r = {};
  sorted().forEach(w => w.exercises.forEach(e => {
    if (e.tipo !== 'carico') return;
    e.sets.forEach(s => {
      if (!s.kg) return;
      const c = r[e.nome];
      if (!c || s.kg > c.kg || (s.kg === c.kg && s.reps > c.reps)) r[e.nome] = { kg: s.kg, reps: s.reps, date: w.date };
    });
  }));
  return r;
}
function streakWeeks() {
  const set = new Set(db.workouts.map(w => weekStart(parseISO(w.date))));
  const d = parseISO(weekStart()); let n = 0;
  if (!set.has(isoOf(d))) d.setDate(d.getDate() - 7);
  while (set.has(isoOf(d))) { n++; d.setDate(d.getDate() - 7); }
  return n;
}
function suggestion(e, sets) {
  const reps = sets.map(s => s.reps || 0), txt = reps.join('-');
  if (e.tipo === 'tempo') return `L'ultima volta ${txt} sec. Prova a tenere qualche secondo in più.`;
  const hi = (String(e.rip).match(/\d+/g) || []).map(Number)[1];
  if (e.tipo === 'carico' && hi && reps.length >= e.serie && reps.every(r => r >= hi))
    return `L'ultima volta hai chiuso il range (${txt}). Prova ad aumentare un po' il carico.`;
  const t = [...reps]; t[t.indexOf(Math.min(...t))]++;
  return `L'ultima volta hai fatto ${txt}. Prova a raggiungere ${t.join('-')}.`;
}

/* Calorie */
function bodyKg() {
  const w = [...db.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  return w ? w.kg : PESO_DEFAULT;
}
function durataAuto(d) {
  if (d.startedAt) return Math.min(180, Math.max(1, Math.round((Date.now() - d.startedAt) / 60000)));
  return Math.round(d.exercises.reduce((s, e) => s + e.sets.length, 0) * 2.5);
}
const durataDraft = d => num(d.durata) || durataAuto(d);
function kcalAlMinuto() {
  const o = db.workouts.filter(w => w.kcalFonte === 'orologio' && w.kcal && w.durata).slice(-10);
  if (o.length) return o.reduce((s, w) => s + w.kcal / w.durata, 0) / o.length;
  return MET_PESI * bodyKg() / 60;
}
const stimaKcal = min => Math.round(kcalAlMinuto() * min);
const kcalLine = d => { const m = durataDraft(d);
  return `Stima: <b>~${stimaKcal(m)} kcal</b> (${m} min • ${fmt(bodyKg(), 1)} kg)`; };

/* ============ 5. SINCRONIZZAZIONE CON FOGLI GOOGLE ============ */
let syncing = false, reading = false;
/* Ridisegna solo se non stai scrivendo in un campo (così non perdi quello che digiti) */
function safeRender() {
  const a = document.activeElement;
  if (!a || !['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) render();
}

function dashboardInfo() {
  const ws = sorted(), last = ws[ws.length - 1];
  const pesi = [...db.weights].sort((a, b) => a.date.localeCompare(b.date));
  return {
    totale: ws.length,
    ultima: last ? `Sessione ${last.session} – ${parseISO(last.date).toLocaleDateString('it-IT')}` : '',
    peso: pesi.length ? pesi.at(-1).kg : '',
    obiettivo: num(db.settings.goal) ?? '',
  };
}
function workoutPayload(w) {
  return { type: 'workout', workout: {
    id: w.id, date: w.date, session: w.session, note: w.note || '',
    kcal: w.kcal || '', kcalFonte: w.kcalFonte || '', durata: w.durata || '',
    exercises: w.exercises.map(e => ({ nome: e.nome, tipo: e.tipo, serie: e.serie ?? '', rip: e.rip ?? '',
      carico: e.carico ?? '', recupero: e.recupero ?? '', note: e.note ?? '', sets: e.sets })) } };
}
async function inviaAlFoglio(item) {
  const url = (db.settings.syncUrl || '').trim();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...item, token: (db.settings.syncToken || '').trim(), dashboard: dashboardInfo() }),
  });
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Errore sconosciuto');
}
function queue(item) { db.outbox.push(item); save(); flush(); }

async function flush() {
  if (syncing) return { sent: 0, busy: true };
  if (!db.outbox.length) return { sent: 0 };
  if (!(db.settings.syncUrl || '').trim()) return { sent: 0, error: 'Collegamento non configurato' };
  if (!navigator.onLine) return { sent: 0, error: 'Sei offline: invio appena torni online' };
  syncing = true; let sent = 0, error = '';
  try {
    while (db.outbox.length) {
      const item = db.outbox[0];
      await inviaAlFoglio(item);
      db.outbox.shift(); sent++;
      if (item.type === 'workout') { const w = db.workouts.find(x => x.id === item.workout.id); if (w) w.synced = true; }
      db.settings.lastSync = new Date().toISOString(); db.settings.syncError = '';
      save();
    }
  } catch (e) {
    error = String(e.message || e); db.settings.syncError = error; save();
  } finally {
    syncing = false;
    safeRender();
  }
  return { sent, error };
}
async function syncNow() {
  const inCoda = new Set(db.outbox.filter(o => o.type === 'workout').map(o => o.workout.id));
  db.workouts.filter(w => !w.synced && !inCoda.has(w.id)).forEach(w => db.outbox.push(workoutPayload(w)));
  save();
  if (!db.outbox.length) return toast('✅ Tutto già sincronizzato');
  toast('☁️ Invio in corso...');
  const r = await flush();
  toast(r.error ? `⚠️ ${r.error}` : `☁️ Inviati ${r.sent} elementi a Fogli Google`);
}
async function testSync() {
  if (!(db.settings.syncUrl || '').trim()) return toast('Incolla prima il link dello script');
  try {
    await inviaAlFoglio({ type: 'ping' }); db.settings.syncError = ''; save();
    toast('✅ Collegamento riuscito!');
    if (!db.settings.lastRead) setTimeout(scaricaDalFoglio, 1500);
  } catch (e) { toast(`⚠️ ${e.message || e}`); db.settings.syncError = String(e.message || e); save(); }
  render();
}

/* Legge dal foglio tutti gli allenamenti e le pesate e li unisce a quelli dell'app */
async function scaricaDalFoglio(silenzioso = false) {
  const url = (db.settings.syncUrl || '').trim(), token = (db.settings.syncToken || '').trim();
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

  const { info } = infoEsercizi();
  const gruppi = {};
  r.righe.forEach(x => {
    const key = x.date + '|' + x.session;
    const sets = x.sets.map(s => ({ reps: num(s.reps), kg: num(s.kg) })).filter(s => s.reps != null);
    if (!sets.length) return;
    const ref = info[x.nome.toLowerCase()];
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
    const i = db.workouts.findIndex(w => w.date + '|' + w.session === key);
    const w = { ...g, synced: true };
    if (!w.kcal) { delete w.kcal; delete w.kcalFonte; }
    if (!w.durata) delete w.durata;
    if (i < 0) { db.workouts.push({ id: uid(), ...w }); nuovi++; }
    else if (db.workouts[i].synced) {
      const old = db.workouts[i];
      db.workouts[i] = { ...old, ...w, id: old.id, kcal: w.kcal || old.kcal, kcalFonte: w.kcalFonte || old.kcalFonte };
      aggiornati++;
    }
  });
  const datePesi = new Set(db.weights.map(p => p.date));
  let pesiNuovi = 0;
  (r.pesi || []).forEach(p => { const kg = num(p.kg);
    if (kg && !datePesi.has(p.date)) { db.weights.push({ id: uid(), date: p.date, kg }); datePesi.add(p.date); pesiNuovi++; } });

  const dash = r.dashboard || {};
  if (!db.settings.goal && num(dash.obiettivo)) db.settings.goal = String(num(dash.obiettivo));

  db.settings.lastRead = new Date().toISOString(); save(); safeRender();
  if (!silenzioso || nuovi || pesiNuovi)
    toast(`✅ Dal foglio: ${nuovi} allenamenti nuovi${silenzioso ? '' : `, ${aggiornati} aggiornati`}, ${pesiNuovi} pesate`);
}

/* ============ 6. GRAFICI ============ */
function lineChart(pts, color, unit) {
  if (pts.length < 2) return emptyBox(pts.length ? 'Serve almeno un altro dato per il grafico' : 'Nessun dato nel periodo');
  const W = 320, H = 160, P = { l: 34, r: 10, t: 12, b: 24 };
  const ys = pts.map(p => p.y); let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12; min -= pad; max += pad;
  const x = i => P.l + (i * (W - P.l - P.r)) / (pts.length - 1);
  const y = v => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${x(pts.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const grid = [0, 0.5, 1].map(f => { const v = min + f * (max - min);
    return `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${P.l - 6}" y="${y(v) + 3}" text-anchor="end">${fmt(v, 1)}</text>`; }).join('');
  const step = Math.ceil(pts.length / 5);
  const labels = pts.map((p, i) => (i % step === 0 || i === pts.length - 1) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${fmtDate(p.x)}</text>` : '').join('');
  const id = 'g' + uid();
  const a = pts[0].y, b = pts[pts.length - 1].y, diff = b - a;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${color};stop-opacity:.35"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#${id})"/>
    <path d="${path}" style="fill:none;stroke:${color};stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.y)}" r="3" style="fill:${color}"/>`).join('')}${labels}</svg>
    <div class="muted" style="margin-top:6px">Da ${fmt(a, 2)} a ${fmt(b, 2)} ${unit} <span class="${diff >= 0 ? 'up' : 'down'}">(${diff >= 0 ? '+' : ''}${fmt(diff, 2)})</span></div>`;
}
function barChart(items) {
  if (!items.length) return emptyBox('Nessun allenamento nel periodo');
  const W = 320, H = 160, P = { l: 34, r: 6, t: 12, b: 24 };
  const max = Math.max(...items.map(i => i.value), 1), bw = (W - P.l - P.r) / items.length, step = Math.ceil(items.length / 6);
  const grid = [0, 0.5, 1].map(f => { const yy = P.t + (1 - f) * (H - P.t - P.b);
    return `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${yy}" y2="${yy}"/><text x="${P.l - 6}" y="${yy + 3}" text-anchor="end">${fmt(max * f / 1000, 1)}k</text>`; }).join('');
  const bars = items.map((it, i) => { const h = (it.value / max) * (H - P.t - P.b), xx = P.l + i * bw + bw * 0.15;
    return `<rect x="${xx}" y="${H - P.b - h}" width="${bw * 0.7}" height="${h}" rx="3" style="fill:${it.color}"/>${i % step === 0 ? `<text x="${xx + bw * 0.35}" y="${H - 6}" text-anchor="middle">${it.label}</text>` : ''}`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${grid}${bars}</svg>
    <div style="margin-top:8px;display:flex;gap:6px">${Object.keys(db.schede).map(s => `<span class="chip ${s}">${s}</span>`).join('')}</div>`;
}

/* ============ 7. SCHERMATE ============ */
let view = 'home', period = 30, chartEx = null, openW = null, editS = null;
const PERIODI = [[7, '7g'], [30, '30g'], [90, '3m'], [180, '6m'], [365, '1a'], [0, 'Tutto']];
const periodSeg = () => `<div class="seg">${PERIODI.map(([d, l]) => `<button class="${period === d ? 'active' : ''}" data-action="period" data-days="${d}">${l}</button>`).join('')}</div>`;
const stat = (label, value, unit = '', extra = '') => `<div class="card stat"><div class="label">${label}</div><div class="value">${value} <small>${unit}</small></div>${extra}</div>`;

function workoutRow(w, actions = false) {
  const open = actions && openW === w.id;
  const cloud = db.settings.syncUrl ? (w.synced ? ' • ☁️' : ' • ⏳') : '';
  const det = open ? `<div style="margin-top:8px;font-size:13px">
      ${w.exercises.map(e => `<div><b>${esc(e.nome)}</b>: ${e.sets.map(s => e.tipo === 'carico' ? `${fmt(s.kg, 2)}×${s.reps}` : `${s.reps}${e.tipo === 'tempo' ? '"' : ''}`).join(', ')}</div>`).join('')}
      ${w.kcal ? `<div class="muted" style="margin-top:6px">🔥 ${w.kcal} kcal (${w.kcalFonte === 'orologio' ? 'orologio' : 'stima'})${w.durata ? ` • ${w.durata} min` : ''}</div>` : ''}
      ${w.note ? `<div class="muted" style="margin-top:6px">📝 ${esc(w.note)}</div>` : ''}
      <button class="btn small danger" style="margin-top:10px" data-action="del-workout" data-id="${w.id}">Elimina</button></div>` : '';
  return `<div class="list-item" ${actions ? `data-action="toggle-w" data-id="${w.id}" style="cursor:pointer"` : ''}>
    <div style="flex:1"><div class="title"><span class="chip ${w.session}">${w.session}</span> ${fmtDateLong(w.date)}</div>
    <div class="muted">${w.exercises.length} esercizi • ${fmt(wVolume(w))} kg${w.kcal ? ` • 🔥 ${w.kcal} kcal` : ''}${cloud}</div>${det}</div>
    ${actions ? `<span class="muted">${open ? '▲' : '▼'}</span>` : ''}</div>`;
}

function viewHome() {
  const ws = sorted(), last = ws[ws.length - 1], today = todayISO(), next = nextSession();
  const wk = weekStart(), prev = addDays(wk, -7);
  const thisWeek = ws.filter(w => w.date >= wk), prevWeek = ws.filter(w => w.date >= prev && w.date < wk);
  const thisMonth = ws.filter(w => w.date.startsWith(today.slice(0, 7)));
  const volW = thisWeek.reduce((s, w) => s + wVolume(w), 0), volP = prevWeek.reduce((s, w) => s + wVolume(w), 0);
  const delta = volP ? Math.round((volW / volP - 1) * 100) : null;
  const pr = Object.entries(records()).sort((a, b) => b[1].date.localeCompare(a[1].date))[0];
  const hello = db.settings.name ? `Ciao ${esc(db.settings.name)} 👋` : 'Ciao 👋';
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const hero = db.draft
    ? `<div class="card hero"><div class="muted">Allenamento in corso</div><div class="big" style="margin:6px 0 12px">Sessione ${db.draft.session}</div>
       <button class="btn white full" data-action="go" data-view="allena">Continua ▶</button></div>`
    : next ? `<div class="card hero"><div class="row"><span class="muted">Allenamento di oggi</span><span class="chip">Sessione ${next}</span></div>
       <div class="big" style="margin:8px 0 14px">${esc(db.schede[next].nome)}</div>
       <button class="btn white full" data-action="start" data-s="${next}">Inizia allenamento ▶</button></div>` : '';
  const deltaTxt = delta == null ? '' : `<div class="${delta >= 0 ? 'up' : 'down'}" style="font-size:12px;font-weight:700;margin-top:4px">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs sett. scorsa</div>`;
  return `${head(hello, oggi)}${hero}
    <div class="grid2">
      ${stat('Questa settimana', thisWeek.length, 'allen.')}
      ${stat('Questo mese', thisMonth.length, 'allen.')}
      ${stat("Dall'ultimo", last ? daysBetween(last.date, today) : '—', last ? 'giorni' : '')}
      ${stat('Volume settimana', fmt(volW), 'kg', deltaTxt)}
    </div>
    ${pr ? `<div class="card"><div class="muted">🏆 Ultimo record</div><div class="big" style="margin-top:4px">${esc(pr[0])}: ${fmt(pr[1].kg, 2)} kg × ${pr[1].reps}</div><div class="muted">${fmtDateLong(pr[1].date)}</div></div>` : ''}
    ${last ? `<div class="card"><h3>Ultimo allenamento</h3>${workoutRow(last)}</div>`
           : `<div class="card">${emptyBox('Nessun allenamento registrato.<br>Inizia il primo oppure importa i tuoi dati da Profilo.')}</div>`}`;
}

function viewAllena() {
  if (db.draft) return viewWorkout();
  const ws = sorted().reverse();
  const cards = Object.entries(db.schede).map(([s, sc]) => {
    const l = ws.find(w => w.session === s);
    return `<div class="card"><div class="row"><span class="chip ${s}">Sessione ${s}</span><span class="muted">${l ? 'Ultima: ' + fmtDate(l.date) : 'Mai fatta'}</span></div>
      <div class="big" style="margin:8px 0 4px">${esc(sc.nome)}</div>
      <div class="muted" style="margin-bottom:12px">${sc.esercizi.map(e => esc(e.nome)).join(' • ') || 'Nessun esercizio'}</div>
      <button class="btn primary full" data-action="start" data-s="${s}">Inizia ▶</button></div>`;
  }).join('');
  return `${head('Allenamento', 'Scegli la sessione da fare')}${cards}
    <button class="btn full" data-action="go" data-view="schede" style="margin-bottom:14px">✏️ Modifica sessioni ed esercizi</button>
    <div class="card"><h3>Storico</h3>${ws.length ? ws.slice(0, 40).map(w => workoutRow(w, true)).join('') : emptyBox('Ancora nessun allenamento')}</div>`;
}

function exerciseCard(e, i, date) {
  const last = lastFor(e.nome, date), unit = e.tipo === 'tempo' ? 'sec' : 'rip';
  const meta = [`${e.serie} × ${esc(e.rip)}${e.tipo === 'tempo' ? ' sec' : ''}`,
    e.carico ? esc(e.carico) + (num(e.carico) != null ? ' kg' : '') : '',
    e.recupero ? '⏱️ ' + esc(e.recupero) : '', e.note ? esc(e.note) : ''].filter(Boolean).join(' • ');
  let info = `<div class="ex-last">Prima volta: obiettivo ${esc(e.rip)} ${unit}</div>`, hint = '';
  if (last) {
    const s = last.ex.sets, kg = e.tipo === 'carico' ? `${fmt(exMaxKg(last.ex), 2)} kg — ` : '';
    info = `<div class="ex-last">Ultima volta <b>${fmtDate(last.date)}</b>: ${kg}${s.map(x => x.reps).join(' / ')} ${unit}</div>`;
    hint = `<div class="hint">💡 ${suggestion(e, s)}</div>`;
  }
  const rows = e.sets.map((s, j) => `<div class="set-row"><span class="n">${j + 1}</span>
      <input type="number" inputmode="decimal" data-field="reps" data-ex="${i}" data-set="${j}" value="${esc(s.reps)}" placeholder="${last?.ex.sets[j]?.reps ?? ''}">
      ${e.tipo === 'carico' ? `<input type="number" inputmode="decimal" step="0.25" data-field="kg" data-ex="${i}" data-set="${j}" value="${esc(s.kg)}">` : '<span class="muted" style="text-align:center">—</span>'}
      <button class="done ${s.done ? 'ok' : ''}" data-action="done" data-ex="${i}" data-set="${j}">✓</button></div>`).join('');
  return `<div class="card exercise">
    <div class="ex-head"><div><div class="ex-name">${esc(e.nome)}</div><div class="ex-meta">${meta}</div></div><span class="chip">${esc(e.gruppo)}</span></div>
    ${info}${hint}
    <div class="set-labels"><span>Serie</span><span>${e.tipo === 'tempo' ? 'Secondi' : 'Ripetizioni'}</span><span>${e.tipo === 'carico' ? 'Kg' : ''}</span><span></span></div>
    ${rows}<button class="btn small" data-action="add-set" data-ex="${i}">+ Serie</button></div>`;
}

function viewWorkout() {
  const d = db.draft;
  return `${head('Sessione ' + d.session, esc(db.schede[d.session]?.nome || ''))}
    <div class="card"><label class="field" style="margin-top:0">Data</label><input type="date" data-field="date" value="${d.date}"></div>
    ${d.exercises.map((e, i) => exerciseCard(e, i, d.date)).join('')}
    <div class="card"><h3>🔥 Calorie</h3>
      <div class="muted" id="kcal-line">${kcalLine(d)}</div>
      <div class="grid2" style="margin:0">
        <div><label class="field">Durata (min)</label><input type="number" inputmode="numeric" data-field="durata" value="${esc(d.durata || '')}" placeholder="${durataAuto(d)}"></div>
        <div><label class="field">Kcal orologio</label><input type="number" inputmode="numeric" data-field="kcalWatch" value="${esc(d.kcalWatch || '')}" placeholder="facoltativo"></div>
      </div>
      <div class="muted" style="margin-top:8px">La stima è indicativa. Se inserisci le kcal dell'orologio, verranno usate quelle.</div></div>
    <div class="card"><label class="field" style="margin-top:0">Note allenamento</label>
      <textarea data-field="note" placeholder="Energia, sensazioni, dolori...">${esc(d.note)}</textarea></div>
    <button class="btn primary full" data-action="save-workout" style="margin-bottom:10px">✅ Salva allenamento</button>
    <button class="btn danger full" data-action="cancel-workout">Annulla allenamento</button>`;
}

function viewSchede() {
  const keys = Object.keys(db.schede);
  if (!keys.includes(editS)) editS = keys[0];
  const sc = db.schede[editS];
  const tabs = `<div class="seg">${keys.map(k => `<button class="${k === editS ? 'active' : ''}" data-action="edit-s" data-s="${k}">Sessione ${k}</button>`).join('')}
    <button data-action="add-scheda">＋ Nuova</button></div>`;
  if (!sc) return `${head('Modifica sessioni')}${tabs}`;
  const tipoSel = (v, i) => `<select data-sk="tipo" data-i="${i}">${[['carico', 'Con carico'], ['corpo', 'Corpo libero'], ['tempo', 'A tempo']]
    .map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const n = sc.esercizi.length;
  const cards = sc.esercizi.map((e, i) => `<div class="card">
      <div class="row"><b>${i + 1}. ${esc(e.nome)}</b><div style="display:flex;gap:6px">
        <button class="btn small" data-action="ex-up" data-i="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn small" data-action="ex-down" data-i="${i}" ${i === n - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn small danger" data-action="ex-del" data-i="${i}">✕</button></div></div>
      <label class="field">Nome esercizio</label><input data-sk="nome" data-i="${i}" value="${esc(e.nome)}">
      <div class="grid2" style="margin:0">
        <div><label class="field">Gruppo muscolare</label><input data-sk="gruppo" data-i="${i}" value="${esc(e.gruppo)}"></div>
        <div><label class="field">Tipo</label>${tipoSel(e.tipo, i)}</div>
        <div><label class="field">Serie</label><input type="number" inputmode="numeric" data-sk="serie" data-i="${i}" value="${esc(e.serie)}"></div>
        <div><label class="field">Ripetizioni / secondi</label><input data-sk="rip" data-i="${i}" value="${esc(e.rip)}"></div>
        <div><label class="field">Carico (kg)</label><input data-sk="carico" data-i="${i}" value="${esc(e.carico)}"></div>
        <div><label class="field">Recupero</label><input data-sk="recupero" data-i="${i}" value="${esc(e.recupero)}" placeholder="90 sec / 2 min"></div>
      </div>
      <label class="field">Note</label><input data-sk="note" data-i="${i}" value="${esc(e.note)}" placeholder="Manubri, elastici...">
    </div>`).join('');
  return `${head('Modifica sessioni', 'Le modifiche valgono dal prossimo allenamento')}${tabs}
    <div class="card"><label class="field" style="margin-top:0">Nome della sessione ${editS}</label><input data-sk="sessione-nome" value="${esc(sc.nome)}"></div>
    ${cards || `<div class="card">${emptyBox('Nessun esercizio in questa sessione')}</div>`}
    <button class="btn primary full" data-action="ex-add" style="margin-bottom:10px">＋ Aggiungi esercizio</button>
    ${keys.length > 1 ? `<button class="btn danger full" data-action="del-scheda" style="margin-bottom:10px">🗑️ Elimina sessione ${editS}</button>` : ''}
    <button class="btn full" data-action="reset-schede" style="margin-bottom:10px">↺ Ripristina schede originali</button>
    <button class="btn full" data-action="go" data-view="allena">← Torna ad Allena</button>`;
}

function viewProgressi() {
  const ws = inPeriod(period);
  const names = [...new Set(sorted().flatMap(w => w.exercises.filter(e => e.tipo === 'carico').map(e => e.nome)))];
  if (!names.includes(chartEx)) chartEx = names[0];
  const exPts = [], repPts = [];
  ws.forEach(w => { const e = w.exercises.find(x => x.nome === chartEx);
    if (e) { exPts.push({ x: w.date, y: exMaxKg(e) }); repPts.push({ x: w.date, y: exReps(e) }); } });
  const bars = ws.map(w => ({ label: fmtDate(w.date), value: wVolume(w), color: `var(--${w.session}, var(--accent))` }));
  const wPts = [...db.weights].filter(p => !period || p.date >= isoFrom(period))
    .sort((a, b) => a.date.localeCompare(b.date)).map(p => ({ x: p.date, y: p.kg }));
  return `${head('Progressi')}${periodSeg()}
    <div class="card"><h3>Volume per allenamento (kg)</h3>${barChart(bars)}</div>
    <div class="card"><h3>Progressione esercizio</h3>
      ${names.length ? `<select id="ex-select">${names.map(n => `<option ${n === chartEx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <div class="muted" style="margin:12px 0 6px">Carico massimo</div>${lineChart(exPts, 'var(--accent)', 'kg')}
      <div class="muted" style="margin:14px 0 6px">Ripetizioni totali</div>${lineChart(repPts, 'var(--green)', 'rip')}` : emptyBox('Nessun dato')}</div>
    <div class="card"><h3>Peso corporeo</h3>${lineChart(wPts, 'var(--accent2)', 'kg')}</div>`;
}

function viewStats() {
  const ws = inPeriod(period);
  if (!ws.length) return `${head('Statistiche')}${periodSeg()}<div class="card">${emptyBox('Nessun allenamento nel periodo')}</div>`;
  const vol = ws.reduce((s, w) => s + wVolume(w), 0);
  const fromFirst = daysBetween(sorted()[0].date, todayISO()) + 1;
  const weeks = Math.max(1, (period ? Math.min(period, fromFirst) : fromFirst) / 7);
  const count = {}, groups = {};
  Object.values(db.schede).forEach(sc => sc.esercizi.forEach(e => groups[e.gruppo] = 0));
  ws.forEach(w => w.exercises.forEach(e => { count[e.nome] = (count[e.nome] || 0) + 1; groups[e.gruppo] = (groups[e.gruppo] || 0) + e.sets.length; }));
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  const g = Object.entries(groups).sort((a, b) => b[1] - a[1]), gmax = g[0][1] || 1;
  const rec = Object.entries(records()).sort((a, b) => b[1].kg - a[1].kg);
  const conKcal = ws.filter(w => w.kcal), kcalTot = conKcal.reduce((s, w) => s + w.kcal, 0);
  return `${head('Statistiche')}${periodSeg()}
    <div class="grid2">
      ${stat('Allenamenti', ws.length)}
      ${stat('Media a settimana', fmt(ws.length / weeks, 1))}
      ${stat('Volume totale', fmt(vol), 'kg')}
      ${stat('Volume medio', fmt(vol / ws.length), 'kg')}
      ${stat('Kcal totali', fmt(kcalTot), 'kcal')}
      ${stat('Kcal medie', conKcal.length ? fmt(kcalTot / conKcal.length) : '—', conKcal.length ? 'kcal' : '')}
      ${stat('Settimane di fila', streakWeeks(), '🔥')}
      ${stat('Più eseguito', `<span style="font-size:15px">${esc(top[0])}</span>`)}
    </div>
    <div class="card"><h3>Serie per gruppo muscolare</h3><div class="bars">
      ${g.map(([n, v]) => `<div class="bar-row"><span>${esc(n)}</span><div class="bar-track"><div class="bar-fill" style="width:${v / gmax * 100}%"></div></div><b style="text-align:right">${v}</b></div>`).join('')}</div>
      <div class="muted" style="margin-top:12px">Più allenato: <b>${esc(g[0][0])}</b> • Meno allenato: <b>${esc(g[g.length - 1][0])}</b></div></div>
    <div class="card"><h3>🏆 Record personali</h3>
      ${rec.length ? rec.map(([n, r]) => `<div class="list-item"><div><div class="title">${esc(n)}</div><div class="muted">${fmtDateLong(r.date)}</div></div><div class="big">${fmt(r.kg, 2)} kg × ${r.reps}</div></div>`).join('') : emptyBox('Nessun record')}</div>`;
}

function viewProfilo() {
  const s = db.settings, ws = [...db.weights].sort((a, b) => b.date.localeCompare(a.date)), goal = num(s.goal);
  const nonSync = db.workouts.filter(w => !w.synced).length;
  const stato = !s.syncUrl ? 'Non collegato'
    : s.syncError ? `<span class="down">⚠️ ${esc(s.syncError)}</span>`
    : s.lastSync ? `✅ Ultimo invio: ${new Date(s.lastSync).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
    : 'Collegato, nessun invio ancora';
  return `${head('Profilo')}
    <div class="card"><h3>Dati personali</h3>
      <label class="field">Nome</label><input data-setting="name" value="${esc(s.name)}" placeholder="Come ti chiami?">
      <label class="field">Peso obiettivo (kg)</label><input type="number" inputmode="decimal" data-setting="goal" value="${esc(s.goal)}">
      <label class="field">Tema</label><div class="seg" style="margin:0">
        ${[['auto', 'Automatico'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([v, l]) => `<button class="${s.theme === v ? 'active' : ''}" data-action="theme" data-t="${v}">${l}</button>`).join('')}</div></div>
    <div class="card"><h3>⚖️ Peso corporeo</h3>
      <div class="row"><input type="date" id="w-date" value="${todayISO()}"><input type="number" inputmode="decimal" step="0.05" id="w-kg" placeholder="kg"></div>
      <button class="btn primary full" style="margin-top:10px" data-action="add-weight">Aggiungi pesata</button>
      ${goal && ws[0] ? `<div class="muted" style="margin-top:12px">Attuale ${fmt(ws[0].kg, 2)} kg • obiettivo ${fmt(goal, 2)} kg • mancano <b>${fmt(goal - ws[0].kg, 2)} kg</b></div>` : ''}
      ${ws.slice(0, 10).map(w => `<div class="list-item"><span>${fmtDateLong(w.date)}</span><span><b>${fmt(w.kg, 2)} kg</b> <button class="btn small danger" data-action="del-weight" data-id="${w.id}">✕</button></span></div>`).join('')}</div>
    <div class="card"><h3>☁️ Sincronizzazione Fogli Google</h3>
      <label class="field">Link dello script (finisce con /exec)</label>
      <input data-setting="syncUrl" value="${esc(s.syncUrl)}" placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off">
      <label class="field">Parola segreta</label>
      <input data-setting="syncToken" value="${esc(s.syncToken)}" placeholder="La stessa scritta nello script" autocomplete="off">
      <div class="muted" style="margin:12px 0">${stato}<br>In coda: <b>${db.outbox.length}</b> • Allenamenti non sincronizzati: <b>${nonSync}</b></div>
      <button class="btn full" data-action="test-sync" style="margin-bottom:8px">🧪 Prova collegamento</button>
      <button class="btn primary full" data-action="sync-now" style="margin-bottom:8px">🔄 Invia dati al foglio</button>
      <button class="btn full" data-action="read-sheet">⬇️ Scarica dati dal foglio</button>
      ${s.lastRead ? `<div class="muted" style="margin-top:8px">Ultima lettura: ${new Date(s.lastRead).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>` : ''}</div>
    <div class="card"><h3>🏋️ Sessioni</h3>
      <button class="btn full" data-action="go" data-view="schede">✏️ Modifica sessioni ed esercizi</button></div>
    <div class="card"><h3>💾 Dati e backup</h3>
      <p class="muted" style="margin-bottom:12px">I dati sono salvati su questo telefono. Fai un backup ogni tanto.</p>
      <button class="btn full" data-action="export" style="margin-bottom:8px">⬇️ Esporta backup</button>
      <button class="btn full" data-action="import-json" style="margin-bottom:8px">⬆️ Ripristina backup</button>
      <button class="btn full" data-action="import-csv" style="margin-bottom:8px">📄 Importa da Fogli Google (CSV)</button>
      <button class="btn danger full" data-action="reset">🗑️ Cancella tutti i dati</button>
      <input type="file" id="file" accept=".json,.csv,text/csv,application/json" hidden></div>
    <p class="muted" style="text-align:center">Palestra v2 • ${db.workouts.length} allenamenti salvati</p>`;
}

/* ============ 8. AZIONI ============ */
function startWorkout(s) {
  db.draft = { session: s, date: todayISO(), note: '', startedAt: Date.now(), durata: '', kcalWatch: '',
    exercises: db.schede[s].esercizi.map(e => {
      const last = lastFor(e.nome);
      return { ...e, sets: Array.from({ length: e.serie }, (_, j) => ({
        reps: '', done: false,
        kg: e.tipo === 'carico' ? (last?.ex.sets[j]?.kg ?? last?.ex.sets.at(-1)?.kg ?? num(e.carico) ?? '') : '' })) };
    }) };
  save(); go('allena');
}
function saveWorkout() {
  const d = db.draft;
  const exercises = d.exercises.map(e => ({ nome: e.nome, gruppo: e.gruppo, tipo: e.tipo,
    serie: e.serie, rip: e.rip, carico: e.carico, recupero: e.recupero, note: e.note || '',
    sets: e.sets.filter(s => num(s.reps) != null).map(s => ({ reps: num(s.reps), kg: e.tipo === 'carico' ? num(s.kg) : null })) }))
    .filter(e => e.sets.length);
  if (!exercises.length) return toast('Inserisci almeno una serie');
  const durata = durataDraft(d), stima = stimaKcal(durata), watch = num(d.kcalWatch);
  const before = records();
  const w = { id: uid(), date: d.date, session: d.session, exercises, note: d.note, synced: false,
    durata, kcalStima: stima, kcal: watch || stima, kcalFonte: watch ? 'orologio' : 'stima' };
  db.workouts.push(w);
  db.draft = null; save(); stopRest();
  const after = records(), nuovi = Object.keys(after).filter(k => before[k] && after[k].kg > before[k].kg);
  toast(nuovi.length ? `🏆 Nuovo record: ${nuovi.join(', ')}!` : '✅ Allenamento salvato!');
  go('home');
  queue(workoutPayload(w));
}

let restTimer = null;
function startRest(sec) {
  let el = $('#rest');
  if (!el) { el = document.createElement('div'); el.id = 'rest'; document.body.appendChild(el); }
  clearInterval(restTimer); let left = Math.round(sec);
  const draw = () => { el.innerHTML = `⏱️ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} <button class="btn small" onclick="stopRest()">Salta</button>`; };
  el.classList.add('show'); draw();
  restTimer = setInterval(() => {
    left--;
    if (left <= 0) { stopRest(); if (navigator.vibrate) navigator.vibrate([300, 150, 300]); toast('💪 Recupero finito!'); }
    else draw();
  }, 1000);
}
function stopRest() { clearInterval(restTimer); const el = $('#rest'); if (el) el.classList.remove('show'); }

/* Modifica sessioni */
function nuovoEsercizio() {
  return { nome: 'Nuovo esercizio', gruppo: '', tipo: 'carico', serie: 3, rip: '10-12', carico: '', recupero: '90 sec', note: '' };
}
function prossimaLettera() {
  const keys = Object.keys(db.schede);
  for (let c = 65; c <= 90; c++) { const k = String.fromCharCode(c); if (!keys.includes(k)) return k; }
  return 'S' + keys.length;
}

/* ============ 9. IMPORTAZIONE E BACKUP ============ */
function exportJSON() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
  a.download = `palestra-backup-${todayISO()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importJSON(text) {
  try {
    const d = JSON.parse(text); if (!d.workouts) throw new Error();
    if (!confirm('Sostituire i dati attuali con quelli del backup?')) return;
    db = migrate(d); save(); applyTheme(); render(); toast('Backup ripristinato');
  } catch (e) { toast('File di backup non valido'); }
}
function parseCSV(text) {
  const first = text.split('\n')[0], sep = first.split(';').length > first.split(',').length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
function parseDateIT(s) {
  s = (s || '').trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^\d{4}-\d{2}-\d{2}/); return m ? m[0] : null;
}
function importCSV(text) {
  const rows = parseCSV(text);
  const h = rows.findIndex(r => r.some(c => c.trim().toLowerCase() === 'esercizio'));
  if (h < 0) return toast('Non trovo la colonna "Esercizio"');
  const hd = rows[h].map(c => c.trim().toLowerCase());
  const iD = hd.indexOf('data'), iS = hd.indexOf('sessione'), iE = hd.indexOf('esercizio');
  const iR = [1, 2, 3, 4, 5].map(n => hd.findIndex(x => new RegExp('^rip\\.?\\s*' + n + '$').test(x)));
  const iK = [1, 2, 3, 4, 5].map(n => hd.findIndex(x => new RegExp('^(kg|peso)\\s*' + n).test(x)));
  const { info, sesOf } = infoEsercizi();
  const groups = {};
  rows.slice(h + 1).forEach(r => {
    const date = parseDateIT(r[iD]), nome = (r[iE] || '').trim();
    if (!date || !nome) return;
    const key0 = nome.toLowerCase(), e = info[key0] || { gruppo: 'Altro', tipo: 'carico' };
    const ses = ((iS >= 0 ? r[iS] : '') || '').trim().toUpperCase() || sesOf[key0] || 'A';
    const sets = iR.map((c, k) => ({ reps: c >= 0 ? num(r[c]) : null, kg: e.tipo === 'carico' && iK[k] >= 0 ? num(r[iK[k]]) : null })).filter(s => s.reps);
    if (!sets.length) return;
    const key = date + '|' + ses;
    (groups[key] ||= { id: uid(), date, session: ses, exercises: [], note: '', synced: true })
      .exercises.push({ nome, gruppo: e.gruppo, tipo: e.tipo, sets });
  });
  const exist = new Set(db.workouts.map(w => w.date + '|' + w.session));
  const nuovi = Object.entries(groups).filter(([k]) => !exist.has(k)).map(([, w]) => w);
  db.workouts.push(...nuovi); save(); render();
  toast(`Importati ${nuovi.length} allenamenti`);
}
let fileMode = 'json';
function pickFile(mode) { fileMode = mode; const f = $('#file'); f.value = ''; f.click(); }

/* ============ 10. NAVIGAZIONE ED EVENTI ============ */
const VIEWS = { home: viewHome, allena: viewAllena, progressi: viewProgressi, stats: viewStats, profilo: viewProfilo, schede: viewSchede };
function render() {
  const app = $('#app'); app.innerHTML = VIEWS[view]();
  app.style.animation = 'none'; void app.offsetHeight; app.style.animation = '';
}
function go(v) {
  view = v;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  render(); window.scrollTo(0, 0);
}
function applyTheme() {
  const t = db.settings.theme, dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = dark ? '#0b1120' : '#f1f5f9';
}

document.addEventListener('click', e => {
  const nav = e.target.closest('#nav button'); if (nav) return go(nav.dataset.view);
  const el = e.target.closest('[data-action]'); if (!el) return;
  const ex = +el.dataset.ex, set = +el.dataset.set, i = +el.dataset.i;
  const sc = db.schede[editS];
  switch (el.dataset.action) {
    case 'go': go(el.dataset.view); break;
    case 'start':
      if (db.draft && !confirm('Hai già un allenamento in corso. Vuoi sostituirlo?')) return;
      startWorkout(el.dataset.s); break;
    case 'done': {
      const s = db.draft.exercises[ex].sets[set]; s.done = !s.done;
      if (s.done && s.reps === '') {
        const inp = document.querySelector(`input[data-field="reps"][data-ex="${ex}"][data-set="${set}"]`);
        if (inp && inp.placeholder) { s.reps = inp.placeholder; inp.value = inp.placeholder; }
      }
      save(); el.classList.toggle('ok', s.done);
      s.done ? startRest(restSec(db.draft.exercises[ex].recupero)) : stopRest();
      break;
    }
    case 'add-set': {
      const sets = db.draft.exercises[ex].sets;
      sets.push({ reps: '', kg: sets.at(-1)?.kg ?? '', done: false }); save(); render(); break;
    }
    case 'save-workout': saveWorkout(); break;
    case 'cancel-workout':
      if (confirm("Annullare l'allenamento? I dati inseriti andranno persi.")) { db.draft = null; save(); stopRest(); render(); }
      break;
    case 'toggle-w': openW = openW === el.dataset.id ? null : el.dataset.id; render(); break;
    case 'del-workout':
      if (confirm('Eliminare questo allenamento? (Dal foglio Google va cancellato a mano)')) {
        const id = el.dataset.id;
        db.workouts = db.workouts.filter(w => w.id !== id);
        db.outbox = db.outbox.filter(o => !(o.type === 'workout' && o.workout.id === id));
        save(); render();
      }
      break;
    case 'period': period = +el.dataset.days; render(); break;
    case 'theme': db.settings.theme = el.dataset.t; save(); applyTheme(); render(); break;
    case 'add-weight': {
      const kg = num($('#w-kg').value), date = $('#w-date').value;
      if (!kg || !date) return toast('Inserisci data e peso');
      db.weights.push({ id: uid(), date, kg }); save(); render(); toast('Peso salvato');
      queue({ type: 'weight', date, kg });
      break;
    }
    case 'del-weight': db.weights = db.weights.filter(w => w.id !== el.dataset.id); save(); render(); break;
    case 'test-sync': testSync(); break;
    case 'sync-now': syncNow(); break;
    case 'read-sheet': scaricaDalFoglio(); break;

    /* Modifica sessioni */
    case 'edit-s': editS = el.dataset.s; render(); break;
    case 'add-scheda': {
      const k = prossimaLettera();
      db.schede[k] = { nome: 'Nuova sessione', esercizi: [nuovoEsercizio()] };
      editS = k; save(); render();
      toast(`Sessione ${k} creata. Per sincronizzarla crea nel foglio una scheda "Sessione ${k}"`);
      break;
    }
    case 'del-scheda':
      if (Object.keys(db.schede).length > 1 && confirm(`Eliminare la sessione ${editS}? Lo storico degli allenamenti resta.`)) {
        delete db.schede[editS]; editS = null; save(); render();
      }
      break;
    case 'ex-add':
      sc.esercizi.push(nuovoEsercizio()); save(); render();
      window.scrollTo(0, document.body.scrollHeight);
      break;
    case 'ex-del':
      if (confirm(`Togliere "${sc.esercizi[i].nome}" dalla sessione ${editS}?`)) { sc.esercizi.splice(i, 1); save(); render(); }
      break;
    case 'ex-up':
      if (i > 0) { [sc.esercizi[i - 1], sc.esercizi[i]] = [sc.esercizi[i], sc.esercizi[i - 1]]; save(); render(); }
      break;
    case 'ex-down':
      if (i < sc.esercizi.length - 1) { [sc.esercizi[i + 1], sc.esercizi[i]] = [sc.esercizi[i], sc.esercizi[i + 1]]; save(); render(); }
      break;
    case 'reset-schede':
      if (confirm('Ripristinare le schede originali? Le tue modifiche agli esercizi andranno perse.')) {
        db.schede = copiaSchede(); editS = null; save(); render();
      }
      break;

    case 'export': exportJSON(); break;
    case 'import-json': pickFile('json'); break;
    case 'import-csv': pickFile('csv'); break;
    case 'reset':
      if (confirm('Cancellare TUTTI i dati? Fai prima un backup!') && confirm('Sei sicuro? Non si può annullare.')) {
        localStorage.removeItem(KEY); db = load(); applyTheme(); render(); toast('Dati cancellati');
      }
      break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.field && db.draft) {
    const f = t.dataset.field;
    if (f === 'reps' || f === 'kg') db.draft.exercises[+t.dataset.ex].sets[+t.dataset.set][f] = t.value;
    else db.draft[f] = t.value;
    if (f === 'durata') { const k = $('#kcal-line'); if (k) k.innerHTML = kcalLine(db.draft); }
    save();
  }
  if (t.dataset.setting) { db.settings[t.dataset.setting] = t.value; save(); }
  if (t.dataset.sk && db.schede[editS]) {
    const sc = db.schede[editS], k = t.dataset.sk;
    if (k === 'sessione-nome') sc.nome = t.value;
    else sc.esercizi[+t.dataset.i][k] = k === 'serie' ? (parseInt(t.value) || 1) : t.value;
    save();
  }
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'ex-select') { chartEx = t.value; render(); }
  if (t.dataset.field === 'date') render();
  if (t.dataset.sk === 'tipo') render();
  if (t.id === 'file' && t.files[0]) {
    const text = await t.files[0].text();
    fileMode === 'csv' ? importCSV(text) : importJSON(text);
  }
});

/* ============ 11. AVVIO ============ */
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
/* All'apertura: prima invia quello che è in coda, poi rilegge il foglio (al massimo ogni 10 minuti) */
async function aggiornaTutto() {
  await flush();
  const ultima = db.settings.lastRead ? Date.now() - new Date(db.settings.lastRead) : Infinity;
  if (ultima > 10 * 60 * 1000 && navigator.onLine) scaricaDalFoglio(true);
}
window.addEventListener('online', aggiornaTutto);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aggiornaTutto(); });
render();
aggiornaTutto();
