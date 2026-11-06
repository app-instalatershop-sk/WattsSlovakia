// Úvod K3-A na telefóne (Juraj 6. 11. 2026: „na telefóne nevyzerá pekne ten vrch silno modrý, nedá sa tam
// fotka upraviť, aby bola vidno lepšie?“). Varianty pásu s fotkou plášťa (makro 3D modelu) na stavbe ba5f9c9.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire('C:/Users/krist/Documents/FajnInstalater/audit/scripts/package.json');
const { chromium } = require('playwright');
const KOREN = 'C:/Users/krist/Documents/FajnInstalater/MicroflexWeb';
const CIEL = `${KOREN}/snimky-stranok/navrh-hlavicka-uvod/uvod-mobil`;
mkdirSync(CIEL, { recursive: true });
const PORT = 4366;

const VARIANTY = {
  dnes: '',
  // M1 Fotka hore: pás začína ostrou fotkou rebier plášťa, do tmavej prechádza pod ňou, text je na tmavej časti.
  M1: `
    .hero-text { padding-top: 168px !important; }
    .hero-text::before {
      background:
        linear-gradient(180deg, rgb(5 20 48 / 0) 0px, rgb(5 20 48 / 0.15) 70px, rgb(6 22 52 / 0.78) 150px, rgb(6 22 52 / 0.94) 210px, rgb(8 30 72 / 0.95) 100%),
        var(--plast) 38% -150px / 210% auto no-repeat,
        #0a2a5e !important; }`,
  // M1b Fotka hore, výrez na rad prierezov rebier (U), obrázok v pôvodnom rozlíšení (150 % šírky pri 2×).
  M1b: `
    .hero-text { padding-top: 176px !important; }
    .hero-text::before {
      background:
        linear-gradient(180deg, rgb(5 20 48 / 0.05) 0px, rgb(5 20 48 / 0.1) 90px, rgb(6 22 52 / 0.72) 150px, rgb(6 22 52 / 0.94) 205px, rgb(8 30 72 / 0.95) 100%),
        var(--plast) 50% -205px / 150% auto no-repeat,
        #0a2a5e !important; }`,
  // M1c To isté, širší pohľad: viac rebier, menšie.
  M1c: `
    .hero-text { padding-top: 168px !important; }
    .hero-text::before {
      background:
        linear-gradient(180deg, rgb(5 20 48 / 0.05) 0px, rgb(5 20 48 / 0.12) 84px, rgb(6 22 52 / 0.74) 142px, rgb(6 22 52 / 0.94) 196px, rgb(8 30 72 / 0.95) 100%),
        var(--plast) 60% -128px / 118% auto no-repeat,
        #0a2a5e !important; }`,
  // M2 Fotka za celým pásom, jemnejšia: rebrá a svetlo vnútri plášťa presvitajú cez polopriesvitnú modrú.
  M2: `
    .hero-text::before {
      background:
        linear-gradient(180deg, rgb(5 20 48 / 0.86) 0%, rgb(6 24 58 / 0.8) 55%, rgb(8 30 72 / 0.72) 100%),
        var(--plast) 45% 30% / cover no-repeat,
        #0a2a5e !important; }
    .hero-text h1, .hero-text .lead { text-shadow: 0 1px 12px rgb(2 10 30 / 0.55); }`,
  // M3 Fotka vpravo dole: hore vľavo tmavá pod nadpisom, smerom k zahnutému spodku sa odkrýva plášť (ako pri
  // predele na počítači).
  M3: `
    .hero-text::before {
      background:
        linear-gradient(168deg, rgb(5 20 48 / 0.97) 0%, rgb(7 26 62 / 0.93) 38%, rgb(10 42 94 / 0.62) 72%, rgb(10 42 94 / 0.25) 100%),
        var(--plast) 70% 100% / 150% auto no-repeat,
        #0a2a5e !important; }
    .hero-actions .hero-odkaz, .hero-predaj { text-shadow: 0 1px 8px rgb(2 10 30 / 0.7); }`,
};
const server = spawn(process.execPath, [`${KOREN}/snimky-stranok/_skripty/server.mjs`, `${KOREN}/web/dist`, String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [w, h] of [[390, 844], [360, 740]]) {
    for (const [n, css] of Object.entries(VARIANTY)) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate((css) => {
        // Fotka plášťa zo stavby (na počítači je v --plast pásu); pre maketu ju dáme celému úvodu.
        const plast = document.querySelector('.hero-pas').style.getPropertyValue('--plast');
        document.querySelector('.hero').style.setProperty('--plast', plast);
        const s = document.createElement('style'); s.textContent = css; document.head.append(s);
      }, css);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${CIEL}/${n}-${w}.png`, clip: { x: 0, y: 0, width: w, height: h }, fullPage: true });
      console.log('ok', n, w);
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.kill();
}
