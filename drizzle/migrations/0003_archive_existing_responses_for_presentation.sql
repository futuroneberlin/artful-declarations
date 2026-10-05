-- Preserve the raw archive, but start the presentation field empty.
UPDATE public.responses
SET hidden = true
WHERE hidden = false;
