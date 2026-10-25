'use strict';
/* ============ ESERCIZI ILLUSTRATI ============
   Per ogni esercizio della libreria: foto inizio/fine (archivio pubblico dominio "free-exercise-db",
   in img/es/), muscoli principali e secondari per la mappa, 3 punti chiave di tecnica. */
const VISUAL = {
  'Panca Piana': ['panca-piana', ['petto'], ['spalle_ant', 'tricipiti'], ['Scapole strette', 'Gomiti a 45-60°', 'Sfiora il petto, niente rimbalzo']],
  'Distensioni Manubri': ['distensioni-manubri', ['petto'], ['spalle_ant', 'tricipiti'], ['Scapole strette', "Scendi fino all'allungamento", 'Avvicina i manubri in alto']],
  'Croci su Panca': ['croci-su-panca', ['petto'], ['spalle_ant'], ['Gomiti fissi e morbidi', 'Apri ad arco', 'Chiudi come un abbraccio']],
  'Croci al Cavo': ['croci-al-cavo', ['petto'], ['spalle_ant'], ['Busto fermo', "Mano verso l'ombelico", 'Ritorno controllato']],
  'Piegamenti': ['piegamenti', ['petto'], ['tricipiti', 'spalle_ant', 'addome'], ['Corpo dritto', 'Petto vicino a terra', 'Addome e glutei contratti']],
  'Piegamenti Piedi Rialzati': ['piegamenti-piedi-rialzati', ['petto'], ['spalle_ant', 'tricipiti'], ['Piedi sulla panca', 'Bacino in linea', 'Collo neutro']],
  'Rematore Bilanciere': ['rematore-bilanciere', ['dorsali'], ['trapezio', 'spalle_post', 'bicipiti', 'lombari'], ['Busto a 45°, schiena neutra', "Tira verso l'ombelico", 'Stringi le scapole']],
  'Rematore manubrio': ['rematore-manubrio', ['dorsali'], ['spalle_post', 'bicipiti'], ['Schiena piatta', "Tira verso l'anca", 'Busto fermo']],
  'Lat Machine Cavo': ['lat-machine-cavo', ['dorsali'], ['bicipiti'], ['"Gomiti in tasca"', 'Petto in fuori', 'Risali lento']],
  'Lat Machine un Braccio': ['lat-machine-un-braccio', ['dorsali'], ['bicipiti'], ['Gomito verso il fianco', 'Busto fermo', 'Allunga bene in alto']],
  'Pullover Cavo': ['pullover-cavo', ['dorsali'], ['tricipiti'], ['Braccia quasi tese', 'Arco verso le cosce', 'Gomiti fermi']],
  'Pullover': ['pullover', ['dorsali'], ['petto', 'tricipiti'], ['Gomiti morbidi', 'Arco dietro la testa', 'Schiena ferma']],
  'Trazioni': ['trazioni', ['dorsali'], ['bicipiti'], ['Scapole attive', 'Petto alla sbarra', 'Discesa completa']],
  'Military Press': ['military-press', ['spalle_ant', 'spalle_lat'], ['tricipiti', 'trapezio'], ['Glutei e addome contratti', 'Spingi in verticale', 'Niente arco lombare']],
  'Shoulder Press Manubri': ['shoulder-press-manubri', ['spalle_ant', 'spalle_lat'], ['tricipiti'], ['Manubri alle orecchie', 'Spingi senza toccarli', 'Scendi al mento']],
  'Alzate Laterali': ['alzate-laterali', ['spalle_lat'], ['trapezio'], ['Gomiti morbidi', "Fino all'altezza spalle", 'Scendi in 3 secondi']],
  'Alzate Laterali Elastico': ['alzate-laterali-elastico', ['spalle_lat'], [], ["Pesta l'elastico", 'Fino alla spalla', 'Resisti al ritorno']],
  'Face Pull Cavo': ['face-pull-cavo', ['spalle_post'], ['trapezio'], ['Gomiti alti', 'Mani alle orecchie', 'Stringi le scapole']],
  'Alzate Posteriori': ['alzate-posteriori', ['spalle_post'], ['trapezio'], ['Busto quasi orizzontale', 'Apri di lato', 'Niente slancio']],
  'Curl Manubri': ['curl-manubri', ['bicipiti'], ['avambracci'], ['Gomiti fermi ai fianchi', 'Stringi in alto', 'Scendi in 2-3 secondi']],
  'Curl Bilanciere': ['curl-bilanciere', ['bicipiti'], ['avambracci'], ['Gomiti fermi', 'Polsi dritti', 'Niente slancio']],
  'Hammer Curl': ['hammer-curl', ['bicipiti', 'avambracci'], [], ['Palmi verso le cosce', 'Polsi fermi', 'Scendi lento']],
  'Curl Concentrato': ['curl-concentrato', ['bicipiti'], [], ['Gomito sulla coscia', 'Contrai in alto', 'Busto fermo']],
  'Pushdown Corda': ['pushdown-corda', ['tricipiti'], [], ['Gomiti incollati ai fianchi', 'Apri la corda in fondo', 'Risali a 90°']],
  'Estensioni sopra la Testa al Cavo': ['estensioni-sopra-la-testa-al-cavo', ['tricipiti'], [], ['Gomiti stretti', 'Stendi avanti e in alto', "Senti l'allungamento"]],
  'French Press Manubrio': ['french-press-manubrio', ['tricipiti'], [], ["Gomiti verso l'alto", 'Scendi dietro la nuca', 'Schiena dritta']],
  'Estensioni Tricipiti': ['estensioni-tricipiti', ['tricipiti'], [], ['Gomiti fermi', 'Stendi del tutto', 'Ritorno lento']],
  'Panca Presa Stretta': ['panca-presa-stretta', ['tricipiti'], ['petto', 'spalle_ant'], ['Mani larghe come le spalle', 'Gomiti vicini al corpo', 'Spingi coi tricipiti']],
  'Plank': ['plank', ['addome'], ['obliqui', 'spalle_ant', 'glutei'], ['Corpo in linea', 'Addome e glutei contratti', 'Respira normalmente']],
  'Plank Laterale': ['plank-laterale', ['obliqui'], ['addome', 'glutei'], ['Gomito sotto la spalla', 'Bacino alto', 'Corpo dritto']],
  'Crunch al Cavo': ['crunch-al-cavo', ['addome'], ['obliqui'], ['Arrotola il busto', 'Anche ferme', "Tira con l'addome"]],
  'Dead Bug': ['dead-bug', ['addome'], ['obliqui'], ['Schiena a terra', 'Braccio e gamba opposti', 'Movimento lento']],
  'Squat': ['squat', ['quadricipiti', 'glutei'], ['femorali', 'lombari', 'addome'], ['Anche indietro', 'Ginocchia aperte', 'Talloni a terra']],
  'Affondi Manubri': ['affondi-manubri', ['quadricipiti', 'glutei'], ['femorali'], ['Passo lungo', 'Ginocchio sfiora terra', 'Busto dritto']],
};
/* Per gli esercizi aggiunti a mano: muscoli dal gruppo */
const MUSCOLI_GRUPPO = { 'Petto': ['petto'], 'Schiena': ['dorsali'], 'Spalle': ['spalle_lat', 'spalle_ant'], 'Spalle post.': ['spalle_post'],
  'Bicipiti': ['bicipiti'], 'Tricipiti': ['tricipiti'], 'Core': ['addome'], 'Gambe': ['quadricipiti', 'glutei'] };

