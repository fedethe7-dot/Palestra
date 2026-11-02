/* ============ RESOCONTO DIMAGRIMENTO DA STAMPARE ============
   Una pagina pulita da portare a chi segue il piano (nutrizionista, medico, personal trainer):
   peso, grasso, metabolismo basale, calorie, misure, andamento per settimana.
   Si apre la stampa del telefono: da lì "Salva come PDF" o stampa. */
import { S, cfg, bodySorted, corpoCalcoli, obiettiviGiorno, inPeriod, ATTIVITA, FASI } from './dati.js';
import { $, esc, fmt, num, toast, parseISO, daysBetween, isoOf, weekStart, isoFrom } from './util.js';

const fmtFull = s => parseISO(s).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
const PER = { 30: 'ultimo mese', 90: 'ultimi 3 mesi', 180: 'ultimi 6 mesi', 365: 'ultimo anno', 0: 'tutto lo storico' };
const segno = (v, d = 1) => v == null ? '—' : `${v > 0 ? '+' : ''}${fmt(v, d)}`;

function stampa(titolo, sotto, corpo) {
  let el = $('#print');
  if (!el) { el = document.createElement('div'); el.id = 'print'; document.body.appendChild(el); }
  el.innerHTML = `<div class="p-head"><div><h1>${titolo}</h1><p>${sotto}</p></div><div class="p-logo">Palestra</div></div>${corpo}
    <div class="p-foot">Creato il ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} con l'app Palestra. Valori stimati con formule standard: non sostituiscono una visita.</div>`;
  document.body.classList.add('printing');
  setTimeout(() => { try { window.print(); } catch (e) { toast('Stampa non disponibile qui'); } }, 60);
}
window.addEventListener('afterprint', () => document.body.classList.remove('printing'));

/* Tutti i pesi (pesate + bilancia), un valore al giorno */
function pesiUniti(dal) {
  const m = new Map();
  S.db.weights.forEach(w => { if (w.kg) m.set(w.date, { date: w.date, kg: num(w.kg) }); });
  bodySorted().forEach(b => { const x = m.get(b.date) || { date: b.date }; if (num(b.kg)) x.kg = num(b.kg); if (num(b.fat) != null) x.fat = num(b.fat); if (num(b.muscle) != null) x.muscle = num(b.muscle); m.set(b.date, x); });
  return [...m.values()].filter(x => x.kg && (!dal || x.date >= dal)).sort((a, b) => a.date.localeCompare(b.date));
}

