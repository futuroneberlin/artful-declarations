import { z } from "zod";

const contribution = z.object({
  art_is: z.string().trim().min(1).max(500),
  acted_through_art: z.string().trim().max(500).transform((value) => value || null),
  language: z.enum(["de", "en"]),
});

export function prepareContribution(art: string, action: string, language: "de" | "en") {
  const parsed = contribution.safeParse({ art_is: art, acted_through_art: action, language });
  if (!parsed.success) return null;
  return { ...parsed.data, consent: true as const };
}