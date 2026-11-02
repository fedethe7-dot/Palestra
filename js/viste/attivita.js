/* ============ ATTIVITÀ ============
   Passi, calorie e allenamenti: dati dell'orologio (file importati) + attività extra scritte a mano
   (calcetto, corsa, bici…). Niente doppioni: un'attività scritta a mano che l'orologio ha già
   registrato lo stesso giorno con lo stesso nome viene mostrata ma non contata due volte. */
import { S, save, cfg, sorted, bodyKg } from '../dati.js';
import { esc, fmt, num, todayISO, isoFrom, addDays, weekStart, fmtDate, fmtDateLong, fmtDateFull, uid, toast, chiedi, parseISO } from '../util.js';
import { ico, app, vuoto, apriFoglio, chiudiFoglio } from '../ui.js';
import { barChart } from '../grafici.js';
import { leggiFile, unisci, decifra } from '../orologio-file.js';

/* Tipi di sessione dell'orologio (il file dà solo un numero): si possono rinominare dall'app */
export const TIPI_OROLOGIO = { 1: 'Corsa', 6: 'Camminata', 9: 'Bici', 18: 'Calcetto', 52: 'Palestra' };
/* Attività extra veloci: nome, emoji, MET (per stimare le kcal se non le scrivi) */
export const TIPI_EXTRA = [['Calcetto', '⚽', 8], ['Corsa', '🏃', 9], ['Camminata', '🚶', 3.5], ['Bici', '🚴', 6.5], ['Nuoto', '🏊', 7], ['Altro', '✨', 5]];

const oro = () => S.db.orologio || (S.db.orologio = { giorni: {}, sport: [] });
export const nomeTipo = t => (cfg().tipiOrologio || {})[t] || TIPI_OROLOGIO[t] || `Attività (tipo ${t})`;
const isPalestra = s => s.tipo === '52' || /palestra|pesi|forza/i.test(nomeTipo(s.tipo));
const emoji = nome => (TIPI_EXTRA.find(([x]) => x.toLowerCase() === String(nome).trim().toLowerCase()) || [0, '🏅'])[1];
const met = nome => (TIPI_EXTRA.find(([x]) => x.toLowerCase() === String(nome).trim().toLowerCase()) || [0, 0, 5])[2];
export const stimaKcalExtra = (nome, min) => Math.round(met(nome) * (bodyKg() || 73) * (num(min) || 0) / 60);

/* Tutte le attività dal giorno "da" in poi (orologio + a mano), dalla più recente */
export function attivita(da = '') {
  const out = [];
  oro().sport.forEach(s => { if (s.data >= da) out.push({ fonte: 'orologio', id: s.id, data: s.data, ora: s.ora || '', tipo: s.tipo, nome: nomeTipo(s.tipo), min: Math.round(s.sec / 60), km: s.m ? s.m / 1000 : 0, kcal: s.kcal || 0, palestra: isPalestra(s) }); });
  const k = (d, n) => d + '|' + String(n).trim().toLowerCase();
  const dallOrologio = new Set(out.map(a => k(a.data, a.nome)));
  (S.db.extra || []).forEach(e => { if (e.data >= da) out.push({ fonte: 'mano', id: e.id, data: e.data, ora: '', nome: e.nome, min: e.min, km: 0, kcal: e.kcal || 0, stima: !!e.stima, note: e.note || '', palestra: false, doppione: dallOrologio.has(k(e.data, e.nome)) }); });
  return out.sort((a, b) => (b.data + b.ora).localeCompare(a.data + a.ora));
}

