/* ============ FILE DELL'OROLOGIO ============
   Legge i file esportati dall'app dell'orologio (Zepp / Amazfit):
   - ACTIVITY_….csv  → passi, distanza e kcal di ogni giorno
   - SPORT_….csv     → le sessioni registrate (calcetto, camminate, palestra…)
   Gli altri file (ACTIVITY_MINUTE, ACTIVITY_STAGE, BODY) vengono riconosciuti e saltati.
   Funzioni pure, senza dipendenze: le usa l'app e lo script che ha preparato lo storico cifrato. */

const isoLocale = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const oraLocale = d => { const x = new Date(d); return String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); };
const n = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? 0 : x; };

function tabella(testo) {
  const righe = String(testo || '').replace(/^﻿/, '').split(/\r?\n/).filter(r => r.trim());
  if (!righe.length) return { testa: [], dati: [] };
  const testa = righe[0].split(',').map(t => t.trim());
  return { testa, dati: righe.slice(1).map(r => { const c = r.split(','); const o = {}; testa.forEach((t, i) => { o[t] = (c[i] ?? '').trim(); }); return o; }) };
}

/* Che file è? */
export function tipoFile(testo) {
  const t = String(testo || '').replace(/^﻿/, '').split(/\r?\n/, 1)[0].toLowerCase();
  if (/^date,steps,distance,rundistance,calories/.test(t)) return 'giorni';
  if (/^type,starttime,sporttime/.test(t)) return 'sport';
  if (/^date,time,steps/.test(t)) return 'minuti';
  if (/^date,start,stop,distance/.test(t)) return 'fasi';
  if (/^time,weight,height/.test(t)) return 'peso';
  return null;
}

/* ACTIVITY: { 'AAAA-MM-GG': [passi, metri, kcal] } (i giorni a zero, orologio non indossato, si saltano) */
export function leggiGiorni(testo) {
  const out = {};
  tabella(testo).dati.forEach(r => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return;
    const passi = Math.round(n(r.steps)), m = Math.round(n(r.distance)), kcal = Math.round(n(r.calories));
    if (passi > 0 || kcal > 0) out[r.date] = [passi, m, kcal];
  });
  return out;
}

/* SPORT: una riga per sessione. "2026-11-02 19:35:17+0000" → data e ora del telefono */
export function leggiSport(testo) {
  const out = [];
  tabella(testo).dati.forEach(r => {
    const m = String(r.startTime || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})([+-]\d{2}):?(\d{2})$/);
    if (!m) return;
    const quando = new Date(`${m[1]}T${m[2]}${m[3]}:${m[4]}`);
    if (isNaN(quando)) return;
    const sec = Math.round(n(r['sportTime(s)']));
    if (sec < 180) return;                                   // avvii per sbaglio (pochi secondi)
    out.push({ id: quando.toISOString(), data: isoLocale(quando), ora: oraLocale(quando), tipo: String(r.type), sec, m: Math.round(n(r['distance(m)'])), kcal: Math.round(n(r['calories(kcal)'])) });
  });
  return out;
}

/* Unisce dati nuovi a quelli che ci sono già, senza doppioni.
   I giorni già presenti vengono aggiornati (l'ultimo giorno di un'esportazione di solito è a metà). */
export function unisci(attuale, nuovo) {
  const giorni = { ...(attuale?.giorni || {}) }, sport = [...(attuale?.sport || [])];
  let giorniNuovi = 0, giorniAgg = 0, sportNuovi = 0;
  Object.entries(nuovo?.giorni || {}).forEach(([d, v]) => {
    if (!giorni[d]) giorniNuovi++;
    else if (giorni[d].join() !== v.join()) giorniAgg++;
    giorni[d] = v;
  });
  const visti = new Set(sport.map(s => s.id));
  (nuovo?.sport || []).forEach(s => { if (!visti.has(s.id)) { sport.push(s); visti.add(s.id); sportNuovi++; } });
  sport.sort((a, b) => a.id.localeCompare(b.id));
  return { dati: { ...(attuale || {}), giorni, sport }, giorniNuovi, giorniAgg, sportNuovi };
}

/* Legge più file insieme e dice cosa ha trovato */
export function leggiFile(testi) {
  const nuovo = { giorni: {}, sport: [] }, saltati = [], letti = [];
  testi.forEach(({ nome, testo }) => {
    const t = tipoFile(testo);
    if (t === 'giorni') { Object.assign(nuovo.giorni, leggiGiorni(testo)); letti.push(nome); }
    else if (t === 'sport') { nuovo.sport.push(...leggiSport(testo)); letti.push(nome); }
    else saltati.push({ nome, tipo: t });
  });
  return { nuovo, letti, saltati };
}

/* ---------- Storico cifrato (AES-GCM 256, chiave dal codice con PBKDF2-SHA256) ---------- */
const b64 = {
  da: s => Uint8Array.from(atob(s), c => c.charCodeAt(0)),
  a: u => { const b = new Uint8Array(u); let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(s); },
};
async function chiave(codice, sale, giri, uso) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(codice).toUpperCase().replace(/[^A-Z0-9]/g, '')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sale, iterations: giri, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, [uso]);
}
export async function decifra(pacco, codice) {
  const k = await chiave(codice, b64.da(pacco.salt), pacco.it, 'decrypt');
  const chiaro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.da(pacco.iv) }, k, b64.da(pacco.ct));
  return JSON.parse(new TextDecoder().decode(chiaro));
}
export async function cifra(oggetto, codice, giri = 310000) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await chiave(codice, salt, giri, 'encrypt');
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(oggetto)));
  return { v: 1, it: giri, salt: b64.a(salt), iv: b64.a(iv), ct: b64.a(ct) };
}
