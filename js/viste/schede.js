/* ============ SCHEDE ============
   Sessioni, modifica esercizi, libreria con foto e muscoli, esercizi personali,
   storico allenamenti e proposta della nuova scheda. */
import { S, save, cfg, sorted, wVolume, nextSession, copiaSchede, statoProgramma, records, exMaxKg, exE1rm, lastFor } from '../dati.js';
import { esc, fmt, num, toast, chiedi, fmtDateLong, fmtDate, uid, todayISO } from '../util.js';
import { testata, ico, app, apriFoglio, chiudiFoglio, vuoto, segmenti } from '../ui.js';
import { libreria, libDi, visualDi, fotoEs, mappaMuscoli, NOMI_MUSCOLI, GRUPPI, ATTREZZI, MUSCOLI_GRUPPO } from '../libreria.js';
import { propostaScheda, applicaScheda, rimandaScheda, seriePreviste } from '../coach.js';
import { lineChart } from '../grafici.js';

let editS = null, libGruppo = 'Tutti', libQuery = '', libAtt = 'Tutti', proposta = null;
const minuti = sc => Math.round(sc.esercizi.reduce((s, e) => s + (num(e.serie) || 3), 0) * 3.2);

/* ---------- Elenco sessioni ---------- */
export function viewSchede() {
  const ws = sorted().reverse(), next = nextSession(), p = statoProgramma();
  const cards = Object.entries(S.db.schede).map(([k, sc]) => {
    const l = ws.find(w => w.session === k), foto = (sc.esercizi.find(e => fotoEs(e.nome, e.gruppo)));
    return `<article class="card sess ${k === next ? 'next' : ''}">${foto ? `<img class="sess-foto" src="${fotoEs(foto.nome, foto.gruppo, 1)}" alt="" aria-hidden="true">` : ''}
      <div class="sess-in"><div class="row"><span class="lettera">${esc(k)}</span>${k === next ? '<span class="tag">Prossima</span>' : ''}</div>
      <h3>${esc(sc.nome)}</h3><span class="muted small">${sc.esercizi.length} esercizi · ~${minuti(sc)} min · ${l ? 'ultima ' + fmtDate(l.date) : 'mai fatta'}</span>
      <ul class="sess-es">${sc.esercizi.map(e => `<li><span>${esc(e.nome)}</span><span class="muted">${e.serie}×${esc(e.rip)}${e.carico ? ` · ${esc(e.carico)} kg` : ''}</span></li>`).join('')}</ul>
      <div class="row-btns"><button class="btn primary" data-action="start" data-s="${esc(k)}">${ico('play', 16)} Inizia</button>
        <button class="btn" data-action="go" data-view="modifica" data-p="${esc(k)}">${ico('matita', 16)} Modifica</button></div></div></article>`;
  }).join('');
  return `${testata('Schede', `Programma: settimana ${Math.min(p.settimane, Math.floor(p.fatte) + 1)} di ${p.settimane}`)}
    <div class="pila">${cards}
    <div class="griglia2">
      <button class="card azione" data-action="go" data-view="libreria">${ico('manubrio', 26)}<b>Libreria esercizi</b><span class="muted small">${libreria().length} esercizi con foto e muscoli</span></button>
      <button class="card azione" data-action="go" data-view="storico">${ico('calendario', 26)}<b>Storico</b><span class="muted small">${S.db.workouts.length} allenamenti</span></button>
      <button class="card azione" data-action="go" data-view="nuova-scheda">${ico('ripeti', 26)}<b>Nuova scheda</b><span class="muted small">${p.scaduto ? 'è ora di cambiare' : `tra ${Math.max(0, p.mancano)} giorni`}</span></button>
      <button class="card azione" data-action="add-scheda">${ico('piu', 26)}<b>Nuova sessione</b><span class="muted small">aggiungi una lettera</span></button>
    </div></div>`;
}

