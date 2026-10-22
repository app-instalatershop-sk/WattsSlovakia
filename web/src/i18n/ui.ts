/** Texty rozhrania v slovenčine a češtine. Obsah katalógu (názvy, popisy) je v dátach, tu je len rozhranie. */
export type Lang = 'sk' | 'cs';
export const LANGS: Lang[] = ['sk', 'cs'];
export const DEFAULT_LANG: Lang = 'sk';
export const LOCALE: Record<Lang, string> = { sk: 'sk-SK', cs: 'cs-CZ' };
export const ESHOP = 'https://www.instalatershop.sk/predizolovane-potrubie-microflex/';
export const ESHOP_SEARCH = 'https://www.instalatershop.sk/vyhledavani/?string=';
/** Katalóg Microflex od výrobcu, slovenské vydanie (19 MB). Overené 23. 9. 2026: HTTP 200, otvára sa v prehliadači. */
export const KATALOG_PDF = 'https://www.watts.eu/dfsmedia/0533DBBA-1771-4B1A-B581-AB07A4CBB521/640504-source/639239694230000000/MICROFLEX_SK_PDF.pdf';

const sk = {
  site: { name: 'Microflex Slovensko', sub: 'Slovensko', tagline: 'Predizolované ohybné potrubie Microflex pre Slovensko' },
  nav: { potrubia: 'Potrubia', vyber: 'Výber potrubia', stiahnut: 'Na stiahnutie', firmy: 'Pre firmy', poradna: 'Poradňa', referencie: 'Referencie', kontakt: 'Kontakt', podklady: 'Podklady', eshop: 'E-shop', menu: 'Menu', zavriet: 'Zavrieť', hlavna: 'Hlavná navigácia', domov: 'Domov', celyKatalog: 'Celý katalóg potrubí', katalogPdf: 'Katalóg PDF, 19 MB' },
  search: { placeholder: 'Obj. číslo, rad', label: 'Hľadať v katalógu', button: 'Hľadať', vsetky: 'Všetky výsledky', nic: 'Nič sme nenašli. Skúste obj. číslo, rad alebo sprievodcu výberom.', ciastocne: 'Presnú zhodu sme nenašli. Najbližšie:', sprievodca: 'Sprievodca výberom potrubia', skupiny: { rad: 'Rad', kod: 'Obj. číslo', diel: 'Diel', stranka: 'Stránka' } },
  partner: { kratke: 'Oficiálny partner', veta: 'Oficiálny partner Watts pre Microflex na Slovensku', vyrobca: 'Výrobca' },
  jazyk: { prepnut: 'Jazyk', sk: 'Slovensky', cs: 'Česky' },
  crumbs: { label: 'Kde ste' },
  common: {
    zobrazit: 'Zobraziť', zobrazitRady: 'Zobraziť rady', zobrazitRad: 'Zobraziť rad', zobrazitVarianty: 'Zobraziť varianty',
    podlaKatalogu: 'podľa katalógu', rozmeryVKatalogu: 'Rozmery v katalógu', doEshopu: 'Do e-shopu', kupit: 'Kúpiť v e-shope',
    vybratDimenziu: 'Vybrať dimenziu', od: 'od', az: 'až', a: 'a', fotkaVyrobcu: 'Fotka výrobcu', renderVyrobcu: 'Render výrobcu.',
    zdroj: 'Zdroj: katalóg Watts Microflex, slovenské vydanie, stav k', strankaVyrobcu: 'Stránka výrobcu', nie: 'nie',
    objCisel: (n: number) => `${n} obj. čísel`,
  },
  domov: {
    title: 'Microflex Slovensko',
    description: 'Predizolované ohybné potrubie Microflex pre vykurovanie, teplú a studenú vodu, chladenie a tepelné čerpadlá. Katalóg, obj. čísla, podklady a predaj cez instalatershop.sk.',
    h1: 'Predizolované potrubie, ktoré sa ohne okolo prekážky.',
    lead: 'Microflex vedie teplo, teplú aj studenú vodu a chlad pod zemou. Od kotolne alebo tepelného čerpadla až k domu v jednom kuse z kotúča, bez spojov vo výkope.',
    vybrat: 'Vybrať potrubie', katalogPdf: 'Katalóg PDF, 19 MB', skladom: 'Skladom a predaj cez instalatershop.sk',
    heroAlt: 'Výkop s uloženým potrubím Microflex: modré zvlnené rúry v piesku, napojené na spojky',
    prierezAlt: 'Skutočný rez potrubím Microflex DUO na kotúči: modrý zvlnený plášť, tmavosivá izolácia a dve žlté rúry PE-Xa',
    tagy: [
      ['Zvlnený plášť HDPE', 'uzavreté komory, chráni izoláciu'],
      ['2 × nosná rúra PE-Xa', 'kyslíková bariéra podľa DIN 4726'],
      ['Izolácia z PE-X peny', 'uzavreté bunky, nasiakavosť pod 1 %'],
    ] as [string, string][],
    prierezCap: 'skutočný rez na kotúči', popiskyLabel: 'Popisky k fotke',
    pouzitieH2: 'Na čo potrubie potrebujete?', pouzitieP: 'Vyberte použitie. Ukážeme len rady a dimenzie, ktoré sa naň hodia.',
    pouzitia: [
      { slug: 'vykurovanie', nazov: 'Vykurovanie', text: 'Rozvod tepla od kotolne, kotla na biomasu alebo tepelného čerpadla k domu. Rady UNO a DUO, 6 bar.', pikto: 'rad-duo-kurenie.png' },
      { slug: 'sanita', nazov: 'Teplá a studená voda', text: 'Pitná voda medzi budovami a k vzdialeným odberom. Rady UNO a DUO v sanitárnom vyhotovení, 10 bar.', pikto: 'rad-duo-sanita.png' },
      { slug: 'studena-a-chladena-voda', nazov: 'Chladenie a studená voda', text: 'Chladená a studená voda, aj odpadová voda. Rad COOL, na želanie s vyhrievacím káblom proti zamrznutiu.', pikto: 'rad-cool-uno.png' },
      { slug: 'tepelne-cerpadla', nazov: 'Tepelné čerpadlo', text: 'Prepojenie vonkajšej jednotky s domom v jednom plášti, prívod aj spiatočka. Rad Microflex HP.', pikto: 'rad-hp-tepelne-cerpadlo.png' },
    ],
    katalogH2: 'Katalóg Microflex', katalogP: 'Päť potrubných systémov podľa média a k nim spojky a príslušenstvo. Všetko, čo treba na jeden výkop.',
    precoH2: 'Prečo práve Microflex',
    fakty: [
      ['Polomer ohybu od 0,20 m', 'Potrubie kopíruje výkop, obíde základy aj strom. Menej kolien, menej spojov a menej miest, kde môže niečo tiecť.'],
      ['Jeden plášť, dve alebo štyri rúry', 'DUO vedie prívod aj spiatočku, QUADRO k tomu aj teplú vodu s cirkuláciou v jednej trase. Užší výkop a rýchlejšia pokládka.'],
      ['Rúra PE-Xa, pena PE-X, plášť HDPE', 'Nosná rúra podľa EN ISO 15875 s kyslíkovou bariérou podľa DIN 4726, izolácia s uzavretými bunkami, plášť z HDPE vyrábaný ako uzavreté komory.'],
    ] as [string, string][],
    technickeUdaje: 'Technické údaje radov', rezAlt: 'Rez potrubím Microflex: modrý zvlnený plášť, sivá izolácia a žlté rúry PE-Xa',
    refH2: 'Kde už Microflex leží', refVsetky: 'Všetky referencie',
    b2bH2: 'Pre projektantov, montážne firmy a veľkoobchod',
    b2bP: 'Technické listy, výkresy DWG a DXF, vyhlásenia o zhode a environmentálna deklarácia na jednom mieste. Na projekt pošlite dopyt, ozveme sa s ponukou a dostupnosťou.',
    b2bDopyt: 'Poslať dopyt na projekt', b2bPodklady: 'Podklady na stiahnutie',
    b2bList: [
      ['Technické listy a katalóg', 'PDF pre každý rad, katalóg Microflex 19 MB'],
      ['BIM a CAD', 'DWG a DXF pre UNO, DUO, QUADRO a COOL'],
      ['Vyhlásenia a deklarácie', 'Vyhlásenie o zhode, environmentálna deklarácia EPD platná do 29. 5. 2031'],
      ['Veľkoobchodný kontakt', 'Obchodné oddelenie, telefón a e-mail doplníme'],
    ] as [string, string][],
    produktov: (n: number) => (n === 1 ? '1 produkt' : n >= 2 && n <= 4 ? `${n} produkty` : `${n} produktov`),
  },
  home: {
    heroKicker: 'Predizolované potrubia Microflex®',
    h1a: 'Flexibilné potrubie.', h1b: 'Precízne riešenie.',
    lead: 'Pre vykurovanie, pitnú vodu, chladenie a tepelné čerpadlá.',
    // Hlavná akcia vedie do sprievodcu (rovnako ako položka menu), druhá k dopytu na projekt.
    cta: 'Vybrať potrubie', cta2: 'Dopyt na projekt',
    heroAlt: 'Rez predizolovaným potrubím Microflex so štyrmi rúrami: zvlnený plášť, izolácia a nosné rúry',
    popisy: {
      label: 'Rozmery a vlastnosti potrubia na obrázku',
      plast: 'plášť z HDPE',
      polomer: 'polomer ohybu',
      tlak: (xs: string[]) => `nosné rúry na ${xs.length > 1 ? `${xs.slice(0, -1).join(', ')} alebo ${xs[xs.length - 1]}` : xs[0]} bar`,
    },
    katalogH2: 'Každý projekt má svoje potrubie.',
    rury: (n: number) => (n === 1 ? 'Jedna rúra v plášti' : n === 2 ? 'Dve rúry v plášti' : n === 4 ? 'Štyri rúry v plášti' : `${n} rúry v plášti`),
    plast: 'plášť',
    primo: 'Užší plášť pri tej istej rúre',
    celyKatalog: 'Celý katalóg potrubí',
    dielyH3: 'Spojky a príslušenstvo',
    rodinaH2: 'Päť systémov, jedna rodina.',
    // COOL má nosnú rúru PE 100, nie PE-Xa (katalóg s. 16 až 18). Spoločná je stavba, nie materiál rúry.
    rodinaP: 'UNO a DUO pre vykurovanie a pitnú vodu, QUADRO pre všetko v jednom plášti, COOL pre chlad, HP pre tepelné čerpadlá. Všetky majú rovnakú stavbu z troch vrstiev.',
    rodinaAlt: 'Rodina potrubí Microflex: UNO, DUO, QUADRO a COOL vedľa seba',
    // Rez pod lupou: od jadra po plášť. Zdroj: katalóg Watts s. 8 až 18 a 38, brožúra Watts 2026 s. 2.
    lupyLabel: 'Z čoho je potrubie, od nosnej rúry po plášť',
    lupy: [
      { id: 'rura', nazov: 'Nosná rúra', kluc: 'PE-Xa do 95 °C', text: 'Vedie vykurovaciu, pitnú aj chladenú vodu. PE-Xa podľa EN ISO 15875, pri vykurovaní s kyslíkovou bariérou; na chlad PE 100.' },
      { id: 'pena', nazov: 'Izolácia z PE-X peny', kluc: 'λ 0,0372 W/m·K pri 40 °C', text: 'Drží teplotu média po celej trase. Uzavreté bunky bez freónov, nasiakavosť pod 1 % podľa ISO 2896.' },
      { id: 'plast', nazov: 'Plášť z HDPE', kluc: 'dvojitá stena', text: 'Chráni izoláciu pred vodou, tlakom zeminy aj nárazmi. Zvlnenie s dvojitou stenou dáva potrubiu ohybnosť.' },
    ],
    // Časy a postup: katalóg Watts Microflex, s. 36 (doba inštalácie) a s. 37 (zemné práce).
    pokladkaH2: 'Sto metrov za štyridsať minút.',
    pokladkaP: 'Za toľko podľa katalógu výrobcu položia traja montážnici stometrový kotúč Microflex UNO alebo DUO v menších dimenziách. Bez zvárania, bez predizolovaných kolien a bez špeciálneho náradia.',
    pokladkaAlt: 'Kotúč potrubia Microflex so zvlneným modrým plášťom a sťahovacími páskami',
    krokyLabel: 'Postup pokládky',
    kroky: [
      ['Kotúč k výkopu', 'Kotúč položte pozdĺž výkopu, odstráňte fóliu a koniec rúry dajte na miesto napojenia.'],
      ['Rozvinúť do piesku', 'Postupne strihajte sťahovacie pásky a rúru rozvíjajte do pieskového lôžka, mierne hadovito a s dodržaním polomeru ohybu.'],
      ['Spojky a skúška', 'Konce uzavrite krytkami, pripojte spojky PE-X a urobte tlakovú skúšku s protokolom.'],
      ['Páska a zásyp', 'Zasypte prvú vrstvu, položte výstražnú pásku a výkop zasypte celý.'],
    ] as [string, string][],
    zataz: ['až 60 t', 'unesie potrubie uložené v hĺbke 0,5 až 6 m'] as [string, string],
    pokladkaZdroj: 'Časy sú približné, bez dopravy a výkopu.',
    pokladkaOdkaz: 'Celý postup v katalógu výrobcu',
    // Projekty: veľké stavby s kótami priamo na fotke. Fakty z referencií na watts.eu (content/referencie.ts).
    projektyH2: 'Projekty, ktoré už ležia v zemi.',
    projektyP: 'Rozvody tepla medzi budovami areálov a obytných súborov, od kotolne po poslednú prípojku.',
    projektyVsetky: 'Všetky referencie',
    projektyKoty: 'Údaje o stavbe na fotke',
    projektyViac: 'Celá referencia',
    projekty: {
      orange: {
        kde: 'Orange, Francúzsko, október 2022', h3: '800 metrov namiesto starej oceľovej siete',
        p: 'Staré oceľové potrubie, ktoré viedlo teplú vodu z hlavnej kotolne do budov vojenskej základne, nahradil Microflex UNO.',
        alt: 'Dve potrubia Microflex UNO vedú hadovito výkopom k budovám vojenskej základne v Orange',
      },
      povazska: {
        kde: 'Považská Bystrica, december 2022 až február 2023', h3: '31 budov napojených na jednu kotolňu',
        p: 'Rozvod tepla pre 30 rodinných domov a bytový dom zo spoločnej kotolne na pelety, so štyrmi revíznymi šachtami. Ponuku a dodávku sme zabezpečili s podporou Watts.',
        alt: 'Kotolňa obytného súboru v Považskej Bystrici so zásobníkom peliet a akumulačnými nádržami',
      },
    },
    // Projektová podpora a miesto pre budúci konfigurátor trasy (samostatná etapa).
    podporaH2: 'Pri veľkom projekte s Vami od trasy po dodávku.',
    podporaP: 'Projektantom dodáme podklady, montážnym firmám celý materiál na trasu v jednej ponuke. Pri väčších sieťach pomáha aj technická podpora výrobcu.',
    podporaDopyt: 'Poslať dopyt na projekt', podporaPodklady: 'Podklady na stiahnutie',
    podpora: [
      { h: 'Podklady pre projektantov', p: 'Výkresy DWG a DXF, tabuľky rozmerov a výkonov, tepelné straty, vyhlásenia o zhode a environmentálna deklarácia EPD.', odkaz: 'Na stiahnutie' },
      { h: 'Materiál na celú trasu', p: 'Potrubie, svorné spojky, izolačné sady na spoje pod zemou, prestupy stenou a krytky v jednej ponuke s dostupnosťou.', odkaz: 'Dopyt na projekt' },
    ],
    konfigurator: {
      stav: 'Pripravujeme', h: 'Konfigurátor trasy',
      p: 'Zadáte trasu, dĺžky, odbočky a prestupy. Spočítame potrubie, spojky a príslušenstvo a pripravíme návrh na stiahnutie.',
      odkaz: 'Zatiaľ nám pošlite trasu',
    },
    // Katalóg Watts Microflex s. 3 a 4 (od roku 1994, ISO 9001), s. 8 až 15 (normy rúr), s. 34 (certifikáty).
    istota: 'Microflex vyrába predizolované potrubie od roku 1994, dnes ako značka skupiny Watts. Výroba je certifikovaná podľa ISO 9001, nosné rúry podľa EN ISO 15875 s kyslíkovou bariérou podľa DIN 4726. Potrubie má certifikáty skúšobní v Belgicku, Nemecku, Dánsku, Holandsku, Francúzsku, Švédsku, Spojenom kráľovstve a USA.',
  },
  potrubia: {
    title: 'Predizolované potrubia Microflex',
    description: 'Päť potrubných systémov Microflex podľa média: vykurovanie, teplá a studená voda, vykurovanie a sanita v jednom plášti, studená a chladená voda, tepelné čerpadlá.',
    lead: 'Ohybné potrubie v jednom kuse z kotúča. Vyberte podľa toho, čo ním chcete viesť: teplo, pitnú vodu, chlad alebo prepojenie tepelného čerpadla.',
    rodinaAlt: 'Rodina potrubí Microflex: UNO, DUO, QUADRO a COOL vedľa seba',
  },
  kategoria: {
    tlak: 'Prevádzkový tlak', rura: 'Nosná rúra', plast: 'Plášť', polomer: 'Polomer ohybu', rady: 'Rady',
    pocet: (rady: string, dim: string) => `${rady}, ${dim} s obj. číslom podľa katalógu`,
    cmpH2: 'Ktorý rad zvoliť', cmpP: 'Porovnanie radov v kategórii podľa katalógu výrobcu.',
    cmpRows: { rury: 'Počet rúr v plášti', tlak: 'Prevádzkový tlak', rura: 'Nosná rúra', plast: 'Plášť HDPE', polomer: 'Polomer ohybu', zosilnena: 'Zosilnená izolácia', dimenzii: 'Dimenzií s obj. číslom' },
    cmpZdroj: 'Rady bez tabuľky doplníme z PDF katalógu.',
    faqH2: 'Otázky pred výberom', faqP: 'Čo sa nás pýtajú najčastejšie. Ak vám odpoveď chýba,', faqNapisat: 'napíšte nám',
    piktoAlt: (k: string) => `${k}, rez potrubím`,
  },
  karta: { rura: 'Rúra', plast: 'Plášť', dimenzie: 'Dimenzie', zosilnena: (n: number) => `, z toho ${n} so zosilnenou izoláciou` },
  rad: {
    jednaRura: 'jedna rúra', dveRury: 'dve rúry', rury: (n: number) => `${n} rúry`,
    medium: 'Médium', tlak: 'Prevádzkový tlak', pocetRur: 'Počet rúr', rura: 'Nosná rúra', plast: 'Plášť HDPE', polomer: 'Polomer ohybu',
    note: 'Cenu a dostupnosť každého variantu nájdete v e-shope instalatershop.sk.',
    oznacenie: 'Označenie výrobcu', castiStranky: 'Časti stránky',
    variantyH2: 'Varianty a obj. čísla', variantyP: 'Obj. číslo vedie priamo na hľadanie v e-shope.',
    variantyChybaju: 'Rozmery a obj. čísla tohto radu sú v katalógu výrobcu, do webu ich doplníme.', katalogPdf: 'Katalóg Microflex (PDF)',
    popisH2: 'Popis a materiály', popisP: 'Podľa popisu výrobcu.',
    dlH2: 'Na stiahnutie', dlP: 'Podklady výrobcu k tomuto radu. Otvoria sa na watts.eu.',
    relH2: 'Čo budete potrebovať k potrubiu', relP: 'Spojky a príslušenstvo, ktoré výrobca odporúča k tomuto radu.',
    fotoAlt: (n: string) => `${n}: rez potrubím, plášť, izolácia a nosná rúra`,
  },
  tabulka: {
    obj: 'Obj. číslo', plast: 'Plášť Ø', rura: 'Rúra Ø × hrúbka', hmotnost: 'Hmotnosť', izolacia: 'Izolácia', polomer: 'Polomer ohybu', kotuc: 'Kotúč Ø / šírka', dn: 'DN', tlak: 'Tlak', eshop: 'E-shop',
    standard: 'štandardná', zosilnena: 'zosilnená',
    zdrojPozn: 'Hmotnosť je na meter potrubia, kotúč ako priemer a šírka.',
  },
  subory: { slovensky: 'slovensky', anglicky: 'anglicky', cesky: 'česky' },
  footer: {
    popis: 'Prezentačný web predizolovaného potrubia Microflex pre Slovensko. Predaj a sklad zabezpečuje',
    potrubia: 'Potrubia a diely', podklady: 'Podklady', prevadzkovatel: 'Prevádzkovateľ', vyrobca: 'Výrobca',
    katalog: 'Katalóg Microflex (PDF, 19 MB)', technicke: 'Technické listy', bim: 'BIM a CAD', vyhlasenia: 'Vyhlásenia o zhode a EPD', poradna: 'Poradňa',
    ico: 'IČO', icdph: 'IČ DPH', kontakt: 'Kontakt a predajňa',
    znamka: 'Microflex je ochranná známka skupiny Watts. Web prevádzkuje oficiálny partner, nie výrobca.',
    vyrobcaText: 'Microflex vyrába Watts. Sme oficiálny partner pre Slovensko.',
  },
  sklonovanie: {
    variantov: (n: number) => (n === 1 ? '1 variant' : n >= 2 && n <= 4 ? `${n} varianty` : `${n} variantov`),
    dimenzii: (n: number) => (n === 1 ? '1 dimenzia' : n >= 2 && n <= 4 ? `${n} dimenzie` : `${n} dimenzií`),
    radov: (n: number) => (n === 1 ? '1 rad' : n >= 2 && n <= 4 ? `${n} rady` : `${n} radov`),
  },
};

