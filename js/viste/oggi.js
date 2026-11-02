/* ============ OGGI ============ */
import { cardAttivitaOggi } from './attivita.js';
import { S, save, cfg, sorted, nextSession, records, streakWeeks, wVolume, bodyKg, statoProgramma, obiettiviGiorno, BETA } from '../dati.js';
import { esc, fmt, todayISO, addDays, weekStart, daysBetween, fmtDateLong, num, normDate, toast, chiedi } from '../util.js';
import { testata, ico, app, apriFoglio } from '../ui.js';
import { obiettivo, muscoliPronti } from '../coach.js';
import { fotoEs } from '../libreria.js';
import { workoutPayload, flush } from '../sync.js';
import { totaliGiorno } from './cucina.js';
import { resocontoSettimana, righeResoconto } from '../resoconto.js';

const minuti = sc => Math.round(sc.esercizi.reduce((s, e) => s + (num(e.serie) || 3), 0) * 3.2);

function cardAllenamento() {
  const d = S.db.draft;
  if (d) {
    const sc = S.db.schede[d.session], n = d.exercises.length, fatti = d.exercises.filter(e => e.sets.length && e.sets.every(s => s.done)).length;
    return `<section class="hero in-corso">${heroFoto(d.session)}<div class="hero-in">
      <span class="eyebrow">Allenamento in corso · <span data-elapsed></span></span>
      <h2 class="hero-t">${esc(sc?.nome || 'Sessione ' + d.session)}</h2>
      <div class="hero-meta">Esercizio ${Math.min(d.cur + 1, n)} di ${n} · ${fatti} completati</div>
      <button class="btn primary big full" data-action="go" data-view="allena">${ico('play', 18)} Riprendi</button></div></section>`;
  }
  const k = nextSession(), sc = S.db.schede[k];
  if (!sc) return `<section class="card">${'Nessuna sessione: creane una da Schede.'}</section>`;
  const primo = sc.esercizi.find(e => e.tipo === 'carico') || sc.esercizi[0];
  const ob = primo ? obiettivo(primo) : null;
  const nSerie = sc.esercizi.reduce((s, e) => s + (num(e.serie) || 3), 0);
  return `<section class="hero">${heroFoto(k)}<div class="hero-in">
    <div class="hero-top"><div><span class="eyebrow">Oggi tocca a</span><h2 class="hero-t">${esc(sc.nome)}</h2>
      <div class="hero-meta">${sc.esercizi.length} esercizi · ${nSerie} serie · circa ${minuti(sc)} min</div></div>
      <span class="hero-lettera" aria-label="Sessione ${esc(k)}">${esc(k)}</span></div>
    <div class="chips">${sc.esercizi.map(e => `<span class="chip">${esc(e.nome)}</span>`).join('')}</div>
    ${ob && ob.tipo !== 'prima' ? `<div class="coach-tip">${ico(ob.tipo === 'su' ? 'lampo' : 'progressi', 18)}<span><b>${esc(primo.nome)}:</b> ${esc(ob.testo)}</span></div>` : ''}
    <div class="hero-btns"><button class="btn primary big" data-action="start" data-s="${esc(k)}">${ico('play', 18)} Inizia sessione ${esc(k)}</button>
      <button class="btn big ghost" data-action="scegli-sessione" aria-label="Scegli un'altra sessione">Altra</button></div></div></section>`;
}
function heroFoto(k) {
  const e = (S.db.schede[k]?.esercizi || []).find(x => fotoEs(x.nome, x.gruppo));
  return e ? `<img class="hero-foto" src="${fotoEs(e.nome, e.gruppo)}" alt="" aria-hidden="true">` : '';
}

function cardProgramma() {
  const p = statoProgramma();
  const settN = Math.min(p.settimane, Math.floor(p.fatte) + 1);
  if ((p.vicino || p.scaduto) && !p.rimandato) {
    return `<section class="card avviso">${ico('ripeti', 22)}<div class="av-txt"><b>${p.scaduto ? 'È ora di cambiare scheda' : `Tra ${p.mancano} giorni cambi scheda`}</b>
      <span>Programma iniziato il ${fmtDateLong(p.inizio)}: ${p.settimane} settimane. Ho preparato una proposta con nuovi esercizi.</span>
      <div class="row-btns"><button class="btn small primary" data-action="go" data-view="nuova-scheda">Vedi proposta</button>
      <button class="btn small" data-action="rimanda-scheda">Rimanda 2 settimane</button></div></div></section>`;
  }
  return `<section class="card prog-card"><div class="row"><b>Programma attuale</b><span class="muted">settimana ${settN} di ${p.settimane}</span></div>
    <div class="barra"><i style="width:${(p.pct * 100).toFixed(0)}%"></i></div>
    <span class="muted small">Cambio scheda consigliato dal ${fmtDateLong(p.fine)}</span></section>`;
}

