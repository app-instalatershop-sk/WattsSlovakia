/** Otázky pred výberom podľa kategórie (slug). Texty spisovne, bez čísel bez zdroja. */
export const faq: Record<string, { q: string; a: string }[]> = {
  vykurovanie: [
    {
      q: 'UNO alebo DUO: kedy sa oplatia dve rúry v jednom plášti?',
      a: 'Keď potrebujete prívod aj spiatočku na jednej trase, napríklad od tepelného čerpadla alebo kotolne k domu. DUO znamená jeden výkop a jednu pokládku. UNO použijete, keď vediete len jednu vetvu, alebo pri väčších dimenziách, ktoré sa v DUO nevyrábajú.',
    },
    {
      q: 'Akú dimenziu potrubia zvoliť?',
      a: 'Podľa výkonu a prietoku. Orientačne pre rodinný dom s tepelným čerpadlom postačia rúry 32 alebo 40 mm. Presný výpočet urobí projektant, alebo použite výpočtový nástroj výrobcu, na ktorý odkazujeme pri každom rade.',
    },
    {
      q: 'Ako hlboko sa potrubie ukladá a ako sa spája?',
      a: 'Ukladá sa do pieskového lôžka podľa montážneho návodu výrobcu. Spája sa svorno-lisovacími spojkami PE-X, koniec plášťa sa uzatvára teplom zmrštiteľnou koncovkou a prestup stenou tesnením Micro Press alebo Micro Seal.',
    },
    {
      q: 'Čo znamená štandardná a zosilnená izolácia?',
      a: 'Pri zosilnenej izolácii je rovnaká nosná rúra v hrubšom plášti, takže tepelná strata trasy je menšia. Oplatí sa pri dlhších trasách a vyšších teplotách. V tabuľke variantov ju označujeme pri každom obj. čísle.',
    },
  ],
  sanita: [
    {
      q: 'Prečo má sanitárne potrubie 10 bar a vykurovacie 6 bar?',
      a: 'Pitná voda v rozvode býva pod vyšším tlakom než vykurovacia voda, preto majú sanitárne rady hrubšiu stenu nosnej rúry a vyšší prevádzkový tlak. Na pitnú vodu vždy voľte sanitárne vyhotovenie.',
    },
    {
      q: 'Dá sa v jednom plášti viesť teplá aj studená voda?',
      a: 'Áno, rad DUO v sanitárnom vyhotovení má dve rúry v jednom plášti, jednu na teplú a jednu na studenú vodu. Ak potrebujete aj vykurovanie, pozrite rad QUADRO so štyrmi rúrami.',
    },
  ],
};
