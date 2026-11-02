/* ===================== PALESTRA BACKUP =====================
   Script a parte (non tocca "Palestra Sync"): l'app ci manda una volta a settimana
   la copia completa dei suoi dati e lui la salva nel foglio "Allenamenti":
   - scheda "Backup app": la copia completa (serve per ripristinare)
   - scheda "RIR serie": ogni serie con kg, ripetizioni e RIR, leggibile a occhio
   ============================================================ */

const ID_FOGLIO = '19wxOVkw29kMoYYylNpzq83qnC00sfOn-8WGMNFQSLt8';
const PAROLA_SEGRETA = 'SCRIVI_QUI_LA_TUA_PAROLA_SEGRETA'; // la stessa che usi nell'app
const PEZZO = 45000; // una cella tiene al massimo 50.000 caratteri

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== PAROLA_SEGRETA) return risposta({ ok: false, error: 'Parola segreta sbagliata' });
    if (d.type === 'ping') return risposta({ ok: true, funzioni: ['backup'] });
    if (d.type === 'backup') { salvaBackup(d.dati, d.quando); return risposta({ ok: true, backup: true }); }
    return risposta({ ok: false, error: 'Richiesta sconosciuta' });
  } catch (err) { return risposta({ ok: false, error: String(err) }); }
}

function doGet(e) {
  const p = e.parameter || {};
  if (p.token !== PAROLA_SEGRETA) return risposta({ ok: false, error: 'Parola segreta sbagliata' });
  if (p.azione === 'backup') return risposta({ ok: true, ...leggiBackup() });
  return risposta({ ok: true, funzioni: ['backup'] });
}

function scheda(nome) {
  const ss = SpreadsheetApp.openById(ID_FOGLIO);
  return ss.getSheetByName(nome) || ss.insertSheet(nome);
}

function salvaBackup(testo, quando) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = scheda('Backup app');
    sh.clear();
    const pezzi = [];
    for (let i = 0; i < testo.length; i += PEZZO) pezzi.push([testo.slice(i, i + PEZZO)]);
    sh.getRange(1, 1, 1, 3).setValues([['Backup dell\'app Palestra: non modificare', quando || new Date().toISOString(), pezzi.length]]);
    if (pezzi.length) sh.getRange(2, 1, pezzi.length, 1).setNumberFormat('@').setValues(pezzi);
    scriviRir(JSON.parse(testo));
  } finally { lock.releaseLock(); }
}

function leggiBackup() {
  const sh = SpreadsheetApp.openById(ID_FOGLIO).getSheetByName('Backup app');
  if (!sh || sh.getLastRow() < 2) return { dati: '', quando: '' };
  const testa = sh.getRange(1, 1, 1, 3).getValues()[0], n = Number(testa[2]) || (sh.getLastRow() - 1);
  const dati = sh.getRange(2, 1, n, 1).getValues().map(r => r[0]).join('');
  return { dati, quando: String(testa[1]) };
}

/* Tabella leggibile con tutte le serie e il RIR */
function scriviRir(db) {
  const righe = [['Data', 'Sessione', 'Esercizio', 'Serie', 'Kg', 'Ripetizioni', 'RIR']];
  (db.workouts || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach(w =>
    (w.exercises || []).forEach(e => (e.sets || []).forEach((s, i) => {
      if (s.warm) return;
      righe.push([w.date, w.session, e.nome, i + 1, s.kg === '' || s.kg == null ? '' : Number(s.kg), s.reps === '' || s.reps == null ? '' : Number(s.reps), s.rir == null ? '' : s.rir]);
    })));
  const sh = scheda('RIR serie');
  sh.clear();
  sh.getRange(1, 1, righe.length, righe[0].length).setValues(righe);
  sh.getRange(1, 1, 1, righe[0].length).setFontWeight('bold');
  sh.setFrozenRows(1);
}

function risposta(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
