<?php

// Executes given database query. Terminates in case of a database
// error. When $error === NULL then errors are passed though to
// caller.
function db_execute(&$stmt, $values = [], $error = "Database error") {
    global $db;

    // Prepare statement for reuse
    $stmt->reset();
    
    // Bind values
    foreach ($values as $k=>$v) {
        // Numeric indices start from 1, increment needed
        if (!is_string($k)) $k++;
        $stmt->bindValue($k, $v);
    }

    // Execute and check result
    $ret = $stmt->execute();
    if ($error !== NULL && $ret === FALSE) err($error);
    return $ret;
}

function neighbour($callsign) {
    return substr_replace($callsign,'*',2,1);
}
