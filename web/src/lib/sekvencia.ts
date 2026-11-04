/**
 * Prehrávač sekvencie snímok z 3D modelu na <canvas>, ktorý poháňa rolovanie: rozložený rez (Rozklad.astro),
 * ohyb (Ohyb.astro) a odvaľovanie kotúča (KotucSekvencia.astro).
 *
 * Plynulosť (Juraj 28. 10. 2026: „pôsobia sekavo“):
 *  - Obraz nesleduje rolovanie skokom (jeden zub kolieska posunie stránku o 100 px, to je 5 až 8 snímok),
 *    ale ho dobieha s časovou konštantou TAU, takže každý snímok obrazovky ho posunie len o kúsok.
 *  - Poloha je desatinná a susedné snímky sa prelínajú. Keď rolovanie stojí, obraz dobehne na najbližšiu
 *    celú snímku, aby stál ostrý.
 *  - Snímky sú vopred dekódované (ImageBitmap v rozmere plátna), kreslenie nečaká na dekódovanie AVIF.
 *    Dekódované snímky držia pamäť, preto ich je najviac za rozpočet bajtov okolo práve zobrazenej a sekcia
 *    ďaleko od okna ich uvoľní. Stiahnuté súbory ostávajú.
 * Sťahovanie začne, až keď je sekcia do jedného okna od zobrazenia: prvá snímka (overí AVIF), posledná,
 * potom hrubo po 8, 4, 2 a nakoniec všetky, takže pohyb funguje hneď a spresňuje sa.
 */

export interface Sekvencia {
  /** Dlhá sekcia, ktorej rolovanie poháňa pohyb. */
  koren: HTMLElement;
  /** Rámik plátna (z neho rozmer) a plátno. */
  stage: HTMLElement;
  platno: HTMLCanvasElement;
  cesta: string;
  n: number;
  sirky: number[];
  /** Časť dráhy (0 až 1), v ktorej beží pohyb snímok; pred ňou a po nej obraz stojí. */
  od: number;
  do: number;
  /** Popisy k obrazu: p = priebeh dráhy 0 až 1, x = desatinný index snímky 0 až n − 1. */
  popisy: (p: number, x: number) => void;
  /** Prvá snímka je na plátne. */
  bezi: () => void;
  /** Prehliadač nevie AVIF: ostáva statický obraz. */
  zlyhalo: () => void;
  signal: AbortSignal;
}

const TAU = 0.09;      // s; 95 % rozdielu dobehne za 0,27 s
const POKOJ = 140;     // ms bez rolovania, potom dobeh na celú snímku
const VLAKNA = 4;      // súbežné sťahovanie
const DEKODERY = 3;    // súbežné dekódovanie

type Snimka = ImageBitmap | HTMLImageElement;
const zavri = (o: Snimka | undefined) => { if (o && 'close' in o) o.close(); };

