/**
 * Prehrávač sekvencie snímok z 3D modelu na <canvas>: rozložený rez (Rozklad.astro), ohyb (Ohyb.astro)
 * a odvaľovanie kotúča (KotucSekvencia.astro).
 *
 * Pohyb sa spúšťa sám, keď je obraz v okne, nie rolovaním (Juraj 4. 11. 2026: rolovanie cez dlhé sekcie
 * trvalo dlho). Sekcia je preto len taká vysoká ako jej obsah. Prehrávač vie:
 *  - chod(f, ms): plynulo na polohu f (0 až 1 celej sekvencie) za ms, s mäkkým rozbehom aj dojazdom;
 *    chod na tú istú polohu je čakanie, ktoré sa dá prerušiť aj pozastaviť ako pohyb,
 *  - sleduj(f) a pusti(): obraz dobieha polohu, ktorú určuje ťahanie (časová konštanta TAU), a po pustení
 *    dobehne na najbližšiu celú snímku,
 *  - nastav(f): hneď na polohu.
 * Plynulosť (Juraj 28. 10. 2026: „pôsobia sekavo“): poloha je desatinná a susedné snímky sa prelínajú,
 * stojaci obraz je vždy celá snímka, teda ostrý.
 * Snímky sú vopred dekódované (ImageBitmap v rozmere plátna), kreslenie nečaká na dekódovanie AVIF.
 * Dekódované snímky držia pamäť, preto ich je najviac za rozpočet bajtov okolo práve zobrazenej a sekcia
 * ďaleko od okna ich uvoľní. Stiahnuté súbory ostávajú.
 * Sťahovanie začne, keď je sekcia do jeden a pol okna od zobrazenia: prvá snímka (overí AVIF), posledná,
 * potom hrubo po 8, 4, 2 a nakoniec všetky. Prehranie počká, kým sú snímky pripravené, najviac pár sekúnd;
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
  /** Poloha pred prvým pohybom, 0 až 1 (predvolene začiatok). */
  zaciatok?: number;
  /** Popisy k obrazu pri každom snímku: x = desatinný index snímky 0 až n − 1. */
  popisy: (x: number) => void;
  /** Prvá snímka je na plátne. */
  bezi: () => void;
  /** Prehliadač nevie AVIF: ostáva statický obraz. */
  zlyhalo: () => void;
  signal: AbortSignal;
}

export interface Prehravac {
  /** Plynulo na polohu f za ms. Splní sa true po dobehnutí, false keď ho prerušil iný pohyb alebo ťahanie. */
  chod: (f: number, ms: number) => Promise<boolean>;
  /** Ťahanie: obraz dobieha polohu f. */
  sleduj: (f: number) => void;
  /** Koniec ťahania: dobehne na najbližšiu celú snímku. */
  pusti: () => void;
  /** Hneď na polohu f. */
  nastav: (f: number) => void;
  /** Splní sa, keď sú snímky stiahnuté a dekódované na plynulé prehranie, najneskôr po max ms. */
  pripravene: (max: number) => Promise<void>;
  /** Pozastaví bežiaci pohyb (obraz mimo okna); jeho čas stojí. */
  pauza: (b: boolean) => void;
  /** Poloha 0 až 1. */
  poloha: () => number;
}

