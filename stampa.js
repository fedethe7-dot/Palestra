'use strict';
/* ============ STAMPA RESOCONTI ============
   Prepara una pagina bianca pulita e apre la stampa del telefono/PC
   (da lì si può anche "Salva come PDF"). */

const fmtFull = s => parseISO(s).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
const setTxt = e => e.sets.map(s => e.tipo === 'carico' ? `${fmt(s.kg, 2)}×${s.reps}` : `${s.reps}${e.tipo === 'tempo' ? '″' : ''}`).join('  ');

function stampa(titolo, sotto, corpo) {
  let el = $('#print');
  if (!el) { el = document.createElement('div'); el.id = 'print'; document.body.appendChild(el); }
  el.innerHTML = `<div class="p-head"><div><h1>${titolo}</h1><p>${sotto}</p></div><div class="p-logo">🏋️ Palestra</div></div>${corpo}
    <div class="p-foot">Stampato il ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}${db.settings.name ? ` • ${esc(db.settings.name)}` : ''}</div>`;
  document.body.classList.add('printing');
  setTimeout(() => { window.print(); }, 50);
}
window.addEventListener('afterprint', () => document.body.classList.remove('printing'));

function stampaRiepilogo(days) {
  const ws = inPeriod(days);
  if (!ws.length) return toast('Nessun allenamento nel periodo');
  const dal = ws[0].date, al = ws.at(-1).date;
  const vol = ws.reduce((s, w) => s + wVolume(w), 0), kc = ws.filter(w => w.kcal), kcal = kc.reduce((s, w) => s + w.kcal, 0);
  const settimane = Math.max(1, (daysBetween(dal, al) + 1) / 7);
  // Per esercizio: quante volte, carico massimo, primo e ultimo carico massimo del periodo
  const ex = {};
  ws.forEach(w => w.exercises.forEach(e => {
    const x = ex[e.nome] ||= { nome: e.nome, tipo: e.tipo, volte: 0, max: 0, best: null, primo: null, ultimo: null };
    x.volte++;
    if (e.tipo === 'carico') {
      const m = exMaxKg(e); if (x.primo == null) x.primo = m; x.ultimo = m;
      e.sets.forEach(s => { if ((s.kg || 0) > x.max || ((s.kg || 0) === x.max && s.reps > (x.best?.reps || 0))) { x.max = s.kg || 0; x.best = s; } });
    } else { const m = Math.max(...e.sets.map(s => s.reps || 0)); if (x.primo == null) x.primo = m; x.ultimo = m; x.max = Math.max(x.max, m); }
  }));
  const righeEx = Object.values(ex).sort((a, b) => b.volte - a.volte).map(x => {
    const d = x.ultimo - x.primo, u = x.tipo === 'carico' ? ' kg' : x.tipo === 'tempo' ? '″' : ' rip';
    return `<tr><td>${esc(x.nome)}</td><td class="c">${x.volte}</td><td class="c">${x.tipo === 'carico' ? `${fmt(x.max, 2)} kg × ${x.best?.reps ?? ''}` : `${fmt(x.max)}${u}`}</td>
      <td class="c">${fmt(x.primo, 2)} → ${fmt(x.ultimo, 2)}${u}</td><td class="c ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}">${d > 0 ? '+' : ''}${fmt(d, 2)}</td></tr>`;
  }).join('');
  const righeW = ws.map(w => `<tr><td>${fmtFull(w.date)}</td><td class="c">${esc(w.session)}</td>
    <td>${w.exercises.map(e => `<div><b>${esc(e.nome)}</b> ${setTxt(e)}</div>`).join('')}</td>
    <td class="c">${fmt(wVolume(w))}</td><td class="c">${w.kcal || '—'}</td></tr>`).join('');
  const per = { 7: 'ultimi 7 giorni', 30: 'ultimi 30 giorni', 90: 'ultimi 3 mesi', 180: 'ultimi 6 mesi', 365: 'ultimo anno', 0: 'tutto lo storico' }[days] || '';
  stampa('Riepilogo allenamenti', `Dal ${fmtFull(dal)} al ${fmtFull(al)}${per ? ` • ${per}` : ''}`, `
    <div class="p-kpi"><div><b>${ws.length}</b>allenamenti</div><div><b>${fmt(ws.length / settimane, 1)}</b>a settimana</div>
      <div><b>${fmt(vol)}</b>kg di volume</div><div><b>${kc.length ? fmt(kcal) : '—'}</b>kcal</div></div>
    <h2>Esercizi e progressi</h2>
    <table><thead><tr><th>Esercizio</th><th>Volte</th><th>Migliore</th><th>Carico max: inizio → fine</th><th>Diff.</th></tr></thead><tbody>${righeEx}</tbody></table>
    <h2>Dettaglio allenamenti</h2>
    <table><thead><tr><th>Data</th><th>Sess.</th><th>Serie (kg × ripetizioni)</th><th>Volume</th><th>Kcal</th></tr></thead><tbody>${righeW}</tbody></table>`);
}

