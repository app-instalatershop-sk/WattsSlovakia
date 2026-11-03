// Automatická kontrola polishu (Juraj 1. 11. 2026: „poďme urobiť polish, ale profesionálne“). Každá stránka SK aj CS
// na počítači a telefóne:
//  - axe (WCAG 2.0 až 2.2 A/AA a odporúčané postupy), porušenia s ukážkou prvku;
//  - sadzba podľa STN 01 6910: medzera pred jednotkou a za Ø/× nezlomiteľná, jednopísmenové predložky a spojky
//    nesmú ostať na konci riadku, rovné úvodzovky, rozsah so spojovníkom, tri bodky, dĺžka riadku (DESIGN.md: 70 znakov),
//    zarovnanie do bloku alebo na stred, verzálky cez text-transform;
//  - dotykové ciele na telefóne (WCAG 2.5.8: 24 px; Apple a Material odporúčajú 44 až 48 px), okrem odkazov vo vete;
//  - ostrosť obrázkov na telefóne (2×): stiahnutý obrázok užší, než ho displej zobrazí;
//  - súpis štýlov na počítači (písmo, farby textu a plôch, zaoblenia, tiene, medzery) ako CSS Stats.
// Server: node snimky-stranok/_skripty/server.mjs web/dist 4330. Spustenie: node data/polish-audit.mjs web/dist <výstup.json>,
// súhrn: python data/polish_suhrn.py <výstup.json> (docs/POLISH.md).
import { createRequire } from 'node:module';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const AXE = require.resolve('axe-core/axe.min.js');
const [DIST, OUT] = process.argv.slice(2);
const B = 'http://127.0.0.1:4330';
const stranky = [];
const prejdi = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) prejdi(p); else if (f === 'index.html') stranky.push('/' + relative(DIST, d).replace(/\\/g, '/') + (relative(DIST, d) ? '/' : '')); } };
prejdi(DIST);
stranky.sort();
if (process.env.LEN) stranky.splice(0, stranky.length, ...process.env.LEN.split(',')); // skúška na pár stránkach

