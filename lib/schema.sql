-- -*- mode: sql; sql-product: sqlite; -*-
BEGIN;

CREATE TABLE event (
	callsign TEXT NOT NULL,  -- Callsign, e.g. OH6DDR
	status TEXT NOT NULL,    -- VARAUS / VOIMASSA / KARENSSI
	from_date TEXT NOT NULL, -- Start date of this status
	to_date TEXT NOT NULL    -- End date of this status
);

CREATE INDEX ix_callsign_date ON event(callsign, from_date);
CREATE INDEX ix_status_callsign ON event(status, callsign, to_date);
CREATE INDEX ix_anomaly ON event(to_date, status);

CREATE TABLE updates (
	hash TEXT NOT NULL,
	authored TEXT NOT NULL
);

-- Genesis commit
INSERT INTO updates VALUES ('bc9d5424fa0f3c5afb1bbcf33249ec7e09432320','');

END;
