"""Naše názvy, popisy a čisté tabuľky spojok a príslušenstva Microflex (SK a CS).

Názvy na watts.eu sú strojový preklad („Uzatvára prach na jednom potrubí“), preto ich pomenúvame
podľa slovenského katalógu Watts (s. 19 až 33). Obj. čísla a obchodné označenia (MFP, MICRO SEAL…)
sa nemenia. Kľúč je id produktu z normalize.py (slug z pôvodného názvu), aby odkazy `suvisiace`
na stránkach radov ostali platné.
"""
import re

# id -> nazov, nazov_cs, popis, popis_cs; skryt=True vyradí duplicitu zo zdroja
PRODUKTY = {
    # --- Spojky PE-X pre vykurovanie a COOL (katalóg s. 22 a 23) ---
    '3-x-ohrev-spojky-pe-x-t': dict(
        nazov='T-spojka 3 × PE-X, vykurovanie a COOL', nazov_cs='T-spojka 3 × PE-X, vytápění a COOL',
        popis='Svorná T-spojka na odbočenie z nosnej rúry PE-X vo vykurovaní a v rozvodoch studenej alebo chladiacej vody. Má dlhú nosnú rúrku pre pevné uchytenie, objímku so skrutkou z nehrdzavejúcej ocele a oceľovú vložku, ktorá uľahčuje montáž. Pod zemou ju zakryte izolačnou sadou T-kusu.',
        popis_cs='Svěrná T-spojka k odbočení z nosné trubky PE-X ve vytápění a v rozvodech studené nebo chladicí vody. Má dlouhou nosnou trubku pro pevné uchycení, objímku se šroubem z nerezové oceli a ocelovou vložku, která usnadňuje montáž. Pod zemí ji zakryjte izolační sadou T-kusu.'),
    'pe-x-x-pe-x-spojka-kurenie': dict(
        nazov='Priama spojka PE-X × PE-X, vykurovanie a COOL', nazov_cs='Přímá spojka PE-X × PE-X, vytápění a COOL',
        popis='Svorná spojka, ktorá spojí dve nosné rúry PE-X vo vykurovaní a v rozvodoch studenej alebo chladiacej vody. Dlhá nosná rúrka, objímka so skrutkou z nehrdzavejúcej ocele a oceľová vložka pre ľahkú montáž. Pod zemou ju zakryte izolačnou sadou priameho spoja.',
        popis_cs='Svěrná spojka, která spojí dvě nosné trubky PE-X ve vytápění a v rozvodech studené nebo chladicí vody. Dlouhá nosná trubka, objímka se šroubem z nerezové oceli a ocelová vložka pro snadnou montáž. Pod zemí ji zakryjte izolační sadou přímého spoje.'),
    'pe-x-x-pe-x-koleno-spojky-vykurovanie': dict(
        nazov='Rohová spojka PE-X × PE-X, vykurovanie a COOL', nazov_cs='Rohová spojka PE-X × PE-X, vytápění a COOL',
        popis='Svorná rohová spojka 90° na zmenu smeru nosnej rúry PE-X tam, kde nestačí polomer ohybu potrubia. Pre vykurovanie a rozvody studenej alebo chladiacej vody.',
        popis_cs='Svěrná rohová spojka 90° ke změně směru nosné trubky PE-X tam, kde nestačí poloměr ohybu potrubí. Pro vytápění a rozvody studené nebo chladicí vody.'),
    'pe-x-spojka-kurenie-cool-6-16bar': dict(
        nazov='Prechodová spojka PE-X s vonkajším závitom, vykurovanie a COOL', nazov_cs='Přechodová spojka PE-X s vnějším závitem, vytápění a COOL',
        popis='Prechod z nosnej rúry PE-X na závit, najčastejšie v kotolni alebo pri tepelnom čerpadle. Dlhá nosná rúrka pre pevné uchytenie, objímka so skrutkou z nehrdzavejúcej ocele a oceľová vložka pre ľahkú montáž. Vykurovanie 6 bar do 95 °C, COOL 16 bar do 25 °C.',
        popis_cs='Přechod z nosné trubky PE-X na závit, nejčastěji v kotelně nebo u tepelného čerpadla. Dlouhá nosná trubka pro pevné uchycení, objímka se šroubem z nerezové oceli a ocelová vložka pro snadnou montáž. Vytápění 6 bar do 95 °C, COOL 16 bar do 25 °C.'),
    'zvarove-koncovky-spojky-a-cool-6-16bar-s6': dict(
        nazov='Spojka PE-X na navarenie, vykurovanie a COOL', nazov_cs='Spojka PE-X k navaření, vytápění a COOL',
        popis='Priama mosadzná spojka s oceľovým koncom, ktorý sa navarí na oceľové potrubie. Vhodná na napojenie Microflexu na existujúci oceľový rozvod vykurovania, studenej alebo chladiacej vody.',
        popis_cs='Přímá mosazná spojka s ocelovým koncem, který se navaří na ocelové potrubí. Vhodná k napojení Microflexu na stávající ocelový rozvod vytápění, studené nebo chladicí vody.'),
    'microflex-pe-x-spojky-vykurovanie': dict(skryt=True),  # tie isté obj. čísla ako prechodová spojka vyššie
    # --- Spojky PE-X pre sanitu (katalóg s. 24) ---
    'sanitarne-spojky-microflex-pe-x': dict(
        nazov='Prechodová spojka PE-X s vonkajším závitom, sanita', nazov_cs='Přechodová spojka PE-X s vnějším závitem, sanita',
        popis='Prechod zo sanitárnej nosnej rúry PE-Xa na závit pri rozvode teplej a studenej pitnej vody. Pre rúry SDR 7,4 do 10 bar a 95 °C.',
        popis_cs='Přechod ze sanitární nosné trubky PE-Xa na závit u rozvodu teplé a studené pitné vody. Pro trubky SDR 7,4 do 10 bar a 95 °C.'),
    'pe-x-x-pe-x-sanitarne-zariadenie': dict(
        nazov='Priama spojka PE-X × PE-X, sanita', nazov_cs='Přímá spojka PE-X × PE-X, sanita',
        popis='Svorná spojka, ktorá spojí dve sanitárne nosné rúry PE-Xa pri rozvode teplej a studenej pitnej vody. Pre rúry SDR 7,4 do 10 bar a 95 °C.',
        popis_cs='Svěrná spojka, která spojí dvě sanitární nosné trubky PE-Xa u rozvodu teplé a studené pitné vody. Pro trubky SDR 7,4 do 10 bar a 95 °C.'),
    'sanitarne-kolenne-spojky-pe-x-x-pe-x': dict(
        nazov='Rohová spojka PE-X × PE-X, sanita', nazov_cs='Rohová spojka PE-X × PE-X, sanita',
        popis='Svorná rohová spojka 90° pre sanitárne nosné rúry PE-Xa na teplú a studenú pitnú vodu. Pre rúry SDR 7,4 do 10 bar a 95 °C.',
        popis_cs='Svěrná rohová spojka 90° pro sanitární nosné trubky PE-Xa na teplou a studenou pitnou vodu. Pro trubky SDR 7,4 do 10 bar a 95 °C.'),
    '3-x-pe-x-t-spojka-sanitarna': dict(
        nazov='T-spojka 3 × PE-X, sanita', nazov_cs='T-spojka 3 × PE-X, sanita',
        popis='Svorná T-spojka na odbočenie zo sanitárnej nosnej rúry PE-Xa na teplú a studenú pitnú vodu. Pre rúry SDR 7,4 do 10 bar a 95 °C.',
        popis_cs='Svěrná T-spojka k odbočení ze sanitární nosné trubky PE-Xa na teplou a studenou pitnou vodu. Pro trubky SDR 7,4 do 10 bar a 95 °C.'),
    # --- Príslušenstvo pre spojky PE-X (katalóg s. 25 až 27) ---
    'fixny-bod': dict(
        nazov='Pevný bod MFP', nazov_cs='Pevný bod MFP',
        popis='Ukotví koniec nosnej rúry PE-Xa, aby zachytil jej rozťahovanie a zmršťovanie pri zmene teploty. Podľa výrobcu môže vynechanie pevných bodov viesť k vážnemu poškodeniu rozvodu.',
        popis_cs='Ukotví konec nosné trubky PE-Xa, aby zachytil její roztahování a smršťování při změně teploty. Podle výrobce může vynechání pevných bodů vést k vážnému poškození rozvodu.'),
    'objimka-obal': dict(
        nazov='Objímka z bronzu', nazov_cs='Objímka z bronzu',
        popis='Bronzová objímka s rovnobežným vnútorným závitom podľa ISO 228 na spojenie dvoch závitových dielov.',
        popis_cs='Bronzová objímka s válcovým vnitřním závitem podle ISO 228 ke spojení dvou závitových dílů.'),
    'koleno-90': dict(
        nazov='Koleno 90° z bronzu', nazov_cs='Koleno 90° z bronzu',
        popis='Bronzové koleno s rovnobežným vnútorným závitom podľa ISO 228.',
        popis_cs='Bronzové koleno s válcovým vnitřním závitem podle ISO 228.'),
    't-kus-z-bronzu': dict(
        nazov='T-kus z bronzu', nazov_cs='T-kus z bronzu',
        popis='Bronzový T-kus s rovnobežným vnútorným závitom podľa ISO 228.',
        popis_cs='Bronzový T-kus s válcovým vnitřním závitem podle ISO 228.'),
    'vsuvka-z-poniklovanej-mosadze': dict(
        nazov='Vsuvka z poniklovanej mosadze', nazov_cs='Vsuvka z poniklované mosazi',
        popis='Vsuvka z poniklovanej mosadze s kužeľovým závitom podľa ISO 7.',
        popis_cs='Vsuvka z poniklované mosazi s kuželovým závitem podle ISO 7.'),
    'redukcne-puzdro': dict(
        nazov='Redukcia M × F z mosadze', nazov_cs='Redukce M × F z mosazi',
        popis='Mosadzná redukcia s rovnobežným vonkajším a vnútorným závitom podľa ISO 228 na prechod medzi dvoma rozmermi závitu.',
        popis_cs='Mosazná redukce s válcovým vnějším a vnitřním závitem podle ISO 228 k přechodu mezi dvěma rozměry závitu.'),
    'priruba-so-zavitom-z-pozinkovanej-ocele': dict(
        nazov='Príruba so závitom z pozinkovanej ocele', nazov_cs='Příruba se závitem z pozinkované oceli',
        popis='Príruba so závitom z pozinkovanej ocele na prírubové pripojenie rozvodu.',
        popis_cs='Příruba se závitem z pozinkované oceli pro přírubové připojení rozvodu.'),
    'zatka': dict(
        nazov='Zátka z mosadze', nazov_cs='Zátka z mosazi',
        popis='Mosadzná zátka s vonkajším rovnobežným závitom podľa ISO 228.',
        popis_cs='Mosazná zátka s vnějším válcovým závitem podle ISO 228.'),
    'uzatvaraci-ventil': dict(
        nazov='Guľový kohút', nazov_cs='Kulový kohout',
        popis='Guľový kohút so závitovým pripojením na uzavretie vetvy rozvodu. Rozmery závitov sú v tabuľke.',
        popis_cs='Kulový kohout se závitovým připojením k uzavření větve rozvodu. Rozměry závitů jsou v tabulce.'),
    # --- Koncové krytky (katalóg pri každom rade: MS, MSD, MSQ, MK, MG) ---
    'uzatvara-prach-na-jednom-potrubi': dict(
        nazov='Protiprachová krytka MS pre UNO', nazov_cs='Protiprachová krytka MS pro UNO',
        popis='Uzavrie koniec potrubia s jednou rúrou, aby sa do izolácie a rúry nedostala nečistota a vlhkosť. Podľa postupu výrobcu sa nasadzuje hneď po rozvinutí potrubia.',
        popis_cs='Uzavře konec potrubí s jednou trubkou, aby se do izolace a trubky nedostala nečistota a vlhkost. Podle postupu výrobce se nasazuje hned po rozvinutí potrubí.'),
    'uzatvara-prach-na-dvojitom-potrubi': dict(
        nazov='Protiprachová krytka MSD pre DUO', nazov_cs='Protiprachová krytka MSD pro DUO',
        popis='Uzavrie koniec potrubia s dvoma rúrami, aby sa do izolácie a rúr nedostala nečistota a vlhkosť. Podľa postupu výrobcu sa nasadzuje hneď po rozvinutí potrubia.',
        popis_cs='Uzavře konec potrubí se dvěma trubkami, aby se do izolace a trubek nedostala nečistota a vlhkost. Podle postupu výrobce se nasazuje hned po rozvinutí potrubí.'),
    'uzatvara-prach-na-potrubi-quadro': dict(
        nazov='Protiprachová krytka MSQ pre QUADRO', nazov_cs='Protiprachová krytka MSQ pro QUADRO',
        popis='Uzavrie koniec potrubia QUADRO so štyrmi rúrami počas skladovania a pokládky.',
        popis_cs='Uzavře konec potrubí QUADRO se čtyřmi trubkami během skladování a pokládky.'),
    'teplom-zmrstitelne-hlavice-pre-uno-rurku': dict(
        nazov='Zmršťovacia krytka MK pre UNO', nazov_cs='Smršťovací krytka MK pro UNO',
        popis='Teplom zmrštiteľná krytka na koniec potrubia s jednou rúrou. Zabráni vniknutiu vody medzi vonkajší plášť a izolovanú nosnú rúru.',
        popis_cs='Teplem smrštitelná krytka na konec potrubí s jednou trubkou. Zabrání vniknutí vody mezi vnější plášť a izolovanou nosnou trubku.'),
    'teplom-zmrstitelne-hlavice-pre-rurku-duo': dict(
        nazov='Zmršťovacia krytka MK pre DUO', nazov_cs='Smršťovací krytka MK pro DUO',
        popis='Teplom zmrštiteľná krytka na koniec potrubia s dvoma rúrami. Zabráni vniknutiu vody medzi vonkajší plášť a izolované nosné rúry.',
        popis_cs='Teplem smrštitelná krytka na konec potrubí se dvěma trubkami. Zabrání vniknutí vody mezi vnější plášť a izolované nosné trubky.'),
    'dokoncenie-uzaverov-epdm-na-jednotlivych-potrubiach': dict(
        nazov='Gumová krytka EPDM pre UNO', nazov_cs='Pryžová krytka EPDM pro UNO',
        popis='Gumová koncová krytka z EPDM na potrubie s jednou rúrou. Obj. čísla pre jednotlivé rozmery sú v katalógu výrobcu pri každom rade.',
        popis_cs='Pryžová koncová krytka z EPDM na potrubí s jednou trubkou. Obj. čísla pro jednotlivé rozměry jsou v katalogu výrobce u každé řady.'),
    'dokoncenie-uzaverov-epdm-na-dvojitych-potrubiach': dict(
        nazov='Gumová krytka EPDM pre DUO', nazov_cs='Pryžová krytka EPDM pro DUO',
        popis='Gumová koncová krytka z EPDM na potrubie s dvoma rúrami. Obj. čísla pre jednotlivé rozmery sú v katalógu výrobcu pri každom rade.',
        popis_cs='Pryžová koncová krytka z EPDM na potrubí se dvěma trubkami. Obj. čísla pro jednotlivé rozměry jsou v katalogu výrobce u každé řady.'),
    'dokoncenie-uzaverov-epdm-na-potrubiach-quadro': dict(
        nazov='Gumová krytka EPDM pre QUADRO', nazov_cs='Pryžová krytka EPDM pro QUADRO',
        popis='Gumová koncová krytka z EPDM na potrubie QUADRO. Obj. čísla sú v katalógu výrobcu pri rade QUADRO.',
        popis_cs='Pryžová koncová krytka z EPDM na potrubí QUADRO. Obj. čísla jsou v katalogu výrobce u řady QUADRO.'),
    # --- Izolačné sady a revízna šachta (katalóg s. 19, 31 až 33) ---
    'pripojovacia-sada-pre-microflex-cool-s-vykurovacou-paskou': dict(
        nazov='Pripojovacia sada pre vyhrievací kábel COOL', nazov_cs='Připojovací sada pro topný kabel COOL',
        popis='Na pripojenie vyhrievacieho kábla v potrubí Microflex COOL. Priestorový termostat MVTH vypína kábel podľa teploty, aby nebol stále pod napätím, spojovacia skrinka MVBOX a izolačné sady MVKIT pre 10 alebo 18 W/m.',
        popis_cs='K připojení topného kabelu v potrubí Microflex COOL. Prostorový termostat MVTH vypíná kabel podle teploty, aby nebyl stále pod napětím, spojovací skříňka MVBOX a izolační sady MVKIT pro 10 nebo 18 W/m.'),
    'redukcia-pre-izolovanu-supravu-t-kusu': dict(
        nazov='Redukcia pre izolačnú sadu T-kusu', nazov_cs='Redukce pro izolační sadu T-kusu',
        popis='Použije sa, keď je v odbočke príliš veľký rozdiel priemerov plášťov. Tvorí ju vonkajší plášť s vnútornou izoláciou a redukčným puzdrom.',
        popis_cs='Použije se, když je v odbočce příliš velký rozdíl průměrů plášťů. Tvoří ji vnější plášť s vnitřní izolací a redukčním pouzdrem.'),
    'inspekcna-komora': dict(
        nazov='Revízna šachta MIS', nazov_cs='Revizní šachta MIS',
        popis='Revízna šachta z HDPE so šiestimi prípojnými miestami pre potrubia UNO, DUO a QUADRO. Umožňuje odbočky, uzatváracie armatúry a neskoršiu kontrolu spojov. Teplom zmrštiteľné návleky sa objednávajú samostatne.',
        popis_cs='Revizní šachta z HDPE se šesti přípojnými místy pro potrubí UNO, DUO a QUADRO. Umožňuje odbočky, uzavírací armatury a pozdější kontrolu spojů. Teplem smrštitelné návleky se objednávají samostatně.'),
    'izolovana-sada-s-dvojitym-t-kusom': dict(
        nazov='Izolačná sada dvojitého T-kusu', nazov_cs='Izolační sada dvojitého T-kusu',
        popis='Zaizoluje a utesní dvojitú odbočku medzi potrubiami UNO, DUO a QUADRO pod zemou. Obsahuje dve polovice z HDPE, izoláciu z minerálnej vlny a tesnenia. Teplom zmrštiteľné návleky sa objednávajú samostatne.',
        popis_cs='Zaizoluje a utěsní dvojitou odbočku mezi potrubími UNO, DUO a QUADRO pod zemí. Obsahuje dvě poloviny z HDPE, izolaci z minerální vlny a těsnění. Teplem smrštitelné návleky se objednávají samostatně.'),
    'izolovana-suprava-i-kus': dict(
        nazov='Izolačná sada priameho spoja', nazov_cs='Izolační sada přímého spoje',
        popis='Zaizoluje a utesní priamy spoj potrubí UNO, DUO a QUADRO pod zemou. Obsahuje dve polovice z HDPE, izoláciu z minerálnej vlny a tesnenia. Teplom zmrštiteľné návleky sa objednávajú samostatne.',
        popis_cs='Zaizoluje a utěsní přímý spoj potrubí UNO, DUO a QUADRO pod zemí. Obsahuje dvě poloviny z HDPE, izolaci z minerální vlny a těsnění. Teplem smrštitelné návleky se objednávají samostatně.'),
    'izolacna-sada-i-variant': dict(
        nazov='Izolačná sada priameho spoja, rúrová', nazov_cs='Izolační sada přímého spoje, trubková',
        popis='Zaizoluje a utesní priamy spoj potrubí UNO, DUO a QUADRO. Sada obsahuje hladkú čiernu rúru z HDPE a izoláciu z minerálnej vlny.',
        popis_cs='Zaizoluje a utěsní přímý spoj potrubí UNO, DUO a QUADRO. Sada obsahuje hladkou černou trubku z HDPE a izolaci z minerální vlny.'),
    'izolovana-suprava-t-kusu': dict(
        nazov='Izolačná sada T-kusu', nazov_cs='Izolační sada T-kusu',
        popis='Zaizoluje a utesní odbočku medzi potrubiami UNO, DUO a QUADRO pod zemou. Obsahuje dve polovice z HDPE, izoláciu z minerálnej vlny a tesnenia. Teplom zmrštiteľné návleky sa objednávajú samostatne.',
        popis_cs='Zaizoluje a utěsní odbočku mezi potrubími UNO, DUO a QUADRO pod zemí. Obsahuje dvě poloviny z HDPE, izolaci z minerální vlny a těsnění. Teplem smrštitelné návleky se objednávají samostatně.'),
    'zateplene-koleno-90': dict(
        nazov='Izolačná sada kolena 90°', nazov_cs='Izolační sada kolena 90°',
        popis='Zaizoluje a utesní pravouhlé spojenie potrubí UNO, DUO a QUADRO pod zemou. Obsahuje dve polovice z HDPE, izoláciu z minerálnej vlny a tesnenia.',
        popis_cs='Zaizoluje a utěsní pravoúhlé spojení potrubí UNO, DUO a QUADRO pod zemí. Obsahuje dvě poloviny z HDPE, izolaci z minerální vlny a těsnění.'),
    'izolovana-suprava-na-pripojenie-y': dict(
        nazov='Izolačná sada Y-kusu', nazov_cs='Izolační sada Y-kusu',
        popis='Zaizoluje a utesní prechod z jedného potrubia na dve: z QUADRO na dve DUO alebo z DUO na dve UNO. Obsahuje dve polovice z HDPE, izoláciu z minerálnej vlny a tesnenia.',
        popis_cs='Zaizoluje a utěsní přechod z jednoho potrubí na dvě: z QUADRO na dvě DUO nebo z DUO na dvě UNO. Obsahuje dvě poloviny z HDPE, izolaci z minerální vlny a těsnění.'),
    # --- Opravné a výstražné pásky (katalóg s. 29) ---
    'mhm-zmrstovacia-buzirka-na-opravu': dict(
        nazov='Návlek MHM na opravu plášťa', nazov_cs='Návlek MHM na opravu pláště',
        popis='Teplom zmrštiteľný návlek na opravu náhodného lokálneho poškodenia vonkajšieho plášťa.',
        popis_cs='Teplem smrštitelný návlek na opravu náhodného místního poškození vnějšího pláště.',
        vyrad_kody=('MMDV',)),  # zdroj má v tabuľke omylom riadok stenovej priechodky
    'opravna-paska': dict(
        nazov='Opravná páska', nazov_cs='Opravná páska',
        popis='Na opravu náhodného lokálneho poškodenia vonkajšieho plášťa: páska nanášaná za studena alebo teplom zmrštiteľná páska.',
        popis_cs='Na opravu náhodného místního poškození vnějšího pláště: páska nanášená za studena nebo teplem smrštitelná páska.'),
    'vystrazna-paska': dict(
        nazov='Výstražná páska', nazov_cs='Výstražná páska',
        popis='Označí trasu podzemného potrubia pri neskorších výkopoch. Podľa postupu výrobcu sa kladie do výkopu nad potrubie po prvej vrstve zásypu.',
        popis_cs='Označí trasu podzemního potrubí při pozdějších výkopech. Podle postupu výrobce se klade do výkopu nad potrubí po první vrstvě zásypu.'),
    # --- Prestupy stenou (katalóg s. 30 a 31) ---
    'micro-seal-pre-tlakovu-vodu': dict(
        nazov='Tesnenie MICRO SEAL, prestup stenou pre tlakovú vodu', nazov_cs='Těsnění MICRO SEAL, prostup stěnou pro tlakovou vodu',
        popis='Vodotesné tesnenie z článkov EPDM sa osadí priamo do vyvŕtaného otvoru alebo do zamurovanej plastovej či vláknocementovej priechodky a utiahne sa skrutkami.',
        popis_cs='Vodotěsné těsnění z článků EPDM se osadí přímo do vyvrtaného otvoru nebo do zazděné plastové či vláknocementové průchodky a utáhne se šrouby.'),
    'priechodka-steny-mmdv-pre-vodu-bez-tlaku': dict(
        nazov='Stenová priechodka MMDV, netlaková voda', nazov_cs='Stěnová průchodka MMDV, beztlaková voda',
        popis='Profilovaná rúra z HDPE so zmršťovacou manžetou. Priechodka sa zamuruje, potrubie Microflex cez ňu prejde a manžeta ho utesní.',
        popis_cs='Profilovaná trubka z HDPE se smršťovací manžetou. Průchodka se zazdí, potrubí Microflex jí projde a manžeta ho utěsní.'),
    'tesnenie-na-prienik-na-stenu-micro-press': dict(
        nazov='Tesnenie MICRO PRESS, prestup stenou', nazov_cs='Těsnění MICRO PRESS, prostup stěnou',
        popis='Tesnenie prestupu stenou pre predizolované potrubie s plášťom z PE, vo verziách pre všetky priemery plášťov Microflex.',
        popis_cs='Těsnění prostupu stěnou pro předizolované potrubí s pláštěm z PE, ve verzích pro všechny průměry plášťů Microflex.'),
}

