<?php

putenv("GIT_DIR=../koolit/.git");
putenv("LC_ALL=C");
ini_set("auto_detect_line_endings", true);

// Get handle to koolit list
function open_koolit($version) {
    return popen("git cat-file -p '$version:oh-callsigns.tsv' | sort", "r");
}

// Read next active callsign from the handle
function get_next_active($pipe) {
    while (true) {
        $line = fgets($pipe);
        if ($line === FALSE) return FALSE;

        preg_match('/^([^\t]*)\tVOIMAS.*/', $line, $matches);
        if (empty($matches)) continue;

        return $matches[1];
    }
}

// Comparison of two versions
function compare_active($old_version, $new_version) {
    $out = [
        "added" => [],
        "removed" => [],
    ];

    // Open handles
    $old_h = open_koolit($old_version);
    $new_h = open_koolit($new_version);

    // Start finding diffences
    $old_line = get_next_active($old_h);
    $new_line = get_next_active($new_h);

    while (true) {
        // End condition: Both at EOF
        if ($old_line === FALSE && $new_line == FALSE) break;

        // Edge cases: EOFs, otherwise compare strings
        if ($old_line === FALSE) $diff = 1;
        elseif ($new_line === FALSE) $diff = -1;
        else $diff = strcmp($old_line, $new_line);

        if ($diff == 0) {
            // Both the same.
            $old_line = get_next_active($old_h);
            $new_line = get_next_active($new_h);
        } elseif ($diff < 0) {
            // Call sign removed
            $out['removed'][] =  $old_line;
            $old_line = get_next_active($old_h);
        } else {
            // Call sign added
            $out['added'][] = $new_line;
            $new_line = get_next_active($new_h);
        }
    }

    pclose($old_h);
    pclose($new_h);
    return (object)$out;
}

$out = compare_active('origin/master^^', 'origin/master');
var_dump($out);
