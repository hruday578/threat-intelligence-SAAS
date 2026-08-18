-- =========================================================
-- AlertEm Threat Intelligence SaaS — Database Schema
-- Execute this SQL script in your Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  api_keys_encrypted JSONB DEFAULT '{}'::jsonb, -- encrypted newsapi/groq keys
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERS TABLE (Users linked to Organizations with Roles)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- 'owner' | 'admin' | 'analyst' | 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_email TEXT,
  phone TEXT,
  department TEXT,
  location TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RISK PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  locations JSONB DEFAULT '[]'::jsonb,
  vendors JSONB DEFAULT '[]'::jsonb,
  risk_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCAN HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_summary JSONB DEFAULT '{}'::jsonb,
  articles_count INT DEFAULT 0,
  alerts_count INT DEFAULT 0,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USAGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g. '2026-08'
  news_api_calls INT DEFAULT 0,
  ai_calls INT DEFAULT 0,
  scans_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, month)
);

-- 7. SAVED ALERT CONFIGURATIONS (Auto-pilot profiles)
CREATE TABLE IF NOT EXISTS public.saved_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  concepts JSONB DEFAULT '[]'::jsonb,
  countries JSONB DEFAULT '[]'::jsonb,
  states JSONB DEFAULT '[]'::jsonb,
  cities JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  duration TEXT DEFAULT '30d',
  target_zones TEXT DEFAULT '',
  radius INT DEFAULT 0,
  auto_pilot BOOLEAN DEFAULT false,
  interval_minutes INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SYSTEM LOGS TABLE
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL, -- 'AUTH', 'ANALYSIS', 'CONFIG', 'ERROR', 'INFO'
  title TEXT,
  message TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT org_id FROM public.members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS: Organizations
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Owners/Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (id IN (SELECT org_id FROM public.members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- RLS: Members
CREATE POLICY "Users can view members of their organizations"
  ON public.members FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Admins can insert/update members"
  ON public.members FOR ALL
  USING (org_id IN (SELECT org_id FROM public.members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- RLS: Employees
CREATE POLICY "Users can access employees in their organization"
  ON public.employees FOR ALL
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- RLS: Risk Profiles
CREATE POLICY "Users can access risk profiles in their organization"
  ON public.risk_profiles FOR ALL
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- RLS: Scan History
CREATE POLICY "Users can access scan history in their organization"
  ON public.scan_history FOR ALL
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- RLS: Usage
CREATE POLICY "Users can view usage in their organization"
  ON public.usage FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- RLS: Saved Configs
CREATE POLICY "Users can access saved configs in their organization"
  ON public.saved_configs FOR ALL
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- RLS: System Logs
CREATE POLICY "Users can access system logs in their organization"
  ON public.system_logs FOR ALL
  USING (org_id IN (SELECT public.get_user_org_ids()));


-- =========================================================
-- AUTOMATIC ORGANIZATION CREATION ON USER SIGNUP (TRIGGER)
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  org_slug TEXT;
BEGIN
  -- Extract name or use email prefix
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
  org_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 6);

  -- Create a new default Organization for the user
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (user_name || '''s Organization', org_slug, 'free')
  RETURNING id INTO new_org_id;

  -- Link user as Owner of the organization
  INSERT INTO public.members (user_id, org_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
