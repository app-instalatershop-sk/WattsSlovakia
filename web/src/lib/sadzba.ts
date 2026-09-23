/**
 * Pravidlá sadzby pre slovenčinu a češtinu: číslo sa neoddelí od jednotky, jednopísmenová
 * predložka alebo spojka neostane na konci riadku a označenie normy drží pokope.
 * Nahrádza medzeru nezlomiteľnou (U+00A0), text sa inak nemení.
 */
const NBSP = ' ';

export function sadzba(text: string): string {
  return text
    // „a uzavretými“, „s dvojitou“, „v jednom“ – aj za sebou („a v“), preto lookbehind.
    .replace(/(?<=^|[\s(„])([aikosuvzAIKOSUVZ]) /g, `$1${NBSP}`)
    // „95 °C“, „16 bar“, „1 %“, „0,5 až 6 m“, „60 t“
    .replace(/(\d) (°C|bar|%|mm|m|t|kg|kW|W|min)(?=[\s.,;:)]|$)/g, `$1${NBSP}$2`)
    // „EN ISO 15875“, „DIN 4726“, „PE 100“, „SDR 11“
    .replace(/\b(EN|ISO|DIN|PE|SDR) (?=\d|ISO)/g, `$1${NBSP}`);
}
