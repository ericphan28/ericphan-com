-- ============================================================================
-- 📊 Dashboard Schema — Multi-platform freelancing management
-- Convention: ALL tables for freelancer-com project use `freelancer_` prefix
-- Run this in Supabase SQL Editor (safe — uses IF NOT EXISTS)
-- ============================================================================

-- Platforms table (freelancer.com, upwork, fiverr, etc.)
CREATE TABLE IF NOT EXISTS freelancer_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,           -- 'freelancer', 'upwork', 'fiverr'
  display_name TEXT NOT NULL,          -- 'Freelancer.com'
  base_url TEXT NOT NULL,              -- 'https://www.freelancer.com'
  auth_data JSONB DEFAULT NULL,        -- encrypted credentials/tokens
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bids / Proposals
CREATE TABLE IF NOT EXISTS freelancer_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES freelancer_platforms(id) ON DELETE CASCADE,
  platform_bid_id TEXT NOT NULL,       -- original ID from platform
  project_id TEXT NOT NULL,
  project_title TEXT NOT NULL,
  project_url TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  period_days INTEGER NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',        -- active, awarded, rejected, retracted, expired
  project_status TEXT DEFAULT 'active', -- active, closed, frozen, unknown
  bid_count INTEGER DEFAULT 0,         -- competitor bids
  budget_min NUMERIC(12,2) DEFAULT 0,
  budget_max NUMERIC(12,2) DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  client_name TEXT,
  client_country TEXT,
  submitted_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform_id, platform_bid_id)  -- no duplicate bids per platform
);

-- Message threads
CREATE TABLE IF NOT EXISTS freelancer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES freelancer_platforms(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  project_id TEXT,
  project_title TEXT,
  client_username TEXT NOT NULL,
  client_name TEXT,
  last_message TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform_id, thread_id)
);

-- Sync history log
CREATE TABLE IF NOT EXISTS freelancer_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES freelancer_platforms(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,            -- 'bids', 'messages', 'full'
  status TEXT DEFAULT 'running',      -- running, success, error
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_fl_bids_platform ON freelancer_bids(platform_id);
CREATE INDEX IF NOT EXISTS idx_fl_bids_status ON freelancer_bids(status);
CREATE INDEX IF NOT EXISTS idx_fl_bids_project_status ON freelancer_bids(project_status);
CREATE INDEX IF NOT EXISTS idx_fl_bids_submitted ON freelancer_bids(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_fl_messages_platform ON freelancer_messages(platform_id);
CREATE INDEX IF NOT EXISTS idx_fl_messages_read ON freelancer_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_fl_sync_logs_platform ON freelancer_sync_logs(platform_id);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION freelancer_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER freelancer_bids_updated_at
  BEFORE UPDATE ON freelancer_bids FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();

CREATE OR REPLACE TRIGGER freelancer_messages_updated_at
  BEFORE UPDATE ON freelancer_messages FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();

CREATE OR REPLACE TRIGGER freelancer_platforms_updated_at
  BEFORE UPDATE ON freelancer_platforms FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();

-- RLS policies (dashboard is private — only service role can write)
ALTER TABLE freelancer_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_sync_logs ENABLE ROW LEVEL SECURITY;

-- Read-only for anon (dashboard reads)
CREATE POLICY "fl_anon_read_platforms" ON freelancer_platforms FOR SELECT USING (true);
CREATE POLICY "fl_anon_read_bids" ON freelancer_bids FOR SELECT USING (true);
CREATE POLICY "fl_anon_read_messages" ON freelancer_messages FOR SELECT USING (true);
CREATE POLICY "fl_anon_read_sync_logs" ON freelancer_sync_logs FOR SELECT USING (true);

-- Service role can do everything (sync writes)
CREATE POLICY "fl_service_manage_platforms" ON freelancer_platforms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fl_service_manage_bids" ON freelancer_bids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fl_service_manage_messages" ON freelancer_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fl_service_manage_sync_logs" ON freelancer_sync_logs FOR ALL USING (true) WITH CHECK (true);

-- Seed: Insert Freelancer.com platform
INSERT INTO freelancer_platforms (name, display_name, base_url) 
VALUES ('freelancer', 'Freelancer.com', 'https://www.freelancer.com')
ON CONFLICT (name) DO NOTHING;

-- ─── Schema Migrations (idempotent) ──────────────────────────────────────────
-- v2: Add richer bid fields from Freelancer.com API
ALTER TABLE freelancer_bids ADD COLUMN IF NOT EXISTS project_description TEXT DEFAULT '';
ALTER TABLE freelancer_bids ADD COLUMN IF NOT EXISTS shortlisted BOOLEAN DEFAULT false;
ALTER TABLE freelancer_bids ADD COLUMN IF NOT EXISTS highlighted BOOLEAN DEFAULT false;
ALTER TABLE freelancer_bids ADD COLUMN IF NOT EXISTS bid_rank INTEGER DEFAULT 0;

-- ─── v3: Multi-platform income tracking ──────────────────────────────────────

-- Manual income entries (Fiverr orders, AI annotation hours, etc.)
CREATE TABLE IF NOT EXISTS freelancer_income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,              -- 'fiverr', 'dataannotation', 'outlier', 'upwork', etc.
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  hours_spent NUMERIC(8,2),            -- optional for hourly tracking
  earned_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fl_income_platform ON freelancer_income_entries(platform);
CREATE INDEX IF NOT EXISTS idx_fl_income_earned_at ON freelancer_income_entries(earned_at DESC);

ALTER TABLE freelancer_income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "fl_anon_read_income" ON freelancer_income_entries FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "fl_service_manage_income" ON freelancer_income_entries FOR ALL USING (true) WITH CHECK (true);

-- Fiverr gigs tracker (manual management, no API)
CREATE TABLE IF NOT EXISTS freelancer_fiverr_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'draft',         -- draft, active, paused
  price_basic NUMERIC(8,2),
  price_standard NUMERIC(8,2),
  price_premium NUMERIC(8,2),
  gig_url TEXT,
  description TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders_total INTEGER DEFAULT 0,
  orders_pending INTEGER DEFAULT 0,
  rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE freelancer_fiverr_gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "fl_anon_read_fiverr_gigs" ON freelancer_fiverr_gigs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "fl_service_manage_fiverr_gigs" ON freelancer_fiverr_gigs FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE TRIGGER freelancer_fiverr_gigs_updated_at
  BEFORE UPDATE ON freelancer_fiverr_gigs FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();
