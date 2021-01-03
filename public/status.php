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
    'genesis' => $db->querySingle("SELECT authored FROM updates ORDER BY rowid ASC LIMIT 1 OFFSET 1"),
    'updated' => $db->querySingle("SELECT authored FROM updates ORDER BY rowid DESC LIMIT 1"),
    'callsigns' => $db->querySingle("SELECT COUNT(DISTINCT callsign) FROM event"),
    'active' => $db->querySingle("SELECT COUNT(DISTINCT callsign) FROM event WHERE to_date='NOW' AND status='VOIMASSA'"),
];

header('Content-Type: application/json; charset=UTF-8');
print(json_encode($out)."\n");
