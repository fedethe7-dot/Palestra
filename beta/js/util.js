/* ============ STRUMENTI COMUNI ============
   Funzioni piccole usate da tutte le schermate: date, numeri, testo sicuro, avvisi e finestre di conferma. */

export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- Date (sempre nel formato AAAA-MM-GG) ---------- */
export const isoOf = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
export const todayISO = () => isoOf(new Date());
export const parseISO = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
export const isoFrom = days => addDays(todayISO(), -days);
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
export const fmtDate = s => parseISO(s).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
export const fmtDateLong = s => parseISO(s).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtDateFull = s => parseISO(s).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtMese = s => parseISO(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
export function weekStart(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return isoOf(x); }

/* Porta qualsiasi data ("2026-10-06T08:00:00.000Z", "06/10/2026"...) ad AAAA-MM-GG; null se non è una data */
export function normDate(v) {
  if (v == null) return null;
  const s = String(v).trim(), pad = n => String(n).padStart(2, '0');
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (!/\d{4}/.test(s)) return null;
  const d = new Date(s);
  if (isNaN(d)) return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------- Numeri ---------- */
export const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
export const fmt = (n, d = 0) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString('it-IT', { maximumFractionDigits: d });
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export function restSec(s) { const n = num(s); if (n == null) return 90; return /min/i.test(s) ? Math.round(n * 60) : Math.round(n); }
export const secTxt = sec => sec >= 60 ? (sec % 60 ? `${Math.floor(sec / 60)}′${String(sec % 60).padStart(2, '0')}″` : `${sec / 60} min`) : `${sec}″`;

/* ---------- Testo ---------- */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Vibrazione ---------- */
export const vibra = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

/* ---------- Avvisi brevi ---------- */
export function toast(msg, tipo = '') {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = 'show ' + tipo;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', 2800);
}

/* ---------- Finestra di conferma (al posto di confirm(), che in app e WebView non è affidabile) ---------- */
export function chiedi({ titolo, testo = '', ok = 'Conferma', annulla = 'Annulla', pericolo = false }) {
  return new Promise(res => {
    const box = document.createElement('div');
    box.className = 'dlg-wrap';
    box.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">
      <h3 id="dlg-t">${esc(titolo)}</h3>${testo ? `<p>${testo}</p>` : ''}
      <div class="dlg-btns"><button class="btn" data-r="0">${esc(annulla)}</button>
      <button class="btn ${pericolo ? 'danger' : 'primary'}" data-r="1">${esc(ok)}</button></div></div>`;
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add('show'));
    const chiudi = v => { box.classList.remove('show'); setTimeout(() => box.remove(), 200); res(v); };
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if (b) chiudi(b.dataset.r === '1'); else if (e.target === box) chiudi(false);
    });
    box.querySelector('[data-r="1"]').focus();
  });
}

/* ---------- Scarica un file (backup, CSV) ---------- */
export function scaricaFile(nome, contenuto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenuto], { type: tipo }));
  a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

/* ---------- CSV (separatore ; o , , campi tra virgolette) ---------- */
export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split('\n')[0], sep = first.split(';').length > first.split(',').length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
