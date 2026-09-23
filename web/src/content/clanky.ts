import type { Lang } from '../i18n/ui';

/**
 * Články poradne. Každé číslo je z katalógu Watts Microflex (slovenské vydanie); strany sú v `strany`.
 * Bloky: p = odsek, kroky = číslovaný postup, zoznam = odrážky, tabulka = hlavičky a riadky, fakty = dvojice.
 */
export type Blok =
  | { p: string }
  | { kroky: [string, string][] }
  | { zoznam: string[] }
  | { tabulka: { nadpis?: string; hlavicky: string[]; riadky: string[][]; pozn?: string } }
  | { fakty: [string, string][] };
export interface Clanok {
  slug: string; nazov: string; perex: string; obraz: string; obrazAlt: string; strany: string; minut: number;
  sekcie: { h: string; bloky: Blok[] }[];
  suvisiace: { text: string; kam: 'vyber' | 'stiahnut' | 'firmy' | 'potrubia' | 'prislusenstvo' | 'spojky' }[];
}

const sk: Clanok[] = [
  {
    slug: 'ako-vybrat-predizolovane-potrubie', obraz: 'rodina-potrubi.png', obrazAlt: 'Rady potrubia Microflex vedľa seba: UNO, DUO, QUADRO a COOL', strany: '6 až 18, 39 a 40', minut: 5,
    nazov: 'Ako vybrať predizolované potrubie',
    perex: 'Médium, počet rúr v plášti, izolácia a dimenzia. Štyri rozhodnutia, ktoré pri potrubí Microflex stačí urobiť v tomto poradí.',
    sekcie: [
      { h: 'Najprv médium', bloky: [
        { p: 'Každý systém Microflex má nosnú rúru pre iné médium. Od nej sa odvíja tlak a teplota, ktoré potrubie znesie.' },
        { tabulka: { hlavicky: ['Médium', 'Rady', 'Nosná rúra', 'Tlak a teplota'], riadky: [
          ['Vykurovacia voda', 'UNO, DUO, UNO PRIMO, PRIMO DUO', 'PE-Xa, SDR 11, s kyslíkovou bariérou', '6 bar, do 95 °C'],
          ['Teplá a studená pitná voda', 'UNO, DUO a PRIMO DUO sanita', 'PE-Xa, SDR 7,4', '10 bar, do 95 °C'],
          ['Vykurovanie aj teplá voda', 'QUADRO', '2 rúry vykurovacie a 2 sanitárne', '6 a 10 bar, do 95 °C'],
          ['Studená a chladená voda', 'COOL, COOL DUO, COOL s vyhrievacím káblom', 'PE 100, SDR 11', '16 bar, −10 až 25 °C'],
          ['Tepelné čerpadlo', 'HP', 'PE-Xa a 2 chráničky na káble', 'PN 6, SDR 11'],
        ], pozn: 'Katalóg Watts Microflex, s. 6 až 18.' } },
      ] },
      { h: 'Jedna rúra, alebo dve v jednom plášti', bloky: [
        { p: 'UNO má v plášti jednu nosnú rúru, DUO dve. Pre prípojku domu z kotolne alebo od tepelného čerpadla je najčastejšou voľbou DUO: prívod aj spiatočka ležia v jednom výkope a pokladá sa jeden kotúč.' },
        { p: 'UNO sa oplatí pri veľkých výkonoch, keď treba rúru nad 63 mm, alebo keď sa prívod a spiatočka vedú inou trasou. QUADRO vedie štyri rúry naraz: vykurovanie aj teplú vodu s cirkuláciou do vedľajšej budovy.' },
      ] },
      { h: 'Štandardná, alebo zosilnená izolácia', bloky: [
        { p: 'Tá istá nosná rúra sa dodáva v dvoch veľkostiach plášťa. Zosilnená izolácia má väčší plášť a menšie tepelné straty, štandardná (rady PRIMO) je ľahšia, ohybnejšia a zmestí sa do užšieho výkopu. Napríklad rúra 63 mm leží v plášti 125 mm so štandardnou izoláciou a v plášti 160 mm so zosilnenou.' },
        { p: 'Pri dlhej trase alebo celoročnej prevádzke rozhodujú tepelné straty, pri krátkej prípojke a stiesnenom výkope ohybnosť a menší plášť.' },
      ] },
      { h: 'Dimenzia podľa výkonu', bloky: [
        { p: 'Katalóg uvádza pri každej vykurovacej dimenzii orientačný prenášaný výkon pri teplote vody 80 °C a rozdiele 20 K. Pre rad UNO:' },
        { tabulka: { hlavicky: ['Nosná rúra', 'DN', 'Výkon'], riadky: [
          ['25 × 2,3 mm', '20', '~30 kW'], ['32 × 2,9 mm', '25', '~60 kW'], ['40 × 3,7 mm', '32', '~90 kW'], ['50 × 4,6 mm', '40', '~140 kW'], ['63 × 5,8 mm', '50', '~220 kW'],
          ['75 × 6,8 mm', '61', '~330 kW'], ['90 × 8,2 mm', '72', '~480 kW'], ['110 × 10,0 mm', '90', '~700 kW'], ['125 × 11,4 mm', '102', '~900 kW'],
        ], pozn: 'Katalóg Watts Microflex, s. 8. Pri zosilnenej izolácii a malom plášti uvádza katalóg pre niektoré dimenzie nižší výkon.' } },
        { p: 'Pri inom teplotnom spáde alebo dlhej trase treba overiť prietok a tlakovú stratu. Katalóg má na s. 39 a 40 tabuľky rýchlosti prúdenia a tlakovej straty v Pa/m pre každú rúru od 25 do 125 mm.' },
      ] },
    ],
    suvisiace: [{ text: 'Sprievodca výberom podľa výkonu', kam: 'vyber' }, { text: 'Všetky potrubia a rady', kam: 'potrubia' }],
  },
  {
    slug: 'pokladka-potrubia-microflex', obraz: 'kotuc.jpg', obrazAlt: 'Kotúč potrubia Microflex so sťahovacími páskami', strany: '36 a 37', minut: 4,
    nazov: 'Pokládka potrubia Microflex krok za krokom',
    perex: 'Od kotúča pri výkope po zásyp. Postup, časy a pravidlá pokládky podľa pokynov výrobcu.',
    sekcie: [
      { h: 'Postup pri výkope', bloky: [
        { p: 'Vykopanú zeminu uložte pozdĺž výkopu. Potrubie sa dá rozvíjať z ktorejkoľvek strany.' },
        { kroky: [
          ['Kotúč k výkopu', 'Umiestnite kotúč pozdĺž výkopu, odstráňte baliacu fóliu a koniec rúry dajte na miesto napojenia.'],
          ['Rozvinúť', 'Odrežte krajné sťahovacie pásky a rúru rolujte pozdĺž alebo priamo do výkopu. Postupne strihajte pásky uprostred a vnútri a potrubie úplne rozviňte.'],
          ['Krytky a spojky', 'Na konce nasaďte protiprachové alebo zmršťovacie krytky a pripojte spojky.'],
          ['Tlaková skúška', 'Urobte tlakovú skúšku a vyplňte protokol. Až potom zasypávajte.'],
          ['Zásyp', 'Výkop čiastočne zasypte prvou vrstvou, položte výstražnú pásku a zasypte celý.'],
        ] },
      ] },
      { h: 'Pravidlá pokládky', bloky: [
        { zoznam: [
          'Potrubie ukladajte do pieskového lôžka a zo dna výkopu odstráňte ostré predmety.',
          'Pri manipulácii držte nosnú rúru, nie vonkajší plášť.',
          'Dodržte najmenší polomer ohybu z tabuľky radu.',
          'Potrubie ukladajte mierne hadovito.',
          'Zakreslite trasu vrátane odbočiek a prípojok a plán si ponechajte.',
        ] },
        { fakty: [['Hĺbka uloženia', '0,5 až 6 m'], ['Zaťaženie', 'až 60 t'], ['Smernica', 'ATV-DVWK-A127 pre podzemné potrubia']] },
      ] },
      { h: 'Koľko to trvá', bloky: [
        { p: 'Časy sú približné a nezahŕňajú dopravu ani výkop. Záleží na prekážkach, náradí a počasí.' },
        { tabulka: { nadpis: 'Pokládka 100 m potrubia', hlavicky: ['Rad', 'Nosná rúra', 'Čas', 'Pracovníci'], riadky: [
          ['UNO', '25 a 32 mm', '40 min', '3'], ['UNO', '40 a 50 mm', '60 min', '3'], ['UNO', '63 mm', '60 min', '4'], ['UNO', '75 mm', '75 min', '4'], ['UNO', '90 a 110 mm', '90 min', '5'], ['UNO', '125 mm', '90 min', '6'],
          ['DUO', '25 a 32 mm', '40 min', '3'], ['DUO', '40 a 50 mm', '60 min', '3'], ['DUO', '63 mm', '60 min', '4'], ['QUADRO', '25 mm', '60 min', '4'],
        ] } },
        { tabulka: { nadpis: 'Spoje a príslušenstvo, jeden pracovník', hlavicky: ['Diel', 'Čas'], riadky: [
          ['Spojka PE-X × PE-X do DN 50', '15 min'], ['Spojka PE-X × PE-X od DN 63 do DN 100', '20 min'], ['T-kus PE-X do DN 50', '30 min'], ['T-kus PE-X od DN 63 do DN 100', '40 min'],
          ['Izolačná sada Ø 125 až 200, typ MM a MH', '20 min'], ['Izolačná sada Ø 125 až 200, typ MT a MBR', '30 min'], ['Zmršťovacia krytka Ø 125 až 200 mm', '15 min'],
        ], pozn: 'Katalóg Watts Microflex, s. 36.' } },
      ] },
      { h: 'Veľkosť kotúča', bloky: [
        { p: 'Celá rolka má 100 m. Pri pláne dopravy a skladu počítajte s týmito rozmermi kotúča:' },
        { tabulka: { hlavicky: ['Plášť', 'Kotúč 100 m, šírka', 'Kotúč 100 m, priemer'], riadky: [['75 mm', '0,30 m', '2,10 m'], ['90 mm', '0,50 m', '2,10 m'], ['125 mm', '0,70 m', '2,10 m'], ['160 mm', '0,80 m', '2,35 m'], ['200 mm', '1,40 m', '2,35 m']], pozn: 'Katalóg Watts Microflex, s. 36.' } },
      ] },
    ],
    suvisiace: [{ text: 'Spojky a príslušenstvo na trasu', kam: 'prislusenstvo' }, { text: 'Katalóg a výkresy', kam: 'stiahnut' }],
  },
  {
    slug: 'tlakova-skuska-podla-din-1988', obraz: 'vykop-spojky.jpg', obrazAlt: 'Spoje potrubia Microflex vo výkope pred zasypaním', strany: '41', minut: 3,
    nazov: 'Tlaková skúška podľa DIN 1988-2',
    perex: 'Skúška sa robí pred zasypaním a má dve časti. Podľa výrobcu je jej správne vykonanie a protokol podmienkou záruky.',
    sekcie: [
      { h: 'Pred skúškou', bloky: [
        { p: 'Položené potrubie naplňte vodou tak, aby v ňom nezostali vzduchové bubliny. Skúška sa robí pred zasypaním výkopu, v dvoch častiach: predbežná a hlavná.' },
      ] },
      { h: 'Predbežná skúška', bloky: [
        { kroky: [
          ['Skúšobný tlak', 'Natlakujte na 1,5-násobok prípustného prevádzkového tlaku.'],
          ['Dotlakovanie', 'Počas 30 minút tlak dvakrát obnovte, v intervaloch 10 minút.'],
          ['Kontrola', 'Po ďalších najmenej 30 minútach pri plnom tlaku nesmie tlak klesnúť o viac ako 0,6 bar (0,1 bar každých 5 minút). Nikde nesmie byť netesnosť.'],
        ] },
      ] },
      { h: 'Hlavná skúška', bloky: [
        { p: 'Nadväzuje hneď na predbežnú skúšku a trvá 2 hodiny. Tlak zaznamenaný po predbežnej skúške nesmie za ten čas klesnúť o viac ako 0,2 bar.' },
        { fakty: [['Skúšobný tlak', '1,5 × prevádzkový tlak'], ['Predbežná skúška', 'pokles najviac 0,6 bar'], ['Hlavná skúška', '2 h, pokles najviac 0,2 bar']] },
      ] },
      { h: 'Po skúške', bloky: [
        { p: 'Výrobca odporúča systém na jednu hodinu zohriať na 85 °C a priebežne kontrolovať spoje. Pred konečnou kontrolou všetkých spojov ho nechajte vychladnúť na 20 °C.' },
        { p: 'Vyplnený a podpísaný protokol o skúške sa posiela výrobcovi. Formulár protokolu je v katalógu na s. 41.' },
      ] },
    ],
    suvisiace: [{ text: 'Katalóg s protokolom skúšky', kam: 'stiahnut' }, { text: 'Poslať dopyt na projekt', kam: 'firmy' }],
  },
  {
    slug: 'tepelne-straty-predizolovaneho-potrubia', obraz: 'rez-render.jpg', obrazAlt: 'Rez potrubím Microflex: nosná rúra, izolácia z PE-X peny a plášť', strany: '5 a 38', minut: 3,
    nazov: 'Tepelné straty predizolovaného potrubia',
    perex: 'Ako z grafov v katalógu zistiť, koľko tepla potrubie stratí na meter, a z akých hodnôt výrobca vychádza.',
    sekcie: [
      { h: 'Rozdiel teplôt', bloky: [
        { p: 'Tepelná strata na meter potrubia závisí od rozdielu teploty média a pôdy. Katalóg ho počíta takto:' },
        { fakty: [['UNO', 'ΔT = teplota prívodu − teplota pôdy'], ['DUO', 'ΔT = (teplota prívodu + teplota spiatočky) / 2 − teplota pôdy']] },
        { p: 'S vypočítaným ΔT nájdete v grafe pre daný rad (UNO, PRIMO UNO, DUO, PRIMO DUO) stratu vo W/m pre každú dimenziu.' },
      ] },
      { h: 'Z čoho výrobca vychádza', bloky: [
        { fakty: [['Izolácia, λ', '0,0335 W/m·K pri 10 °C, 0,0372 W/m·K pri 40 °C'], ['Pôda, λ', '1 W/m·K'], ['Rúra PE-Xa, λ', '0,35 W/m·K'], ['Krytie nad potrubím', '80 cm']] },
        { p: 'Izolácia z peny PE-X má uzavreté bunky a nasiakavosť pod 1 %, preto si podľa výrobcu drží izolačné vlastnosti po celú životnosť.' },
      ] },
      { h: 'Príklad z katalógu', bloky: [
        { p: 'Vo vykurovacej sieti s režimom 80/60 °C klesne na 100 m potrubia MD20063C (DUO, rúry 63 mm) teplota pri najväčšom výkone 235 kW len o 0,2 °C.' },
      ] },
    ],
    suvisiace: [{ text: 'Katalóg s grafmi tepelných strát', kam: 'stiahnut' }, { text: 'Sprievodca výberom podľa výkonu', kam: 'vyber' }],
  },
];

