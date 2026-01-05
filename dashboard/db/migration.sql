-- Migration for MVP Dashboard V2 (Direct Input Approach)
-- Created: 2026-01-05
-- Updated: 2026-01-05 - Pivot to direct input (no Google Sheets)

-- ============================================
-- EXECUTION TRACKING
-- ============================================

-- Bảng tracking executions
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

-- ============================================
-- USER & TEAM MANAGEMENT
-- ============================================

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add round column if missing (migration safety for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'round'
  ) THEN
    ALTER TABLE teams ADD COLUMN round VARCHAR(50);
    RAISE NOTICE 'Added missing column: teams.round';
  END IF;
END $$;

-- Captains authentication (Better Auth will create user table)
CREATE TABLE IF NOT EXISTS captains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  zalo_id VARCHAR(255), -- Optional for sending images
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member', -- 'captain' or 'member'
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WEIGHT TRACKING
-- ============================================

-- Daily weights table (UPDATED: Allow multiple entries per day)
-- System will use LATEST entry of each day as the day's weight
CREATE TABLE IF NOT EXISTS daily_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 0 AND day <= 10),
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  recorded_at TIMESTAMP DEFAULT NOW(),
  recorded_by UUID REFERENCES captains(id),
  notes TEXT -- Optional notes from captain
  -- NO UNIQUE constraint - allow multiple entries per day
);

CREATE INDEX IF NOT EXISTS idx_daily_weights_player ON daily_weights(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_weights_day ON daily_weights(day);
CREATE INDEX IF NOT EXISTS idx_daily_weights_recorded ON daily_weights(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_weights_player_day ON daily_weights(player_id, day, recorded_at DESC);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_captains_team ON captains(team_id);
CREATE INDEX IF NOT EXISTS idx_captains_username ON captains(username);

-- ============================================
-- SEED DATA (Example)
-- ============================================

-- Insert sample team
INSERT INTO teams (id, name, round) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Đội Alpha', 'Vòng 1')
ON CONFLICT DO NOTHING;

-- Insert sample captain
INSERT INTO captains (id, username, password_hash, zalo_id, team_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'captain_alpha', '$2a$10$dummy', '0123456789', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Insert sample players
INSERT INTO players (team_id, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Nguyễn Văn A', 'captain'),
  ('00000000-0000-0000-0000-000000000001', 'Trần Thị B', 'member'),
  ('00000000-0000-0000-0000-000000000001', 'Lê Văn C', 'member')
ON CONFLICT DO NOTHING;

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
