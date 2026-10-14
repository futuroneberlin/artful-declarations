CREATE TABLE public.response_pole_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE RESTRICT,
  source_field text NOT NULL CHECK (source_field IN ('attitude', 'gesture', 'vectors')),
  pole_key text NOT NULL CHECK (pole_key IN ('care', 'civic', 'community', 'ecology', 'making', 'everyday', 'open')),
  created_by text NOT NULL DEFAULT 'auto-keyword',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (response_id, source_field, pole_key)
);
GRANT ALL ON public.response_pole_analysis TO service_role;
ALTER TABLE public.response_pole_analysis ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.response_social_vectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL UNIQUE REFERENCES public.responses(id) ON DELETE RESTRICT,
  pole_key text NOT NULL CHECK (pole_key IN ('care', 'civic', 'community', 'ecology', 'making', 'everyday', 'open')),
  sector_key text NOT NULL,
  sector_en text NOT NULL,
  sector_de text NOT NULL,
  advice_en text[] NOT NULL DEFAULT '{}',
  advice_de text[] NOT NULL DEFAULT '{}',
  statement_en text NOT NULL,
  statement_de text NOT NULL,
  created_by text NOT NULL DEFAULT 'auto-keyword',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.response_social_vectors TO service_role;
ALTER TABLE public.response_social_vectors ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.derive_response_interpretations()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  txt_attitude text := lower(coalesce(NEW.art_is, ''));
  txt_gesture text := lower(coalesce(NEW.acted_through_art, ''));
  txt_vectors text := lower(coalesce(NEW.art_is, '') || ' ' || coalesce(NEW.acted_through_art, ''));
  gesture_pole text := 'open';
  sector_key text := 'open-emergent';
  sector_en text := 'Emerging Social Practice';
  sector_de text := 'Entstehende soziale Praxis';
  advice_one_en text := 'Invite one person to define a shared action from this gesture.';
  advice_two_en text := 'Test one small collective experiment and reflect together afterward.';
  advice_one_de text := 'Lade eine Person ein, aus dieser Geste eine gemeinsame Handlung zu formulieren.';
  advice_two_de text := 'Erprobe ein kleines kollektives Experiment und reflektiere danach gemeinsam.';
