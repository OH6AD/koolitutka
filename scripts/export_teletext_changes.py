#!/usr/bin/env python3
import argparse
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

EP1_SIZE = 1008
ROW_WIDTH = 42
ROW_COUNT = 24
TABLE_OFFSET = 246
ENTRY_WIDTH = 40
ENTRY_COUNT = 16
SUBPAGE_OFFSET = 81
SHORT_DATE_OFFSET = 121

TT_RED = b'\x01'
TT_GREEN = b'\x02'
TT_YELLOW = b'\x03'
TT_BLUE = b'\x04'
TT_MAGENTA = b'\x05'
TT_CYAN = b'\x06'
TT_WHITE = b'\x07'
TT_FLASH = b'\x08'
TT_STEADY = b'\x09'
TT_NORMAL = b'\x0c'
TT_DOUBLE_HEIGHT = b'\x0d'
TT_CONCEAL = b'\x18'
TT_BLACK_BACKGROUND = b'\x1c'
TT_NEW_BACKGROUND = b'\x1d'
TT_DELETE = b'\x7f'

HELSINKI = ZoneInfo('Europe/Helsinki')

STATUS_LABELS = {
    'VOIMASSA': 'VOI',
    'VARAUS': 'VAR',
    'KARENSSI': 'KAR',
}

ISO_646_FI = str.maketrans({
    'Ä': '[',
    'Ö': '\\',
    'Å': ']',
    'ä': '{',
    'ö': '|',
    'å': '}',
})


@dataclass(frozen=True)
class Change:
    callsign: str
    status: str
    from_date: str | None
    to_date: str
    bold: str


def main() -> None:
    args = parse_args()
    changes = fetch_changes(args.database)
    content = render_ep1(changes, datetime.now(HELSINKI), args.subpage)
    write_bytes(args.output, content)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Export newest callsign changes as an EP1 teletext page.')
    parser.add_argument('database', type=Path, help='Source SQLite database')
    parser.add_argument('output', type=Path, help='Output file, or - for stdout')
    parser.add_argument('--subpage', required=True, type=parse_subpage, help='Five-character subpage indicator')
    return parser.parse_args()


def parse_subpage(value: str) -> str:
    if len(value) != 5:
        raise argparse.ArgumentTypeError('subpage must be exactly 5 characters')
    return value


def fetch_changes(database: Path) -> list[Change]:
    connection = sqlite3.connect(database)
    try:
        rows = connection.execute(
            '''
            SELECT callsign, status, from_date, to_date, bold
              FROM (
                SELECT callsign, status, from_date, to_date,
                       from_date AS change_date, 'f' AS bold
                  FROM event
                 WHERE from_date IS NOT NULL
                UNION ALL
                SELECT callsign, status, from_date, to_date,
                       to_date AS change_date, 't' AS bold
                  FROM event
                 WHERE to_date != 'NOW'
              )
             ORDER BY change_date DESC, callsign ASC
             LIMIT ?
            ''',
            (ENTRY_COUNT,),
        )
        return [Change(*row) for row in rows]
    finally:
        connection.close()


def render_ep1(changes: list[Change], now: datetime, subpage: str) -> bytes:
    page = bytearray(b' ' * EP1_SIZE)
    write_static_frame(page)
    write_at(page, SUBPAGE_OFFSET, encode_text(subpage))
    write_at(page, SHORT_DATE_OFFSET, now.strftime('%d.%m').encode('ascii'))

    table = b''.join(render_change(change) for change in changes[:ENTRY_COUNT])
    table += b' ' * (ENTRY_WIDTH * ENTRY_COUNT - len(table))
    write_at(page, TABLE_OFFSET, table)

    return bytes(page)


def write_static_frame(page: bytearray) -> None:
    write_at(page, 0, b'\xfe\x01\x18\x00\x00\x00')
    write_at(
        page,
        47,
        TT_NEW_BACKGROUND
        + TT_BLUE
        + TT_DOUBLE_HEIGHT
        + b'Koolitutka'
        + TT_NORMAL
        + b' '
        + TT_GREEN
        + TT_BLACK_BACKGROUND
        + b'+'
        + TT_DELETE * 3,
    )
    write_at(page, 80, TT_WHITE)
    write_at(page, 87, TT_NEW_BACKGROUND)
    write_at(page, 102, TT_RED + TT_BLACK_BACKGROUND + b'-' + TT_DELETE * 4)
    write_at(page, 120, TT_CYAN)
    write_at(page, 126, TT_BLUE + TT_NEW_BACKGROUND + TT_WHITE + encode_text(' Muutokset radioamatöörikutsuissa    ') + TT_MAGENTA)
    write_at(page, 168, TT_CONCEAL + TT_FLASH + encode_text('Onnea uusille radioamatööreille!') + TT_STEADY + TT_BLACK_BACKGROUND + b'  ' + TT_YELLOW + b'Kut')
    write_at(page, 210, encode_text('su     Tila Alkanut     Päättynyt   '))
    write_at(page, 886, TT_YELLOW + encode_text('Lyhenteet: VOImassa KARenssi VARaus  '))
    write_at(page, 924, b'  ' + TT_YELLOW + encode_text('Katso lisää: net.pupu.li/koolitutka/   '))
    page[-2:] = b'\x00\x00'


def render_change(change: Change) -> bytes:
    callsign_colour = callsign_control(change)
    from_control = TT_CYAN if change.bold == 'f' else TT_WHITE
    to_control = TT_CYAN if change.bold == 't' else TT_WHITE
    entry = (
        callsign_colour
        + field(change.callsign, 9)
        + TT_WHITE
        + field(status_label(change.status), 4)
        + from_control
        + field(format_from_date(change.from_date), 11)
        + to_control
        + field(format_to_date(change.to_date), 12)
    )
    if len(entry) != ENTRY_WIDTH:
        raise ValueError(f'EP1 entry is {len(entry)} bytes, expected {ENTRY_WIDTH}')
    return entry


def callsign_control(change: Change) -> bytes:
    if change.status != 'VOIMASSA':
        return TT_WHITE
    if change.bold == 'f':
        return TT_GREEN
    if change.bold == 't':
        return TT_RED
    return TT_WHITE


def field(value: str, width: int) -> bytes:
    encoded = encode_text(value)
    if len(encoded) > width:
        raise ValueError(f'field value {value!r} does not fit in {width} bytes')
    return encoded.ljust(width, b' ')


def encode_text(value: str) -> bytes:
    return value.translate(ISO_646_FI).encode('latin-1')


def format_from_date(value: str | None) -> str:
    if value is None:
        return '   <= 2016'
    return format_date(value)


def format_to_date(value: str) -> str:
    if value == 'NOW':
        return '-'
    return format_date(value)


def format_date(value: str) -> str:
    return datetime.strptime(value, '%Y-%m-%d').strftime('%d.%m.%Y')


def status_label(status: str) -> str:
    return STATUS_LABELS.get(status, status[:3])


def write_at(page: bytearray, offset: int, value: bytes) -> None:
    page[offset:offset + len(value)] = value


def write_bytes(output: Path, content: bytes) -> None:
    if str(output) == '-':
        import sys
        sys.stdout.buffer.write(content)
        return
    output.write_bytes(content)


if __name__ == '__main__':
    main()