/* Numeri del periodo */
export function riepilogo(da = '') {
  const giorni = Object.entries(oro().giorni).filter(([d]) => d >= da);
  const att = attivita(da), extra = att.filter(a => !a.palestra && !a.doppione);
  const giorniOro = new Set(giorni.map(([d]) => d));
  const giorniPalestra = new Set([...sorted().filter(w => w.date >= da).map(w => w.date), ...att.filter(a => a.palestra).map(a => a.data)]);
  const kcalOro = giorni.reduce((s, [, v]) => s + v[2], 0);
  const kcalMano = extra.filter(a => a.fonte === 'mano' && !giorniOro.has(a.data)).reduce((s, a) => s + a.kcal, 0);   // giorni senza orologio
  return {
    giorni: giorni.length,
    passiMedia: giorni.length ? giorni.reduce((s, [, v]) => s + v[0], 0) / giorni.length : null,
    kcalMedia: giorni.length ? kcalOro / giorni.length : null,
    kcalTot: kcalOro + kcalMano,
    palestra: giorniPalestra.size, giorniPalestra,
    extra: extra.length, extraMin: extra.reduce((s, a) => s + (a.min || 0), 0), extraKcal: extra.reduce((s, a) => s + a.kcal, 0),
    att,
  };
}

/* Raggruppa per settimana (periodi brevi) o per mese */
function gruppi(da, perSettimana) {
  const date = Object.keys(oro().giorni).concat((S.db.extra || []).map(e => e.data), sorted().map(w => w.date)).filter(d => d >= da).sort();
  if (!date.length) return [];
  const chiave = d => perSettimana ? weekStart(parseISO(d)) : d.slice(0, 7);
  const out = []; let d = perSettimana ? weekStart(parseISO(da || date[0])) : (da || date[0]).slice(0, 7) + '-01';
  const fine = todayISO();
  while (d <= fine) {
    const prossimo = perSettimana ? addDays(d, 7) : (() => { const x = parseISO(d); x.setMonth(x.getMonth() + 1); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-01'; })();
    out.push({ k: chiave(d), da: d, a: prossimo, label: perSettimana ? fmtDate(d) : parseISO(d).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }) });
    d = prossimo;
  }
  return out;
}

