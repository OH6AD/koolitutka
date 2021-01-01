<?php

/**
 * Functions for handling git differences
 */

// Run a command which requires no input or output processing, e.g. git fetch.
function git_raw($cmd, $cwd) {
    $fds = [
        1 => STDERR, // pass stdout to stderr
        2 => STDERR, // stderr passthrough
    ];

    $proc = proc_open($cmd, $fds, $pipes, $cwd);
    proc_close($proc);
}

// Get the commit hash of most recent commit at the given
// time. Returns emmpty string if the time is prehistoric (before
// initial commit). If the history is non-linear, this may not return
// the commit you are looking for.
function date_to_commit($repo, $branch, $date) {
    $fds = [
        1 => ["pipe", "w"], // Get data via pipe
        2 => STDERR, // stderr passthrough
    ];

    $safe_date = escapeshellarg($date);
    $safe_branch = escapeshellarg($branch);
    $proc = proc_open("git log -1 --until=$safe_date --format=%H $safe_branch", $fds, $pipes, $repo);
    $commit = trim(fgets($pipes[1]));
    pclose($pipes[1]);
    proc_close($proc);
    return $commit;
}

// Get handle to koolit list
function open_koolit($repo, $version, $sort=false) {
    $fds = [
        1 => ["pipe", "w"], // Get data via pipe
        2 => STDERR, // stderr passthrough
    ];

    $safe_object = escapeshellarg("$version:oh-callsigns.tsv");
    $proc = proc_open("git cat-file -p $safe_object". (sort ? "|sort" : ""), $fds, $pipes, $repo);
    return (object)["proc" => $proc, "pipe" => $pipes[1]];
}

// Read next active callsign from the handle
function get_next_active($pipe) {
    while (true) {
        $line = fgets($pipe);
        if ($line === FALSE) return FALSE;

        preg_match('/^([^\t]*)\tVOIMAS.*/', $line, $matches);
        if (empty($matches)) continue;

        return trim($matches[1]);
    }
}

function close_git($obj) {
    pclose($obj->pipe);
    proc_close($obj->proc);
}

// Comparison of two versions
function compare_active($repo, $old_version, $new_version) {
    $out = [
        "added" => [],
        "removed" => [],
    ];

    // Open handles
    $old = open_koolit($repo, $old_version, TRUE);
    $new = open_koolit($repo, $new_version, TRUE);

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

    close_git($old);
    close_git($new);

    return (object)$out;
}
