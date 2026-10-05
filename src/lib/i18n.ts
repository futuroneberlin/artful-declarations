export type Lang = "de" | "en";

export const t = {
  en: {
    artIs: "Art is",
    acted: "I acted through art today by",
    consent: "By contributing, you agree that your anonymous answer may be shown in the artwork and used for artistic research.",
    privacy: "Privacy",
    submit: "Contribute",
    sending: "Entering…",
    needOne: "Complete at least one sentence.",
    error: "Something interrupted the field. Your words were not saved — please try again.",
    success: "Your contribution has entered the collective field.",
    title: "Art as Stance",
  },
  de: {
    artIs: "Kunst ist",
    acted: "Ich habe heute durch Kunst gehandelt, indem ich",
    consent: "Mit deinem Beitrag stimmst du zu, dass deine anonyme Antwort im Kunstwerk gezeigt und für künstlerische Forschung verwendet wird.",
    privacy: "Datenschutz",
    submit: "Beitragen",
    sending: "Wird übertragen…",
    needOne: "Vervollständige mindestens einen Satz.",
    error: "Etwas hat das Feld unterbrochen. Deine Worte wurden nicht gespeichert — bitte versuche es erneut.",
    success: "Dein Beitrag ist im kollektiven Feld angekommen.",
    title: "Kunst als Haltung",
  },
} as const;
