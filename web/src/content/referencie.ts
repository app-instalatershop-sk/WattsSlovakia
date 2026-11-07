import type { Lang } from '../i18n/ui';
import type { Kota } from '../lib/koty';

/**
 * Referencie Microflex. Zdroj: stránky referencií na watts.eu/sk (prečítané 23. 9. 2026), fotky
 * v pôvodnom rozlíšení v podklady/watts/fotky-referencie/orig. Len fakty z týchto stránok.
 * `rad` je slug radu, ku ktorému referencia patrí (zobrazí sa na jeho stránke).
 * `scena` je hlavná fotka s kótami: bod leží na rúre alebo v kotolni, súradnice sú v percentách
 * fotky (orange-5-scena.jpg je výrez orange-5 bez horných a dolných 100 px). Zmerané na mriežke.
 */
export interface Referencia {
  id: string; rad: string | null; kategoria: string; fotky: string[]; zdroj: string;
  nazov: string; miesto: string; kedy: string; perex: string; fakty: [string, string][]; realizacia: string;
  scena?: { fotka: string; koty: Kota[] };
  /** Fotka s potrubím (výkop, trasa) pre domov a stránky radov, keď `scena` ukazuje niečo iné (kotolňu). */
  scenaPotrubie?: { fotka: string; koty: Kota[] };
  /** Vlastná dodávka prevádzkovateľa webu (štítok „Naša dodávka“); ostatné sú referencie výrobcu. */
  nasa?: boolean;
  /** Prehľad stavieb na Referenciách: krátky typ stavby, mesto, roky a rozsah (počet budov alebo dĺžka potrubia). */
  typ: string; mesto: string; rok: string; rozsah: string;
  /** Potrubie stručne pre riadok s odkazom na rad (len keď referencia rad uvádza). */
  potrubie?: string;
  /** Čo je na fotke (alt a štítok pri fotke) podľa súboru; opisuje len to, čo je na fotke vidieť. */
  popisy: Record<string, string>;
}

