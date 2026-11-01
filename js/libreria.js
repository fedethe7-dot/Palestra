/* ============ LIBRERIA ESERCIZI ============
   Esercizi fattibili con la tua attrezzatura (bilanciere, panca piana, manubri, carrucola, elastici, corpo libero),
   foto inizio/fine (archivio pubblico dominio "free-exercise-db", in img/es/), muscoli e mappa muscolare. */
import { S } from './dati.js';

const LIBRERIA_BASE = [
  // PETTO
  { nome: 'Panca Piana', gruppo: 'Petto', attrezzo: 'Bilanciere', tipo: 'carico', rip: '8-12', recupero: '2 min',
    muscoli: 'Pettorali, deltoidi anteriori, tricipiti',
    esecuzione: ['Sdraiati con gli occhi sotto il bilanciere, scapole strette e piedi ben piantati.', 'Impugna poco più larga delle spalle e scendi controllato fino a sfiorare il petto, sotto i capezzoli.', 'Spingi in alto e leggermente indietro, senza staccare i glutei dalla panca.'],
    errori: ['Gomiti aperti a 90° rispetto al busto: tienili a circa 45-60°.', 'Rimbalzare il bilanciere sul petto.'] },
  { nome: 'Distensioni Manubri', gruppo: 'Petto', attrezzo: 'Manubri', tipo: 'carico', rip: '8-12', recupero: '2 min',
    muscoli: 'Pettorali, deltoidi anteriori, tricipiti',
    esecuzione: ['Sdraiati con i manubri all\'altezza del petto, palmi verso i piedi.', 'Spingi in alto avvicinando i manubri senza farli sbattere.', 'Scendi lento finché senti l\'allungamento del petto.'],
    errori: ['Scendere troppo poco: perdi la parte migliore del movimento.', 'Inarcare troppo la schiena.'] },
  { nome: 'Croci su Panca', gruppo: 'Petto', attrezzo: 'Manubri', tipo: 'carico', rip: '10-12', recupero: '90 sec',
    muscoli: 'Pettorali',
    esecuzione: ['Sdraiato, manubri sopra il petto con i gomiti leggermente piegati.', 'Apri le braccia ad arco mantenendo fisso l\'angolo del gomito.', 'Richiudi "abbracciando" un albero, stringendo il petto in alto.'],
    errori: ['Piegare e stendere i gomiti: diventa una distensione.', 'Scendere troppo con carichi alti: stress sulla spalla.'] },
  { nome: 'Croci al Cavo', gruppo: 'Petto', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '12-15', recupero: '60 sec',
    muscoli: 'Pettorali (parte bassa)',
    esecuzione: ['Di lato alla carrucola, impugna la maniglia con il braccio più vicino al cavo.', 'Busto leggermente inclinato in avanti, gomito appena piegato.', 'Porta la mano verso il basso e davanti all\'ombelico, poi torna controllato. Fai tutte le ripetizioni e cambia lato.'],
    errori: ['Ruotare il busto per aiutarti.', 'Tirare con il bicipite invece di "abbracciare".'] },
  { nome: 'Piegamenti', gruppo: 'Petto', attrezzo: 'Corpo libero', tipo: 'corpo', rip: 'Max', recupero: '90 sec',
    muscoli: 'Pettorali, tricipiti, deltoidi anteriori, core',
    esecuzione: ['Mani poco più larghe delle spalle, corpo in linea dalla testa ai talloni.', 'Scendi finché il petto è a pochi centimetri da terra.', 'Spingi via il pavimento mantenendo addome e glutei contratti.'],
    errori: ['Bacino che cede verso il basso.', 'Mezze ripetizioni.'] },
  { nome: 'Piegamenti Piedi Rialzati', gruppo: 'Petto', attrezzo: 'Corpo libero', tipo: 'corpo', rip: 'Max', recupero: '90 sec',
    muscoli: 'Pettorali (parte alta), deltoidi anteriori, tricipiti',
    esecuzione: ['Piedi sulla panca, mani a terra poco più larghe delle spalle.', 'Scendi controllato tenendo il corpo dritto.', 'Più alti sono i piedi, più lavora la parte alta del petto.'],
    errori: ['Bacino troppo alto a "tetto".', 'Collo proteso verso il pavimento.'] },

  // SCHIENA
  { nome: 'Rematore Bilanciere', gruppo: 'Schiena', attrezzo: 'Bilanciere', tipo: 'carico', rip: '8-12', recupero: '2 min',
    muscoli: 'Dorsali, romboidi, trapezio, deltoidi posteriori, bicipiti',
    esecuzione: ['Ginocchia morbide, busto inclinato a circa 45°, schiena neutra.', 'Tira il bilanciere verso l\'ombelico portando i gomiti indietro.', 'Stringi le scapole in alto e scendi controllato.'],
    errori: ['Schiena curva: riduci il carico.', 'Usare lo slancio del busto per tirare su.'] },
  { nome: 'Rematore manubrio', gruppo: 'Schiena', attrezzo: 'Manubri', tipo: 'carico', rip: '8-12', recupero: '90 sec',
    muscoli: 'Dorsali, romboidi, deltoidi posteriori, bicipiti',
    esecuzione: ['Mano e ginocchio dello stesso lato sulla panca, schiena piatta.', 'Tira il manubrio verso l\'anca, gomito vicino al corpo.', 'Scendi fino ad allungare bene il dorsale.'],
    errori: ['Ruotare il busto per alzare di più.', 'Tirare verso la spalla invece che verso l\'anca.'] },
  { nome: 'Lat Machine Cavo', gruppo: 'Schiena', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '10-12', recupero: '90 sec',
    muscoli: 'Gran dorsale, bicipiti, romboidi',
    esecuzione: ['In ginocchio sotto la carrucola, busto appena inclinato indietro.', 'Tira la corda o la maniglia verso il petto portando i gomiti giù e indietro.', 'Risali lento lasciando allungare bene le braccia in alto.'],
    errori: ['Tirare solo con le braccia: pensa a "mettere i gomiti in tasca".', 'Dondolare col busto.'] },
  { nome: 'Lat Machine un Braccio', gruppo: 'Schiena', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '10-12', recupero: '60 sec',
    muscoli: 'Gran dorsale',
    esecuzione: ['In ginocchio, maniglia in una mano sopra la testa.', 'Porta il gomito verso il fianco, ruotando leggermente il palmo verso di te.', 'Risali lento fino all\'allungamento completo. Cambia lato.'],
    errori: ['Inclinare tutto il busto di lato.', 'Accorciare la risalita.'] },
  { nome: 'Pullover Cavo', gruppo: 'Schiena', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '12-15', recupero: '60 sec',
    muscoli: 'Gran dorsale, capo lungo del tricipite',
    esecuzione: ['In piedi davanti alla carrucola, busto inclinato in avanti, braccia tese in alto con la corda.', 'Porta le mani verso le cosce ad arco, braccia quasi tese.', 'Torna su lento senza piegare i gomiti.'],
    errori: ['Piegare i gomiti: diventa un pushdown.', 'Usare il busto per spingere giù.'] },
  { nome: 'Pullover', gruppo: 'Schiena', attrezzo: 'Manubri', tipo: 'carico', rip: '10-12', recupero: '90 sec',
    muscoli: 'Gran dorsale, pettorali, tricipiti',
    esecuzione: ['Sdraiato sulla panca, un manubrio tenuto a due mani sopra il petto.', 'Portalo dietro la testa ad arco, gomiti leggermente piegati.', 'Riportalo sopra il petto contraendo i dorsali.'],
    errori: ['Scendere troppo con le spalle rigide.', 'Inarcare la schiena.'] },
  { nome: 'Trazioni', gruppo: 'Schiena', attrezzo: 'Corpo libero', tipo: 'corpo', rip: 'Max', recupero: '2 min',
    muscoli: 'Gran dorsale, bicipiti, romboidi',
    esecuzione: ['Solo quando il telaio è stabile per reggere il tuo peso.', 'Appeso con presa poco più larga delle spalle, scapole attive.', 'Sali portando il petto verso la sbarra, scendi fino a braccia tese. Puoi aiutarti con un elastico.'],
    errori: ['Slanciarsi con le gambe.', 'Fermarsi a metà discesa.'] },

  // SPALLE
  { nome: 'Military Press', gruppo: 'Spalle', attrezzo: 'Bilanciere', tipo: 'carico', rip: '8-10', recupero: '2 min',
    muscoli: 'Deltoidi anteriori e laterali, tricipiti',
    esecuzione: ['In piedi, bilanciere sulle clavicole, glutei e addome contratti.', 'Spingi in verticale spostando la testa indietro per far passare il bilanciere.', 'Chiudi con il bilanciere sopra la testa e scendi controllato.'],
    errori: ['Inarcare la zona lombare.', 'Spingere in avanti invece che in verticale.'] },
  { nome: 'Shoulder Press Manubri', gruppo: 'Spalle', attrezzo: 'Manubri', tipo: 'carico', rip: '8-12', recupero: '90 sec',
    muscoli: 'Deltoidi anteriori e laterali, tricipiti',
    esecuzione: ['Seduto sulla panca, manubri all\'altezza delle orecchie.', 'Spingi in alto avvicinandoli senza farli toccare.', 'Scendi fino a circa l\'altezza del mento.'],
    errori: ['Inarcare la schiena per spingere.', 'Scendere troppo poco.'] },
  { nome: 'Alzate Laterali', gruppo: 'Spalle', attrezzo: 'Manubri', tipo: 'carico', rip: '12-15', recupero: '60 sec',
    muscoli: 'Deltoidi laterali',
    esecuzione: ['In piedi, manubri lungo i fianchi, busto appena inclinato in avanti.', 'Alza le braccia di lato fino all\'altezza delle spalle, gomiti leggermente piegati.', 'Pausa di un secondo in alto e scendi in 3 secondi.'],
    errori: ['Slanciare con il busto.', 'Alzare le spalle verso le orecchie.'] },
  { nome: 'Alzate Laterali Elastico', gruppo: 'Spalle', attrezzo: 'Elastici', tipo: 'carico', rip: '15-20', recupero: '60 sec',
    muscoli: 'Deltoidi laterali',
    esecuzione: ['Pesta l\'elastico con il piede opposto al braccio che lavora.', 'Alza il braccio di lato fino all\'altezza della spalla.', 'Scendi lento resistendo alla tensione.'],
    errori: ['Lasciar tornare l\'elastico di colpo.', 'Piegare troppo il gomito.'] },
  { nome: 'Face Pull Cavo', gruppo: 'Spalle post.', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '12-15', recupero: '60 sec',
    muscoli: 'Deltoidi posteriori, cuffia dei rotatori, trapezio medio',
    esecuzione: ['Carrucola all\'altezza della fronte o poco sopra, corda impugnata con i pollici verso di te.', 'Tira verso il viso aprendo la corda e portando le mani ai lati delle orecchie.', 'Gomiti alti, stringi le scapole e torna controllato.'],
    errori: ['Gomiti bassi: diventa un rematore.', 'Usare un carico troppo pesante.'] },
  { nome: 'Alzate Posteriori', gruppo: 'Spalle post.', attrezzo: 'Manubri', tipo: 'carico', rip: '12-15', recupero: '60 sec',
    muscoli: 'Deltoidi posteriori, romboidi',
    esecuzione: ['Busto inclinato quasi parallelo a terra, manubri sotto il petto.', 'Apri le braccia di lato con i gomiti leggermente piegati.', 'Fermati all\'altezza delle spalle e scendi lento.'],
    errori: ['Stringere troppo le scapole: deve lavorare la spalla.', 'Usare lo slancio.'] },

  // BICIPITI
  { nome: 'Curl Manubri', gruppo: 'Bicipiti', attrezzo: 'Manubri', tipo: 'carico', rip: '8-12', recupero: '90 sec',
    muscoli: 'Bicipiti, brachiale',
    esecuzione: ['In piedi, manubri lungo i fianchi, palmi in avanti.', 'Piega i gomiti tenendoli fermi vicino al corpo.', 'Stringi in alto e scendi in 2-3 secondi fino a braccio teso.'],
    errori: ['Portare avanti i gomiti.', 'Dondolare con la schiena.'] },
  { nome: 'Curl Bilanciere', gruppo: 'Bicipiti', attrezzo: 'Bilanciere', tipo: 'carico', rip: '8-12', recupero: '90 sec',
    muscoli: 'Bicipiti',
    esecuzione: ['Presa alla larghezza delle spalle, palmi in avanti.', 'Sali tenendo i gomiti fermi ai fianchi.', 'Scendi controllato senza appoggiare il bilanciere alle cosce.'],
    errori: ['Slancio con le anche.', 'Polsi piegati all\'indietro.'] },
  { nome: 'Hammer Curl', gruppo: 'Bicipiti', attrezzo: 'Manubri', tipo: 'carico', rip: '10-12', recupero: '90 sec',
    muscoli: 'Brachiale, brachioradiale, bicipiti',
    esecuzione: ['Manubri con palmi rivolti verso le cosce, come se tenessi un martello.', 'Sali tenendo i gomiti fermi.', 'Scendi lento fino a braccio teso.'],
    errori: ['Ruotare i polsi durante il movimento.', 'Alzare le spalle.'] },
  { nome: 'Curl Concentrato', gruppo: 'Bicipiti', attrezzo: 'Manubri', tipo: 'carico', rip: '10-12', recupero: '60 sec',
    muscoli: 'Bicipiti',
    esecuzione: ['Seduto sulla panca, gomito appoggiato all\'interno della coscia.', 'Porta il manubrio verso la spalla contraendo forte in alto.', 'Scendi lento fino a braccio teso. Cambia lato.'],
    errori: ['Staccare il gomito dalla coscia.', 'Aiutarsi con il busto.'] },

  // TRICIPITI
  { nome: 'Pushdown Corda', gruppo: 'Tricipiti', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '10-15', recupero: '60 sec',
    muscoli: 'Tricipiti',
    esecuzione: ['In piedi davanti alla carrucola, gomiti attaccati ai fianchi.', 'Spingi la corda in basso fino a braccia tese, aprendo le mani in fondo.', 'Risali fino a circa 90° senza muovere i gomiti.'],
    errori: ['Gomiti che si allargano o vanno avanti.', 'Buttare il peso del corpo sulla corda.'] },
  { nome: 'Estensioni sopra la Testa al Cavo', gruppo: 'Tricipiti', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '10-15', recupero: '60 sec',
    muscoli: 'Tricipiti (soprattutto capo lungo)',
    esecuzione: ['Di spalle alla carrucola, corda dietro la testa, busto inclinato in avanti.', 'Stendi le braccia in avanti e in alto.', 'Torna indietro lento sentendo l\'allungamento del tricipite.'],
    errori: ['Gomiti troppo aperti.', 'Muovere le spalle invece dei gomiti.'] },
  { nome: 'French Press Manubrio', gruppo: 'Tricipiti', attrezzo: 'Manubri', tipo: 'carico', rip: '10-12', recupero: '90 sec',
    muscoli: 'Tricipiti',
    esecuzione: ['Seduto, un manubrio tenuto a due mani sopra la testa.', 'Scendi dietro la nuca piegando solo i gomiti.', 'Risali a braccia tese.'],
    errori: ['Gomiti che si aprono molto.', 'Inarcare la schiena.'] },
  { nome: 'Estensioni Tricipiti', gruppo: 'Tricipiti', attrezzo: 'Elastici', tipo: 'carico', rip: '10-15', recupero: '90 sec',
    muscoli: 'Tricipiti',
    esecuzione: ['Elastico fissato in alto oppure pestato sotto i piedi per la versione sopra la testa.', 'Stendi le braccia tenendo fermi i gomiti.', 'Torna lento resistendo all\'elastico.'],
    errori: ['Lasciar tornare l\'elastico di colpo.', 'Muovere le spalle.'] },
  { nome: 'Panca Presa Stretta', gruppo: 'Tricipiti', attrezzo: 'Bilanciere', tipo: 'carico', rip: '8-10', recupero: '2 min',
    muscoli: 'Tricipiti, pettorali',
    esecuzione: ['Come la panca piana ma con le mani alla larghezza delle spalle.', 'Scendi con i gomiti vicini al corpo fino alla parte bassa del petto.', 'Spingi in alto concentrandoti sui tricipiti.'],
    errori: ['Presa troppo stretta: stress sui polsi.', 'Gomiti aperti.'] },

  // CORE
  { nome: 'Plank', gruppo: 'Core', attrezzo: 'Corpo libero', tipo: 'tempo', rip: '45-60', recupero: '60 sec',
    muscoli: 'Addominali, core',
    esecuzione: ['Avambracci a terra sotto le spalle, corpo in linea.', 'Contrai addome e glutei, come se aspettassi un pugno nello stomaco.', 'Respira normalmente e tieni la posizione.'],
    errori: ['Bacino troppo alto o che cede.', 'Trattenere il respiro.'] },
  { nome: 'Plank Laterale', gruppo: 'Core', attrezzo: 'Corpo libero', tipo: 'tempo', rip: '30-45', recupero: '60 sec',
    muscoli: 'Obliqui, core',
    esecuzione: ['Sul fianco, avambraccio a terra sotto la spalla.', 'Alza il bacino fino a formare una linea dritta.', 'Tieni la posizione e cambia lato.'],
    errori: ['Bacino che scende.', 'Spalla lontana dal gomito.'] },
  { nome: 'Crunch al Cavo', gruppo: 'Core', attrezzo: 'Carrucola alta', tipo: 'carico', rip: '12-15', recupero: '60 sec',
    muscoli: 'Retto dell\'addome',
    esecuzione: ['In ginocchio davanti alla carrucola, corda ai lati della testa.', 'Arrotola il busto portando i gomiti verso le cosce.', 'Torna su lento senza muovere le anche.'],
    errori: ['Tirare con le braccia.', 'Sedersi sui talloni invece di flettere il busto.'] },
  { nome: 'Dead Bug', gruppo: 'Core', attrezzo: 'Corpo libero', tipo: 'corpo', rip: '10-12 per lato', recupero: '60 sec',
    muscoli: 'Core, addominali profondi',
    esecuzione: ['Supino, braccia verso il soffitto e gambe a 90°.', 'Allunga un braccio e la gamba opposta tenendo la schiena a terra.', 'Torna al centro e cambia lato.'],
    errori: ['Schiena che si stacca da terra.', 'Andare veloce.'] },

  // GAMBE (occasionali, il calcio fa già il grosso)
  { nome: 'Squat', gruppo: 'Gambe', attrezzo: 'Bilanciere', tipo: 'carico', rip: '8-10', recupero: '2 min',
    muscoli: 'Quadricipiti, glutei, core',
    esecuzione: ['Bilanciere sui trapezi, piedi alla larghezza delle spalle.', 'Scendi spingendo indietro le anche e aprendo le ginocchia.', 'Risali spingendo con tutto il piede.'],
    errori: ['Ginocchia che cedono verso l\'interno.', 'Talloni che si staccano.'] },
  { nome: 'Affondi Manubri', gruppo: 'Gambe', attrezzo: 'Manubri', tipo: 'carico', rip: '10 per gamba', recupero: '90 sec',
    muscoli: 'Quadricipiti, glutei',
    esecuzione: ['Manubri lungo i fianchi, fai un passo lungo in avanti.', 'Scendi finché il ginocchio dietro sfiora terra.', 'Spingi con la gamba davanti per tornare su.'],
    errori: ['Passo troppo corto.', 'Busto che crolla in avanti.'] },
];
export const ATTREZZI = ['Bilanciere', 'Manubri', 'Carrucola alta', 'Elastici', 'Corpo libero'];

