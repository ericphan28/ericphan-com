-- ============================================================================
-- 📝 Portfolio CMS Schema — Admin-managed content
-- Tables: portfolio_projects, portfolio_services, portfolio_blog_posts
-- Run this in Supabase SQL Editor (safe — uses IF NOT EXISTS)
-- ============================================================================

-- ─── Projects ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '#',
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'saas',
  stats JSONB DEFAULT '[]',           -- [{label, value}]
  highlights TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Services ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,            -- 'saas', 'fullstack', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'code',
  price_usd NUMERIC(10,2),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Blog Posts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  read_time TEXT DEFAULT '5 min read',
  category TEXT NOT NULL DEFAULT 'case-study',
  tags TEXT[] DEFAULT '{}',
  cover_gradient TEXT DEFAULT 'from-blue-600 to-cyan-500',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_order ON portfolio_projects(sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_services_order ON portfolio_services(sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_blog_date ON portfolio_blog_posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_published ON portfolio_projects(is_published);
CREATE INDEX IF NOT EXISTS idx_portfolio_services_published ON portfolio_services(is_published);
CREATE INDEX IF NOT EXISTS idx_portfolio_blog_published ON portfolio_blog_posts(is_published);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published content
CREATE POLICY "portfolio_projects_public_read" ON portfolio_projects
  FOR SELECT USING (is_published = true);
CREATE POLICY "portfolio_services_public_read" ON portfolio_services
  FOR SELECT USING (is_published = true);
CREATE POLICY "portfolio_blog_public_read" ON portfolio_blog_posts
  FOR SELECT USING (is_published = true);

-- Authenticated users can do everything (admin)
CREATE POLICY "portfolio_projects_auth_all" ON portfolio_projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_services_auth_all" ON portfolio_services
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "portfolio_blog_auth_all" ON portfolio_blog_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();
CREATE OR REPLACE TRIGGER portfolio_services_updated_at
  BEFORE UPDATE ON portfolio_services FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();
CREATE OR REPLACE TRIGGER portfolio_blog_updated_at
  BEFORE UPDATE ON portfolio_blog_posts FOR EACH ROW EXECUTE FUNCTION freelancer_update_updated_at();
