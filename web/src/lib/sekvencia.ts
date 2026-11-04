/**
 * Prehrávač sekvencie snímok z 3D modelu na <canvas>: rozložený rez (Rozklad.astro), ohyb (Ohyb.astro)
 * a odvaľovanie kotúča (KotucSekvencia.astro).
 *
 * Pohyb sa prehrá sám, raz a plynulo, keď je obraz v okne (Juraj 4. 11. 2026: rolovanie cez dlhé sekcie trvalo
 * dlho; z návrhov A, B, C vybral A, bez interakcií v obraze, lebo nie každý uvidí, že sa to dá). Sekcia je preto
 * len taká vysoká ako obsah a jediné ovládanie je tlačidlo Prehrať znova (SekvenciaOvladanie.astro).
 *  - chod(f, ms): plynulo na polohu f (0 až 1 celej sekvencie) za ms, s mäkkým rozbehom aj dojazdom,
 *  - nastav(f): hneď na polohu.
 * Plynulosť (Juraj 28. 10. 2026: „pôsobia sekavo“): poloha je desatinná a susedné snímky sa prelínajú,
 * stojaci obraz je vždy celá snímka, teda ostrý.
 * Snímky sú vopred dekódované (ImageBitmap v rozmere plátna), kreslenie nečaká na dekódovanie AVIF.
 * Dekódované snímky držia pamäť, preto ich je najviac za rozpočet bajtov okolo práve zobrazenej a sekcia
 * ďaleko od okna ich uvoľní. Stiahnuté súbory ostávajú.
 * Sťahovanie začne, keď je sekcia do jeden a pol okna od zobrazenia: prvá snímka (overí AVIF), posledná,
 * potom hrubo po 8, 4, 2 a nakoniec všetky. Prehranie počká, kým sú snímky pripravené, najviac 2,5 s;
 * na pomalom pripojení potom ide s tým, čo je (chýbajúcu snímku nahradí najbližšia).
 */

export interface Sekvencia {
  /** Sekcia: pri nej sa začne sťahovať, ďaleko od nej sa uvoľní pamäť. */
  koren: HTMLElement;
  /** Rámik plátna (z neho rozmer) a plátno. */
  stage: HTMLElement;
  platno: HTMLCanvasElement;
  cesta: string;
  n: number;
  sirky: number[];
  /** Popisy k obrazu pri každom snímku: x = desatinný index snímky 0 až n − 1. */
  popisy: (x: number) => void;
  /** Prvá snímka je na plátne. */
  bezi: () => void;
  /** Prehliadač nevie AVIF: ostáva statický obraz. */
  zlyhalo: () => void;
  signal: AbortSignal;
}

export interface Prehravac {
  /** Plynulo na polohu f za ms. Splní sa true po dobehnutí, false keď ho prerušil iný pohyb. */
  chod: (f: number, ms: number) => Promise<boolean>;
  /** Hneď na polohu f. */
  nastav: (f: number) => void;
  /** Splní sa, keď sú snímky stiahnuté a dekódované na plynulé prehranie, najneskôr po max ms. */
  pripravene: (max: number) => Promise<void>;
  /** Pozastaví bežiaci pohyb (obraz mimo okna); jeho čas stojí. */
  pauza: (b: boolean) => void;
}

const VLAKNA = 4;      // súbežné sťahovanie
const DEKODERY = 3;    // súbežné dekódovanie

/** Pohyb predmetu: mäkký rozbeh aj dojazd (nie odozva rozhrania, tá má --ease-soft). */
const krivka = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

type Snimka = ImageBitmap | HTMLImageElement;
const zavri = (o: Snimka | undefined) => { if (o && 'close' in o) o.close(); };

