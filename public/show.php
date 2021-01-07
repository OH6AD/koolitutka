<?php

require_once(__DIR__.'/../lib/db.php');

// Parse config
$config = parse_ini_file(__DIR__.'/../config.ini', TRUE);
if ($config === FALSE) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    print("No configuration file found\n");
    exit(1);
}
$config = (object)$config;

chdir(__DIR__.'/..');

// Connect database
$db = new SQLite3($config->database);
$db->busyTimeout(2000);
$db->exec('PRAGMA journal_mode = wal');

$query = $db->prepare("SELECT callsign, status, from_date, to_date FROM event WHERE neighbour=? ORDER BY from_date");

$callsign = strtoupper($_GET['q'] ?? $argv[1] ?? '');
$neighbour = neighbour($callsign);

$out = [
    'now'     => null,
    'history' => [],
    'related' => [],
    'genesis' => $db->querySingle("SELECT authored FROM updates ORDER BY rowid ASC LIMIT 1"),
    'current' => $db->querySingle("SELECT authored FROM updates ORDER BY rowid DESC LIMIT 1"),
];

$result = db_execute($query, [$neighbour]);

while (($row = $result->fetchArray(SQLITE3_ASSOC)) !== FALSE) {
    // Nullify genesis and current to make it more jsonish
    if ($row['from_date'] === $out['genesis']) {
        unset($row['from_date']);
    }
    if ($row['to_date'] === 'NOW') {
        unset($row['to_date']);
    }

    if ($row['callsign'] === $callsign || $row['callsign'] === $neighbour) {
        // Related to our callsign directly
        if (array_key_exists('to_date', $row)) {
            array_push($out['history'], $row);
            $history_end = $row['to_date'];
        } else {
            $out['now'] = $row;
        }
    } else {
        if (!array_key_exists('to_date', $row)) {
            array_push($out['related'], $row);
        }
    }
}

if ($out['now'] === null) {
    $out['now'] = [
        'callsign' => $callsign,
        'status' => 'VAPAA',
    ];
    if (isset($history_end)) {
        $one_day = new DateInterval('P1D');
        $date = DateTime::createFromFormat('Y-m-d', $history_end);
        $date->add($one_day);
        $out['now']['from_date'] = $date->format('Y-m-d');
    }
}

header('Content-Type: application/json; charset=UTF-8');
print(json_encode($out)."\n");
