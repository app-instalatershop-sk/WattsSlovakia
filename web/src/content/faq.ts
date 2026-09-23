import type { Lang } from '../i18n/ui';

/** Otázky pred výberom podľa id kategórie a jazyka. Texty spisovne, bez čísel bez zdroja. */
type Otazka = { q: string; a: string };

const sk: Record<string, Otazka[]> = {
  vykurovanie: [
    { q: 'UNO alebo DUO: kedy sa oplatia dve rúry v jednom plášti?', a: 'Keď potrebujete prívod aj spiatočku na jednej trase, napríklad od tepelného čerpadla alebo kotolne k domu. DUO znamená jeden výkop a jednu pokládku. UNO použijete, keď vediete len jednu vetvu, alebo pri väčších dimenziách, ktoré sa v DUO nevyrábajú.' },
    { q: 'Akú dimenziu potrubia zvoliť?', a: 'Podľa výkonu. Katalóg výrobcu uvádza pri každej dimenzii orientačný prenášaný výkon pri 80 °C a rozdiele 20 K, napríklad rúra 32 mm približne 60 kW a rúra 40 mm približne 90 kW. Dimenziu podľa výkonu navrhne sprievodca výberom; pri dlhej trase overte aj tlakovú stratu v tabuľkách katalógu.' },
    { q: 'Ako hlboko sa potrubie ukladá a ako sa spája?', a: 'Do pieskového lôžka v hĺbke 0,5 až 6 m, mierne hadovito a s dodržaním polomeru ohybu. Spája sa svornými spojkami PE-X bez zvárania, konce sa uzatvárajú krytkami a vstup do budovy tesnením MICRO PRESS alebo MICRO SEAL.' },
    { q: 'Čo znamená štandardná a zosilnená izolácia?', a: 'Pri zosilnenej izolácii je rovnaká nosná rúra v hrubšom plášti, takže tepelná strata trasy je menšia. Oplatí sa pri dlhších trasách a vyšších teplotách. V tabuľke variantov ju označujeme pri každom obj. čísle.' },
  ],
  sanita: [
    { q: 'Prečo má sanitárne potrubie 10 bar a vykurovacie 6 bar?', a: 'Pitná voda v rozvode býva pod vyšším tlakom než vykurovacia voda, preto majú sanitárne rady hrubšiu stenu nosnej rúry a vyšší prevádzkový tlak. Na pitnú vodu vždy voľte sanitárne vyhotovenie.' },
    { q: 'Dá sa v jednom plášti viesť teplá aj studená voda?', a: 'Áno, rad DUO v sanitárnom vyhotovení má dve rúry v jednom plášti, jednu na teplú a jednu na studenú vodu. Ak do tej istej budovy vediete aj vykurovanie, pozrite rad QUADRO: prívod a spiatočka vykurovania, teplá voda a cirkulácia v jednom plášti.' },
  ],
  'vykurovanie-a-sanita': [
    { q: 'Kedy sa oplatí QUADRO namiesto dvoch samostatných potrubí?', a: 'Keď do vedľajšej budovy vediete vykurovanie aj teplú vodu s cirkuláciou. QUADRO má v jednom plášti prívod a spiatočku vykurovania, teplú vodu a cirkuláciu, takže stačí jeden výkop a jedna pokládka.' },
    { q: 'Aký tlak a teplotu QUADRO znesie?', a: 'Podľa katalógu výrobcu vykurovacie rúry PE-Xa SDR 11 do 6 bar a sanitárne rúry SDR 7,4 do 10 bar, všetky do 95 °C. Studená voda v QUADRO nie je; tú veďte samostatným potrubím, napríklad COOL.' },
  ],
  'studena-a-chladena-voda': [
    { q: 'Môžem COOL použiť na teplú vodu alebo vykurovanie?', a: 'Nie. COOL má nosnú rúru z PE 100 pre médium od −10 do 25 °C a tlak do 16 bar. Na teplú vodu a vykurovanie sú rady s rúrou PE-Xa (UNO, DUO, QUADRO).' },
    { q: 'Kedy potrebujem COOL s vyhrievacím káblom?', a: 'Keď hrozí, že voda v potrubí zamrzne, napríklad pri plytkom uložení alebo v nevykurovanom priestore. Samoregulačný kábel má výkon 10 W/m, na želanie 18 W/m. Termostat MVTH z pripojovacej sady ho vypína podľa teploty, aby nebol stále pod napätím.' },
  ],
  'tepelne-cerpadla': [
    { q: 'Čím sa Microflex HP líši od DUO?', a: 'HP má v jednom plášti prívod a spiatočku a navyše dve chráničky na napájací a dátový kábel vonkajšej jednotky. Káble sú uložené v poriadku a dajú sa neskôr vymeniť bez výkopu.' },
    { q: 'Na aké tepelné čerpadlá je HP určené?', a: 'Podľa výrobcu na monoblokové tepelné čerpadlá, na vykurovanie aj chladenie. Nosné rúry PE-Xa SDR 11 od 25 × 2,3 do 40 × 3,7 mm, prevádzkový tlak 6 bar.' },
  ],
};