/* Le foto stanno nella cartella principale img/es/ (la copia di prova le prende da lì) */
const IMG_ES = (/\/beta\/?/.test(location.pathname) ? '../' : '') + 'img/es/';
function visualDi(nome, gruppo) {
  const k = Object.keys(VISUAL).find(x => x.toLowerCase() === String(nome || '').toLowerCase());
  if (k) { const [slug, pri, sec, chiavi] = VISUAL[k]; return { slug, pri, sec, chiavi }; }
  const pri = MUSCOLI_GRUPPO[gruppo];
  return pri ? { slug: null, pri, sec: [], chiavi: [] } : null;
}

/* Mappa muscoli: sagoma stilizzata davanti e dietro. Le forme sono disegnate solo sul lato sinistro
   e specchiate, così la figura resta simmetrica. */
function mappaMuscoli(pri, sec, cls = '') {
  const st = id => pri.includes(id) ? 'm p' : sec.includes(id) ? 'm s' : 'm';
  // La spalla compare in entrambe le viste: davanti conta il deltoide anteriore/laterale, dietro quello posteriore/laterale
  const spalla = ids => ids.some(i => pri.includes(i)) ? 'm p' : ids.some(i => sec.includes(i)) ? 'm s' : 'm';
  const spF = spalla(['spalle_ant', 'spalle_lat']), spB = spalla(['spalle_post', 'spalle_lat']);
  const base = `<circle class="b" cx="50" cy="15" r="9"/><rect class="b" x="45" y="22" width="10" height="8" rx="3"/>
    <path class="b" d="M36 86 H64 L62 97 H38 Z"/>`;
  const lato = (front) => front ? `
      <ellipse class="${spF}" cx="31" cy="38" rx="7" ry="8"/>
      <path class="${st('petto')}" d="M37 32 Q49 31 49.5 35 V51 Q41 55 36 50 Q33 41 37 32 Z"/>
      <ellipse class="${st('bicipiti')}" cx="27" cy="57" rx="5" ry="10"/>
      <ellipse class="${st('avambracci')}" cx="24" cy="80" rx="4.3" ry="12"/>
      <circle class="b" cx="22" cy="95" r="3.4"/>
      <path class="${st('obliqui')}" d="M35.5 54 L41 56 V84 L37 86 Q34 70 35.5 54 Z"/>
      <path class="${st('quadricipiti')}" d="M38 98 Q48 97 49 101 L47 136 Q41 139 37 135 Q34 114 38 98 Z"/>
      <ellipse class="${st('polpacci')}" cx="41.5" cy="158" rx="5" ry="15"/>
      <ellipse class="b" cx="41.5" cy="180" rx="5" ry="3"/>` : `
      <ellipse class="${spB}" cx="31" cy="38" rx="7" ry="8"/>
      <path class="${st('dorsali')}" d="M36 42 Q43 44 49.5 56 V74 Q39 71 35 57 Q34 48 36 42 Z"/>
      <ellipse class="${st('tricipiti')}" cx="27" cy="57" rx="5" ry="10"/>
      <ellipse class="${st('avambracci')}" cx="24" cy="80" rx="4.3" ry="12"/>
      <circle class="b" cx="22" cy="95" r="3.4"/>
      <ellipse class="${st('glutei')}" cx="43" cy="103" rx="7" ry="8"/>
      <path class="${st('femorali')}" d="M37 112 Q48 111 49 114 L47 137 Q41 140 37 136 Q35 124 37 112 Z"/>
      <ellipse class="${st('polpacci')}" cx="41.5" cy="157" rx="6" ry="14"/>
      <ellipse class="b" cx="41.5" cy="180" rx="5" ry="3"/>`;
  const vista = (front, dx, titolo) => `<g transform="translate(${dx},0)">${base}
      ${front ? `<path class="${st('trapezio')}" d="M42 30 Q50 27 58 30 L56 33 H44 Z"/><rect class="${st('addome')}" x="42" y="55" width="16" height="30" rx="5"/>
        <path class="sep" d="M42.5 65 H57.5 M42.5 75 H57.5 M50 56 V84"/>`
      : `<path class="${st('trapezio')}" d="M40 30 Q50 26 60 30 L56 46 L50 53 L44 46 Z"/><rect class="${st('lombari')}" x="44" y="64" width="12" height="21" rx="4"/>`}
      ${lato(front)}<g transform="translate(100,0) scale(-1,1)">${lato(front)}</g>
      <text x="50" y="198" text-anchor="middle">${titolo}</text></g>`;
  return `<svg class="mmap ${cls}" viewBox="0 0 200 204" aria-label="Muscoli coinvolti">${vista(true, 0, 'Davanti')}${vista(false, 100, 'Dietro')}</svg>`;
}

