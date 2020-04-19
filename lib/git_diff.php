<?php

/**
 * Functions for handling git differences
 */

// Get handle to koolit list
function open_koolit($repo, $version) {
    $fds = [
        1 => ["pipe", "w"], // Get data via pipe
        2 => STDERR // stderr passthrough
    ];

    $safe_version = escapeshellarg($version);
    $proc = proc_open("git cat-file -p $safe_version:oh-callsigns.tsv | sort", $fds, $pipes, $repo);
    return (object)["proc" => $proc, "pipe" => $pipes[1]];
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
function compare_active($repo, $old_version, $new_version) {
    $out = [
        "added" => [],
        "removed" => [],
    ];

    // Open handles
    $old = open_koolit($repo, $old_version);
    $new = open_koolit($repo, $new_version);

    // Start finding diffences
    $old_line = get_next_active($old->pipe);
    $new_line = get_next_active($new->pipe);

    while (true) {
        // End condition: Both at EOF
        if ($old_line === FALSE && $new_line == FALSE) break;

        // Edge cases: EOFs, otherwise compare strings
        if ($old_line === FALSE) $diff = 1;
        elseif ($new_line === FALSE) $diff = -1;
        else $diff = strcmp($old_line, $new_line);

        if ($diff == 0) {
            // Both the same.
            $old_line = get_next_active($old->pipe);
            $new_line = get_next_active($new->pipe);
        } elseif ($diff < 0) {
            // Call sign removed
            $out['removed'][] =  $old_line;
            $old_line = get_next_active($old->pipe);
        } else {
            // Call sign added
            $out['added'][] = $new_line;
            $new_line = get_next_active($new->pipe);
        }
    }

    pclose($old->pipe);
    pclose($new->pipe);
    proc_close($old->proc);
    proc_close($new->proc);

    return (object)$out;
}
