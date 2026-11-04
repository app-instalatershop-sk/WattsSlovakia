<?php
/**
 * Dopyt na projekt z microflex.sk (stránka Pre firmy, aj so zoznamom materiálu zo sprievodcu výberom).
 *
 * Prijme formulár, overí polia a pošle dopyt e-mailom cez SMTP schránky na hostingu Websupport na adresu
 * firmy. Odpovedať sa dá priamo z e-mailu, adresa zákazníka je v poli Odpovedať (Reply-To).
 *
 * Prihlasovacie údaje do schránky nie sú v repozitári. Skript ich číta zo súboru konfig/dopyt.php, ktorý
 * leží na hostingu vedľa priečinka web, teda mimo dosahu prehliadača. Vzor je web/nasadenie/
 * dopyt.konfig.vzor.php, na server ho nahrá `npm run nasadit` (docs/NASADENIE.md).
 *
 * Odpoveď: skriptu stránky (Accept: application/json) JSON { ok, chyba?, polia? }; bez JavaScriptu
 * presmerovanie späť na formulár s kotvou #dopyt-odoslany alebo #dopyt-chyba.
 * Proti robotom: skryté pole, pôvod stránky a limit odoslaní z jednej adresy aj celkovo za deň.
 */

declare(strict_types=1);

/** Kam sa vráti prehliadač bez JavaScriptu (pevne, nie z formulára, aby sa nedalo presmerovať inam). */
const STRANKY = ['sk' => '/pre-firmy/', 'cs' => '/cs/pro-firmy/'];
/** Odkiaľ smie formulár prísť (hlavička Origin). Ďalšie, napríklad na skúšku, v konfigurácii 'povolene_povody'. */
const POVODY = ['https://microflex.sk', 'https://www.microflex.sk'];
/** Polia v poradí, v akom idú do e-mailu, s najväčšou dĺžkou v znakoch (rovnaké maxlength má formulár). */
const POLIA = [
    'meno' => ['Meno a priezvisko', 120],
    'firma' => ['Firma', 160],
    'email' => ['E-mail', 200],
    'telefon' => ['Telefón', 40],
    'miesto' => ['Miesto stavby', 160],
    'termin' => ['Termín', 80],
    'medium' => ['Čo potrubím povedú', 80],
    'potrubie' => ['Potrubie a dĺžky', 400],
    'poznamka' => ['Poznámka', 8000],
];
/** Limity odoslaní: z jednej adresy za 10 minút a za deň, zo všetkých adries za deň (schránka má 300 za hodinu). */
const LIMIT_10_MIN = 5;
const LIMIT_DEN = 20;
const LIMIT_VSETKY_DEN = 200;

date_default_timezone_set('Europe/Bratislava');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$chceJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
$jazyk = (($_POST['jazyk'] ?? '') === 'cs') ? 'cs' : 'sk';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    header('Content-Type: text/plain; charset=utf-8');
    echo "Dopyt sa odosiela z formulára na stránke Pre firmy.\n";
    exit;
}

$konfig = nacitajKonfig();
if ($konfig === null) {
    zapisChybu(null, 'chýba konfigurácia konfig/dopyt.php');
    koniec($chceJson, $jazyk, 500, ['ok' => false, 'chyba' => 'konfig']);
}

$povod = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($povod !== '' && !in_array($povod, array_merge(POVODY, $konfig['povolene_povody'] ?? []), true)) {
    koniec($chceJson, $jazyk, 403, ['ok' => false, 'chyba' => 'povod']);
}

// Skryté pole vyplní len robot: tváriť sa, že prešlo, a nič neposlať.
if (trim((string) ($_POST['web'] ?? '')) !== '') {
    koniec($chceJson, $jazyk, 200, ['ok' => true]);
}

[$hodnoty, $zle] = overPolia($_POST);
if ($zle) {
    koniec($chceJson, $jazyk, 422, ['ok' => false, 'chyba' => 'polia', 'polia' => $zle]);
}

if (prekrocenyLimit($konfig)) {
    koniec($chceJson, $jazyk, 429, ['ok' => false, 'chyba' => 'limit']);
}

try {
    posliDopyt($konfig, $hodnoty, $jazyk);
} catch (Throwable $e) {
    zapisChybu($konfig, $e->getMessage());
    koniec($chceJson, $jazyk, 502, ['ok' => false, 'chyba' => 'odoslanie']);
}
koniec($chceJson, $jazyk, 200, ['ok' => true]);


