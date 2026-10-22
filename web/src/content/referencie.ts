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
}

const sk: Referencia[] = [
  {
    id: 'povazska-bystrica', rad: null, kategoria: 'vykurovanie',
    fotky: ['povazska-2.jpg', 'povazska-3.jpg', 'povazska-4.jpg', 'povazska-5.jpg', 'povazska-6.jpg', 'povazska-7.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-big-project-in-pova-bystrica',
    nazov: 'Rozvod tepla pre obytný súbor v Považskej Bystrici', miesto: 'Považská Bystrica, Slovensko', kedy: 'dodávky 12/2022 až 02/2023',
    perex: 'Kompletný vykurovací rozvod z predizolovaného potrubia Microflex pre 30 rodinných domov a jeden bytový dom, napojený na kotolňu s kotlami na pelety.',
    fakty: [['Napojené budovy', '30 rodinných domov a 1 bytový dom'], ['Zdroj tepla', 'kotolňa, 2 kotly ETA na pelety po 350 kW'], ['Revízne šachty', '4'], ['Dodávka', 'potrubie Microflex, pevné body, tesnenia a systémové príslušenstvo']],
    realizacia: 'Ponuku a dodávku zabezpečila Ohrievacia Technika, s. r. o., prevádzkovateľ tohto webu, s podporou Watts.',
    scena: { fotka: 'povazska-7.jpg', koty: [{ x: 27, y: 58, l: 12, smer: 'hore-vpravo', hodnota: '2 × 350 kW', text: 'kotly na pelety' }] },
  },
  {
    id: 'fackov', rad: 'microflex-primo-duo-6-bar', kategoria: 'vykurovanie',
    fotky: ['fackov-2.jpg', 'fackov-3.jpg', 'fackov-1.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-slovakia-single-family',
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
    nazov: 'Nové vykurovanie základnej školy v Lehote pri Nitre', miesto: 'Lehota pri Nitre, Slovensko', kedy: 'december 2023',
    perex: 'Starý oceľový rozvod v podzemnom kanáli praskol 3. decembra 2023. Hneď po poruche ho nahradilo potrubie Microflex.',
    fakty: [['Potrubie', 'Microflex UNO PRIMO 125/63 × 5,8'], ['Dĺžka', '19,5 m'], ['Škola', '164 žiakov, 17 učiteľov']],
    realizacia: 'Dodávateľ: TECHINS s. r. o., Nitra.',
    scena: { fotka: 'skola-2.jpg', koty: [{ x: 63, y: 48, l: 10, smer: 'dole-vpravo', smerM: 'dole-vlavo', hodnota: '19,5 m', text: 'Microflex UNO PRIMO 125/63 × 5,8' }] },
  },
  {
    id: 'orange', rad: 'microflex-uno-6-bar', kategoria: 'vykurovanie',
    fotky: ['orange-2.jpg', 'orange-4.jpg', 'orange-6.jpg', 'orange-3.jpg', 'orange-5.jpg'],
    zdroj: 'https://www.watts.eu/sk/references/microflex-in-orange-military-base',
    nazov: 'Rozvod tepla na vojenskej základni v Orange', miesto: 'Orange, Francúzsko', kedy: 'október 2022',
    perex: 'Staré oceľové potrubia, ktoré viedli teplú vodu z hlavnej kotolne do budov areálu, nahradilo asi 800 metrov potrubia Microflex.',
    fakty: [['Potrubie', 'Microflex UNO, priemer 63, 75 a 90 mm'], ['Dĺžka', 'asi 800 m'], ['Dodávka', 'potrubie a príslušenstvo']],
    realizacia: 'Realizácia: Fauché, údržba budov.',
    scena: { fotka: 'orange-5-scena.jpg', koty: [
      { x: 41, y: 87, l: 15, smer: 'hore-vlavo', hodnota: 'Ø 63 až 90 mm', text: 'Microflex UNO' },
      { x: 60.5, y: 54, l: 13, smer: 'hore-vpravo', smerM: 'hore-vlavo', hodnota: 'asi 800 m', text: 'z kotolne do budov areálu' },
    ] },
  },
];
/** Kóty v češtine: tie isté body, iný text. */
const kotyCs = (r: Referencia, texty: string[]): Referencia['scena'] => r.scena && { ...r.scena, koty: r.scena.koty.map((k, i) => ({ ...k, text: texty[i] ?? k.text })) };

const cs: Referencia[] = [
  { ...sk[0],
    nazov: 'Rozvod tepla pro obytný soubor v Považské Bystrici', miesto: 'Považská Bystrica, Slovensko', kedy: 'dodávky 12/2022 až 02/2023',
    perex: 'Kompletní topný rozvod z předizolovaného potrubí Microflex pro 30 rodinných domů a jeden bytový dům, napojený na kotelnu s kotli na pelety.',
    fakty: [['Napojené budovy', '30 rodinných domů a 1 bytový dům'], ['Zdroj tepla', 'kotelna, 2 kotle ETA na pelety po 350 kW'], ['Revizní šachty', '4'], ['Dodávka', 'potrubí Microflex, pevné body, těsnění a systémové příslušenství']],
    realizacia: 'Nabídku a dodávku zajistila Ohrievacia Technika, s. r. o., provozovatel tohoto webu, s podporou Watts.',
    scena: kotyCs(sk[0], ['kotle na pelety']) },
  { ...sk[1],
    nazov: 'Rodinný dům s garáží ve Fačkově', miesto: 'Fačkov, Slovensko', kedy: 'listopad 2024',
    perex: 'Rozvod topné vody z kotle na pelety do rodinného domu a do garáže s dílnou, která stojí 15 metrů od domu.',
    fakty: [['Potrubí', 'Microflex PRIMO DUO 125/2 × 25'], ['Délka', '48 m'], ['Budovy', 'dům 255 m², garáž s dílnou 100 m²'], ['Zdroj tepla', 'kotel na pelety']],
    realizacia: 'Dodavatel: INSTA PL s. r. o., Prievidza.' },
  { ...sk[2],
    nazov: 'Nové vytápění základní školy v Lehotě pri Nitre', miesto: 'Lehota pri Nitre, Slovensko', kedy: 'prosinec 2023',
    perex: 'Starý ocelový rozvod v podzemním kanálu praskl 3. prosince 2023. Hned po poruše ho nahradilo potrubí Microflex.',
    fakty: [['Potrubí', 'Microflex UNO PRIMO 125/63 × 5,8'], ['Délka', '19,5 m'], ['Škola', '164 žáků, 17 učitelů']],
    realizacia: 'Dodavatel: TECHINS s. r. o., Nitra.' },
  { ...sk[3],
    nazov: 'Rozvod tepla na vojenské základně v Orange', miesto: 'Orange, Francie', kedy: 'říjen 2022',
    perex: 'Staré ocelové potrubí, které vedlo teplou vodu z hlavní kotelny do budov areálu, nahradilo asi 800 metrů potrubí Microflex.',
    fakty: [['Potrubí', 'Microflex UNO, průměr 63, 75 a 90 mm'], ['Délka', 'asi 800 m'], ['Dodávka', 'potrubí a příslušenství']],
    realizacia: 'Realizace: Fauché, údržba budov.',
    scena: kotyCs(sk[3], ['Microflex UNO', 'z kotelny do budov areálu']) },
];

export const referencie = (lang: Lang) => (lang === 'cs' ? cs : sk);