function cardResoconto() {
  const wk = weekStart(), giorno = daysBetween(wk, todayISO());
  if (giorno > 2 || cfg().resocontoVisto === wk) return '';
  const r = resocontoSettimana();
  if (!r.a.n && !r.b.n && r.a.peso == null) return '';
  return `<section class="card resoconto"><div class="row"><b>La settimana scorsa</b><span class="muted small">${fmtDateLong(r.dal)} – ${fmtDateLong(r.al)}</span></div>
    <div class="res-righe">${righeResoconto(r).slice(0, 4).map(([l, v, sub, cls]) => `<div class="res-r"><span>${l}</span><b>${v}</b><small class="${cls}">${sub}</small></div>`).join('')}</div>
    <p class="small">${r.consiglio}</p>
    <div class="row-btns"><button class="btn small" data-action="resoconto-apri">Vedi tutto</button><button class="btn small ghost" data-action="resoconto-ok">Ok, visto</button></div></section>`;
}
export function foglioResoconto() {
  const r = resocontoSettimana();
  apriFoglio(`<p class="muted small">Dal ${fmtDateLong(r.dal)} al ${fmtDateLong(r.al)}, confrontata con la settimana prima.</p>
    <div class="res-righe">${righeResoconto(r).map(([l, v, sub, cls]) => `<div class="res-r"><span>${l}</span><b>${v}</b><small class="${cls}">${sub}</small></div>`).join('')}</div>
    ${r.fermi.length ? `<p class="small"><b>Esercizi fermi:</b> ${r.fermi.map(esc).join(', ')}. Al prossimo allenamento il coach ti propone uno scarico.</p>` : ''}
    <p class="small">${r.consiglio}</p>`, { titolo: 'Resoconto della settimana', id: 'resoconto' });
}

function cardSettimana() {
  const ws = sorted(), oggi = todayISO(), wk = weekStart(), giorni = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  const fatti = ws.filter(w => w.date >= wk).length, obj = num(cfg().giorniSettimana) || 3;
  return `<section class="card settimana"><div class="row"><b>La tua settimana</b><span class="muted">${fatti}/${obj} · ${streakWeeks()} sett. di fila</span></div>
    <div class="giorni">${giorni.map((g, i) => {
      const d = addDays(wk, i), w = ws.find(x => x.date === d), live = d === oggi && S.db.draft;
      return `<div class="gg ${d === oggi ? 'oggi' : ''} ${d > oggi ? 'futuro' : ''}"><span>${g}</span><i class="${w ? 'on' : live ? 'live' : ''}">${w ? esc(w.session) : live ? '•' : ''}</i></div>`; }).join('')}</div></section>`;
}

function cardMuscoli() {
  const m = muscoliPronti(); if (!m.length) return '';
  return `<section class="card"><div class="row"><b>Muscoli pronti</b><span class="muted small">dagli ultimi allenamenti</span></div>
    <div class="pronti">${m.map(x => `<div class="pr-riga"><span>${esc(x.gruppo)}</span><div class="pr-trk"><i class="p${x.pct}" style="width:${x.pct}%"></i></div><b class="p${x.pct}">${x.pct}%</b></div>`).join('')}</div></section>`;
}

function cardNumeri() {
  const ws = sorted(), oggi = todayISO(), wk = weekStart(), prev = addDays(wk, -7), last = ws.at(-1);
  const volW = ws.filter(w => w.date >= wk).reduce((s, w) => s + wVolume(w), 0);
  const volP = ws.filter(w => w.date >= prev && w.date < wk).reduce((s, w) => s + wVolume(w), 0);
  const mese = ws.filter(w => w.date.startsWith(oggi.slice(0, 7))).length;
  const goal = num(cfg().goal), kg = S.db.weights.length ? bodyKg() : null;
  const delta = volP ? Math.round((volW / volP - 1) * 100) : null;
  return `<section class="tiles">
    <div class="tile"><span class="t-lab">Questo mese</span><b class="t-val">${mese}</b><span class="t-sub">allenamenti</span></div>
    <div class="tile"><span class="t-lab">Volume settimana</span><b class="t-val">${fmt(volW)}</b><span class="t-sub ${delta == null ? '' : delta >= 0 ? 'su' : 'giu'}">${delta == null ? 'kg' : `kg · ${delta >= 0 ? '+' : ''}${delta}%`}</span></div>
    <button class="tile" data-action="peso-veloce"><span class="t-lab">Peso</span><b class="t-val">${kg ? fmt(kg, 1) : '—'}</b><span class="t-sub">${kg && goal ? `obiettivo ${fmt(goal, 1)}` : 'tocca per pesarti'}</span></button>
    <div class="tile"><span class="t-lab">Dall'ultimo</span><b class="t-val">${last ? daysBetween(last.date, oggi) : '—'}</b><span class="t-sub">${last ? 'giorni' : 'nessun allenamento'}</span></div></section>`;
}

