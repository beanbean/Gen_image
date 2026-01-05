-- FULL DATABASE MIGRATION
-- Run this file on Supabase SQL Editor
-- Order: 1. Better Auth tables → 2. App tables

-- ============================================
-- PART 1: BETTER AUTH TABLES
-- ============================================

-- USER TABLE
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  image TEXT,
  team_id TEXT,
  zalo_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- SESSION TABLE
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);

-- ACCOUNT TABLE
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);

-- VERIFICATION TABLE
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

-- ============================================
-- PART 2: APPLICATION TABLES
-- ============================================

-- EXECUTION TRACKING
CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(50) NOT NULL,
  n8n_execution_id VARCHAR(100),
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error')),
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_exec_status ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_exec_triggered ON execution_logs(triggered_at DESC);

-- TEAMS
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  round VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CAPTAINS (synced with user table)
CREATE TABLE IF NOT EXISTS captains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  zalo_id VARCHAR(255),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PLAYERS
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- DAILY WEIGHTS (allow multiple entries per day)
CREATE TABLE IF NOT EXISTS daily_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 0 AND day <= 10),
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  recorded_at TIMESTAMP DEFAULT NOW(),
  recorded_by UUID REFERENCES captains(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_daily_weights_player ON daily_weights(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_weights_day ON daily_weights(day);
CREATE INDEX IF NOT EXISTS idx_daily_weights_recorded ON daily_weights(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_weights_player_day ON daily_weights(player_id, day, recorded_at DESC);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_captains_team ON captains(team_id);
CREATE INDEX IF NOT EXISTS idx_captains_username ON captains(username);

-- ============================================
-- VERIFY bot_queue EXISTS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'bot_queue'
  ) THEN
    RAISE NOTICE 'WARNING: bot_queue table does not exist. Workflows may not work correctly.';
  ELSE
    RAISE NOTICE 'SUCCESS: bot_queue table exists.';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Tables created: user, session, account, verification, teams, captains, players, daily_weights, execution_logs';
END $$;
