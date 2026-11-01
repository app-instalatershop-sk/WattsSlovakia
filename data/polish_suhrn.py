# Súhrn auditu polishu (polish-audit.json): axe podľa pravidla, sadzba podľa druhu a miesta, dĺžka riadku, zarovnanie,
# verzálky, dotykové ciele podľa komponentu, ostrosť, súpis štýlov. python data/polish_suhrn.py <výstup polish-audit.mjs>
import collections
import json
import re
import sys

d = json.load(open(sys.argv[1], encoding='utf-8'))
S = d['stranky']
chyby = [(s, z, r['chyba']) for s, v in S.items() for z, r in v.items() if 'chyba' in r]
print(f"stránok {d['pocet']}, chýb behu {len(chyby)}", chyby[:3])

def skupina(kde):
    # „div.wrap > ul > li > a“ → posledné dva členy bez čísel, aby sa rovnaké komponenty zlúčili
    casti = kde.split(' > ')
    return ' > '.join(casti[-2:])

print('\n=== AXE (stránky počítač/telefón, uzly spolu) ===')
axe = collections.defaultdict(lambda: {'p': set(), 'm': set(), 'uzly': 0, 'impact': '', 'help': '', 'ukazky': collections.Counter()})
for s, v in S.items():
    for z, r in v.items():
        for a in r.get('axe', []):
            x = axe[a['id']]; x['impact'] = a['impact']; x['help'] = a['help']; x['uzly'] += a['uzly']
            (x['p'] if z == 'pocitac' else x['m']).add(s)
            for u in a['ukazky']: x['ukazky'][(re.sub(r':nth-child\(\d+\)', '', u['ciel'])[-70:], u['pozn'][:120])] += 1
for k, x in sorted(axe.items(), key=lambda kv: -len(kv[1]['p'] | kv[1]['m'])):
    print(f"{k} [{x['impact']}] stránok {len(x['p'])}/{len(x['m'])}, uzlov {x['uzly']}: {x['help'][:80]}")
    for (c, pz), n in x['ukazky'].most_common(4): print(f"    {n}× {c} | {pz}")

print('\n=== SADZBA (výskyty, stránky; najčastejšie miesta) ===')
for druh in ['jednotka', 'Ø a ×', 'predložka na konci riadku', 'rovné úvodzovky', 'rozsah so spojovníkom', 'tri bodky']:
    vys = [(s, x) for s, v in S.items() for x in v.get('pocitac', {}).get('sadzba', []) if x['druh'] == druh]
    if not vys: print(druh, 0); continue
    stranky = {s for s, _ in vys}
    print(f"{druh}: {len(vys)} výskytov na {len(stranky)} stránkach (počítač)")
    for g, n in collections.Counter(skupina(x['kde']) for _, x in vys).most_common(6): print(f"    {n}× {g}")
    for _, x in vys[:4]: print(f"      „{x['ukazka']}“")

print('\n=== DĹŽKA RIADKU > 75 znakov (počítač) ===')
riadky = [(s, x) for s, v in S.items() for x in v.get('pocitac', {}).get('riadky', [])]
print(len(riadky), 'odsekov na', len({s for s, _ in riadky}), 'stránkach')
for g, n in collections.Counter(skupina(x['kde']) for _, x in riadky).most_common(6): print(f"    {n}× {g}")
for s, x in sorted(riadky, key=lambda t: -t[1]['znakov'])[:5]: print(f"      {x['znakov']} zn. {s} | {x['ukazka'][:50]}")

print('\n=== ZAROVNANIE do bloku / na stred (viac riadkov) ===')
zar = [(s, x) for s, v in S.items() for x in v.get('pocitac', {}).get('zarovnanie', [])]
print(len(zar)); [print(f"    {n}× {g}") for g, n in collections.Counter(f"{x['zarovnanie']} {skupina(x['kde'])}" for _, x in zar).most_common(6)]

print('\n=== VERZÁLKY cez text-transform ===')
ver = [(s, x) for s, v in S.items() for z in v for x in v[z].get('verzalky', [])]
print(len(ver)); [print(f"    {n}× {g}") for g, n in collections.Counter(f"{skupina(x['kde'])} „{x['ukazka'][:20]}“" for _, x in ver).most_common(8)]

print('\n=== DOTYKOVÉ CIELE (telefón) ===')
ciele = [(s, x) for s, v in S.items() for x in v.get('mobil', {}).get('ciele', [])]
zle = [(s, x) for s, x in ciele if not x['wcag']]
print(f"pod 44 px: {len(ciele)} výskytov; pod 24 px bez odstupu (WCAG 2.5.8): {len(zle)} na {len({s for s, _ in zle})} stránkach")
for g, n in collections.Counter(f"{skupina(x['kde'])} {x['w']}×{x['h']}" for _, x in zle).most_common(10): print(f"    WCAG {n}× {g}")
for g, n in collections.Counter(skupina(x['kde']) for _, x in ciele).most_common(12): print(f"    <44 {n}× {g}")

print('\n=== OSTROSŤ (telefón 2×) ===')
ostr = [(s, x) for s, v in S.items() for x in v.get('mobil', {}).get('ostrost', [])]
print(len(ostr), 'na', len({s for s, _ in ostr}), 'stránkach')
for g, n in collections.Counter(f"{skupina(x['kde'])} súbor {x['suborSirka']} treba {x['potrebne']} | {x['sizes'][:50]}" for _, x in ostr).most_common(10): print(f"    {n}× {g}")

print('\n=== SÚPIS ŠTÝLOV (počítač, všetky stránky) ===')
spolu = {k: collections.Counter() for k in ['pismo', 'farbaTextu', 'plocha', 'zaoblenie', 'tien', 'medzery']}
for s, v in S.items():
    st = v.get('pocitac', {}).get('styly')
    if not st: continue
    for k in spolu: spolu[k].update(st[k])
for k, c in spolu.items():
    print(f"{k}: {len(c)} rôznych hodnôt")
    if k == 'medzery':
        n4 = sum(n for v, n in c.items() if int(v) % 4 == 0); n = sum(c.values())
        print(f"    násobky 4 px: {n4 / n:.0%} výskytov; hodnoty: {', '.join(f'{v}' for v, _ in sorted(c.items(), key=lambda kv: int(kv[0])))}")
        print('    mimo násobkov 4 (najčastejšie):', ', '.join(f'{v} px ({n}×)' for v, n in c.most_common() if int(v) % 4)[:400])
    else:
        for v, n in c.most_common(8 if k != 'pismo' else 14): print(f"    {n}× {v}")
