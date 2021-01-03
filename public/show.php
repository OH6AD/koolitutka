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

$result = db_execute($query, [$neighbour]);

$out = [
    'raw' => [],
];

while (($row = $result->fetchArray(SQLITE3_ASSOC)) !== FALSE) {
    array_push($out['raw'], $row);
}

header('Content-Type: application/json; charset=UTF-8');
print(json_encode($out)."\n");
