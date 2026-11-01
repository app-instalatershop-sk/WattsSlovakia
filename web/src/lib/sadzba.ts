/**
 * Pravidlá sadzby pre slovenčinu a češtinu (STN 01 6910): číslo sa neoddelí od jednotky, jednopísmenová
 * predložka alebo spojka neostane na konci riadku a označenie normy drží pokope.
 * Nahrádza medzeru nezlomiteľnou (U+00A0), text sa inak nemení. Od 1. 11. 2026 (polish) sa po builde
 * použije aj na celý text každej stránky (integrations/sadzba.mjs), nielen na texty, ktoré ju volajú.
 */
const NBSP = '\u00a0'; // nezlomiteľná medzera, zapísaná kódom (v texte sa nedá rozoznať od obyčajnej)

export function sadzba(text: string): string {
  return text
    // „a uzavretými“, „s dvojitou“, „v jednom“ – aj za sebou („a v“), preto lookbehind.
    .replace(/(?<=^|[\s(„])([aikosuvzAIKOSUVZ]) /g, `$1${NBSP}`)
    // „95 °C“, „16 bar“, „1 %“, „0,5 až 6 m“, „60 t“, „3,10 kg/m“, „255 m²“, „λ 0,0372 W/m·K“
    .replace(/(\d) (°C|bar|%|mm|cm|km|m²|m³|m|t|kg\/m|kg|kW|W\/m·K|W|K|min|h|ks)(?=[\s.,;:)/?!]|$)/g, `$1${NBSP}$2`)
    // „EN ISO 15875“, „DIN 4726“, „PE 100“, „SDR 11“
    .replace(/\b(EN|ISO|DIN|PE|SDR) (?=\d|ISO)/g, `$1${NBSP}`)
    // „Ø 125“, „λ 0,0372“, „2 × 25“
    .replace(/([Øλ]) (?=\d)/g, `$1${NBSP}`)
    .replace(/(\d) × (?=\S)/g, `$1${NBSP}×${NBSP}`) // aj „3 × PE-X“
    // „s. 36“, „č. 18“ a dátum „1. 11. 2026“
    .replace(/(?<=^|[\s(])(s|str|č)\. (?=\d)/g, `$1.${NBSP}`)
    .replace(/\b(\d{1,2})\. (\d{1,2})\. (?=\d{4}\b)/g, `$1.${NBSP}$2.${NBSP}`);
}