# Skupiny (rady typu skupina): naše názvy a krátke popisy
SKUPINY = {
    'pe-x-spojky-vykurovanie-a-cool': dict(
        popis='Svorné spojky z mosadze pre nosné rúry PE-Xa vo vykurovaní (6 bar, do 95 °C) a pre rúry PE potrubia COOL (16 bar, do 25 °C). Montujú sa bez zvárania a bez špeciálneho náradia.',
        popis_cs='Svěrné spojky z mosazi pro nosné trubky PE-Xa ve vytápění (6 bar, do 95 °C) a pro trubky PE potrubí COOL (16 bar, do 25 °C). Montují se bez svařování a bez speciálního nářadí.'),
    'pe-x-spojky-sanita': dict(
        popis='Svorné spojky pre sanitárne nosné rúry PE-Xa SDR 7,4 na teplú a studenú pitnú vodu do 10 bar a 95 °C.',
        popis_cs='Svěrné spojky pro sanitární nosné trubky PE-Xa SDR 7,4 na teplou a studenou pitnou vodu do 10 bar a 95 °C.'),
    'prislusenstvo-spojok': dict(
        popis='Pevné body, závitové tvarovky z bronzu a mosadze, príruby a guľové kohúty na napojenie spojok v budove.',
        popis_cs='Pevné body, závitové tvarovky z bronzu a mosazi, příruby a kulové kohouty k napojení spojek v budově.'),
    'koncovky-a-redukcie': dict(
        nazov='Koncové krytky', nazov_cs='Koncové krytky',
        popis='Krytky uzavrú koniec potrubia: protiprachové počas pokládky, zmršťovacie a gumové z EPDM natrvalo, aby sa medzi plášť a rúru nedostala voda.',
        popis_cs='Krytky uzavřou konec potrubí: protiprachové během pokládky, smršťovací a pryžové z EPDM natrvalo, aby se mezi plášť a trubku nedostala voda.'),
    'izolacne-sady': dict(
        popis='Sady na zaizolovanie a utesnenie spojov pod zemou: priamy spoj, T-kus, dvojitý T-kus, Y-kus, koleno a revízna šachta. Aj pripojovacia sada pre vyhrievací kábel COOL.',
        popis_cs='Sady k zaizolování a utěsnění spojů pod zemí: přímý spoj, T-kus, dvojitý T-kus, Y-kus, koleno a revizní šachta. I připojovací sada pro topný kabel COOL.'),
    'opravne-a-vystrazne-pasky': dict(
        popis='Opravné pásky a návlek na poškodený plášť a výstražná páska nad trasu potrubia.',
        popis_cs='Opravné pásky a návlek na poškozený plášť a výstražná páska nad trasu potrubí.'),
    'prestupy-stenou': dict(
        popis='Tesnenia a priechodky na vstup potrubia do budovy: MICRO SEAL a MICRO PRESS a stenová priechodka MMDV pre netlakovú vodu.',
        popis_cs='Těsnění a průchodky pro vstup potrubí do budovy: MICRO SEAL a MICRO PRESS a stěnová průchodka MMDV pro beztlakovou vodu.'),
}

