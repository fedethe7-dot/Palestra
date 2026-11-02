/* ============ PROGRESSI ============
   Forza (massimale stimato, carichi, record), Volume (settimane, muscoli, frequenza),
   Corpo (peso, composizione, misure, calorie) e Foto dei progressi. */
import { S, save, cfg, sorted, inPeriod, wVolume, exMaxKg, exE1rm, exVolume, exReps, records, streakWeeks, corpoCalcoli, bodySorted, FASI, obiettiviGiorno } from '../dati.js';
import { esc, fmt, num, todayISO, isoFrom, addDays, weekStart, fmtDate, fmtDateLong, uid, toast, chiedi, daysBetween } from '../util.js';
import { testata, ico, app, segmenti, vuoto, apriFoglio, chiudiFoglio } from '../ui.js';
import { lineChart, barChart, barreH, heatmap } from '../grafici.js';
import { seriePerGruppo } from '../coach.js';
import { queue } from '../sync.js';
import { stampaDimagrimento } from '../stampa.js';
import { fotoTutte, fotoSalva, fotoElimina, fotoUrl } from '../foto.js';

const PERIODI_TXT = { 30: 'ultimo mese', 90: 'ultimi 3 mesi', 180: 'ultimi 6 mesi', 365: 'ultimo anno' };
let tab = 'forza', period = 90, chartEx = null, metrica = 'e1rm', confronto = { a: null, b: null, pos: 50 };
const PERIODI = [[30, '1 mese'], [90, '3 mesi'], [180, '6 mesi'], [365, '1 anno'], [0, 'Tutto']];
export const setTab = t => { tab = t; };