export function prehravaj(s: Sekvencia): Prehravac {
  const { koren, stage, platno, n, signal } = s;
  const ctx = platno.getContext('2d')!;
  const sirky = [...s.sirky].sort((a, b) => a - b);
  const subory: (Blob | undefined)[] = new Array(n);
  const snimky: (Snimka | undefined)[] = new Array(n);
  const dekoduje = new Set<number>();
  // stolný počítač (deviceMemory 8) unesie celú sekvenciu aj pri jemnom displeji, telefón okolo 100 MB
  const rozpocet = ((navigator as { deviceMemory?: number }).deviceMemory ?? 4) >= 8 ? 240e6 : 100e6;
  const cela = (f: number) => Math.round(Math.min(1, Math.max(0, f)) * (n - 1)) / (n - 1);
  let sirka = sirky[sirky.length - 1], sirkaDek = sirka, najviac = n;
  let p = 0, smer = 1, stred = 0;
  let nakreslene = '', raf = 0, cas = 0, dokoncene = 0;
  let blizko = false, zacate = false, bezi = false, koniec = false, pozastavene = false;
  let pohyb: { od: number; do: number; ms: number; t: number; hotovo: (b: boolean) => void } | null = null;
  const cakaju: (() => void)[] = [];

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const velkost = () => {
    const w = Math.round(stage.clientWidth * dpr()), h = Math.round(stage.clientHeight * dpr());
    if (w !== platno.width || h !== platno.height) { platno.width = w; platno.height = h; nakreslene = ''; }
    sirkaDek = Math.min(w || sirka, sirka);
    const bajty = sirkaDek * sirkaDek * (h / Math.max(1, w)) * 4;
    najviac = Math.max(12, Math.min(n, Math.floor(rozpocet / Math.max(1, bajty))));
  };
  const najblizsia = (i: number) => {
    for (let d = 0; d < n; d++) {
      if (snimky[i - d]) return i - d;
      if (snimky[i + d]) return i + d;
    }
    return -1;
  };

  // Prelínanie: (1 − t)·A + t·B v premultiplikovaných farbách (druhá snímka sa pripočíta), takže aj priehľadné
  // okraje a tieň prechádzajú bez záblesku.
  const kresli = (x: number) => {
    const a = Math.min(n - 1, Math.floor(x));
    const t = Math.round((x - a) * 64) / 64;
    let A = snimky[a], B = t > 0 ? snimky[a + 1] : undefined, ia = a;
    if (!A || (t > 0 && !B)) {
      ia = najblizsia(Math.round(x));
      if (ia < 0) return;
      A = snimky[ia];
      B = undefined;
    }
    const kluc = `${ia}:${B ? t : 0}:${platno.width}`;
    if (kluc === nakreslene) return;
    nakreslene = kluc;
    const W = platno.width, H = platno.height;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = B ? 1 - t : 1;
    ctx.drawImage(A!, 0, 0, W, H);
    if (B) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = t;
      ctx.drawImage(B, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    if (!bezi) { bezi = true; s.bezi(); }
  };

  // Pohyb ide podľa uplynutého času, nie podľa hodín: pozastavenie (obraz mimo okna) ani skrytá karta ho nepreskočia.
  const tik = (t: number) => {
    raf = 0;
    const dt = cas ? Math.min(64, t - cas) : 1000 / 60;
    cas = t;
    if (pohyb) {
      if (!pozastavene) pohyb.t = Math.min(pohyb.ms, pohyb.t + dt);
      const u = pohyb.ms > 0 ? pohyb.t / pohyb.ms : 1;
      p = pohyb.od + (pohyb.do - pohyb.od) * krivka(u);
      if (u >= 1) { const h = pohyb.hotovo; p = pohyb.do; pohyb = null; h(true); }
    }
    const x = p * (n - 1);
    kresli(x);
    s.popisy(x);
    if (Math.round(x) !== stred) { stred = Math.round(x); planuj(); }
    if (pohyb && !pozastavene) raf = requestAnimationFrame(tik);
    else cas = 0;
  };
  const naplanuj = () => { if (!raf && !signal.aborted) raf = requestAnimationFrame(tik); };

  // Pripravené na prehranie: všetky súbory sťahovanie skúsilo a dekódovaných je toľko, koľko unesie pamäť.
  const skontroluj = () => {
    if (!cakaju.length) return;
    const mam = snimky.reduce((k, o) => k + (o ? 1 : 0), 0);
    const ma = subory.reduce((k, o) => k + (o ? 1 : 0), 0);
    if (koniec || (dokoncene >= n && mam >= Math.min(najviac, ma))) cakaju.splice(0).forEach((f) => f());
  };

  // Dekódovanie: snímky podľa vzdialenosti od zobrazenej, vpred v smere pohybu skôr; nad rozpočet sa
  // zahodí najvzdialenejšia.
  const vzdialenost = (i: number) => Math.abs(i - stred) - (Math.sign(i - stred) === smer ? 0.5 : 0);
  const obraz = async (i: number): Promise<Snimka> => {
    const b = subory[i]!;
    if ('createImageBitmap' in window) {
      if (sirkaDek < sirka) try { return await createImageBitmap(b, { resizeWidth: sirkaDek, resizeQuality: 'high' }); } catch { /* bez zmenšenia */ }
      try { return await createImageBitmap(b); } catch { /* starší Safari: obyčajný obrázok */ }
    }
    const im = new Image();
    im.src = url(i);
    await im.decode();
    return im;
  };
  const dekoduj = async (i: number) => {
    dekoduje.add(i);
    try {
      const o = await obraz(i);
      if (signal.aborted || !blizko) zavri(o);
      else { zavri(snimky[i]); snimky[i] = o; naplanuj(); }
    } catch { /* poškodená snímka: kreslí sa susedná */ }
    dekoduje.delete(i);
    planuj();
    skontroluj();
  };
  const planuj = () => {
    if (!blizko || signal.aborted) return;
    const poradie = [...Array(n).keys()].sort((i, j) => vzdialenost(i) - vzdialenost(j));
    let drzane = snimky.filter(Boolean).length;
    for (let k = poradie.length - 1; k >= najviac && drzane > najviac; k--) {
      const i = poradie[k];
      if (snimky[i]) { zavri(snimky[i]); snimky[i] = undefined; drzane--; }
    }
    for (const i of poradie.slice(0, najviac)) {
      if (dekoduje.size >= DEKODERY) break;
      if (!snimky[i] && subory[i] && !dekoduje.has(i)) void dekoduj(i);
    }
  };
  const uvolni = () => { snimky.forEach((o, i) => { zavri(o); snimky[i] = undefined; }); nakreslene = ''; };

  const url = (i: number) => `${s.cesta}${sirka}/${String(i).padStart(3, '0')}.avif`;
  const stiahni = async () => {
    if (zacate) return;
    zacate = true;
    const potrebna = stage.clientWidth * dpr();
    sirka = sirky.find((w) => w >= potrebna * 0.85) ?? sirky[sirky.length - 1];
    velkost();
    const nacitaj = async (i: number) => {
      try {
        const r = await fetch(url(i), { signal });
        if (!r.ok) throw new Error(String(r.status));
        subory[i] = await r.blob();
      } finally { dokoncene++; }
    };
    const prva = stred;
    try {
      await nacitaj(prva);
      snimky[prva] = await obraz(prva);
    } catch {
      koniec = true;
      skontroluj();
      if (!signal.aborted) s.zlyhalo();
      return;
    }
    naplanuj();
    const poradie: number[] = [];
    for (const krok of [n - 1, 8, 4, 2, 1]) for (let i = 0; i < n; i += krok) if (i !== prva && !poradie.includes(i)) poradie.push(i);
    if (prva !== n - 1 && !poradie.includes(n - 1)) poradie.unshift(n - 1);
    let k = 0;
    const vlakno = async () => {
      while (k < poradie.length && !signal.aborted) {
        try { await nacitaj(poradie[k++]); planuj(); } catch { /* chýbajúca snímka: použije sa susedná */ }
        skontroluj();
      }
    };
    await Promise.all(Array.from({ length: VLAKNA }, vlakno));
  };

  const pozorovatel = new IntersectionObserver((z) => {
    const b = z.some((e) => e.isIntersecting);
    if (b === blizko) return;
    blizko = b;
    if (blizko) { void stiahni(); planuj(); naplanuj(); }
    else uvolni();
  }, { rootMargin: '150% 0px' });
  pozorovatel.observe(koren);

  // plátno podľa rámika, aj keď sa zmení len rámik, nie okno
  const pozorVelkost = new ResizeObserver(() => { velkost(); planuj(); naplanuj(); });
  pozorVelkost.observe(stage);
  window.addEventListener('resize', naplanuj, { signal });

  const zrus = () => { if (pohyb) { const h = pohyb.hotovo; pohyb = null; h(false); } };
  signal.addEventListener('abort', () => {
    koniec = true;
    zrus();
    cakaju.splice(0).forEach((f) => f());
    pozorovatel.disconnect();
    pozorVelkost.disconnect();
    cancelAnimationFrame(raf);
    uvolni();
  });
  naplanuj();

  return {
    chod: (f, ms) => new Promise<boolean>((hotovo) => {
      zrus();
      if (signal.aborted) { hotovo(false); return; }
      const c = cela(f);
      if (c !== p) smer = c > p ? 1 : -1;
      pohyb = { od: p, do: c, ms: Math.max(0, ms), t: 0, hotovo };
      planuj();
      naplanuj();
    }),
    nastav: (f) => {
      zrus();
      p = cela(f);
      stred = Math.round(p * (n - 1));
      planuj();
      naplanuj();
    },
    pripravene: (max) => new Promise<void>((hotovo) => {
      let raz = false;
      const f = () => { if (!raz) { raz = true; hotovo(); } };
      cakaju.push(f);
      window.setTimeout(f, max);
      skontroluj();
    }),
    pauza: (b) => {
      if (b === pozastavene) return;
      pozastavene = b;
      cas = 0;
      if (!b) naplanuj();
    },
  };
}

/**
 * Spustenie pri zobrazení: `start` príde raz, keď stred obrazu prejde do horných 70 % okna pod hlavičkou
 * (polovica obrazu je v tom páse) a obraz tam ostane 250 ms, takže rýchle prerolovanie okolo ho nespustí
 * a na telefóne sa nespustí, kým je obraz len pri spodnom okraji. Potom `vidno` hlási, či je z obrazu
 * v okne aspoň tretina (na pozastavenie pohybu, ktorý sa spustil sám).
 * hore: hlavička (a pás častí stránky) prekrýva vrch okna, tá časť sa nepočíta.
 */
export function priZobrazeni(el: HTMLElement, hore: number, signal: AbortSignal, start: () => void, vidno: (b: boolean) => void) {
  let spustene = false, casovac = 0, naposledy: boolean | undefined;
  const prahy = Array.from({ length: 21 }, (_, i) => i / 20);
  const spust = new IntersectionObserver(([e]) => {
    const pas = e.rootBounds?.height ?? window.innerHeight * 0.7 - hore;
    if (e.isIntersecting && e.intersectionRect.height >= 0.5 * Math.min(e.boundingClientRect.height, pas)) {
      if (!casovac) casovac = window.setTimeout(() => { spustene = true; spust.disconnect(); start(); }, 250);
    } else { clearTimeout(casovac); casovac = 0; }
  }, { rootMargin: `-${Math.round(hore)}px 0px -30% 0px`, threshold: prahy });
  const pozor = new IntersectionObserver(([e]) => {
    if (!spustene) return;
    const h = e.isIntersecting ? e.intersectionRect.height : 0;
    const b = h >= Math.min(e.boundingClientRect.height, window.innerHeight - hore) / 3;
    if (b !== naposledy) { naposledy = b; vidno(b); }
  }, { rootMargin: `-${Math.round(hore)}px 0px 0px 0px`, threshold: prahy });
  spust.observe(el);
  pozor.observe(el);
  signal.addEventListener('abort', () => { spust.disconnect(); pozor.disconnect(); clearTimeout(casovac); });
}

/**
 * Prehranie spoločné pre rez, ohyb a kotúč: raz samo pri zobrazení (priZobrazeni) celé za `trvanie` ms, potom
 * tlačidlom Prehrať znova, ktoré sa ukáže, keď pohyb dobehne. Samé prehranie sa mimo okna pozastaví a po
 * návrate dohrá; prehranie tlačidlom dobehne vždy.
 */
export function ovladaj(o: { koren: HTMLElement; stage: HTMLElement; prehravac: Prehravac; hore: number; trvanie: number; signal: AbortSignal }) {
  const { koren, stage, prehravac, signal } = o;
  const znova = koren.querySelector<HTMLButtonElement>('.sq-znova')!;
  let beh = 0, samo = false;
  const prehraj = async (moj: number) => {
    znova.hidden = true;
    await prehravac.pripravene(2500);
    if (moj !== beh) return;
    prehravac.nastav(0);
    if ((await prehravac.chod(1, o.trvanie)) && moj === beh) { samo = false; znova.hidden = false; }
  };
  priZobrazeni(stage, o.hore, signal, () => { samo = true; void prehraj(++beh); }, (b) => prehravac.pauza(samo && !b));
  znova.addEventListener('click', () => { samo = false; prehravac.pauza(false); void prehraj(++beh); }, { signal });
  signal.addEventListener('abort', () => { znova.hidden = true; });
}

/** Číslo z CSS premennej prvku (napr. --rz-hore: 72px). */
export function cisloCss(el: HTMLElement, meno: string, inak = 0) {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(meno));
  return Number.isFinite(v) ? v : inak;
}