const TAU = 0.09;      // s; ťahanie: 95 % rozdielu dobehne za 0,27 s
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
  let p = cela(s.zaciatok ?? 0), ciel = p, smer = 1, stred = Math.round(p * (n - 1));
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

  const tik = (t: number) => {
    raf = 0;
    const dt = cas ? Math.min(64, t - cas) : 1000 / 60;
    cas = t;
    if (pohyb) {
      if (!pozastavene) pohyb.t = Math.min(pohyb.ms, pohyb.t + dt);
      const u = pohyb.ms > 0 ? pohyb.t / pohyb.ms : 1;
      p = pohyb.od + (pohyb.do - pohyb.od) * krivka(u);
      if (u >= 1) { const h = pohyb.hotovo; pohyb = null; p = ciel; h(true); }
    } else if (p !== ciel) {
      const d = ciel - p;
      p = Math.abs(d) < 2e-4 ? ciel : p + d * (1 - Math.exp(-dt / 1000 / TAU));
    }
    const x = p * (n - 1);
    kresli(x);
    s.popisy(x);
    if (Math.round(x) !== stred) { stred = Math.round(x); planuj(); }
    if ((pohyb && !pozastavene) || p !== ciel) raf = requestAnimationFrame(tik);
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

  // plátno podľa rámika, aj keď ho zmení prispôsobenie výške okna (zmensiObraz), nielen zmena okna
  const pozorVelkost = new ResizeObserver(() => { velkost(); planuj(); naplanuj(); });
  pozorVelkost.observe(stage);
  window.addEventListener('resize', naplanuj, { signal });

  const zrus = () => { if (pohyb) { const h = pohyb.hotovo; pohyb = null; h(false); } };
  const zastav = () => { koniec = true; zrus(); cakaju.splice(0).forEach((f) => f()); };
  signal.addEventListener('abort', () => { zastav(); pozorovatel.disconnect(); pozorVelkost.disconnect(); cancelAnimationFrame(raf); uvolni(); });
  naplanuj();

  return {
    chod: (f, ms) => new Promise<boolean>((hotovo) => {
      zrus();
      if (signal.aborted) { hotovo(false); return; }
      ciel = cela(f);
      if (ciel !== p) smer = ciel > p ? 1 : -1;
      pohyb = { od: p, do: ciel, ms: Math.max(0, ms), t: 0, hotovo };
      planuj();
      naplanuj();
    }),
    sleduj: (f) => {
      zrus();
      const c = Math.min(1, Math.max(0, f));
      if (c !== ciel) smer = c > ciel ? 1 : -1;
      ciel = c;
      naplanuj();
    },
    pusti: () => { ciel = cela(ciel); naplanuj(); },
    nastav: (f) => {
      zrus();
      p = ciel = cela(f);
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
    poloha: () => p,
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

/** Krok scenára: cieľ (0 až 1), ms pohybu, ms zastávky po ňom. */
export type Krok = [number, number, number];

/**
 * Prehranie a ovládanie spoločné pre rez, ohyb a kotúč (tlačidlá zo SekvenciaOvladanie.astro): raz samo pri
 * zobrazení (priZobrazeni), potom tlačidlom Prehrať znova, v návrhu C aj ťahaním. Pozastaví sa len prehranie,
 * ktoré sa spustilo samo, keď obraz odíde z okna; čo spustil človek, dobehne. Každá akcia človeka zruší
 * bežiace prehranie a samé prehranie po nej už nepríde. vyber(f): skok na vrstvu alebo krok (návrh B).
 */
export function ovladaj(o: { koren: HTMLElement; stage: HTMLElement; prehravac: Prehravac; hore: number; scenar: Krok[]; rezim: Rezim; smerTahu: 1 | -1; signal: AbortSignal }) {
  const { koren, stage, prehravac, signal } = o;
  const znova = koren.querySelector<HTMLButtonElement>('.sq-znova')!;
  const tahaj = koren.querySelector<HTMLElement>('.sq-tahaj')!;
  let beh = 0, samo = false, ovladal = false, tahal = false;
  const pokoj = () => { znova.hidden = false; if (o.rezim === 'c' && !tahal) tahaj.hidden = false; };
  const clovek = () => { ovladal = true; samo = false; prehravac.pauza(false); znova.hidden = true; tahaj.hidden = true; return ++beh; };
  const prehraj = async (moj: number) => {
    znova.hidden = true;
    tahaj.hidden = true;
    await prehravac.pripravene(2500);
    if (moj !== beh) return;
    prehravac.nastav(0);
    for (const [f, ms, stoj] of o.scenar) {
      if (!(await prehravac.chod(f, ms)) || moj !== beh) return;
      if (stoj && (!(await prehravac.chod(f, stoj)) || moj !== beh)) return;
    }
    samo = false;
    pokoj();
  };
  priZobrazeni(stage, o.hore, signal, () => { if (ovladal) return; samo = true; void prehraj(++beh); }, (b) => prehravac.pauza(samo && !b));
  znova.addEventListener('click', () => { void prehraj(clovek()); }, { signal });
  if (o.rezim === 'c') {
    stage.classList.add('sq-tahatelne');
    tahanie(stage, prehravac, o.smerTahu, signal, () => { clovek(); tahal = true; }, () => { znova.hidden = false; });
  }
  signal.addEventListener('abort', () => { znova.hidden = true; tahaj.hidden = true; });
  return {
    vyber: async (f: number, msNaCelu = 900) => {
      const moj = clovek();
      if ((await prehravac.chod(f, 350 + msNaCelu * Math.abs(f - prehravac.poloha()))) && moj === beh) pokoj();
    },
  };
}

/**
 * Ťahanie obrazu do strán posúva sekvenciu (návrh C). smer: 1 = ťah doprava ide ďalej, −1 = ťah doľava.
 * Ťah sa začne až po 6 px do strany, takže prst, ktorý roluje stránku, pohyb nezastaví; zvislé rolovanie
 * ostáva prehliadaču (touch-action: pan-y v CSS).
 */
export function tahanie(stage: HTMLElement, prehravac: Prehravac, smer: 1 | -1, signal: AbortSignal, zacal: () => void, skoncil: () => void) {
  let zac: { x: number; f: number; id: number } | null = null, taha = false;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || zac) return;
    zac = { x: e.clientX, f: prehravac.poloha(), id: e.pointerId };
  }, { signal });
  stage.addEventListener('pointermove', (e) => {
    if (!zac || e.pointerId !== zac.id) return;
    const dx = e.clientX - zac.x;
    if (!taha) {
      if (Math.abs(dx) < 6) return;
      taha = true;
      zac.x = e.clientX;
      zac.f = prehravac.poloha();
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('sq-taha');
      zacal();
      return;
    }
    prehravac.sleduj(zac.f + (smer * dx) / Math.max(1, stage.clientWidth * 0.8));
  }, { signal });
  const pusti = (e: PointerEvent) => {
    if (!zac || e.pointerId !== zac.id) return;
    zac = null;
    if (!taha) return;
    taha = false;
    stage.classList.remove('sq-taha');
    prehravac.pusti();
    skoncil();
  };
  stage.addEventListener('pointerup', pusti, { signal });
  stage.addEventListener('pointercancel', pusti, { signal });
}

