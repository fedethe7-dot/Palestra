/* ============ FOTO DEI PROGRESSI ============
   Salvate nel telefono (IndexedDB), ridimensionate a 1080 px per occupare poco spazio. */
import { uid, todayISO } from './util.js';
import { BETA } from './dati.js';

const DB = BETA ? 'palestra-foto-beta' : 'palestra-foto', STORE = 'foto';
function apri() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx(modo, fn) {
  const db = await apri();
  return new Promise((res, rej) => { const t = db.transaction(STORE, modo), s = t.objectStore(STORE); const out = fn(s); t.oncomplete = () => res(out.result ?? out); t.onerror = () => rej(t.error); });
}
export async function fotoTutte() { try { return await tx('readonly', s => s.getAll()); } catch (e) { return []; } }
export async function fotoElimina(id) { urls.delete(id); return tx('readwrite', s => s.delete(id)); }
async function riduci(file, max = 1080) {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
}
export async function fotoSalva(file, date = todayISO()) {
  let blob; try { blob = await riduci(file); } catch (e) { blob = file; }
  return tx('readwrite', s => s.put({ id: uid(), date, blob }));
}
const urls = new Map();
export function fotoUrl(x) { if (!urls.has(x.id)) urls.set(x.id, URL.createObjectURL(x.blob)); return urls.get(x.id); }
