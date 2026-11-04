import type { Lang } from '../i18n/ui';

/**
 * Prevádzkovateľ webu a predajne. Zdroj: https://www.instalatershop.sk/kontakty/ (overené 23. 9. 2026).
 * Údaje sa menia len tu; používa ich pätička, záver stránok, kontakt a štruktúrované dáta.
 */
export const FIRMA = {
  nazov: 'Ohrievacia Technika, s. r. o.',
  obchod: 'Inštalatérshop',
  eshop: 'https://www.instalatershop.sk/',
  eshopNazov: 'instalatershop.sk',
  sidlo: { ulica: 'Staškov 200', psc: '023 53', mesto: 'Staškov' },
  predajna: { ulica: 'Raková 4131', psc: '023 51', mesto: 'Raková', areal: 'areál AVC' },
  ico: '44669615',
  dic: '2022776426',
  icdph: 'SK2022776426',
  telefon: '+421 41 422 0422',
  telefonHref: 'tel:+421414220422',
  email: 'info@instalatershop.sk',
  emailDopyt: 'dotazy@instalatershop.sk',
  /** Podmienky ochrany osobných údajov (e-shop, tá istá firma); odkaz pod formulárom dopytu. */
  gdpr: 'https://www.instalatershop.sk/gdpr/',
  /** schema.org openingHours */
  hodinySchema: ['Mo-Fr 07:00-16:00', 'Sa 08:00-12:00'],
};

const texty = {
  sk: {
    register: 'Zapísaná v Obchodnom registri Okresného súdu Žilina, oddiel Sro, vložka č. 50951/L.',
    hodiny: [['Pondelok až piatok', '7:00 – 16:00'], ['Sobota', '8:00 – 12:00'], ['Nedeľa', 'zatvorené']] as [string, string][],
    hodinyKratko: 'Po – Pi 7:00 – 16:00, So 8:00 – 12:00',
  },
  cs: {
    register: 'Zapsaná v obchodním rejstříku Okresního soudu Žilina, oddíl Sro, vložka č. 50951/L.',
    hodiny: [['Pondělí až pátek', '7:00 – 16:00'], ['Sobota', '8:00 – 12:00'], ['Neděle', 'zavřeno']] as [string, string][],
    hodinyKratko: 'Po – Pá 7:00 – 16:00, So 8:00 – 12:00',
  },
};
export const firma = (lang: Lang) => texty[lang];