const cs: typeof sk = {
  site: { name: 'Microflex Slovensko', sub: 'Slovensko', tagline: 'Předizolované ohebné potrubí Microflex' },
  nav: { potrubia: 'Potrubí', vyber: 'Výběr potrubí', stiahnut: 'Ke stažení', firmy: 'Pro firmy', poradna: 'Poradna', referencie: 'Reference', kontakt: 'Kontakt', podklady: 'Podklady', eshop: 'E-shop', menu: 'Menu', zavriet: 'Zavřít', hlavna: 'Hlavní navigace', domov: 'Domů', celyKatalog: 'Celý katalog potrubí', katalogPdf: 'Katalog PDF, 19 MB, slovensky' },
  search: { placeholder: 'Obj. číslo, řada', label: 'Hledat v katalogu', button: 'Hledat', vsetky: 'Všechny výsledky', nic: 'Nic jsme nenašli. Zkuste obj. číslo, řadu nebo průvodce výběrem.', ciastocne: 'Přesnou shodu jsme nenašli. Nejbližší:', sprievodca: 'Průvodce výběrem potrubí', skupiny: { rad: 'Řada', kod: 'Obj. číslo', diel: 'Díl', stranka: 'Stránka' } },
  partner: { kratke: 'Oficiální partner', veta: 'Oficiální partner Watts pro Microflex na Slovensku', vyrobca: 'Výrobce' },
  jazyk: { prepnut: 'Jazyk', sk: 'Slovensky', cs: 'Česky' },
  crumbs: { label: 'Kde jste' },
  common: {
    zobrazit: 'Zobrazit', zobrazitRady: 'Zobrazit řady', zobrazitRad: 'Zobrazit řadu', zobrazitVarianty: 'Zobrazit varianty',
    podlaKatalogu: 'podle katalogu', rozmeryVKatalogu: 'Rozměry v katalogu', doEshopu: 'Do e-shopu', kupit: 'Koupit v e-shopu',
    vybratDimenziu: 'Vybrat dimenzi', od: 'od', az: 'až', a: 'a', fotkaVyrobcu: 'Foto výrobce', renderVyrobcu: 'Render výrobce.',
    zdroj: 'Zdroj: katalog Watts Microflex, stav k', strankaVyrobcu: 'Stránka výrobce', nie: 'ne',
    objCisel: (n: number) => `${n} obj. čísel`,
  },
  domov: {
    title: 'Microflex Slovensko',
    description: 'Předizolované ohebné potrubí Microflex pro vytápění, teplou a studenou vodu, chlazení a tepelná čerpadla. Katalog, obj. čísla, podklady a prodej přes instalatershop.sk.',
    h1: 'Předizolované potrubí, které se ohne kolem překážky.',
    lead: 'Microflex vede teplo, teplou i studenou vodu a chlad pod zemí. Od kotelny nebo tepelného čerpadla až k domu v jednom kuse z kotouče, bez spojů ve výkopu.',
    vybrat: 'Vybrat potrubí', katalogPdf: 'Katalog PDF, 19 MB', skladom: 'Skladem a prodej přes instalatershop.sk',
    heroAlt: 'Výkop s uloženým potrubím Microflex: modré zvlněné trubky v písku, napojené na spojky',
    prierezAlt: 'Skutečný řez potrubím Microflex DUO na kotouči: modrý zvlněný plášť, tmavě šedá izolace a dvě žluté trubky PE-Xa',
    tagy: [
      ['Zvlněný plášť HDPE', 'uzavřené komory, chrání izolaci'],
      ['2 × nosná trubka PE-Xa', 'kyslíková bariéra podle DIN 4726'],
      ['Izolace z PE-X pěny', 'uzavřené buňky, nasákavost pod 1 %'],
    ],
    prierezCap: 'skutečný řez na kotouči', popiskyLabel: 'Popisky k fotce',
    pouzitieH2: 'Na co potrubí potřebujete?', pouzitieP: 'Vyberte použití. Ukážeme jen řady a dimenze, které se na něj hodí.',
    pouzitia: [
      { slug: 'vytapeni', nazov: 'Vytápění', text: 'Rozvod tepla od kotelny, kotle na biomasu nebo tepelného čerpadla k domu. Řady UNO a DUO, 6 bar.', pikto: 'rad-duo-kurenie.png' },
      { slug: 'sanita', nazov: 'Teplá a studená voda', text: 'Pitná voda mezi budovami a ke vzdáleným odběrům. Řady UNO a DUO v sanitárním provedení, 10 bar.', pikto: 'rad-duo-sanita.png' },
      { slug: 'studena-a-chlazena-voda', nazov: 'Chlazení a studená voda', text: 'Chlazená a studená voda, i odpadní voda. Řada COOL, na přání s topným kabelem proti zamrznutí.', pikto: 'rad-cool-uno.png' },
      { slug: 'tepelna-cerpadla', nazov: 'Tepelné čerpadlo', text: 'Propojení venkovní jednotky s domem v jednom plášti, přívod i zpátečka. Řada Microflex HP.', pikto: 'rad-hp-tepelne-cerpadlo.png' },
    ],
    katalogH2: 'Katalog Microflex', katalogP: 'Pět potrubních systémů podle média a k nim spojky a příslušenství. Všechno, co je třeba na jeden výkop.',
    precoH2: 'Proč právě Microflex',
    fakty: [
      ['Poloměr ohybu od 0,20 m', 'Potrubí kopíruje výkop, obejde základy i strom. Méně kolen, méně spojů a méně míst, kde může něco téct.'],
      ['Jeden plášť, dvě nebo čtyři trubky', 'DUO vede přívod i zpátečku, QUADRO k tomu i teplou vodu s cirkulací v jedné trase. Užší výkop a rychlejší pokládka.'],
      ['Trubka PE-Xa, pěna PE-X, plášť HDPE', 'Nosná trubka podle EN ISO 15875 s kyslíkovou bariérou podle DIN 4726, izolace s uzavřenými buňkami, plášť z HDPE vyráběný jako uzavřené komory.'],
    ],
    technickeUdaje: 'Technické údaje řad', rezAlt: 'Řez potrubím Microflex: modrý zvlněný plášť, šedá izolace a žluté trubky PE-Xa',
    refH2: 'Kde už Microflex leží', refVsetky: 'Všechny reference',
    b2bH2: 'Pro projektanty, montážní firmy a velkoobchod',
    b2bP: 'Technické listy, výkresy DWG a DXF, prohlášení o shodě a environmentální deklarace na jednom místě. Na projekt pošlete poptávku, ozveme se s nabídkou a dostupností.',
    b2bDopyt: 'Poslat poptávku na projekt', b2bPodklady: 'Podklady ke stažení',
    b2bList: [
      ['Technické listy a katalog', 'PDF pro každou řadu, katalog Microflex 19 MB'],
      ['BIM a CAD', 'DWG a DXF pro UNO, DUO, QUADRO a COOL'],
      ['Prohlášení a deklarace', 'Prohlášení o shodě, environmentální deklarace EPD platná do 29. 5. 2031'],
      ['Velkoobchodní kontakt', 'Obchodní oddělení, telefon a e-mail doplníme'],
    ],
    produktov: (n: number) => (n === 1 ? '1 produkt' : n >= 2 && n <= 4 ? `${n} produkty` : `${n} produktů`),
  },
  home: {
    heroKicker: 'Předizolované potrubí Microflex®',
    h1a: 'Flexibilní potrubí.', h1b: 'Precizní řešení.',
    lead: 'Pro vytápění, pitnou vodu, chlazení a tepelná čerpadla.',
    cta: 'Vybrat potrubí', cta2: 'Poptávka na projekt',
    heroAlt: 'Řez předizolovaným potrubím Microflex se čtyřmi trubkami: zvlněný plášť, izolace a nosné trubky',
    popisy: {
      label: 'Rozměry a vlastnosti potrubí na obrázku',
      plast: 'plášť z HDPE',
      polomer: 'poloměr ohybu',
      tlak: (xs: string[]) => `nosné trubky na ${xs.length > 1 ? `${xs.slice(0, -1).join(', ')} nebo ${xs[xs.length - 1]}` : xs[0]} bar`,
    },
    katalogH2: 'Každý projekt má své potrubí.',
    rury: (n: number) => (n === 1 ? 'Jedna trubka v plášti' : n === 2 ? 'Dvě trubky v plášti' : n === 4 ? 'Čtyři trubky v plášti' : `${n} trubky v plášti`),
    plast: 'plášť',
    primo: 'Užší plášť při stejné trubce',
    celyKatalog: 'Celý katalog potrubí',
    dielyH3: 'Spojky a příslušenství',
    rodinaH2: 'Pět systémů, jedna rodina.',
    rodinaP: 'UNO a DUO pro vytápění a pitnou vodu, QUADRO pro všechno v jednom plášti, COOL pro chlad, HP pro tepelná čerpadla. Všechny mají stejnou stavbu ze tří vrstev.',
    rodinaAlt: 'Rodina potrubí Microflex: UNO, DUO, QUADRO a COOL vedle sebe',
    lupyLabel: 'Z čeho je potrubí, od nosné trubky po plášť',
    lupy: [
      { id: 'rura', nazov: 'Nosná trubka', kluc: 'PE-Xa do 95 °C', text: 'Vede topnou, pitnou i chlazenou vodu. PE-Xa podle EN ISO 15875, u vytápění s kyslíkovou bariérou; pro chlad PE 100.' },
      { id: 'pena', nazov: 'Izolace z PE-X pěny', kluc: 'λ 0,0372 W/m·K při 40 °C', text: 'Drží teplotu média po celé trase. Uzavřené buňky bez freonů, nasákavost pod 1 % podle ISO 2896.' },
      { id: 'plast', nazov: 'Plášť z HDPE', kluc: 'dvojitá stěna', text: 'Chrání izolaci před vodou, tlakem zeminy i nárazy. Zvlnění s dvojitou stěnou dává potrubí ohebnost.' },
    ],
    pokladkaH2: 'Sto metrů za čtyřicet minut.',
    pokladkaP: 'Za tuto dobu podle katalogu výrobce položí tři montážníci stometrový kotouč Microflex UNO nebo DUO v menších dimenzích. Bez svařování, bez předizolovaných kolen a bez speciálního nářadí.',
    pokladkaAlt: 'Kotouč potrubí Microflex se zvlněným modrým pláštěm a stahovacími páskami',
    krokyLabel: 'Postup pokládky',
    kroky: [
      ['Kotouč k výkopu', 'Kotouč položte podél výkopu, odstraňte fólii a konec trubky dejte na místo napojení.'],
      ['Rozvinout do písku', 'Postupně stříhejte stahovací pásky a trubku rozvíjejte do pískového lože, mírně hadovitě a s dodržením poloměru ohybu.'],
      ['Spojky a zkouška', 'Konce uzavřete krytkami, připojte spojky PE-X a proveďte tlakovou zkoušku s protokolem.'],
      ['Páska a zásyp', 'Zasypte první vrstvu, položte výstražnou pásku a výkop zasypte celý.'],
    ],
    zataz: ['až 60 t', 'unese potrubí uložené v hloubce 0,5 až 6 m'],
    pokladkaZdroj: 'Časy jsou přibližné, bez dopravy a výkopu.',
    pokladkaOdkaz: 'Celý postup v katalogu výrobce',
    projektyH2: 'Projekty, které už leží v zemi.',
    projektyP: 'Rozvody tepla mezi budovami areálů a obytných souborů, od kotelny po poslední přípojku.',
    projektyVsetky: 'Všechny reference',
    projektyKoty: 'Údaje o stavbě na fotce',
    projektyViac: 'Celá reference',
    projekty: {
      orange: {
        kde: 'Orange, Francie, říjen 2022', h3: '800 metrů místo staré ocelové sítě',
        p: 'Staré ocelové potrubí, které vedlo teplou vodu z hlavní kotelny do budov vojenské základny, nahradil Microflex UNO.',
        alt: 'Dvě potrubí Microflex UNO vedou hadovitě výkopem k budovám vojenské základny v Orange',
      },
      povazska: {
        kde: 'Považská Bystrica, prosinec 2022 až únor 2023', h3: '31 budov napojených na jednu kotelnu',
        p: 'Rozvod tepla pro 30 rodinných domů a bytový dům ze společné kotelny na pelety, se čtyřmi revizními šachtami. Nabídku a dodávku jsme zajistili s podporou Watts.',
        alt: 'Kotelna obytného souboru v Považské Bystrici se zásobníkem pelet a akumulačními nádržemi',
      },
    },
    podporaH2: 'U velkého projektu s Vámi od trasy po dodávku.',
    podporaP: 'Projektantům dodáme podklady, montážním firmám celý materiál na trasu v jedné nabídce. U větších sítí pomáhá i technická podpora výrobce.',
    podporaDopyt: 'Poslat poptávku na projekt', podporaPodklady: 'Podklady ke stažení',
    podpora: [
      { h: 'Podklady pro projektanty', p: 'Výkresy DWG a DXF, tabulky rozměrů a výkonů, tepelné ztráty, prohlášení o shodě a environmentální deklarace EPD.', odkaz: 'Ke stažení' },
      { h: 'Materiál na celou trasu', p: 'Potrubí, svěrné spojky, izolační sady na spoje pod zemí, prostupy stěnou a krytky v jedné nabídce s dostupností.', odkaz: 'Poptávka na projekt' },
    ],
    konfigurator: {
      stav: 'Připravujeme', h: 'Konfigurátor trasy',
      p: 'Zadáte trasu, délky, odbočky a prostupy. Spočítáme potrubí, spojky a příslušenství a připravíme návrh ke stažení.',
      odkaz: 'Zatím nám pošlete trasu',
    },
    istota: 'Microflex vyrábí předizolované potrubí od roku 1994, dnes jako značka skupiny Watts. Výroba je certifikovaná podle ISO 9001, nosné trubky podle EN ISO 15875 s kyslíkovou bariérou podle DIN 4726. Potrubí má certifikáty zkušeben v Belgii, Německu, Dánsku, Nizozemsku, Francii, Švédsku, Spojeném království a USA.',
  },
  potrubia: {
    title: 'Předizolované potrubí Microflex',
    description: 'Pět potrubních systémů Microflex podle média: vytápění, teplá a studená voda, vytápění a sanita v jednom plášti, studená a chlazená voda, tepelná čerpadla.',
    lead: 'Ohebné potrubí v jednom kuse z kotouče. Vyberte podle toho, co jím chcete vést: teplo, pitnou vodu, chlad nebo propojení tepelného čerpadla.',
    rodinaAlt: 'Rodina potrubí Microflex: UNO, DUO, QUADRO a COOL vedle sebe',
  },
  kategoria: {
    tlak: 'Provozní tlak', rura: 'Nosná trubka', plast: 'Plášť', polomer: 'Poloměr ohybu', rady: 'Řady',
    pocet: (rady: string, dim: string) => `${rady}, ${dim} s obj. číslem podle katalogu`,
    cmpH2: 'Kterou řadu zvolit', cmpP: 'Porovnání řad v kategorii podle katalogu výrobce.',
    cmpRows: { rury: 'Počet trubek v plášti', tlak: 'Provozní tlak', rura: 'Nosná trubka', plast: 'Plášť HDPE', polomer: 'Poloměr ohybu', zosilnena: 'Zesílená izolace', dimenzii: 'Dimenzí s obj. číslem' },
    cmpZdroj: 'Řady bez tabulky doplníme z PDF katalogu.',
    faqH2: 'Otázky před výběrem', faqP: 'Na co se nás ptají nejčastěji. Pokud vám odpověď chybí,', faqNapisat: 'napište nám',
    piktoAlt: (k: string) => `${k}, řez potrubím`,
  },
  karta: { rura: 'Trubka', plast: 'Plášť', dimenzie: 'Dimenze', zosilnena: (n: number) => `, z toho ${n} se zesílenou izolací` },
  rad: {
    jednaRura: 'jedna trubka', dveRury: 'dvě trubky', rury: (n: number) => `${n} trubky`,
    medium: 'Médium', tlak: 'Provozní tlak', pocetRur: 'Počet trubek', rura: 'Nosná trubka', plast: 'Plášť HDPE', polomer: 'Poloměr ohybu',
    note: 'Cenu a dostupnost každé varianty najdete v e-shopu instalatershop.sk.',
    oznacenie: 'Označení výrobce', castiStranky: 'Části stránky',
    variantyH2: 'Varianty a obj. čísla', variantyP: 'Obj. číslo vede přímo na hledání v e-shopu.',
    variantyChybaju: 'Rozměry a obj. čísla této řady jsou v katalogu výrobce, do webu je doplníme.', katalogPdf: 'Katalog Microflex (PDF)',
    popisH2: 'Popis a materiály', popisP: 'Podle popisu výrobce.',
    dlH2: 'Ke stažení', dlP: 'Podklady výrobce k této řadě. Otevřou se na watts.eu.',
    relH2: 'Co budete potřebovat k potrubí', relP: 'Spojky a příslušenství, které výrobce doporučuje k této řadě.',
    fotoAlt: (n: string) => `${n}: řez potrubím, plášť, izolace a nosná trubka`,
  },
  tabulka: {
    obj: 'Obj. číslo', plast: 'Plášť Ø', rura: 'Trubka Ø × tloušťka', hmotnost: 'Hmotnost', izolacia: 'Izolace', polomer: 'Poloměr ohybu', kotuc: 'Kotouč Ø / šířka', dn: 'DN', tlak: 'Tlak', eshop: 'E-shop',
    standard: 'standardní', zosilnena: 'zesílená',
    zdrojPozn: 'Hmotnost je na metr potrubí, kotouč jako průměr a šířka.',
  },
  subory: { slovensky: 'slovensky', anglicky: 'anglicky', cesky: 'česky' },
  footer: {
    popis: 'Prezentační web předizolovaného potrubí Microflex. Prodej a sklad zajišťuje',
    potrubia: 'Potrubí a díly', podklady: 'Podklady', prevadzkovatel: 'Provozovatel', vyrobca: 'Výrobce',
    katalog: 'Katalog Microflex (PDF, 19 MB)', technicke: 'Technické listy', bim: 'BIM a CAD', vyhlasenia: 'Prohlášení o shodě a EPD', poradna: 'Poradna',
    ico: 'IČO', icdph: 'DIČ', kontakt: 'Kontakt a prodejna',
    znamka: 'Microflex je ochranná známka skupiny Watts. Web provozuje oficiální partner, nikoli výrobce.',
    vyrobcaText: 'Microflex vyrábí Watts. Jsme oficiální partner pro Slovensko.',
  },
  sklonovanie: {
    variantov: (n: number) => (n === 1 ? '1 varianta' : n >= 2 && n <= 4 ? `${n} varianty` : `${n} variant`),
    dimenzii: (n: number) => (n === 1 ? '1 dimenze' : n >= 2 && n <= 4 ? `${n} dimenze` : `${n} dimenzí`),
    radov: (n: number) => (n === 1 ? '1 řada' : n >= 2 && n <= 4 ? `${n} řady` : `${n} řad`),
  },
};