BEGIN
  INSERT INTO public.response_pole_analysis (response_id, source_field, pole_key)
  SELECT NEW.id, source_field, pole_key
  FROM (
    SELECT 'attitude'::text AS source_field, 'care'::text AS pole_key
    WHERE txt_attitude ~ '(listen|zuhor|attention|aufmerksamkeit|care|caring|help|support|fursorg|fürsorg|unterstutz|healing|heilung|body|korper|körper|dance|tanz|movement|bewegung)'
    UNION ALL SELECT 'attitude', 'civic'
    WHERE txt_attitude ~ '(voice|stimme|freedom|freiheit|agency|empower|ermachtig|ermächtig|public|offentlich|öffentlich|street|strasse|straße|civic|demokra|protest|politic|politik|justice|gerecht)'
    UNION ALL SELECT 'attitude', 'community'
    WHERE txt_attitude ~ '(together|gemeinsam|community|gemeinschaft|connect|verbind|collective|kollektiv|share|teil|dialog|talk|conversation|gesprach|gespräch|discuss|diskut)'
    UNION ALL SELECT 'attitude', 'ecology'
    WHERE txt_attitude ~ '(nature|natur|garden|garten|plant|pflanz|ecolog|okolog|ökolog|climate|klima|earth|erde|repair|repar|reuse|recycl|wiederverwend|sustain|nachhalt)'
    UNION ALL SELECT 'attitude', 'making'
    WHERE txt_attitude ~ '(mak|creat|gestalt|schaff|paint|malen|draw|zeichn|build|bauen|craft|music|musik|sing|sound|klang|perform|spiel|play)'
    UNION ALL SELECT 'attitude', 'everyday'
    WHERE txt_attitude ~ '(notice|observ|wahrnehm|beobacht|see|sehen|beauty|schon|schön|percept|everyday|daily|alltag|taglich|täglich|routine|walk|spazier)'
    UNION ALL SELECT 'gesture', 'care'
    WHERE txt_gesture ~ '(listen|zuhor|attention|aufmerksamkeit|care|caring|help|support|fursorg|fürsorg|unterstutz|healing|heilung|body|korper|körper|dance|tanz|movement|bewegung)'
    UNION ALL SELECT 'gesture', 'civic'
    WHERE txt_gesture ~ '(voice|stimme|freedom|freiheit|agency|empower|ermachtig|ermächtig|public|offentlich|öffentlich|street|strasse|straße|civic|demokra|protest|politic|politik|justice|gerecht)'
    UNION ALL SELECT 'gesture', 'community'
    WHERE txt_gesture ~ '(together|gemeinsam|community|gemeinschaft|connect|verbind|collective|kollektiv|share|teil|dialog|talk|conversation|gesprach|gespräch|discuss|diskut)'
    UNION ALL SELECT 'gesture', 'ecology'
    WHERE txt_gesture ~ '(nature|natur|garden|garten|plant|pflanz|ecolog|okolog|ökolog|climate|klima|earth|erde|repair|repar|reuse|recycl|wiederverwend|sustain|nachhalt)'
    UNION ALL SELECT 'gesture', 'making'
    WHERE txt_gesture ~ '(mak|creat|gestalt|schaff|paint|malen|draw|zeichn|build|bauen|craft|music|musik|sing|sound|klang|perform|spiel|play)'
    UNION ALL SELECT 'gesture', 'everyday'
    WHERE txt_gesture ~ '(notice|observ|wahrnehm|beobacht|see|sehen|beauty|schon|schön|percept|everyday|daily|alltag|taglich|täglich|routine|walk|spazier)'
    UNION ALL SELECT 'vectors', 'care'
    WHERE txt_vectors ~ '(listen|zuhor|attention|aufmerksamkeit|care|caring|help|support|fursorg|fürsorg|unterstutz|healing|heilung|body|korper|körper|dance|tanz|movement|bewegung)'
    UNION ALL SELECT 'vectors', 'civic'
    WHERE txt_vectors ~ '(voice|stimme|freedom|freiheit|agency|empower|ermachtig|ermächtig|public|offentlich|öffentlich|street|strasse|straße|civic|demokra|protest|politic|politik|justice|gerecht)'
    UNION ALL SELECT 'vectors', 'community'
    WHERE txt_vectors ~ '(together|gemeinsam|community|gemeinschaft|connect|verbind|collective|kollektiv|share|teil|dialog|talk|conversation|gesprach|gespräch|discuss|diskut)'
    UNION ALL SELECT 'vectors', 'ecology'
    WHERE txt_vectors ~ '(nature|natur|garden|garten|plant|pflanz|ecolog|okolog|ökolog|climate|klima|earth|erde|repair|repar|reuse|recycl|wiederverwend|sustain|nachhalt)'
    UNION ALL SELECT 'vectors', 'making'
    WHERE txt_vectors ~ '(mak|creat|gestalt|schaff|paint|malen|draw|zeichn|build|bauen|craft|music|musik|sing|sound|klang|perform|spiel|play)'
    UNION ALL SELECT 'vectors', 'everyday'
    WHERE txt_vectors ~ '(notice|observ|wahrnehm|beobacht|see|sehen|beauty|schon|schön|percept|everyday|daily|alltag|taglich|täglich|routine|walk|spazier)'
  ) matches
  ON CONFLICT DO NOTHING;

  INSERT INTO public.response_pole_analysis (response_id, source_field, pole_key)
  SELECT NEW.id, source_field, 'open'
  FROM (VALUES ('attitude'::text), ('gesture'::text), ('vectors'::text)) base(source_field)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.response_pole_analysis rpa
    WHERE rpa.response_id = NEW.id AND rpa.source_field = base.source_field
  )
  ON CONFLICT DO NOTHING;

  SELECT rpa.pole_key
  INTO gesture_pole
  FROM public.response_pole_analysis rpa
  WHERE rpa.response_id = NEW.id AND rpa.source_field = 'gesture' AND rpa.pole_key <> 'open'
  ORDER BY CASE rpa.pole_key
    WHEN 'care' THEN 1
    WHEN 'civic' THEN 2
    WHEN 'community' THEN 3
    WHEN 'ecology' THEN 4
    WHEN 'making' THEN 5
    WHEN 'everyday' THEN 6
    ELSE 7
  END
  LIMIT 1;
  gesture_pole := coalesce(gesture_pole, 'open');

  IF gesture_pole = 'care' THEN
    sector_key := 'care-mutual-aid'; sector_en := 'Care & Mutual Aid'; sector_de := 'Fürsorge & gegenseitige Hilfe';
    advice_one_en := 'Host a listening evening in your neighbourhood.'; advice_two_en := 'Offer one practical support hour to someone nearby this week.';
    advice_one_de := 'Organisiere einen Zuhörabend in deiner Nachbarschaft.'; advice_two_de := 'Biete diese Woche einer Person in deiner Nähe eine praktische Unterstützungsstunde an.';
  ELSIF gesture_pole = 'civic' THEN
    sector_key := 'civic-commons'; sector_en := 'Civic Space & Commons'; sector_de := 'Öffentlicher Raum & Gemeingüter';
    advice_one_en := 'Invite neighbours to co-create one shared public space moment.'; advice_two_en := 'Join or start a small local action for fair access to space.';
    advice_one_de := 'Lade Nachbar:innen ein, einen gemeinsamen Moment im öffentlichen Raum zu gestalten.'; advice_two_de := 'Beteilige dich an einer kleinen lokalen Aktion für gerechten Zugang zu Raum oder starte eine.';
  ELSIF gesture_pole = 'community' THEN
    sector_key := 'community-dialogue'; sector_en := 'Community & Dialogue'; sector_de := 'Gemeinschaft & Dialog';
    advice_one_en := 'Start a monthly conversation circle around everyday concerns.'; advice_two_en := 'Bring two groups together for a shared storytelling session.';
    advice_one_de := 'Starte einen monatlichen Gesprächskreis zu Themen des Alltags.'; advice_two_de := 'Bringe zwei Gruppen für eine gemeinsame Storytelling-Session zusammen.';
  ELSIF gesture_pole = 'ecology' THEN
    sector_key := 'ecology-place'; sector_en := 'Ecology & Place'; sector_de := 'Ökologie & Ort';
    advice_one_en := 'Organise a local repair or reuse afternoon.'; advice_two_en := 'Create a small collective care routine for a nearby green space.';
    advice_one_de := 'Organisiere einen lokalen Reparatur- oder Wiederverwendungsnachmittag.'; advice_two_de := 'Entwickle eine kleine kollektive Pflegeroutine für eine nahe Grünfläche.';
  ELSIF gesture_pole = 'making' THEN
    sector_key := 'making-expression'; sector_en := 'Making & Expression'; sector_de := 'Gestalten & Ausdruck';
    advice_one_en := 'Open a shared making table where people can create together.'; advice_two_en := 'Stage a short neighbourhood performance with open participation.';
    advice_one_de := 'Öffne einen gemeinsamen Gestaltungstisch, an dem Menschen zusammen schaffen können.'; advice_two_de := 'Organisiere eine kurze Nachbarschafts-Performance mit offener Beteiligung.';
  ELSIF gesture_pole = 'everyday' THEN
    sector_key := 'everyday-perception'; sector_en := 'Everyday & Perception'; sector_de := 'Alltag & Wahrnehmung';
    advice_one_en := 'Lead a collective noticing walk through your street.'; advice_two_en := 'Start a weekly shared ritual to notice and name small changes.';
    advice_one_de := 'Leite einen gemeinsamen Wahrnehmungsspaziergang durch deine Straße.'; advice_two_de := 'Starte ein wöchentliches gemeinsames Ritual, um kleine Veränderungen wahrzunehmen und zu benennen.';
  END IF;

  INSERT INTO public.response_social_vectors (
    response_id, pole_key, sector_key, sector_en, sector_de, advice_en, advice_de, statement_en, statement_de
  ) VALUES (
    NEW.id,
    gesture_pole,
    sector_key,
    sector_en,
    sector_de,
    ARRAY[advice_one_en, advice_two_en],
    ARRAY[advice_one_de, advice_two_de],
    CASE
      WHEN btrim(coalesce(NEW.acted_through_art, '')) <> '' THEN initcap(btrim(NEW.acted_through_art)) || ' can become ' || lower(sector_en) || '.'
      ELSE 'This gesture can become ' || lower(sector_en) || '.'
    END,
    CASE
      WHEN btrim(coalesce(NEW.acted_through_art, '')) <> '' THEN initcap(btrim(NEW.acted_through_art)) || ' kann zu ' || lower(sector_de) || ' werden.'
      ELSE 'Diese Geste kann zu ' || lower(sector_de) || ' werden.'
    END
  )
  ON CONFLICT (response_id) DO NOTHING;

  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.derive_response_interpretations() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER responses_derive_interpretations
AFTER INSERT ON public.responses
FOR EACH ROW EXECUTE FUNCTION public.derive_response_interpretations();

CREATE VIEW public.public_response_poles AS
SELECT rpa.response_id, rpa.source_field, rpa.pole_key
FROM public.response_pole_analysis rpa
JOIN public.responses r ON r.id = rpa.response_id
WHERE r.consent = true AND r.hidden = false;
GRANT SELECT ON public.public_response_poles TO anon, authenticated;

CREATE VIEW public.public_response_social_vectors AS
SELECT
  rsv.response_id,
  rsv.pole_key,
  rsv.sector_key,
  rsv.sector_en,
  rsv.sector_de,
  rsv.advice_en,
  rsv.advice_de,
  rsv.statement_en,
  rsv.statement_de,
  rsv.created_at
FROM public.response_social_vectors rsv
JOIN public.responses r ON r.id = rsv.response_id
WHERE r.consent = true AND r.hidden = false;
GRANT SELECT ON public.public_response_social_vectors TO anon, authenticated;
