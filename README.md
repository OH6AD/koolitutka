# Koolitutka
Services based on changes to Finnish radio amateur callsign database.

## Ham callsign to Matrix room

Used for getting ham radio callsigns to an IRC channel, by default
#oh6ad on IRCNet. See [source](koolitutka) for details.

NB! This is no longer maintained because the speech callsign diffence
tool below can do the same thing with *matrix* parameter.

Requirements:

- `git jq curl`
- [Matrix](https://matrix.org/) account

Usage:

1. Clone git repository https://github.com/OH6AD/koolit/ to somewhere
2. Copy `config.example.sh` to `config.sh`
3. Edit `config.sh` and set repository path and Matrix credentials correctly
4. Run `koolitutka` periodically from systemd timer or crontab

The callsign repository is updated once a day at 06:04 on Europe/Helsinki.

## Callsign difference tool

May be used to speak out new callsigns as a bulletin on a repeater. Or
just for fun.

Requirements:

- `git php festival festvox-suopuhe-mv opus-tools php-curl php-xml`

Usage:

1. Clone git repository https://github.com/OH6AD/koolit/ to somewhere. You may use `--bare` to save some space.
2. Copy `config.example.ini` to `config.in`
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
