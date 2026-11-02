/* =========================================================
   PONTE tra Palestra e Salute (file identico nelle due app)
   Le due app stanno sullo stesso indirizzo (fedethe7-dot.github.io), quindi sul
   telefono condividono la stessa memoria del browser: qui si scambiano le pesate.

   - Una pesata per giorno: { kg, fat (% grasso), muscle (kg muscoli) }
   - Ogni voce ha l'ora dell'ultima modifica (agg) e chi l'ha fatta (da)
   - Le cancellazioni viaggiano anche loro (via: true)
   - Ogni app ricorda cosa aveva l'ultima volta: così capisce cosa hai aggiunto,
     cambiato o cancellato e lo manda all'altra. Vince la modifica più recente.
   - In più: Salute lascia il profilo (altezza, anno di nascita), Palestra il
     riepilogo dell'attività (passi, kcal, allenamenti, fabbisogno).
   Funziona sullo stesso telefono e nello stesso browser.
   ========================================================= */
(function () {
  'use strict';
  var K = 'ponte-peso', K_ATT = 'ponte-attivita', K_PROF = 'ponte-profilo';
  function leggi(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(x) ? null : Math.round(x * 100) / 100; }
  function pulisci(v) { return v && n(v.kg) ? { kg: n(v.kg), fat: n(v.fat), muscle: n(v.muscle) } : null; }
  function uguale(a, b) { return !!a && !!b && a.kg === b.kg && a.fat === b.fat && a.muscle === b.muscle; }
  function data(d) { var m = String(d || '').match(/^\d{4}-\d{2}-\d{2}/); return m ? m[0] : null; }
  function pulisciTutte(o) { var out = {}; Object.keys(o || {}).forEach(function (d) { var g = data(d), v = pulisci(o[d]); if (g && v) out[g] = v; }); return out; }
  function ultima(voci) { return Object.keys(voci).reduce(function (m, d) { return voci[d].agg > m ? voci[d].agg : m; }, ''); }

  var inCorso = null;
  /* opz: { app: 'palestra'|'salute', leggiLocali: async () => {data: {kg, fat, muscle}}, applica: async (data, valore|null) } */
  function sincronizza(opz) {
    if (inCorso) return inCorso;
    inCorso = (async function () {
      var kFoto = K + '-foto-' + opz.app, kVisto = K + '-visto-' + opz.app;
      var ponte = leggi(K) || { voci: {} }, voci = ponte.voci || {};
      var prima = leggi(kFoto), visto = leggi(kVisto) || '', primaVolta = prima === null;
      var ora = new Date().toISOString(), mie = {}, inviate = 0, applicate = 0;
      var locali = pulisciTutte(await opz.leggiLocali());

      // 1) Le mie novità dall'ultima volta → ponte
      Object.keys(locali).forEach(function (d) {
        var p = voci[d];
        if (primaVolta ? !p : !uguale(locali[d], pulisci(prima[d]))) {
          if (p && !p.via && uguale(pulisci(p), locali[d])) return;      // c'è già uguale
          mie[d] = { kg: locali[d].kg, fat: locali[d].fat, muscle: locali[d].muscle, agg: ora, da: opz.app }; inviate++;
        }
      });
      if (!primaVolta) Object.keys(prima).forEach(function (d) {
        if (!locali[d] && !(voci[d] && voci[d].via)) { mie[d] = { via: true, agg: ora, da: opz.app }; inviate++; }
      });

      // 2) Le novità dell'altra app → qui (solo quelle che non ho appena cambiato io)
      var daApplicare = Object.keys(voci).filter(function (d) { return !mie[d] && (primaVolta || voci[d].agg > visto); });
      for (var i = 0; i < daApplicare.length; i++) {
        var d = daApplicare[i], p = voci[d];
        if (p.via) { if (locali[d]) { await opz.applica(d, null); delete locali[d]; applicate++; } }
        else { var v = pulisci(p); if (v && !uguale(locali[d], v)) { await opz.applica(d, v); locali[d] = v; applicate++; } }
      }

      // 3) Salvo: rileggo il ponte (l'altra app potrebbe averlo appena cambiato) e tengo la voce più recente
      var adesso = leggi(K) || { voci: {} }, finali = adesso.voci || {};
      Object.keys(mie).forEach(function (d) { if (!finali[d] || finali[d].agg <= mie[d].agg) finali[d] = mie[d]; });
      scrivi(K, { v: 1, voci: finali });
      scrivi(kFoto, locali);
      scrivi(kVisto, ultima(finali));
      return { inviate: inviate, applicate: applicate };
    })().finally(function () { inCorso = null; });
    return inCorso;
  }

  window.PontePeso = {
    sincronizza: sincronizza,
    scriviAttivita: function (o) { o.agg = new Date().toISOString(); scrivi(K_ATT, o); },
    leggiAttivita: function () { return leggi(K_ATT); },
    /* Il profilo cambia l'ora solo se cambia davvero qualcosa */
    scriviProfilo: function (o) {
      var p = leggi(K_PROF) || {};
      if (p.altezza === o.altezza && p.anno === o.anno && p.sesso === o.sesso) return false;
      scrivi(K_PROF, { altezza: o.altezza, anno: o.anno, sesso: o.sesso, agg: new Date().toISOString() }); return true;
    },
    leggiProfilo: function () { return leggi(K_PROF); },
  };
})();
