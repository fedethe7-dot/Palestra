/* ============ IMPOSTAZIONI ============
   Profilo, aspetto (4 stili, chiaro/scuro, colori, testo, animazioni, schermata Oggi),
   allenamento e cambio scheda, timer e suoni, attrezzatura, foglio Google, dati e backup. */
import { S, save, cfg, attrezzatura, migra, carica, KEY, VERSIONE, BETA, SEZIONI_HOME, ATTIVITA, FASI, ATTREZZATURA_DEFAULT, statoProgramma } from '../dati.js';
import { esc, fmt, num, toast, chiedi, todayISO, scaricaFile, fmtDateLong, clamp, uid, parseCSV, normDate } from '../util.js';
import { testata, ico, app, segmenti, interruttore } from '../ui.js';
import { applicaTema, STILI, ACCENTI } from '../tema.js';
import { testSync, syncNow, scaricaDalFoglio } from '../sync.js';
import { dischiBilanciere } from '../coach.js';
import { chiediNotifiche, beep, sbloccaAudio } from '../timer.js';
import { libDi } from '../libreria.js';

const VOCI = [
  ['profilo', 'Profilo e obiettivi', 'utente', () => `${cfg().name || 'Nome'} · ${(FASI.find(f => f[0] === cfg().fase) || FASI[2])[1]}`],
  ['aspetto', 'Aspetto', 'pennello', () => `${STILI.find(s => s[0] === cfg().stile)?.[1]} · ${{ auto: 'automatico', chiaro: 'chiaro', scuro: 'scuro' }[cfg().modo]}`],
  ['allenamento', 'Allenamento e schede', 'manubrio', () => `Cambio scheda ogni ${cfg().programmaSettimane} settimane`],
  ['timer', 'Timer e suoni', 'timer', () => `${cfg().recuperoAuto ? 'Recupero automatico' : 'Recupero manuale'} · ${cfg().suono ? 'suono' : 'muto'}`],
  ['attrezzatura', 'Attrezzatura e dischi', 'dischi', () => `Bilanciere ${fmt(num(attrezzatura().bilanciere), 1)} kg · ${attrezzatura().dischi.length} tipi di disco`],
  ['foglio', 'Foglio Google', 'nuvola', () => cfg().syncUrl ? (cfg().syncError ? 'Errore di collegamento' : 'Collegato') : 'Non collegato'],
  ['dati', 'Dati e backup', 'salva', () => `${S.db.workouts.length} allenamenti · ${(S.db.ricette || []).length} ricette`],
];

function menu() {
  return `${testata('Impostazioni', '', { back: 'oggi', destra: '' })}
    <div class="card lista menu-imp">${VOCI.map(([k, t, i, sub]) => `<button class="voce" data-action="go" data-view="impostazioni" data-p="${k}">
      <span class="v-ico">${ico(i, 20)}</span><span class="v-t"><b>${t}</b><small>${esc(sub())}</small></span>${ico('avanti', 18)}</button>`).join('')}</div>
    <p class="muted small centro">Palestra ${VERSIONE}${BETA ? ' · versione di prova' : ''}<br>Foto degli esercizi: free-exercise-db (pubblico dominio)</p>`;
}

function profilo() {
  const s = cfg();
  return `<div class="card form">
    <label class="campo"><span>Nome</span><input data-setting="name" value="${esc(s.name)}" placeholder="Come ti chiami?"></label>
    <div class="due"><label class="campo"><span>Altezza (cm)</span><input type="number" inputmode="numeric" data-setting="altezza" value="${esc(s.altezza)}" placeholder="178"></label>
      <label class="campo"><span>Età</span><input type="number" inputmode="numeric" data-setting="eta" value="${esc(s.eta)}" placeholder="anni"></label>
      <label class="campo"><span>Peso obiettivo (kg)</span><input type="number" inputmode="decimal" data-setting="goal" value="${esc(s.goal)}"></label>
      <label class="campo"><span>% grasso obiettivo</span><input type="number" inputmode="decimal" data-setting="grassoObj" value="${esc(s.grassoObj)}" placeholder="es. 12"></label></div>
    <label class="campo"><span>Livello di attività</span><select data-setting="attivita">${ATTIVITA.map(([v, l, d]) => `<option value="${v}" ${String(s.attivita) === v ? 'selected' : ''}>${l} – ${d}</option>`).join('')}</select></label>
    <span class="campo-lab">Fase</span>${segmenti(FASI.map(([v, l]) => [v, l]), s.fase, 'imp-fase')}
    <p class="muted small">Con altezza ed età calcolo metabolismo, calorie e macro del giorno (Progressi → Corpo e Cucina).</p></div>`;
}

