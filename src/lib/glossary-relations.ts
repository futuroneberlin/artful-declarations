import type { Lang } from "./i18n";

export type Statement = { id: string; art_is: string | null; acted_through_art: string | null; created_at: string; language: string | null };
export type Extraction = "attitude" | "gesture" | "vectors";
export type SocialVector = {
  poleKey: string;
  sectorKey: string;
  sector: { en: string; de: string };
  actions: { en: string; de: string }[];
  statement: { en: string; de: string };
};
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

const SOCIAL_SECTORS: Record<string, { key: string; en: string; de: string; actions: { en: string; de: string }[] }> = {
  care: {
    key: "care-mutual-aid",
    en: "Care & Mutual Aid",
    de: "Fürsorge & gegenseitige Hilfe",
    actions: [
      { en: "Host a listening evening in your neighbourhood.", de: "Organisiere einen Zuhörabend in deiner Nachbarschaft." },
      { en: "Offer one practical support hour to someone nearby this week.", de: "Biete diese Woche einer Person in deiner Nähe eine praktische Unterstützungsstunde an." },
    ],
  },
  civic: {
    key: "civic-commons",
    en: "Civic Space & Commons",
    de: "Öffentlicher Raum & Gemeingüter",
    actions: [
      { en: "Invite neighbours to co-create one shared public space moment.", de: "Lade Nachbar:innen ein, einen gemeinsamen Moment im öffentlichen Raum zu gestalten." },
      { en: "Join or start a small local action for fair access to space.", de: "Beteilige dich an einer kleinen lokalen Aktion für gerechten Zugang zu Raum oder starte eine." },
    ],
  },
  community: {
    key: "community-dialogue",
    en: "Community & Dialogue",
    de: "Gemeinschaft & Dialog",
    actions: [
      { en: "Start a monthly conversation circle around everyday concerns.", de: "Starte einen monatlichen Gesprächskreis zu Themen des Alltags." },
      { en: "Bring two groups together for a shared storytelling session.", de: "Bringe zwei Gruppen für eine gemeinsame Storytelling-Session zusammen." },
    ],
  },
  ecology: {
    key: "ecology-place",
    en: "Ecology & Place",
    de: "Ökologie & Ort",
    actions: [
      { en: "Organise a local repair or reuse afternoon.", de: "Organisiere einen lokalen Reparatur- oder Wiederverwendungsnachmittag." },
      { en: "Create a small collective care routine for a nearby green space.", de: "Entwickle eine kleine kollektive Pflegeroutine für eine nahe Grünfläche." },
    ],
  },
  making: {
    key: "making-expression",
    en: "Making & Expression",
    de: "Gestalten & Ausdruck",
    actions: [
      { en: "Open a shared making table where people can create together.", de: "Öffne einen gemeinsamen Gestaltungstisch, an dem Menschen zusammen schaffen können." },
      { en: "Stage a short neighbourhood performance with open participation.", de: "Organisiere eine kurze Nachbarschafts-Performance mit offener Beteiligung." },
    ],
  },
  everyday: {
    key: "everyday-perception",
    en: "Everyday & Perception",
    de: "Alltag & Wahrnehmung",
    actions: [
      { en: "Lead a collective noticing walk through your street.", de: "Leite einen gemeinsamen Wahrnehmungsspaziergang durch deine Straße." },
      { en: "Start a weekly shared ritual to notice and name small changes.", de: "Starte ein wöchentliches gemeinsames Ritual, um kleine Veränderungen wahrzunehmen und zu benennen." },
    ],
  },
  open: {
    key: "open-emergent",
    en: "Emerging Social Practice",
    de: "Entstehende soziale Praxis",
    actions: [
      { en: "Invite one person to define a shared action from this gesture.", de: "Lade eine Person ein, aus dieser Geste eine gemeinsame Handlung zu formulieren." },
      { en: "Test one small collective experiment and reflect together afterward.", de: "Erprobe ein kleines kollektives Experiment und reflektiere danach gemeinsam." },
    ],
  },
};

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
export function deriveSocialVector(response: Statement, themes: string[] = []): SocialVector {
  const [poleKey = "open"] = extractRelations(response, "gesture", themes).poles;
  const sector = SOCIAL_SECTORS[poleKey] ?? SOCIAL_SECTORS.open;
  const gesture = (response.acted_through_art ?? "").trim();
  return {
    poleKey,
    sectorKey: sector.key,
    sector: { en: sector.en, de: sector.de },
    actions: sector.actions.slice(0, 2),
    statement: {
      en: gesture ? `${gesture[0]?.toUpperCase()}${gesture.slice(1)} can become ${sector.en.toLowerCase()}.` : `This gesture can become ${sector.en.toLowerCase()}.`,
      de: gesture ? `${gesture[0]?.toUpperCase()}${gesture.slice(1)} kann zu ${sector.de.toLowerCase()} werden.` : `Diese Geste kann zu ${sector.de.toLowerCase()} werden.`,
    },
  };
}
export function timestamp(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }).format(date);
}