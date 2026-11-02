/* ============ CODICE A BARRE DEI PRODOTTI ============
   Inquadri il codice a barre con la fotocamera (o lo scrivi a mano) e i valori arrivano
   da Open Food Facts, l'archivio gratuito dei prodotti alimentari. I prodotti trovati
   restano salvati nel telefono, così la volta dopo non serve internet. */
import { S, save } from './dati.js';
import { esc, fmt, num, toast } from './util.js';
import { ico, apriFoglio, aggiornaFoglio, foglioAperto } from './ui.js';

let alFine = null, prodotto = null, grammi = 100, stato = '', stream = null, cercando = false;
const ID = 'codice';
const puoScansionare = () => 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

export function foglioCodice(callback, testo = 'Aggiungi') {
  alFine = { callback, testo }; prodotto = null; stato = ''; grammi = 100;
  apriFoglio(corpo(), { titolo: 'Codice a barre', id: ID, cls: 'alto', onClose: fermaCamera });
}

function corpo() {
  if (prodotto) return schedaProdotto();
  const recenti = Object.values(S.db.prodotti || {}).sort((a, b) => (b.usato || 0) - (a.usato || 0)).slice(0, 8);
  return `${puoScansionare() ? `<div class="cb-video" id="cb-video-box">
        ${stream ? '<video id="cb-video" playsinline muted></video><i class="cb-mirino"></i>' : `<button class="btn primary big full" data-action="cb-camera">${ico('codice', 20)} Inquadra il codice a barre</button>`}</div>`
      : '<p class="muted small">Su questo telefono la lettura con la fotocamera non è disponibile: scrivi i numeri sotto il codice a barre.</p>'}
    <div class="form"><label class="campo"><span>Numeri del codice a barre</span><input id="cb-codice" inputmode="numeric" autocomplete="off" placeholder="es. 8001234567890"></label>
      <button class="btn full" data-action="cb-cerca">${ico('cerca', 18)} Cerca il prodotto</button></div>
    ${stato ? `<p class="small cb-stato">${stato}</p>` : ''}
    ${recenti.length ? `<h4>Usati di recente</h4>${recenti.map(p => `<button class="ric-riga" data-action="cb-recente" data-c="${esc(p.codice)}"><span><b>${esc(p.nome)}</b><small>${fmt(p.kcal)} kcal · ${fmt(p.p, 1)} g prot. per 100 g</small></span>${ico('piu', 18)}</button>`).join('')}` : ''}
    <p class="muted small">Dati da Open Food Facts (openfoodfacts.org), archivio libero scritto dagli utenti: controlla che i valori corrispondano all'etichetta.</p>`;
}

const tot = v => `<div><b>${fmt(v.kcal)}</b><span>kcal</span></div><div><b>${fmt(v.p, 1)}</b><span>proteine</span></div><div><b>${fmt(v.c, 1)}</b><span>carbo</span></div><div><b>${fmt(v.f, 1)}</b><span>grassi</span></div>`;
const valori = () => { const k = grammi / 100; return { kcal: prodotto.kcal * k, p: prodotto.p * k, c: prodotto.c * k, f: prodotto.f * k }; };
function schedaProdotto() {
  const v = valori(), pr = prodotto;
  return `<div class="cb-prod"><b>${esc(pr.nome)}</b><small>${esc([pr.marca, pr.quantita].filter(Boolean).join(' · '))}</small>
      <p class="muted small">Per 100 g: ${fmt(pr.kcal)} kcal · proteine ${fmt(pr.p, 1)} g · carboidrati ${fmt(pr.c, 1)} g · grassi ${fmt(pr.f, 1)} g</p></div>
    <div class="form"><label class="campo"><span>Quanti grammi?</span><input id="cb-grammi" inputmode="decimal" value="${esc(grammi)}"></label>
      <div class="chips">${[...new Set([pr.porzione, 30, 50, 100, 125, 150, 200].filter(Boolean))].slice(0, 6).map(g => `<button class="pill ${g === grammi ? 'on' : ''}" data-action="cb-g" data-g="${g}">${g} g${g === pr.porzione ? ' (porzione)' : ''}</button>`).join('')}</div></div>
    <div class="macro4" id="cb-tot">${tot(v)}</div>
    <button class="btn primary huge full" data-action="cb-ok">${ico('piu', 20)} ${esc(alFine?.testo || 'Aggiungi')}</button>
    <button class="btn ghost full" data-action="cb-altro">Un altro prodotto</button>`;
}