# --- Čisté tabuľky: preklad hlavičiek (SK, CS, jednotka) a úprava buniek ---

HLAVICKY = [
    (r'^(art\.?\s*no\.?|kód|výrobné číslo)$', 'Obj. číslo', 'Obj. číslo', None),
    (r'^PE-X\s*d(out|ext)\s*/\s*s', 'Rúra PE-X, Ø × hrúbka', 'Trubka PE-X, Ø × tloušťka', 'mm'),
    (r'thread|závit|rozmer \(inch\)', 'Závit', 'Závit', None),
    (r'outer diameter of pipe', 'Pripojenie, Ø rúr', 'Připojení, Ø trubek', 'mm'),
    (r'^(weight|váha)', 'Hmotnosť', 'Hmotnost', 'kg'),
    (r'weld-end dext', 'Koniec na navarenie, Ø vonk.', 'Konec k navaření, Ø vnější', 'mm'),
    (r'weld-end dint', 'Koniec na navarenie, Ø vnút.', 'Konec k navaření, Ø vnitřní', 'mm'),
    (r'microflex pipe with casing|rúrka microflex s doutom', 'Plášť potrubia Ø', 'Plášť potrubí Ø', 'mm'),
    (r'^outer casing', 'Plášť potrubia Ø', 'Plášť potrubí Ø', 'mm'),
    (r'^L \(mm\)$', 'Dĺžka L', 'Délka L', 'mm'),
    (r'^W \(mm\)$', 'Šírka W', 'Šířka W', 'mm'),
    (r'^H \(mm\)$', 'Výška H', 'Výška H', 'mm'),
    (r'diameter mis', 'Priemer šachty', 'Průměr šachty', 'mm'),
    (r'mm insulation kit dout', 'Sada Ø vonk.', 'Sada Ø vnější', 'mm'),
    (r'nástenné priechodné potrubie', 'Priechodka Ø vonk.', 'Průchodka Ø vnější', 'mm'),
    (r'otvor na stenu|otvor v stene|core hole', 'Otvor v stene', 'Otvor ve stěně', 'mm'),
    (r'rubber a', 'Guma A', 'Pryž A', 'mm'),
    (r'bolts b', 'Dĺžka skrutiek B', 'Délka šroubů B', 'mm'),
    (r'^L x W', 'Dĺžka × šírka', 'Délka × šířka', 'm'),
    (r'^opravna páska$', 'Druh', 'Druh', None),
    (r'^výstražná páska$', 'Nápis', 'Nápis', None),
]