export const VISUAL = {
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
export const MUSCOLI_GRUPPO = { 'Petto': ['petto'], 'Schiena': ['dorsali'], 'Spalle': ['spalle_lat', 'spalle_ant'], 'Spalle post.': ['spalle_post'],
  'Bicipiti': ['bicipiti'], 'Tricipiti': ['tricipiti'], 'Core': ['addome'], 'Gambe': ['quadricipiti', 'glutei'] };

export const IMG_ES = (/\/beta\/?/.test(location.pathname) ? '../' : '') + 'img/es/';

/* Mappa muscoli: sagoma stilizzata davanti e dietro. Le forme sono disegnate solo sul lato sinistro
   e specchiate, così la figura resta simmetrica. */
export function mappaMuscoli(pri, sec, cls = '') {
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

export const NOMI_MUSCOLI = { petto: 'Petto', spalle_ant: 'Spalle (davanti)', spalle_lat: 'Spalle (lato)', spalle_post: 'Spalle (dietro)', trapezio: 'Trapezio',
  bicipiti: 'Bicipiti', avambracci: 'Avambracci', tricipiti: 'Tricipiti', dorsali: 'Dorsali', lombari: 'Lombari', addome: 'Addome', obliqui: 'Obliqui',
  glutei: 'Glutei', quadricipiti: 'Quadricipiti', femorali: 'Femorali', polpacci: 'Polpacci' };


/* ---------- Esercizi della libreria + quelli creati da te ---------- */
export const GRUPPI = ['Petto', 'Schiena', 'Spalle', 'Spalle post.', 'Bicipiti', 'Tricipiti', 'Core', 'Gambe'];
export function libreria() {
  const miei = (S.db?.eserciziMiei || []).map(x => ({ ...x, mio: true }));
  const nomiMiei = new Set(miei.map(x => x.nome.toLowerCase()));
  return [...LIBRERIA_BASE.filter(x => !nomiMiei.has(x.nome.toLowerCase())), ...miei];
}
export const libDi = nome => libreria().find(x => x.nome.toLowerCase() === String(nome || '').toLowerCase());

/* Foto, muscoli principali/secondari e punti chiave di un esercizio */
export function visualDi(nome, gruppo) {
  const n = String(nome || '').toLowerCase();
  const k = Object.keys(VISUAL).find(x => x.toLowerCase() === n);
  if (k) { const [slug, pri, sec, chiavi] = VISUAL[k]; return { slug, pri, sec, chiavi }; }
  const mio = (S.db?.eserciziMiei || []).find(x => x.nome.toLowerCase() === n);
  if (mio && (mio.pri || []).length) return { slug: mio.foto || null, pri: mio.pri, sec: mio.sec || [], chiavi: mio.chiavi || [] };
  const g = gruppo || mio?.gruppo || libDi(nome)?.gruppo;
  const pri = MUSCOLI_GRUPPO[g];
  return pri ? { slug: null, pri, sec: [], chiavi: [] } : null;
}
export const fotoEs = (nome, gruppo, n = 0) => { const v = visualDi(nome, gruppo); return v?.slug ? `${IMG_ES}${v.slug}-${n}.webp` : ''; };

/* Attrezzo usato: dalla libreria, altrimenti dalle note dell'esercizio */
export function attrezzoDi(e) {
  const x = libDi(e.nome);
  if (x?.attrezzo) return x.attrezzo;
  const t = `${e.note || ''} ${e.nome}`.toLowerCase();
  if (/carrucol|cavo|corda/.test(t)) return 'Carrucola alta';
  if (/bilanciere/.test(t)) return 'Bilanciere';
  if (/manubri/.test(t)) return 'Manubri';
  if (/elastic/.test(t)) return 'Elastici';
  if (e.tipo !== 'carico') return 'Corpo libero';
  return 'Manubri';
}
/* Esercizi alternativi dello stesso gruppo muscolare (per sostituire o cambiare scheda) */
export const alternative = (nome, gruppo) => libreria().filter(x => x.gruppo === gruppo && x.nome.toLowerCase() !== String(nome).toLowerCase());
