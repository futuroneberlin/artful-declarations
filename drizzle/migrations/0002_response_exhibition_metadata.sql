ALTER TABLE public.responses
  ADD COLUMN exhibition_id text;

CREATE OR REPLACE VIEW public.public_responses AS
  SELECT id, created_at, art_is, acted_through_art, language, exhibition_id
  FROM public.responses
  WHERE consent = true AND hidden = false;

GRANT SELECT ON public.public_responses TO anon, authenticated;
