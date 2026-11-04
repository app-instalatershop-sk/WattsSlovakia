import type { Lang } from '../i18n/ui';

/**
 * Obsah stránok radov, ktorý na watts.eu chýba alebo je tam strojovo preložený: náš popis,
 * parametre a stavba podľa katalógu Watts Microflex (slovenské vydanie, strany v `strana`)
 * a poznámky k montáži. Kľúč je slug radu. Čísla sú len tie, ktoré katalóg uvádza.
 */
type Vrstva = { kluc?: string; text: string };
export interface RadObsah {
  strana: number | null;
  popis: string[];
  parametre: [string, string][];
  vrstvy: { rura: Vrstva; pena: Vrstva; plast: Vrstva };
  montaz: string[];
}

/* ---------- spoločné bloky podľa druhu rúry ---------- */

const sk = {
  pena: { kluc: 'λ 0,0372 W/m·K pri 40 °C', text: 'Pena zo sieťovaného polyetylénu PE-X s uzavretými bunkami, bez freónov. Nasiakavosť pod 1 % podľa ISO 2896, izolačné vlastnosti drží po celú životnosť.' },
  plast: { text: 'Vlnitý plášť z HDPE s dvojitou stenou, vyrobený ako uzavreté komory a odolný voči UV žiareniu. Chráni izoláciu pred vodou a tlakom zeminy a dáva potrubiu ohybnosť.' },
  ruraVyk: { text: 'Sieťovaný polyetylén PE-Xa podľa EN ISO 15875 so žltou bariérou proti difúzii kyslíka podľa DIN 4726. Nekoroduje a znesie teplotné výkyvy.' },
  ruraSan: { text: 'Sieťovaný polyetylén PE-Xa podľa EN ISO 15875 s hrubšou stenou pre pitnú vodu do 10 bar. Nekoroduje, nemá kyslíkovú bariéru.' },
  ruraCool: { text: 'Polyetylén PE 100 podľa EN ISO 12201 na studenú pitnú, chladenú a odpadovú vodu do 16 bar.' },
  pevneBody: 'Na koncoch potrubia osaďte pevné body MFP. Zachytia rozťahovanie a zmršťovanie rúry PE-Xa pri zmene teploty; katalóg výrobcu ich pri vykurovaní vyžaduje.',
  krytky: 'Konce potrubia uzavrite gumovou krytkou EPDM alebo zmršťovacou krytkou, aby do izolácie nevnikla voda. Kým potrubie nie je zapojené, chráňte konce protiprachovou krytkou.',
  polomer: 'Pri ukladaní dodržte najmenší polomer ohybu z tabuľky. Menší polomer môže rúru alebo plášť poškodiť.',
  tlak: 'Max. prevádzkový tlak', teplota: 'Max. teplota média', teplotaCool: 'Teplota média', rura: 'Nosná rúra', rolka: 'Štandardná rolka',
  rolka100: '100 m, aj metráž', bariera: 'Kyslíková bariéra', barieraAno: 'áno, podľa DIN 4726',
};

const cs: typeof sk = {
  pena: { kluc: 'λ 0,0372 W/m·K při 40 °C', text: 'Pěna ze síťovaného polyetylenu PE-X s uzavřenými buňkami, bez freonů. Nasákavost pod 1 % podle ISO 2896, izolační vlastnosti drží po celou životnost.' },
  plast: { text: 'Vlnitý plášť z HDPE s dvojitou stěnou, vyráběný jako uzavřené komory a odolný vůči UV záření. Chrání izolaci před vodou a tlakem zeminy a dává potrubí ohebnost.' },
  ruraVyk: { text: 'Síťovaný polyetylen PE-Xa podle EN ISO 15875 se žlutou bariérou proti difuzi kyslíku podle DIN 4726. Nekoroduje a snese teplotní výkyvy.' },
  ruraSan: { text: 'Síťovaný polyetylen PE-Xa podle EN ISO 15875 se silnější stěnou pro pitnou vodu do 10 bar. Nekoroduje, nemá kyslíkovou bariéru.' },
  ruraCool: { text: 'Polyetylen PE 100 podle EN ISO 12201 pro studenou pitnou, chlazenou a odpadní vodu do 16 bar.' },
  pevneBody: 'Na koncích potrubí osaďte pevné body MFP. Zachytí roztahování a smršťování trubky PE-Xa při změně teploty; katalog výrobce je u vytápění vyžaduje.',
  krytky: 'Konce potrubí uzavřete pryžovou krytkou EPDM nebo smršťovací krytkou, aby do izolace nevnikla voda. Dokud potrubí není zapojené, chraňte konce protiprachovou krytkou.',
  polomer: 'Při ukládání dodržte nejmenší poloměr ohybu z tabulky. Menší poloměr může trubku nebo plášť poškodit.',
  tlak: 'Max. provozní tlak', teplota: 'Max. teplota média', teplotaCool: 'Teplota média', rura: 'Nosná trubka', rolka: 'Standardní role',
  rolka100: '100 m, i metráž', bariera: 'Kyslíková bariéra', barieraAno: 'ano, podle DIN 4726',
};

