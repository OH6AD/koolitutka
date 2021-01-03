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

$out = [
    'updated' => $db->querySingle("select authored from updates order by rowid desc limit 1"),
    'callsigns' => $db->querySingle("select count(distinct callsign) from event"),
    'active' => $db->querySingle("select count(distinct callsign) from event where to_date='NOW' and status='VOIMASSA'"),
];

header('Content-Type: application/json; charset=UTF-8');
print(json_encode($out)."\n");
