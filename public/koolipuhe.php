<?php

require_once(__DIR__.'/../lib/git_diff.php');
require_once(__DIR__.'/../lib/matrix.php');

// Make it work if STDERR is not available
if (!defined('STDERR')) {
    define('STDERR', fopen('/dev/null', 'w'));
}

$config = parse_ini_file(__DIR__.'/../config.ini', TRUE);
if ($config === FALSE) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    print("No configuration file found\n");
    exit(1);
}
$config = (object)$config;
$config->matrix = (object)$config->matrix;
$config->git = (object)$config->git;

// Get current time before manipulating time zones. Format to a greeting.
$hour = idate('H');
if ($hour < 5) $greet = 'Öri öri.';
elseif ($hour < 10) $greet = 'Hyvää huomenta!';
elseif ($hour < 18) $greet = 'Hyvää päivää!';
elseif ($hour < 22) $greet = 'Hyvää iltaa!';
else $greet = 'Hyvää myöhäisiltaa!';

// Make sure string comparisons are stable
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
    global $config;
    $calls = $spell ? array_map("spell_call", $list) : $list;

    // DoS detection
    if (count($calls) > $config->doslimit) {
        $calls = array_slice($calls, 0, $config->doslimit);
        array_push($calls, "niin edelleen, ei mulle makseta tästä. Tule itse tänne luettelemaan, apina");
    }

    switch (count($calls)) {
    case 0: return $intro[0];
    case 1: return $intro[1] . $calls[0];
    default:
        if (count($calls) < 2) return $calls;
        $last = array_pop($calls);
        return $intro[2] . implode(", ", $calls) . " ja " . $last;
    }
}

// Update git
if ($config->git->fetch) git_raw('git fetch', $config->git->repo);

// Date to commit hash
$since = $_GET['since'] ?? $argv[2] ?? $config->since_default;
$old_commit = date_to_commit($config->git->repo, $config->git->branch, $since);
if ($old_commit === "") {
    http_response_code(400);
    header('Content-Type: text/plain; charset=UTF-8');
    print("We don't have that old data. Please give a newer date.\n");
    exit(1);
}

// Compare changes to a file between given commits
$changes = compare_active($config->git->repo, $old_commit, $config->git->branch);

// Some Finnish constants, TODO to config file?
$quiet_intro = ['', '', ''];
$new_intro = ["Ei uusia asemalupia", "Traficom on myöntänyt yhden uuden asemaluvan: ", "Traficom on myöntänyt seuraavat uudet asemaluvat: "];
$old_intro = ["Ei poistuneita kutsuja", "Yksi kutsu poistui: ", "Seuraavat kutsut poistuivat: "];

// Select output format based on GET parameters or positional parameter.
$format = $_GET['format'] ?? $argv[1] ?? 'text';

// Default states for formatting
$html = FALSE;
$spelling = FALSE;

// Default states for rendering
$synthcmd = FALSE;
$matrix = FALSE;

switch ($format) {
case 'text':
    $content = 'text/plain; charset=UTF-8';
    break;
case 'spell':
    $content = 'text/plain; charset=UTF-8';
    $spelling = TRUE;
    break;
case 'wav':
    $content = 'audio/x-wav';
    $spelling = TRUE;
    $synthcmd = "text2wave -f 16000 -eval '(hy_fi_mv_diphone)' <%1\$s";
    break;
case 'opus':
    $content = 'audio/ogg; codecs=opus';
    $spelling = TRUE;
    $synthcmd = "text2wave -eval '(hy_fi_mv_diphone)' <%1\$s | opusenc --bitrate 40 - -";
    break;
case 'html':
    $content = 'text/html; charset=UTF-8';
    $html = TRUE;
    break;
case 'matrix':
    $html = TRUE;
    $matrix = TRUE;
    break;
default:
    header('Content-Type: text/plain; charset=UTF-8');
    http_response_code(400);
    print("Invalid format requested\n");
    exit(1);
}

// Message formatting
if ($html) {
    $dom = new DOMDocument('1.0', 'UTF-8');
    if (count($changes->added) + count($changes->removed)) {
        $s = $greet.' Traficomissa tapahtuu:';
        $msg = "$s ";
        $dom->appendChild($dom->createTextNode('📻 '.$s));
        if (count($changes->added)) {
            $br = $dom->createElement("br");
            $dom->appendChild($br);
            $s = call_list($changes->added, $quiet_intro, $spelling);
            $dom->appendChild($dom->createTextNode("➕ $s"));
            $msg .= "(+) $s ";
        }
        if (count($changes->removed)) {
            $br = $dom->createElement("br");
            $dom->appendChild($br);
            $s = call_list($changes->removed, $quiet_intro, $spelling);
            $dom->appendChild($dom->createTextNode("➖ $s"));
            $msg .= "(-) $s";
        }
    } else {
        $s = $greet." Ei muutoksia voimassa olevissa radioamatöörikutsuissa.";
        $dom->appendChild($dom->createTextNode('📻 '.$s));
        $msg = $s;
    }
} else {
    $msg = $greet . ' ';
    if (count($changes->added) + count($changes->removed)) {
        $msg .= call_list($changes->added, $new_intro, $spelling) . ". " . call_list($changes->removed, $old_intro, $spelling) . ". ";
    } else {
        $msg .= "Ei muutoksia voimassa olevissa radioamatöörikutsuissa.";
    }
}

// Final output rendering
if ($matrix) {
    if (php_sapi_name() !== 'cli') {
        header('Content-Type: text/plain; charset=UTF-8');
        http_response_code(400);
        print("This mode is allowed only on command-line\n");
        exit(1);
    }
    $matrix = new Matrix($config->matrix->homeserver, $config->matrix->token);
    $matrix->notice($config->matrix->room, $msg, $dom);
} else {
    // HTTP output
    header("Content-Type: $content");

    if ($synthcmd) {
        // Synthesize speech

        // This ugly hack is because php-fpm doesn't support writing
        // directly to stdout handle.
        $tmp = tmpfile();
        fwrite($tmp, iconv("UTF-8", "ISO 8859-1", $msg));
        $safe_tmp = escapeshellarg(stream_get_meta_data($tmp)['uri']);
        passthru(sprintf($synthcmd, $safe_tmp));
        fclose($tmp);
    } else {
        if ($html) {
            // Produce textual output for debugging purposes
            $el = $dom->createComment($msg);
            $dom->appendChild($el);
            print($msg = $dom->saveHTML());
        } else {
            // Output as plain text
            print($msg."\n");
        }
    }
}
