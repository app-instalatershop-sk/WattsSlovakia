"""Zostaví makety: vloží tokens.css, diely (partials), obrázky ako data URI, tabuľky z dát
a odkazy medzi maketami.

Použitie:  python makety/build.py
Vstup:     makety/src/*.html, makety/src/partials/*.html, makety/src/tokens.css,
           data/microflex-watts-sk.json (tabuľky variantov),
           data/_img-cache.json (lokálna keš fotiek, nekomituje sa), makety/links.json (voliteľné)
Výstup:    makety/out/*.html (publikujú sa ako artefakty; nekomitujú sa)
"""
import base64
import html as H
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'out')
DATA = os.path.join(ROOT, '..', 'data')
PAGES = ['domov', 'kategoria', 'rad-uno']
BASE = '/sk/products/eu/microflex-pre-insulated-piping'
SHOP_SEARCH = 'https://www.instalatershop.sk/vyhledavani/?string='

HEATING = [
    ('UNO', BASE + '/pipes-for-heating/1-microflex-uno-6-bar', 1),
    ('DUO', BASE + '/pipes-for-heating/2-microflex-duo-6-bar', 2),
    ('UNO PRIMO', BASE + '/pipes-for-heating/2-single-microflex-uno-primo-6-bar', 1),
    ('PRIMO DUO', BASE + '/pipes-for-heating/3-microflex-primo-duo-6-bar', 2),
]


def read(path):
    return io.open(path, encoding='utf-8').read()


def norm_pipe(s):
    """'25 х 2,3' (cyrilské х) -> '25 × 2,3'; vráti aj číslo rúry."""
    s = s.replace('х', '×').replace('x', '×').replace('X', '×')
    s = re.sub(r'\s*×\s*', ' × ', s)
    m = re.match(r'(\d+)', s)
    return s, (m.group(1) if m else '')


def table_uno(data):
    rec = data['series'][HEATING[0][1]]
    rows = rec['tables'][0]['rows']
    out = ['<table class="data variants"><thead><tr>',
           '<th>Obj. číslo</th>',
           '<th class="right">Plášť Ø<small>mm</small></th>',
           '<th class="right">Rúra Ø × hrúbka<small>mm</small></th>',
           '<th class="right">Hmotnosť<small>kg/m</small></th>',
           '<th>Izolácia</th>',
           '<th class="right">Polomer ohybu<small>m</small></th>',
           '<th class="right">Kotúč Ø / šírka<small>m</small></th>',
           '<th></th></tr></thead><tbody>']
    for r in rows:
        code, casing, pipe, weight, ins, bend, coil = r[:7]
        pipe_txt, pipe_num = norm_pipe(pipe)
        adv = ins.strip().lower().startswith('adv')
        out.append(
            '<tr data-pipe="%s" data-ins="%s">'
            '<td class="code">%s</td><td class="right">%s</td><td class="right">%s</td><td class="right">%s</td>'
            '<td><span class="ins%s">%s</span></td><td class="right">%s</td><td class="right">%s</td>'
            '<td><a class="shop" href="%s%s" target="_blank" rel="noopener">Do e-shopu <svg aria-hidden="true"><use href="#i-ext"/></svg></a></td></tr>'
            % (pipe_num, 'adv' if adv else 'std', H.escape(code), H.escape(casing), H.escape(pipe_txt), H.escape(weight),
               ' adv' if adv else '', 'zosilnená' if adv else 'štandardná', H.escape(bend), H.escape(coil),
               SHOP_SEARCH, H.escape(code)))
    out.append('</tbody></table>')
    return '\n'.join(out)


