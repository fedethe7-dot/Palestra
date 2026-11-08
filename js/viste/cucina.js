/* ============ CUCINA ============
   Diario del giorno (kcal e macro rispetto all'obiettivo), ricette fit con foto, porzioni,
   modalità "cucina passo passo", piatti salvati e lista della spesa. */
import { S, save, cfg, obiettiviGiorno } from '../dati.js';
import { esc, fmt, num, todayISO, toast, chiedi, uid, parseCSV, scaricaFile, slug, addDays, fmtDateLong } from '../util.js';
import { testata, ico, app, apriFoglio, chiudiFoglio, aggiornaFoglio, segmenti, vuoto } from '../ui.js';
import { fotoPiatto, creditoFoto, paginaFoto } from '../foto-piatti.js';
import { foglioCodice } from '../cibo.js';
import { timerLibero, ST } from '../timer.js';

export const CATEGORIE = [
  ['Colazioni veloci', 'Colazioni'], ['Pancake e dolci fit', 'Dolci fit'], ['Pranzi', 'Pranzi'],
  ['Cene', 'Cene'], ['Spuntini proteici', 'Spuntini'], ['Da portare al lavoro', 'Al lavoro'],
];
export const COLONNE_RICETTE = ['ID', 'Nome ricetta', 'Categoria', 'Porzioni', 'Prep (min)', 'Cottura (min)', 'Ingrediente', 'Grammi',
  'Kcal /100g', 'Proteine /100g', 'Carboidrati /100g', 'Grassi /100g', 'Procedimento', 'Note', 'Preferita', 'Foto'];
const PASTI = [['colazione', 'Colazione'], ['pranzo', 'Pranzo'], ['spuntino', 'Spuntino'], ['cena', 'Cena']];

let tab = 'oggi', cat = 'Tutte', query = '', giorno = null, porz = null, passo = 0, slotScelto = 'pranzo', ultimaRic = null;

/* ---------- Calcoli ---------- */
export function ricMacro(r) {
  const n0 = r.porzioni || 1;
  if (r.manuale) { // valori scritti a mano (per porzione)
    const m = r.manuale, g = r.ingredienti.reduce((s, i) => s + (i.g || 0), 0);
    const por = { kcal: m.kcal || 0, p: m.p || 0, c: m.c || 0, f: m.f || 0, g: g / n0 };
    return { tot: { kcal: por.kcal * n0, p: por.p * n0, c: por.c * n0, f: por.f * n0, g }, por };
  }
  const t = { kcal: 0, p: 0, c: 0, f: 0, g: 0 };
  r.ingredienti.forEach(i => { const q = i.g / 100; t.kcal += (i.kcal || 0) * q; t.p += (i.p || 0) * q; t.c += (i.c || 0) * q; t.f += (i.f || 0) * q; t.g += i.g || 0; });
  const n = r.porzioni || 1;
  return { tot: t, por: { kcal: t.kcal / n, p: t.p / n, c: t.c / n, f: t.f / n, g: t.g / n } };
}
export function passiDi(testo) {
  const t = String(testo || '').trim(); if (!t) return [];
  let p = t.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
  if (p.length === 1) p = t.split(/(?:^|\s)\d+[.)]\s+/).map(s => s.trim()).filter(Boolean);
  return p.map(s => s.replace(/^\d+[.)]\s*/, ''));
}
export function totaliGiorno(d) {
  return (S.db.pasti || []).filter(p => p.date === d).reduce((t, p) => ({ kcal: t.kcal + (p.kcal || 0), p: t.p + (p.p || 0), c: t.c + (p.c || 0), f: t.f + (p.f || 0) }), { kcal: 0, p: 0, c: 0, f: 0 });
}
const fotoDi = r => r.foto || fotoPiatto(r);

