/* ============ FOTO DEI PIATTI ============
   Foto con licenza libera da Wikimedia Commons (Creative Commons o pubblico dominio),
   scelte per somiglianza con ogni ricetta: sono indicative, non la ricetta esatta.
   Si caricano da internet la prima volta e poi restano salvate per l'uso offline.
   Puoi sempre mettere una foto tua nella colonna "Foto" del CSV (link https). */

const REGOLE = [
  [/pancake/i, 'Banana_on_pancake.jpg'],
  [/porridge/i, 'Bowl_of_porridge_with_spoon.jpg'],
  [/corn flakes|yogurt greco, cacao/i, 'Cereal_con_yogur.jpg'],
  [/uova strapazzate/i, 'Scrambled_eggs-01.jpg'],
  [/toast uovo/i, 'Eggs_and_ham.jpg'],
  [/fette biscottate/i, 'Zwieback-1.jpg'],
  [/mug cake/i, 'Tassenkuchen_.jpg'],
  [/tiramis/i, 'Standing_on_the_shoulders_of_the_giants_-_Tiramisu_in_glasses_(5733322580).jpg'],
  [/pasta fredda/i, 'Pesto_Pasta_Salad.jpg'],
  [/trofie|pesto/i, 'Trofie_al_pesto.jpg'],
  [/carbonara/i, 'Spaghetti_alla_Carbonara.jpg'],
  [/rag[uù]/i, 'Tagliatelle_al_ragu_Bolognese.jpg'],
  [/pasta tonno|pasta cremosa/i, 'Pasta_al_pomodoro.JPG'],
  [/curry|satay/i, 'Chicken_Curry_Rice.jpg'],
  [/meal prep|riso, tacchino/i, 'Jerk_Chicken,_Rice.jpg'],
  [/hamburger/i, 'Hamburger_mit_pommes_frites_-_Grindelwald,_Schweiz.jpg'],
  [/pizz/i, 'Margherita_Pizza.jpg'],
  [/risotto/i, 'Risotto_with_speck_and_goat_cheese_(6101067436).jpg'],
  [/polenta/i, 'Spezzatino_con_polenta.jpg'],
  [/canederli/i, 'Speckknödel_gemischter_Salat.jpg'],
  [/cotoletta/i, 'Cotoletta_e_patate_al_forno.jpg'],
  [/toast/i, 'Toast.jpg'],
  [/bresaola/i, 'Antipasto_di_Bresaola.jpg'],
  [/frullato/i, 'Banana_Smoothie.jpg'],
  [/piadina/i, 'Piadina_romagnola_3.jpg'],
  [/insalata di riso/i, 'Insalata_di_riso.jpg'],
  [/frittata/i, '-2019-10-27_Potato_&_onion_frittata,_Cromer.JPG'],
  [/polpette/i, 'Polpette_alla_napoletana.jpg'],
  [/uova sode/i, 'Boiled_egg_-_Two_pieces.jpg'],
  [/patatine/i, 'Papas_fritas_(plato).jpg'],
  [/popcorn/i, 'Popcorn.jpg'],
];
// Le ricette fatte da te non prendono foto automatiche: solo la tua, se l'hai messa
const fileDi = r => r.mia ? undefined : (REGOLE.find(([re]) => re.test(r.nome)) || [])[1];
export function fotoPiatto(r, larghezza = 640) {
  const f = fileDi(r);
  return f ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=${larghezza}` : '';
}
export function paginaFoto(r) { const f = fileDi(r); return f ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f)}` : ''; }
export const creditoFoto = () => 'Foto dei piatti indicative, da Wikimedia Commons con licenze libere (autori nelle pagine delle foto).';