const NOMI_MUSCOLI = { petto: 'Petto', spalle_ant: 'Spalle (davanti)', spalle_lat: 'Spalle (lato)', spalle_post: 'Spalle (dietro)', trapezio: 'Trapezio',
  bicipiti: 'Bicipiti', avambracci: 'Avambracci', tricipiti: 'Tricipiti', dorsali: 'Dorsali', lombari: 'Lombari', addome: 'Addome', obliqui: 'Obliqui',
  glutei: 'Glutei', quadricipiti: 'Quadricipiti', femorali: 'Femorali', polpacci: 'Polpacci' };

/* Blocco completo: foto inizio/fine in dissolvenza + mappa muscoli + punti chiave */
function visualBlock(nome, gruppo, opts = {}) {
  const v = visualDi(nome, gruppo);
  if (!v) return '';
  const foto = v.slug ? `<div class="vfoto" data-action="vfoto" title="Tocca per fermare">
      <img src="${IMG_ES}${v.slug}-0.webp" alt="${esc(nome)}: posizione iniziale" loading="lazy">
      <img src="${IMG_ES}${v.slug}-1.webp" alt="${esc(nome)}: posizione finale" loading="lazy" class="fine">
      <span class="vtag">Inizio ➜ Fine</span></div>` : '';
  const chiavi = v.chiavi.length && !opts.noChiavi ? `<div class="chiavi">${v.chiavi.map(c => `<span>✓ ${esc(c)}</span>`).join('')}</div>` : '';
  return `${foto ? `<div class="visual">${foto}</div>` : ''}${chiavi}`;
}