/* Grafico del peso in bianco e nero per la carta */
function graficoPeso(pts, goal) {
  if (pts.length < 2) return '';
  const W = 680, H = 190, P = { l: 40, r: 10, t: 10, b: 24 };
  const ys = pts.map(p => p.kg).concat(goal ? [goal] : []), min = Math.floor(Math.min(...ys) - 0.5), max = Math.ceil(Math.max(...ys) + 0.5);
  const t0 = parseISO(pts[0].date).getTime(), t1 = Math.max(t0 + 1, parseISO(pts.at(-1).date).getTime());
  const X = d => P.l + (parseISO(d).getTime() - t0) / (t1 - t0) * (W - P.l - P.r), Y = v => P.t + (max - v) / (max - min || 1) * (H - P.t - P.b);
  const media = pts.map((p, i) => { const s = pts.slice(Math.max(0, i - 3), i + 1); return { date: p.date, kg: s.reduce((a, x) => a + x.kg, 0) / s.length }; });
  const passo = Math.max(1, Math.ceil((max - min) / 5)), righe = [];
  for (let v = min; v <= max; v += passo) righe.push(`<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ddd"/><text x="${P.l - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`);
  const etich = [pts[0], pts[Math.floor(pts.length / 2)], pts.at(-1)].map((p, i) => `<text x="${X(p.date)}" y="${H - 6}" text-anchor="${['start', 'middle', 'end'][i]}">${fmtFull(p.date)}</text>`);
  return `<svg class="p-graf" viewBox="0 0 ${W} ${H}" font-size="10" font-family="Arial">${righe.join('')}
    ${goal ? `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#087a2f" stroke-dasharray="6 4"/><text x="${W - P.r}" y="${Y(goal) - 4}" text-anchor="end" fill="#087a2f">obiettivo ${fmt(goal, 1)} kg</text>` : ''}
    <polyline fill="none" stroke="#999" stroke-width="1" points="${pts.map(p => `${X(p.date)},${Y(p.kg)}`).join(' ')}"/>
    ${pts.map(p => `<circle cx="${X(p.date)}" cy="${Y(p.kg)}" r="2" fill="#999"/>`).join('')}
    <polyline fill="none" stroke="#000" stroke-width="2.2" points="${media.map(p => `${X(p.date)},${Y(p.kg)}`).join(' ')}"/>${etich.join('')}</svg>
    <p class="p-nota">Linea nera: media delle ultime 4 pesate (toglie gli sbalzi di acqua). Punti grigi: singole pesate.</p>`;
}

export function stampaDimagrimento(days = 90) {
  const dal = days ? isoFrom(days) : null, pts = pesiUniti(dal);
  if (!pts.length) return toast('Servono almeno delle pesate per il resoconto');
  const s = cfg(), r = corpoCalcoli(), ob = obiettiviGiorno(), goal = num(s.goal);
  const primo = pts[0], ultimo = pts.at(-1), giorni = Math.max(1, daysBetween(primo.date, ultimo.date));
  // Ritmo con la media mobile (più affidabile del singolo giorno)
  const m4 = (i, l) => { const x = l.slice(Math.max(0, i - 3), i + 1); return x.reduce((a, b) => a + b.kg, 0) / x.length; };
  const mediaInizio = m4(Math.min(3, pts.length - 1), pts), mediaFine = m4(pts.length - 1, pts);
  const delta = mediaFine - mediaInizio, ritmo = giorni >= 7 ? delta / giorni * 7 : null;
  const conGrasso = pts.filter(p => p.fat != null), g0 = conGrasso[0], g1 = conGrasso.at(-1);
  const fkg = p => p.kg * p.fat / 100, mkg = p => p.kg * (1 - p.fat / 100);
  // Settimane
  const sett = new Map();
  pts.forEach(p => { const k = weekStart(parseISO(p.date)); const x = sett.get(k) || { k, kg: [], fat: [] }; x.kg.push(p.kg); if (p.fat != null) x.fat.push(p.fat); sett.set(k, x); });
  const pasti = (S.db.pasti || []).filter(p => !dal || p.date >= dal), ws = inPeriod(days);
  const kcalGiorno = new Map(); pasti.forEach(p => kcalGiorno.set(p.date, (kcalGiorno.get(p.date) || 0) + (p.kcal || 0)));
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  let prima = null;
  const righeSett = [...sett.values()].sort((a, b) => a.k.localeCompare(b.k)).map(x => {
    const kg = avg(x.kg), fa = avg(x.fat), fine = isoOf(new Date(parseISO(x.k).getTime() + 6 * 86400000));
    const kc = [...kcalGiorno].filter(([d]) => d >= x.k && d <= fine).map(([, v]) => v), al = ws.filter(w => w.date >= x.k && w.date <= fine).length;
    const d = prima == null ? null : kg - prima; prima = kg;
    return `<tr><td>${fmtFull(x.k)}</td><td class="c">${fmt(kg, 1)}</td><td class="c ${d < 0 ? 'pos' : d > 0 ? 'neg' : ''}">${segno(d)}</td>
      <td class="c">${fa != null ? fmt(fa, 1) + '%' : '—'}</td><td class="c">${kc.length ? fmt(avg(kc)) + ` <small>(${kc.length} gg)</small>` : '—'}</td><td class="c">${al || '—'}</td></tr>`;
  }).join('');
  // Misure
  const MIS = [['vita', 'Vita'], ['fianchi', 'Fianchi'], ['petto', 'Petto'], ['braccio', 'Braccio'], ['coscia', 'Coscia']];
  const mis = [...(S.db.misure || [])].filter(m => !dal || m.date >= dal).sort((a, b) => a.date.localeCompare(b.date)), m0 = mis[0], m1 = mis.at(-1);
  const righeMis = m0 ? MIS.map(([k, l]) => { const a = num(m0[k]), b = num(m1[k]); return a == null && b == null ? '' :
    `<tr><td>${l}</td><td class="c">${fmt(a, 1)}</td><td class="c">${fmt(b, 1)}</td><td class="c ${b - a < 0 ? 'pos' : b - a > 0 ? 'neg' : ''}">${a != null && b != null ? segno(b - a) : '—'}</td></tr>`; }).join('') : '';
  const att = ATTIVITA.find(a => a[0] === String(s.attivita)), fase = FASI.find(f => f[0] === (s.fase || 'massa'));
  const kcalMedie = avg([...kcalGiorno.values()]), allSett = ws.length / Math.max(1, (days || giorni) / 7);
  const dati = [s.eta && `${esc(s.eta)} anni`, s.altezza && `${esc(s.altezza)} cm`, att && `attività: ${att[1].toLowerCase()} (×${String(r.att ? Math.round(r.att * 100) / 100 : att[0]).replace('.', ',')})`, fase && `fase: ${fase[1].toLowerCase()}`].filter(Boolean).join(' · ');

  stampa('Resoconto peso e composizione', `${s.name ? esc(s.name) + ' • ' : ''}dal ${fmtFull(primo.date)} al ${fmtFull(ultimo.date)}${PER[days] ? ` (${PER[days]})` : ''}`, `
    ${dati ? `<p class="p-dati">${dati}</p>` : ''}
    <div class="p-kpi">
      <div><b>${fmt(ultimo.kg, 1)} kg</b>peso attuale<small>inizio ${fmt(primo.kg, 1)} kg</small></div>
      <div><b>${segno(delta)} kg</b>variazione (media)<small>${ritmo != null ? `${segno(ritmo, 2)} kg a settimana` : 'periodo breve'}</small></div>
      <div><b>${g1 ? fmt(g1.fat, 1) + '%' : '—'}</b>massa grassa<small>${g1 ? `${fmt(fkg(g1), 1)} kg${g0 !== g1 ? ` · inizio ${fmt(g0.fat, 1)}%` : ''}` : 'nessuna misura'}</small></div>
      <div><b>${g1 ? fmt(mkg(g1), 1) + ' kg' : '—'}</b>massa magra<small>${g0 && g0 !== g1 ? `${segno(mkg(g1) - mkg(g0))} kg` : '&nbsp;'}</small></div>
    </div>
    <div class="p-kpi">
      <div><b>${r.bmr ? fmt(r.bmr) : '—'}</b>calorie basali (kcal)<small>${r.bmr ? 'a riposo, al giorno' : 'servono altezza ed età'}</small></div>
      <div><b>${r.tdee ? fmt(r.tdee) : '—'}</b>fabbisogno (kcal)<small>${r.tdee ? 'con l\'attività' : '&nbsp;'}</small></div>
      <div><b>${fmt(ob.kcal)}</b>obiettivo (kcal)<small>P ${ob.p} · C ${ob.c} · G ${ob.f} g</small></div>
      <div><b>${r.bmi ? fmt(r.bmi, 1) : '—'}</b>BMI<small>${goal ? `peso obiettivo ${fmt(goal, 1)} kg` : '&nbsp;'}</small></div>
    </div>
    <p class="p-nota">${r.formula ? `Calorie basali calcolate con la formula ${esc(r.formula)}${r.formula.startsWith('Mifflin') ? ', versione uomo' : ''}.` : ''}
      ${kcalMedie ? ` Calorie mangiate registrate: media ${fmt(kcalMedie)} kcal nei ${kcalGiorno.size} giorni segnati.` : ''}
      Allenamenti: ${ws.length} nel periodo (${fmt(allSett, 1)} a settimana).</p>
    <h2>Andamento del peso</h2>${graficoPeso(pts, goal)}
    <h2>Settimana per settimana</h2>
    <table><thead><tr><th>Settimana dal</th><th>Peso medio</th><th>Diff.</th><th>Grasso</th><th>Kcal mangiate al giorno</th><th>Allenamenti</th></tr></thead><tbody>${righeSett}</tbody></table>
    ${righeMis ? `<h2>Misure (cm)</h2><table class="p-stretta"><thead><tr><th></th><th>${fmtFull(m0.date)}</th><th>${fmtFull(m1.date)}</th><th>Diff.</th></tr></thead><tbody>${righeMis}</tbody></table>` : ''}
    <h2>Note</h2><div class="p-note"></div>`);
}