function cardCucina() {
  const ob = obiettiviGiorno(), t = totaliGiorno(todayISO());
  const pk = Math.min(1, t.kcal / ob.kcal), pp = Math.min(1, t.p / ob.p);
  return `<section class="card cucina-mini" data-action="go" data-view="cucina" role="button" tabindex="0">
    <div class="anelli"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="a-trk"/><circle cx="32" cy="32" r="27" class="a-kcal" pathLength="100" style="stroke-dasharray:${(pk * 100).toFixed(1)} 100"/>
      <circle cx="32" cy="32" r="19" class="a-trk"/><circle cx="32" cy="32" r="19" class="a-prot" pathLength="100" style="stroke-dasharray:${(pp * 100).toFixed(1)} 100"/></svg></div>
    <div class="cm-txt"><b>Cucina di oggi</b><span><i class="dot kcal"></i>${fmt(t.kcal)} / ${fmt(ob.kcal)} kcal</span><span><i class="dot prot"></i>${fmt(t.p)} / ${fmt(ob.p)} g proteine</span></div>
    ${ico('avanti', 20)}</section>`;
}

function cardRecord() {
  const pr = Object.entries(records()).sort((a, b) => b[1].date.localeCompare(a[1].date))[0];
  if (!pr) return '';
  return `<section class="card record">${ico('trofeo', 26)}<div><span class="eyebrow">Ultimo record</span><b>${esc(pr[0])}</b>
    <span class="muted">${fmt(pr[1].kg, 2)} kg × ${pr[1].reps} · ${fmtDateLong(pr[1].date)}</span></div></section>`;
}
function cardUltimo() {
  const w = sorted().at(-1); if (!w) return `<section class="card">${'Nessun allenamento ancora: inizia il primo!'}</section>`;
  return `<section class="card riga-w" data-action="apri-w" data-id="${esc(w.id)}" role="button" tabindex="0">
    <span class="lettera">${esc(w.session)}</span><div><b>${fmtDateLong(w.date)} · Sessione ${esc(w.session)}</b>
    <span class="muted">${w.exercises.length} esercizi · ${fmt(wVolume(w))} kg${w.durata ? ` · ${w.durata} min` : ''}${w.kcal ? ` · ${w.kcal} kcal` : ''}</span></div>${ico('avanti', 20)}</section>`;
}

/* Allenamenti fatti nella copia di prova e mai arrivati nel foglio */
function allenamentiBeta() {
  if (BETA) return [];
  try {
    const b = JSON.parse(localStorage.getItem('palestra-dati-beta') || 'null');
    if (!b || !b.workouts) return [];
    const ci = new Set(S.db.workouts.map(w => normDate(w.date) + '|' + w.session));
    return b.workouts.filter(w => !w.synced && normDate(w.date) && !ci.has(normDate(w.date) + '|' + w.session));
  } catch (e) { return []; }
}
function cardBeta() {
  const extra = allenamentiBeta(); if (!extra.length) return '';
  return `<section class="card avviso">${ico('info', 22)}<div class="av-txt"><b>Allenamenti dalla versione di prova</b>
    <span>${extra.length === 1 ? 'Hai 1 allenamento' : `Hai ${extra.length} allenamenti`} salvati nella versione di prova e mai inviati al foglio.</span>
    <div class="row-btns"><button class="btn small primary" data-action="beta-importa">Importa</button><button class="btn small" data-action="beta-ignora">Ignora</button></div></div></section>`;
}

export function viewOggi() {
  const nome = (cfg().name || '').trim(), data = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const pezzi = { allenamento: cardAllenamento, programma: cardProgramma, resoconto: cardResoconto, settimana: cardSettimana, muscoli: cardMuscoli, numeri: cardNumeri, attivita: cardAttivitaOggi, cucina: cardCucina, record: cardRecord, ultimo: cardUltimo };
  return `${BETA ? '<div class="banner-beta">Versione di prova: dati copiati, il foglio Google non viene modificato</div>' : ''}
    ${testata(nome ? `Ciao ${esc(nome)}` : 'Ciao!', data)}${cardBeta()}
    <div class="pila">${cfg().home.filter(x => x.on && pezzi[x.k]).map(x => pezzi[x.k]()).join('')}</div>`;
}

export const azioni = {
  'resoconto-apri': () => foglioResoconto(),
  'resoconto-ok': () => { cfg().resocontoVisto = weekStart(); save(); app.render(); },
  'rimanda-scheda': () => { import('../coach.js').then(c => { c.rimandaScheda(14); save(); app.render(); toast('Ok, te lo ricordo tra 2 settimane'); }); },
  'beta-importa': () => {
    const extra = allenamentiBeta();
    extra.forEach(w => { const x = { ...w, date: normDate(w.date), synced: false }; S.db.workouts.push(x); S.db.outbox.push(workoutPayload(x)); });
    localStorage.removeItem('palestra-dati-beta'); save(); app.render(); flush();
    toast(`✅ ${extra.length} allenamenti importati`);
  },
  'beta-ignora': async () => {
    if (await chiedi({ titolo: 'Ignorare questi allenamenti?', testo: 'Verranno cancellati dalla versione di prova.', ok: 'Ignora', pericolo: true })) {
      localStorage.removeItem('palestra-dati-beta'); app.render();
    }
  },
};
