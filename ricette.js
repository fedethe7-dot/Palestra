'use strict';
/* ============ RICETTE FIT ============
   Le ricette arrivano da un CSV con le stesse colonne della scheda "Ricette" del foglio Allenamenti:
   una riga per ingrediente, valori nutrizionali per 100 g. Kcal e macro li calcola l'app dalle grammature,
   così cambiando le porzioni si aggiorna tutto. */

const CATEGORIE = [
  ['Colazioni veloci', '☕', '#f59e0b', '#ef4444'],
  ['Pancake e dolci fit', '🥞', '#ec4899', '#8b5cf6'],
  ['Pranzi', '🍝', '#22c55e', '#14b8a6'],
  ['Cene', '🍽️', '#3b82f6', '#6366f1'],
  ['Spuntini proteici', '🥜', '#f97316', '#eab308'],
  ['Da portare al lavoro', '🥡', '#06b6d4', '#3b82f6'],
];
/* Emoji del piatto riconosciuta dal nome (se non c'è, quella della categoria) */
const EMO_PIATTO = [[/canederli|brodo|zuppa/i, '🍲'], [/polenta/i, '🌽'], [/pizza|montanara/i, '🍕'], [/hamburger|burger/i, '🍔'], [/piadina|wrap/i, '🌯'], [/carbonara|pasta|trofie|spaghett|penne/i, '🍝'],
  [/risotto|riso|basmati/i, '🍚'], [/pancake/i, '🥞'], [/porridge|corn flakes|cereali/i, '🥣'], [/tiramis|torta|mug cake|cake/i, '🍰'],
  [/uova|frittata/i, '🍳'], [/frullato|shake/i, '🥤'], [/toast|panino|tramezz/i, '🥪'], [/bresaola|speck|prosciutto/i, '🥓'],
  [/cotoletta|pollo/i, '🍗'], [/tacchino|carne|manzo/i, '🥩'],
  [/yogurt/i, '🥛'], [/patat/i, '🍟'], [/insalata/i, '🥗'], [/fette biscottate|biscott/i, '🍞']];
const emoDi = r => (EMO_PIATTO.find(([re]) => re.test(r.nome)) || [, catDi(r.categoria)[1]])[1];
const catDi = nome => CATEGORIE.find(c => c[0].toLowerCase() === String(nome || '').toLowerCase()) || ['Altro', '🍴', '#64748b', '#334155'];
const COLONNE_RICETTE = ['ID', 'Nome ricetta', 'Categoria', 'Porzioni', 'Prep (min)', 'Cottura (min)', 'Ingrediente', 'Grammi',
  'Kcal /100g', 'Proteine /100g', 'Carboidrati /100g', 'Grassi /100g', 'Procedimento', 'Note', 'Preferita', 'Foto'];

let ricCat = 'Tutte', ricQuery = '', ricOpen = null, ricPorz = null;

/* Totali della ricetta intera e per porzione */
function ricMacro(r) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, g: 0 };
  r.ingredienti.forEach(i => { const q = i.g / 100;
    t.kcal += (i.kcal || 0) * q; t.p += (i.p || 0) * q; t.c += (i.c || 0) * q; t.f += (i.f || 0) * q; t.g += i.g || 0; });
  const n = r.porzioni || 1;
  return { tot: t, por: { kcal: t.kcal / n, p: t.p / n, c: t.c / n, f: t.f / n, g: t.g / n } };
}
function passiDi(testo) {
  const t = String(testo || '').trim(); if (!t) return [];
  let p = t.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
  if (p.length === 1) p = t.split(/(?:^|\s)\d+[.)]\s+/).map(s => s.trim()).filter(Boolean);
  return p.map(s => s.replace(/^\d+[.)]\s*/, ''));
}

