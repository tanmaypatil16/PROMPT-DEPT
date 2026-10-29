CREATE TABLE public.import_source_review_state (
  source_identity TEXT PRIMARY KEY,
  source_repository TEXT NOT NULL CHECK (source_repository = 'im-286/siteprompt'),
  source_path TEXT NOT NULL CHECK (
    source_path ~ '^(prompts|Pro-prompts)/[A-Za-z0-9._/-]+[.]md$'
    AND source_path !~ '(^|/)[.][.]?(/|$)'
    AND source_path !~ '//'
  ),
  source_commit TEXT NOT NULL CHECK (source_commit ~ '^[a-f0-9]{40}$'),
  source_content_hash TEXT NOT NULL CHECK (source_content_hash ~ '^[a-f0-9]{64}$'),
  review_status TEXT NOT NULL CHECK (
    review_status IN ('approved', 'requires_review', 'excluded', 'rejected')
  ),
  reviewer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rationale TEXT CHECK (rationale IS NULL OR char_length(rationale) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT import_source_review_identity_matches
    CHECK (source_identity = source_repository || ':' || source_path),
  CONSTRAINT import_source_review_path_unique
    UNIQUE (source_repository, source_path)
);

ALTER TABLE public.import_source_review_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_source_review_state_admin_select
  ON public.import_source_review_state
  FOR SELECT USING (public.is_admin());

REVOKE ALL ON TABLE public.import_source_review_state FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.import_source_review_state TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_import_source_review(
  p_source_identity TEXT,
  p_source_repository TEXT,
  p_source_path TEXT,
  p_source_commit TEXT,
  p_source_content_hash TEXT,
  p_review_status TEXT,
  p_reviewer_id UUID,
  p_rationale TEXT,
  p_expected_updated_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_state public.import_source_review_state%ROWTYPE;
  saved_state public.import_source_review_state%ROWTYPE;
  effective_status TEXT := p_review_status;
  effective_rationale TEXT := p_rationale;
  audit_action TEXT := 'import.manifest.review';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_reviewer_id
      AND role = 'admin'
      AND account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'Active administrator required'
      USING ERRCODE = '42501';
  END IF;

  IF p_source_identity IS NULL
    OR p_source_repository IS DISTINCT FROM 'im-286/siteprompt'
    OR p_source_path IS NULL
    OR p_source_identity <> p_source_repository || ':' || p_source_path
    OR p_source_commit IS NULL
    OR p_source_commit !~ '^[a-f0-9]{40}$'
    OR p_source_content_hash IS NULL
    OR p_source_content_hash !~ '^[a-f0-9]{64}$'
    OR p_review_status IS NULL
    OR p_review_status NOT IN ('approved', 'requires_review', 'excluded', 'rejected')
    OR p_source_path !~ '^(prompts|Pro-prompts)/[A-Za-z0-9._/-]+[.]md$'
    OR p_source_path ~ '(^|/)[.][.]?(/|$)'
    OR p_source_path ~ '//'
    OR char_length(COALESCE(p_rationale, '')) > 2000
  THEN
    RAISE EXCEPTION 'Invalid source review values'
      USING ERRCODE = '22023';
  END IF;

  IF p_review_status = 'approved' AND char_length(btrim(COALESCE(p_rationale, ''))) < 20 THEN
    RAISE EXCEPTION 'Approval requires a rationale of at least 20 characters'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO current_state
  FROM public.import_source_review_state
  WHERE source_identity = p_source_identity
  FOR UPDATE;

  IF NOT FOUND THEN
    IF p_expected_updated_at IS NOT NULL THEN
      RAISE EXCEPTION 'Review state changed; refresh and retry'
        USING ERRCODE = '40001';
    END IF;

    BEGIN
      INSERT INTO public.import_source_review_state (
        source_identity, source_repository, source_path, source_commit,
        source_content_hash, review_status, reviewer_id, rationale
      ) VALUES (
        p_source_identity, p_source_repository, p_source_path, p_source_commit,
        p_source_content_hash, p_review_status, p_reviewer_id, NULLIF(btrim(p_rationale), '')
      )
      RETURNING * INTO saved_state;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Review state changed concurrently; refresh and retry'
        USING ERRCODE = '40001';
    END;
  ELSE
    IF current_state.source_content_hash = p_source_content_hash
      AND current_state.source_commit = p_source_commit
      AND current_state.review_status = p_review_status
      AND current_state.reviewer_id = p_reviewer_id
      AND current_state.rationale IS NOT DISTINCT FROM NULLIF(btrim(p_rationale), '')
    THEN
      RETURN jsonb_build_object(
        'source_identity', current_state.source_identity,
        'source_content_hash', current_state.source_content_hash,
        'review_status', current_state.review_status,
        'reviewer_id', current_state.reviewer_id,
        'reviewed_at', current_state.reviewed_at,
        'updated_at', current_state.updated_at,
        'idempotent', true
      );
    END IF;

    IF p_expected_updated_at IS NULL
      OR current_state.updated_at IS DISTINCT FROM p_expected_updated_at
    THEN
      RAISE EXCEPTION 'Review state changed; refresh and retry'
        USING ERRCODE = '40001';
    END IF;

    IF current_state.source_content_hash <> p_source_content_hash THEN
      effective_status := 'requires_review';
      effective_rationale := 'Source content changed; a new review is required.';
      audit_action := 'import.manifest.source_changed';
    ELSIF NOT (
      current_state.review_status = p_review_status
      OR (current_state.review_status = 'requires_review' AND p_review_status IN ('approved', 'excluded', 'rejected'))
      OR (current_state.review_status = 'approved' AND p_review_status IN ('requires_review', 'excluded', 'rejected'))
      OR (current_state.review_status IN ('excluded', 'rejected') AND p_review_status = 'requires_review')
    ) THEN
      RAISE EXCEPTION 'Invalid review status transition'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.import_source_review_state
    SET source_commit = p_source_commit,
        source_content_hash = p_source_content_hash,
        review_status = effective_status,
        reviewer_id = p_reviewer_id,
        reviewed_at = now(),
        rationale = NULLIF(btrim(effective_rationale), ''),
        updated_at = now()
    WHERE source_identity = p_source_identity
    RETURNING * INTO saved_state;
  END IF;

  INSERT INTO public.admin_audit_log (
    actor_id, action, target_type, target_id, metadata
  ) VALUES (
    p_reviewer_id,
    audit_action,
    'source_identity',
    p_source_identity,
    jsonb_build_object(
      'source_repository', p_source_repository,
      'source_path', p_source_path,
      'source_commit', p_source_commit,
      'source_content_hash', p_source_content_hash,
      'review_status', effective_status,
      'rationale', NULLIF(btrim(effective_rationale), ''),
      'reviewed_at', saved_state.reviewed_at,
      'rights_independently_verified', false
    )
  );

  RETURN jsonb_build_object(
    'source_identity', saved_state.source_identity,
    'source_content_hash', saved_state.source_content_hash,
    'review_status', saved_state.review_status,
    'reviewer_id', saved_state.reviewer_id,
    'reviewed_at', saved_state.reviewed_at,
    'updated_at', saved_state.updated_at,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_import_source_review(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_import_source_review(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ
) TO service_role;
