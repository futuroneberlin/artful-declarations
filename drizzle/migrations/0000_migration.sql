CREATE TABLE public.locations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are publicly readable" ON public.locations FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  art_is text CHECK (art_is IS NULL OR char_length(art_is) <= 500),
  acted_through_art text CHECK (acted_through_art IS NULL OR char_length(acted_through_art) <= 500),
  session_id text CHECK (session_id IS NULL OR char_length(session_id) <= 100),
  location_id text REFERENCES public.locations(id),
  language text CHECK (language IN ('de','en')),
  consent boolean NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  CONSTRAINT responses_one_answer CHECK (
    coalesce(btrim(art_is), '') <> '' OR coalesce(btrim(acted_through_art), '') <> ''
  ),
  CONSTRAINT responses_consent_true CHECK (consent = true)
);
GRANT INSERT ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a response" ON public.responses FOR INSERT TO anon, authenticated
  WITH CHECK (consent = true AND hidden = false);

CREATE VIEW public.public_responses AS
  SELECT id, created_at, art_is, acted_through_art, language
  FROM public.responses
  WHERE consent = true AND hidden = false;
GRANT SELECT ON public.public_responses TO anon, authenticated;

INSERT INTO public.locations (id, name) VALUES ('gallery-berlin-2026', 'Gallery Berlin 2026');