/** Ukončí požiadavku: JSON pre skript stránky, inak presmerovanie späť na formulár s kotvou. */
function koniec(bool $chceJson, string $jazyk, int $kod, array $data): never
{
    if ($chceJson) {
        http_response_code($kod);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        header('Location: ' . STRANKY[$jazyk] . (empty($data['ok']) ? '#dopyt-chyba' : '#dopyt-odoslany'), true, 303);
    }
    exit;
}

/**
 * Konfigurácia mimo webu (konfig/dopyt.php vedľa priečinka web). Záložne api/konfig/dopyt.php, ak hosting
 * nedovolí priečinok mimo web; ten chráni .htaccess „Require all denied“, ktorý tam dá skript nasadenia.
 */
function nacitajKonfig(): ?array
{
    foreach ([dirname(__DIR__, 2) . '/konfig/dopyt.php', __DIR__ . '/konfig/dopyt.php'] as $cesta) {
        if (@is_file($cesta)) {
            $k = require $cesta;
            if (is_array($k)) {
                $k['_priecinok'] = dirname($cesta);
                return $k;
            }
        }
    }
    return null;
}

/** Vyčistí a overí polia. Vráti [hodnoty, zoznam zlých polí]. */
function overPolia(array $vstup): array
{
    $hodnoty = [];
    $zle = [];
    foreach (POLIA as $pole => [, $max]) {
        $v = $vstup[$pole] ?? '';
        $v = is_string($v) ? $v : '';
        if (!preg_match('//u', $v)) {
            $v = ''; // neplatné UTF-8
        }
        $v = str_replace(["\r\n", "\r"], "\n", $v);
        $v = preg_replace('/[\x{00}-\x{08}\x{0B}-\x{1F}\x{7F}-\x{9F}]/u', '', $v) ?? '';
        $v = $pole === 'poznamka' ? trim($v) : trim(preg_replace('/\s+/u', ' ', $v) ?? '');
        if (preg_match_all('/./us', $v) > $max) {
            $zle[] = $pole;
        }
        $hodnoty[$pole] = $v;
    }
    if (preg_match_all('/./us', $hodnoty['meno']) < 2) {
        $zle[] = 'meno';
    }
    if (!filter_var($hodnoty['email'], FILTER_VALIDATE_EMAIL)) {
        $zle[] = 'email';
    }
    return [$hodnoty, array_values(array_unique($zle))];
}

/** Adresa návštevníka. Za proxy servera (súkromná adresa) berie tú, ktorú doplnil nginx. */
function klientIp(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $verejna = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    if ($verejna === false) {
        $preposlana = (string) ($_SERVER['HTTP_X_REAL_IP'] ?? '');
        if ($preposlana === '') {
            $retaz = explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
            $preposlana = trim((string) end($retaz));
        }
        if (filter_var($preposlana, FILTER_VALIDATE_IP)) {
            return $preposlana;
        }
    }
    return $ip;
}

/** Priečinok na stav (limity, chyby): vedľa konfigurácie, inak dočasný priečinok servera. */
function priecinokStavu(?array $k): ?string
{
    $kandidati = [];
    if ($k !== null) {
        $kandidati[] = $k['_priecinok'] . '/dopyt-stav';
    }
    $kandidati[] = sys_get_temp_dir() . '/microflex-dopyt';
    foreach ($kandidati as $p) {
        if ((@is_dir($p) || @mkdir($p, 0700, true)) && @is_writable($p)) {
            return $p;
        }
    }
    return null;
}

/** Zaznamená odoslanie a povie, či adresa alebo celý web neprekročili limit. Bez úložiska limit neplatí. */
function prekrocenyLimit(array $k): bool
{
    $priecinok = priecinokStavu($k);
    $subor = $priecinok === null ? false : @fopen($priecinok . '/limity.json', 'c+');
    if ($subor === false) {
        return false;
    }
    flock($subor, LOCK_EX);
    $data = json_decode(stream_get_contents($subor) ?: '{}', true);
    $data = is_array($data) ? $data : [];
    $teraz = time();
    foreach ($data as $kluc => $casy) {
        $data[$kluc] = array_values(array_filter((array) $casy, fn($t) => is_int($t) && $t > $teraz - 86400));
        if (!$data[$kluc]) {
            unset($data[$kluc]);
        }
    }
    // Adresa sa neukladá, len jej odtlačok so soľou z konfigurácie.
    $kluc = hash('sha256', klientIp() . '|' . ($k['sol'] ?? 'microflex'));
    $moje = $data[$kluc] ?? [];
    $za10Minut = count(array_filter($moje, fn($t) => $t > $teraz - 600));
    $vsetky = array_sum(array_map('count', $data));
    $prekroceny = $za10Minut >= LIMIT_10_MIN || count($moje) >= LIMIT_DEN || $vsetky >= LIMIT_VSETKY_DEN;
    if (!$prekroceny) {
        $moje[] = $teraz;
        $data[$kluc] = $moje;
        ftruncate($subor, 0);
        rewind($subor);
        fwrite($subor, json_encode($data));
        fflush($subor);
    }
    flock($subor, LOCK_UN);
    fclose($subor);
    return $prekroceny;
}