/** Návrh 4. 11. 2026, dočasné na porovnanie: ?animacie=a|b|c (drží sa pri prechode na ďalšiu stránku).
 *  Po výbere Juraja ostane jeden režim a toto zmizne. */
export type Rezim = 'a' | 'b' | 'c';
export function rezimAnimacii(): Rezim {
  let r = new URLSearchParams(location.search).get('animacie');
  try {
    if (r) sessionStorage.setItem('animacie', r);
    else r = sessionStorage.getItem('animacie');
  } catch { /* súkromné okno: len z adresy */ }
  return r === 'a' || r === 'c' ? r : 'b';
}

/** Výška okna pod hlavičkou (a pásom častí stránky) bez okrajov, ktorú má obsah sekcie, aby bol obraz
 *  a text naraz na obrazovke. */
export function volnaVyska(hore: number, okraj: number) {
  return window.innerHeight - hore - 2 * okraj;
}

/** Telefón s nízkym oknom: keď je obsah vyšší ako voľná výška, zmenší sa obraz a text ostane celý. */
export function zmensiObraz(volno: number, obsah: HTMLElement, stage: HTMLElement) {
  stage.style.width = '';
  stage.style.marginInline = '';
  const nad = obsah.offsetHeight - volno;
  if (nad <= 0) return;
  const w = stage.offsetWidth, h = stage.offsetHeight;
  stage.style.width = `${Math.max(0.55 * w, (w * (h - nad)) / h)}px`;
  stage.style.marginInline = 'auto';
}

/** Číslo z CSS premennej prvku (napr. --rz-hore: 72px). */
export function cisloCss(el: HTMLElement, meno: string, inak = 0) {
  const v = parseFloat(getComputedStyle(el).getPropertyValue(meno));
  return Number.isFinite(v) ? v : inak;
}
