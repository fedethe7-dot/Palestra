/* ============ ALLENAMENTO IN CORSO ============
   Un esercizio alla volta: serie con "precedente", pulsanti grandi −/+, RIR, dischi da montare,
   recupero automatico, esercizi a tempo con conto 3-2-1, riepilogo finale. */
import { S, save, cfg, records, lastFor, durataAuto, durataDraft, riallineaTempo, stimaKcal, bodyKg, nextSession } from '../dati.js';
import { esc, fmt, num, todayISO, toast, chiedi, restSec, vibra, uid, secTxt, clamp, fmtDateLong } from '../util.js';
import { ico, app, apriFoglio, chiudiFoglio, stepper, festa } from '../ui.js';
import { obiettivo, passoKg, dischiBilanciere, dischiCarrucola, riscaldamento, eRecord, rangeDi } from '../coach.js';
import { libDi, visualDi, fotoEs, attrezzoDi, alternative, mappaMuscoli, NOMI_MUSCOLI, libreria, GRUPPI } from '../libreria.js';
import { startRest, stopRest, addRest, apriRestFull, chiudiRestFull, workStato, workDur, workStart, workPause, workResume, workReset, workStop, workSetDur, schermoAcceso, sbloccaAudio, beep } from '../timer.js';
import { queue, workoutPayload } from '../sync.js';

const repsDi = s => s.reps !== '' && s.reps != null ? s.reps : s.target;
const kgTxt = v => v === '' || v == null ? '—' : fmt(num(v), 2);
export const exFatto = e => e.sets.length && e.sets.every(s => s.done);
const setCorrente = e => { const i = e.sets.findIndex(s => s.sel && !s.done); if (i >= 0) return i; const j = e.sets.findIndex(s => !s.done); return j < 0 ? -1 : j; };

/* ---------- Avvio ---------- */
export function nuovoEsercizio(e) {
  const ob = obiettivo(e), last = lastFor(e.nome), serie = num(e.serie) || 3;
  const kgBase = e.tipo === 'carico' ? (ob.kg ?? num(last?.ex.sets.at(-1)?.kg) ?? num(e.carico) ?? '') : '';
  return { ...e, coach: { testo: ob.testo, tipo: ob.tipo },
    sets: Array.from({ length: serie }, (_, j) => ({ kg: kgBase, reps: '', target: ob.reps[j] ?? ob.reps.at(-1) ?? '', rir: null, done: false })) };
}
export function startWorkout(k) {
  const sc = S.db.schede[k]; if (!sc) return;
  sbloccaAudio();
  S.db.draft = { id: uid(), session: k, date: todayISO(), note: '', startedAt: Date.now(), durata: '', kcalWatch: '', cur: 0, rest: null, work: null,
    exercises: sc.esercizi.map(nuovoEsercizio) };
  save(); app.go('allena');
}