def compare_heating(data):
    cols = []
    for name, href, pipes in HEATING:
        rec = data['series'].get(href, {})
        rows = rec['tables'][0]['rows'] if rec.get('tables') else []
        if rows:
            casings = sorted({int(r[1]) for r in rows if r[1].isdigit()})
            pipe_nums = sorted({int(norm_pipe(r[2])[1]) for r in rows if norm_pipe(r[2])[1]})
            bends = sorted({float(r[5].replace(',', '.')) for r in rows if re.match(r'^[\d,\.]+$', r[5])})
            adv = sum(1 for r in rows if r[4].strip().lower().startswith('adv'))
            cols.append({
                'name': name, 'pipes': str(pipes),
                'dims': str(len(rows)),
                'pipe': '%d až %d mm' % (pipe_nums[0], pipe_nums[-1]) if pipe_nums else 'podľa katalógu',
                'casing': '%d až %d mm' % (casings[0], casings[-1]) if casings else 'podľa katalógu',
                'bend': ('od %s m' % ('%.2f' % bends[0]).replace('.', ',')) if bends else 'podľa katalógu',
                'adv': ('%d dimenzií' % adv) if adv else 'nie',
            })
        else:
            cols.append({'name': name, 'pipes': str(pipes), 'dims': 'podľa katalógu', 'pipe': 'podľa katalógu',
                         'casing': 'podľa katalógu', 'bend': 'podľa katalógu', 'adv': 'podľa katalógu'})
    rows = [('Počet rúr v plášti', 'pipes'), ('Prevádzkový tlak', None), ('Nosná rúra PE-Xa', 'pipe'),
            ('Plášť HDPE', 'casing'), ('Polomer ohybu', 'bend'), ('Zosilnená izolácia', 'adv'), ('Dimenzií s obj. číslom', 'dims')]
    out = ['<table class="data compare"><thead><tr><th></th>']
    for c in cols:
        out.append('<th>Microflex %s</th>' % H.escape(c['name']))
    out.append('</tr></thead><tbody>')
    for label, key in rows:
        out.append('<tr><td>%s</td>' % label)
        for c in cols:
            out.append('<td>%s</td>' % ('6 bar' if key is None else H.escape(c[key])))
        out.append('</tr>')
    out.append('</tbody></table>')
    return ''.join(out)


def main():
    os.makedirs(OUT, exist_ok=True)
    css = read(os.path.join(SRC, 'tokens.css'))
    data = json.load(io.open(os.path.join(DATA, 'microflex-watts-sk.json'), encoding='utf-8'))
    images = list(json.load(io.open(os.path.join(DATA, '_img-cache.json'), encoding='utf-8'))['images'].values())
    links_path = os.path.join(ROOT, 'links.json')
    links = json.load(io.open(links_path, encoding='utf-8')) if os.path.exists(links_path) else {}
    pdir = os.path.join(SRC, 'partials')
    partials = {n[:-5]: read(os.path.join(pdir, n)) for n in os.listdir(pdir) if n.endswith('.html')}
    generated = {'table:uno': table_uno(data), 'compare:heating': compare_heating(data)}

    def img(m):
        rec = images[int(m.group(1))]
        if 'dataUri' not in rec:
            raise SystemExit('obrázok i%s nemá dáta: %s' % (m.group(1), rec))
        return rec['dataUri']

    mimes = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml'}

    def asset(m):
        """{{asset:fotky/x.jpg}} -> data URI zo súboru v podklady/watts/"""
        path = os.path.join(ROOT, '..', 'podklady', 'watts', m.group(1))
        if not os.path.exists(path):
            raise SystemExit('podklad chýba: %s' % path)
        mime = mimes.get(os.path.splitext(path)[1].lower(), 'application/octet-stream')
        return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode('ascii'))

    for page in PAGES:
        html = read(os.path.join(SRC, page + '.html'))
        html = re.sub(r'\{\{partial:(\w+)\}\}', lambda m: partials[m.group(1)], html)
        html = html.replace('{{css}}', css)
        html = re.sub(r'\{\{(table:\w+|compare:\w+)\}\}', lambda m: generated[m.group(1)], html)
        html = re.sub(r'\{\{img:i(\d+)\}\}', img, html)
        html = re.sub(r'\{\{asset:([\w./-]+)\}\}', asset, html)
        html = re.sub(r'\{\{link:([\w-]+)\}\}', lambda m: links.get(m.group(1), '#'), html)
        left = re.findall(r'\{\{[^}]+\}\}', html)
        io.open(os.path.join(OUT, page + '.html'), 'w', encoding='utf-8', newline='\n').write(html)
        print('%-10s %5d kB  %s' % (page, len(html.encode('utf-8')) // 1024, ('NEVYRIESENE: %s' % left[:5]) if left else 'OK'))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
