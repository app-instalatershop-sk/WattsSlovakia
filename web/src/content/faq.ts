import type { Lang } from '../i18n/ui';

/** Otázky pred výberom podľa id kategórie a jazyka. Texty spisovne, bez čísel bez zdroja. */
type Otazka = { q: string; a: string };

const sk: Record<string, Otazka[]> = {
  vykurovanie: [
    { q: 'UNO alebo DUO: kedy sa oplatia dve rúry v jednom plášti?', a: 'Keď potrebujete prívod aj spiatočku na jednej trase, napríklad od tepelného čerpadla alebo kotolne k domu. DUO znamená jeden výkop a jednu pokládku. UNO použijete, keď vediete len jednu vetvu, alebo pri väčších dimenziách, ktoré sa v DUO nevyrábajú.' },
    { q: 'Akú dimenziu potrubia zvoliť?', a: 'Podľa výkonu a prietoku. Orientačne pre rodinný dom s tepelným čerpadlom postačia rúry 32 alebo 40 mm. Presný výpočet urobí projektant, alebo použite výpočtový nástroj výrobcu, na ktorý odkazujeme pri každom rade.' },
    { q: 'Ako hlboko sa potrubie ukladá a ako sa spája?', a: 'Ukladá sa do pieskového lôžka podľa montážneho návodu výrobcu. Spája sa svorno-lisovacími spojkami PE-X, koniec plášťa sa uzatvára teplom zmrštiteľnou koncovkou a prestup stenou tesnením Micro Press alebo Micro Seal.' },
    { q: 'Čo znamená štandardná a zosilnená izolácia?', a: 'Pri zosilnenej izolácii je rovnaká nosná rúra v hrubšom plášti, takže tepelná strata trasy je menšia. Oplatí sa pri dlhších trasách a vyšších teplotách. V tabuľke variantov ju označujeme pri každom obj. čísle.' },
  ],
  sanita: [
    { q: 'Prečo má sanitárne potrubie 10 bar a vykurovacie 6 bar?', a: 'Pitná voda v rozvode býva pod vyšším tlakom než vykurovacia voda, preto majú sanitárne rady hrubšiu stenu nosnej rúry a vyšší prevádzkový tlak. Na pitnú vodu vždy voľte sanitárne vyhotovenie.' },
    { q: 'Dá sa v jednom plášti viesť teplá aj studená voda?', a: 'Áno, rad DUO v sanitárnom vyhotovení má dve rúry v jednom plášti, jednu na teplú a jednu na studenú vodu. Ak potrebujete aj vykurovanie, pozrite rad QUADRO so štyrmi rúrami.' },
  ],
};

const cs: Record<string, Otazka[]> = {
  vykurovanie: [
    { q: 'UNO nebo DUO: kdy se vyplatí dvě trubky v jednom plášti?', a: 'Když potřebujete přívod i zpátečku na jedné trase, například od tepelného čerpadla nebo kotelny k domu. DUO znamená jeden výkop a jednu pokládku. UNO použijete, když vedete jen jednu větev, nebo u větších dimenzí, které se v DUO nevyrábějí.' },
    { q: 'Jakou dimenzi potrubí zvolit?', a: 'Podle výkonu a průtoku. Orientačně pro rodinný dům s tepelným čerpadlem postačí trubky 32 nebo 40 mm. Přesný výpočet udělá projektant, nebo použijte výpočtový nástroj výrobce, na který odkazujeme u každé řady.' },
    { q: 'Jak hluboko se potrubí ukládá a jak se spojuje?', a: 'Ukládá se do pískového lože podle montážního návodu výrobce. Spojuje se svěrnými lisovacími spojkami PE-X, konec pláště se uzavírá teplem smrštitelnou koncovkou a prostup stěnou těsněním Micro Press nebo Micro Seal.' },
    { q: 'Co znamená standardní a zesílená izolace?', a: 'U zesílené izolace je stejná nosná trubka v silnějším plášti, takže tepelná ztráta trasy je menší. Vyplatí se u delších tras a vyšších teplot. V tabulce variant ji označujeme u každého obj. čísla.' },
  ],
  sanita: [
    { q: 'Proč má sanitární potrubí 10 bar a topné 6 bar?', a: 'Pitná voda v rozvodu bývá pod vyšším tlakem než topná voda, proto mají sanitární řady silnější stěnu nosné trubky a vyšší provozní tlak. Na pitnou vodu vždy volte sanitární provedení.' },
    { q: 'Dá se v jednom plášti vést teplá i studená voda?', a: 'Ano, řada DUO v sanitárním provedení má dvě trubky v jednom plášti, jednu na teplou a jednu na studenou vodu. Pokud potřebujete i vytápění, podívejte se na řadu QUADRO se čtyřmi trubkami.' },
  ],
};

export const faq = (kategoriaId: string, lang: Lang): Otazka[] => (lang === 'cs' ? cs : sk)[kategoriaId] ?? [];