/* ---------- Pezzi della schermata ---------- */
function dischiInfo(e, kg) {
  kg = num(kg); if (!kg) return '';
  const att = attrezzoDi(e);
  if (att === 'Bilanciere') {
    const r = dischiBilanciere(kg);
    if (r.sotto) return `<div class="dischi">Solo bilanciere (${fmt(num(S.db.settings.attrezzatura.bilanciere), 1)} kg)</div>`;
    return `<div class="dischi" aria-label="Dischi per lato">${ico('dischi', 18)}<span>Per lato:</span>${r.lato.length ? r.lato.map(d => `<i class="disco d${String(d).replace('.', '_')}">${fmt(d, 2)}</i>`).join('') : '<em>niente</em>'}
      ${r.esatto ? '' : `<em class="warn">non esatto: ${fmt(r.totale, 2)} kg con i tuoi dischi</em>`}</div>`;
  }
  if (att === 'Carrucola alta') {
    const r = dischiCarrucola(kg);
    return `<div class="dischi">${ico('dischi', 18)}<span>Carrucola:</span>${r.dischi.map(d => `<i class="disco d${String(d).replace('.', '_')}">${fmt(d, 2)}</i>`).join('') || '<em>—</em>'}
      ${r.oltre ? `<em class="warn">oltre il massimo (${fmt(r.max)} kg)</em>` : r.esatto ? '' : `<em class="warn">${fmt(r.totale, 2)} kg con i tuoi dischi</em>`}</div>`;
  }
  return '';
}
function tabellaSerie(e, i) {
  const last = lastFor(e.nome, S.db.draft.date), cur = setCorrente(e);
  const unit = e.tipo === 'tempo' ? 'Secondi' : 'Rip';
  const prec = j => { const s = last?.ex.sets[j]; if (!s) return '—'; return e.tipo === 'carico' ? `${kgTxt(s.kg)} × ${s.reps}` : `${s.reps}${e.tipo === 'tempo' ? '″' : ''}`; };
  return `<div class="serie ${e.tipo === 'carico' ? 'con-kg' : ''}" role="table" aria-label="Serie">
    <div class="s-riga s-testa" role="row"><span>Serie</span><span>Ultima</span>${e.tipo === 'carico' ? '<span>Kg</span>' : ''}<span>${unit}</span><span>RIR</span><span class="sr-only">Fatta</span></div>
    ${e.sets.map((s, j) => {
      const stato = s.done ? 'fatta' : j === cur ? 'cur' : 'todo';
      const reps = s.reps !== '' ? s.reps : s.target !== '' && s.target != null ? s.target : '—';
      return `<div class="s-riga ${stato} ${s.warm ? 'warm' : ''}" role="row">
        <button class="s-sel" data-action="set-sel" data-ex="${i}" data-set="${j}" aria-label="Serie ${j + 1}">${s.warm ? 'R' : j + 1 - e.sets.slice(0, j).filter(x => x.warm).length}</button>
        <span class="s-prec">${s.warm ? 'riscald.' : prec(j - e.sets.slice(0, j).filter(x => x.warm).length)}</span>
        ${e.tipo === 'carico' ? `<span class="s-val">${kgTxt(s.kg)}</span>` : ''}
        <span class="s-val ${s.reps === '' && !s.done ? 'tgt' : ''}">${reps}</span>
        <span class="s-rir">${s.rir == null ? '' : s.rir >= 4 ? '4+' : s.rir}</span>
        <button class="s-ok ${s.done ? 'on' : ''}" data-action="set-done" data-ex="${i}" data-set="${j}" aria-label="${s.done ? 'Annulla serie' : 'Segna serie fatta'}" aria-pressed="${s.done}">${ico('check', 18)}</button></div>`; }).join('')}
  </div>`;
}
function editorSerie(e, i) {
  const j = setCorrente(e); if (j < 0) return '';
  const s = e.sets[j], passo = passoKg(e);
  if (e.tipo === 'tempo') return pannelloTempo(e);
  const repsVal = s.reps !== '' ? s.reps : (s.target ?? '');
  return `<div class="editor" data-ex="${i}" data-set="${j}">
    <div class="ed-steppers ${e.tipo === 'carico' ? '' : 'uno'}">
      ${e.tipo === 'carico' ? stepper({ valore: s.kg === '' ? '' : fmt(num(s.kg), 2), azione: 'step', campo: 'kg', passo, unita: 'kg', label: 'Peso' }) : ''}
      ${stepper({ valore: repsVal, azione: 'step', campo: 'reps', passo: 1, unita: 'ripetizioni', label: 'Ripetizioni' })}
    </div>
    <div class="rir" role="group" aria-label="Ripetizioni in riserva"><span class="rir-lab">RIR <small>ripetizioni che avevi ancora</small></span>
      <div class="rir-btns">${[0, 1, 2, 3, 4].map(r => `<button class="${s.rir === r ? 'on' : ''}" data-action="rir" data-v="${r}" aria-pressed="${s.rir === r}">${r === 4 ? '4+' : r}</button>`).join('')}</div></div>
    ${e.tipo === 'carico' ? dischiInfo(e, s.kg) : ''}</div>`;
}
function pannelloTempo(e) {
  const w = workStato(), dur = workDur(e), st = w.state;
  const ctrl = st === 'run' ? `<button class="btn big" data-action="work-pause">${ico('pausa', 18)} Pausa</button><button class="btn big primary" data-action="work-stop">${ico('stop', 18)} Stop e salva</button>`
    : st === 'pause' ? `<button class="btn big primary" data-action="work-resume">${ico('play', 18)} Riprendi</button><button class="btn big" data-action="work-reset">Azzera</button><button class="btn big" data-action="work-stop">Salva</button>`
    : st === 'count' ? `<button class="btn big" data-action="work-pause">Annulla</button>`
    : `<button class="btn big primary full" data-action="work-start">${ico('play', 18)} Avvia ${secTxt(dur)}</button>`;
  return `<div id="work" class="work ${st}">
    <div class="w-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" class="trk"/><circle cx="100" cy="100" r="88" class="wprg" pathLength="100"/></svg>
      <div class="w-c"><b data-work-time></b><span data-work-label></span></div></div>
    ${st === 'idle' ? `<div class="presets">${[30, 45, 60, 90].map(x => `<button class="pill ${dur === x ? 'on' : ''}" data-action="work-dur" data-s="${x}">${x}″</button>`).join('')}
      <button class="pill" data-action="work-dur" data-s="${dur - 5}" aria-label="5 secondi in meno">−5</button><button class="pill" data-action="work-dur" data-s="${dur + 5}" aria-label="5 secondi in più">+5</button></div>` : ''}
    <div class="w-ctrl">${ctrl}</div></div>`;
}
function bloccoEsercizio(e, i) {
  const v = visualDi(e.nome, e.gruppo), f0 = fotoEs(e.nome, e.gruppo, 0), f1 = fotoEs(e.nome, e.gruppo, 1);
  const muscoli = v ? [...v.pri, ...v.sec].map(m => NOMI_MUSCOLI[m] || m).slice(0, 4).join(' · ') : esc(e.gruppo || '');
  const r = rangeDi(e.rip);
  const meta = [`${e.serie} × ${esc(e.rip)}${e.tipo === 'tempo' ? '″' : ''}`, e.recupero ? `recupero ${esc(e.recupero)}` : '', e.note ? esc(e.note) : ''].filter(Boolean).join(' · ');
  const warm = !e.sets.some(s => s.warm) && i === S.db.draft.exercises.findIndex(x => x.tipo === 'carico') ? riscaldamento(e, num(e.sets[0]?.kg)) : [];
  return `<article class="es">
    <div class="es-media ${f0 ? '' : 'senza'}">${f0 ? `<img src="${f0}" alt="${esc(e.nome)}: posizione iniziale" class="f0"><img src="${f1}" alt="${esc(e.nome)}: posizione finale" class="f1">` : `<div class="es-mappa">${v ? mappaMuscoli(v.pri, v.sec) : ''}</div>`}
      <button class="es-tecnica" data-action="tecnica" data-nome="${esc(e.nome)}">${ico('info', 16)} Tecnica</button></div>
    <div class="es-testa"><h2>${esc(e.nome)}</h2><span class="es-mus">${muscoli}</span><span class="es-meta">${meta}</span></div>
    ${e.coach?.testo ? `<div class="coach-tip ${e.coach.tipo}">${ico(e.coach.tipo === 'su' ? 'lampo' : e.coach.tipo === 'stallo' ? 'info' : 'progressi', 18)}<span>${esc(e.coach.testo)}</span></div>` : ''}
    ${warm.length ? `<button class="chip-btn" data-action="riscaldamento">${ico('fuoco', 16)} Aggiungi riscaldamento: ${warm.map(w => `${fmt(w.kg, 2)}×${w.reps}`).join(', ')}</button>` : ''}
    ${tabellaSerie(e, i)}
    <div class="row-btns piccoli"><button class="btn small ghost" data-action="set-add">${ico('piu', 16)} Serie</button>
      ${e.sets.filter(s => !s.done).length > 0 && e.sets.length > 1 ? `<button class="btn small ghost" data-action="set-del">${ico('meno', 16)} Serie</button>` : ''}
      <button class="btn small ghost" data-action="es-nota">${ico('nota', 16)} ${e.nota ? 'Nota ✓' : 'Nota'}</button>
      <button class="btn small ghost" data-action="es-scambia">${ico('scambia', 16)} Cambia</button></div>
    ${editorSerie(e, i)}</article>`;
}
function dock(e, i, n) {
  const d = S.db.draft, r = d.rest;
  if (r) return `<div class="dock rest-dock" data-ri-box>
    <button class="rd-ring" data-action="rest-full" aria-label="Timer a tutto schermo"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="trk"/><circle cx="18" cy="18" r="15.5" class="prg" pathLength="100" data-ri-prg/></svg></button>
    <div class="rd-t"><small>Recupero</small><b data-ri-time></b></div>
    <button class="btn" data-action="rest-add" data-s="-15">−15</button><button class="btn" data-action="rest-add" data-s="15">+15</button>
    <button class="btn primary" data-action="rest-skip">Salta</button><i class="rd-bar" data-ri-bar aria-hidden="true"></i></div>`;
  if (e && e.tipo === 'tempo' && !exFatto(e)) return `<div class="dock"><button class="btn big full" data-action="wk-go" data-i="${i + 1}">${i + 1 < n ? `Salta a: ${esc(d.exercises[i + 1].nome)}` : 'Vai al riepilogo'} ${ico('avanti', 18)}</button></div>`;
  if (e && !exFatto(e)) {
    const j = setCorrente(e);
    return `<div class="dock"><button class="btn primary huge full" data-action="set-fatta">${ico('check', 22)} Serie ${j + 1 - e.sets.slice(0, j).filter(x => x.warm).length} fatta</button></div>`;
  }
  if (i + 1 < n) return `<div class="dock"><button class="btn primary huge full" data-action="wk-go" data-i="${i + 1}">Avanti: ${esc(d.exercises[i + 1].nome)} ${ico('avanti', 20)}</button></div>`;
  return `<div class="dock"><button class="btn primary huge full" data-action="wk-go" data-i="${n}">Concludi allenamento ${ico('check', 20)}</button></div>`;
}