/* ---------- Forza ---------- */
function forza() {
  const ws = inPeriod(period);
  const nomi = [...new Set(sorted().flatMap(w => w.exercises.filter(e => e.tipo === 'carico').map(e => e.nome)))];
  if (!nomi.length) return vuoto('Registra il primo allenamento per vedere i progressi', 'progressi');
  if (!nomi.includes(chartEx)) chartEx = Object.values(S.db.schede)[0]?.esercizi.find(e => nomi.includes(e.nome))?.nome || nomi[0];
  const voci = ws.map(w => ({ w, e: w.exercises.find(x => x.nome === chartEx) })).filter(x => x.e);
  const M = { e1rm: ['Massimale stimato', e => exE1rm(e), 'kg', 1], max: ['Carico massimo', e => exMaxKg(e), 'kg', 2], vol: ['Volume', e => exVolume(e), 'kg', 0], rip: ['Ripetizioni totali', e => exReps(e), 'rip', 0] };
  const [titolo, f, unita, dec] = M[metrica];
  const pts = voci.map(({ w, e }) => ({ x: w.date, y: f(e), label: `${fmt(f(e), dec)} ${unita} · ${e.sets.map(s => `${fmt(s.kg, 2)}×${s.reps}`).join(' ')}` })).filter(p => p.y);
  const delta = pts.length > 1 ? (pts.at(-1).y / pts[0].y - 1) * 100 : null;
  const rec = Object.entries(records()).sort((a, b) => b[1].date.localeCompare(a[1].date));
  return `<section class="card">
    <label class="campo"><span>Esercizio</span><select id="prog-ex">${nomi.map(n => `<option ${n === chartEx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
    <div class="row grande"><div><span class="eyebrow">${titolo}</span><b class="big-num">${pts.length ? fmt(pts.at(-1).y, dec) : '—'}<small> ${unita}</small></b></div>
      ${delta != null ? `<span class="tag ${delta >= 0 ? 'su' : 'giu'}">${delta >= 0 ? '+' : ''}${fmt(delta, 0)}%</span>` : ''}</div>
    ${lineChart(pts, { unita, dec })}
    ${segmenti([['e1rm', '1RM'], ['max', 'Max'], ['vol', 'Volume'], ['rip', 'Rip.']], metrica, 'prog-metrica', 'piccolo')}
    <p class="muted small">Il massimale stimato (1RM) unisce peso e ripetizioni: sale anche quando fai più ripetizioni con lo stesso peso.</p></section>
    <section class="card"><div class="row"><h3>Record personali</h3>${ico('trofeo', 20)}</div>
      ${rec.length ? `<div class="lista-rec">${rec.map(([n, r]) => `<button class="rec-riga" data-action="go" data-view="esercizio" data-p="${esc(n)}"><span><b>${esc(n)}</b><small>${fmtDateLong(r.date)}</small></span><b class="rec-val">${fmt(r.kg, 2)} × ${r.reps}</b></button>`).join('')}</div>` : vuoto('Ancora nessun record')}</section>`;
}

/* ---------- Volume e frequenza ---------- */
function volume() {
  const ws = inPeriod(period);
  const wk0 = weekStart(), sett = Array.from({ length: 12 }, (_, i) => addDays(wk0, -7 * (11 - i)));
  const bars = sett.map((d, i) => ({ label: fmtDate(d), value: sorted().filter(w => w.date >= d && w.date < addDays(d, 7)).reduce((s, w) => s + wVolume(w), 0), evid: i === 11 }));
  const giorniP = period || Math.max(7, ws.length ? daysBetween(ws[0].date, todayISO()) + 1 : 7);
  const settimane = Math.max(1, Math.min(giorniP, ws.length ? daysBetween(ws[0].date, todayISO()) + 1 : 7) / 7);
  const gruppi = seriePerGruppo(Math.round(settimane * 7)).map(g => ({ nome: g.gruppo, valore: g.serie / settimane }));
  const obj = num(cfg().obiettivoSerie) || 8;
  const inizio = addDays(wk0, -7 * 15), date = new Set(S.db.workouts.map(w => w.date));
  const giorni = [];
  for (let d = 0; d < 16 * 7; d++) { const x = addDays(inizio, d); giorni.push({ x, titolo: x }); }
  const vol = ws.reduce((s, w) => s + wVolume(w), 0), kcal = ws.reduce((s, w) => s + (num(w.kcal) || 0), 0);
  const durate = ws.filter(w => w.durata).map(w => w.durata);
  return `<section class="tiles">
      <div class="tile"><span class="t-lab">Allenamenti</span><b class="t-val">${ws.length}</b><span class="t-sub">${fmt(ws.length / settimane, 1)} a settimana</span></div>
      <div class="tile"><span class="t-lab">Volume</span><b class="t-val">${fmt(vol / 1000, 1)}</b><span class="t-sub">tonnellate</span></div>
      <div class="tile"><span class="t-lab">Kcal bruciate</span><b class="t-val">${fmt(kcal)}</b><span class="t-sub">stima o orologio</span></div>
      <div class="tile"><span class="t-lab">Durata media</span><b class="t-val">${durate.length ? fmt(durate.reduce((a, b) => a + b, 0) / durate.length) : '—'}</b><span class="t-sub">minuti</span></div></section>
    <section class="card"><h3>Volume a settimana</h3>${barChart(bars, { unita: 'kg', kilo: true })}</section>
    <section class="card"><div class="row"><h3>Serie a settimana per muscolo</h3><span class="muted small">obiettivo ${obj}+</span></div>
      ${gruppi.length ? barreH(gruppi, { obiettivo: obj }) : vuoto('Nessun dato')}
      ${gruppi.some(g => g.valore < obj) ? `<p class="muted small">Sotto l'obiettivo: ${gruppi.filter(g => g.valore < obj).map(g => esc(g.nome)).join(', ')}. Quando cambi scheda il coach aggiunge serie qui.</p>` : ''}</section>
    <section class="card"><div class="row"><h3>Frequenza</h3><span class="muted small">${streakWeeks()} settimane di fila</span></div>
      ${heatmap(giorni, g => date.has(g.x) ? 3 : g.x > todayISO() ? 'f' : 0, 16)}
      <div class="heat-leg"><span>16 settimane fa</span><span>oggi</span></div></section>
    <button class="btn full" data-action="resoconto-apri">${ico('calendario', 18)} Resoconto della settimana scorsa</button>`;
}

/* ---------- Corpo ---------- */
function corpo() {
  const r = corpoCalcoli(), s = cfg(), goal = num(s.goal);
  const pesi = [...S.db.weights].filter(p => !period || p.date >= isoFrom(period)).sort((a, b) => a.date.localeCompare(b.date));
  const pts = pesi.map(p => ({ x: p.date, y: p.kg }));
  const media = pts.map((p, i) => { const sub = pts.slice(Math.max(0, i - 3), i + 1); return sub.reduce((t, x) => t + x.y, 0) / sub.length; });
  const ms = bodySorted(), mis = [...(S.db.misure || [])].sort((a, b) => a.date.localeCompare(b.date));
  const MIS = [['vita', 'Vita'], ['petto', 'Petto'], ['braccio', 'Braccio'], ['coscia', 'Coscia'], ['fianchi', 'Fianchi']];
  const primaM = mis[0], ultM = mis.at(-1);
  const fase = FASI.find(f => f[0] === r.fase) || FASI[2], ob = obiettiviGiorno();
  const bmiTxt = !r.bmi ? '' : r.bmi < 18.5 ? 'sottopeso' : r.bmi < 25 ? 'normopeso' : r.bmi < 30 ? 'sovrappeso' : 'obesità';
  return `<section class="card"><div class="row grande"><div><span class="eyebrow">Peso corporeo</span><b class="big-num">${r.kg ? fmt(r.kg, 1) : '—'}<small> kg</small></b></div>
      <button class="btn small primary" data-action="peso-veloce">${ico('piu', 16)} Pesata</button></div>
    ${lineChart(pts, { unita: 'kg', dec: 1, media: pts.length > 3 ? media : null, obiettivo: goal || null })}
    <p class="muted small">${pts.length > 3 ? 'La linea tratteggiata è la media delle ultime 4 pesate: guarda quella, non il singolo giorno.' : 'Pesati al mattino, a digiuno.'}${goal && r.kg ? ` Mancano ${fmt(Math.abs(goal - r.kg), 1)} kg all'obiettivo.` : ''}</p></section>
    <section class="tiles">
      <div class="tile"><span class="t-lab">BMI</span><b class="t-val">${r.bmi ? fmt(r.bmi, 1) : '—'}</b><span class="t-sub">${bmiTxt || 'serve l\'altezza'}</span></div>
      <div class="tile"><span class="t-lab">Grasso</span><b class="t-val">${r.fat != null ? fmt(r.fat, 1) + '%' : '—'}</b><span class="t-sub">${r.grassoKg ? fmt(r.grassoKg, 1) + ' kg' : 'dalla bilancia'}</span></div>
      <div class="tile"><span class="t-lab">Massa magra</span><b class="t-val">${r.magra ? fmt(r.magra, 1) : '—'}</b><span class="t-sub">kg</span></div>
      <div class="tile"><span class="t-lab">Fabbisogno</span><b class="t-val">${r.tdee ? fmt(r.tdee) : '—'}</b><span class="t-sub">kcal al giorno</span></div></section>
    <section class="card"><div class="row"><h3>Obiettivo: ${fase[1]}</h3><span class="tag">${fmt(ob.kcal)} kcal</span></div>
      <div class="macro-riga"><span><b>${ob.p} g</b>proteine</span><span><b>${ob.c} g</b>carboidrati</span><span><b>${ob.f} g</b>grassi</span></div>
      ${segmenti(FASI.map(([v, l]) => [v, l]), r.fase, 'fase', 'piccolo')}
      <p class="muted small">${fase[2]}. ${ob.stimato ? 'Valori stimati: inserisci altezza ed età in Impostazioni → Profilo per un calcolo preciso.' : `Calcolato con ${r.formula}.`}</p>
      ${r.obj ? `<p class="small">Obiettivo ${fmt(r.obj, 1)}% di grasso: peso finale ~${fmt(r.pesoObj, 1)} kg${r.settimane ? `, circa ${r.settimane} settimane in definizione` : ''}.</p>` : ''}</section>
    <section class="card"><div class="row"><h3>Composizione (bilancia)</h3><button class="btn small" data-action="mis-bilancia">${ico('piu', 16)} Nuova</button></div>
      ${ms.length ? `<div class="mini-storia">${ms.slice(-5).reverse().map(m => `<div class="row"><span>${fmtDateLong(m.date)}</span><span class="muted">${fmt(m.kg, 1)} kg${num(m.fat) != null ? ` · ${fmt(num(m.fat), 1)}%` : ''}${num(m.muscle) != null ? ` · muscolo ${fmt(num(m.muscle), 1)}` : ''}</span>
        <button class="icon-btn small" data-action="del-body" data-id="${esc(m.id)}" aria-label="Elimina">${ico('cestino', 16)}</button></div>`).join('')}</div>` : '<p class="muted small">Peso, % di grasso e massa muscolare dalla bilancia smart.</p>'}</section>
    <section class="card"><div class="row"><h3>Misure (cm)</h3><button class="btn small" data-action="mis-nuova">${ico('piu', 16)} Nuove misure</button></div>
      ${mis.length ? `<div class="tab-mis" role="table"><div class="tm-r tm-h" role="row"><span></span><span>${fmtDate(primaM.date)}</span><span>${fmtDate(ultM.date)}</span><span>Δ</span></div>
        ${MIS.map(([k, l]) => { const a = num(primaM[k]), b = num(ultM[k]); return a == null && b == null ? '' : `<div class="tm-r" role="row"><span>${l}</span><span>${fmt(a, 1)}</span><b>${fmt(b, 1)}</b><span class="${b - a > 0 ? 'su' : b - a < 0 ? 'giu' : ''}">${a != null && b != null ? (b - a > 0 ? '+' : '') + fmt(b - a, 1) : ''}</span></div>`; }).join('')}</div>`
        : '<p class="muted small">Vita, petto, braccio, coscia e fianchi: misurali una volta al mese, sempre nello stesso punto.</p>'}</section>
    <section class="card"><div class="row"><h3>Resoconto da stampare</h3>${ico('stampa', 20)}</div>
      <p class="muted small">Peso, massa grassa, calorie basali, fabbisogno, misure e andamento settimana per settimana (${period ? PERIODI_TXT[period] || 'periodo scelto' : 'tutto lo storico'}). Utile da portare al nutrizionista o al medico per il piano di dimagrimento: dalla stampa puoi anche salvarlo in PDF.</p>
      <button class="btn primary full" data-action="stampa-dimagrimento">${ico('stampa', 18)} Crea il resoconto</button></section>`;
}

/* ---------- Foto ---------- */
let fotoCache = null;
function foto() {
  if (!fotoCache) { fotoTutte().then(l => { fotoCache = l; app.render(); }); return `<p class="muted">Carico le foto…</p>`; }
  const l = [...fotoCache].sort((a, b) => b.date.localeCompare(a.date));
  if (confronto.a == null && l.length >= 2) { confronto.a = l.at(-1).id; confronto.b = l[0].id; }
  const A = l.find(x => x.id === confronto.a), B = l.find(x => x.id === confronto.b);
  return `<section class="card"><div class="row"><h3>Foto dei progressi</h3><label class="btn small primary file-btn">${ico('foto', 16)} Aggiungi<input type="file" accept="image/*" capture="environment" id="foto-input" hidden></label></div>
    <p class="muted small">Stessa luce, stessa posa, una volta al mese. Le foto restano solo su questo telefono (non vanno nel foglio né nel backup).</p></section>
    ${A && B ? `<section class="card"><h3>Confronto</h3><div class="confronto" style="--pos:${confronto.pos}%">
      <img src="${fotoUrl(A)}" alt="Foto del ${fmtDateLong(A.date)}"><div class="cf-b"><img src="${fotoUrl(B)}" alt="Foto del ${fmtDateLong(B.date)}"></div>
      <span class="cf-lab a">${fmtDate(A.date)}</span><span class="cf-lab b">${fmtDate(B.date)}</span>
      <input type="range" min="0" max="100" value="${confronto.pos}" id="cf-range" aria-label="Scorri per confrontare"></div>
      <div class="due"><label class="campo"><span>Prima</span><select id="cf-a">${l.map(x => `<option value="${x.id}" ${x.id === A.id ? 'selected' : ''}>${fmtDateLong(x.date)}</option>`).join('')}</select></label>
      <label class="campo"><span>Dopo</span><select id="cf-b">${l.map(x => `<option value="${x.id}" ${x.id === B.id ? 'selected' : ''}>${fmtDateLong(x.date)}</option>`).join('')}</select></label></div></section>` : ''}
    ${l.length ? `<div class="griglia-foto">${l.map(x => `<figure><img src="${fotoUrl(x)}" alt="Foto del ${fmtDateLong(x.date)}" loading="lazy"><figcaption>${fmtDateLong(x.date)}<button class="icon-btn small" data-action="foto-del" data-id="${x.id}" aria-label="Elimina foto">${ico('cestino', 14)}</button></figcaption></figure>`).join('')}</div>` : vuoto('Nessuna foto ancora', 'foto')}`;
}

export function viewProgressi() {
  const corpi = { forza, volume, corpo, foto };
  return `${testata('Progressi', '')}
    ${segmenti([['forza', 'Forza'], ['volume', 'Volume'], ['corpo', 'Corpo'], ['foto', 'Foto']], tab, 'prog-tab', 'grosso')}
    ${tab !== 'foto' ? segmenti(PERIODI, period, 'prog-periodo', 'piccolo scorri') : ''}
    <div class="pila">${corpi[tab]()}</div>`;
}

/* ---------- Fogli di inserimento ---------- */
export function foglioPeso() {
  apriFoglio(`<div class="form"><div class="due"><label class="campo"><span>Data</span><input type="date" id="w-data" value="${todayISO()}"></label>
    <label class="campo"><span>Peso (kg)</span><input type="number" inputmode="decimal" step="0.05" id="w-kg" placeholder="${fmt(S.db.weights.at(-1)?.kg || 73, 1)}"></label></div>
    <button class="btn primary full" data-action="peso-salva">Salva pesata</button></div>`, { titolo: 'Nuova pesata' });
  setTimeout(() => document.getElementById('w-kg')?.focus(), 250);
}

export const azioni = {
  'prog-tab': el => { tab = el.dataset.v; app.render(); },
  'prog-periodo': el => { period = +el.dataset.v; app.render(); },
  'prog-metrica': el => { metrica = el.dataset.v; app.render(); },
  'peso-veloce': () => foglioPeso(),
  'peso-salva': () => {
    const kg = num(document.getElementById('w-kg').value), date = document.getElementById('w-data').value;
    if (!kg || !date || kg < 30 || kg > 250) return toast('Scrivi un peso valido');
    S.db.weights = S.db.weights.filter(w => w.date !== date); S.db.weights.push({ id: uid(), date, kg });
    save(); chiudiFoglio(); app.render(); toast('Peso salvato'); queue({ type: 'weight', date, kg });
  },
  fase: el => { cfg().fase = el.dataset.v; save(); app.render(); },
  'mis-bilancia': () => apriFoglio(`<div class="form"><label class="campo"><span>Data</span><input type="date" id="b-data" value="${todayISO()}"></label>
    <div class="due"><label class="campo"><span>Peso (kg)</span><input type="number" inputmode="decimal" id="b-kg"></label><label class="campo"><span>Grasso (%)</span><input type="number" inputmode="decimal" id="b-fat"></label></div>
    <label class="campo"><span>Massa muscolare (kg, facoltativa)</span><input type="number" inputmode="decimal" id="b-mus"></label>
    <button class="btn primary full" data-action="bilancia-salva">Salva</button></div>`, { titolo: 'Dati della bilancia' }),
  'bilancia-salva': () => {
    const v = id => num(document.getElementById(id).value), kg = v('b-kg'), fat = v('b-fat'), muscle = v('b-mus'), date = document.getElementById('b-data').value;
    if (!kg || !date) return toast('Inserisci data e peso');
    if (fat != null && (fat < 3 || fat > 60)) return toast('La % di grasso sembra sbagliata');
    S.db.body = S.db.body.filter(m => m.date !== date); S.db.body.push({ id: uid(), date, kg, fat, muscle });
    if (!S.db.weights.some(w => w.date === date && w.kg === kg)) { S.db.weights = S.db.weights.filter(w => w.date !== date); S.db.weights.push({ id: uid(), date, kg }); queue({ type: 'weight', date, kg }); }
    save(); chiudiFoglio(); app.render(); toast('Misurazione salvata');
  },
  'del-body': async el => { if (await chiedi({ titolo: 'Eliminare la misurazione?', ok: 'Elimina', pericolo: true })) { S.db.body = S.db.body.filter(m => m.id !== el.dataset.id); save(); app.render(); } },
  'mis-nuova': () => { const u = (S.db.misure || []).at(-1) || {};
    apriFoglio(`<div class="form"><label class="campo"><span>Data</span><input type="date" id="m-data" value="${todayISO()}"></label>
      <div class="due">${[['vita', 'Vita'], ['petto', 'Petto'], ['braccio', 'Braccio'], ['coscia', 'Coscia'], ['fianchi', 'Fianchi']].map(([k, l]) => `<label class="campo"><span>${l} (cm)</span><input type="number" inputmode="decimal" id="m-${k}" placeholder="${u[k] ?? ''}"></label>`).join('')}</div>
      <button class="btn primary full" data-action="mis-salva">Salva misure</button></div>`, { titolo: 'Nuove misure' }); },
  'mis-salva': () => {
    const date = document.getElementById('m-data').value, m = { id: uid(), date };
    let ok = false; ['vita', 'petto', 'braccio', 'coscia', 'fianchi'].forEach(k => { const v = num(document.getElementById('m-' + k).value); if (v) { m[k] = v; ok = true; } });
    if (!ok) return toast('Scrivi almeno una misura');
    S.db.misure = (S.db.misure || []).filter(x => x.date !== date); S.db.misure.push(m); save(); chiudiFoglio(); app.render(); toast('Misure salvate');
  },
  'foto-del': async el => { if (await chiedi({ titolo: 'Eliminare la foto?', ok: 'Elimina', pericolo: true })) { await fotoElimina(el.dataset.id); fotoCache = null; confronto = { a: null, b: null, pos: 50 }; app.render(); } },
  'stampa-dimagrimento': () => stampaDimagrimento(period),
};
export function input(t) {
  if (t.id === 'cf-range') { confronto.pos = +t.value; t.closest('.confronto')?.style.setProperty('--pos', t.value + '%'); return true; }
  return false;
}
export async function change(t) {
  if (t.id === 'prog-ex') { chartEx = t.value; app.render(); return true; }
  if (t.id === 'cf-a' || t.id === 'cf-b') { confronto[t.id === 'cf-a' ? 'a' : 'b'] = t.value; app.render(); return true; }
  if (t.id === 'foto-input' && t.files[0]) { await fotoSalva(t.files[0]); fotoCache = null; confronto.a = null; toast('Foto salvata'); app.render(); return true; }
  return false;
}