function zapisChybu(?array $k, string $sprava): void
{
    error_log('microflex.sk dopyt: ' . $sprava);
    $priecinok = priecinokStavu($k);
    if ($priecinok !== null) {
        $riadok = date('Y-m-d H:i:s') . ' ' . $sprava . "\n";
        // Niektoré súborové systémy zámok nepodporujú; krátky riadok na koniec súboru sa zapíše aj bez neho.
        if (@file_put_contents($priecinok . '/chyby.log', $riadok, FILE_APPEND | LOCK_EX) === false) {
            @file_put_contents($priecinok . '/chyby.log', $riadok, FILE_APPEND);
        }
    }
}

/** Zloží e-mail s dopytom a pošle ho podľa konfigurácie (SMTP, záložne funkcia mail()). */
function posliDopyt(array $k, array $h, string $jazyk): void
{
    $od = (string) ($k['od'] ?? '');
    $komu = array_values(array_filter((array) ($k['komu'] ?? []), fn($a) => is_string($a) && filter_var($a, FILTER_VALIDATE_EMAIL)));
    if (!filter_var($od, FILTER_VALIDATE_EMAIL) || !$komu) {
        throw new RuntimeException('v konfigurácii chýba platná adresa od alebo komu');
    }
    $domena = substr((string) strrchr($od, '@'), 1);

    $riadky = ['Dopyt z formulára na microflex.sk', ''];
    foreach (POLIA as $pole => [$nazov]) {
        if ($pole === 'poznamka' || $h[$pole] === '') {
            continue;
        }
        $riadky[] = $nazov . ': ' . $h[$pole];
    }
    if ($h['poznamka'] !== '') {
        array_push($riadky, '', POLIA['poznamka'][0] . ':', $h['poznamka']);
    }
    $stranka = 'https://microflex.sk' . STRANKY[$jazyk];
    array_push(
        $riadky,
        '',
        '-- ',
        'Odoslané ' . date('j. n. Y \o G:i') . ' zo stránky ' . $stranka . ($jazyk === 'cs' ? ' (česká verzia).' : '.'),
        'Odpoveď na tento e-mail pôjde priamo zákazníkovi.'
    );
    $telo = implode("\r\n", $riadky) . "\r\n";

    $predmet = 'Dopyt Microflex' . ($jazyk === 'cs' ? ' (CZ)' : '') . ' – ' . ($h['firma'] !== '' ? $h['firma'] : $h['meno']);
    $hlavicky = [
        'Date: ' . date('r'),
        'From: ' . adresa((string) ($k['od_meno'] ?? 'Web Microflex Slovensko'), $od),
        'Reply-To: ' . adresa($h['meno'], $h['email']),
        'Message-ID: <' . bin2hex(random_bytes(12)) . '.' . time() . '@' . $domena . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    $teloB64 = rtrim(chunk_split(base64_encode($telo), 76, "\r\n"));

    if (($k['sposob'] ?? 'smtp') === 'mail') {
        if (!mail(implode(', ', $komu), hlavickaUtf8($predmet), $teloB64, implode("\r\n", $hlavicky), '-f' . $od)) {
            throw new RuntimeException('funkcia mail() správu neprijala');
        }
        return;
    }
    $sprava = implode("\r\n", array_merge($hlavicky, ['To: ' . implode(', ', $komu), 'Subject: ' . hlavickaUtf8($predmet)]))
        . "\r\n\r\n" . $teloB64;
    posliSmtp($k, $od, $komu, $domena, $sprava);
}

/** Meno a adresa do hlavičky From/Reply-To; meno mimo ASCII v kódovaní RFC 2047. */
function adresa(string $meno, string $email): string
{
    $meno = trim(preg_replace('/["\\\\<>\r\n]+/', ' ', $meno) ?? '');
    if ($meno === '') {
        return '<' . $email . '>';
    }
    return (preg_match('/^[\x20-\x7E]*$/', $meno) ? '"' . $meno . '"' : hlavickaUtf8($meno)) . ' <' . $email . '>';
}

/** Text hlavičky v UTF-8 ako zakódované slová (RFC 2047), rozdelené tak, aby sa nerozdelil znak. */
function hlavickaUtf8(string $text): string
{
    $kusy = [];
    $kus = '';
    foreach (preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $znak) {
        if (strlen($kus . $znak) > 39) {
            $kusy[] = $kus;
            $kus = '';
        }
        $kus .= $znak;
    }
    if ($kus !== '') {
        $kusy[] = $kus;
    }
    return implode("\r\n ", array_map(fn($x) => '=?UTF-8?B?' . base64_encode($x) . '?=', $kusy));
}

/** Pošle hotovú správu cez SMTP s prihlásením (Websupport: smtp.m1.websupport.sk, port 465, SSL). */
function posliSmtp(array $k, string $od, array $komu, string $domena, string $sprava): void
{
    $server = (string) ($k['smtp_server'] ?? 'smtp.m1.websupport.sk');
    $port = (int) ($k['smtp_port'] ?? 465);
    $ssl = ($k['smtp_sifrovanie'] ?? 'ssl') === 'ssl';
    $kontext = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => $server,
        'SNI_enabled' => true,
    ]]);
    // Časy pod limitom behu PHP (30 s), aby skript stihol odpovedať chybou a stránka ponúkla e-mail.
    $spojenie = @stream_socket_client(($ssl ? 'ssl://' : 'tcp://') . $server . ':' . $port, $cislo, $text, 10, STREAM_CLIENT_CONNECT, $kontext);
    if ($spojenie === false) {
        throw new RuntimeException("SMTP $server:$port sa nepodarilo pripojiť: $text ($cislo)");
    }
    stream_set_timeout($spojenie, 15);

    $cakaj = function (int ...$kody) use ($spojenie): string {
        $odpoved = '';
        while (true) {
            $riadok = fgets($spojenie, 2048);
            if ($riadok === false) {
                $meta = stream_get_meta_data($spojenie);
                throw new RuntimeException('SMTP ' . ($meta['timed_out'] ? 'neodpovedal včas' : 'ukončil spojenie'));
            }
            $odpoved .= $riadok;
            if (strlen($riadok) < 4 || $riadok[3] !== '-') {
                break;
            }
        }
        if (!in_array((int) substr($odpoved, 0, 3), $kody, true)) {
            throw new RuntimeException('SMTP odpovedal: ' . trim(preg_replace('/\s+/', ' ', $odpoved) ?? ''));
        }
        return $odpoved;
    };
    $zapis = function (string $data) use ($spojenie): void {
        while ($data !== '') {
            $zapisane = fwrite($spojenie, $data);
            if ($zapisane === false || $zapisane === 0) {
                throw new RuntimeException('SMTP zápis zlyhal');
            }
            $data = substr($data, $zapisane);
        }
    };
    $prikaz = function (string $riadok, int ...$kody) use ($zapis, $cakaj): string {
        $zapis($riadok . "\r\n");
        return $cakaj(...$kody);
    };

    try {
        $cakaj(220);
        $ehlo = $prikaz('EHLO ' . $domena, 250);
        $meno = (string) ($k['smtp_meno'] ?? '');
        if ($meno !== '') {
            $heslo = (string) ($k['smtp_heslo'] ?? '');
            if (preg_match('/^250[ -]AUTH\b(.*)$/mi', $ehlo, $m) && preg_match('/\bPLAIN\b/i', $m[1])) {
                $prikaz('AUTH PLAIN ' . base64_encode("\0" . $meno . "\0" . $heslo), 235);
            } else {
                $prikaz('AUTH LOGIN', 334);
                $prikaz(base64_encode($meno), 334);
                $prikaz(base64_encode($heslo), 235);
            }
        }
        $prikaz('MAIL FROM:<' . $od . '>', 250);
        foreach ($komu as $adresat) {
            $prikaz('RCPT TO:<' . $adresat . '>', 250, 251);
        }
        $prikaz('DATA', 354);
        // Riadok začínajúci bodkou sa zdvojí (RFC 5321, 4.5.2); telo v base64 bodku nemá, hlavičky áno môžu.
        $zapis(preg_replace('/^\./m', '..', $sprava) . "\r\n.\r\n");
        $cakaj(250);
        try {
            $prikaz('QUIT', 221);
        } catch (Throwable) {
            // Správa je už prijatá, odpoveď na QUIT nie je dôležitá.
        }
    } finally {
        fclose($spojenie);
    }
}