export const ui: Record<Lang, typeof sk> = { sk, cs };
export const t = (lang: Lang) => ui[lang];

/** Statické cesty rozhrania podľa jazyka (adresy mimo katalógu). */
export const ROUTES: Record<Lang, Record<string, string>> = {
  sk: { domov: '/', potrubia: '/potrubia/', vyber: '/vyber/', stiahnut: '/na-stiahnutie/', firmy: '/pre-firmy/', poradna: '/poradna/', kontakt: '/kontakt/', referencie: '/referencie/', hladat: '/hladat/', spojky: '/spojky/', prislusenstvo: '/prislusenstvo/' },
  cs: { domov: '/cs/', potrubia: '/cs/potrubi/', vyber: '/cs/vyber/', stiahnut: '/cs/ke-stazeni/', firmy: '/cs/pro-firmy/', poradna: '/cs/poradna/', kontakt: '/cs/kontakt/', referencie: '/cs/reference/', hladat: '/cs/hledat/', spojky: '/cs/spojky/', prislusenstvo: '/cs/prislusenstvi/' },
};
export const route = (lang: Lang, key: keyof typeof ROUTES['sk']) => ROUTES[lang][key];

/** Alternatívne adresy tej istej stránky v oboch jazykoch (pre hreflang a prepínač). */
export type Alternates = Record<Lang, string>;
export const staticAlternates = (key: keyof typeof ROUTES['sk']): Alternates => ({ sk: ROUTES.sk[key], cs: ROUTES.cs[key] });
