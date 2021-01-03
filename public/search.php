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

$max = 5;

$query_n = $db->prepare("SELECT COUNT(DISTINCT callsign) FROM event WHERE callsign BETWEEN :start and :end");
$query = $db->prepare("SELECT callsign,status,to_date FROM event WHERE callsign BETWEEN :start and :end ORDER BY callsign ASC, to_date DESC");

$start = $_GET['q'] ?? $argv[1] ?? '';

$range = [
    'start' => $start,
    'end'   => $start.'~',
];

$count = db_execute($query_n, $range)->fetchArray()[0];
$result = db_execute($query, $range);

$out = [
    'count' => $count,
    'results' => [],
];

$i=0;
while ($i<$max) {
    $obj = $result->fetchArray();
    if ($obj === FALSE) break; // All done
    if (array_key_exists($obj['callsign'], $out['results'])) continue; // Older history
    $out['results'][$obj['callsign']] = $obj['to_date'] === 'NOW' ? $obj['status'] : 'VAPAA';
    $i++;
}

header('Content-Type: application/json; charset=UTF-8');
print(json_encode($out)."\n");