export function prehravaj(s: Sekvencia) {
  const { koren, stage, platno, n, signal } = s;
  const ctx = platno.getContext('2d')!;
  const sirky = [...s.sirky].sort((a, b) => a - b);
  const subory: (Blob | undefined)[] = new Array(n);
  const snimky: (Snimka | undefined)[] = new Array(n);
  const dekoduje = new Set<number>();
  // stolný počítač (deviceMemory 8) unesie celú sekvenciu aj pri jemnom displeji, telefón okolo 100 MB
  const rozpocet = ((navigator as { deviceMemory?: number }).deviceMemory ?? 4) >= 8 ? 240e6 : 100e6;
  let sirka = sirky[sirky.length - 1], sirkaDek = sirka, najviac = n;
  let p = -1, smer = 1, stred = 0, nakreslene = '', raf = 0, cas = 0, casovac = 0;
  let pokoj = true, blizko = false, zacate = false, bezi = false;

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const velkost = () => {
    const w = Math.round(stage.clientWidth * dpr()), h = Math.round(stage.clientHeight * dpr());
    if (w !== platno.width || h !== platno.height) { platno.width = w; platno.height = h; nakreslene = ''; }
    sirkaDek = Math.min(w || sirka, sirka);
    const bajty = sirkaDek * sirkaDek * (h / Math.max(1, w)) * 4;
    najviac = Math.max(12, Math.min(n, Math.floor(rozpocet / Math.max(1, bajty))));
  };
  const ciel = () => {
    const r = koren.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, koren.offsetHeight - window.innerHeight)));
  };
  const index = (q: number) => Math.min(1, Math.max(0, (q - s.od) / (s.do - s.od))) * (n - 1);
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
    let c = ciel();
    if (pokoj) {
      const xc = index(c);
      if (xc > 0 && xc < n - 1) c = s.od + (Math.round(xc) / (n - 1)) * (s.do - s.od);
    }
    const dt = cas ? Math.min(0.064, (t - cas) / 1000) : 1 / 60;
    cas = t;
    if (p < 0) p = c;   // prvý tik (stránka otvorená uprostred sekcie): bez dobiehania
    else {
      const d = c - p;
      if (d) smer = d > 0 ? 1 : -1;
      p = Math.abs(d) < 2e-4 ? c : p + d * (1 - Math.exp(-dt / TAU));
    }
    const x = index(p);
    kresli(x);
    s.popisy(p, x);
    if (Math.round(x) !== stred) { stred = Math.round(x); planuj(); }
    if (p !== c) raf = requestAnimationFrame(tik);
    else cas = 0;
  };
  const naplanuj = () => { if (!raf) raf = requestAnimationFrame(tik); };

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
      const r = await fetch(url(i), { signal });
      if (!r.ok) throw new Error(String(r.status));
      subory[i] = await r.blob();
    };
    try {
      await nacitaj(0);
      snimky[0] = await obraz(0);
    } catch {
      if (!signal.aborted) s.zlyhalo();
      return;
    }
    naplanuj();
    const poradie: number[] = [];
    for (const krok of [n - 1, 8, 4, 2, 1]) for (let i = 0; i < n; i += krok) if (!subory[i] && !poradie.includes(i)) poradie.push(i);
    if (!subory[n - 1] && !poradie.includes(n - 1)) poradie.unshift(n - 1);
    let k = 0;
    const vlakno = async () => {
      while (k < poradie.length && !signal.aborted) {
        try { await nacitaj(poradie[k++]); planuj(); } catch { /* chýbajúca snímka: použije sa susedná */ }
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
  }, { rootMargin: '100% 0px' });
  pozorovatel.observe(koren);

  // plátno podľa rámika, aj keď ho zmení prispôsobenie výške okna (zmensiObraz), nielen zmena okna
  const pozorVelkost = new ResizeObserver(() => { velkost(); planuj(); naplanuj(); });
  pozorVelkost.observe(stage);
  window.addEventListener('scroll', () => {
    if (!blizko) return;
    pokoj = false;
    clearTimeout(casovac);
    casovac = window.setTimeout(() => { pokoj = true; naplanuj(); }, POKOJ);
    naplanuj();
  }, { passive: true, signal });
  window.addEventListener('resize', naplanuj, { signal });
  signal.addEventListener('abort', () => { pozorovatel.disconnect(); pozorVelkost.disconnect(); cancelAnimationFrame(raf); clearTimeout(casovac); uvolni(); });
  naplanuj();
}

/** Výška, ktorú má obsah lepkavej časti k dispozícii (okno pod hlavičkou bez vnútorných okrajov). */
export function volnaVyska(sticky: HTMLElement) {
  const cs = getComputedStyle(sticky);
  return sticky.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
}

/** Telefón s nízkym oknom: keď je obsah vyšší ako okno, zmenší sa obraz a text ostane celý; inak by spodok
 *  obrazu ostal pod okrajom okna. */
export function zmensiObraz(sticky: HTMLElement, obsah: HTMLElement, stage: HTMLElement) {
  stage.style.width = '';
  stage.style.marginInline = '';
  const nad = obsah.offsetHeight - volnaVyska(sticky);
  if (nad <= 0) return;
  const w = stage.offsetWidth, h = stage.offsetHeight;
  stage.style.width = `${Math.max(0.55 * w, (w * (h - nad)) / h)}px`;
  stage.style.marginInline = 'auto';
}
