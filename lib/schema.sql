-- -*- mode: sql; sql-product: sqlite; -*-
BEGIN;

CREATE TABLE event (
	callsign TEXT NOT NULL,
	status TEXT NOT NULL,
	from_date TEXT NOT NULL,
	to_date TEXT NOT NULL
);

CREATE INDEX ix_callsign_date ON event(callsign, from_date);
CREATE INDEX ix_status_callsign ON event(status, callsign, to_date);

CREATE TABLE updates (
	hash TEXT NOT NULL,
	authored TEXT NOT NULL
);

END;