function aspetto() {
  const s = cfg(), home = s.home;
  return `<section class="card"><h3>Stile</h3><div class="stili">${STILI.map(([k, l, d]) => `<button class="stile-card ${s.stile === k ? 'on' : ''}" data-action="imp-stile" data-v="${k}" aria-pressed="${s.stile === k}">
      <span class="anteprima ap-${k}"><i></i><i></i><i></i></span><b>${l}</b><small>${d}</small></button>`).join('')}</div></section>
    <section class="card"><h3>Chiaro o scuro</h3>${segmenti([['auto', 'Automatico'], ['chiaro', 'Chiaro'], ['scuro', 'Scuro']], s.modo, 'imp-modo')}
      <p class="muted small">Automatico segue l'impostazione del telefono.</p></section>
    <section class="card"><h3>Colore principale</h3><div class="swatch-row"><button class="swatch auto ${!s.accento ? 'on' : ''}" data-action="imp-accento" data-v="" aria-label="Colore dello stile">A</button>
      ${ACCENTI.map(([k, c, l]) => `<button class="swatch ${s.accento === k ? 'on' : ''}" style="--sw:${c}" data-action="imp-accento" data-v="${k}" aria-label="${l}" title="${l}"></button>`).join('')}</div></section>
    <section class="card"><div class="row"><h3>Dimensione del testo</h3><b>${Math.round(s.testo * 100)}%</b></div>
      <input type="range" min="0.9" max="1.25" step="0.05" value="${s.testo}" id="imp-testo" aria-label="Dimensione del testo">
      <div class="row muted small"><span>Più piccolo</span><span>Più grande</span></div></section>
    <section class="card"><h3>Carattere</h3>${segmenti([['stile', 'Dello stile'], ['sistema', 'Del telefono'], ['leggibile', 'Più leggibile']], s.carattere || 'stile', 'imp-carattere')}
      <p class="muted small">"Più leggibile" usa lettere più larghe e numeri più chiari, utile durante l'allenamento.</p></section>
    <section class="card"><h3>Animazioni e transizioni</h3>${segmenti([['normali', 'Normali'], ['ridotte', 'Ridotte'], ['nessuna', 'Nessuna']], s.animazioni, 'imp-anim')}</section>
    <section class="card"><h3>Schermata Oggi</h3><p class="muted small">Scegli cosa vedere e in che ordine.</p>
      <div class="ordina">${home.map((x, i) => { const l = SEZIONI_HOME.find(([k]) => k === x.k)?.[1] || x.k;
        return `<div class="ord-riga"><label class="riga-sw"><span><b>${l}</b></span><input type="checkbox" class="sw" data-home="${x.k}" ${x.on ? 'checked' : ''}><i aria-hidden="true"></i></label>
          <button class="icon-btn small" data-action="home-su" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">${ico('su', 16)}</button>
          <button class="icon-btn small" data-action="home-giu" data-i="${i}" ${i === home.length - 1 ? 'disabled' : ''} aria-label="Sposta giù">${ico('giu', 16)}</button></div>`; }).join('')}</div></section>`;
}

