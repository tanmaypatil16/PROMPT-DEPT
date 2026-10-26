-- Trusted server-side admin promotion (service role only).
-- Usage from SQL editor with service role, or via scripts/promote-admin.ts

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id is required';
  END IF;
  UPDATE public.profiles
  SET role = 'admin', updated_at = now()
  WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_to_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID) TO service_role;
