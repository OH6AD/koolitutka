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

$query = $db->prepare("SELECT callsign, to_date FROM event");

$out = [
    'genesis' => $db->querySingle("SELECT authored FROM updates ORDER BY rowid ASC LIMIT 1 OFFSET 1"),
    'updated' => $db->querySingle("SELECT authored FROM updates ORDER BY rowid DESC LIMIT 1"),
    'callsigns' => $db->querySingle("SELECT COUNT(DISTINCT callsign) FROM event"),
    'active' => $db->querySingle("SELECT COUNT(DISTINCT callsign) FROM event WHERE to_date='NOW' AND status='VOIMASSA'"),
];

// Collect prefixes
$prefixes = [];
$result = db_execute($query);
while (($row = $result->fetchArray()) !== FALSE) {
    $callsign = $row['callsign'];
    if ($callsign[2] === '*') {
        // Catch-all case (KARENSSI or similar) which is still active
        // is appended to list of all prefixes. Expired ones are
        // ignored.
        if ($row['to_date'] === 'NOW') {
            $prefix = substr($callsign, 0, 2);
            $suffix = substr($callsign, 3);
            $aliases = [];
            for ($i = 0; $i<10; $i++) {
                populate($prefixes, $prefix . $i . $suffix);
            }
        }
    } else {
        populate($prefixes, $callsign);
    }
}

// Combine prefixes to a string
foreach ($prefixes as $prefix => &$chars) {
    $list = array_keys($chars);
    $chars = implode($list);
}

$out['prefixes'] = $prefixes;

header('Content-Type: application/json; charset=UTF-8');
print(json_encode($out)."\n");

function populate(&$prefixes, $left) {
    $prefixes[$left][":"] = true;
    while ($left !== '') {
        $right = $left[-1];
        $left = substr($left, 0, -1); // Strip last char
        $prefixes[$left][$right] = true;
    }
}