function allenamento() {
  const s = cfg(), p = statoProgramma();
  return `<section class="card form"><h3>Cambio scheda</h3>
    <div class="due"><label class="campo"><span>Inizio programma</span><input type="date" data-setting="programmaInizio" value="${esc(s.programmaInizio)}"></label>
      <label class="campo"><span>Durata (settimane)</span><input type="number" inputmode="numeric" min="3" max="24" data-setting-num="programmaSettimane" value="${esc(s.programmaSettimane)}"></label></div>
    <p class="muted small">Cambio consigliato dal <b>${fmtDateLong(p.fine)}</b>. Una o due settimane prima la schermata Oggi ti mostra la proposta di nuove sessioni.</p>
    <button class="btn full" data-action="go" data-view="nuova-scheda">${ico('ripeti', 18)} Vedi subito la proposta</button>
    ${(S.db.programmi || []).length ? `<p class="muted small">Schede archiviate: ${S.db.programmi.map(x => `${fmtDateLong(x.inizio)} → ${fmtDateLong(x.fine)}`).join(' · ')}</p>` : ''}</section>
    <section class="card form"><h3>Obiettivi</h3>
    <div class="due"><label class="campo"><span>Allenamenti a settimana</span><input type="number" inputmode="numeric" min="1" max="7" data-setting-num="giorniSettimana" value="${esc(s.giorniSettimana)}"></label>
      <label class="campo"><span>Serie per muscolo a settimana</span><input type="number" inputmode="numeric" min="3" max="25" data-setting-num="obiettivoSerie" value="${esc(s.obiettivoSerie)}"></label></div>
    <p class="muted small">Per crescere servono di solito 8-15 serie a settimana per gruppo muscolare.</p></section>
    <section class="card">${interruttore('recuperoAuto', s.recuperoAuto, 'Recupero automatico', 'Parte da solo quando segni una serie')}</section>
    <button class="btn full" data-action="go" data-view="modifica">${ico('matita', 18)} Modifica sessioni ed esercizi</button>`;
}

function timer() {
  const s = cfg();
  return `<section class="card lista">
    ${interruttore('recuperoAuto', s.recuperoAuto, 'Recupero automatico', 'Parte quando segni una serie')}
    ${interruttore('suono', s.suono, 'Suoni', 'Bip a fine recupero e nel conto alla rovescia')}
    ${interruttore('vibrazione', s.vibrazione, 'Vibrazione')}
    ${interruttore('avviso10', s.avviso10, 'Avviso a 10 secondi', 'Un bip quando il recupero sta per finire')}
    ${interruttore('conto321', s.conto321, 'Conto 3-2-1', 'Prima degli esercizi a tempo (plank)')}
    ${interruttore('schermoAcceso', s.schermoAcceso, 'Schermo sempre acceso', 'Durante l\'allenamento')}
    ${interruttore('notifiche', s.notifiche, 'Notifica a fine recupero', 'Se l\'app è in secondo piano')}</section>
    <button class="btn full" data-action="imp-prova-suono">${ico('suono', 18)} Prova il suono</button>
    <p class="muted small">Con l'app chiusa o lo schermo spento il telefono può ritardare le notifiche: la versione APK le rende precise.</p>`;
}

