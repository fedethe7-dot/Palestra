/* ============ GRAFICI ============
   Grafici SVG disegnati a mano (niente librerie: leggeri e funzionano offline).
   Tocca o trascina sul grafico per vedere il valore di ogni punto. */
import { fmt, fmtDate, esc, uid } from './util.js';
import { vuoto } from './ui.js';

/* Linea con area sfumata. pts: [{x: 'AAAA-MM-GG', y: numero, label?}] */
export function lineChart(pts, opz = {}) {
  const { unita = '', dec = 1, h = 170, colore = 'var(--accent)', media = null, obiettivo = null } = opz;
  if (pts.length < 2) return vuoto(pts.length ? 'Serve almeno un altro dato per disegnare il grafico' : 'Nessun dato nel periodo', 'progressi');
  const W = 340, H = h, P = { l: 36, r: 12, t: 14, b: 26 };
  const ys = pts.map(p => p.y).concat(obiettivo != null ? [obiettivo] : []);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.14; min -= pad; max += pad;
  const x = i => P.l + (i * (W - P.l - P.r)) / (pts.length - 1);
  const y = v => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${x(pts.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const grid = [0, 0.5, 1].map(f => { const v = min + pad + f * (max - min - 2 * pad), yy = y(v);
    return `<line class="g-grid" x1="${P.l}" x2="${W - P.r}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}"/><text class="g-txt" x="${P.l - 6}" y="${(yy + 3.5).toFixed(1)}" text-anchor="end">${fmt(v, dec)}</text>`; }).join('');
  const step = Math.max(1, Math.ceil(pts.length / 4));
  const labels = pts.map((p, i) => (i % step === 0 || i === pts.length - 1) && !(i !== pts.length - 1 && pts.length - 1 - i < step / 2)
    ? `<text class="g-txt" x="${x(i).toFixed(1)}" y="${H - 7}" text-anchor="${i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}">${fmtDate(p.x)}</text>` : '').join('');
  const id = 'g' + uid();
  const mediaPath = media && media.length === pts.length ? `<path d="${media.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" class="g-media"/>` : '';
  const obj = obiettivo != null ? `<line class="g-obj" x1="${P.l}" x2="${W - P.r}" y1="${y(obiettivo).toFixed(1)}" y2="${y(obiettivo).toFixed(1)}"/><text class="g-txt g-objt" x="${W - P.r}" y="${(y(obiettivo) - 5).toFixed(1)}" text-anchor="end">obiettivo ${fmt(obiettivo, dec)}</text>` : '';
  const dati = pts.map((p, i) => ({ x: +x(i).toFixed(1), y: +y(p.y).toFixed(1), t: `${fmtDate(p.x)} · ${p.label || fmt(p.y, dec) + ' ' + unita}` }));
  const last = pts.length - 1;
  return `<div class="chart-box"><svg class="chart" viewBox="0 0 ${W} ${H}" data-pts='${esc(JSON.stringify(dati))}' role="img" aria-label="Grafico da ${fmt(pts[0].y, dec)} a ${fmt(pts[last].y, dec)} ${unita}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colore}" stop-opacity=".32"/><stop offset="1" stop-color="${colore}" stop-opacity="0"/></linearGradient></defs>
    ${grid}${obj}<path d="${area}" fill="url(#${id})"/>${mediaPath}
    <path d="${path}" class="g-line" style="stroke:${colore}"/>
    ${pts.length <= 24 ? pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="${i === last ? 5 : 3}" class="g-dot ${i === last ? 'end' : ''}" style="fill:${i === last ? 'var(--bg)' : colore};stroke:${colore}"/>`).join('') : `<circle cx="${x(last).toFixed(1)}" cy="${y(pts[last].y).toFixed(1)}" r="5" class="g-dot end" style="fill:var(--bg);stroke:${colore}"/>`}
    ${labels}<g class="g-hover" style="display:none"><line class="g-vline" y1="${P.t}" y2="${H - P.b}"/><circle r="6" class="g-hdot" style="stroke:${colore}"/></g></svg>
    <div class="g-tip" hidden></div></div>`;
}

/* Barre verticali. items: [{label, value, evid?}] */
export function barChart(items, opz = {}) {
  const { unita = '', dec = 0, h = 150, kilo = false } = opz;
  if (!items.length) return vuoto('Nessun dato nel periodo', 'progressi');
  const W = 340, H = h, P = { l: 36, r: 6, t: 12, b: 24 };
  const max = Math.max(...items.map(i => i.value), 1), bw = (W - P.l - P.r) / items.length, step = Math.max(1, Math.ceil(items.length / 6));
  const lab = v => kilo ? fmt(v / 1000, 1) + 'k' : fmt(v, dec);
  const grid = [0, 0.5, 1].map(f => { const yy = P.t + (1 - f) * (H - P.t - P.b);
    return `<line class="g-grid" x1="${P.l}" x2="${W - P.r}" y1="${yy}" y2="${yy}"/><text class="g-txt" x="${P.l - 6}" y="${yy + 3.5}" text-anchor="end">${lab(max * f)}</text>`; }).join('');
  const dati = [];
  const bars = items.map((it, i) => {
    const hh = Math.max(it.value ? 2 : 0, (it.value / max) * (H - P.t - P.b)), xx = P.l + i * bw + bw * 0.16, ww = bw * 0.68;
    dati.push({ x: +(xx + ww / 2).toFixed(1), y: +(H - P.b - hh).toFixed(1), t: `${it.label} · ${fmt(it.value, dec)} ${unita}` });
    return `<rect class="g-bar ${it.evid ? 'evid' : ''}" x="${xx.toFixed(1)}" y="${(H - P.b - hh).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" rx="${Math.min(ww / 2, 6).toFixed(1)}"/>
      ${(i % step === 0 && items.length - 1 - i >= step / 2) || i === items.length - 1 ? `<text class="g-txt" x="${(xx + ww / 2).toFixed(1)}" y="${H - 7}" text-anchor="middle">${esc(it.label)}</text>` : ''}`;
  }).join('');
  return `<div class="chart-box"><svg class="chart" viewBox="0 0 ${W} ${H}" data-pts='${esc(JSON.stringify(dati))}' role="img" aria-label="Grafico a barre">${grid}${bars}
    <g class="g-hover" style="display:none"><line class="g-vline" y1="${P.t}" y2="${H - P.b}"/><circle r="5" class="g-hdot"/></g></svg><div class="g-tip" hidden></div></div>`;
}

/* Barre orizzontali con linea obiettivo. righe: [{nome, valore, nota?}] */
export function barreH(righe, { obiettivo = null, max = null, unita = '' } = {}) {
  const m = max || Math.max(obiettivo || 0, ...righe.map(r => r.valore), 1) * 1.15;
  return `<div class="barreh">${righe.map(r => {
    const basso = obiettivo != null && r.valore < obiettivo;
    return `<div class="bh-riga"><span class="bh-nome">${esc(r.nome)}</span>
      <div class="bh-trk">${obiettivo != null ? `<i class="bh-obj" style="left:${(obiettivo / m * 100).toFixed(1)}%"></i>` : ''}<div class="bh-fill ${basso ? 'basso' : ''}" style="width:${Math.min(100, r.valore / m * 100).toFixed(1)}%"></div></div>
      <b class="bh-val ${basso ? 'basso' : ''}">${fmt(r.valore, 1)}${unita}</b></div>`; }).join('')}</div>`;
}

/* Calendario a quadretti (settimane in colonna, giorni in riga) */
export function heatmap(giorni, livello, settimane = 16) {
  return `<div class="heat" style="grid-template-columns:repeat(${settimane},1fr)" role="img" aria-label="Allenamenti delle ultime ${settimane} settimane">${giorni.map(g =>
    `<i class="h${livello(g)}" title="${g.titolo || ''}"></i>`).join('')}</div>`;
}

/* Attiva il tocco sui grafici della schermata */
export function attivaGrafici(root = document) {
  root.querySelectorAll('.chart[data-pts]').forEach(svg => {
    if (svg.dataset.on) return; svg.dataset.on = '1';
    const pts = JSON.parse(svg.dataset.pts || '[]'); if (!pts.length) return;
    const box = svg.parentElement, tip = box.querySelector('.g-tip'), hov = svg.querySelector('.g-hover');
    const vb = svg.viewBox.baseVal;
    const mostra = ev => {
      const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * vb.width;
      let best = pts[0]; for (const p of pts) if (Math.abs(p.x - px) < Math.abs(best.x - px)) best = p;
      hov.style.display = '';
      hov.querySelector('line').setAttribute('x1', best.x); hov.querySelector('line').setAttribute('x2', best.x);
      hov.querySelector('circle').setAttribute('cx', best.x); hov.querySelector('circle').setAttribute('cy', best.y);
      tip.hidden = false; tip.textContent = best.t;
      const left = best.x / vb.width * r.width;
      tip.style.left = Math.max(4, Math.min(r.width - tip.offsetWidth - 4, left - tip.offsetWidth / 2)) + 'px';
    };
    const nascondi = () => { hov.style.display = 'none'; tip.hidden = true; };
    svg.addEventListener('pointerdown', mostra); svg.addEventListener('pointermove', mostra);
    svg.addEventListener('pointerleave', nascondi);
  });
}