let tutte = false;
export function tabAttivita(period) {
  const da = period ? isoFrom(period) : '';
  const r = riepilogo(da), o = oro();
  const dateOro = Object.keys(o.giorni).sort();
  const perSettimana = period && period <= 90;
  const g = gruppi(da, perSettimana);
  const cosa = perSettimana ? 'a settimana' : 'al mese';
  const inG = (x, d) => d >= x.da && d < x.a;
  const passi = g.map((x, i) => { const v = Object.entries(o.giorni).filter(([d]) => inG(x, d)).map(([, v]) => v[0]); return { label: x.label, value: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0, evid: i === g.length - 1 }; });
  const kcal = g.map((x, i) => {
    const gg = Object.entries(o.giorni).filter(([d]) => inG(x, d)), giorniOro = new Set(gg.map(([d]) => d));
    const mano = r.att.filter(a => a.fonte === 'mano' && !a.doppione && inG(x, a.data) && !giorniOro.has(a.data)).reduce((s, a) => s + a.kcal, 0);
    return { label: x.label, value: gg.reduce((s, [, v]) => s + v[2], 0) + mano, evid: i === g.length - 1 };
  });
  const sessioni = g.map((x, i) => ({ label: x.label, value: [...r.giorniPalestra].filter(d => inG(x, d)).length + r.att.filter(a => !a.palestra && !a.doppione && inG(x, a.data)).length, evid: i === g.length - 1 }));
  const lista = tutte ? r.att : r.att.slice(0, 20);

  const storico = !o.storico ? `<section class="card avviso">${ico('nuvola', 22)}<div class="av-txt"><b>Storico dell'orologio pronto</b>
      <span>Passi, calorie e sessioni dal 2022 a oggi, già preparati e protetti da un codice.</span>
      <div class="row-btns"><button class="btn small primary" data-action="oro-storico">Carica con il codice</button></div></div></section>` : '';
  return `${storico}
    <div class="row-btns"><button class="btn primary" data-action="att-nuova">${ico('piu', 18)} Attività extra</button>
      <button class="btn" data-action="oro-importa">⌚ Importa file orologio</button></div>
    <section class="tiles">
      <div class="tile"><span class="t-lab">Passi</span><b class="t-val">${r.passiMedia != null ? fmt(r.passiMedia) : '—'}</b><span class="t-sub">media al giorno${r.giorni ? ` · ${r.giorni} giorni` : ''}</span></div>
      <div class="tile"><span class="t-lab">Kcal attive</span><b class="t-val">${r.kcalTot ? fmt(r.kcalTot) : '—'}</b><span class="t-sub">${r.kcalMedia != null ? `${fmt(r.kcalMedia)} al giorno` : 'totale'}</span></div>
      <div class="tile"><span class="t-lab">Palestra</span><b class="t-val">${r.palestra}</b><span class="t-sub">allenamenti (app + orologio)</span></div>
      <div class="tile"><span class="t-lab">Attività extra</span><b class="t-val">${r.extra}</b><span class="t-sub">${fmt(r.extraMin)} min · ${fmt(r.extraKcal)} kcal</span></div></section>
    <section class="card"><h3>Passi ${cosa} <small class="muted">(media al giorno)</small></h3>${barChart(passi, { unita: 'passi', kilo: true })}</section>
    <section class="card"><h3>Kcal attive ${cosa}</h3>${barChart(kcal, { unita: 'kcal', kilo: true })}</section>
    <section class="card"><h3>Allenamenti e attività ${cosa}</h3>${barChart(sessioni, { unita: 'sessioni' })}
      <p class="muted small">Palestra (dall'app o dall'orologio, una volta per giorno) più calcetto e altre attività.</p></section>
    <section class="card"><div class="row"><h3>Attività</h3><span class="tag">${r.att.length}</span></div>
      ${lista.length ? lista.map(rigaAttivita).join('') : vuoto('Nessuna attività nel periodo', 'fuoco')}
      ${r.att.length > 20 ? `<button class="chip-btn" data-action="att-tutte">${tutte ? 'Mostra meno' : `Mostra tutte (${r.att.length})`}</button>` : ''}</section>
    <p class="muted small">${dateOro.length ? `Dati dell'orologio dal ${fmtDateFull(dateOro[0])} al ${fmtDateFull(dateOro.at(-1))}${o.ultimoImport ? `, ultimo import ${fmtDateFull(o.ultimoImport.slice(0, 10))}` : ''}.` : 'Nessun dato dell\'orologio ancora.'}
      Per aggiornarli: esporta i dati dall'app dell'orologio e importa i file ACTIVITY e SPORT (anche tutti insieme: gli altri vengono saltati, i doppioni pure).</p>`;
}

function rigaAttivita(a) {
  const det = [fmtDateLong(a.data) + (a.ora ? ' ' + a.ora : ''), a.min ? a.min + ' min' : '', a.km >= 0.1 ? fmt(a.km, 1) + ' km' : '', a.kcal ? fmt(a.kcal) + ' kcal' + (a.stima ? ' (stima)' : '') : '',
    a.fonte === 'orologio' ? '⌚' : '✍️'].filter(Boolean).join(' · ');
  const nota = a.doppione ? `<small>già registrata dall'orologio: non la conto due volte</small>` : a.note ? `<small>${esc(a.note)}</small>` : '';
  const btn = a.fonte === 'mano'
    ? `<button class="icon-btn small" data-action="att-del" data-id="${esc(a.id)}" aria-label="Elimina">${ico('cestino', 16)}</button>`
    : `<button class="icon-btn small" data-action="oro-tipo" data-t="${esc(a.tipo)}" aria-label="Rinomina il tipo">${ico('matita', 16)}</button>`;
  return `<div class="pasto-riga"><span><b>${a.palestra ? '🏋️' : emoji(a.nome)} ${esc(a.nome)}</b><small>${det}</small>${nota}</span>${btn}</div>`;
}

/* ---------- Scheda Oggi: la settimana in movimento ---------- */
export function cardAttivitaOggi() {
  const wk = weekStart(), r = riepilogo(wk), o = oro();
  const ultimo = Object.keys(o.giorni).sort().at(-1);
  return `<section class="card"><div class="row"><h3>Movimento della settimana</h3><button class="btn small primary" data-action="att-nuova">${ico('piu', 16)} Attività</button></div>
    <div class="tiles">
      <div class="tile"><span class="t-lab">Extra</span><b class="t-val">${r.extra}</b><span class="t-sub">${fmt(r.extraMin)} min · ${fmt(r.extraKcal)} kcal</span></div>
      <div class="tile"><span class="t-lab">Passi</span><b class="t-val">${r.passiMedia != null ? fmt(r.passiMedia) : '—'}</b><span class="t-sub">${ultimo ? `media · orologio al ${fmtDate(ultimo)}` : 'importa dall\'orologio'}</span></div></div></section>`;
}