function attrezzatura_() {
  const a = attrezzatura(), maxB = dischiBilanciere(999).totale;
  return `<section class="card form"><h3>Bilanciere</h3>
    <label class="campo"><span>Peso del bilanciere (kg)</span><input type="number" inputmode="decimal" data-att="bilanciere" value="${esc(a.bilanciere)}"></label>
    <p class="muted small">Con i tuoi dischi arrivi fino a <b>${fmt(maxB, 2)} kg</b> sul bilanciere.</p></section>
    <section class="card"><div class="row"><h3>Dischi</h3><span class="muted small">quantità totale</span></div>
      <div class="dischi-tab"><div class="dt-r dt-h"><span>Kg</span><span>Quanti</span><span>Carrucola</span><span></span></div>
      ${a.dischi.map((d, i) => `<div class="dt-r"><input inputmode="decimal" data-disco="${i}" data-k="kg" value="${esc(d.kg)}" aria-label="Peso disco"><input inputmode="numeric" data-disco="${i}" data-k="qta" value="${esc(d.qta)}" aria-label="Quantità">
        <label class="mini-sw"><input type="checkbox" data-disco="${i}" data-k="carrucola" ${d.carrucola ? 'checked' : ''}><span class="sr-only">Usabile sulla carrucola</span><i aria-hidden="true"></i></label>
        <button class="icon-btn small" data-action="disco-del" data-i="${i}" aria-label="Togli disco">${ico('cestino', 16)}</button></div>`).join('')}</div>
      <div class="row-btns"><button class="btn small" data-action="disco-add">${ico('piu', 16)} Disco</button><button class="btn small ghost" data-action="dischi-reset">Valori del foglio</button></div>
      <p class="muted small">Dal foglio "Pesi": sulla carrucola vanno solo i dischi piccoli (quelli grandi non ci stanno contro il muro).</p></section>
    <section class="card form"><h3>Carrucola e aumenti</h3>
      <label class="campo"><span>Carico massimo carrucola (kg)</span><input type="number" inputmode="decimal" data-att="carrucolaMax" value="${esc(a.carrucolaMax)}"></label>
      <div class="due"><label class="campo"><span>Aumento bilanciere</span><input inputmode="decimal" data-att="passoBilanciere" value="${esc(a.passoBilanciere)}"></label>
        <label class="campo"><span>Aumento manubri</span><input inputmode="decimal" data-att="passoManubri" value="${esc(a.passoManubri)}"></label>
        <label class="campo"><span>Aumento carrucola</span><input inputmode="decimal" data-att="passoCarrucola" value="${esc(a.passoCarrucola)}"></label></div>
      <p class="muted small">Di quanti kg sale il carico quando il coach dice "aumenta" e quando premi + durante l'allenamento.</p></section>`;
}

