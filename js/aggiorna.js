/* ============ AGGIORNAMENTI ============
   Il file versione.json sul sito dice qual è l'ultima versione pubblicata.
   Se il telefono ne sta usando una più vecchia, cancello la copia salvata (service worker e cache)
   e ricarico: i dati (allenamenti, schede, pesate…) restano, sono salvati a parte. */
import { S, VERSIONE } from './dati.js';
import { toast } from './util.js';

let inCorso = false;

async function versioneOnline() {
  const r = await fetch(`versione.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return String((await r.json()).versione || '');
}

/* Cancella service worker e cache dell'app, poi riapre la pagina scaricandola di nuovo */
export async function pulisciEricarica() {
  try { for (const r of await (navigator.serviceWorker?.getRegistrations?.() || [])) await r.unregister(); } catch (e) {}
  try { if (window.caches) for (const k of await caches.keys()) if (k.startsWith('palestra-') && k !== 'palestra-extra') await caches.delete(k); } catch (e) {}
  location.replace(location.pathname + '?agg=' + Date.now() + location.hash);
}

/* Controllo silenzioso: all'apertura e quando torni sull'app */
export async function controllaVersione() {
  if (inCorso || !navigator.onLine || location.protocol !== 'https:') return;
  inCorso = true;
  try {
    const online = await versioneOnline();
    if (!online || online === VERSIONE) return;
    // Una sola volta per versione, così non si entra mai in un giro di ricariche
    const chiave = 'palestra-agg-' + online;
    if (sessionStorage.getItem(chiave)) return;
    if (S.db.draft) { toast(`Nuova versione ${online} pronta: si installa a fine allenamento`); return; }
    sessionStorage.setItem(chiave, '1');
    toast(`⬇️ Aggiorno Palestra alla ${online}…`);
    setTimeout(pulisciEricarica, 800);
  } catch (e) { /* offline o sito non raggiungibile: riprovo la prossima volta */ }
  finally { inCorso = false; }
}

/* Pulsante "Controlla aggiornamenti" nelle Impostazioni */
export async function aggiornaOra() {
  if (!navigator.onLine) return toast('Sei offline: collegati a internet e riprova');
  if (S.db.draft) return toast('Finisci o salva prima l\'allenamento in corso');
  toast('Controllo…');
  let online = '';
  try { online = await versioneOnline(); } catch (e) {}
  toast(online && online !== VERSIONE ? `⬇️ Aggiorno alla ${online}…` : `Hai già l'ultima versione (${VERSIONE}). Ricarico comunque l'app…`);
  setTimeout(pulisciEricarica, 900);
}
