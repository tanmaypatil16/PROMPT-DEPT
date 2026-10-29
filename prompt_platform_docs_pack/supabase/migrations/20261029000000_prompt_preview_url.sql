ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS preview_url TEXT;

COMMENT ON COLUMN public.prompts.preview_url IS 'Optional allowlisted HTTPS URL for an embeddable website preview.';
