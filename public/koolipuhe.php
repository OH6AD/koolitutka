<?php

require_once(__DIR__.'/../lib/git_diff.php');

// Make it work if STDERR is not available
if (!defined('STDERR')) {
    define('STDERR', fopen('/dev/null', 'w'));
}

$config = parse_ini_file(__DIR__.'/../config.ini');
if ($config === FALSE) {
    http_response_code(500);
    print("No configuration file found\n");
    exit(1);
}
$config = (object)$config;

// Make sure string comparison are stable
putenv("LC_ALL=C");

$prefixes = [
    "OF" => "oo äf",
    "OG" => "oo gee",
    "OH" => "oo hoo",
];

$alphabet = [
    'A' => "Aarne",
    'B' => "Bertta",
    'C' => "Celsius",
    'D' => "Daavid",
    'E' => "Eemeli",
    'F' => "Faarao",
    'G' => "Giideon",
    'H' => "Heikki",
    'I' => "Iivari",
    'J' => "Jussi",
    'K' => "Kalle",
    'L' => "Lauri",
    'M' => "Matti",
    'N' => "Niilo",
    'O' => "Otto",
    'P' => "Paavo",
    'Q' => "kuu",
    'R' => "Risto",
    'S' => "Sakari",
    'T' => "Tyyne",
    'U' => "Urho",
    'V' => "Vihtori",
    'W' => "wiski",
    'X' => "äksä",
    'Y' => "Yrjö",
    'Z' => "tseta",
    'Å' => "Åke",
    'Ä' => "äiti",
    'Ö' => "öljy",
    '/' => "kautta",
    '*' => "tähti",
    '0' => "nolla", // Avoiding extra pause before 0 by making it text
];


// If the call has quick spelling prefix, extract that
function spell_prefix($input) {
    global $prefixes;
    foreach ($prefixes as $k => $v) {
        // If matches, get that prefix
        if (strncmp($input, $k, strlen($k)) === 0) {
            return (object)[
                'prefix' => $v,
                'rest'   => substr($input, strlen($k)),
            ];
        }
    }
    // Otherwise return original
    return (object)[
        'prefix' => '',
        'rest'   => $input,
    ];
}

// Convert letters to radio alphabet
function spell_alphabet($input) {
    return array_map(function ($c) {
        global $alphabet;
        return array_key_exists($c, $alphabet) ? $alphabet[$c] : $c;
    }, str_split($input)); // FIXME use mb_str_split in php 7.4
}

// Spell using quick prefix and rest of the string as radio alphabet
function spell_call($input) {
    $p = spell_prefix($input);
    $out = spell_alphabet($p->rest);
    if ($p->prefix !== '') array_unshift($out, $p->prefix);
    return(implode($out, ' '));
}

// Spell list of calls in Finnish
function call_list($list, $intro, $spell) {
    $calls = $spell ? array_map("spell_call", $list) : $list;
    switch (count($calls)) {
    case 0: return $intro[0];
    case 1: return $intro[1] . $calls[0];
    default:
        if (count($calls) < 2) return $calls;
        $last = array_pop($calls);
        return $intro[2] . implode(", ", $calls) . " ja " . $last;
    }
}

// Git operations. Fetch and find
$since = $_GET['since'] ?? $argv[2] ?? $config->since_default;
if ($config->fetch) git_fetch($config->repo);
$old_commit = date_to_commit($config->repo, $config->branch, $since);
$changes = compare_active($config->repo, $old_commit, $config->branch);

$new_intro = ["Ei uusia asemalupia", "Traficom on myöntänyt yhden uuden asemaluvan: ", "Traficom on myöntänyt seuraavat uudet asemaluvat: "];
$old_intro = ["Ei poistuneita kutsuja", "Yksi kutsu poistui: ", "Seuraavat kutsut poistuivat: "];

// Select output format based on GET parameters or positional parameter.
$format = $_GET['format'] ?? $argv[1] ?? 'text';

$spelling = $format !== 'text';
$msg = "Hyvää huomenta! ". call_list($changes->added, $new_intro, $spelling) . ". " . call_list($changes->removed, $old_intro, $spelling) . ". ";

if ($format === 'opus') {
    // Synthesize speech
    header('Content-Type: audio/ogg; codecs=opus');

    // This ugly hack is because php-fpm doesn't support writing
    // directly to stdout handle.
    $tmp = tmpfile();
    fwrite($tmp, $msg);
    $safe_tmp = escapeshellarg(stream_get_meta_data($tmp)['uri']);
    passthru("text2wave -f 48000 -eval '(hy_fi_mv_diphone)' <$safe_tmp | opusenc --bitrate 40 - -");
    fclose($tmp);
} else {
    // Output as plain text
    header('Content-Type: text/plain; charset=UTF-8');
    print($msg."\n");
}