/* Dalla risposta di Open Food Facts ai valori per 100 g */
function daOFF(codice, x) {
  const n = x.nutriments || {}, val = k => num(n[k + '_100g']);
  let kcal = val('energy-kcal'); if (kcal == null && val('energy') != null) kcal = val('energy') / 4.184;
  if (kcal == null) return null;
  const porz = num(x.serving_quantity) || num(String(x.serving_size || '').match(/([\d.,]+)\s*g/i)?.[1]);
  return { codice, nome: (x.product_name_it || x.product_name || 'Prodotto senza nome').trim(), marca: (x.brands || '').split(',')[0].trim(), quantita: x.quantity || '',
    porzione: porz ? Math.round(porz) : null, kcal, p: val('proteins') || 0, c: val('carbohydrates') || 0, f: val('fat') || 0 };
}

export async function cercaCodice(codice) {
  codice = String(codice || '').replace(/\D/g, '');
  if (codice.length < 8) { stato = 'Il codice a barre ha almeno 8 numeri.'; return ridisegna(); }
  if (cercando) return; cercando = true;
  const salvato = S.db.prodotti?.[codice];
  if (salvato) { mostra(salvato); cercando = false; return; }
  stato = 'Cerco il prodotto…'; ridisegna();
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codice}.json?fields=product_name,product_name_it,brands,quantity,serving_size,serving_quantity,nutriments`);
    const j = await r.json();
    const p = j.status === 1 && j.product ? daOFF(codice, j.product) : null;
    if (!p) { stato = j.status === 1 ? 'Prodotto trovato ma senza valori nutrizionali: inseriscilo a mano.' : `Prodotto ${codice} non trovato: inseriscilo a mano con i valori dell'etichetta.`; return ridisegna(); }
    S.db.prodotti = { ...(S.db.prodotti || {}), [codice]: p }; save();
    mostra(p);
  } catch (e) { stato = 'Senza internet non riesco a cercare il prodotto. Riprova quando sei connesso.'; ridisegna(); }
  finally { cercando = false; }
}
function mostra(p) { fermaCamera(); prodotto = p; grammi = p.porzione || 100; stato = ''; ridisegna(); }
function ridisegna() { if (foglioAperto(ID)) { aggiornaFoglio(corpo()); if (stream) collegaVideo(); } }

/* ---------- Fotocamera ---------- */
async function avviaCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    ridisegna();
  } catch (e) { stream = null; stato = 'Non riesco ad aprire la fotocamera: controlla il permesso, oppure scrivi i numeri.'; ridisegna(); }
}
async function collegaVideo() {
  const v = document.getElementById('cb-video'); if (!v || !stream) return;
  v.srcObject = stream; try { await v.play(); } catch (e) {}
  let det; try { det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }); } catch (e) { det = new BarcodeDetector(); }
  const giro = async () => {
    if (!stream || !document.body.contains(v)) return;
    try { const r = await det.detect(v); if (r[0]?.rawValue) { if (navigator.vibrate) navigator.vibrate(60); return cercaCodice(r[0].rawValue); } } catch (e) {}
    setTimeout(giro, 250);
  };
  giro();
}
function fermaCamera() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }

export const azioni = {
  'cb-camera': () => avviaCamera(),
  'cb-cerca': () => cercaCodice(document.getElementById('cb-codice')?.value),
  'cb-recente': el => cercaCodice(el.dataset.c),
  'cb-g': el => { grammi = +el.dataset.g; ridisegna(); },
  'cb-altro': () => { prodotto = null; ridisegna(); },
  'cb-ok': () => {
    if (!prodotto || !(grammi > 0)) return toast('Scrivi i grammi');
    S.db.prodotti[prodotto.codice].usato = Date.now(); save();
    const v = valori(), fine = alFine; fermaCamera();
    fine?.callback({ nome: prodotto.nome, codice: prodotto.codice, g: grammi, ...v });
  },
};
export function input(t) {
  if (t.id === 'cb-grammi') {
    grammi = num(t.value) || 0;
    const v = prodotto ? valori() : null, box = document.getElementById('cb-tot');
    if (v && box) box.innerHTML = tot(v);
    return true;
  }
  return false;
}
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cb-codice') cercaCodice(e.target.value); });