export function viewAllena() {
  const d = S.db.draft;
  if (!d) { app.go('oggi'); return ''; }
  if (riallineaTempo(d)) save();
  const n = d.exercises.length, cur = clamp(d.cur || 0, 0, n);
  document.body.dataset.restInline = '1';
  const top = `<header class="wk-top"><button class="icon-btn" data-action="go" data-view="oggi" aria-label="Torna a Oggi (l'allenamento resta aperto)">${ico('giu')}</button>
    <div class="wk-tt"><b>Sessione ${esc(d.session)}</b><span><span data-elapsed>0 min</span> · ${cur < n ? `esercizio ${cur + 1} di ${n}` : 'riepilogo'}</span></div>
    <button class="icon-btn" data-action="strumenti" aria-label="Timer">${ico('cronometro')}</button>
    <button class="icon-btn" data-action="wk-lista" aria-label="Elenco esercizi e opzioni">${ico('lista')}</button></header>
    <nav class="wk-prog" aria-label="Avanzamento">${d.exercises.map((e, k) => `<button class="${k === cur ? 'cur' : ''} ${exFatto(e) ? 'ok' : e.sets.some(s => s.done) ? 'mezzo' : ''}" data-action="wk-go" data-i="${k}" aria-label="${esc(e.nome)}"></button>`).join('')}
    <button class="fine ${cur === n ? 'cur' : ''}" data-action="wk-go" data-i="${n}" aria-label="Riepilogo"></button></nav>`;
  if (cur < n) { const e = d.exercises[cur]; return `<div class="allena">${top}${bloccoEsercizio(e, cur)}</div>${dock(e, cur, n)}`; }
  return `<div class="allena">${top}${riepilogo()}</div>`;
}