/* ---------- Oggi ---------- */
function anello(val, obj, cls, label, unit) {
  const p = Math.min(1, obj ? val / obj : 0);
  return `<div class="anello ${cls}"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="a-trk"/><circle cx="32" cy="32" r="27" class="a-val" pathLength="100" style="stroke-dasharray:${(p * 100).toFixed(1)} 100"/></svg>
    <b>${fmt(val)}</b><small>${label}</small><span>di ${fmt(obj)} ${unit}</span></div>`;
}
function suggerimenti(d) {
  const ob = obiettiviGiorno(), t = totaliGiorno(d), restaK = ob.kcal - t.kcal, restaP = ob.p - t.p;
  if (restaP < 15 || restaK < 150) return '';
  const fatte = new Set((S.db.pasti || []).filter(p => p.date === d).map(p => p.ref));
  const cand = (S.db.ricette || []).filter(r => !fatte.has(r.id)).map(r => ({ r, m: ricMacro(r).por }))
    .filter(x => x.m.kcal <= restaK + 100).sort((a, b) => (b.m.p / b.m.kcal) - (a.m.p / a.m.kcal)).slice(0, 3);
  if (!cand.length) return '';
  return `<section class="card sugg"><div class="row"><b>Ti mancano ${fmt(restaP)} g di proteine</b>${ico('lampo', 18)}</div>
    <p class="muted small">Ricette che ci stanno nelle ${fmt(restaK)} kcal rimaste:</p>
    ${cand.map(({ r, m }) => `<button class="ric-riga" data-action="ric-apri" data-id="${esc(r.id)}">${miniFoto(r)}<span><b>${esc(r.nome)}</b><small>${fmt(m.kcal)} kcal · ${fmt(m.p)} g proteine</small></span>${ico('avanti', 18)}</button>`).join('')}</section>`;
}
const miniFoto = r => { const f = fotoDi(r); return `<span class="mini-foto">${ico('cucina', 18)}${f ? `<img src="${esc(f)}" alt="" loading="lazy">` : ''}</span>`; };
function viewOggiCucina() {
  const d = giorno || todayISO(), ob = obiettiviGiorno(), t = totaliGiorno(d);
  const pasti = (S.db.pasti || []).filter(p => p.date === d);
  return `<div class="giorno-nav"><button class="icon-btn" data-action="cu-giorno" data-d="-1" aria-label="Giorno prima">${ico('indietro')}</button>
      <b>${d === todayISO() ? 'Oggi' : fmtDateLong(d)}</b><button class="icon-btn" data-action="cu-giorno" data-d="1" aria-label="Giorno dopo" ${d >= todayISO() ? 'disabled' : ''}>${ico('avanti')}</button></div>
    <section class="card anelli-giorno">${anello(t.kcal, ob.kcal, 'kcal', 'kcal', '')}${anello(t.p, ob.p, 'prot', 'proteine', 'g')}${anello(t.c, ob.c, 'carb', 'carboidrati', 'g')}${anello(t.f, ob.f, 'grassi', 'grassi', 'g')}</section>
    ${ob.stimato ? '<p class="muted small centro">Obiettivi stimati dal peso: per calcolarli bene inserisci altezza ed età in Impostazioni → Profilo.</p>' : ''}
    ${PASTI.map(([k, l]) => { const lp = pasti.filter(p => p.slot === k); const tk = lp.reduce((s, p) => s + p.kcal, 0);
      return `<section class="card pasto"><div class="row"><h3>${l}</h3><span class="muted small">${tk ? fmt(tk) + ' kcal' : ''}</span></div>
        ${lp.map(p => `<div class="pasto-riga"><span><b>${esc(p.nome)}</b><small>${p.porz && p.porz !== 1 ? fmt(p.porz, 2) + ' porz. · ' : ''}${fmt(p.kcal)} kcal · P ${fmt(p.p)} · C ${fmt(p.c)} · G ${fmt(p.f)}</small></span>
          <button class="icon-btn small" data-action="pasto-del" data-id="${esc(p.id)}" aria-label="Togli">${ico('chiudi', 16)}</button></div>`).join('')}
        <button class="btn small ghost" data-action="pasto-add" data-slot="${k}">${ico('piu', 16)} Aggiungi</button></section>`; }).join('')}
    ${suggerimenti(d)}`;
}

/* ---------- Ricette ---------- */
function ricettaCard(r) {
  const m = ricMacro(r).por, min = (r.prep || 0) + (r.cottura || 0), f = fotoDi(r);
  return `<button class="ric-card" data-action="ric-apri" data-id="${esc(r.id)}">
    <span class="ric-img">${ico('cucina', 30)}${f ? `<img src="${esc(f)}" alt="" loading="lazy">` : ''}${r.preferita ? `<i class="ric-pref">${ico('stella', 14)}</i>` : ''}</span>
    <span class="ric-body"><b>${esc(r.nome)}</b><span class="ric-meta"><span>${fmt(m.kcal)} kcal</span><span>${fmt(m.p)} g prot.</span>${min ? `<span>${min}′</span>` : ''}</span></span></button>`;
}
function ricLista() {
  const q = query.trim().toLowerCase();
  const l = (S.db.ricette || []).filter(r => (cat === 'Tutte' || (cat === 'pref' ? r.preferita : cat === 'mie' ? r.mia : r.categoria === cat)) &&
    (!q || `${r.nome} ${r.ingredienti.map(i => i.nome).join(' ')}`.toLowerCase().includes(q)));
  return l.length ? l.map(ricettaCard).join('') : vuoto(cat === 'pref' ? 'Nessuna preferita: tocca il cuore in una ricetta' : 'Nessuna ricetta trovata', 'cucina');
}
function viewRicetteLista() {
  const tutte = S.db.ricette || [];
  const nuova = `<button class="btn primary full" data-action="go" data-view="ricetta-nuova">${ico('piu', 18)} Nuova ricetta o piatto</button>`;
  if (!tutte.length) return `${vuoto('Nessuna ricetta ancora', 'cucina')}${nuova}<button class="btn full" data-action="ric-import">${ico('carica', 18)} Importa ricette (CSV)</button>`;
  const cats = [['Tutte', 'Tutte'], ['pref', 'Preferite'], ...(tutte.some(r => r.mia) ? [['mie', 'Mie']] : []), ...CATEGORIE.filter(([c]) => tutte.some(r => r.categoria === c))];
  return `${nuova}<div class="cerca-box">${ico('cerca', 18)}<input id="ric-cerca" type="search" placeholder="Cerca ricetta o ingrediente" value="${esc(query)}"></div>
    <div class="chips scorri">${cats.map(([v, l]) => `<button class="pill ${cat === v ? 'on' : ''}" data-action="ric-cat" data-v="${esc(v)}">${l}</button>`).join('')}</div>
    <div class="ric-griglia" id="ric-lista">${ricLista()}</div>
    <div class="row-btns"><button class="btn full" data-action="ric-import">${ico('carica', 18)} Importa CSV</button><button class="btn full" data-action="ric-modello">${ico('scarica', 18)} Esporta CSV</button></div>
    <p class="muted small centro">${creditoFoto()}</p>`;
}