/* ---------- Import dei file dell'orologio ---------- */
export async function importaOrologio(files) {
  try {
    const testi = await Promise.all([...files].map(async f => ({ nome: f.name, testo: await f.text() })));
    const { nuovo, letti, saltati } = leggiFile(testi);
    if (!letti.length) return toast('⚠️ Nessun file ACTIVITY o SPORT tra quelli scelti', 'err');
    const r = unisci(oro(), nuovo);
    S.db.orologio = { ...r.dati, ultimoImport: new Date().toISOString() };
    save(); app.render();
    toast(`⌚ ${r.giorniNuovi} giorni nuovi, ${r.giorniAgg} aggiornati, ${r.sportNuovi} sessioni nuove${saltati.length ? ` · ${saltati.length} file non necessari saltati` : ''}`);
  } catch (e) { toast('⚠️ Non riesco a leggere i file: ' + (e.message || e), 'err'); }
}

function foglioAttivita() {
  const usate = (S.db.extra || []).map(e => e.nome), nome = usate.at(-1) || 'Calcetto';
  apriFoglio(`<div class="form">
    <div class="chips" id="a-tipi">${TIPI_EXTRA.map(([n, e]) => `<button class="pill ${n === nome ? 'on' : ''}" data-action="att-tipo" data-v="${esc(n)}">${e} ${n}</button>`).join('')}</div>
    <label class="campo"><span>Attività</span><input id="a-nome" value="${esc(nome)}" maxlength="40" autocomplete="off"></label>
    <div class="due"><label class="campo"><span>Data</span><input type="date" id="a-data" value="${todayISO()}" max="${todayISO()}"></label>
      <label class="campo"><span>Minuti</span><input type="number" inputmode="numeric" id="a-min" min="1" max="600" placeholder="60"></label></div>
    <label class="campo"><span>Kcal (dall'orologio, se le hai)</span><input type="number" inputmode="numeric" id="a-kcal" min="0" max="5000" placeholder="vuoto = le stimo io"></label>
    <p class="muted small" id="a-stima">Scrivi i minuti: se lasci vuote le kcal le stimo dal tuo peso.</p>
    <label class="campo"><span>Note (facoltative)</span><input id="a-note" maxlength="120" autocomplete="off"></label>
    <button class="btn primary full" data-action="att-salva">Salva attività</button></div>`, { titolo: 'Attività extra', id: 'att' });
}
function aggiornaStima() {
  const el = document.getElementById('a-stima'); if (!el) return;
  const min = num(document.getElementById('a-min').value), nome = document.getElementById('a-nome').value;
  el.textContent = min ? `Stima se lasci vuote le kcal: circa ${fmt(stimaKcalExtra(nome, min))} kcal (${fmt(bodyKg() || 73, 1)} kg).` : 'Scrivi i minuti: se lasci vuote le kcal le stimo dal tuo peso.';
}

