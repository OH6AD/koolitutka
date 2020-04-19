<?php

require_once(__DIR__.'/../lib/git_diff.php');

// Make sure string comparison are stable
putenv("LC_ALL=C");

$out = compare_active('../koolit', 'origin/master^^', 'origin/master');
var_dump($out);
