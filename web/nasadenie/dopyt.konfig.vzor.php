<?php
/**
 * Vzor nastavenia odosielania dopytu (web/public/api/dopyt.php).
 *
 * Skopírujte ako dopyt.konfig.php v tom istom priečinku (ten je v .gitignore, heslo nesmie do gitu)
 * a doplňte heslo schránky. `npm run nasadit` ho nahrá na hosting do /konfig/dopyt.php, vedľa
 * priečinka /web, teda mimo dosahu prehliadača. Postup: docs/NASADENIE.md, krok 5.
 */
return [
    // Schránka na microflex.sk, z ktorej web dopyty posiela (WebAdmin → E-maily → Vytvoriť schránku).
    // Server pre doménu ukáže WebAdmin v Emaily → Prihlasovacie údaje; Websupport má smtp.m1.websupport.sk.
    'smtp_server' => 'smtp.m1.websupport.sk',
    'smtp_port' => 465,
    'smtp_sifrovanie' => 'ssl',
    'smtp_meno' => 'web@microflex.sk',
    'smtp_heslo' => 'SEM-HESLO-SCHRANKY',

    // Odosielateľ musí byť z tej istej domény ako schránka (inak ho Websupport neodošle).
    'od' => 'web@microflex.sk',
    'od_meno' => 'Web Microflex Slovensko',

    // Kam dopyty chodia. Viac adries: ['dotazy@instalatershop.sk', 'iny@instalatershop.sk'].
    'komu' => ['dotazy@instalatershop.sk'],

    // Soľ k odtlačku adresy pri limite odoslaní: ľubovoľný dlhý text, stačí raz zmeniť z predvoleného.
    'sol' => 'ZMENTE-NA-NAHODNY-TEXT',

    // Len na skúšku z iného pôvodu (napríklad lokálny server): 'povolene_povody' => ['http://127.0.0.1:4350'],
    // Záloha, keby SMTP z hostingu nešlo: 'sposob' => 'mail' (PHP mail(); doručiteľnosť treba overiť).
];
