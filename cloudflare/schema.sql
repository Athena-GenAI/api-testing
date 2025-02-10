-- Positions table to store historical position data
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('LONG', 'SHORT')) NOT NULL,
    size DECIMAL(20, 8) NOT NULL,
    leverage DECIMAL(10, 2) NOT NULL,
    pnl DECIMAL(20, 8),
    index_token TEXT NOT NULL,
    account TEXT NOT NULL,
    protocol TEXT NOT NULL,
    is_long BOOLEAN NOT NULL,
    open_block_time TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token statistics table for caching aggregated data
CREATE TABLE IF NOT EXISTS token_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    long INTEGER NOT NULL,
    short INTEGER NOT NULL,
    total INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token, timestamp)
);

-- AI analysis results
CREATE TABLE IF NOT EXISTS analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_address TEXT NOT NULL,
    sentiment TEXT CHECK(sentiment IN ('BULLISH', 'BEARISH', 'NEUTRAL')) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    factors TEXT NOT NULL, -- JSON array of factors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_positions_account ON positions(account);
CREATE INDEX idx_positions_index_token ON positions(index_token);
CREATE INDEX idx_positions_protocol ON positions(protocol);
CREATE INDEX idx_token_stats_token ON token_stats(token);
CREATE INDEX idx_analysis_token ON analysis(token_address);