/* ---------- Schermate ---------- */
function ricettaCard(r) {
  const [, , c1, c2] = catDi(r.categoria), emo = emoDi(r), m = ricMacro(r).por, min = (r.prep || 0) + (r.cottura || 0);
  return `<button class="ric-card" data-action="ric-open" data-id="${esc(r.id)}">
    <div class="ric-img" style="--c1:${c1};--c2:${c2}">${r.foto ? `<img src="${esc(r.foto)}" alt="" loading="lazy">` : `<span>${emo}</span>`}
      ${r.preferita ? '<i class="ric-star">⭐</i>' : ''}</div>
    <div class="ric-body"><div class="title">${esc(r.nome)}</div>
      <div class="ric-meta"><span>🔥 ${fmt(m.kcal)} kcal</span><span>💪 ${fmt(m.p)} g</span>${min ? `<span>⏱️ ${min}′</span>` : ''}</div></div></button>`;
}
function ricLista() {
  const q = ricQuery.trim().toLowerCase();
  const lista = (db.ricette || []).filter(r => (ricCat === 'Tutte' || (ricCat === '⭐' ? r.preferita : r.categoria === ricCat)) &&
    (!q || `${r.nome} ${r.ingredienti.map(i => i.nome).join(' ')}`.toLowerCase().includes(q)));
  return lista.length ? lista.map(ricettaCard).join('') : `<div class="card">${emptyBox(ricCat === '⭐' ? 'Nessuna preferita: tocca la ⭐ in una ricetta' : 'Nessuna ricetta trovata')}</div>`;
}
function viewRicette() {
  const tutte = db.ricette || [];
  const head2 = head('Ricette Fit 🍳', tutte.length ? `${tutte.length} ricette • per porzione` : 'Sane, gustose e pensate per la massa');
  const azioni = `<div class="grid2"><button class="btn full" data-action="ric-import">📄 Importa CSV</button>
    <button class="btn full" data-action="ric-modello">⬇️ Modello CSV</button></div>`;
  if (!tutte.length) return `${head2}<div class="card empty-big"><div class="empty-emo">🥗</div>
      <b>Nessuna ricetta ancora</b><p class="muted">Importa il file CSV con le ricette: ogni ricetta avrà kcal, proteine, carboidrati e grassi calcolati dagli ingredienti, porzioni regolabili e preferiti.</p></div>${azioni}`;
  const cats = ['Tutte', '⭐', ...CATEGORIE.map(c => c[0]).filter(c => tutte.some(r => r.categoria === c))];
  const lab = c => c === 'Tutte' ? 'Tutte' : c === '⭐' ? '⭐ Preferite' : `${catDi(c)[1]} ${c}`;
  return `${head2}
    <input id="ric-search" type="search" placeholder="🔍 Cerca ricetta o ingrediente" value="${esc(ricQuery)}" style="margin-bottom:12px">
    <div class="chips-scroll">${cats.map(c => `<button class="pill ${ricCat === c ? 'active' : ''}" data-action="ric-cat" data-c="${esc(c)}">${esc(lab(c))}</button>`).join('')}</div>
    <div class="ric-grid" id="ric-list">${ricLista()}</div>
    ${azioni}`;
}
function viewRicetta() {
  const r = (db.ricette || []).find(x => x.id === ricOpen);
  if (!r) { view = 'ricette'; return viewRicette(); }
  const [cat, emoCat, c1, c2] = catDi(r.categoria), emo = emoDi(r);
  const n = ricPorz || r.porzioni || 1, k = n / (r.porzioni || 1);
  const { tot, por } = ricMacro(r);
  const M = { kcal: tot.kcal * k, p: tot.p * k, c: tot.c * k, f: tot.f * k };
  const obj = corpoCalcoli();
  const perc = obj.kcal ? `<div class="ric-obj">🎯 Una porzione copre il <b>${fmt(por.kcal / obj.kcal * 100)}%</b> delle kcal e il <b>${fmt(por.p / obj.prot * 100)}%</b> delle proteine del tuo obiettivo giornaliero.</div>` : '';
  const passi = passiDi(r.procedimento);
  return `<button class="back-link" data-action="go" data-view="ricette">← Ricette</button>
    <div class="ric-hero" style="--c1:${c1};--c2:${c2}">${r.foto ? `<img src="${esc(r.foto)}" alt="">` : `<span>${emo}</span>`}</div>
    <div class="row" style="align-items:flex-start;margin:14px 0 4px">
      <div><h1 class="ric-title">${esc(r.nome)}</h1><div class="muted">${emoCat} ${esc(cat)}${r.prep ? ` • 🔪 ${r.prep}′ prep.` : ''}${r.cottura ? ` • 🔥 ${r.cottura}′ cottura` : ''}</div></div>
      <button class="fav ${r.preferita ? 'on' : ''}" data-action="ric-fav" data-id="${esc(r.id)}" aria-label="Preferita">${r.preferita ? '⭐' : '☆'}</button></div>
    <div class="card"><div class="row"><h3 style="margin:0">Per porzione</h3><span class="muted">${fmt(por.g)} g</span></div>
      <div class="macro4"><div><b>${fmt(por.kcal)}</b><span>kcal</span></div><div class="mp"><b>${fmt(por.p, 1)}</b><span>proteine</span></div>
        <div class="mc"><b>${fmt(por.c, 1)}</b><span>carbo</span></div><div class="mf"><b>${fmt(por.f, 1)}</b><span>grassi</span></div></div>${perc}</div>
    <div class="card"><div class="row"><h3 style="margin:0">🛒 Ingredienti</h3>
      <div class="stepper"><button data-action="ric-porz" data-d="-1" ${n <= 1 ? 'disabled' : ''}>−</button><span><b>${n}</b> ${n === 1 ? 'porzione' : 'porzioni'}</span><button data-action="ric-porz" data-d="1">+</button></div></div>
      ${r.ingredienti.map(i => `<div class="list-item"><span>${esc(i.nome)}</span><b>${fmt(i.g * k)} g</b></div>`).join('')}
      <div class="muted" style="margin-top:10px">Totale ${n === 1 ? 'porzione' : `${n} porzioni`}: <b>${fmt(M.kcal)} kcal</b> • P ${fmt(M.p)} g • C ${fmt(M.c)} g • G ${fmt(M.f)} g</div></div>
    ${passi.length ? `<div class="card"><h3>👨‍🍳 Procedimento</h3><ol class="passi">${passi.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>` : ''}
    ${r.note ? `<div class="card"><h3>💡 Note</h3><div>${esc(r.note)}</div></div>` : ''}
    <div class="muted" style="text-align:center;margin:4px 0 14px">Valori indicativi calcolati dagli ingredienti (per 100 g di prodotto).</div>
    <button class="btn danger full" data-action="ric-del" data-id="${esc(r.id)}">Elimina ricetta</button>`;
}

/* ---------- CSV ---------- */
function importRicetteCSV(text, silenzioso = false) {
  const rows = parseCSV(text.replace(/^﻿/, ''));
  const h = rows.findIndex(r => r.some(c => c.trim().toLowerCase() === 'ingrediente'));
  if (h < 0) return silenzioso ? 0 : toast('Non trovo la colonna "Ingrediente"');
  const hd = rows[h].map(c => c.trim().toLowerCase());
  const col = (...nomi) => hd.findIndex(x => nomi.some(n => x.startsWith(n)));
  const C = { id: col('id'), nome: col('nome'), cat: col('categoria'), porz: col('porzioni'), prep: col('prep'), cott: col('cottura'),
    ing: col('ingrediente'), g: col('grammi'), kcal: col('kcal'), p: col('proteine'), c: col('carbo'), f: col('grassi'),
    proc: col('procedimento'), note: col('note'), pref: col('preferit'), foto: col('foto') };
  const v = (r, k) => C[k] >= 0 ? String(r[C[k]] ?? '').trim() : '';
  const slug = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nuove = []; let cur = null;
  rows.slice(h + 1).forEach(r => {
    const id = v(r, 'id'), nome = v(r, 'nome'), ing = v(r, 'ing');
    if (!id && !nome && !ing) return;
    if (nome || (id && (!cur || id !== cur.id))) {
      cur = { id: id || slug(nome), nome: nome || id, categoria: v(r, 'cat'), porzioni: num(v(r, 'porz')) || 1,
        prep: num(v(r, 'prep')) || 0, cottura: num(v(r, 'cott')) || 0, procedimento: v(r, 'proc'), note: v(r, 'note'),
        preferita: /^(s[iì]|x|1|true|vero)$/i.test(v(r, 'pref')), foto: /^https?:\/\//.test(v(r, 'foto')) ? v(r, 'foto') : '', ingredienti: [] };
      nuove.push(cur);
    }
    if (cur && ing && num(v(r, 'g'))) cur.ingredienti.push({ nome: ing, g: num(v(r, 'g')), kcal: num(v(r, 'kcal')) || 0,
      p: num(v(r, 'p')) || 0, c: num(v(r, 'c')) || 0, f: num(v(r, 'f')) || 0 });
  });
  const valide = nuove.filter(r => r.ingredienti.length);
  if (!valide.length) return silenzioso ? 0 : toast('Nessuna ricetta valida nel file');
  db.ricette = db.ricette || [];
  let agg = 0, nuove2 = 0;
  valide.forEach(r => {
    // Le ricette incluse che hai eliminato non tornano
    if (silenzioso && (db.ricetteTolte || []).includes(r.id)) return;
    const i = db.ricette.findIndex(x => x.id === r.id);
    if (i >= 0) { r.preferita = r.preferita || db.ricette[i].preferita; db.ricette[i] = r; agg++; } else { db.ricette.push(r); nuove2++; }
  });
  save();
  if (silenzioso) return nuove2;
  ricCat = 'Tutte'; go('ricette');
  toast(`🍳 ${nuove2} ricette nuove${agg ? `, ${agg} aggiornate` : ''}`);
}
/* Ricette incluse nell'app (file ricette.csv del repository): si caricano da sole
   la prima volta e quando ne aggiungo di nuove (aumenta RICETTE_VER) */
const RICETTE_VER = 2;
async function caricaRicetteBase() {
  if (num(db.settings.ricetteVer) >= RICETTE_VER) return;
  try {
    const res = await fetch('ricette.csv', { cache: 'no-cache' });
    if (!res.ok) return;
    const n = importRicetteCSV(await res.text(), true);
    db.settings.ricetteVer = RICETTE_VER; save();
    if (n) { toast(`🍳 ${n} ricette fit aggiunte!`); if (view === 'ricette' || view === 'home') render(); }
  } catch (e) {}
}
function scaricaModelloCSV() {
  const q = s => /[;"\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s;
  const righe = [COLONNE_RICETTE, ...(db.ricette || []).flatMap(r => r.ingredienti.map((i, k) => [
    r.id, k ? '' : r.nome, k ? '' : r.categoria, k ? '' : r.porzioni, k ? '' : r.prep, k ? '' : r.cottura,
    i.nome, i.g, i.kcal, i.p, i.c, i.f, k ? '' : r.procedimento, k ? '' : r.note, k ? '' : (r.preferita ? 'Sì' : ''), k ? '' : r.foto]))];
  const csv = '﻿' + righe.map(r => r.map(c => typeof c === 'number' ? String(c).replace('.', ',') : q(String(c ?? ''))).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = (db.ricette || []).length ? `ricette-${todayISO()}.csv` : 'modello-ricette.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function azioniRicette(a, el) {
  switch (a) {
    case 'ric-cat': ricCat = el.dataset.c; render(); return true;
    case 'ric-open': ricOpen = el.dataset.id; ricPorz = null; go('ricetta'); return true;
    case 'ric-porz': { const r = db.ricette.find(x => x.id === ricOpen);
      ricPorz = Math.max(1, Math.min(20, (ricPorz || r.porzioni || 1) + (+el.dataset.d))); render(); return true; }
    case 'ric-fav': { const r = db.ricette.find(x => x.id === el.dataset.id); if (r) { r.preferita = !r.preferita; save(); render();
      toast(r.preferita ? '⭐ Aggiunta alle preferite' : 'Tolta dalle preferite'); } return true; }
    case 'ric-del':
      if (confirm('Eliminare questa ricetta dall\'app?')) {
        db.ricette = db.ricette.filter(x => x.id !== el.dataset.id);
        db.ricetteTolte = [...new Set([...(db.ricetteTolte || []), el.dataset.id])]; save(); go('ricette');
      }
      return true;
    case 'ric-import': pickFile('ricette'); return true;
    case 'ric-modello': scaricaModelloCSV(); return true;
  }
  return false;
}