// Spustí sa v stránke: sadzba, dotykové ciele, ostrosť, súpis štýlov.
function skenuj(zar) {
  const viditelny = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const kde = (e) => { const s = []; let x = e; for (let i = 0; i < 3 && x && x !== document.body; i++) { s.unshift(x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (x.classList[0] ? '.' + x.classList[0] : '')); x = x.parentElement; } return s.join(' > '); };
  const out = { sadzba: [], riadky: [], zarovnanie: [], verzalky: [], ciele: [], ostrost: [] };
  // Sadzba v textových uzloch (viditeľných, mimo skriptov a štýlov).
  const VZORY = [
    ['jednotka', /\d (mm|cm|km|m|kW|W|kg\/m|kg|bar|°C|K|%|t|ks|l|h|min)(?![\p{L}\d])/gu],
    ['Ø a ×', /Ø \d|\d ×|× \d/gu],
    ['predložka na konci riadku', /(?:^|[\s(„])([vszkoaiuVSZKOAIU]) (?=[\p{L}\d„(])/gu],
    ['rovné úvodzovky', /"/gu],
    ['rozsah so spojovníkom', /(?<![\p{L}\d.\/])\d+-\d+(?![\p{L}\d])/gu],
    ['tri bodky', /\.\.\./gu],
  ];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => {
    const p = n.parentElement; if (!p || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    if (p.closest('script, style, noscript, code, pre, [aria-hidden="true"] svg, .tv-kod, [data-volba-data]')) return NodeFilter.FILTER_REJECT;
    return viditelny(p) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  for (let n; (n = w.nextNode());) {
    const t = n.nodeValue;
    const ws = getComputedStyle(n.parentElement).whiteSpace;
    if (/nowrap|pre/.test(ws)) continue; // štítky a popisy, ktoré sa nezalamujú, nemajú kde zlomiť riadok
    for (const [druh, re] of VZORY) for (const m of t.matchAll(re)) {
      if (druh === 'predložka na konci riadku' && (n.parentElement.textContent || '').trim().length < 40) continue; // krátke popisky a tlačidlá
      const i = m.index; out.sadzba.push({ druh, ukazka: t.slice(Math.max(0, i - 18), i + m[0].length + 18).replace(/\s+/g, ' ').trim(), kde: kde(n.parentElement) });
    }
  }
  // Dĺžka riadku a zarovnanie odsekov (len počítač, dlhšie texty).
  if (zar === 'pocitac') for (const e of document.querySelectorAll('main p, main li, main dd, main figcaption, main blockquote')) {
    if (!viditelny(e) || e.closest('table, nav, [role="tablist"]')) continue;
    // Len viditeľný text: zbalený popis (vrstvy rezu v nízkom okne, rz-tesne: výška 0, nepriehľadnosť 0) sa nepočíta,
    // inak delí celý text dvoma riadkami nadpisu a hodnoty (3. 11. 2026: falošných 98 znakov na riadok).
    const skryty = (x) => { for (; x && x !== e; x = x.parentElement) if (getComputedStyle(x).display !== 'contents' && !viditelny(x)) return true; return false; };
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    let t = ''; for (let n; (n = tw.nextNode());) if (!skryty(n.parentElement)) t += n.nodeValue + ' ';
    t = t.replace(/\s+/g, ' ').trim(); if (t.length < 140) continue;
    const cs = getComputedStyle(e); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    const riadkov = Math.max(1, Math.round(e.getBoundingClientRect().height / lh));
    if (riadkov < 2) continue;
    const znakov = Math.round(t.length / riadkov);
    if (znakov > 75) out.riadky.push({ znakov, riadkov, ukazka: t.slice(0, 60), kde: kde(e) });
    if (/justify|center/.test(cs.textAlign) && riadkov > 2) out.zarovnanie.push({ zarovnanie: cs.textAlign, ukazka: t.slice(0, 60), kde: kde(e) });
  }
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length || !viditelny(e)) continue;
    if (getComputedStyle(e).textTransform === 'uppercase' && e.textContent.trim()) out.verzalky.push({ ukazka: e.textContent.trim().slice(0, 40), kde: kde(e) });
  }
  // Dotykové ciele (telefón): interaktívne prvky menšie ako 24 alebo 44 px, okrem odkazu vo vete.
  const ciele = zar === 'mobil' ? [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [tabindex="0"]')].filter((e) => viditelny(e) && !e.closest('[hidden], [inert]')) : [];
  const obd = ciele.map((e) => e.getBoundingClientRect());
  const rozsir = (r) => { const cx = r.left + r.width / 2, cy = r.top + r.height / 2, w = Math.max(24, r.width), h = Math.max(24, r.height); return { l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2 }; };
  const prekryva = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  if (zar === 'mobil') for (const [ix, e] of ciele.entries()) {
    const r0 = obd[ix]; const cs = getComputedStyle(e);
    // plocha na dotyk vrátane neviditeľného presahu (::after, global.css „Dotyková plocha“)
    const pa = getComputedStyle(e, '::after');
    const r = pa.content !== 'none' && pa.position === 'absolute' ? { width: Math.max(r0.width, parseFloat(pa.width) || 0), height: Math.max(r0.height, parseFloat(pa.height) || 0), left: r0.left, right: r0.right, top: r0.top, bottom: r0.bottom } : r0;
    const vVete = cs.display === 'inline' && e.parentElement && /^(P|LI|DD|SPAN|SMALL|TD|FIGCAPTION)$/.test(e.parentElement.tagName) && e.parentElement.textContent.trim().length > e.textContent.trim().length + 15;
    if (vVete) continue;
    const m = Math.min(r.width, r.height);
    // pod 24 px: prejde len s odstupom (výnimka WCAG 2.5.8), inak porušenie; 24 až 43 px: pod odporúčaním Apple/Material
    let wcag = m >= 24;
    if (!wcag) { const a = rozsir(r); wcag = !obd.some((o, j) => j !== ix && !e.contains(ciele[j]) && !ciele[j].contains(e) && prekryva(a, Math.min(o.width, o.height) < 24 ? rozsir(o) : { l: o.left, r: o.right, t: o.top, b: o.bottom })); }
    if (m < 44) out.ciele.push({ wcag, w: Math.round(r.width), h: Math.round(r.height), text: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 40), kde: kde(e) });
  }
  // Ostrosť obrázkov (telefón 2×): skutočná šírka stiahnutého súboru (z deskriptora w v srcset; naturalWidth je pri
  // responzívnom obrázku prepočítaná cez sizes) menšia ako 85 % šírky, ktorú displej zobrazí.
  if (zar === 'mobil') for (const i of document.images) {
    if (!viditelny(i) || !i.complete || !i.naturalWidth || /\.svg(\?|$)/.test(i.currentSrc)) continue;
    const r = i.getBoundingClientRect(); if (r.width <= 80) continue;
    const zdroje = [...(i.closest('picture')?.querySelectorAll('source') ?? []), i];
    const kandidati = zdroje.flatMap((el) => (el.getAttribute('srcset') || '').split(',').map((c) => c.trim().split(/\s+/)).filter((c) => c[0]));
    const cesta = new URL(i.currentSrc, location.href).pathname;
    const zhoda = kandidati.find(([u]) => new URL(u, location.href).pathname === cesta);
    const sirkaSuboru = zhoda?.[1]?.endsWith('w') ? parseInt(zhoda[1]) : Math.round(i.naturalWidth * (zhoda?.[1]?.endsWith('x') ? parseFloat(zhoda[1]) : 1));
    // pri object-fit: cover sa obrázok zväčší tak, aby pokryl rám aj na výšku
    const fit = getComputedStyle(i).objectFit;
    const sirkaNaDispleji = fit === 'cover' ? Math.max(r.width, r.height * i.naturalWidth / i.naturalHeight) : r.width;
    const potrebne = Math.round(sirkaNaDispleji * devicePixelRatio);
    if (sirkaSuboru < potrebne * 0.85) {
      const el = zdroje.find((x) => x.getAttribute('sizes'));
      out.ostrost.push({ zobrazene: Math.round(r.width), vyska: Math.round(r.height), suborSirka: sirkaSuboru, potrebne, src: cesta.split('/').pop().slice(0, 60), sirky: kandidati.map((c) => c[1]).filter(Boolean).filter((x, j, a) => a.indexOf(x) === j).join(' '), sizes: el?.getAttribute('sizes') ?? '', kde: kde(i) });
    }
  }
  // Súpis štýlov (počítač): kombinácie písma, farby, zaoblenia, tiene, medzery.
  if (zar === 'pocitac') {
    const s = { pismo: {}, farbaTextu: {}, plocha: {}, zaoblenie: {}, tien: {}, medzery: {} };
    const pridaj = (o, k) => { o[k] = (o[k] || 0) + 1; };
    for (const e of document.querySelectorAll('body *')) {
      if (!viditelny(e)) continue;
      const cs = getComputedStyle(e);
      const maText = [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
      if (maText) { pridaj(s.pismo, `${cs.fontFamily.split(',')[0].replace(/["']/g, '')} ${cs.fontWeight} ${Math.round(parseFloat(cs.fontSize) * 10) / 10}px${/^H[1-3]$/.test(e.tagName) ? ' (nadpis)' : ''}`); pridaj(s.farbaTextu, cs.color); }
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') pridaj(s.plocha, cs.backgroundColor);
      if (cs.borderRadius !== '0px') pridaj(s.zaoblenie, cs.borderRadius);
      if (cs.boxShadow !== 'none') pridaj(s.tien, cs.boxShadow.replace(/rgba?\([^)]*\)/g, 'c').slice(0, 80));
      for (const v of [cs.marginTop, cs.marginBottom, cs.paddingTop, cs.paddingBottom, cs.paddingLeft, cs.rowGap, cs.columnGap]) { const px = parseFloat(v); if (px > 0 && Number.isFinite(px)) pridaj(s.medzery, Math.round(px)); }
    }
    out.styly = s;
  }
  return out;
}

const browser = await chromium.launch({ channel: 'chrome' });
const vysledok = { pocet: stranky.length, stranky: {} };
let n = 0;
for (const [zar, nast] of [['pocitac', { viewport: { width: 1440, height: 900 } }], ['mobil', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
  const ctx = await browser.newContext(nast);
  const page = await ctx.newPage();
  for (const s of stranky) {
    try {
      await page.goto(B + s, { waitUntil: 'networkidle', timeout: 30000 });
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 800) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(30); }
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(200);
      await page.addScriptTag({ path: AXE });
      const axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, uzly: v.nodes.length, ukazky: v.nodes.slice(0, 3).map((x) => ({ ciel: x.target.join(' '), html: x.html.slice(0, 160), pozn: (x.failureSummary || '').split('\n').slice(1, 2).join(' ').slice(0, 160) })) }));
      });
      const sken = await page.evaluate(skenuj, zar);
      (vysledok.stranky[s] ??= {})[zar] = { axe, ...sken };
    } catch (e) { (vysledok.stranky[s] ??= {})[zar] = { chyba: e.message.split('\n')[0] }; }
    if (++n % 25 === 0) console.log('hotových', n, 'z', stranky.length * 2);
  }
  await ctx.close();
}
writeFileSync(OUT, JSON.stringify(vysledok, null, 1));
console.log('hotové', n);
await browser.close();