/* ---------- Spesa ---------- */
function viewSpesa() {
  const l = S.db.spesa || [];
  return `<section class="card"><div class="row"><h3>Lista della spesa</h3><span class="muted small">${l.filter(x => !x.fatto).length} da prendere</span></div>
    ${l.length ? `<div class="spesa">${l.map(x => `<label class="sp-riga ${x.fatto ? 'fatto' : ''}"><input type="checkbox" data-spesa="${esc(x.id)}" ${x.fatto ? 'checked' : ''}>
      <span>${esc(x.nome)}</span><b>${x.g ? fmt(x.g) + ' g' : ''}</b></label>`).join('')}</div>` : vuoto('Lista vuota: aggiungi gli ingredienti dalle ricette', 'carrello')}
    <div class="sp-add"><input id="sp-nuovo" placeholder="Aggiungi a mano (es. latte)"><button class="btn" data-action="spesa-add">${ico('piu', 18)}</button></div></section>
    ${l.length ? `<div class="row-btns"><button class="btn full" data-action="spesa-copia">${ico('lista', 18)} Copia lista</button><button class="btn full" data-action="spesa-pulisci">Togli presi</button><button class="btn danger full" data-action="spesa-svuota">Svuota</button></div>` : ''}
    <section class="card"><div class="row"><h3>Piatti salvati</h3><span class="muted small">per aggiungerli in un tocco</span></div>
      ${(S.db.piatti || []).length ? S.db.piatti.map(p => `<div class="pasto-riga"><span><b>${esc(p.nome)}</b><small>${fmt(p.kcal)} kcal · P ${fmt(p.p)} · C ${fmt(p.c)} · G ${fmt(p.f)}</small></span>
        <button class="icon-btn small" data-action="piatto-del" data-id="${esc(p.id)}" aria-label="Elimina">${ico('cestino', 16)}</button></div>`).join('') : '<p class="muted small">Quando aggiungi un pasto a mano puoi salvarlo qui: i piatti che mangi spesso, con le calorie già pronte.</p>'}</section>`;
}

export function viewCucina() {
  const corpi = { oggi: viewOggiCucina, ricette: viewRicetteLista, spesa: viewSpesa };
  return `${testata('Cucina', '')}${segmenti([['oggi', 'Diario'], ['ricette', 'Ricette'], ['spesa', 'Spesa']], tab, 'cu-tab', 'grosso')}<div class="pila">${corpi[tab]()}</div>`;
}

/* ---------- Dettaglio ricetta ---------- */
export function viewRicetta() {
  if (ultimaRic !== S.param) { ultimaRic = S.param; porz = null; }
  const r = (S.db.ricette || []).find(x => x.id === S.param);
  if (!r) return `${testata('Ricetta', '', { back: 'cucina' })}${vuoto('Ricetta non trovata')}`;
  const n = porz || r.porzioni || 1, k = n / (r.porzioni || 1), { tot, por } = ricMacro(r), ob = obiettiviGiorno();
  const passi = passiDi(r.procedimento), f = fotoDi(r);
  return `<div class="ric-hero"><div class="ric-hero-vuoto">${ico('cucina', 48)}</div>${f ? `<img src="${esc(f)}" alt="${esc(r.nome)}">` : ''}
      <button class="icon-btn flott sx" data-action="go" data-view="cucina" aria-label="Indietro">${ico('indietro')}</button>
      <button class="icon-btn flott dx ${r.preferita ? 'on' : ''}" data-action="ric-pref" data-id="${esc(r.id)}" aria-label="${r.preferita ? 'Togli dalle preferite' : 'Aggiungi alle preferite'}" aria-pressed="${!!r.preferita}">${ico('cuore', 20)}</button></div>
    <div class="pila ric-det"><span class="eyebrow">${esc(r.categoria || 'Ricetta')}${r.prep ? ` · ${r.prep}′ preparazione` : ''}${r.cottura ? ` · ${r.cottura}′ cottura` : ''}</span><h1 class="ric-titolo">${esc(r.nome)}</h1>
    <section class="macro4"><div><b>${fmt(por.kcal)}</b><span>kcal</span></div><div class="p"><b>${fmt(por.p, 1)}</b><span>proteine</span></div><div class="c"><b>${fmt(por.c, 1)}</b><span>carbo</span></div><div class="f"><b>${fmt(por.f, 1)}</b><span>grassi</span></div></section>
    <p class="muted small">Per porzione (${fmt(por.g)} g): ${fmt(por.kcal / ob.kcal * 100)}% delle kcal e ${fmt(por.p / ob.p * 100)}% delle proteine del tuo obiettivo.</p>
    <section class="card"><div class="row"><h3>Ingredienti</h3><div class="mini-step"><button data-action="ric-porz" data-d="-1" ${n <= 1 ? 'disabled' : ''} aria-label="Una porzione in meno">${ico('meno', 18)}</button><span><b>${n}</b> ${n === 1 ? 'porz.' : 'porz.'}</span><button data-action="ric-porz" data-d="1" aria-label="Una porzione in più">${ico('piu', 18)}</button></div></div>
      ${r.ingredienti.map(i => `<div class="ing-riga"><span>${esc(i.nome)}</span><b>${fmt(i.g * k)} g</b></div>`).join('')}
      <p class="muted small">Totale: ${fmt(tot.kcal * k)} kcal · P ${fmt(tot.p * k)} g · C ${fmt(tot.c * k)} g · G ${fmt(tot.f * k)} g</p></section>
    ${passi.length ? `<section class="card"><h3>Procedimento</h3><ol class="passi">${passi.map(p => `<li>${esc(p)}</li>`).join('')}</ol></section>` : ''}
    ${r.note ? `<section class="card nota-card">${ico('lampo', 18)}<p>${esc(r.note)}</p></section>` : ''}
    <div class="row-btns"><button class="btn primary full" data-action="ric-cucina">${ico('play', 18)} Cucina passo passo</button></div>
    <div class="row-btns"><button class="btn full" data-action="ric-diario" data-id="${esc(r.id)}">${ico('piu', 18)} Al diario</button><button class="btn full" data-action="ric-spesa" data-id="${esc(r.id)}">${ico('carrello', 18)} Alla spesa</button></div>
    ${!r.foto && paginaFoto(r) ? `<p class="muted small centro">Foto indicativa da <a href="${paginaFoto(r)}" target="_blank" rel="noopener">Wikimedia Commons</a> (licenza libera)</p>` : ''}
    ${r.mia ? `<button class="btn full" data-action="go" data-view="ricetta-nuova" data-p="${esc(r.id)}">${ico('matita', 18)} Modifica ricetta</button>` : ''}
    <button class="btn ghost danger full" data-action="ric-del" data-id="${esc(r.id)}">${ico('cestino', 18)} Elimina ricetta</button></div>`;
}

