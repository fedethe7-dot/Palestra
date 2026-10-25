# 🏋️ Palestra

Web app personale per gli allenamenti in palestra di Federico: sessioni A/B/C, serie, carichi, progressi, corpo e ricette fit.
Installabile sul telefono (PWA) e sincronizzata con il foglio Google **Allenamenti** tramite lo script Apps Script "Palestra Sync".

- App: https://fedethe7-dot.github.io/Palestra/

## File
| File | A cosa serve |
|---|---|
| `index.html`, `style.css` | Pagina e grafica |
| `app.js` | Dati, sincronizzazione col foglio, schermate, statistiche |
| `visual.js` | Esercizi illustrati: foto inizio/fine, mappa muscoli, punti chiave |
| `timer.js` | Recupero automatico e timer per plank/esercizi a tempo |
| `ricette.js` | Ricette Fit: elenco, porzioni, macro, import CSV |
| `ricette.csv` | Le ricette incluse nell'app (si caricano da sole) |
| `stampa.js` | Riepilogo del periodo e storico per esercizio da stampare |
| `sw.js`, `manifest.json`, `icon.svg` | Installazione e funzionamento offline |
| `img/es/` | Foto degli esercizi (WebP) |

## Ricette (CSV)
Per aggiungere ricette a tutti: aggiorna `ricette.csv` e aumenta `RICETTE_VER` in `ricette.js`.

Stesse colonne della scheda **Ricette** del foglio, una riga per ingrediente:
`ID; Nome ricetta; Categoria; Porzioni; Prep (min); Cottura (min); Ingrediente; Grammi; Kcal /100g; Proteine /100g; Carboidrati /100g; Grassi /100g; Procedimento; Note; Preferita; Foto`.
I dati della ricetta vanno solo sulla prima riga; kcal e macro li calcola l'app dalle grammature.

## Crediti
Foto degli esercizi da [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (pubblico dominio, Unlicense).