BUNKY_CS = {
    'Termostat': 'Termostat', 'Rozvodná skrinka': 'Rozvodná skříňka',
    'Izolačná sada do 10 W': 'Izolační sada do 10 W', 'Izolačná sada do 18 W': 'Izolační sada do 18 W',
    'Páska nanášaná za studena': 'Páska nanášená za studena', 'Teplom zmrštiteľná páska': 'Teplem smrštitelná páska',
    'Pozor: vodovodné potrubie (červené)': 'Pozor: vodovodní potrubí (červená)',
    'Pozor: vodovodné potrubie s vykurovacím káblom (modré)': 'Pozor: vodovodní potrubí s topným kabelem (modrá)',
}


def _bunka(text, stlpec):
    s = (text or '').replace('мм', '').replace('MICROFLEX ', '').replace('х', 'x').replace('”', '″').replace('"', '″').strip()
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'(\d)\s*[xX]\s*(\d)', r'\1 × \2', s)
    s = re.sub(r'(\d)\.(\d)', r'\1,\2', s)
    s = re.sub(r'(\d),00$', r'\1', s) if stlpec in ('Guma A',) else s
    s = re.sub(r'(\d)\s+-\s+(\d)', '\\1–\\2', s)  # rozsah „100 - 102“ → „100–102“
    if stlpec == 'Rúra PE-X, Ø × hrúbka':
        s = re.sub(r'(\d+)\s*/\s*(\d+(?:,\d+)?)', r'\1 × \2', s)
    s = s.replace(' to ', ' na ').replace(' reduction', '')
    return s