function obsah(lang: Lang): Record<string, RadObsah> {
  const b = lang === 'cs' ? cs : sk;
  const c = lang === 'cs';
  const vyk = (sdr = '11'): [string, string][] => [[b.tlak, '6 bar'], [b.teplota, '95 °C'], [b.rura, `PE-Xa, SDR ${sdr}`], [b.bariera, b.barieraAno], [b.rolka, b.rolka100]];
  const san: [string, string][] = [[b.tlak, '10 bar'], [b.teplota, '95 °C'], [b.rura, 'PE-Xa, SDR 7,4'], [b.rolka, b.rolka100]];
  const cool: [string, string][] = [[b.tlak, '16 bar'], [b.teplotaCool, '−10 až 25 °C'], [b.rura, 'PE 100, SDR 11'], [b.rolka, b.rolka100]];
  const vrstvyVyk = { rura: { ...b.ruraVyk, kluc: 'PE-Xa, SDR 11, do 95 °C' }, pena: b.pena, plast: b.plast };
  const vrstvySan = { rura: { ...b.ruraSan, kluc: 'PE-Xa, SDR 7,4, do 95 °C' }, pena: b.pena, plast: b.plast };
  const vrstvyCool = { rura: { ...b.ruraCool, kluc: 'PE 100, SDR 11, do 16 bar' }, pena: b.pena, plast: b.plast };
  const montazVyk = [b.pevneBody, b.krytky, b.polomer];
  const montaz = [b.krytky, b.polomer];

  return {
    'microflex-uno-6-bar': {
      strana: 8, parametre: vyk(), vrstvy: vrstvyVyk, montaz: montazVyk,
      popis: c ? [
        'Microflex UNO má v plášti jednu nosnou trubku z PE-Xa. Vede přívod nebo zpátečku vytápění, kde se obě větve vedou odděleně, a v největších dimenzích přenese i velké výkony: trubka 125 × 11,4 mm (DN 102) podle katalogu výrobce zhruba 900 kW.',
        'Potrubí je ohebné a samokompenzační. Dodává se v rolích po 100 m, takže překážky na trase obejde bez spojek a předizolovaných kolen.',
      ] : [
        'Microflex UNO má v plášti jednu nosnú rúru z PE-Xa. Vedie prívod alebo spiatočku vykurovania tam, kde sa obe vetvy vedú oddelene, a v najväčších dimenziách prenesie aj veľké výkony: rúra 125 × 11,4 mm (DN 102) podľa katalógu výrobcu približne 900 kW.',
        'Potrubie je ohybné a samokompenzačné. Dodáva sa v rolkách po 100 m, takže prekážky na trase obíde bez spojok a predizolovaných kolien.',
      ],
    },
    'microflex-uno-primo-6-bar': {
      strana: 9, parametre: vyk(), vrstvy: vrstvyVyk, montaz: montazVyk,
      popis: c ? [
        'UNO PRIMO je UNO s tenčí vrstvou izolace: pro stejnou nosnou trubku má menší plášť. Trubka 63 × 5,8 mm (DN 50) leží v plášti 125 mm místo 160 mm u zesílené izolace.',
        'Potrubí je lehčí a ohebnější, vejde se do užšího výkopu a snáz sleduje trasu s mnoha změnami směru.',
      ] : [
        'UNO PRIMO je UNO s tenšou vrstvou izolácie: pre tú istú nosnú rúru má menší plášť. Rúra 63 × 5,8 mm (DN 50) leží v plášti 125 mm namiesto 160 mm pri zosilnenej izolácii.',
        'Potrubie je ľahšie a ohybnejšie, zmestí sa do užšieho výkopu a ľahšie sleduje trasu s mnohými zmenami smeru.',
      ],
    },
    'microflex-duo-6-bar': {
      strana: 10, parametre: vyk(), vrstvy: vrstvyVyk, montaz: montazVyk,
      popis: c ? [
        'Microflex DUO vede přívod i zpátečku vytápění v jednom plášti. Stačí jeden výkop a jedna pokládka, proto je to nejčastější volba pro přípojku domu z kotelny, kotle na biomasu nebo tepelného čerpadla.',
        'Obě trubky jsou z PE-Xa s kyslíkovou bariérou, izolace z pěny PE-X je obklopuje společně.',
      ] : [
        'Microflex DUO vedie prívod aj spiatočku vykurovania v jednom plášti. Stačí jeden výkop a jedna pokládka, preto je to najčastejšia voľba pre prípojku domu z kotolne, kotla na biomasu alebo tepelného čerpadla.',
        'Obe rúry sú z PE-Xa s kyslíkovou bariérou, izolácia z peny PE-X ich obklopuje spoločne.',
      ],
    },
    'microflex-primo-duo-6-bar': {
      strana: 11, parametre: vyk(), vrstvy: vrstvyVyk, montaz: montazVyk,
      popis: c ? [
        'PRIMO DUO jsou přívod a zpátečka vytápění v plášti s tenčí izolací. Pro stejné trubky má menší plášť než DUO se zesílenou izolací, například 2 × 25 mm (DN 20) v plášti 125 mm místo 160 mm, proto se snáz ohýbá a vejde se do užšího výkopu.',
        'Katalog výrobce uvádí tři dimenze s trubkami 25, 32 a 50 mm (DN 20, 25 a 40).',
      ] : [
        'PRIMO DUO sú prívod a spiatočka vykurovania v plášti s tenšou izoláciou. Pre tie isté rúry má menší plášť ako DUO so zosilnenou izoláciou, napríklad 2 × 25 mm (DN 20) v plášti 125 mm namiesto 160 mm, preto sa ľahšie ohýba a zmestí sa do užšieho výkopu.',
        'Katalóg výrobcu uvádza tri dimenzie s rúrami 25, 32 a 50 mm (DN 20, 25 a 40).',
      ],
    },
    'microflex-uno-10-bar': {
      strana: 12, parametre: san, vrstvy: vrstvySan, montaz,
      popis: c ? [
        'Sanitární UNO má jednu trubku z PE-Xa na pitnou vodu se silnější stěnou (SDR 7,4) pro tlak 10 bar. Vede teplou nebo studenou vodu ke vzdálenému odběru, například do vedlejší budovy.',
        'Pro teplou vodu s cirkulací nebo pro teplou a studenou vodu v jednom výkopu je určeno sanitární DUO.',
      ] : [
        'Sanitárne UNO má jednu rúru z PE-Xa na pitnú vodu s hrubšou stenou (SDR 7,4) pre tlak 10 bar. Vedie teplú alebo studenú vodu k vzdialenému odberu, napríklad do vedľajšej budovy.',
        'Na teplú vodu s cirkuláciou alebo na teplú a studenú vodu v jednom výkope je určené sanitárne DUO.',
      ],
    },
    'microflex-duo-10-bar': {
      strana: 13, parametre: san, vrstvy: vrstvySan, montaz,
      popis: c ? [
        'Dvě trubky na pitnou vodu v jednom plášti, 10 bar. Většina dimenzí má trubky různých průměrů, například 32 a 22 mm (DN 23 a 16), pro teplou vodu a cirkulaci; izolační středový kus z PE je od sebe tepelně odděluje.',
        'Pro dvě stejné trubky jsou dimenze 2 × 25 mm (DN 18) a 2 × 63 mm (DN 45).',
      ] : [
        'Dve rúry na pitnú vodu v jednom plášti, 10 bar. Väčšina dimenzií má rúry rôznych priemerov, napríklad 32 a 22 mm (DN 23 a 16), na teplú vodu a cirkuláciu; izolačný stredový kus z PE ich od seba tepelne oddeľuje.',
        'Pre dve rovnaké rúry sú dimenzie 2 × 25 mm (DN 18) a 2 × 63 mm (DN 45).',
      ],
    },
    'microflex-primo-duo-10-bar': {
      strana: 14, parametre: san, vrstvy: vrstvySan, montaz,
      popis: c ? [
        'Dvě trubky na pitnou vodu v plášti PRIMO s tenčí izolací, 10 bar. Lehčí a ohebnější než sanitární DUO, pro užší výkopy a kratší přípojky.',
      ] : [
        'Dve rúry na pitnú vodu v plášti PRIMO s tenšou izoláciou, 10 bar. Ľahšie a ohybnejšie ako sanitárne DUO, do užších výkopov a na kratšie prípojky.',
      ],
    },
    'microflex-quadro': {
      strana: 15,
      parametre: c
        ? [['Topné trubky', '6 bar, SDR 11'], ['Sanitární trubky', '10 bar, SDR 7,4'], [b.teplota, '95 °C'], [b.rolka, b.rolka100]]
        : [['Vykurovacie rúry', '6 bar, SDR 11'], ['Sanitárne rúry', '10 bar, SDR 7,4'], [b.teplota, '95 °C'], [b.rolka, b.rolka100]],
      vrstvy: {
        rura: { kluc: c ? '4 trubky PE-Xa, do 95 °C' : '4 rúry PE-Xa, do 95 °C', text: c
          ? 'Přívod a zpátečka vytápění z PE-Xa s kyslíkovou bariérou, teplá voda a cirkulace z PE-Xa pro pitnou vodu. Izolační středový kus z PE odděluje topné trubky od sanitárních.'
          : 'Prívod a spiatočka vykurovania z PE-Xa s kyslíkovou bariérou, teplá voda a cirkulácia z PE-Xa na pitnú vodu. Izolačný stredový kus z PE oddeľuje vykurovacie rúry od sanitárnych.' },
        pena: b.pena, plast: b.plast,
      },
      montaz: [c
        ? 'Topné trubky osaďte pevnými body MFP. U větších dimenzí jsou podle katalogu třeba dva pevné body.'
        : 'Vykurovacie rúry osaďte pevnými bodmi MFP. Pri väčších dimenziách sú podľa katalógu potrebné dva pevné body.', b.krytky, b.polomer],
      popis: c ? [
        'Čtyři trubky v jednom plášti: přívod a zpátečka vytápění (6 bar) a teplá voda s cirkulací (10 bar). Jedním výkopem přivedete do vedlejší budovy vytápění i teplou vodu.',
        'Průměry trubek jsou v každé dimenzi jiné, podle toho, kolik tepla a vody budova potřebuje. V tabulce je každá trubka zvlášť.',
      ] : [
        'Štyri rúry v jednom plášti: prívod a spiatočka vykurovania (6 bar) a teplá voda s cirkuláciou (10 bar). Jedným výkopom privediete do vedľajšej budovy vykurovanie aj teplú vodu.',
        'Priemery rúr sú v každej dimenzii iné, podľa toho, koľko tepla a vody budova potrebuje. V tabuľke je každá rúra zvlášť.',
      ],
    },
    'microflex-cool': {
      strana: 16, parametre: cool, vrstvy: vrstvyCool, montaz,
      popis: c ? [
        'Microflex COOL má nosnou trubku z PE 100 na studenou pitnou vodu, chlazenou vodu a odpadní vodu. Snese tlak 16 bar při teplotě média od −10 do 25 °C.',
        'Izolace a plášť jsou stejné jako u topných řad, takže se COOL pokládá stejně: z role, bez spojek ve výkopu.',
      ] : [
        'Microflex COOL má nosnú rúru z PE 100 na studenú pitnú vodu, chladenú vodu a odpadovú vodu. Znesie tlak 16 bar pri teplote média od −10 do 25 °C.',
        'Izolácia a plášť sú rovnaké ako pri vykurovacích radoch, takže sa COOL ukladá rovnako: z rolky, bez spojok vo výkope.',
      ],
    },
    'microflex-cool-duo': {
      strana: 17, parametre: cool, vrstvy: vrstvyCool, montaz,
      popis: c ? [
        'Dvě trubky z PE 100 v jednom plášti, například přívod a zpátečka chlazené vody. Tlak do 16 bar, teplota média −10 až 25 °C.',
      ] : [
        'Dve rúry z PE 100 v jednom plášti, napríklad prívod a spiatočka chladenej vody. Tlak do 16 bar, teplota média −10 až 25 °C.',
      ],
    },
    'microflex-cool-s-vyhrievacim-kablom': {
      strana: 18,
      parametre: [...cool, c ? ['Topný kabel', '10 W/m, na přání 18 W/m'] : ['Vykurovací kábel', '10 W/m, na želanie 18 W/m']],
      vrstvy: { ...vrstvyCool, rura: { kluc: c ? 'PE 100 a topný kabel' : 'PE 100 a vykurovací kábel', text: c
        ? 'Trubka z PE 100 podle EN ISO 12201, po celé délce se jí dotýká samoregulační topný kabel. Kabel hřeje víc, čím je chladněji.'
        : 'Rúra z PE 100 podľa EN ISO 12201, po celej dĺžke sa jej dotýka samoregulačný vykurovací kábel. Kábel hreje viac, čím je chladnejšie.' } },
      montaz: c ? [
        'Kabel se připojuje na 230 V přes připojovací sadu. Okruh chraňte jističem 16 A a proudovým chráničem 30 mA.',
        'Při 0 °C smí být jeden napájený úsek kabelu dlouhý nejvýše 100 m. Delší trasy napájejte po částech.',
        'Výrobce doporučuje spínat kabel termostatem MVTH při teplotě okolí 2 °C, aby nebyl stále pod napětím.',
      ] : [
        'Kábel sa pripája na 230 V cez pripojovaciu sadu. Okruh chráňte ističom 16 A a prúdovým chráničom 30 mA.',
        'Pri 0 °C smie byť jeden napájaný úsek kábla dlhý najviac 100 m. Dlhšie trasy napájajte po častiach.',
        'Výrobca odporúča spínať kábel termostatom MVTH pri teplote okolia 2 °C, aby nebol stále pod napätím.',
      ],
      popis: c ? [
        'COOL se samoregulačním topným kabelem chrání studenou vodu před zamrznutím tam, kde potrubí nemůže ležet v nezámrzné hloubce. Životnost kabelu stanovily zkoušky výrobce na více než 40 let.',
        'Tabulka tepelných ztrát v katalogu výrobce ukazuje, kolik kabelů je třeba podle průměru potrubí a venkovní teploty.',
      ] : [
        'COOL so samoregulačným vykurovacím káblom chráni studenú vodu pred zamrznutím tam, kde potrubie nemôže ležať v nezamŕzajúcej hĺbke. Životnosť kábla stanovili skúšky výrobcu na viac ako 40 rokov.',
        'Tabuľka tepelných strát v katalógu výrobcu ukazuje, koľko káblov treba podľa priemeru potrubia a vonkajšej teploty.',
      ],
    },
    'microflex-hp': {
      strana: null,
      parametre: c
        ? [['Nosné trubky', 'PE-Xa, PN 6, SDR 11'], ['Kabely', '2 chráničky, napájecí a ovládací'], ['Norma', 'EN 15632-1 až 3'], [b.rolka, b.rolka100]]
        : [['Nosné rúry', 'PE-Xa, PN 6, SDR 11'], ['Káble', '2 chráničky, napájací a ovládací'], ['Norma', 'EN 15632-1 až 3'], [b.rolka, b.rolka100]],
      vrstvy: {
        rura: { kluc: c ? '2 trubky PE-Xa a 2 chráničky' : '2 rúry PE-Xa a 2 chráničky', text: c
          ? 'Přívod a zpátečka topné nebo chladicí vody z PE-Xa a dvě prázdné vlnité chráničky, kterými se po položení protáhne napájecí a ovládací kabel.'
          : 'Prívod a spiatočka vykurovacej alebo chladiacej vody z PE-Xa a dve prázdne vlnité chráničky, ktorými sa po uložení pretiahne napájací a ovládací kábel.' },
        pena: b.pena, plast: b.plast,
      },
      montaz: [b.krytky, b.polomer],
      popis: c ? [
        'Microflex HP spojuje venkovní jednotku tepelného čerpadla, například monoblok vzduch-voda, s domem. V jednom plášti jsou přívod a zpátečka a dvě chráničky na kabely, takže celé připojení leží v jednom výkopu.',
        'Příslušenství se montuje bez speciálního nářadí.',
      ] : [
        'Microflex HP spája vonkajšiu jednotku tepelného čerpadla, napríklad monoblok vzduch-voda, s domom. V jednom plášti sú prívod a spiatočka a dve chráničky na káble, takže celé pripojenie leží v jednom výkope.',
        'Príslušenstvo sa montuje bez špeciálneho náradia.',
      ],
    },
  };
}

export const obsahRadu = (slug: string, lang: Lang): RadObsah | undefined => obsah(lang)[slug];
