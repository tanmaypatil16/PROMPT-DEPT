-- RLS on remaining tables, premium prompt_text protection, performance indexes

-- ---------------------------------------------------------------------------
-- Premium entitlement (for public catalog view; server may still use service role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_active_premium()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_active_premium() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_active_premium() TO anon, authenticated, service_role;

-- Safe catalog surface for PostgREST clients (does not expose premium bodies to anon)
CREATE OR REPLACE VIEW public.prompts_public_catalog
WITH (security_invoker = false) AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.description,
  CASE
    WHEN p.access_tier = 'free' THEN p.prompt_text
    WHEN auth.uid() IS NOT NULL AND public.user_has_active_premium() THEN p.prompt_text
    ELSE NULL
  END AS prompt_text,
  p.category_id,
  p.author_id,
  p.preview_image_url,
  p.preview_image_storage_path,
  p.task_type,
  p.access_tier,
  p.is_featured,
  p.source_type,
  p.source_url,
  p.source_repository,
  p.source_license,
  p.attribution,
  p.published_at,
  p.created_at,
  p.updated_at
FROM public.prompts p
WHERE p.status = 'published'
  AND p.visibility = 'public';

GRANT SELECT ON public.prompts_public_catalog TO anon, authenticated;

-- Base table: admins via JWT only; everyone else uses the view or service role
DROP POLICY IF EXISTS prompts_public_read ON public.prompts;

REVOKE ALL ON TABLE public.prompts FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompts FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompts TO authenticated;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS prompts_public_gallery_idx
  ON public.prompts (category_id, published_at DESC NULLS LAST)
  WHERE status = 'published' AND visibility = 'public';

CREATE INDEX IF NOT EXISTS analytics_events_occurred_at_idx
  ON public.analytics_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS prompt_likes_prompt_id_idx
  ON public.prompt_likes (prompt_id);

CREATE INDEX IF NOT EXISTS saved_prompts_prompt_id_idx
  ON public.saved_prompts (prompt_id);

CREATE INDEX IF NOT EXISTS collection_items_order_idx
  ON public.collection_items (collection_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_active_per_user
  ON public.subscriptions (user_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- RLS: tables that were missing it
-- ---------------------------------------------------------------------------
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- prompt_versions
CREATE POLICY prompt_versions_admin ON public.prompt_versions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- import jobs / items
CREATE POLICY prompt_import_jobs_admin ON public.prompt_import_jobs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY prompt_import_items_admin ON public.prompt_import_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- usage: own read for signed-in users; writes only via service role
CREATE POLICY usage_events_select_own ON public.usage_events
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- subscription plans: read active plans (pricing / entitlements UI)
CREATE POLICY subscription_plans_public_read ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY subscription_plans_admin ON public.subscription_plans
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- subscriptions: users see own row; mutations via service role / webhooks
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- webhook event log: admins only
CREATE POLICY subscription_events_admin ON public.subscription_events
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- audit log: admins read only (insert via service role)
CREATE POLICY admin_audit_log_admin_select ON public.admin_audit_log
  FOR SELECT USING (public.is_admin());
