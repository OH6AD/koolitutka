# Koolitutka
Services based on changes to Finnish radio amateur callsign database.

## Ham callsign to Matrix room reporter

Used for getting ham radio callsigns to an IRC channel, by default
#oh6ad on IRCNet. See [source](koolitutka) for details.

Usage:

1. Clone git repository https://github.com/OH6AD/koolit/ to somewhere
2. Copy `config.example.sh` to `config.sh`
3. Edit `config.sh` and set repository path and Matrix credentials correctly
4. Run `koolitutka` periodically from systemd timer or crontab

The callsign repository is updated once a day at 06:04 EEST.