const cs: Record<string, Otazka[]> = {
  vykurovanie: [
    { q: 'UNO nebo DUO: kdy se vyplatí dvě trubky v jednom plášti?', a: 'Když potřebujete přívod i zpátečku na jedné trase, například od tepelného čerpadla nebo kotelny k domu. DUO znamená jeden výkop a jednu pokládku. UNO použijete, když vedete jen jednu větev, nebo u větších dimenzí, které se v DUO nevyrábějí.' },
    { q: 'Jakou dimenzi potrubí zvolit?', a: 'Podle výkonu. Katalog výrobce uvádí u každé dimenze orientační přenášený výkon při 80 °C a rozdílu 20 K, například trubka 32 mm přibližně 60 kW a trubka 40 mm přibližně 90 kW. Dimenzi podle výkonu navrhne průvodce výběrem; u dlouhé trasy ověřte i tlakovou ztrátu v tabulkách katalogu.' },
    { q: 'Jak hluboko se potrubí ukládá a jak se spojuje?', a: 'Do pískového lože v hloubce 0,5 až 6 m, mírně hadovitě a s dodržením poloměru ohybu. Spojuje se svěrnými spojkami PE-X bez svařování, konce se uzavírají krytkami a vstup do budovy těsněním MICRO PRESS nebo MICRO SEAL.' },
    { q: 'Co znamená standardní a zesílená izolace?', a: 'U zesílené izolace je stejná nosná trubka v silnějším plášti, takže tepelná ztráta trasy je menší. Vyplatí se u delších tras a vyšších teplot. V tabulce variant ji označujeme u každého obj. čísla.' },
  ],
  sanita: [
    { q: 'Proč má sanitární potrubí 10 bar a topné 6 bar?', a: 'Pitná voda v rozvodu bývá pod vyšším tlakem než topná voda, proto mají sanitární řady silnější stěnu nosné trubky a vyšší provozní tlak. Na pitnou vodu vždy volte sanitární provedení.' },
    { q: 'Dá se v jednom plášti vést teplá i studená voda?', a: 'Ano, řada DUO v sanitárním provedení má dvě trubky v jednom plášti, jednu na teplou a jednu na studenou vodu. Pokud do téže budovy vedete i vytápění, podívejte se na řadu QUADRO: přívod a zpátečka vytápění, teplá voda a cirkulace v jednom plášti.' },
  ],
  'vykurovanie-a-sanita': [
    { q: 'Kdy se vyplatí QUADRO místo dvou samostatných potrubí?', a: 'Když do vedlejší budovy vedete vytápění i teplou vodu s cirkulací. QUADRO má v jednom plášti přívod a zpátečku vytápění, teplou vodu a cirkulaci, takže stačí jeden výkop a jedna pokládka.' },
    { q: 'Jaký tlak a teplotu QUADRO snese?', a: 'Podle katalogu výrobce topné trubky PE-Xa SDR 11 do 6 bar a sanitární trubky SDR 7,4 do 10 bar, všechny do 95 °C. Studená voda v QUADRO není; tu veďte samostatným potrubím, například COOL.' },
  ],
  'studena-a-chladena-voda': [
    { q: 'Mohu COOL použít na teplou vodu nebo vytápění?', a: 'Ne. COOL má nosnou trubku z PE 100 pro médium od −10 do 25 °C a tlak do 16 bar. Na teplou vodu a vytápění jsou řady s trubkou PE-Xa (UNO, DUO, QUADRO).' },
    { q: 'Kdy potřebuji COOL s topným kabelem?', a: 'Když hrozí, že voda v potrubí zamrzne, například při mělkém uložení nebo v nevytápěném prostoru. Samoregulační kabel má výkon 10 W/m, na přání 18 W/m. Termostat MVTH z připojovací sady ho vypíná podle teploty, aby nebyl stále pod napětím.' },
  ],
  'tepelne-cerpadla': [
    { q: 'Čím se Microflex HP liší od DUO?', a: 'HP má v jednom plášti přívod a zpátečku a navíc dvě chráničky na napájecí a datový kabel venkovní jednotky. Kabely jsou uložené v pořádku a dají se později vyměnit bez výkopu.' },
    { q: 'Pro jaká tepelná čerpadla je HP určené?', a: 'Podle výrobce pro monobloková tepelná čerpadla, pro vytápění i chlazení. Nosné trubky PE-Xa SDR 11 od 25 × 2,3 do 40 × 3,7 mm, provozní tlak 6 bar.' },
  ],
};

export const faq = (kategoriaId: string, lang: Lang): Otazka[] => (lang === 'cs' ? cs : sk)[kategoriaId] ?? [];
/** Všetky otázky podľa kategórie (poradňa). */
export const faqVsetky = (lang: Lang): Record<string, Otazka[]> => (lang === 'cs' ? cs : sk);
