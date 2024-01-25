# Koolitutka
Services based on changes to Finnish radio amateur callsign database.

Uses OH6AD's repository of call sign dumps, having data since
April 2016.  The callsign repository is updated once a day at 06:04 on
Europe/Helsinki.

## Ham radio callsign database

Tool which populates SQLite database when run with all the
history. Handles all oddities in Ficora and Traficom data and produces
a consistent view to the data.

Requirements:

- `git php-cli php-sqlite3`
- `sqlite3` if you want to use the command-line interface, too.

Usage:

1. Clone git repository https://github.com/OH6AD/koolit/ to
   somewhere. You may use `--bare` to save some space.
2. Copy `config.example.ini` to `config.ini`
3. Edit `config.ini` and set repository path correctly. Set database
   path to preferrably an absolute path. You can ignore all Matrix
   related stuff.
4. Run the tool `update_database` periodically in a systemd timer (at
   07 in the morning is fine), cron or similar. Database file is
   created if not existing.

Enjoy the database. Check [database schema](lib/schema.sql). An
example query:

```
$ sqlite3 db.sqlite 
SQLite version 3.31.1 2020-01-27 19:55:54
Enter ".help" for usage hints.
sqlite> .mode line
sqlite> select * from event where callsign='OH64K'; 
 callsign = OH64K
   status = VARAUS
from_date = 2018-03-28
  to_date = 2018-04-16

 callsign = OH64K
   status = VOIMASSA
from_date = 2018-04-16
  to_date = 2021-01-01
sqlite>
```

## Callsign difference tool

May be used to send daily Matrix notifications, speak out new
callsigns as a bulletin on a repeater. Or just for fun.

Requirements:

- `git php festival festvox-suopuhe-mv opus-tools php-curl php-xml` (for audio bulletin use)
- `git php php-curl php-xml` (Matrix notifications)

Usage:

1. Clone git repository https://github.com/OH6AD/koolit/ to somewhere. You may use `--bare` to save some space.
2. Copy `config.example.ini` to `config.ini`
3. Edit `config.ini` and set repository path correctly
4. Expose `public/` directory on your HTTP server

It can be also run via command-line and play the audio locally:

```sh
php public/koolipuhe.php opus 2020-04-10 | vlc fd://0 vlc://quit
```

Or just as text:

```sh
php public/koolipuhe.php text 2020-04-10
```

Or send Matrix message;

```sh
php public/koolipuhe.php matrix
```