function foglio() {
  const s = cfg(), nonSync = S.db.workouts.filter(w => !w.synced).length;
  const stato = !s.syncUrl ? 'Non collegato' : s.syncError ? `<span class="giu">Errore: ${esc(s.syncError)}</span>`
    : s.lastSync ? `Ultimo invio: ${new Date(s.lastSync).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'Collegato, nessun invio ancora';
  return `<section class="card form">${BETA ? '<p class="banner-beta">Versione di prova: legge dal foglio ma non scrive.</p>' : ''}
    <label class="campo"><span>Link dello script (finisce con /exec)</span><input data-setting="syncUrl" value="${esc(s.syncUrl)}" placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off"></label>
    <label class="campo"><span>Parola segreta</span><input data-setting="syncToken" value="${esc(s.syncToken)}" placeholder="La stessa scritta nello script" autocomplete="off"></label>
    <p class="small">${stato}<br><span class="muted">In coda: ${S.db.outbox.length} · Allenamenti da inviare: ${nonSync}${s.lastRead ? ` · Ultima lettura: ${new Date(s.lastRead).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}</span></p>
    <div class="row-btns"><button class="btn full" data-action="sync-test">Prova collegamento</button></div>
    <div class="row-btns"><button class="btn primary full" data-action="sync-invia">${ico('carica', 18)} Invia</button><button class="btn full" data-action="sync-leggi">${ico('scarica', 18)} Scarica</button></div>
    <p class="muted small">All'apertura l'app invia da sola quello che è in coda e rilegge il foglio (al massimo ogni 10 minuti).</p></section>`;
}

function dati() {
  return `<section class="card"><p class="muted small">I dati sono salvati su questo telefono. Fai un backup ogni tanto (le foto dei progressi non sono incluse).</p>
    <div class="pila stretta"><button class="btn full" data-action="backup-esporta">${ico('scarica', 18)} Esporta backup</button>
    <button class="btn full" data-action="backup-importa">${ico('carica', 18)} Ripristina backup</button>
    <button class="btn full" data-action="csv-importa">${ico('lista', 18)} Importa allenamenti da CSV</button>
    <button class="btn full" data-action="ric-import">${ico('cucina', 18)} Importa ricette (CSV)</button>
    <button class="btn danger full" data-action="reset-tutto">${ico('cestino', 18)} Cancella tutti i dati</button></div></section>`;
}

export function viewImpostazioni() {
  const p = S.param, voce = VOCI.find(v => v[0] === p);
  if (!voce) return menu();
  const corpi = { profilo, aspetto, allenamento, timer, attrezzatura: attrezzatura_, foglio, dati };
  return `${testata(voce[1], 'Impostazioni', { back: 'impostazioni', destra: '' })}<div class="pila">${corpi[p]()}</div>`;
}

/* ---------- Importa allenamenti da CSV (stesso formato del foglio) ---------- */
function importCSV(text) {
  const rows = parseCSV(text);
  const h = rows.findIndex(r => r.some(c => c.trim().toLowerCase() === 'esercizio'));
  if (h < 0) return toast('Non trovo la colonna "Esercizio"');
  const hd = rows[h].map(c => c.trim().toLowerCase());
  const iD = hd.indexOf('data'), iS = hd.indexOf('sessione'), iE = hd.indexOf('esercizio');
  const iR = [1, 2, 3, 4, 5].map(n => hd.findIndex(x => new RegExp('^rip\\.?\\s*' + n + '$').test(x)));
  const iK = [1, 2, 3, 4, 5].map(n => hd.findIndex(x => new RegExp('^(kg|peso)\\s*' + n).test(x)));
  const groups = {};
  rows.slice(h + 1).forEach(r => {
    const date = normDate(r[iD]), nome = (r[iE] || '').trim(); if (!date || !nome) return;
    const e = libDi(nome) || Object.values(S.db.schede).flatMap(s => s.esercizi).find(x => x.nome.toLowerCase() === nome.toLowerCase()) || { gruppo: 'Altro', tipo: 'carico' };
    const ses = ((iS >= 0 ? r[iS] : '') || '').trim().toUpperCase() || Object.entries(S.db.schede).find(([, s]) => s.esercizi.some(x => x.nome.toLowerCase() === nome.toLowerCase()))?.[0] || 'A';
    const sets = iR.map((c, k) => ({ reps: c >= 0 ? num(r[c]) : null, kg: e.tipo === 'carico' && iK[k] >= 0 ? num(r[iK[k]]) : null })).filter(s => s.reps);
    if (!sets.length) return;
    (groups[date + '|' + ses] ||= { id: uid(), date, session: ses, exercises: [], note: '', synced: true }).exercises.push({ nome, gruppo: e.gruppo, tipo: e.tipo, sets });
  });
  const exist = new Set(S.db.workouts.map(w => w.date + '|' + w.session));
  const nuovi = Object.entries(groups).filter(([k]) => !exist.has(k)).map(([, w]) => w);
  S.db.workouts.push(...nuovi); save(); app.render(); toast(`Importati ${nuovi.length} allenamenti`);
}
async function importJSON(text) {
  try {
    const d = JSON.parse(text); if (!d.workouts) throw new Error();
    if (!(await chiedi({ titolo: 'Ripristinare il backup?', testo: `Contiene ${d.workouts.length} allenamenti. I dati attuali verranno sostituiti.`, ok: 'Ripristina', pericolo: true }))) return;
    S.db = migra(d); save(); applicaTema(); app.render(); toast('Backup ripristinato');
  } catch (e) { toast('File di backup non valido'); }
}
export const importatori = { json: importJSON, csv: importCSV };

/* ---------- Azioni ---------- */
const ridisegna = () => { save(); applicaTema(); app.render(); };
export const azioni = {
  'imp-stile': el => { cfg().stile = el.dataset.v; ridisegna(); },
  'imp-modo': el => { cfg().modo = el.dataset.v; ridisegna(); },
  'imp-accento': el => { cfg().accento = el.dataset.v; ridisegna(); },
  'imp-anim': el => { cfg().animazioni = el.dataset.v; ridisegna(); },
  'imp-carattere': el => { cfg().carattere = el.dataset.v; ridisegna(); },
  'imp-fase': el => { cfg().fase = el.dataset.v; save(); app.render(); },
  'home-su': el => { const i = +el.dataset.i, h = cfg().home; if (i > 0) { [h[i - 1], h[i]] = [h[i], h[i - 1]]; save(); app.render(); } },
  'home-giu': el => { const i = +el.dataset.i, h = cfg().home; if (i < h.length - 1) { [h[i + 1], h[i]] = [h[i], h[i + 1]]; save(); app.render(); } },
  'imp-prova-suono': () => { sbloccaAudio(); const s = cfg().suono; cfg().suono = true; beep(880, 0.15, 2); cfg().suono = s; },
  'disco-add': () => { attrezzatura().dischi.push({ kg: 1, qta: 2, carrucola: true }); save(); app.render(); },
  'disco-del': el => { attrezzatura().dischi.splice(+el.dataset.i, 1); save(); app.render(); },
  'dischi-reset': async () => { if (await chiedi({ titolo: 'Ripristinare i dischi del foglio?', ok: 'Ripristina' })) { attrezzatura().dischi = JSON.parse(JSON.stringify(ATTREZZATURA_DEFAULT.dischi)); save(); app.render(); } },
  'sync-test': () => testSync(), 'sync-invia': () => syncNow(), 'sync-leggi': () => scaricaDalFoglio(),
  'backup-esporta': () => scaricaFile(`palestra-backup-${todayISO()}.json`, JSON.stringify(S.db, null, 2), 'application/json'),
  'backup-importa': () => app.pickFile('json'),
  'csv-importa': () => app.pickFile('csv'),
  'reset-tutto': async () => {
    if (await chiedi({ titolo: 'Cancellare TUTTI i dati?', testo: 'Fai prima un backup. Non si può annullare.', ok: 'Cancella tutto', pericolo: true })
      && await chiedi({ titolo: 'Sei proprio sicuro?', testo: 'Allenamenti, pesate, ricette e impostazioni verranno eliminati da questo telefono.', ok: 'Sì, cancella', pericolo: true })) {
      localStorage.removeItem(KEY); S.db = carica(); ridisegna(); toast('Dati cancellati');
    }
  },
};
export function input(t) {
  if (t.dataset.setting) { cfg()[t.dataset.setting] = t.value; save(); return true; }
  if (t.dataset.settingNum) { const v = num(t.value); if (v != null) { cfg()[t.dataset.settingNum] = v; save(); } return true; }
  if (t.id === 'imp-testo') { cfg().testo = +t.value; save(); applicaTema(); const b = t.closest('.card')?.querySelector('.row b'); if (b) b.textContent = Math.round(t.value * 100) + '%'; return true; }
  if (t.dataset.att) { const v = num(t.value); if (v != null) { attrezzatura()[t.dataset.att] = v; save(); } return true; }
  if (t.dataset.disco != null && t.type !== 'checkbox') { const v = num(t.value); if (v != null) { attrezzatura().dischi[+t.dataset.disco][t.dataset.k] = v; save(); } return true; }
  return false;
}
export async function change(t) {
  if (t.dataset.settingBool) {
    const k = t.dataset.settingBool;
    if (k === 'notifiche' && t.checked && !(await chiediNotifiche())) { t.checked = false; return true; }
    cfg()[k] = t.checked; save(); return true;
  }
  if (t.dataset.home) { const x = cfg().home.find(h => h.k === t.dataset.home); if (x) { x.on = t.checked; save(); } return true; }
  if (t.dataset.disco != null && t.type === 'checkbox') { attrezzatura().dischi[+t.dataset.disco].carrucola = t.checked; save(); return true; }
  if (t.dataset.att || t.dataset.disco != null || t.dataset.settingNum || t.dataset.setting === 'programmaInizio' || t.dataset.setting === 'attivita') { app.render(); return true; }
  return false;
}