const cs: Clanok[] = [
  {
    ...sk[0], slug: 'jak-vybrat-predizolovane-potrubi', obrazAlt: 'Řady potrubí Microflex vedle sebe: UNO, DUO, QUADRO a COOL', strany: '6 až 18, 39 a 40',
    nazov: 'Jak vybrat předizolované potrubí',
    perex: 'Médium, počet trubek v plášti, izolace a dimenze. Čtyři rozhodnutí, která u potrubí Microflex stačí udělat v tomto pořadí.',
    sekcie: [
      { h: 'Nejdřív médium', bloky: [
        { p: 'Každý systém Microflex má nosnou trubku pro jiné médium. Od ní se odvíjí tlak a teplota, které potrubí snese.' },
        { tabulka: { hlavicky: ['Médium', 'Řady', 'Nosná trubka', 'Tlak a teplota'], riadky: [
          ['Topná voda', 'UNO, DUO, UNO PRIMO, PRIMO DUO', 'PE-Xa, SDR 11, s kyslíkovou bariérou', '6 bar, do 95 °C'],
          ['Teplá a studená pitná voda', 'UNO, DUO a PRIMO DUO sanita', 'PE-Xa, SDR 7,4', '10 bar, do 95 °C'],
          ['Vytápění i teplá voda', 'QUADRO', '2 trubky topné a 2 sanitární', '6 a 10 bar, do 95 °C'],
          ['Studená a chlazená voda', 'COOL, COOL DUO, COOL s topným kabelem', 'PE 100, SDR 11', '16 bar, −10 až 25 °C'],
          ['Tepelné čerpadlo', 'HP', 'PE-Xa a 2 chráničky na kabely', 'PN 6, SDR 11'],
        ], pozn: 'Katalog Watts Microflex, s. 6 až 18.' } },
      ] },
      { h: 'Jedna trubka, nebo dvě v jednom plášti', bloky: [
        { p: 'UNO má v plášti jednu nosnou trubku, DUO dvě. Pro přípojku domu z kotelny nebo od tepelného čerpadla je nejčastější volbou DUO: přívod i zpátečka leží v jednom výkopu a pokládá se jeden kotouč.' },
        { p: 'UNO se vyplatí u velkých výkonů, kdy je třeba trubka nad 63 mm, nebo když se přívod a zpátečka vedou jinou trasou. QUADRO vede čtyři trubky najednou: vytápění i teplou vodu s cirkulací do vedlejší budovy.' },
      ] },
      { h: 'Standardní, nebo zesílená izolace', bloky: [
        { p: 'Stejná nosná trubka se dodává ve dvou velikostech pláště. Zesílená izolace má větší plášť a menší tepelné ztráty, standardní (řady PRIMO) je lehčí, ohebnější a vejde se do užšího výkopu. Například trubka 63 mm leží v plášti 125 mm se standardní izolací a v plášti 160 mm se zesílenou.' },
        { p: 'U dlouhé trasy nebo celoročního provozu rozhodují tepelné ztráty, u krátké přípojky a stísněného výkopu ohebnost a menší plášť.' },
      ] },
      { h: 'Dimenze podle výkonu', bloky: [
        { p: 'Katalog uvádí u každé topné dimenze orientační přenášený výkon při teplotě vody 80 °C a rozdílu 20 K. Pro řadu UNO:' },
        { tabulka: { hlavicky: ['Nosná trubka', 'DN', 'Výkon'], riadky: sk[0].sekcie[3].bloky.flatMap((b) => ('tabulka' in b ? b.tabulka.riadky : [])), pozn: 'Katalog Watts Microflex, s. 8. U zesílené izolace a malého pláště uvádí katalog pro některé dimenze nižší výkon.' } },
        { p: 'Při jiném teplotním spádu nebo dlouhé trase je třeba ověřit průtok a tlakovou ztrátu. Katalog má na s. 39 a 40 tabulky rychlosti proudění a tlakové ztráty v Pa/m pro každou trubku od 25 do 125 mm.' },
      ] },
    ],
    suvisiace: [{ text: 'Průvodce výběrem podle výkonu', kam: 'vyber' }, { text: 'Všechna potrubí a řady', kam: 'potrubia' }],
  },
  {
    ...sk[1], slug: 'pokladka-potrubi-microflex', obrazAlt: 'Kotouč potrubí Microflex se stahovacími páskami',
    nazov: 'Pokládka potrubí Microflex krok za krokem',
    perex: 'Od kotouče u výkopu po zásyp. Postup, časy a pravidla pokládky podle pokynů výrobce.',
    sekcie: [
      { h: 'Postup u výkopu', bloky: [
        { p: 'Vykopanou zeminu uložte podél výkopu. Potrubí lze rozvíjet z kterékoli strany.' },
        { kroky: [
          ['Kotouč k výkopu', 'Umístěte kotouč podél výkopu, odstraňte balicí fólii a konec trubky dejte na místo napojení.'],
          ['Rozvinout', 'Odřízněte krajní stahovací pásky a trubku rolujte podél nebo přímo do výkopu. Postupně stříhejte pásky uprostřed a uvnitř a potrubí úplně rozviňte.'],
          ['Krytky a spojky', 'Na konce nasaďte protiprachové nebo smršťovací krytky a připojte spojky.'],
          ['Tlaková zkouška', 'Proveďte tlakovou zkoušku a vyplňte protokol. Teprve potom zasypávejte.'],
          ['Zásyp', 'Výkop částečně zasypte první vrstvou, položte výstražnou pásku a zasypte celý.'],
        ] },
      ] },
      { h: 'Pravidla pokládky', bloky: [
        { zoznam: [
          'Potrubí ukládejte do pískového lože a ze dna výkopu odstraňte ostré předměty.',
          'Při manipulaci držte nosnou trubku, ne vnější plášť.',
          'Dodržte nejmenší poloměr ohybu z tabulky řady.',
          'Potrubí ukládejte mírně hadovitě.',
          'Zakreslete trasu včetně odboček a přípojek a plán si ponechte.',
        ] },
        { fakty: [['Hloubka uložení', '0,5 až 6 m'], ['Zatížení', 'až 60 t'], ['Směrnice', 'ATV-DVWK-A127 pro podzemní potrubí']] },
      ] },
      { h: 'Kolik to trvá', bloky: [
        { p: 'Časy jsou přibližné a nezahrnují dopravu ani výkop. Záleží na překážkách, nářadí a počasí.' },
        { tabulka: { nadpis: 'Pokládka 100 m potrubí', hlavicky: ['Řada', 'Nosná trubka', 'Čas', 'Pracovníci'], riadky: (sk[1].sekcie[2].bloky[1] as { tabulka: { riadky: string[][] } }).tabulka.riadky } },
        { tabulka: { nadpis: 'Spoje a příslušenství, jeden pracovník', hlavicky: ['Díl', 'Čas'], riadky: [
          ['Spojka PE-X × PE-X do DN 50', '15 min'], ['Spojka PE-X × PE-X od DN 63 do DN 100', '20 min'], ['T-kus PE-X do DN 50', '30 min'], ['T-kus PE-X od DN 63 do DN 100', '40 min'],
          ['Izolační sada Ø 125 až 200, typ MM a MH', '20 min'], ['Izolační sada Ø 125 až 200, typ MT a MBR', '30 min'], ['Smršťovací krytka Ø 125 až 200 mm', '15 min'],
        ], pozn: 'Katalog Watts Microflex, s. 36.' } },
      ] },
      { h: 'Velikost kotouče', bloky: [
        { p: 'Celá role má 100 m. Při plánu dopravy a skladu počítejte s těmito rozměry kotouče:' },
        { tabulka: { hlavicky: ['Plášť', 'Kotouč 100 m, šířka', 'Kotouč 100 m, průměr'], riadky: (sk[1].sekcie[3].bloky[1] as { tabulka: { riadky: string[][] } }).tabulka.riadky, pozn: 'Katalog Watts Microflex, s. 36.' } },
      ] },
    ],
    suvisiace: [{ text: 'Spojky a příslušenství na trasu', kam: 'prislusenstvo' }, { text: 'Katalog a výkresy', kam: 'stiahnut' }],
  },
  {
    ...sk[2], slug: 'tlakova-zkouska-podle-din-1988', obrazAlt: 'Spoje potrubí Microflex ve výkopu před zasypáním',
    nazov: 'Tlaková zkouška podle DIN 1988-2',
    perex: 'Zkouška se dělá před zasypáním a má dvě části. Podle výrobce je její správné provedení a protokol podmínkou záruky.',
    sekcie: [
      { h: 'Před zkouškou', bloky: [{ p: 'Položené potrubí naplňte vodou tak, aby v něm nezůstaly vzduchové bubliny. Zkouška se dělá před zasypáním výkopu, ve dvou částech: předběžná a hlavní.' }] },
      { h: 'Předběžná zkouška', bloky: [{ kroky: [
        ['Zkušební tlak', 'Natlakujte na 1,5násobek přípustného provozního tlaku.'],
        ['Dotlakování', 'Během 30 minut tlak dvakrát obnovte, v intervalech 10 minut.'],
        ['Kontrola', 'Po dalších nejméně 30 minutách při plném tlaku nesmí tlak klesnout o více než 0,6 bar (0,1 bar každých 5 minut). Nikde nesmí být netěsnost.'],
      ] }] },
      { h: 'Hlavní zkouška', bloky: [
        { p: 'Navazuje hned na předběžnou zkoušku a trvá 2 hodiny. Tlak zaznamenaný po předběžné zkoušce nesmí za tu dobu klesnout o více než 0,2 bar.' },
        { fakty: [['Zkušební tlak', '1,5 × provozní tlak'], ['Předběžná zkouška', 'pokles nejvýše 0,6 bar'], ['Hlavní zkouška', '2 h, pokles nejvýše 0,2 bar']] },
      ] },
      { h: 'Po zkoušce', bloky: [
        { p: 'Výrobce doporučuje systém na jednu hodinu zahřát na 85 °C a průběžně kontrolovat spoje. Před konečnou kontrolou všech spojů ho nechte vychladnout na 20 °C.' },
        { p: 'Vyplněný a podepsaný protokol o zkoušce se posílá výrobci. Formulář protokolu je v katalogu na s. 41.' },
      ] },
    ],
    suvisiace: [{ text: 'Katalog s protokolem zkoušky', kam: 'stiahnut' }, { text: 'Poslat poptávku na projekt', kam: 'firmy' }],
  },
  {
    ...sk[3], slug: 'tepelne-ztraty-predizolovaneho-potrubi', obrazAlt: 'Řez potrubím Microflex: nosná trubka, izolace z PE-X pěny a plášť',
    nazov: 'Tepelné ztráty předizolovaného potrubí',
    perex: 'Jak z grafů v katalogu zjistit, kolik tepla potrubí ztratí na metr, a z jakých hodnot výrobce vychází.',
    sekcie: [
      { h: 'Rozdíl teplot', bloky: [
        { p: 'Tepelná ztráta na metr potrubí závisí na rozdílu teploty média a půdy. Katalog ho počítá takto:' },
        { fakty: [['UNO', 'ΔT = teplota přívodu − teplota půdy'], ['DUO', 'ΔT = (teplota přívodu + teplota zpátečky) / 2 − teplota půdy']] },
        { p: 'S vypočteným ΔT najdete v grafu pro danou řadu (UNO, PRIMO UNO, DUO, PRIMO DUO) ztrátu ve W/m pro každou dimenzi.' },
      ] },
      { h: 'Z čeho výrobce vychází', bloky: [
        { fakty: [['Izolace, λ', '0,0335 W/m·K při 10 °C, 0,0372 W/m·K při 40 °C'], ['Půda, λ', '1 W/m·K'], ['Trubka PE-Xa, λ', '0,35 W/m·K'], ['Krytí nad potrubím', '80 cm']] },
        { p: 'Izolace z pěny PE-X má uzavřené buňky a nasákavost pod 1 %, proto si podle výrobce drží izolační vlastnosti po celou životnost.' },
      ] },
      { h: 'Příklad z katalogu', bloky: [{ p: 'V topné síti s režimem 80/60 °C klesne na 100 m potrubí MD20063C (DUO, trubky 63 mm) teplota při největším výkonu 235 kW jen o 0,2 °C.' }] },
    ],
    suvisiace: [{ text: 'Katalog s grafy tepelných ztrát', kam: 'stiahnut' }, { text: 'Průvodce výběrem podle výkonu', kam: 'vyber' }],
  },
];

export const clanky = (lang: Lang) => (lang === 'cs' ? cs : sk);
/** Dvojice článku v druhom jazyku (rovnaké poradie v zozname). */
export const alternatyClanku = (i: number) => ({ sk: `/poradna/${sk[i].slug}/`, cs: `/cs/poradna/${cs[i].slug}/` });