function riepilogo() {
  const d = S.db.draft, dur = durataDraft(d), watch = num(d.kcalWatch);
  const vol = d.exercises.reduce((s, e) => s + (e.tipo === 'carico' ? e.sets.filter(x => x.done).reduce((t, x) => t + (num(x.kg) || 0) * (num(repsDi(x)) || 0), 0) : 0), 0);
  const fatte = d.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0);
  return `<section class="riep"><span class="eyebrow">Riepilogo</span><h2>Ottimo lavoro${S.db.settings.name ? ', ' + esc(S.db.settings.name) : ''}!</h2>
    <div class="tiles tre"><div class="tile"><span class="t-lab">Serie</span><b class="t-val">${fatte}</b></div>
      <div class="tile"><span class="t-lab">Volume</span><b class="t-val">${fmt(vol)}</b><span class="t-sub">kg</span></div>
      <div class="tile"><span class="t-lab">Durata</span><b class="t-val">${dur}</b><span class="t-sub">min</span></div></div>
    <div class="card lista">${d.exercises.map((e, i) => `<button class="riga-es" data-action="wk-go" data-i="${i}"><span class="stato ${exFatto(e) ? 'ok' : e.sets.some(s => s.done) ? 'mezzo' : ''}">${exFatto(e) ? ico('check', 14) : ''}</span>
      <span class="re-nome">${esc(e.nome)}</span><span class="muted">${e.sets.filter(s => s.done && !s.warm).map(s => e.tipo === 'carico' ? `${kgTxt(s.kg)}×${s.reps || s.target}` : `${s.reps || s.target}${e.tipo === 'tempo' ? '″' : ''}`).join(' · ') || '—'}</span></button>`).join('')}</div>
    <div class="card form">
      <label class="campo"><span>Data</span><input type="date" id="wk-data" data-draft="date" value="${esc(d.date)}"></label>
      <div class="due"><label class="campo"><span>Durata (min)</span><input type="number" inputmode="numeric" id="wk-durata" data-draft="durata" value="${esc(d.durata || '')}" placeholder="${durataAuto(d)}"></label>
      <label class="campo"><span>Kcal orologio</span><input type="number" inputmode="numeric" id="wk-kcal" data-draft="kcalWatch" value="${esc(d.kcalWatch || '')}" placeholder="facoltativo"></label></div>
      <p class="muted small" id="kcal-line">Stima: <b>~${watch || stimaKcal(dur)} kcal</b> (${dur} min · ${fmt(bodyKg(), 1)} kg). Se scrivi le kcal dell'orologio uso quelle.</p>
      <label class="campo"><span>Note allenamento</span><textarea id="wk-note" data-draft="note" placeholder="Energia, sensazioni, dolori...">${esc(d.note)}</textarea></label></div>
    <button class="btn primary huge full" data-action="salva-allenamento">${ico('salva', 20)} Salva allenamento</button>
    <div class="row-btns"><button class="btn full" data-action="wk-go" data-i="${d.exercises.length - 1}">${ico('indietro', 18)} Esercizi</button>
      <button class="btn danger full" data-action="annulla-allenamento">Annulla allenamento</button></div></section>`;
}

