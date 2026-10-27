// Živá galéria renderov: v prehliadači ukazuje, čo práve vychádza z Blendera (data/_3d), najnovšie hore.
// Stránka sa sama obnovuje každé 4 s. Spustenie z koreňa repozitára:
//   node data/blender/galeria.mjs            → http://127.0.0.1:4340
// Číta len data/_3d a vzorové fotky (podklady/watts/fotky-katalog, web/src/assets). Zapisuje jediný súbor:
// pripomienky majiteľa z porovnania so skutočnosťou (/realita, stránku robí data/blender/realita.py) do
// data/_3d/realita/pripomienky.json.
import { createServer } from 'node:http';
import { readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { join, relative, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PORT = Number(process.env.PORT ?? 4340);
const KORENE = ['data/_3d', 'podklady/watts/fotky-katalog', 'web/src/assets/fotky', 'web/src/assets/piktogramy'].map((k) => resolve(REPO, k));
const VZORY = [
  ['podklady/watts/fotky-katalog/katalog-s06-x53.jpeg', 'Skutočná štúdiová fotka rodiny (vzor farby, peny, svetla)'],
  ['podklady/watts/fotky-katalog/katalog-s05-x46.jpeg', 'Skutočné makro plášťa (priesvitný HDPE, dvojitá stena)'],
  ['web/src/assets/fotky/prierez-duo.jpg', 'Skutočný rez DUO zo stavby'],
  ['web/src/assets/piktogramy/rad-duo-kurenie.png', 'Render Watts (len vzor rámovania)'],
];
const TYPY = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const REALITA = resolve(REPO, 'data/_3d/realita');
const PRIPOMIENKY = join(REALITA, 'pripomienky.json');

async function pripomienky() {
  try { return JSON.parse(await readFile(PRIPOMIENKY, 'utf8')); } catch { return {}; }
}

// Uloží pripomienku k jednému radu (id) cez dočasný súbor, aby sa súbor nikdy nezapísal napoly. Zápisy idú
// za sebou (fronta), inak by dve polia uložené naraz prepísali jedno druhé.
let fronta = Promise.resolve();
async function ulozPripomienku(req) {
  let telo = '';
  for await (const k of req) { telo += k; if (telo.length > 200_000) throw new Error('príliš dlhé'); }
  const { id, text } = JSON.parse(telo);
  if (!/^[a-z0-9-]{1,80}$/.test(id) || typeof text !== 'string' || text.length > 50_000) throw new Error('zlé údaje');
  const krok = fronta.then(async () => {
    const vsetky = await pripomienky();
    vsetky[id] = { text, cas: new Date().toISOString() };
    await writeFile(PRIPOMIENKY + '.tmp', JSON.stringify(vsetky, null, 1), 'utf8');
    await rename(PRIPOMIENKY + '.tmp', PRIPOMIENKY);
    return vsetky[id].cas;
  });
  fronta = krok.catch(() => {});
  return krok;
}

async function obrazky(dir, out = []) {
  let polozky = [];
  try { polozky = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const p of polozky) {
    const cesta = join(dir, p.name);
    if (p.isDirectory()) await obrazky(cesta, out);
    else if (TYPY[extname(p.name).toLowerCase()]) {
      const s = await stat(cesta);
      out.push({ cesta: relative(REPO, cesta).split(sep).join('/'), cas: s.mtimeMs, kb: Math.round(s.size / 1024) });
    }
  }
  return out;
}

// Renderuje sa vtedy, keď beží Blender na pozadí (-b); otvorené okno Blendera sa nepočíta. Výsledok na 8 s.
let blenderCache = { cas: 0, hodnota: false };
const blenderBezi = () => {
  if (Date.now() - blenderCache.cas < 8000) return Promise.resolve(blenderCache.hodnota);
  const prikaz = "Get-CimInstance Win32_Process -Filter \"Name='blender.exe'\" | ForEach-Object { $_.CommandLine }";
  return new Promise((ok) => execFile('powershell', ['-NoProfile', '-Command', prikaz], { windowsHide: true }, (e, so) => {
    const hodnota = !e && (so ?? '').split(/\r?\n/).some((r) => /\s(-b|--background)(\s|$)/.test(r));
    blenderCache = { cas: Date.now(), hodnota };
    ok(hodnota);
  }));
};

async function api() {
  const vsetko = (await obrazky(resolve(REPO, 'data/_3d'))).filter((o) => !/\/ref\/|maska/.test(o.cesta)).sort((a, b) => b.cas - a.cas);
  let stav = '';
  try { stav = await readFile(resolve(REPO, 'data/_3d/najlepsie/STAV.txt'), 'utf8'); } catch {}
  return { teraz: Date.now(), blender: await blenderBezi(), stav, najnovsie: vsetko.slice(0, 60), najlepsie: vsetko.filter((o) => o.cesta.includes('/najlepsie/')), vzory: VZORY, spolu: vsetko.length };
}

const STRANKA = `<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Microflex 3D: živá galéria</title><style>
:root{--ink:#0b1b33;--soft:#4a5568;--navy:#0a2a5e;--bg:#eef2f7;--line:rgb(10 42 94/.12)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "Segoe UI",system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;padding:14px 24px;background:#fff;border-bottom:1px solid var(--line)}
h1{font-size:20px;margin:0}.bod{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:#8e97a3}
.bezi .bod{background:#1b8a5a;box-shadow:0 0 0 0 rgb(27 138 90/.6);animation:p 1.6s infinite}@keyframes p{70%{box-shadow:0 0 0 10px rgb(27 138 90/0)}}
.stav{white-space:pre-wrap;font-size:14px;color:var(--soft);margin:0}main{padding:20px 24px 60px;display:grid;gap:28px}
h2{font-size:17px;margin:0 0 10px}.velky{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:18px;align-items:start}
.panel{background:#fff;border-radius:14px;padding:12px;box-shadow:0 14px 30px -20px rgb(10 42 94/.5)}
.panel img{display:block;width:100%;height:auto;border-radius:8px;background:repeating-conic-gradient(#f3f5f8 0 25%,#fff 0 50%) 0 0/20px 20px}
#hlavny{max-height:72vh;object-fit:contain}.cap{font-size:13px;color:var(--soft);margin-top:6px;word-break:break-all}.mriezka{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
.mriezka .panel{padding:8px;cursor:zoom-in}.mriezka img{aspect-ratio:4/3;object-fit:contain}.nove{outline:3px solid #f2c400;outline-offset:2px}
.vzory{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}@media(max-width:900px){.velky,.vzory{grid-template-columns:minmax(0,1fr)}}
dialog{border:0;padding:0;background:transparent;max-width:96vw}dialog img{max-width:96vw;max-height:92vh;display:block;border-radius:10px;background:#fff}dialog::backdrop{background:rgb(11 27 51/.8)}
</style></head><body>
<header><h1>Microflex 3D: živá galéria</h1><a href="/realita" style="color:var(--navy);font-weight:600">Model a skutočnosť</a><span id="beh"><span class="bod"></span><span id="behText">…</span></span><span id="posledne" class="cap"></span></header>
<main>
<section><h2>Stav</h2><p class="stav" id="stav">Agent zatiaľ nezapísal stav (data/_3d/najlepsie/STAV.txt).</p></section>
<section class="velky"><div><h2>Najnovší render</h2><div class="panel"><img id="hlavny" alt=""><div class="cap" id="hlavnyCap"></div></div></div>
<div><h2>Najlepší výsledok</h2><div id="najlepsie" class="mriezka"></div></div></section>
<section><h2>Posledné rendery (najnovšie vľavo hore, žltý rámik = nové od otvorenia)</h2><div id="mriezka" class="mriezka"></div></section>
<section><h2>Vzory, podľa ktorých sa ladí</h2><div id="vzory" class="vzory"></div></section>
</main><dialog id="dlg"><img id="dlgImg" alt=""></dialog>
<script>
const videne = new Set(); let prve = true; let poslednyHlavny = '';
const url = (c, t) => '/subor/' + c.split('/').map(encodeURIComponent).join('/') + '?t=' + Math.round(t || 0);
const kedy = (ms) => { const s = Math.round((Date.now() - ms) / 1000); return s < 60 ? 'pred ' + s + ' s' : s < 3600 ? 'pred ' + Math.round(s / 60) + ' min' : new Date(ms).toLocaleTimeString('sk-SK'); };
const karta = (o, nove) => '<div class="panel' + (nove ? ' nove' : '') + '" data-src="' + url(o.cesta, o.cas) + '"><img loading="lazy" src="' + url(o.cesta, o.cas) + '" alt=""><div class="cap">' + o.cesta.replace('data/_3d/', '') + ' · ' + kedy(o.cas) + '</div></div>';
async function obnov() {
  try {
    const d = await (await fetch('/api')).json();
    document.getElementById('beh').className = d.blender ? 'bezi' : '';
    document.getElementById('behText').textContent = d.blender ? 'Blender práve renderuje' : 'Blender teraz nerenderuje (skript sa upravuje alebo sa porovnáva)';
    if (d.stav) document.getElementById('stav').textContent = d.stav.trim();
    const h = d.najnovsie.find((o) => !/-tien\\./.test(o.cesta)) || d.najnovsie[0];
    if (h) {
      document.getElementById('posledne').textContent = 'Posledný súbor ' + kedy(h.cas) + ', spolu ' + d.spolu + ' obrázkov';
      if (h.cesta + h.cas !== poslednyHlavny) { poslednyHlavny = h.cesta + h.cas; document.getElementById('hlavny').src = url(h.cesta, h.cas); }
      document.getElementById('hlavnyCap').textContent = h.cesta.replace('data/_3d/', '') + ' · ' + kedy(h.cas) + ' · ' + h.kb + ' kB';
    }
    document.getElementById('mriezka').innerHTML = d.najnovsie.slice(0, 40).map((o) => { const k = o.cesta + o.cas; const nove = !prve && !videne.has(k); videne.add(k); return karta(o, nove); }).join('');
    document.getElementById('najlepsie').innerHTML = d.najlepsie.length ? d.najlepsie.map((o) => karta(o, false)).join('') : '<p class="cap">Zatiaľ prázdne (data/_3d/najlepsie).</p>';
    if (prve) document.getElementById('vzory').innerHTML = d.vzory.map(([c, t]) => '<div class="panel" data-src="' + url(c) + '"><img src="' + url(c) + '" alt=""><div class="cap">' + t + '</div></div>').join('');
    prve = false;
  } catch (e) { document.getElementById('behText').textContent = 'Galéria stratila spojenie, skúšam znova…'; }
}
document.addEventListener('click', (e) => { const p = e.target.closest('[data-src]'); if (!p) return; const dlg = document.getElementById('dlg'); document.getElementById('dlgImg').src = p.dataset.src; dlg.showModal(); });
document.getElementById('dlg').addEventListener('click', (e) => e.currentTarget.close());
obnov(); setInterval(obnov, 4000);
</script></body></html>`;

createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(STRANKA); return; }
    if (u.pathname === '/api') { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(await api())); return; }
    if (u.pathname === '/realita') {
      let s;
      try { s = await readFile(join(REALITA, 'index.html'), 'utf8'); } catch { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Stránka porovnania ešte nie je: spusti data/blender/realita.py'); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(s);
      return;
    }
    if (u.pathname === '/pripomienky') {
      if (req.method === 'POST') {
        try { const cas = await ulozPripomienku(req); res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, cas })); }
        catch (e) { res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: false, chyba: String(e.message ?? e) })); }
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(await pripomienky()));
      return;
    }
    if (u.pathname.startsWith('/subor/')) {
      const cesta = resolve(REPO, decodeURIComponent(u.pathname.slice('/subor/'.length)));
      if (!KORENE.some((k) => cesta.startsWith(k + sep)) || !TYPY[extname(cesta).toLowerCase()]) { res.writeHead(403).end(); return; }
      res.writeHead(200, { 'content-type': TYPY[extname(cesta).toLowerCase()], 'cache-control': 'max-age=3600' }).end(await readFile(cesta));
      return;
    }
    res.writeHead(404).end();
  } catch (e) { res.writeHead(500).end(String(e)); }
}).listen(PORT, '127.0.0.1', () => console.log(`Živá galéria: http://127.0.0.1:${PORT}`));