const sk: Referencia[] = [
  {
    id: 'povazska-bystrica', rad: null, kategoria: 'vykurovanie',
    fotky: ['povazska-2.jpg', 'povazska-3.jpg', 'povazska-4.jpg', 'povazska-5.jpg', 'povazska-6.jpg', 'povazska-7.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-big-project-in-pova-bystrica',
    typ: 'Obytný súbor', mesto: 'Považská Bystrica', rok: '2022 až 2023', rozsah: '31 budov',
    popisy: {
      'povazska-2.jpg': 'Kotúče potrubia Microflex na stavenisku', 'povazska-3.jpg': 'Stavenisko obytného súboru s potrubím Microflex',
      'povazska-4.jpg': 'Potrubie vo výkope pri budove', 'povazska-5.jpg': 'Prestup stenou a napojenie na rozvod budovy',
      'povazska-6.jpg': 'Napojenie na rozvod v budove', 'povazska-7.jpg': 'Kotolňa s dvoma kotlami na pelety',
    },
    nazov: 'Rozvod tepla pre obytný súbor v Považskej Bystrici', miesto: 'Považská Bystrica, Slovensko', kedy: 'dodávky 12/2022 až 02/2023',
    perex: 'Kompletný vykurovací rozvod z predizolovaného potrubia Microflex pre 30 rodinných domov a jeden bytový dom, napojený na kotolňu s kotlami na pelety.',
    // Dodávka hneď za budovami: stránka radu ukazuje prvé dva údaje a tam patrí potrubie, nie kotly.
    fakty: [['Napojené budovy', '30 rodinných domov a 1 bytový dom'], ['Dodávka', 'potrubie Microflex, pevné body, tesnenia a systémové príslušenstvo'], ['Zdroj tepla', 'kotolňa, 2 kotly ETA na pelety po 350 kW'], ['Revízne šachty', '4']],
    realizacia: 'Ponuku a dodávku zabezpečila Ohrievacia Technika, s. r. o., prevádzkovateľ tohto webu, s podporou Watts.',
    scena: { fotka: 'povazska-7.jpg', koty: [{ x: 27, y: 58, l: 12, smer: 'hore-vpravo', hodnota: '2 × 350 kW', text: 'kotly na pelety' }] },
    // Stavenisko so žeriavom: rúra v popredí (modré pixely pri 45 % šírky ležia na 76 % výšky fotky).
    scenaPotrubie: { fotka: 'povazska-3.jpg', koty: [{ x: 45, y: 76, l: 12, smer: 'hore-vpravo', hodnota: '31 budov', text: 'rozvod z jednej kotolne' }] },
    nasa: true,
  },
  {
    id: 'fackov', rad: 'microflex-primo-duo-6-bar', kategoria: 'vykurovanie',
    fotky: ['fackov-2.jpg', 'fackov-3.jpg', 'fackov-1.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-slovakia-single-family',
    typ: 'Rodinný dom s garážou', mesto: 'Fačkov', rok: '2024', rozsah: '48 m', potrubie: 'Microflex PRIMO DUO 125/2 × 25',
    popisy: { 'fackov-1.jpg': 'Vývod potrubia pri betonáži dosky', 'fackov-2.jpg': 'Výkop s potrubím k domu', 'fackov-3.jpg': 'Vývody potrubia v betónovej doske' },
    nazov: 'Rodinný dom s garážou vo Fačkove', miesto: 'Fačkov, Slovensko', kedy: 'november 2024',
    perex: 'Rozvod vykurovacej vody z kotla na pelety do rodinného domu a do garáže s dielňou, ktorá stojí 15 metrov od domu.',
    fakty: [['Potrubie', 'Microflex PRIMO DUO 125/2 × 25'], ['Dĺžka', '48 m'], ['Budovy', 'dom 255 m², garáž s dielňou 100 m²'], ['Zdroj tepla', 'kotol na pelety']],
    realizacia: 'Dodávateľ: INSTA PL s. r. o., Prievidza.',
    scena: { fotka: 'fackov-2.jpg', koty: [{ x: 61, y: 86, l: 14, smer: 'hore-vpravo', smerM: 'hore-vlavo', hodnota: '48 m', text: 'Microflex PRIMO DUO 125/2 × 25' }] },
  },
  {
    id: 'skola-lehota', rad: 'microflex-uno-primo-6-bar', kategoria: 'vykurovanie',
    fotky: ['skola-2.jpg', 'skola-1.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-saves-school-year',
    typ: 'Základná škola', mesto: 'Lehota pri Nitre', rok: '2023', rozsah: '19,5 m', potrubie: 'Microflex UNO PRIMO 125/63 × 5,8',
    popisy: { 'skola-1.jpg': 'Potrubie na kotúči pred pokládkou', 'skola-2.jpg': 'Výmena rozvodu pri škole v zime' },
    nazov: 'Nové vykurovanie základnej školy v Lehote pri Nitre', miesto: 'Lehota pri Nitre, Slovensko', kedy: 'december 2023',
    perex: 'Starý oceľový rozvod v podzemnom kanáli praskol 3. decembra 2023. Hneď po poruche ho nahradilo potrubie Microflex.',
    fakty: [['Potrubie', 'Microflex UNO PRIMO 125/63 × 5,8'], ['Dĺžka', '19,5 m'], ['Škola', '164 žiakov, 17 učiteľov']],
    realizacia: 'Dodávateľ: TECHINS s. r. o., Nitra.',
    scena: { fotka: 'skola-2.jpg', koty: [{ x: 63, y: 48, l: 10, smer: 'dole-vpravo', smerM: 'dole-vlavo', hodnota: '19,5 m', text: 'Microflex UNO PRIMO 125/63 × 5,8' }] },
  },
  {
    id: 'orange', rad: 'microflex-uno-6-bar', kategoria: 'vykurovanie',
    // Poradie: pri hlavnej fotke (výrez orange-5) idú najprv iné pohľady (zapaženie, trasa cez areál), nie podobný orange-4.
    fotky: ['orange-2.jpg', 'orange-6.jpg', 'orange-4.jpg', 'orange-3.jpg', 'orange-5.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-in-orange-military-base',
    typ: 'Vojenská základňa', mesto: 'Orange, Francúzsko', rok: '2022', rozsah: 'asi 800 m', potrubie: 'Microflex UNO, Ø 63 až 90 mm',
    popisy: {
      'orange-2.jpg': 'Výkop so zapažením', 'orange-3.jpg': 'Križovanie s inou sieťou', 'orange-4.jpg': 'Dve potrubia vo výkope medzi budovami',
      'orange-5.jpg': 'Dve potrubia Microflex UNO vo výkope', 'orange-5-scena.jpg': 'Dve potrubia Microflex UNO vo výkope', 'orange-6.jpg': 'Trasa cez areál',
    },
    nazov: 'Rozvod tepla na vojenskej základni v Orange', miesto: 'Orange, Francúzsko', kedy: 'október 2022',
    perex: 'Staré oceľové potrubia, ktoré viedli teplú vodu z hlavnej kotolne do budov areálu, nahradilo asi 800 metrov potrubia Microflex.',
    fakty: [['Potrubie', 'Microflex UNO, rúry Ø 63, 75 a 90 mm (DN 50, 61 a 72)'], ['Dĺžka', 'asi 800 m'], ['Dodávka', 'potrubie a príslušenstvo']],
    realizacia: 'Realizácia: Fauché, údržba budov.',
    scena: { fotka: 'orange-5-scena.jpg', koty: [
      { x: 41, y: 87, l: 15, smer: 'hore-vlavo', hodnota: 'Ø 63 až 90 mm', text: 'Microflex UNO, DN 50 až 72' },
      { x: 60.5, y: 54, l: 13, smer: 'hore-vpravo', smerM: 'hore-vlavo', hodnota: 'asi 800 m', text: 'z kotolne do budov areálu' },
    ] },
  },
];
/** Kóty v češtine: tie isté body, iný text. */
const kotyCs = (sc: Referencia['scena'], texty: string[]): Referencia['scena'] => sc && { ...sc, koty: sc.koty.map((k, i) => ({ ...k, text: texty[i] ?? k.text })) };

const cs: Referencia[] = [
  { ...sk[0],
    typ: 'Obytný soubor',
    popisy: {
      'povazska-2.jpg': 'Kotouče potrubí Microflex na staveništi', 'povazska-3.jpg': 'Staveniště obytného souboru s potrubím Microflex',
      'povazska-4.jpg': 'Potrubí ve výkopu u budovy', 'povazska-5.jpg': 'Prostup stěnou a napojení na rozvod budovy',
      'povazska-6.jpg': 'Napojení na rozvod v budově', 'povazska-7.jpg': 'Kotelna se dvěma kotli na pelety',
    },
    nazov: 'Rozvod tepla pro obytný soubor v Považské Bystrici', miesto: 'Považská Bystrica, Slovensko', kedy: 'dodávky 12/2022 až 02/2023',
    perex: 'Kompletní topný rozvod z předizolovaného potrubí Microflex pro 30 rodinných domů a jeden bytový dům, napojený na kotelnu s kotli na pelety.',
    fakty: [['Napojené budovy', '30 rodinných domů a 1 bytový dům'], ['Dodávka', 'potrubí Microflex, pevné body, těsnění a systémové příslušenství'], ['Zdroj tepla', 'kotelna, 2 kotle ETA na pelety po 350 kW'], ['Revizní šachty', '4']],
    realizacia: 'Nabídku a dodávku zajistila Ohrievacia Technika, s. r. o., provozovatel tohoto webu, s podporou Watts.',
    scena: kotyCs(sk[0].scena, ['kotle na pelety']),
    scenaPotrubie: kotyCs(sk[0].scenaPotrubie, ['rozvod z jedné kotelny']) },
  { ...sk[1],
    typ: 'Rodinný dům s garáží',
    popisy: { 'fackov-1.jpg': 'Vývod potrubí při betonáži desky', 'fackov-2.jpg': 'Výkop s potrubím k domu', 'fackov-3.jpg': 'Vývody potrubí v betonové desce' },
    nazov: 'Rodinný dům s garáží ve Fačkově', miesto: 'Fačkov, Slovensko', kedy: 'listopad 2024',
    perex: 'Rozvod topné vody z kotle na pelety do rodinného domu a do garáže s dílnou, která stojí 15 metrů od domu.',
    fakty: [['Potrubí', 'Microflex PRIMO DUO 125/2 × 25'], ['Délka', '48 m'], ['Budovy', 'dům 255 m², garáž s dílnou 100 m²'], ['Zdroj tepla', 'kotel na pelety']],
    realizacia: 'Dodavatel: INSTA PL s. r. o., Prievidza.' },
  { ...sk[2],
    typ: 'Základní škola',
    popisy: { 'skola-1.jpg': 'Potrubí na kotouči před pokládkou', 'skola-2.jpg': 'Výměna rozvodu u školy v zimě' },
    nazov: 'Nové vytápění základní školy v Lehotě pri Nitre', miesto: 'Lehota pri Nitre, Slovensko', kedy: 'prosinec 2023',
    perex: 'Starý ocelový rozvod v podzemním kanálu praskl 3. prosince 2023. Hned po poruše ho nahradilo potrubí Microflex.',
    fakty: [['Potrubí', 'Microflex UNO PRIMO 125/63 × 5,8'], ['Délka', '19,5 m'], ['Škola', '164 žáků, 17 učitelů']],
    realizacia: 'Dodavatel: TECHINS s. r. o., Nitra.' },
  { ...sk[3],
    typ: 'Vojenská základna', mesto: 'Orange, Francie',
    popisy: {
      'orange-2.jpg': 'Výkop s pažením', 'orange-3.jpg': 'Křížení s jinou sítí', 'orange-4.jpg': 'Dvě potrubí ve výkopu mezi budovami',
      'orange-5.jpg': 'Dvě potrubí Microflex UNO ve výkopu', 'orange-5-scena.jpg': 'Dvě potrubí Microflex UNO ve výkopu', 'orange-6.jpg': 'Trasa přes areál',
    },
    nazov: 'Rozvod tepla na vojenské základně v Orange', miesto: 'Orange, Francie', kedy: 'říjen 2022',
    perex: 'Staré ocelové potrubí, které vedlo teplou vodu z hlavní kotelny do budov areálu, nahradilo asi 800 metrů potrubí Microflex.',
    fakty: [['Potrubí', 'Microflex UNO, trubky Ø 63, 75 a 90 mm (DN 50, 61 a 72)'], ['Délka', 'asi 800 m'], ['Dodávka', 'potrubí a příslušenství']],
    realizacia: 'Realizace: Fauché, údržba budov.',
    scena: kotyCs(sk[3].scena, ['Microflex UNO', 'z kotelny do budov areálu']) },
];

export const referencie = (lang: Lang) => (lang === 'cs' ? cs : sk);