export const azioni = {
  'att-nuova': () => foglioAttivita(),
  'att-tipo': el => { document.getElementById('a-nome').value = el.dataset.v; document.querySelectorAll('#a-tipi .pill').forEach(p => p.classList.toggle('on', p === el)); aggiornaStima(); },
  'att-salva': async () => {
    const v = id => document.getElementById(id).value.trim();
    const nome = v('a-nome'), data = v('a-data'), min = num(v('a-min')), kcalScritte = v('a-kcal') === '' ? null : num(v('a-kcal'));
    if (!nome) return toast('Scrivi che attività hai fatto');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || data > todayISO()) return toast('Controlla la data');
    if (!min || min < 1 || min > 600) return toast('Scrivi i minuti (da 1 a 600)');
    if (kcalScritte != null && (kcalScritte < 0 || kcalScritte > 5000)) return toast('Le kcal sembrano sbagliate');
    const k = x => x.data + '|' + String(x.nome).trim().toLowerCase();
    if ((S.db.extra || []).some(e => k(e) === k({ data, nome })) &&
      !(await chiedi({ titolo: `Hai già segnato ${nome} in questa data`, testo: 'Vuoi aggiungerne un\'altra?', ok: 'Aggiungi' }))) return;
    const giaOrologio = oro().sport.some(s => s.data === data && nomeTipo(s.tipo).toLowerCase() === nome.toLowerCase());
    S.db.extra = S.db.extra || [];
    S.db.extra.push({ id: uid(), data, nome, min: Math.round(min), kcal: kcalScritte != null ? Math.round(kcalScritte) : stimaKcalExtra(nome, min), stima: kcalScritte == null, note: v('a-note') });
    save(); chiudiFoglio(); app.render();
    toast(giaOrologio ? `Salvata. L'orologio ha già ${nome} in quel giorno: la conto una volta sola` : `${emoji(nome)} ${nome} salvato`);
  },
  'att-del': async el => {
    if (!(await chiedi({ titolo: 'Eliminare l\'attività?', ok: 'Elimina', pericolo: true }))) return;
    S.db.extra = (S.db.extra || []).filter(e => e.id !== el.dataset.id); save(); app.render();
  },
  'att-tutte': () => { tutte = !tutte; app.render(); },
  'oro-importa': () => app.pickFile('orologio'),
  'oro-tipo': el => {
    const t = el.dataset.t;
    apriFoglio(`<div class="form"><p class="muted small">L'orologio salva questo tipo di sessione come numero ${esc(t)}. Dagli il nome giusto: vale per tutte le sessioni di questo tipo.</p>
      <label class="campo"><span>Nome</span><input id="ot-nome" value="${esc(nomeTipo(t))}" maxlength="30"></label>
      <button class="btn primary full" data-action="oro-tipo-ok" data-t="${esc(t)}">Salva</button></div>`, { titolo: 'Tipo di attività' });
  },
  'oro-tipo-ok': el => {
    const v = document.getElementById('ot-nome').value.trim(); if (!v) return toast('Scrivi un nome');
    cfg().tipiOrologio = { ...(cfg().tipiOrologio || {}), [el.dataset.t]: v }; save(); chiudiFoglio(); app.render(); toast('Nome salvato');
  },
  'oro-storico': () => {
    apriFoglio(`<div class="form"><p class="muted small">Lo storico è salvato cifrato: senza il codice nessuno può leggerlo. Il codice te l'ha dato Claude in chat.</p>
      <label class="campo"><span>Codice</span><input id="os-cod" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX"></label>
      <button class="btn primary full" data-action="oro-storico-ok">Carica lo storico</button></div>`, { titolo: 'Storico dell\'orologio' });
    setTimeout(() => document.getElementById('os-cod')?.focus(), 250);
  },
  'oro-storico-ok': async el => {
    const cod = document.getElementById('os-cod').value.trim(); if (!cod) return toast('Scrivi il codice');
    el.disabled = true; el.textContent = 'Apro lo storico…';
    try {
      const res = await fetch('dati/orologio-storico.enc', { cache: 'no-store' });
      if (!res.ok) throw new Error('file dello storico non trovato');
      let dati;
      try { dati = await decifra(await res.json(), cod); } catch (e) { throw new Error('codice sbagliato'); }
      const r = unisci(oro(), dati);
      S.db.orologio = { ...r.dati, storico: true, ultimoImport: S.db.orologio?.ultimoImport || new Date().toISOString() };
      save(); chiudiFoglio(); app.render();
      toast(`⌚ Storico caricato: ${r.giorniNuovi} giorni e ${r.sportNuovi} sessioni`);
    } catch (e) { toast('⚠️ ' + (e.message || e), 'err'); el.disabled = false; el.textContent = 'Carica lo storico'; }
  },
};
export function input(t) { if (t.id === 'a-min' || t.id === 'a-nome') { aggiornaStima(); return true; } return false; }
