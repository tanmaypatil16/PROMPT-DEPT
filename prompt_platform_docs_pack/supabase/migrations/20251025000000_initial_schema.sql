-- PROMPT/DEPT. initial schema (Supabase PostgreSQL)
-- Apply via Supabase CLI or SQL editor on a disposable dev project first.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums via check constraints for portability

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  slug TEXT NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  prompt_text TEXT NOT NULL CHECK (char_length(prompt_text) BETWEEN 1 AND 50000),
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  preview_image_url TEXT,
  preview_image_storage_path TEXT,
  task_type TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  access_tier TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'premium')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'csv_import', 'json_import', 'github_import')),
  source_url TEXT,
  source_repository TEXT,
  source_license TEXT,
  attribution TEXT,
  content_hash TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX prompts_content_hash_unique ON public.prompts (content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX prompts_status_published_at_idx ON public.prompts (status, published_at DESC NULLS LAST);
CREATE INDEX prompts_category_id_idx ON public.prompts (category_id);
CREATE INDEX prompts_access_tier_idx ON public.prompts (access_tier);

CREATE TABLE public.prompt_tags (
  prompt_id UUID NOT NULL REFERENCES public.prompts (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts (id) ON DELETE CASCADE,
  version_number INT NOT NULL CHECK (version_number > 0),
  title_snapshot TEXT NOT NULL,
  prompt_text_snapshot TEXT NOT NULL,
  change_summary TEXT,
  changed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, version_number)
);

CREATE TABLE public.prompt_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'json', 'github')),
  source_url TEXT,
  original_filename TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'completed_with_errors', 'failed')),
  total_records INT NOT NULL DEFAULT 0,
  valid_records INT NOT NULL DEFAULT 0,
  imported_records INT NOT NULL DEFAULT 0,
  duplicate_records INT NOT NULL DEFAULT 0,
  invalid_records INT NOT NULL DEFAULT 0,
  failed_records INT NOT NULL DEFAULT 0,
  error_summary TEXT,
  field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prompt_import_jobs_created_by_idx ON public.prompt_import_jobs (created_by, created_at DESC);

CREATE TABLE public.prompt_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id UUID NOT NULL REFERENCES public.prompt_import_jobs (id) ON DELETE CASCADE,
  row_number INT,
  source_record_key TEXT,
  prompt_id UUID REFERENCES public.prompts (id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('valid', 'imported', 'duplicate', 'invalid', 'failed')),
  error_code TEXT,
  error_message TEXT CHECK (error_message IS NULL OR char_length(error_message) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prompt_import_items_job_idx ON public.prompt_import_items (import_job_id, status);

CREATE TABLE public.prompt_likes (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, prompt_id)
);

CREATE TABLE public.saved_prompts (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, prompt_id)
);

CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts (id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, prompt_id)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts (id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 100),
  details TEXT CHECK (details IS NULL OR char_length(details) <= 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 80),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  session_id TEXT CHECK (session_id IS NULL OR char_length(session_id) <= 128),
  prompt_id UUID REFERENCES public.prompts (id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(properties) < 8192)
);

CREATE INDEX analytics_events_type_time_idx ON public.analytics_events (event_type, occurred_at DESC);
CREATE INDEX analytics_events_prompt_idx ON public.analytics_events (prompt_id, occurred_at DESC) WHERE prompt_id IS NOT NULL;
CREATE INDEX analytics_events_user_time_idx ON public.analytics_events (user_id, occurred_at DESC) WHERE user_id IS NOT NULL;

CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  session_id UUID,
  feature TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  input_units INT,
  output_units INT,
  estimated_cost NUMERIC(12, 4),
  status TEXT NOT NULL DEFAULT 'completed',
  request_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_amount INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans (id) ON DELETE RESTRICT,
  billing_provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_user_status_idx ON public.subscriptions (user_id, status);

CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (billing_provider, provider_event_id)
);

CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);

-- Profile bootstrap on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prevent self-promotion to admin via client updates
CREATE OR REPLACE FUNCTION public.profiles_guard_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'admin' AND OLD.role IS DISTINCT FROM 'admin' AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Administrator role cannot be self-assigned';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_guard_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_role();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
  );
$$;

-- Profiles: users read/update own (role guarded by trigger); admins read all
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Published public prompts (full row — premium masking enforced in app layer)
CREATE POLICY prompts_public_read ON public.prompts FOR SELECT USING (
  status = 'published' AND visibility = 'public'
);

CREATE POLICY prompts_admin_all ON public.prompts FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY categories_public_read ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY categories_admin ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY tags_public_read ON public.tags FOR SELECT USING (true);
CREATE POLICY tags_admin ON public.tags FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY prompt_tags_public ON public.prompt_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.status = 'published' AND p.visibility = 'public')
);
CREATE POLICY prompt_tags_admin ON public.prompt_tags FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY prompt_likes_own ON public.prompt_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY saved_prompts_own ON public.saved_prompts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_own ON public.collections FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY collection_items_own ON public.collection_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid())
);

CREATE POLICY reports_insert_auth ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY reports_admin ON public.reports FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Analytics: no direct client insert; server uses service role
CREATE POLICY analytics_no_client ON public.analytics_events FOR SELECT USING (public.is_admin());

-- Seed categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Image', 'image', 'Image generation and visual direction', 10),
  ('Website', 'website', 'Web and portfolio experiences', 20),
  ('3D & Motion', '3d-motion', '3D, animation, and motion design', 30),
  ('Code', 'code', 'Development and creative coding', 40),
  ('Writing', 'writing', 'Stories, copy, and narrative', 50),
  ('Study & Exams', 'study-exams', 'Learning and revision', 60),
  ('Product Photo', 'product-photo', 'Product and editorial photography', 70),
  ('Architecture', 'architecture', 'Space and built environment', 80),
  ('Visual Experiment', 'visual-experiment', 'Exploratory visual work', 90)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subscription_plans (name, slug, description, price_amount, entitlements) VALUES
  ('Free', 'free', 'Browse free prompts and limited studio usage', 0, '{"premium_prompts": false, "studio_daily_limit": 20}'::jsonb),
  ('Premium', 'premium', 'Premium prompts and higher studio limits', 999, '{"premium_prompts": true, "studio_daily_limit": 200}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