/* ---------- Modifica sessione ---------- */
export function viewModifica() {
  const keys = Object.keys(S.db.schede);
  if (S.param && keys.includes(S.param)) editS = S.param;
  if (!keys.includes(editS)) editS = keys[0];
  const sc = S.db.schede[editS];
  const tabs = segmenti(keys.map(k => [k, `Sessione ${k}`]), editS, 'edit-s', 'scorri');
  if (!sc) return `${testata('Modifica', '', { back: 'schede' })}${tabs}`;
  const tipi = [['carico', 'Con carico'], ['corpo', 'Corpo libero'], ['tempo', 'A tempo']];
  const n = sc.esercizi.length;
  const cards = sc.esercizi.map((e, i) => `<article class="card ed-es">
    <div class="row"><b>${i + 1}. ${esc(e.nome)}</b><div class="row-btns stretti">
      <button class="icon-btn" data-action="ex-su" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">${ico('su', 18)}</button>
      <button class="icon-btn" data-action="ex-giu" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="Sposta giù">${ico('giu', 18)}</button>
      <button class="icon-btn danger" data-action="ex-del" data-i="${i}" aria-label="Togli esercizio">${ico('cestino', 18)}</button></div></div>
    <label class="campo"><span>Nome esercizio</span><input data-sk="nome" data-i="${i}" value="${esc(e.nome)}" list="lista-esercizi"></label>
    <div class="due"><label class="campo"><span>Gruppo muscolare</span><select data-sk="gruppo" data-i="${i}">${[...new Set([...GRUPPI, e.gruppo].filter(Boolean))].map(g => `<option ${g === e.gruppo ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></label>
      <label class="campo"><span>Tipo</span><select data-sk="tipo" data-i="${i}">${tipi.map(([k, l]) => `<option value="${k}" ${e.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="campo"><span>Serie</span><input type="number" inputmode="numeric" data-sk="serie" data-i="${i}" value="${esc(e.serie)}"></label>
      <label class="campo"><span>${e.tipo === 'tempo' ? 'Secondi' : 'Ripetizioni'}</span><input data-sk="rip" data-i="${i}" value="${esc(e.rip)}" placeholder="8-12"></label>
      ${e.tipo === 'carico' ? `<label class="campo"><span>Carico (kg)</span><input inputmode="decimal" data-sk="carico" data-i="${i}" value="${esc(e.carico)}"></label>` : ''}
      <label class="campo"><span>Recupero</span><input data-sk="recupero" data-i="${i}" value="${esc(e.recupero)}" placeholder="90 sec / 2 min"></label></div>
    <label class="campo"><span>Note</span><input data-sk="note" data-i="${i}" value="${esc(e.note)}" placeholder="Manubri, elastici..."></label></article>`).join('');
  return `${testata('Modifica sessioni', 'Valgono dal prossimo allenamento', { back: 'schede' })}${tabs}
    <datalist id="lista-esercizi">${libreria().map(x => `<option value="${esc(x.nome)}">`).join('')}</datalist>
    <div class="pila"><div class="card"><label class="campo"><span>Nome della sessione ${esc(editS)}</span><input data-sk="sessione-nome" value="${esc(sc.nome)}"></label></div>
    ${cards || vuoto('Nessun esercizio in questa sessione', 'manubrio')}
    <div class="row-btns"><button class="btn primary full" data-action="ex-add">${ico('piu', 18)} Esercizio vuoto</button>
      <button class="btn full" data-action="go" data-view="libreria" data-p="${esc(editS)}">${ico('manubrio', 18)} Dalla libreria</button></div>
    ${Object.keys(S.db.schede).length > 1 ? `<button class="btn danger full" data-action="del-scheda">${ico('cestino', 18)} Elimina sessione ${esc(editS)}</button>` : ''}
    <button class="btn ghost full" data-action="reset-schede">${ico('ripeti', 18)} Ripristina schede originali</button></div>`;
}

/* ---------- Libreria ---------- */
function libLista() {
  const q = libQuery.trim().toLowerCase();
  const items = libreria().filter(x => (libGruppo === 'Tutti' || x.gruppo === libGruppo) && (libAtt === 'Tutti' || x.attrezzo === libAtt) &&
    (!q || `${x.nome} ${x.muscoli || ''} ${x.attrezzo}`.toLowerCase().includes(q)));
  if (!items.length) return vuoto('Nessun esercizio trovato', 'cerca');
  const inSess = nome => Object.entries(S.db.schede).filter(([, sc]) => sc.esercizi.some(e => e.nome.toLowerCase() === nome.toLowerCase())).map(([k]) => k);
  return items.map(x => { const f = fotoEs(x.nome, x.gruppo, 1), g = inSess(x.nome), v = visualDi(x.nome, x.gruppo);
    return `<button class="lib-card" data-action="go" data-view="esercizio" data-p="${esc(x.nome)}">
      <span class="lib-img">${f ? `<img src="${f}" alt="" loading="lazy">` : v ? mappaMuscoli(v.pri, v.sec, 'mini') : ico('manubrio', 22)}</span>
      <span class="lib-t"><b>${esc(x.nome)}${x.mio ? ' <em class="tag">mio</em>' : ''}</b><small>${esc(x.gruppo)} · ${esc(x.attrezzo)}${g.length ? ` · in ${g.join(', ')}` : ''}</small></span>${ico('avanti', 18)}</button>`; }).join('');
}
export function viewLibreria() {
  if (S.param) editS = S.param;
  const gruppi = ['Tutti', ...GRUPPI], att = ['Tutti', ...ATTREZZI];
  return `${testata('Libreria esercizi', `${libreria().length} esercizi per la tua attrezzatura`, { back: S.param ? 'modifica' : 'schede' })}
    <div class="cerca-box">${ico('cerca', 18)}<input id="lib-cerca" type="search" placeholder="Cerca esercizio, muscolo o attrezzo" value="${esc(libQuery)}"></div>
    <div class="chips scorri">${gruppi.map(g => `<button class="pill ${libGruppo === g ? 'on' : ''}" data-action="lib-gruppo" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <div class="chips scorri">${att.map(g => `<button class="pill small ${libAtt === g ? 'on' : ''}" data-action="lib-att" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <div class="lib-lista" id="lib-lista">${libLista()}</div>
    <button class="btn full" data-action="go" data-view="crea-esercizio">${ico('piu', 18)} Crea un esercizio tuo</button>`;
}

/* ---------- Dettaglio esercizio ---------- */
export function viewEsercizio() {
  const nome = S.param, x = libDi(nome) || { nome, gruppo: '', attrezzo: '', tipo: 'carico' };
  const v = visualDi(nome, x.gruppo), f0 = fotoEs(nome, x.gruppo, 0), f1 = fotoEs(nome, x.gruppo, 1);
  const lista = (ids, cls) => ids.map(m => `<span class="mtag ${cls}">${NOMI_MUSCOLI[m] || m}</span>`).join('');
  const storia = sorted().map(w => ({ w, e: w.exercises.find(y => y.nome.toLowerCase() === String(nome).toLowerCase()) })).filter(y => y.e);
  const rec = records()[storia[0]?.e.nome || nome];
  const pts = storia.filter(y => y.e.tipo === 'carico').map(y => ({ x: y.w.date, y: exE1rm(y.e), label: `${fmt(exMaxKg(y.e), 2)} kg (1RM ~${fmt(exE1rm(y.e), 1)})` })).filter(p => p.y);
  const inSess = Object.entries(S.db.schede).filter(([, sc]) => sc.esercizi.some(e => e.nome.toLowerCase() === String(nome).toLowerCase())).map(([k]) => k);
  return `${testata(esc(nome), `${esc(x.gruppo || '')}${x.attrezzo ? ' · ' + esc(x.attrezzo) : ''}`, { back: 'libreria' })}
    <div class="pila">
    ${f0 ? `<div class="vfoto grande"><img src="${f0}" alt="${esc(nome)}: inizio"><img src="${f1}" alt="${esc(nome)}: fine" class="fine"><span class="vtag">Inizio → Fine</span></div>` : ''}
    ${v?.chiavi?.length ? `<div class="chiavi">${v.chiavi.map(c => `<span>${ico('check', 14)} ${esc(c)}</span>`).join('')}</div>` : ''}
    ${v ? `<section class="card"><h3>Muscoli coinvolti</h3><div class="mappa-grande">${mappaMuscoli(v.pri, v.sec)}</div><div class="mtags">${lista(v.pri, 'p')}${lista(v.sec, 's')}</div>
      <div class="mleg"><span><i class="p"></i>Principali</span>${v.sec.length ? '<span><i class="s"></i>Secondari</span>' : ''}</div></section>` : ''}
    ${x.esecuzione ? `<section class="card"><h3>Come si fa</h3><ol class="passi">${x.esecuzione.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
      ${x.errori?.length ? `<h4>Errori da evitare</h4><ul class="errori">${x.errori.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <p class="muted small">Consigliato: ${esc(x.rip)} ${x.tipo === 'tempo' ? 'secondi' : 'ripetizioni'} · recupero ${esc(x.recupero)}</p></section>` : ''}
    <section class="card"><div class="row"><h3>I tuoi progressi</h3>${rec ? `<span class="tag">${ico('trofeo', 14)} ${fmt(rec.kg, 2)} kg × ${rec.reps}</span>` : ''}</div>
      ${pts.length ? lineChart(pts, { unita: 'kg', dec: 1 }) + '<p class="muted small">Massimale stimato (1RM) a ogni allenamento. Tocca il grafico per i dettagli.</p>' : vuoto(storia.length ? 'Esercizio senza carico: guarda lo storico qui sotto' : 'Non hai ancora fatto questo esercizio', 'progressi')}
      ${storia.length ? `<div class="mini-storia">${storia.slice(-6).reverse().map(y => `<div class="row"><span>${fmtDateLong(y.w.date)}</span><span class="muted">${y.e.sets.map(s => y.e.tipo === 'carico' ? `${fmt(s.kg, 2)}×${s.reps}` : s.reps).join(' · ')}</span></div>`).join('')}</div>` : ''}</section>
    <section class="card"><h3>Aggiungi a una sessione</h3><div class="row-btns">${Object.keys(S.db.schede).map(k => inSess.includes(k)
      ? `<button class="btn small" disabled>${ico('check', 14)} ${esc(k)}</button>` : `<button class="btn small primary" data-action="lib-add" data-s="${esc(k)}" data-nome="${esc(nome)}">Sessione ${esc(k)}</button>`).join('')}</div></section>
    ${x.mio ? `<div class="row-btns"><button class="btn full" data-action="go" data-view="crea-esercizio" data-p="${esc(nome)}">${ico('matita', 18)} Modifica</button>
      <button class="btn danger full" data-action="mio-del" data-nome="${esc(nome)}">${ico('cestino', 18)} Elimina</button></div>` : ''}</div>`;
}

/* ---------- Crea / modifica esercizio personale ---------- */
let bozzaEs = null;
export function viewCreaEsercizio() {
  if (!bozzaEs || bozzaEs._per !== S.param) {
    const m = S.param ? (S.db.eserciziMiei || []).find(x => x.nome === S.param) : null;
    bozzaEs = m ? JSON.parse(JSON.stringify(m)) : { nome: '', gruppo: 'Petto', attrezzo: 'Manubri', tipo: 'carico', rip: '10-12', recupero: '90 sec', pri: [], sec: [], esecuzione: [''], errori: [''] };
    bozzaEs._per = S.param; bozzaEs._vecchio = m?.nome || null;
  }
  const b = bozzaEs, muscoli = Object.keys(NOMI_MUSCOLI);
  return `${testata(S.param ? 'Modifica esercizio' : 'Nuovo esercizio', 'Esercizio tuo', { back: 'libreria' })}
    <div class="pila"><div class="card form">
      <label class="campo"><span>Nome</span><input data-bz="nome" value="${esc(b.nome)}" placeholder="Es. Rematore al cavo basso"></label>
      <div class="due"><label class="campo"><span>Gruppo</span><select data-bz="gruppo">${GRUPPI.map(g => `<option ${g === b.gruppo ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        <label class="campo"><span>Attrezzo</span><select data-bz="attrezzo">${ATTREZZI.map(g => `<option ${g === b.attrezzo ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        <label class="campo"><span>Tipo</span><select data-bz="tipo">${[['carico', 'Con carico'], ['corpo', 'Corpo libero'], ['tempo', 'A tempo']].map(([k, l]) => `<option value="${k}" ${b.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="campo"><span>Ripetizioni</span><input data-bz="rip" value="${esc(b.rip)}"></label></div>
      <label class="campo"><span>Recupero</span><input data-bz="recupero" value="${esc(b.recupero)}"></label></div>
    <section class="card"><h3>Muscoli</h3><p class="muted small">Tocca una volta per "principale", due per "secondario", tre per togliere.</p>
      <div class="mappa-grande">${mappaMuscoli(b.pri, b.sec)}</div>
      <div class="chips">${muscoli.map(m => `<button class="pill ${b.pri.includes(m) ? 'on' : b.sec.includes(m) ? 'semi' : ''}" data-action="bz-muscolo" data-m="${m}">${NOMI_MUSCOLI[m]}</button>`).join('')}</div></section>
    <section class="card form"><h3>Come si fa</h3>${b.esecuzione.map((t, i) => `<label class="campo"><span>Passo ${i + 1}</span><input data-bz-lista="esecuzione" data-i="${i}" value="${esc(t)}"></label>`).join('')}
      <button class="btn small ghost" data-action="bz-riga" data-l="esecuzione">${ico('piu', 16)} Passo</button>
      <h4>Errori da evitare</h4>${b.errori.map((t, i) => `<label class="campo"><span>Errore ${i + 1}</span><input data-bz-lista="errori" data-i="${i}" value="${esc(t)}"></label>`).join('')}
      <button class="btn small ghost" data-action="bz-riga" data-l="errori">${ico('piu', 16)} Errore</button></section>
    <button class="btn primary huge full" data-action="bz-salva">${ico('salva', 20)} Salva esercizio</button></div>`;
}

/* ---------- Storico ---------- */
let apertoW = null;
export function viewStorico() {
  const ws = sorted().reverse();
  const perMese = {};
  ws.forEach(w => (perMese[w.date.slice(0, 7)] ||= []).push(w));
  const sync = !!cfg().syncUrl;
  return `${testata('Storico', `${ws.length} allenamenti`, { back: 'schede' })}
    ${ws.length ? Object.entries(perMese).map(([m, l]) => `<h3 class="sez">${new Date(m + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>
      <div class="card lista">${l.map(w => rigaW(w, sync)).join('')}</div>`).join('') : vuoto('Ancora nessun allenamento', 'calendario')}`;
}
function rigaW(w, sync) {
  const open = apertoW === w.id;
  return `<div class="riga-w2 ${open ? 'open' : ''}"><button class="rw-testa" data-action="apri-w" data-id="${esc(w.id)}" aria-expanded="${open}">
    <span class="lettera">${esc(w.session)}</span><span class="rw-t"><b>${fmtDateLong(w.date)}</b><small>${w.exercises.length} esercizi · ${fmt(wVolume(w))} kg${w.durata ? ` · ${w.durata}′` : ''}${w.kcal ? ` · ${w.kcal} kcal` : ''}</small></span>
    ${sync ? `<span class="sync ${w.synced ? 'ok' : ''}" title="${w.synced ? 'Nel foglio' : 'Da inviare'}">${ico('nuvola', 16)}</span>` : ''}${ico(open ? 'su' : 'giu', 18)}</button>
    ${open ? `<div class="rw-det">${w.exercises.map(e => `<div class="row"><b>${esc(e.nome)}</b><span class="muted">${e.sets.map(s => e.tipo === 'carico' ? `${fmt(s.kg, 2)}×${s.reps}${s.rir != null ? ` @${s.rir}` : ''}` : `${s.reps}${e.tipo === 'tempo' ? '″' : ''}`).join(' · ')}</span></div>`).join('')}
      ${w.note ? `<p class="muted small">${ico('nota', 14)} ${esc(w.note)}</p>` : ''}
      <button class="btn small danger" data-action="del-w" data-id="${esc(w.id)}">${ico('cestino', 14)} Elimina</button></div>` : ''}</div>`;
}

/* ---------- Nuova scheda ---------- */
export function viewNuovaScheda() {
  if (!proposta) proposta = propostaScheda();
  const p = statoProgramma(), prev = seriePreviste();
  return `${testata('Nuova scheda', `Programma attuale: ${p.settimane} settimane dal ${fmtDateLong(p.inizio)}`, { back: 'schede' })}
    <div class="pila"><section class="card avviso">${ico('lampo', 22)}<div class="av-txt"><b>Fase proposta: ${proposta.fase === 'forza' ? 'forza e ipertrofia' : 'ipertrofia'}</b>
      <span>${proposta.fase === 'forza' ? 'Il primo esercizio di ogni sessione resta ma scende a 6-8 ripetizioni con più recupero: costruisci forza. Gli altri cambiano per dare uno stimolo nuovo.' : 'Si torna a 8-12 ripetizioni sul primo esercizio, gli altri ruotano.'}
      Cambiare ogni ${cfg().programmaSettimane} settimane evita lo stallo; la durata la cambi in Impostazioni.</span></div></section>
    ${Object.entries(proposta.schede).map(([k, sc]) => `<section class="card"><div class="row"><span class="lettera">${esc(k)}</span><b>${esc(sc.nome)}</b></div>
      <ul class="proposta">${sc.esercizi.map((e, i) => `<li><div><b>${esc(e.nome)}</b><small>${e.serie}×${esc(e.rip)} · ${esc(e.recupero)}${e.carico ? ` · ${esc(e.carico)} kg` : ''}</small><em>${esc(e.motivo || '')}</em></div>
        <button class="icon-btn" data-action="prop-cambia" data-s="${esc(k)}" data-i="${i}" aria-label="Scegli un altro esercizio">${ico('scambia', 18)}</button></li>`).join('')}</ul></section>`).join('')}
    <button class="btn primary huge full" data-action="prop-applica">${ico('check', 20)} Usa questa scheda da oggi</button>
    <div class="row-btns"><button class="btn full" data-action="prop-rigenera">${ico('ripeti', 18)} Altra proposta</button>
      <button class="btn full" data-action="prop-rimanda">Rimanda 2 settimane</button></div>
    <p class="muted small">La scheda attuale viene archiviata: storico e grafici continuano senza interruzioni.</p></div>`;
}

/* ---------- Azioni ---------- */
const sc = () => S.db.schede[editS];
export const azioni = {
  'edit-s': el => { editS = el.dataset.v; S.param = editS; app.render(); },
  'add-scheda': () => {
    const keys = Object.keys(S.db.schede); let k = 'A';
    for (let c = 65; c <= 90; c++) { const x = String.fromCharCode(c); if (!keys.includes(x)) { k = x; break; } }
    S.db.schede[k] = { nome: 'Nuova sessione', esercizi: [] }; editS = k; save();
    toast(`Sessione ${k} creata. Per sincronizzarla crea nel foglio la scheda "Sessione ${k}"`);
    app.go('modifica', k);
  },
  'del-scheda': async () => {
    if (Object.keys(S.db.schede).length > 1 && await chiedi({ titolo: `Eliminare la sessione ${editS}?`, testo: 'Lo storico degli allenamenti resta.', ok: 'Elimina', pericolo: true })) {
      delete S.db.schede[editS]; editS = null; S.param = null; save(); app.render();
    }
  },
  'ex-add': () => { sc().esercizi.push({ nome: 'Nuovo esercizio', gruppo: 'Petto', tipo: 'carico', serie: 3, rip: '10-12', carico: '', recupero: '90 sec', note: '' }); save(); app.render(); setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 50); },
  'ex-del': async el => { const i = +el.dataset.i; if (await chiedi({ titolo: `Togliere ${sc().esercizi[i].nome}?`, testo: `Dalla sessione ${editS}.`, ok: 'Togli', pericolo: true })) { sc().esercizi.splice(i, 1); save(); app.render(); } },
  'ex-su': el => { const i = +el.dataset.i, a = sc().esercizi; if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; save(); app.render(); } },
  'ex-giu': el => { const i = +el.dataset.i, a = sc().esercizi; if (i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; save(); app.render(); } },
  'reset-schede': async () => { if (await chiedi({ titolo: 'Ripristinare le schede originali?', testo: 'Le modifiche agli esercizi andranno perse.', ok: 'Ripristina', pericolo: true })) { S.db.schede = copiaSchede(); editS = null; save(); app.render(); } },
  'lib-gruppo': el => { libGruppo = el.dataset.v; app.render(); },
  'lib-att': el => { libAtt = el.dataset.v; app.render(); },
  'lib-add': el => {
    const x = libDi(el.dataset.nome), k = el.dataset.s; if (!x || !S.db.schede[k]) return;
    const last = lastFor(x.nome);
    S.db.schede[k].esercizi.push({ nome: x.nome, gruppo: x.gruppo, tipo: x.tipo, serie: 3, rip: x.rip, carico: last ? String(exMaxKg(last.ex) || '') : '', recupero: x.recupero, note: x.attrezzo });
    save(); app.render(); toast(`${x.nome} aggiunto alla sessione ${k}`);
  },
  'apri-w': el => { const id = el.dataset.id; if (S.view !== 'storico') { apertoW = id; app.go('storico'); return; } apertoW = apertoW === id ? null : id; app.render(); },
  'del-w': async el => {
    if (await chiedi({ titolo: 'Eliminare questo allenamento?', testo: 'Dal foglio Google va cancellato a mano.', ok: 'Elimina', pericolo: true })) {
      const id = el.dataset.id; S.db.workouts = S.db.workouts.filter(w => w.id !== id);
      S.db.outbox = S.db.outbox.filter(o => !(o.type === 'workout' && o.workout.id === id)); save(); app.render();
    }
  },
  'bz-muscolo': el => { const m = el.dataset.m, b = bozzaEs;
    if (b.pri.includes(m)) { b.pri = b.pri.filter(x => x !== m); b.sec.push(m); } else if (b.sec.includes(m)) b.sec = b.sec.filter(x => x !== m); else b.pri.push(m); app.render(); },
  'bz-riga': el => { bozzaEs[el.dataset.l].push(''); app.render(); },
  'bz-salva': () => {
    const b = bozzaEs, nome = b.nome.trim();
    if (!nome) return toast('Scrivi il nome dell\'esercizio');
    if (!b._vecchio && libDi(nome)) return toast('Esiste già un esercizio con questo nome');
    const es = { nome, gruppo: b.gruppo, attrezzo: b.attrezzo, tipo: b.tipo, rip: b.rip, recupero: b.recupero, pri: b.pri.length ? b.pri : (MUSCOLI_GRUPPO[b.gruppo] || []), sec: b.sec,
      muscoli: [...b.pri, ...b.sec].map(m => NOMI_MUSCOLI[m]).join(', '), esecuzione: b.esecuzione.filter(Boolean), errori: b.errori.filter(Boolean) };
    S.db.eserciziMiei = (S.db.eserciziMiei || []).filter(x => x.nome !== b._vecchio && x.nome !== nome);
    S.db.eserciziMiei.push(es);
    if (b._vecchio && b._vecchio !== nome) Object.values(S.db.schede).forEach(s => s.esercizi.forEach(e => { if (e.nome === b._vecchio) e.nome = nome; }));
    bozzaEs = null; save(); toast('Esercizio salvato'); app.go('esercizio', nome);
  },
  'mio-del': async el => {
    if (await chiedi({ titolo: `Eliminare ${el.dataset.nome}?`, testo: 'Le sessioni che lo usano lo tengono, lo storico resta.', ok: 'Elimina', pericolo: true })) {
      S.db.eserciziMiei = S.db.eserciziMiei.filter(x => x.nome !== el.dataset.nome); save(); app.go('libreria');
    }
  },
  'prop-rigenera': () => { proposta = propostaScheda(); /* mescola: cambia un esercizio a caso per sessione */
    Object.entries(proposta.schede).forEach(([k, s]) => { const i = 1 + Math.floor(Math.random() * Math.max(1, s.esercizi.length - 1)); cambiaProposta(k, i); }); app.render(); },
  'prop-cambia': el => { cambiaProposta(el.dataset.s, +el.dataset.i); app.render(); },
  'prop-applica': async () => {
    if (!(await chiedi({ titolo: 'Usare la nuova scheda?', testo: 'Da oggi le sessioni cambiano. Quella vecchia resta archiviata.', ok: 'Usa da oggi' }))) return;
    applicaScheda(proposta.schede); proposta = null; save(); toast('💪 Nuova scheda attiva!'); app.go('schede');
  },
  'prop-rimanda': () => { rimandaScheda(14); save(); proposta = null; toast('Te lo ricordo tra 2 settimane'); app.go('oggi'); },
};
function cambiaProposta(k, i) {
  const s = proposta.schede[k], e = s.esercizi[i]; if (!e) return;
  const usati = new Set(Object.values(proposta.schede).flatMap(x => x.esercizi.map(y => y.nome)));
  const alt = libreria().filter(x => x.gruppo === e.gruppo && x.tipo === e.tipo && !usati.has(x.nome) && x.nome !== 'Trazioni');
  if (!alt.length) return toast('Nessun\'altra alternativa per ' + e.gruppo);
  const x = alt[Math.floor(Math.random() * alt.length)], last = lastFor(x.nome);
  s.esercizi[i] = { nome: x.nome, gruppo: x.gruppo, tipo: x.tipo, serie: e.serie, rip: x.rip, carico: last ? String(exMaxKg(last.ex) || '') : '', recupero: x.recupero, note: x.attrezzo, motivo: 'Scelto da te' };
}
export function input(t) {
  if (t.id === 'lib-cerca') { libQuery = t.value; const l = document.getElementById('lib-lista'); if (l) l.innerHTML = libLista(); return true; }
  if (t.dataset.sk && S.db.schede[editS]) {
    const s = S.db.schede[editS], k = t.dataset.sk;
    if (k === 'sessione-nome') s.nome = t.value;
    else { const e = s.esercizi[+t.dataset.i]; e[k] = k === 'serie' ? (parseInt(t.value) || 1) : t.value;
      if (k === 'nome') { const x = libDi(t.value); if (x) { e.gruppo = x.gruppo; e.tipo = x.tipo; } } }
    save(); return true;
  }
  if (t.dataset.bz && bozzaEs) { bozzaEs[t.dataset.bz] = t.value; return true; }
  if (t.dataset.bzLista && bozzaEs) { bozzaEs[t.dataset.bzLista][+t.dataset.i] = t.value; return true; }
  return false;
}
export function change(t) {
  if (t.dataset.sk === 'tipo' || t.dataset.sk === 'gruppo' || (t.dataset.sk === 'nome' && libDi(t.value))) { app.render(); return true; }
  if (t.dataset.bz === 'tipo') { app.render(); return true; }
  return false;
}
