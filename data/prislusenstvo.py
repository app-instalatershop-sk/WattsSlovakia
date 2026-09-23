"""Príslušenstvo k obj. číslam potrubia z katalógu Watts Microflex (slovenské vydanie, s. 8 až 16 a 18).

Na každej strane radu sú bloky s nadpisom a kódmi v poradí rúr: Potrubie, zmršťovacia krytka MK,
pevný bod MFP (kód a závit, pri viacerých rúrach viac kódov a potom rovnako veľa závitov),
protiprachová krytka MS, gumová krytka EPDM MG, pri COOL plastové spojky MPP. „(*)“ = treba dva
pevné body, „n. a.“ = diel pre túto rúru nie je. Strana 17 (COOL DUO) sa vynecháva: jej bloky
príslušenstva patria k DUO vykurovaniu (chyba katalógu).
"""
import re

STRANY = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18]
# Na stranách DUO vykurovania platí poznámka pre celé potrubie: dva pevné body (s. 10 a 11).
DVA_PEVNE_BODY = {10, 11}

RE_RURA = re.compile(r'^M[A-Z]{0,2}\d{4,7}\s?[A-Z]{0,2}\d{0,4}[A-Z]{0,3}$')
RE_ZAVIT = re.compile(r'^[\d /]+[”″"]\s*M$')
NA = 'n. a.'


def _tokeny(text):
    return [l.strip() for l in text.split('\n') if l.strip()]


def _blok(tok, hlavicka, test):
    """Kódy za hlavičkou (zoznam tokenov), kým spĺňajú test alebo sú „n. a.“."""
    n = len(hlavicka)
    for i in range(len(tok) - n + 1):
        if tok[i:i + n] == hlavicka:
            out = []
            for t in tok[i + n:]:
                if t == NA or test(t):
                    out.append(None if t == NA else t.replace(' ', ''))
                else:
                    break
            return out
    return []


def _pevne_body(tok, hlavicka):
    """Riadky pevných bodov: niekoľko kódov (MFP, pri COOL MPP) a za nimi rovnako veľa závitov."""
    n = len(hlavicka)
    for i in range(len(tok) - n + 1):
        if tok[i:i + n] != hlavicka:
            continue
        riadky, kody, zavity = [], [], []
        for t in tok[i + n:]:
            if t == NA:
                (zavity if kody and len(zavity) < len(kody) else kody).append(None)
            elif re.match(r'^M(FP|PF|PP)[\d/]+( \(\*\))?$', t):
                if zavity:
                    riadky.append(list(zip(kody, zavity))); kody, zavity = [], []
                kody.append(t)
            elif RE_ZAVIT.match(t):
                zavity.append(t.replace('”', '″').replace('"', '″'))
            else:
                break
            if kody and len(zavity) == len(kody):
                riadky.append(list(zip(kody, zavity))); kody, zavity = [], []
        if kody:
            riadky.append(list(zip(kody, zavity + [None] * (len(kody) - len(zavity)))))
        return riadky
    return []


def katalog_prislusenstvo(doc):
    """{obj. číslo potrubia: [{druh, obj, zavit?, pocet?}]} zo strán katalógu (PyMuPDF dokument)."""
    out = {}
    for s in STRANY:
        tok = _tokeny(doc[s - 1].get_text())
        rury = _blok(tok, ['Potrubie', 'Kód'], RE_RURA.match)
        mk = _blok(tok, ['MK Kód'], lambda t: t.startswith('MK'))
        ms = _blok(tok, ['MS Kód'], lambda t: re.match(r'^MS[DQ]?\d+$', t))
        mg = _blok(tok, ['EPDM Kód'], lambda t: re.match(r'^MG[DQ]?\d+$', t))
        mfp = _pevne_body(tok, ['Pevný bod MFP', 'Kód', 'Závit'])
        mpp = _pevne_body(tok, ['Spojky MPP', 'Kód', 'Závit'])
        for i, r in enumerate(rury):
            if not r:
                continue
            p = []
            for druh, zoznam in (('MK', mk), ('MS', ms), ('MG', mg)):
                if i < len(zoznam) and zoznam[i]:
                    p.append({'druh': druh, 'obj': zoznam[i]})
            for druh, riadky in (('MFP', mfp), ('MPP', mpp)):
                if i < len(riadky):
                    for kod, zavit in riadky[i]:
                        if not kod:
                            continue
                        dva = '(*)' in kod or s in DVA_PEVNE_BODY
                        kod = kod.replace(' (*)', '').replace('MPF', 'MFP')  # QUADRO s. 15: preklep „MPF54“
                        polozka = {'druh': druh, 'obj': kod}
                        if zavit:
                            polozka['zavit'] = zavit
                        if dva and druh == 'MFP':
                            polozka['pocet'] = 2
                        p.append(polozka)
            out.setdefault(r, p)
    return out


def kod_katalogu(obj):
    """Obj. číslo z watts.eu v zápise katalógu: sanitárne DUO má na webe príponu SWI, v katalógu S."""
    return re.sub(r'SWI$', 'S', obj)