function stampaStorico(nome) {
  if (!nome) return toast('Scegli prima un esercizio');
  const voci = sorted().map(w => ({ w, e: w.exercises.find(x => x.nome === nome) })).filter(x => x.e);
  if (!voci.length) return toast('Nessun dato per questo esercizio');
  const tipo = voci[0].e.tipo, carico = tipo === 'carico';
  const righe = voci.map(({ w, e }) => `<tr><td>${fmtFull(w.date)}</td><td class="c">${esc(w.session)}</td><td>${setTxt(e)}</td>
    <td class="c">${carico ? fmt(exMaxKg(e), 2) + ' kg' : fmt(Math.max(...e.sets.map(s => s.reps || 0))) + (tipo === 'tempo' ? '″' : '')}</td>
    <td class="c">${carico ? fmt(exVolume(e)) : fmt(exReps(e))}</td></tr>`).join('');
  const rec = records()[nome];
  const primo = carico ? exMaxKg(voci[0].e) : null, ultimo = carico ? exMaxKg(voci.at(-1).e) : null;
  stampa(`Storico: ${esc(nome)}`, `${voci.length} allenamenti dal ${fmtFull(voci[0].w.date)} al ${fmtFull(voci.at(-1).w.date)}`, `
    <div class="p-kpi"><div><b>${voci.length}</b>volte</div>
      ${carico ? `<div><b>${rec ? fmt(rec.kg, 2) + ' kg × ' + rec.reps : '—'}</b>record</div><div><b>${fmt(primo, 2)} → ${fmt(ultimo, 2)}</b>kg max inizio → oggi</div>
      <div><b>${ultimo - primo >= 0 ? '+' : ''}${fmt(ultimo - primo, 2)} kg</b>progresso</div>` : ''}</div>
    <table><thead><tr><th>Data</th><th>Sess.</th><th>Serie ${carico ? '(kg × ripetizioni)' : tipo === 'tempo' ? '(secondi)' : '(ripetizioni)'}</th><th>Massimo</th><th>${carico ? 'Volume kg' : 'Totale'}</th></tr></thead><tbody>${righe}</tbody></table>`);
}

function cardStampa(nomi) {
  const per = PERIODI.find(p => p[0] === period)?.[1];
  return `<div class="card"><h3>🖨️ Stampa resoconto</h3>
    <button class="btn full" data-action="print-riepilogo" style="margin-bottom:10px">📋 Riepilogo del periodo (${per})</button>
    ${nomi.length ? `<div class="row" style="gap:8px"><select id="print-ex">${nomi.map(n => `<option ${n === chartEx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <button class="btn" data-action="print-storico" style="white-space:nowrap">📈 Storico</button></div>` : ''}
    <div class="muted" style="margin-top:8px">Si apre la stampa: puoi stampare o scegliere "Salva come PDF".</div></div>`;
}

function azioniStampa(a) {
  if (a === 'print-riepilogo') { stampaRiepilogo(period); return true; }
  if (a === 'print-storico') { stampaStorico($('#print-ex')?.value); return true; }
  return false;
}