/* ---------- Nuova ricetta o piatto (valori scritti a mano) ---------- */
let bozzaRic = null;
const nuovaBozza = () => ({ nome: '', categoria: 'Pranzi', porzioni: 1, prep: '', cottura: '', ingredienti: [{ nome: '', g: '' }, { nome: '', g: '' }],
  per: 'porzione', kcal: '', p: '', c: '', f: '', procedimento: '', note: '', foto: '', preferita: false });
export function viewRicettaNuova() {
  if (!bozzaRic || bozzaRic._per !== S.param) {
    const r = S.param ? (S.db.ricette || []).find(x => x.id === S.param) : null;
    if (r) { const m = ricMacro(r).por;
      bozzaRic = { nome: r.nome, categoria: r.categoria || 'Pranzi', porzioni: r.porzioni || 1, prep: r.prep || '', cottura: r.cottura || '',
        ingredienti: r.ingredienti.map(i => ({ nome: i.nome, g: i.g })), per: 'porzione', kcal: fmt(m.kcal, 1), p: fmt(m.p, 1), c: fmt(m.c, 1), f: fmt(m.f, 1),
        procedimento: r.procedimento || '', note: r.note || '', foto: r.foto || '', preferita: !!r.preferita };
    } else bozzaRic = nuovaBozza();
    bozzaRic._per = S.param;
  }
  const b = bozzaRic, cats = [...CATEGORIE.map(c => c[0]), 'Altro'];
  return `${testata(S.param ? 'Modifica ricetta' : 'Nuova ricetta', 'Ricetta o piatto tuo', { back: 'cucina', destra: '' })}
    <div class="pila"><section class="card form">
      <label class="campo"><span>Nome</span><input data-rb="nome" value="${esc(b.nome)}" placeholder="Es. Pasta al pesto con pollo"></label>
      <div class="due"><label class="campo"><span>Categoria</span><select data-rb="categoria">${cats.map(c => `<option ${c === b.categoria ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label class="campo"><span>Porzioni</span><input type="number" inputmode="numeric" min="1" data-rb="porzioni" value="${esc(b.porzioni)}"></label>
        <label class="campo"><span>Preparazione (min)</span><input type="number" inputmode="numeric" data-rb="prep" value="${esc(b.prep)}"></label>
        <label class="campo"><span>Cottura (min)</span><input type="number" inputmode="numeric" data-rb="cottura" value="${esc(b.cottura)}"></label></div></section>
    <section class="card form"><div class="row"><h3>Ingredienti</h3><span class="muted small">quantità per ${b.porzioni > 1 ? `tutte le ${esc(b.porzioni)} porzioni` : '1 porzione'}</span></div>
      ${b.ingredienti.map((i, k) => `<div class="ing-edit"><input data-rb-ing="${k}" data-k="nome" value="${esc(i.nome)}" placeholder="Ingrediente" aria-label="Ingrediente ${k + 1}">
        <input data-rb-ing="${k}" data-k="g" value="${esc(i.g)}" inputmode="decimal" placeholder="g" aria-label="Grammi ingrediente ${k + 1}">
        <button class="icon-btn small" data-action="rb-ing-del" data-i="${k}" aria-label="Togli ingrediente">${ico('chiudi', 16)}</button></div>`).join('')}
      <div class="row-btns"><button class="btn small ghost" data-action="rb-ing-add">${ico('piu', 16)} Ingrediente</button>
        <button class="btn small ghost" data-action="rb-ing-codice">${ico('codice', 16)} Con codice a barre</button></div>
      <p class="muted small">Con il codice a barre aggiungo l'ingrediente e sommo da solo le sue calorie e i macro ai valori qui sotto.</p></section>
    <section class="card form"><h3>Valori nutrizionali</h3>
      ${segmenti([['porzione', 'Per porzione'], ['totale', 'Ricetta intera']], b.per, 'rb-per', 'piccolo')}
      <div class="due"><label class="campo"><span>Calorie (kcal)</span><input data-rb="kcal" inputmode="decimal" value="${esc(b.kcal)}" placeholder="es. 650"></label>
        <label class="campo"><span>Proteine (g)</span><input data-rb="p" inputmode="decimal" value="${esc(b.p)}"></label>
        <label class="campo"><span>Grassi (g)</span><input data-rb="f" inputmode="decimal" value="${esc(b.f)}"></label>
        <label class="campo"><span>Carboidrati (g)</span><input data-rb="c" inputmode="decimal" value="${esc(b.c)}" placeholder="facoltativo"></label></div>
      <p class="muted small">Li trovi sulle etichette o nell'app che usi per contare le calorie. Se scegli "Ricetta intera" li divido io per le porzioni.</p></section>
    <section class="card form"><h3>Preparazione</h3>
      <label class="campo"><span>Procedimento (un passo per riga)</span><textarea data-rb="procedimento" placeholder="1. Cuoci la pasta&#10;2. Scalda il sugo...">${esc(b.procedimento)}</textarea></label>
      <label class="campo"><span>Note</span><input data-rb="note" value="${esc(b.note)}" placeholder="Consigli, varianti..."></label>
      <label class="campo"><span>Link di una foto (facoltativo)</span><input data-rb="foto" value="${esc(b.foto)}" placeholder="https://..." inputmode="url"></label>
      <label class="riga-check"><input type="checkbox" data-rb-pref ${b.preferita ? 'checked' : ''}> Aggiungi alle preferite</label></section>
    <button class="btn primary huge full" data-action="rb-salva">${ico('salva', 20)} Salva ricetta</button></div>`;
}

/* ---------- Cucina passo passo ---------- */
function foglioPasso(r) {
  const passi = passiDi(r.procedimento), n = passi.length, p = passi[passo] || '';
  const min = p.match(/(\d+)(?:\s*-\s*\d+)?\s*minut/i);
  return `<div class="cuoco"><span class="eyebrow">Passo ${passo + 1} di ${n}</span><p class="cuoco-t">${esc(p)}</p>
    ${min ? `<button class="btn big" data-action="cu-timer" data-min="${min[1]}">${ico('timer', 18)} Timer ${min[1]} min</button>` : ''}
    <div class="cuoco-nav"><button class="btn big" data-action="cu-passo" data-d="-1" ${passo === 0 ? 'disabled' : ''}>${ico('indietro', 18)} Indietro</button>
    ${passo < n - 1 ? `<button class="btn big primary" data-action="cu-passo" data-d="1">Avanti ${ico('avanti', 18)}</button>` : `<button class="btn big primary" data-action="foglio-chiudi">Fatto ${ico('check', 18)}</button>`}</div></div>`;
}

/* ---------- Aggiungi pasto ----------
   In alto i campi per scrivere il pasto; poi codice a barre e piatti salvati.
   Le ricette compaiono solo con l'interruttore "Mostra anche le ricette" (resta ricordato). */
const CAMPI_PASTO = ['pm-nome', 'pm-kcal', 'pm-p', 'pm-c', 'pm-f'];
function foglioPasto(slot, filtro = '') {
  slotScelto = slot;
  const q = filtro.toLowerCase(), conRicette = !!cfg().ricetteNelDiario;
  const ric = conRicette ? (S.db.ricette || []).filter(r => !q || r.nome.toLowerCase().includes(q)).slice(0, 40) : [];
  const pia = (S.db.piatti || []).filter(p => !q || p.nome.toLowerCase().includes(q));
  return `${segmenti(PASTI, slot, 'pasto-slot', 'piccolo')}
    <section class="form pasto-mano"><label class="campo"><span>Cosa hai mangiato</span><input id="pm-nome" placeholder="Es. Piadina crudo e squacquerone" autocomplete="off"></label>
      <div class="due"><label class="campo"><span>Kcal</span><input id="pm-kcal" inputmode="decimal"></label><label class="campo"><span>Proteine (g)</span><input id="pm-p" inputmode="decimal"></label>
      <label class="campo"><span>Carboidrati (g)</span><input id="pm-c" inputmode="decimal"></label><label class="campo"><span>Grassi (g)</span><input id="pm-f" inputmode="decimal"></label></div>
      <label class="riga-check"><input type="checkbox" id="pm-salva"> Salva tra i piatti per la prossima volta</label>
      <button class="btn primary full" data-action="pasto-manuale">${ico('piu', 18)} Aggiungi</button></section>
    <button class="btn full" data-action="cb-diario">${ico('codice', 18)} Prodotto con codice a barre</button>
    ${pia.length ? `<h4>Piatti salvati</h4>${pia.map(p => `<button class="ric-riga" data-action="pasto-piatto" data-id="${esc(p.id)}"><span><b>${esc(p.nome)}</b><small>${fmt(p.kcal)} kcal · ${fmt(p.p)} g prot.</small></span>${ico('piu', 18)}</button>`).join('')}` : ''}
    <label class="riga-check ricette-flag"><input type="checkbox" id="pm-ricette" ${conRicette ? 'checked' : ''}> Mostra anche le ricette</label>
    ${conRicette ? `<div class="cerca-box">${ico('cerca', 18)}<input id="pasto-cerca" type="search" placeholder="Cerca ricetta o piatto" value="${esc(filtro)}"></div>
    <h4>Ricette (1 porzione)</h4>${ric.length ? ric.map(r => { const m = ricMacro(r).por; return `<button class="ric-riga" data-action="pasto-ricetta" data-id="${esc(r.id)}">${miniFoto(r)}<span><b>${esc(r.nome)}</b><small>${fmt(m.kcal)} kcal · ${fmt(m.p)} g prot.</small></span>${ico('piu', 18)}</button>`; }).join('') : '<p class="muted small">Nessuna ricetta trovata.</p>'}` : ''}`;
}
/* ridisegna la finestra senza perdere quello che hai già scritto nei campi */
function rinfrescaPasto(filtro) {
  const val = {}; CAMPI_PASTO.forEach(id => { const e = document.getElementById(id); if (e) val[id] = e.value; });
  const salva = document.getElementById('pm-salva')?.checked;
  aggiornaFoglio(foglioPasto(slotScelto, filtro ?? (document.getElementById('pasto-cerca')?.value || '')));
  CAMPI_PASTO.forEach(id => { const e = document.getElementById(id); if (e && val[id] != null) e.value = val[id]; });
  const c = document.getElementById('pm-salva'); if (c && salva) c.checked = true;
}
function aggiungiPasto(x) {
  const d = giorno || todayISO();
  S.db.pasti = [...(S.db.pasti || []), { id: uid(), date: d, slot: slotScelto, ...x }];
  save(); chiudiFoglio(); app.render(); toast(`Aggiunto: ${x.nome}`);
}

/* ---------- CSV ricette ---------- */
export function importRicetteCSV(text, silenzioso = false) {
  const rows = parseCSV(text);
  const h = rows.findIndex(r => r.some(c => c.trim().toLowerCase() === 'ingrediente'));
  if (h < 0) return silenzioso ? 0 : toast('Non trovo la colonna "Ingrediente"');
  const hd = rows[h].map(c => c.trim().toLowerCase());
  const col = (...nomi) => hd.findIndex(x => nomi.some(n => x.startsWith(n)));
  const C = { id: col('id'), nome: col('nome'), cat: col('categoria'), porz: col('porzioni'), prep: col('prep'), cott: col('cottura'),
    ing: col('ingrediente'), g: col('grammi'), kcal: col('kcal'), p: col('proteine'), c: col('carbo'), f: col('grassi'),
    proc: col('procedimento'), note: col('note'), pref: col('preferit'), foto: col('foto') };
  const v = (r, k) => C[k] >= 0 ? String(r[C[k]] ?? '').trim() : '';
  const nuove = []; let cur = null;
  rows.slice(h + 1).forEach(r => {
    const id = v(r, 'id'), nome = v(r, 'nome'), ing = v(r, 'ing');
    if (!id && !nome && !ing) return;
    if (nome || (id && (!cur || id !== cur.id))) {
      cur = { id: id || slug(nome), ...((id || '').startsWith('mia-') ? { mia: true } : {}), nome: nome || id, categoria: v(r, 'cat'), porzioni: num(v(r, 'porz')) || 1, prep: num(v(r, 'prep')) || 0, cottura: num(v(r, 'cott')) || 0,
        procedimento: v(r, 'proc'), note: v(r, 'note'), preferita: /^(s[iì]|x|1|true|vero)$/i.test(v(r, 'pref')), foto: /^https?:\/\//.test(v(r, 'foto')) ? v(r, 'foto') : '', ingredienti: [] };
      nuove.push(cur);
    }
    if (cur && ing && num(v(r, 'g'))) cur.ingredienti.push({ nome: ing, g: num(v(r, 'g')), kcal: num(v(r, 'kcal')) || 0, p: num(v(r, 'p')) || 0, c: num(v(r, 'c')) || 0, f: num(v(r, 'f')) || 0 });
  });
  const valide = nuove.filter(r => r.ingredienti.length);
  if (!valide.length) return silenzioso ? 0 : toast('Nessuna ricetta valida nel file');
  S.db.ricette = S.db.ricette || [];
  let agg = 0, n2 = 0;
  valide.forEach(r => {
    if (silenzioso && (S.db.ricetteTolte || []).includes(r.id)) return;
    const i = S.db.ricette.findIndex(x => x.id === r.id);
    if (i >= 0) { r.preferita = r.preferita || S.db.ricette[i].preferita; r.foto = r.foto || S.db.ricette[i].foto; S.db.ricette[i] = r; agg++; } else { S.db.ricette.push(r); n2++; }
  });
  save();
  if (silenzioso) return n2;
  cat = 'Tutte'; tab = 'ricette'; app.go('cucina');
  toast(`🍳 ${n2} ricette nuove${agg ? `, ${agg} aggiornate` : ''}`);
}
/* Ricette incluse (ricette.csv): si caricano da sole la prima volta e quando ne aggiungo (aumenta RICETTE_VER) */
const RICETTE_VER = 2;
export async function caricaRicetteBase() {
  if (num(cfg().ricetteVer) >= RICETTE_VER && (S.db.ricette || []).length) return;
  try {
    const res = await fetch('ricette.csv', { cache: 'no-cache' }); if (!res.ok) return;
    const n = importRicetteCSV(await res.text(), true);
    cfg().ricetteVer = RICETTE_VER; save();
    if (n) { toast(`🍳 ${n} ricette fit aggiunte!`); app.renderSafe(); }
  } catch (e) {}
}
function esportaCSV() {
  const q = s => /[;"\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s;
  const per100 = r => { if (!r.manuale) return null; const t = ricMacro(r).tot, g = t.g || 0; return g ? { kcal: t.kcal / g * 100, p: t.p / g * 100, c: t.c / g * 100, f: t.f / g * 100 } : null; };
  const conIng = r => { const x = per100(r); return x ? r.ingredienti.map(i => ({ ...i, ...x })) : r.ingredienti; };
  const righe = [COLONNE_RICETTE, ...(S.db.ricette || []).flatMap(r => conIng(r).map((i, k) => [
    r.id, k ? '' : r.nome, k ? '' : r.categoria, k ? '' : r.porzioni, k ? '' : r.prep, k ? '' : r.cottura,
    i.nome, i.g, i.kcal, i.p, i.c, i.f, k ? '' : r.procedimento, k ? '' : r.note, k ? '' : (r.preferita ? 'Sì' : ''), k ? '' : r.foto]))];
  scaricaFile((S.db.ricette || []).length ? `ricette-${todayISO()}.csv` : 'modello-ricette.csv',
    '﻿' + righe.map(r => r.map(c => typeof c === 'number' ? String(c).replace('.', ',') : q(String(c ?? ''))).join(';')).join('\n'), 'text/csv;charset=utf-8');
}

/* ---------- Azioni ---------- */
const ricDi = id => (S.db.ricette || []).find(x => x.id === id);
export const azioni = {
  'rb-ing-add': () => { bozzaRic.ingredienti.push({ nome: '', g: '' }); app.render(); },
  'rb-ing-del': el => { bozzaRic.ingredienti.splice(+el.dataset.i, 1); if (!bozzaRic.ingredienti.length) bozzaRic.ingredienti.push({ nome: '', g: '' }); app.render(); },
  'cb-diario': () => { const slot = slotScelto; foglioCodice(x => { slotScelto = slot; aggiungiPasto({ tipo: 'prodotto', ref: x.codice, nome: `${x.nome} (${fmt(x.g)} g)`, porz: 1, kcal: x.kcal, p: x.p, c: x.c, f: x.f }); }, 'Aggiungi al diario'); },
  'rb-ing-codice': () => foglioCodice(x => {
    const b = bozzaRic; if (!b) return;
    const vuota = b.ingredienti.findIndex(i => !String(i.nome).trim());
    const riga = { nome: x.nome, g: String(Math.round(x.g * 10) / 10) };
    if (vuota >= 0) b.ingredienti[vuota] = riga; else b.ingredienti.push(riga);
    const campi = ['kcal', 'p', 'c', 'f'];
    if (campi.every(k => !num(b[k]))) b.per = 'totale';
    const div = b.per === 'totale' ? 1 : Math.max(1, num(b.porzioni) || 1);
    campi.forEach(k => { b[k] = String(Math.round(((num(b[k]) || 0) + x[k] / div) * 10) / 10); });
    chiudiFoglio(); app.render(); toast(`Aggiunto ${x.nome}: valori sommati`);
  }, 'Aggiungi alla ricetta'),
  'rb-per': el => { bozzaRic.per = el.dataset.v; app.render(); },
  'rb-salva': () => {
    const b = bozzaRic, nome = b.nome.trim(), n = Math.max(1, Math.round(num(b.porzioni) || 1));
    if (!nome) return toast('Scrivi il nome della ricetta');
    const v = k => num(b[k]) || 0;
    if (!v('kcal')) return toast('Scrivi le calorie');
    const div = b.per === 'totale' ? n : 1;
    const ingredienti = b.ingredienti.filter(i => i.nome.trim()).map(i => ({ nome: i.nome.trim(), g: num(i.g) || 0, kcal: 0, p: 0, c: 0, f: 0 }));
    const vecchia = b._per ? ricDi(b._per) : null;
    const r = { id: vecchia ? vecchia.id : 'mia-' + uid(), mia: true, nome, categoria: b.categoria, porzioni: n, prep: num(b.prep) || 0, cottura: num(b.cottura) || 0,
      procedimento: b.procedimento.trim(), note: b.note.trim(), foto: /^https?:\/\//.test(b.foto.trim()) ? b.foto.trim() : '', preferita: !!b.preferita, ingredienti,
      manuale: { kcal: v('kcal') / div, p: v('p') / div, c: v('c') / div, f: v('f') / div } };
    S.db.ricette = S.db.ricette || [];
    if (vecchia) S.db.ricette[S.db.ricette.indexOf(vecchia)] = r; else S.db.ricette.unshift(r);
    bozzaRic = null; save(); toast(vecchia ? 'Ricetta aggiornata' : 'Ricetta salvata 🍳'); app.go('ricetta', r.id);
  },
  'cu-tab': el => { tab = el.dataset.v; app.render(); },
  'cu-giorno': el => { const d = addDays(giorno || todayISO(), +el.dataset.d); giorno = d >= todayISO() ? null : d; app.render(); },
  'ric-cat': el => { cat = el.dataset.v; app.render(); },
  'ric-apri': el => { porz = null; chiudiFoglio(true); app.go('ricetta', el.dataset.id); },
  'ric-porz': el => { const r = ricDi(S.param); porz = Math.max(1, Math.min(20, (porz || r.porzioni || 1) + (+el.dataset.d))); app.render(); },
  'ric-pref': el => { const r = ricDi(el.dataset.id); if (r) { r.preferita = !r.preferita; save(); app.render(); toast(r.preferita ? 'Aggiunta alle preferite' : 'Tolta dalle preferite'); } },
  'ric-del': async el => {
    if (await chiedi({ titolo: 'Eliminare la ricetta?', ok: 'Elimina', pericolo: true })) {
      S.db.ricette = S.db.ricette.filter(x => x.id !== el.dataset.id);
      S.db.ricetteTolte = [...new Set([...(S.db.ricetteTolte || []), el.dataset.id])]; save(); tab = 'ricette'; app.go('cucina');
    }
  },
  'ric-import': () => app.pickFile('ricette'),
  'ric-modello': () => esportaCSV(),
  'ric-cucina': () => { const r = ricDi(S.param); passo = 0; if (!passiDi(r.procedimento).length) return toast('Questa ricetta non ha il procedimento'); apriFoglio(foglioPasso(r), { titolo: esc(r.nome), cls: 'alto' }); },
  'cu-passo': el => { const r = ricDi(S.param); passo = Math.max(0, Math.min(passiDi(r.procedimento).length - 1, passo + (+el.dataset.d))); aggiornaFoglio(foglioPasso(r)); },
  'cu-timer': el => { timerLibero('azzera'); timerLibero('dur', +el.dataset.min * 60); timerLibero('via'); toast(`Timer di ${el.dataset.min} minuti partito`); import('./strumenti.js').then(m => m.foglioStrumenti()); },
  'ric-diario': el => { const r = ricDi(el.dataset.id), n = porz || 1, m = ricMacro(r).por; slotScelto = /colazion/i.test(r.categoria) ? 'colazione' : /spuntin|dolci/i.test(r.categoria) ? 'spuntino' : new Date().getHours() < 16 ? 'pranzo' : 'cena';
    giorno = null; aggiungiPasto({ tipo: 'ricetta', ref: r.id, nome: r.nome, porz: n, kcal: m.kcal * n, p: m.p * n, c: m.c * n, f: m.f * n }); },
  'ric-spesa': el => {
    const r = ricDi(el.dataset.id), k = (porz || r.porzioni || 1) / (r.porzioni || 1);
    S.db.spesa = S.db.spesa || [];
    r.ingredienti.forEach(i => { const x = S.db.spesa.find(s => s.nome.toLowerCase() === i.nome.toLowerCase() && !s.fatto);
      if (x) x.g = (x.g || 0) + i.g * k; else S.db.spesa.push({ id: uid(), nome: i.nome, g: i.g * k, fatto: false }); });
    save(); toast(`${r.ingredienti.length} ingredienti nella lista della spesa`);
  },
  'pasto-add': el => apriFoglio(foglioPasto(el.dataset.slot), { titolo: 'Aggiungi al diario', cls: 'alto', id: 'pasto' }),
  'pasto-slot': el => { slotScelto = el.dataset.v; rinfrescaPasto(); },
  'pasto-ricetta': el => { const r = ricDi(el.dataset.id), m = ricMacro(r).por; aggiungiPasto({ tipo: 'ricetta', ref: r.id, nome: r.nome, porz: 1, kcal: m.kcal, p: m.p, c: m.c, f: m.f }); },
  'pasto-piatto': el => { const p = S.db.piatti.find(x => x.id === el.dataset.id); aggiungiPasto({ tipo: 'piatto', ref: p.id, nome: p.nome, porz: 1, kcal: p.kcal, p: p.p, c: p.c, f: p.f }); },
  'pasto-manuale': () => {
    const v = id => num(document.getElementById(id).value) || 0, nome = document.getElementById('pm-nome').value.trim();
    if (!nome || !v('pm-kcal')) return toast('Scrivi almeno nome e kcal');
    const x = { nome, kcal: v('pm-kcal'), p: v('pm-p'), c: v('pm-c'), f: v('pm-f') };
    if (document.getElementById('pm-salva').checked) S.db.piatti = [...(S.db.piatti || []), { id: uid(), ...x }];
    aggiungiPasto({ tipo: 'manuale', ...x, porz: 1 });
  },
  'pasto-del': el => { S.db.pasti = S.db.pasti.filter(p => p.id !== el.dataset.id); save(); app.render(); },
  'piatto-del': async el => { if (await chiedi({ titolo: 'Eliminare il piatto salvato?', ok: 'Elimina', pericolo: true })) { S.db.piatti = S.db.piatti.filter(p => p.id !== el.dataset.id); save(); app.render(); } },
  'spesa-add': () => { const i = document.getElementById('sp-nuovo'), t = i.value.trim(); if (!t) return; S.db.spesa = [...(S.db.spesa || []), { id: uid(), nome: t, g: 0, fatto: false }]; save(); app.render(); },
  'spesa-pulisci': () => { S.db.spesa = (S.db.spesa || []).filter(x => !x.fatto); save(); app.render(); },
  'spesa-svuota': async () => { if (await chiedi({ titolo: 'Svuotare la lista?', ok: 'Svuota', pericolo: true })) { S.db.spesa = []; save(); app.render(); } },
  'spesa-copia': async () => {
    const t = (S.db.spesa || []).filter(x => !x.fatto).map(x => `- ${x.nome}${x.g ? ` (${fmt(x.g)} g)` : ''}`).join('\n');
    try { await navigator.clipboard.writeText('Lista della spesa\n' + t); toast('Lista copiata: incollala dove vuoi'); } catch (e) { toast('Copia non riuscita'); }
  },
};
export function input(t) {
  if (t.dataset.rb && bozzaRic) { bozzaRic[t.dataset.rb] = t.value; return true; }
  if (t.dataset.rbIng != null && bozzaRic) { bozzaRic.ingredienti[+t.dataset.rbIng][t.dataset.k] = t.value; return true; }
  if (t.id === 'ric-cerca') { query = t.value; const l = document.getElementById('ric-lista'); if (l) l.innerHTML = ricLista(); return true; }
  if (t.id === 'pasto-cerca') { const v = t.value; rinfrescaPasto(v); const i = document.getElementById('pasto-cerca'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } return true; }
  return false;
}
export function change(t) {
  if (t.id === 'pm-ricette') { cfg().ricetteNelDiario = t.checked; save(); rinfrescaPasto(); if (t.checked) document.getElementById('pasto-cerca')?.scrollIntoView({ block: 'center' }); return true; }
  if (t.dataset.rbPref !== undefined && bozzaRic) { bozzaRic.preferita = t.checked; return true; }
  if (t.dataset.rb === 'porzioni' && bozzaRic) { app.render(); return true; }
  if (t.dataset.spesa) { const x = S.db.spesa.find(s => s.id === t.dataset.spesa); if (x) { x.fatto = t.checked; save(); t.closest('.sp-riga')?.classList.toggle('fatto', t.checked); } return true; }
  return false;
}
export const setTabCucina = t => { tab = t; };
/* Uscendo dalla ricetta le porzioni tornano quelle originali */
export const esci = () => { porz = null; ultimaRic = null; };
export const esciBozza = () => { bozzaRic = null; };
