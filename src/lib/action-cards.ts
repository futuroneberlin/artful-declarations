import type { Lang } from "./i18n";

type Text = { en: string; de: string };
export type ActionCard = { field: Text; step: Text; practice: Text };

// Derived prompts per social action vector: invitations to carry a gesture into artistic practice.
export const ACTION_CARDS: Record<string, ActionCard> = {
  care: {
    field: { en: "Art as attention to others, bodies and vulnerability.", de: "Kunst als Aufmerksamkeit für andere, Körper und Verletzlichkeit." },
    step: { en: "Offer one hour of listening to someone and record only what you noticed, not what was said.", de: "Schenke jemandem eine Stunde Zuhören und notiere nur, was du wahrgenommen hast, nicht was gesagt wurde." },
    practice: { en: "Develop a work that only exists when it is cared for by others.", de: "Entwickle eine Arbeit, die nur existiert, wenn andere sie pflegen." },
  },
  civic: {
    field: { en: "Art as a voice in shared, public space.", de: "Kunst als Stimme im gemeinsamen, öffentlichen Raum." },
    step: { en: "Place one question in public space and return a week later to collect the answers.", de: "Platziere eine Frage im öffentlichen Raum und sammle eine Woche später die Antworten." },
    practice: { en: "Turn a site in your city into a temporary forum for a local issue.", de: "Verwandle einen Ort deiner Stadt in ein temporäres Forum für ein lokales Thema." },
  },
  community: {
    field: { en: "Art as encounter, dialogue and collective making.", de: "Kunst als Begegnung, Dialog und gemeinsames Gestalten." },
    step: { en: "Invite two people who do not know each other to make something together.", de: "Lade zwei Menschen, die sich nicht kennen, ein, gemeinsam etwas zu gestalten." },
    practice: { en: "Share authorship: let a group decide the next step of your work.", de: "Teile Autorschaft: Lass eine Gruppe über den nächsten Schritt deiner Arbeit entscheiden." },
  },
  ecology: {
    field: { en: "Art as relation to place, matter and living environments.", de: "Kunst als Beziehung zu Ort, Material und Lebensräumen." },
    step: { en: "Make a work only from materials found within 100 metres of where you are.", de: "Gestalte eine Arbeit nur aus Materialien, die du im Umkreis von 100 Metern findest." },
    practice: { en: "Repair instead of produce: make care for existing things your method.", de: "Reparieren statt produzieren: Mach die Pflege des Bestehenden zu deiner Methode." },
  },
  making: {
    field: { en: "Art as making, sound and expressive form.", de: "Kunst als Gestalten, Klang und ausdrucksstarke Form." },
    step: { en: "Make something small today and give it away to a stranger.", de: "Gestalte heute etwas Kleines und verschenke es an eine fremde Person." },
    practice: { en: "Open your process: invite others into the studio before the work is finished.", de: "Öffne deinen Prozess: Lade andere ein, bevor die Arbeit fertig ist." },
  },
  everyday: {
    field: { en: "Art as perception and practice within daily life.", de: "Kunst als Wahrnehmung und Praxis im Alltag." },
    step: { en: "Repeat one conscious gesture every day for seven days and document it.", de: "Wiederhole sieben Tage lang täglich eine bewusste Geste und dokumentiere sie." },
    practice: { en: "Treat a daily routine as a score and perform it as artistic research.", de: "Behandle eine Alltagsroutine als Partitur und führe sie als künstlerische Forschung auf." },
  },
  open: {
    field: { en: "An open vector not yet named by the collective field.", de: "Ein offener Vektor, den das kollektive Feld noch nicht benannt hat." },
    step: { en: "Name the social field your gesture touched, and act there once more this week.", de: "Benenne das soziale Feld, das deine Geste berührt hat, und handle dort diese Woche noch einmal." },
    practice: { en: "Let this gesture become the starting question of your next work.", de: "Lass diese Geste zur Ausgangsfrage deiner nächsten Arbeit werden." },
  },
};

export const actionCard = (key: string) => ACTION_CARDS[key] ?? ACTION_CARDS.open;
export const cardText = (text: Text, lang: Lang) => text[lang];