/* Mappa muscoli grande con l'elenco dei muscoli (popup ℹ️ e libreria) */
function mappaGrande(nome, gruppo) {
  const v = visualDi(nome, gruppo); if (!v) return '';
  const lista = (ids, cls) => ids.map(i => `<span class="mtag ${cls}">${NOMI_MUSCOLI[i] || i}</span>`).join('');
  return `<div class="mbig">${mappaMuscoli(v.pri, v.sec)}</div>
    <div class="mtags">${lista(v.pri, 'p')}${lista(v.sec, 's')}</div>
    <div class="mleg"><span><i class="p"></i>Principali</span>${v.sec.length ? '<span><i class="s"></i>Secondari</span>' : ''}</div>`;
}

/* Popup ℹ️: muscoli, come si fa, errori da evitare */
let infoNome = null;
function popupInfo() {
  if (!infoNome) return '';
  const x = libDi(infoNome), e = db.draft?.exercises.find(y => y.nome === infoNome);
  const gruppo = x?.gruppo || e?.gruppo;
  return `<div class="sheet-bg" data-action="info-close"></div><div class="sheet info-sheet" role="dialog" aria-label="${esc(infoNome)}">
    <div class="row"><h3 style="margin:0">ℹ️ ${esc(infoNome)}</h3><button class="icon-btn" data-action="info-close" aria-label="Chiudi">✕</button></div>
    <div class="lib-sec">💪 Muscoli coinvolti</div>${mappaGrande(infoNome, gruppo) || '<div class="muted">Nessuna mappa per questo esercizio</div>'}
    ${x ? `<div class="lib-sec">✅ Come si fa</div><ol class="info-list">${x.esecuzione.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
      <div class="lib-sec">⚠️ Errori da evitare</div><ul class="info-list">${x.errori.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <button class="btn primary full" data-action="info-close" style="margin-top:14px">Ho capito 👍</button></div>`;
}
