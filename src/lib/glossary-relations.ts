import type { Lang } from "./i18n";

export type Statement = { id: string; art_is: string | null; acted_through_art: string | null; created_at: string; language: string | null };
export type Extraction = "attitude" | "gesture" | "vectors";
type Echo = { key: string; en: string; de: string; words: string[] };
type Pole = { key: string; en: string; de: string; themes: string[]; echoes: Echo[] };

// A transparent bilingual codebook. All assignments remain derived, never written to raw responses.
export const POLES: Pole[] = [
  { key: "care", en: "Care", de: "Fürsorge", themes: ["relationship", "body"], echoes: [
    { key: "listening", en: "Listening", de: "Zuhören", words: ["listen", "zuhör", "zuhor", "attention", "aufmerksamkeit"] },
    { key: "support", en: "Mutual support", de: "Gegenseitige Unterstützung", words: ["care", "caring", "help", "support", "fürsorg", "fursorg", "helf", "unterstütz", "unterstutz", "healing", "heilung"] },
    { key: "embodiment", en: "Embodiment", de: "Körperlichkeit", words: ["body", "körper", "korper", "dance", "tanz", "movement", "bewegung"] },
  ] },
  { key: "civic", en: "Civic Space", de: "Öffentlicher Raum", themes: ["politics", "freedom"], echoes: [
    { key: "voice", en: "Voice & agency", de: "Stimme & Handlungsmacht", words: ["voice", "stimme", "freedom", "freiheit", "agency", "empower", "ermächtig", "ermachtig"] },
    { key: "commons", en: "Public commons", de: "Gemeinsamer Raum", words: ["public", "öffentlich", "offentlich", "street", "straße", "strasse", "civic", "democra", "demokra", "protest", "politic", "politik", "justice", "gerecht"] },
  ] },
  { key: "community", en: "Community & Dialogue", de: "Gemeinschaft & Dialog", themes: ["dialogue"], echoes: [
    { key: "together", en: "Togetherness", de: "Miteinander", words: ["together", "gemeinsam", "community", "gemeinschaft", "connect", "verbind", "collective", "kollektiv", "share", "teil"] },
    { key: "conversation", en: "Conversation", de: "Gespräch", words: ["dialog", "talk", "conversation", "gespräch", "gesprach", "discuss", "diskut"] },
  ] },
  { key: "ecology", en: "Ecology & Place", de: "Ökologie & Ort", themes: ["nature"], echoes: [
    { key: "living", en: "Living environments", de: "Lebensräume", words: ["nature", "natur", "garden", "garten", "plant", "pflanz", "ecolog", "ökolog", "okolog", "climate", "klima", "earth", "erde"] },
    { key: "repair", en: "Repair & reuse", de: "Reparieren & Wiederverwenden", words: ["repair", "repar", "reuse", "recycl", "wiederverwend", "sustain", "nachhalt"] },
  ] },
  { key: "making", en: "Making & Expression", de: "Gestalten & Ausdruck", themes: ["making", "music"], echoes: [
    { key: "creating", en: "Creating", de: "Erschaffen", words: ["mak", "creat", "gestalt", "schaff", "paint", "malen", "draw", "zeichn", "build", "bauen", "craft"] },
    { key: "sound", en: "Sound & performance", de: "Klang & Performance", words: ["music", "musik", "sing", "sound", "klang", "perform", "spiel", "play"] },
  ] },
  { key: "everyday", en: "Everyday & Perception", de: "Alltag & Wahrnehmung", themes: ["everyday", "perception"], echoes: [
    { key: "noticing", en: "Noticing", de: "Wahrnehmen", words: ["notice", "observ", "wahrnehm", "beobacht", "see", "sehen", "beauty", "schön", "schon", "percept"] },
    { key: "daily", en: "Daily practice", de: "Tägliche Praxis", words: ["everyday", "daily", "alltag", "täglich", "taglich", "routine", "walk", "spazier"] },
  ] },
];

const normalise = (text: string) => text.toLocaleLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
export function extractRelations(response: Statement, field: Extraction, themes: string[] = []) {
  const text = normalise(field === "attitude" ? response.art_is ?? "" : field === "gesture" ? response.acted_through_art ?? "" : `${response.art_is ?? ""} ${response.acted_through_art ?? ""}`);
  const tokens = text.match(/[\p{L}]+/gu) ?? [];
  const poles: string[] = [], echoes: string[] = [];
  for (const pole of POLES) {
    const matches = pole.echoes.filter((echo) => echo.words.some((word) => tokens.some((token) => token.startsWith(normalise(word)))));
    if (matches.length || (field === "vectors" && pole.themes.some((theme) => themes.includes(theme)))) poles.push(pole.key);
    echoes.push(...matches.map((echo) => echo.key));
  }
  return { poles: poles.length ? poles : ["open"], echoes };
}
export const poleLabel = (key: string, lang: Lang) => POLES.find((pole) => pole.key === key)?.[lang] ?? (lang === "de" ? "Offen / nicht zugeordnet" : "Open / unassigned");
export function timestamp(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }).format(date);
}