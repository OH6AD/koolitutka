-- -*- mode: sql; sql-product: sqlite; -*-
BEGIN;

CREATE TABLE event (
	callsign TEXT NOT NULL,  -- Callsign, e.g. OH6DDR
	neighbour TEXT NOT NULL, -- For finding the neighbours
	status TEXT NOT NULL,    -- VARAUS / VOIMASSA / KARENSSI
	from_date TEXT,          -- Start date of this status or NULL if before genesis
	to_date TEXT NOT NULL    -- End date of this status. 'NOW' when current.
);

-- Used by the engine itself
CREATE INDEX ix_status_callsign ON event(status, callsign, to_date);
CREATE INDEX ix_current ON event(to_date, status);

-- Useful indices for common operations
CREATE INDEX ix_callsign_date ON event(callsign, to_date);
CREATE INDEX ix_neighbour ON event(neighbour, to_date);

CREATE TABLE updates (
	hash TEXT NOT NULL,    -- Commit hash of the operation
	authored TEXT NOT NULL -- Date of the data
);

END;
