export type Lang = "de" | "en";

export const t = {
  en: {
    artIs: "Art is",
    acted: "I acted through art today by",
    consent: "My anonymous answer may be shown in the artwork and used for artistic research.",
    privacy: "Privacy",
    submit: "Contribute",
    sending: "Entering…",
    needOne: "Complete at least one sentence.",
    needConsent: "Please confirm the consent line.",
    error: "Something interrupted the field. Your words were not saved — please try again.",
    success: "Your contribution has entered the collective field.",
    glossary: "Enter the glossary",
    again: "Add another",
    title: "Art as Stance",
  },
  de: {
    artIs: "Kunst ist",
    acted: "Ich habe heute durch Kunst gehandelt, indem ich",
    consent: "Meine anonyme Antwort darf im Kunstwerk gezeigt und für künstlerische Forschung genutzt werden.",
    privacy: "Datenschutz",
    submit: "Beitragen",
    sending: "Wird übertragen…",
    needOne: "Vervollständige mindestens einen Satz.",
    needConsent: "Bitte bestätige die Einwilligung.",
    error: "Etwas hat das Feld unterbrochen. Deine Worte wurden nicht gespeichert — bitte versuche es erneut.",
    success: "Dein Beitrag ist in das kollektive Feld eingegangen.",
    glossary: "Zum Glossar",
    again: "Weiteren Beitrag",
    title: "Kunst als Haltung",
  },
} as const;
