import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

/** Dáta generuje data/normalize.py z katalógu Watts (SK aj CZ). Schéma tu stráži tvar pri každom builde. */

const subor = z.object({
  nazov: z.string(),
  typ: z.enum(['PDF', 'DWG', 'DXF', 'EPD']),
  jazyk: z.string().nullable(),
  url: z.string().url(),
});

const tabulka = z.object({ head: z.array(z.string()), rows: z.array(z.array(z.string())) });
const n = z.number().nullable().optional();
const s = z.string().nullable().optional();

const kategorie = defineCollection({
  loader: file('src/data/kategorie.json'),
  schema: z.object({
    id: z.string(), slug: z.string(), slug_cs: z.string(),
    nazov: z.string(), nazov_cs: z.string(), kratky_nazov: z.string(), kratky_nazov_cs: z.string(),
    popis: z.string(), popis_cs: z.string(),
    typ: z.enum(['potrubie', 'spojky', 'prislusenstvo']),
    piktogram: z.string().nullable(), poradie: z.number(),
    nazov_watts: z.string(), nazov_watts_cs: s,
    rady: z.array(z.string()), zdroj_url: z.string().url(), stiahnute: z.string(),
  }),
});

const rady = defineCollection({
  loader: file('src/data/rady.json'),
  schema: z.object({
    id: z.string(), slug: z.string(), kategoria: z.string(), poradie: z.number(),
    nazov: z.string(), nazov_cs: s, nazov_watts: z.string(), nazov_watts_cs: s,
    popis: z.string().nullable(), popis_cs: s, kratky_popis: s, kratky_popis_cs: s,
    medium: s, medium_cs: s, tlak_bar: n, pocet_rur: n,
    piktogram: s, fotka: z.string().nullable(), subory: z.array(subor),
    je_skupina: z.boolean(), produkty: z.array(z.string()), suvisiace: z.array(z.string()),
    pocet_variantov: z.number(), zdroj_url: z.string().url(), stiahnute: z.string(),
  }),
});

const varianty = defineCollection({
  loader: file('src/data/varianty.json'),
  schema: z.object({
    id: z.string(), obj_cislo: z.string(), rad: z.string(), poradie: z.number(),
    plast_mm: n,
    rura: z.object({ d: z.number().nullable(), s: z.number().nullable() }).nullable().optional(),
    rura_text: z.string().optional(), tlak_bar: n, dn: z.string().optional(),
    hmotnost_kg_m: n, izolacia: z.enum(['standard', 'zosilnena']).optional(), polomer_ohybu_m: n,
    kotuc: z.object({ d: z.number().nullable(), sirka: z.number().nullable() }).nullable().optional(),
    eshop_url: z.string().url(), raw: z.record(z.string(), z.string()),
  }),
});

const produkty = defineCollection({
  loader: file('src/data/produkty.json'),
  schema: z.object({
    id: z.string(), slug: z.string(), skupina: z.string(), kategoria: z.string(),
    nazov: z.string(), nazov_cs: s, nazov_watts: z.string(), popis: z.string().nullable(), popis_cs: s,
    subory: z.array(subor), pocet_variantov: z.number(), tabulky: z.array(tabulka),
    zdroj_url: z.string().url(), stiahnute: z.string(),
  }),
});

export const collections = { kategorie, rady, varianty, produkty };
