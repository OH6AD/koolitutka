#!/usr/bin/env python3
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'db.sqlite'
TARGET = ROOT / 'frontend' / 'static' / 'koolitutka.sqlite'
SCHEMA_VERSION = '2'


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f'Missing source database: {SOURCE}')

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    tmp = TARGET.with_suffix('.tmp.sqlite')
    if tmp.exists():
        tmp.unlink()

    source = sqlite3.connect(f'file:{SOURCE}?mode=ro', uri=True)
    target = sqlite3.connect(tmp)
    try:
        build_database(source, target)
        target.execute('VACUUM')
    finally:
        source.close()
        target.close()

    tmp.replace(TARGET)
    print(f'Wrote {TARGET.relative_to(ROOT)}')


def build_database(source: sqlite3.Connection, target: sqlite3.Connection) -> None:
    target.executescript(
        '''
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;

        CREATE TABLE event (
            callsign TEXT NOT NULL,
            neighbour TEXT NOT NULL,
            is_wildcard INTEGER NOT NULL,
            status TEXT NOT NULL,
            from_date TEXT,
            to_date TEXT NOT NULL
        );

        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        '''
    )

    columns = [row[1] for row in source.execute('PRAGMA table_info(event)')]
    wildcard_column = 'is_wildcard' if 'is_wildcard' in columns else 'is_template'
    if wildcard_column not in columns:
        wildcard_expr = "CASE WHEN instr(callsign, '*') > 0 THEN 1 ELSE 0 END"
    else:
        wildcard_expr = wildcard_column

    rows = source.execute(
        f'''
        SELECT callsign, neighbour, {wildcard_expr}, status, from_date, to_date
          FROM event
        '''
    )
    target.executemany(
        'INSERT INTO event VALUES (?, ?, ?, ?, ?, ?)',
        rows,
    )

    genesis = source.execute('SELECT authored FROM updates ORDER BY rowid ASC LIMIT 1').fetchone()
    updated = source.execute('SELECT authored FROM updates ORDER BY rowid DESC LIMIT 1').fetchone()
    target.executemany(
        'INSERT INTO metadata VALUES (?, ?)',
        [
            ('schema_version', SCHEMA_VERSION),
            ('genesis', genesis[0] if genesis else ''),
            ('updated', updated[0] if updated else ''),
        ],
    )

    target.executescript(
        '''
        CREATE INDEX ix_event_callsign_from ON event(callsign, from_date);
        CREATE INDEX ix_event_neighbour_from ON event(neighbour, from_date);
        CREATE INDEX ix_event_changes ON event(is_wildcard, from_date, to_date);
        '''
    )
    target.commit()


if __name__ == '__main__':
    main()
