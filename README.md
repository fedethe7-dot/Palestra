# Palestra 6

Il personal trainer digitale di Federico: allenamenti, coach automatico, progressi, corpo e cucina fit.
Installabile sul telefono (PWA) e sincronizzata con il foglio Google **Allenamenti** tramite lo script Apps Script "Palestra Sync".

- App: https://fedethe7-dot.github.io/Palestra/


## Cosa c'è
| Sezione | Cosa fa |
|---|---|
| **Oggi** | Prossima sessione con il consiglio del coach, avviso cambio scheda, settimana, muscoli pronti, numeri rapidi, cucina del giorno, ultimo record (sezioni e ordine personalizzabili) |
| **Schede** | Sessioni, modifica esercizi, libreria con foto e mappa muscoli, esercizi tuoi, storico, proposta della nuova scheda |
| **Allenati** (pulsante centrale) | Un esercizio alla volta: serie con "ultima volta", pulsanti grandi −/+, RIR, dischi da montare, recupero automatico, plank con 3-2-1, timer libero, coach che riconosce quando sei fermo, riepilogo |
| **Progressi** | Forza (massimale stimato, record), volume e serie per muscolo, frequenza, resoconto della settimana, corpo (peso, bilancia, misure, calorie, resoconto da stampare per il dimagrimento) e foto con confronto |
| **Cucina** | Diario con kcal e macro, prodotti col codice a barre (Open Food Facts), ricette tue con valori scritti a mano, suggerimenti per le proteine mancanti, ricette con foto e porzioni, cucina passo passo, lista della spesa, piatti salvati |
| **Impostazioni** (avatar in alto) | Profilo, aspetto (4 stili chiaro/scuro, colori, carattere, testo, animazioni, schermata Oggi), allenamento e cambio scheda, timer e suoni, attrezzatura e dischi, foglio Google, backup |

## File
| Percorso | A cosa serve |
|---|---|
| `index.html` | Pagina dell'app |
| `css/temi.css` | I 4 stili (Vetro, Essenziale, Atleta, Officina) in chiaro e scuro |
| `css/app.css` | Struttura e componenti |
| `js/app.js` | Avvio, navigazione, tocchi |
| `js/dati.js` | Dati salvati, compatibilità con le versioni precedenti, calcoli |
| `js/coach.js` | Progressione dei carichi, dischi, muscoli pronti, nuova scheda |
| `js/timer.js` | Recupero, esercizi a tempo, timer libero, suoni, notifiche |
| `js/sync.js` | Collegamento al foglio Google (stesso formato di prima) e backup completo |
| `js/cibo.js` | Codice a barre dei prodotti |
| `js/resoconto.js` | Resoconto della settimana |
| `js/stampa.js` | Resoconto peso e composizione da stampare |
| `apps-script/PalestraBackup.gs` | Script del backup nel foglio (vedi sotto) |
| `js/libreria.js` | Esercizi, foto, muscoli |
| `js/grafici.js` | Grafici interattivi |
| `js/viste/` | Le schermate (oggi, allena, schede, progressi, cucina, impostazioni, strumenti) |
| `js/foto-piatti.js` | Foto dei piatti (Wikimedia Commons, licenze libere) |
| `ricette.csv` | Ricette incluse (si caricano da sole) |
| `sw.js`, `manifest.json` | Installazione e funzionamento offline |
| `img/es/` | Foto degli esercizi (WebP) |

## Ricette (CSV)
Per aggiungere ricette a tutti: aggiorna `ricette.csv` e aumenta `RICETTE_VER` in `js/viste/cucina.js`.
Colonne: `ID; Nome ricetta; Categoria; Porzioni; Prep (min); Cottura (min); Ingrediente; Grammi; Kcal /100g; Proteine /100g; Carboidrati /100g; Grassi /100g; Procedimento; Note; Preferita; Foto`.
Nella colonna Foto puoi mettere il link (https) di una foto tua.

## Script di backup

Il file `apps-script/PalestraBackup.gs` è uno script **a parte** (quello degli allenamenti, "Palestra Sync", non si tocca).
Una volta a settimana l'app gli manda la copia completa dei dati: lui la salva nelle schede "Backup app" e "RIR serie" del foglio Allenamenti.

1. Apri https://script.google.com e premi **Nuovo progetto**; chiamalo "Palestra Backup".
2. Cancella tutto e incolla il contenuto di `PalestraBackup.gs`.
3. Alla riga `PAROLA_SEGRETA` scrivi tra gli apici la stessa parola segreta che hai nell'app.
4. **Esegui il deployment → Nuovo deployment → App web**: "Esegui come: me", "Chi ha accesso: chiunque". Autorizza.
5. Copia il link che finisce con `/exec` e incollalo in app: Impostazioni → Foglio Google → Backup completo nel foglio.
6. Premi **Fai il backup adesso**.

## Da app web ad APK
L'app è già pronta per diventare un'app Android: ha il manifest, le icone e il service worker.
1. Apri https://www.pwabuilder.com dal computer.
2. Incolla `https://fedethe7-dot.github.io/Palestra/` e premi **Start**.
3. Scegli **Android** → **Generate Package** → scarica lo zip e installa il file `.apk` sul telefono.

Per notifiche del recupero precise anche a schermo spento il passo successivo è Capacitor con le notifiche locali.

## Crediti
- Foto degli esercizi: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (pubblico dominio).
- Foto dei piatti: [Wikimedia Commons](https://commons.wikimedia.org) (licenze libere, autori nelle pagine delle foto). Sono indicative.