/* ---------- Tecnica (foglio) ---------- */
export function foglioTecnica(nome) {
  const x = libDi(nome), e = S.db.draft?.exercises.find(y => y.nome === nome) || x;
  const v = visualDi(nome, e?.gruppo), f0 = fotoEs(nome, e?.gruppo, 0), f1 = fotoEs(nome, e?.gruppo, 1);
  const lista = (ids, cls) => ids.map(m => `<span class="mtag ${cls}">${NOMI_MUSCOLI[m] || m}</span>`).join('');
  apriFoglio(`${f0 ? `<div class="vfoto"><img src="${f0}" alt="${esc(nome)}: inizio"><img src="${f1}" alt="${esc(nome)}: fine" class="fine"><span class="vtag">Inizio → Fine</span></div>` : ''}
    ${v?.chiavi?.length ? `<div class="chiavi">${v.chiavi.map(c => `<span>${ico('check', 14)} ${esc(c)}</span>`).join('')}</div>` : ''}
    ${v ? `<h4>Muscoli coinvolti</h4><div class="mappa-grande">${mappaMuscoli(v.pri, v.sec)}</div><div class="mtags">${lista(v.pri, 'p')}${lista(v.sec, 's')}</div>` : ''}
    ${x?.esecuzione ? `<h4>Come si fa</h4><ol class="passi">${x.esecuzione.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
    ${x?.errori ? `<h4>Errori da evitare</h4><ul class="errori">${x.errori.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <button class="btn full" data-action="go" data-view="esercizio" data-p="${esc(nome)}">${ico('progressi', 18)} Storico e record dell'esercizio</button>`,
    { titolo: esc(nome), cls: 'alto' });
}

/* ---------- Scelta sessione ---------- */
export function foglioSessioni() {
  const next = nextSession();
  apriFoglio(`<div class="lista-sess">${Object.entries(S.db.schede).map(([k, sc]) => `<button class="sess-btn" data-action="start" data-s="${esc(k)}">
    <span class="lettera">${esc(k)}</span><span><b>${esc(sc.nome)}${k === next ? ' · consigliata' : ''}</b><small>${sc.esercizi.map(e => esc(e.nome)).join(' · ')}</small></span>${ico('play', 16)}</button>`).join('')}</div>`,
    { titolo: 'Quale sessione fai?' });
}

/* ---------- Cambio esercizio durante l'allenamento ---------- */
function foglioScambia() {
  const d = S.db.draft, e = d.exercises[d.cur];
  const oggi = new Set(d.exercises.map(x => x.nome.toLowerCase()));
  const alt = alternative(e.nome, e.gruppo).filter(x => !oggi.has(x.nome.toLowerCase()));
  apriFoglio(`<p class="muted">Sostituisci <b>${esc(e.nome)}</b> solo per oggi (la scheda non cambia).</p>
    <div class="lista-sess">${alt.map(x => `<button class="sess-btn" data-action="scambia-con" data-nome="${esc(x.nome)}"><span class="mini-foto">${fotoEs(x.nome, x.gruppo, 1) ? `<img src="${fotoEs(x.nome, x.gruppo, 1)}" alt="">` : ico('manubrio', 18)}</span>
      <span><b>${esc(x.nome)}</b><small>${esc(x.attrezzo)} · ${esc(x.rip)} rip</small></span></button>`).join('') || '<p class="muted">Nessuna alternativa per questo gruppo.</p>'}</div>`, { titolo: 'Cambia esercizio' });
}
function foglioLista() {
  const d = S.db.draft;
  apriFoglio(`<div class="lista-sess">${d.exercises.map((e, i) => `<button class="sess-btn ${i === d.cur ? 'cur' : ''}" data-action="wk-go" data-i="${i}">
      <span class="stato ${exFatto(e) ? 'ok' : e.sets.some(s => s.done) ? 'mezzo' : ''}">${exFatto(e) ? ico('check', 14) : i + 1}</span><span><b>${esc(e.nome)}</b><small>${e.sets.filter(s => s.done).length}/${e.sets.length} serie</small></span></button>`).join('')}
    <button class="sess-btn" data-action="wk-go" data-i="${d.exercises.length}"><span class="stato">${ico('check', 14)}</span><span><b>Riepilogo e salvataggio</b></span></button></div>
    <div class="row-btns"><button class="btn full" data-action="es-aggiungi">${ico('piu', 18)} Aggiungi esercizio</button>
      ${d.exercises.length > 1 ? `<button class="btn full" data-action="es-togli">${ico('cestino', 18)} Togli questo</button>` : ''}</div>`, { titolo: 'Esercizi di oggi' });
}
function foglioAggiungi(filtro = '') {
  const q = filtro.toLowerCase();
  const items = libreria().filter(x => !q || `${x.nome} ${x.gruppo} ${x.attrezzo}`.toLowerCase().includes(q));
  apriFoglio(`<input type="search" id="agg-cerca" placeholder="Cerca esercizio" value="${esc(filtro)}" class="cerca">
    <div class="lista-sess" id="agg-lista">${items.map(x => `<button class="sess-btn" data-action="es-aggiungi-ok" data-nome="${esc(x.nome)}"><span><b>${esc(x.nome)}</b><small>${esc(x.gruppo)} · ${esc(x.attrezzo)}</small></span>${ico('piu', 16)}</button>`).join('')}</div>`,
    { titolo: 'Aggiungi a questo allenamento', id: 'aggiungi' });
}

/* ---------- Azioni ---------- */
const cur = () => { const d = S.db.draft; return d ? d.exercises[d.cur] : null; };
function segnaFatta(i, j) {
  const d = S.db.draft, e = d.exercises[i], s = e.sets[j];
  if (s.done) { s.done = false; save(); stopRest(); app.render(); return; }
  if (s.reps === '' && s.target !== '' && s.target != null) s.reps = String(s.target);
  if (s.reps === '' || num(s.reps) == null) { toast('Scrivi le ripetizioni fatte'); return; }
  if (e.tipo === 'carico' && (s.kg === '' || num(s.kg) == null)) { toast('Scrivi il peso usato'); return; }
  const kg = num(s.kg), reps = num(s.reps);
  const rec = e.tipo === 'carico' && !s.warm && !e.recordVisto && eRecord(e.nome, kg, reps) && lastFor(e.nome);
  if (rec) e.recordVisto = true;
  if (!d.exercises.some(x => x.sets.some(y => y.done)) && Date.now() - d.startedAt > 45 * 60000) d.startedAt = Date.now() - 3 * 60000;
  d.ultimaAttivita = Date.now();
  s.done = true; s.sel = false; save();
  sbloccaAudio(); if (S.db.settings.vibrazione) vibra(30);
  if (rec) { festa(); beep(1318, 0.12, 2); toast(`🏆 Nuovo record su ${e.nome}: ${fmt(kg, 2)} kg × ${reps}!`); }
  const rimaste = e.sets.some(x => !x.done);
  if (S.db.settings.recuperoAuto && (rimaste || i + 1 < d.exercises.length)) {
    const prossima = rimaste ? `Prossima: serie ${setCorrente(e) + 1} · ${e.tipo === 'carico' ? kgTxt(e.sets[setCorrente(e)].kg) + ' kg' : ''}` : `Prossimo: ${d.exercises[i + 1].nome}`;
    startRest(s.warm ? 60 : restSec(e.recupero), prossima);
  }
  app.render();
}
async function salvaAllenamento() {
  const d = S.db.draft;
  const exercises = d.exercises.map(e => ({ nome: e.nome, gruppo: e.gruppo, tipo: e.tipo, serie: e.serie, rip: e.rip, carico: e.carico, recupero: e.recupero,
    note: [e.note, e.nota].filter(Boolean).join(' • '),
    sets: e.sets.filter(s => !s.warm && s.done && num(repsDi(s)) != null).map(s => ({ reps: num(repsDi(s)), kg: e.tipo === 'carico' ? num(s.kg) : null, ...(s.rir != null ? { rir: s.rir } : {}) })) }))
    .filter(e => e.sets.length);
  if (!exercises.length) {
    // Serie compilate ma non spuntate: le considero fatte
    const ok = await chiedi({ titolo: 'Nessuna serie spuntata', testo: 'Vuoi salvare tutte le serie che hai compilato anche se non sono spuntate?', ok: 'Salva comunque' });
    if (!ok) return;
    d.exercises.forEach(e => e.sets.forEach(s => { if (!s.warm && num(repsDi(s)) != null) s.done = true; }));
    return salvaAllenamento();
  }
  const durata = durataDraft(d), stima = stimaKcal(durata), watch = num(d.kcalWatch);
  const prima = records();
  const w = { id: d.id || uid(), date: d.date, session: d.session, exercises, note: d.note, synced: false, durata, kcalStima: stima, kcal: watch || stima, kcalFonte: watch ? 'orologio' : 'stima' };
  S.db.workouts = S.db.workouts.filter(x => !(x.date === w.date && x.session === w.session && !x.synced && x.id !== w.id));
  S.db.workouts.push(w);
  // La scheda ricorda l'ultimo carico usato (così app e foglio restano allineati)
  const sc = S.db.schede[d.session];
  if (sc) exercises.forEach(e => { const x = sc.esercizi.find(y => y.nome === e.nome); if (x && e.tipo === 'carico') x.carico = String(Math.max(...e.sets.map(s => s.kg || 0)) || x.carico); });
  stopRest(); S.db.draft = null; save(); schermoAcceso(false);
  const dopo = records(), nuovi = Object.keys(dopo).filter(k => prima[k] && (dopo[k].kg > prima[k].kg || (dopo[k].kg === prima[k].kg && dopo[k].reps > prima[k].reps)));
  if (nuovi.length) festa();
  toast(nuovi.length ? `🏆 Allenamento salvato con ${nuovi.length} record!` : '✅ Allenamento salvato');
  app.go('oggi');
  queue(workoutPayload(w));
}

function step(campo, delta) {
  const e = cur(); if (!e) return;
  const j = setCorrente(e); if (j < 0) return;
  const s = e.sets[j];
  if (campo === 'kg') {
    const v = Math.max(0, Math.round(((num(s.kg) || 0) + delta) * 100) / 100);
    for (let k = j; k < e.sets.length; k++) if (!e.sets[k].done && !e.sets[k].warm) e.sets[k].kg = v;
    if (s.warm) s.kg = v;
  } else {
    const base = s.reps !== '' ? num(s.reps) : num(s.target) || 0;
    s.reps = String(Math.max(0, (base || 0) + delta));
  }
  save(); app.render();
}

export const azioni = {
  start: async el => {
    chiudiFoglio(true);
    if (S.db.draft && !(await chiedi({ titolo: 'Hai già un allenamento in corso', testo: 'Vuoi sostituirlo? Quello in corso andrà perso.', ok: 'Sostituisci', pericolo: true }))) return;
    startWorkout(el.dataset.s);
  },
  'scegli-sessione': () => foglioSessioni(),
  allenati: () => { if (S.db.draft) app.go('allena'); else foglioSessioni(); },
  'wk-go': el => { const d = S.db.draft; d.cur = clamp(+el.dataset.i, 0, d.exercises.length); d.work = d.work && d.work.ex === d.cur ? d.work : null; save(); chiudiFoglio(true); app.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  'wk-lista': () => foglioLista(),
  'set-sel': el => { const e = S.db.draft.exercises[+el.dataset.ex], j = +el.dataset.set; if (e.sets[j].done) return; e.sets.forEach(s => s.sel = false); e.sets[j].sel = true; save(); app.render(); },
  'set-done': el => segnaFatta(+el.dataset.ex, +el.dataset.set),
  'set-fatta': () => { const d = S.db.draft, e = d.exercises[d.cur], j = setCorrente(e); if (j >= 0) segnaFatta(d.cur, j); },
  'set-add': () => { const e = cur(), last = e.sets.filter(s => !s.warm).at(-1); e.sets.push({ kg: last?.kg ?? '', reps: '', target: last?.target ?? '', rir: null, done: false }); save(); app.render(); },
  'set-del': () => { const e = cur(); for (let k = e.sets.length - 1; k >= 0; k--) if (!e.sets[k].done) { e.sets.splice(k, 1); break; } save(); app.render(); },
  step: el => step(el.dataset.campo, +el.dataset.d),
  rir: el => { const e = cur(), j = setCorrente(e); if (j < 0) return; const v = +el.dataset.v; e.sets[j].rir = e.sets[j].rir === v ? null : v; save(); app.render(); },
  riscaldamento: () => { const e = cur(), w = riscaldamento(e, num(e.sets[0]?.kg)); e.sets.unshift(...w.map(x => ({ kg: x.kg, reps: '', target: x.reps, rir: null, done: false, warm: true }))); save(); app.render(); },
  'es-nota': async () => {
    const e = cur();
    apriFoglio(`<label class="campo"><span>Nota per ${esc(e.nome)}</span><textarea id="es-nota-txt" placeholder="Es. dolore alla spalla, usato elastico...">${esc(e.nota || '')}</textarea></label>
      <button class="btn primary full" data-action="es-nota-ok">Salva nota</button>`, { titolo: 'Nota esercizio' });
  },
  'es-nota-ok': () => { cur().nota = document.getElementById('es-nota-txt').value.trim(); save(); chiudiFoglio(); app.render(); },
  'es-scambia': () => foglioScambia(),
  'scambia-con': el => {
    const d = S.db.draft, e = d.exercises[d.cur], x = libDi(el.dataset.nome);
    const nuovo = nuovoEsercizio({ nome: x.nome, gruppo: x.gruppo, tipo: x.tipo, serie: e.sets.filter(s => !s.warm).length || e.serie, rip: x.rip, carico: '', recupero: x.recupero, note: x.attrezzo });
    d.exercises[d.cur] = nuovo; save(); chiudiFoglio(); app.render(); toast(`Oggi fai ${x.nome}`);
  },
  'es-aggiungi': () => foglioAggiungi(),
  'es-aggiungi-ok': el => {
    const d = S.db.draft, x = libDi(el.dataset.nome);
    d.exercises.splice(d.cur + 1, 0, nuovoEsercizio({ nome: x.nome, gruppo: x.gruppo, tipo: x.tipo, serie: 3, rip: x.rip, carico: '', recupero: x.recupero, note: x.attrezzo }));
    save(); chiudiFoglio(); toast(`${x.nome} aggiunto dopo l'esercizio attuale`); app.render();
  },
  'es-togli': async () => {
    const d = S.db.draft, e = d.exercises[d.cur];
    if (!(await chiedi({ titolo: `Togliere ${e.nome}?`, testo: 'Solo per questo allenamento.', ok: 'Togli', pericolo: true }))) return;
    d.exercises.splice(d.cur, 1); d.cur = Math.min(d.cur, d.exercises.length - 1); save(); chiudiFoglio(); app.render();
  },
  tecnica: el => foglioTecnica(el.dataset.nome),
  'rest-skip': () => stopRest(),
  'rest-add': el => addRest(+el.dataset.s || 15),
  'rest-full': () => apriRestFull(),
  'rest-full-chiudi': () => chiudiRestFull(),
  'work-start': () => workStart(), 'work-pause': () => workPause(), 'work-resume': () => workResume(),
  'work-reset': () => workReset(), 'work-stop': () => workStop(), 'work-dur': el => workSetDur(+el.dataset.s),
  'salva-allenamento': () => salvaAllenamento(),
  'annulla-allenamento': async () => {
    if (await chiedi({ titolo: "Annullare l'allenamento?", testo: 'I dati inseriti oggi andranno persi.', ok: 'Annulla allenamento', annulla: 'Continua', pericolo: true })) {
      stopRest(); S.db.draft = null; save(); schermoAcceso(false); app.go('oggi');
    }
  },
};
/* Valori scritti a mano negli stepper e nel riepilogo */
export function input(t) {
  const d = S.db.draft; if (!d) return false;
  if (t.dataset.campoInput) {
    const e = d.exercises[d.cur], j = setCorrente(e); if (j < 0) return true;
    const v = t.value.replace(',', '.');
    if (t.dataset.campoInput === 'kg') { for (let k = j; k < e.sets.length; k++) if (!e.sets[k].done && (k === j || !e.sets[k].warm)) e.sets[k].kg = v; }
    else e.sets[j].reps = v;
    save(); return true;
  }
  if (t.dataset.draft) {
    d[t.dataset.draft] = t.value; save();
    if (t.dataset.draft !== 'note') { const k = document.getElementById('kcal-line'); const dur = durataDraft(d), w = num(d.kcalWatch);
      if (k) k.innerHTML = `Stima: <b>~${w || stimaKcal(dur)} kcal</b> (${dur} min · ${fmt(bodyKg(), 1)} kg). Se scrivi le kcal dell'orologio uso quelle.`; }
    return true;
  }
  if (t.id === 'agg-cerca') {
    const q = t.value.toLowerCase(), l = document.getElementById('agg-lista');
    if (l) l.innerHTML = libreria().filter(x => !q || `${x.nome} ${x.gruppo} ${x.attrezzo}`.toLowerCase().includes(q))
      .map(x => `<button class="sess-btn" data-action="es-aggiungi-ok" data-nome="${esc(x.nome)}"><span><b>${esc(x.nome)}</b><small>${esc(x.gruppo)} · ${esc(x.attrezzo)}</small></span>${ico('piu', 16)}</button>`).join('');
    return true;
  }
  return false;
}
/* Quando esco da un campo dello stepper ridisegno per aggiornare dischi e tabella */
export function change(t) { if (t.dataset.campoInput && S.db.draft) { app.render(); return true; } return false; }