def ciste_tabulky(tabulky, vyrad_kody=()):
    """Z tabuliek watts.eu urobí [{hlavicky, hlavicky_cs, jednotky, riadky, riadky_cs}], prázdne vynechá."""
    out = []
    for t in tabulky or []:
        head = [h for h in t.get('head') or []]
        rows = [r for r in t.get('rows') or [] if len(r) > 1 and any(c.strip() for c in r)
                and not (vyrad_kody and any(r[0].strip().startswith(k) for k in vyrad_kody))]
        if not head or not rows or not any(h.strip() for h in head):
            continue
        hs, hc, jed = [], [], []
        vsetky_cisla = {}
        for i, h in enumerate(head):
            h0 = re.sub(r'<[^>]*>|<\s*/\s*td\s*>', '', h).strip()
            najdene = None
            for rx, sk, cs, j in HLAVICKY:
                if re.search(rx, h0, re.I):
                    najdene = (sk, cs, j)
                    break
            if not najdene and h0.lower() == 'popis':
                hodnoty = [r[i] for r in rows if i < len(r)]
                ciselne = all(re.match(r'^(MICROFLEX\s*)?\d', v.strip()) for v in hodnoty if v.strip())
                s_lomkou = any('/' in v for v in hodnoty)
                if ciselne and s_lomkou:
                    najdene = ('Plášť / rúra', 'Plášť / trubka', 'mm')
                elif ciselne:
                    najdene = ('Plášť potrubia Ø', 'Plášť potrubí Ø', 'mm')
                else:
                    najdene = ('Popis', 'Popis', None)
            if not najdene:
                najdene = (h0, h0, None)
            hs.append(najdene[0]); hc.append(najdene[1]); jed.append(najdene[2])
        riadky, riadky_cs = [], []
        for r in rows:
            if vyrad_kody and any(r[0].strip().startswith(k) for k in vyrad_kody):
                continue
            rr = [_bunka(c, hs[i] if i < len(hs) else '') for i, c in enumerate(r)]
            riadky.append(rr)
            riadky_cs.append([BUNKY_CS.get(c, c) for c in rr])
        out.append(dict(hlavicky=hs, hlavicky_cs=hc, jednotky=jed, riadky=riadky, riadky_cs=riadky_cs))
    return out
