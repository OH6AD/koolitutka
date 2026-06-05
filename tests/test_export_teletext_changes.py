import argparse
import importlib.util
import sqlite3
import unittest
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / 'scripts' / 'export_teletext_changes.py'
FIXTURE_PATH = ROOT / 'tests' / 'fixtures' / 'teletext_changes_2026-06-05.ep1'
SPEC = importlib.util.spec_from_file_location('export_teletext_changes', MODULE_PATH)
teletext = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(teletext)


FIXTURE_CHANGES = [
    ('OH*MIM', 'KARENSSI', '2026-06-03', 'NOW'),
    ('OH2OBS', 'VOIMASSA', '2026-06-03', 'NOW'),
    ('OH6CX', 'KARENSSI', '2026-06-03', 'NOW'),
    ('OH*FFE', 'KARENSSI', '2026-06-02', 'NOW'),
    ('OH1AZE', 'VOIMASSA', None, '2026-06-02'),
    ('OH1OBO', 'VOIMASSA', '2026-06-02', 'NOW'),
    ('OH2EKI', 'VOIMASSA', '2026-06-02', 'NOW'),
    ('OH3MIM', 'VOIMASSA', None, '2026-06-02'),
    ('OH6CX', 'VOIMASSA', '2025-06-06', '2026-06-02'),
    ('OH*ABY', 'KARENSSI', '2024-06-03', '2026-06-01'),
    ('OH*BFM', 'KARENSSI', '2024-06-03', '2026-06-01'),
    ('OH*BJZ', 'KARENSSI', '2024-06-03', '2026-06-01'),
    ('OH*EAA', 'KARENSSI', '2024-06-03', '2026-06-01'),
    ('OH1J', 'KARENSSI', '2024-06-03', '2026-06-01'),
    ('OH2EKI', 'KARENSSI', '2026-05-11', '2026-06-01'),
    ('OH3OBO', 'VOIMASSA', '2026-05-28', '2026-06-01'),
]


class TeletextExportTest(unittest.TestCase):
    def test_renders_fixture_page(self):
        changes = fixture_changes()
        content = teletext.render_ep1(changes, datetime(2026, 6, 5, 12, 0, 0), '10/11')
        self.assertEqual(content, FIXTURE_PATH.read_bytes())

    def test_fetches_newest_changes_from_database(self):
        path = create_fixture_database()
        try:
            rows = teletext.fetch_changes(path)
        finally:
            path.unlink()
        self.assertEqual([row.callsign for row in rows], [row[0] for row in FIXTURE_CHANGES])
        self.assertEqual(rows[0].bold, 'f')
        self.assertEqual(rows[4].bold, 't')

    def test_ep1_size_and_offsets(self):
        content = teletext.render_ep1(fixture_changes(), datetime(2026, 6, 5), '10/11')
        self.assertEqual(len(content), teletext.EP1_SIZE)
        self.assertEqual(teletext.EP1_SIZE, teletext.ROW_COUNT * teletext.ROW_WIDTH)
        self.assertEqual(content[teletext.SUBPAGE_OFFSET:teletext.SUBPAGE_OFFSET + 5], b'10/11')
        self.assertEqual(content[teletext.SHORT_DATE_OFFSET:teletext.SHORT_DATE_OFFSET + 5], b'05.06')
        self.assertEqual(content[teletext.TABLE_OFFSET:teletext.TABLE_OFFSET + 2], b'\x07O')

    def test_formats_dates_for_teletext(self):
        self.assertEqual(teletext.format_date('2026-06-05'), '05.06.2026')
        self.assertEqual(teletext.format_from_date(None), '   <= 2016')
        self.assertEqual(teletext.format_to_date('NOW'), '-')

    def test_converts_finnish_characters_to_iso_646_fi(self):
        self.assertEqual(teletext.encode_text('Ää Öö Åå'), b'[{ \\| ]}')

    def test_entry_control_bytes(self):
        started = teletext.render_change(teletext.Change('OH1ABC', 'VOIMASSA', '2026-06-05', 'NOW', 'f'))
        ended = teletext.render_change(teletext.Change('OH1ABC', 'VOIMASSA', '2026-06-05', '2026-06-06', 't'))
        cooldown = teletext.render_change(teletext.Change('OH1ABC', 'KARENSSI', '2026-06-05', '2026-06-06', 't'))
        self.assertEqual(len(started), teletext.ENTRY_WIDTH)
        self.assertEqual(started[0], teletext.TT_GREEN[0])
        self.assertEqual(started[15], teletext.TT_CYAN[0])
        self.assertEqual(started[27], teletext.TT_WHITE[0])
        self.assertEqual(ended[0], teletext.TT_RED[0])
        self.assertEqual(ended[15], teletext.TT_WHITE[0])
        self.assertEqual(ended[27], teletext.TT_CYAN[0])
        self.assertEqual(cooldown[0], teletext.TT_WHITE[0])

    def test_subpage_length_validation_only(self):
        self.assertEqual(teletext.parse_subpage('abcde'), 'abcde')
        self.assertEqual(teletext.parse_subpage('10/11'), '10/11')
        self.assertEqual(teletext.parse_subpage('äöå12'), 'äöå12')
        with self.assertRaises(argparse.ArgumentTypeError):
            teletext.parse_subpage('1/11')
        with self.assertRaises(argparse.ArgumentTypeError):
            teletext.parse_subpage('010/11')


def fixture_changes():
    changes = []
    for callsign, status, from_date, to_date in FIXTURE_CHANGES:
        changes.append(teletext.Change(callsign, status, from_date, to_date, 'f' if to_date == 'NOW' else 't'))
    return changes


def create_fixture_database() -> Path:
    path = Path('/tmp/koolitutka-teletext-test.sqlite')
    if path.exists():
        path.unlink()
    db = sqlite3.connect(path)
    try:
        db.executescript(
            '''
            CREATE TABLE event (
                callsign TEXT,
                neighbour TEXT,
                is_wildcard INTEGER,
                status TEXT,
                from_date TEXT,
                to_date TEXT
            );
            '''
        )
        db.executemany(
            'INSERT INTO event VALUES (?, ?, 0, ?, ?, ?)',
            [(callsign, callsign.replace(callsign[2], '*', 1), status, from_date, to_date) for callsign, status, from_date, to_date in FIXTURE_CHANGES],
        )
        db.commit()
    finally:
        db.close()
    return path


if __name__ == '__main__':
    unittest.main()
