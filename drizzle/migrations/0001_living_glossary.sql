CREATE TABLE public."references" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  year text,
  url text,
  category text NOT NULL DEFAULT 'General',
  note text,
  display_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public."references" TO anon, authenticated;
GRANT ALL ON public."references" TO service_role;
ALTER TABLE public."references" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible references are public" ON public."references" FOR SELECT TO anon, authenticated USING (visible = true);

CREATE TABLE public.themes (
  key text PRIMARY KEY,
  label_de text NOT NULL,
  label_en text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.themes TO anon, authenticated;
GRANT ALL ON public.themes TO service_role;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Themes are public" ON public.themes FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.response_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE RESTRICT,
  theme_key text NOT NULL REFERENCES public.themes(key),
  created_by text NOT NULL DEFAULT 'auto-keyword',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (response_id, theme_key)
);
GRANT ALL ON public.response_analysis TO service_role;
ALTER TABLE public.response_analysis ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.categorise_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE txt text;
BEGIN
  txt := lower(coalesce(NEW.art_is, '') || ' ' || coalesce(NEW.acted_through_art, ''));
  INSERT INTO public.response_analysis (response_id, theme_key, created_by)
  SELECT NEW.id, th.key, 'auto-keyword' FROM public.themes th
  WHERE EXISTS (SELECT 1 FROM unnest(th.keywords) kw WHERE length(kw) > 0 AND position(kw IN txt) > 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.categorise_response() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER responses_categorise AFTER INSERT ON public.responses
FOR EACH ROW EXECUTE FUNCTION public.categorise_response();

CREATE VIEW public.public_response_themes AS
SELECT ra.response_id, ra.theme_key
FROM public.response_analysis ra JOIN public.responses r ON r.id = ra.response_id
WHERE r.consent = true AND r.hidden = false;
GRANT SELECT ON public.public_response_themes TO anon, authenticated;