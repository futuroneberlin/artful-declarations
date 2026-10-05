# Artful Declarations

PROJECT CONTEXT:
PROJECT: ART AS STANCE, an interactive artistic research website. The website is part of the artwork itself: a digital social sculpture, not a survey, dashboard, portfolio or social media wall.

CORE LOGIC: a visitor makes a statement -> the statement becomes stored data -> the data becomes part of a collective living visualisation -> the accumulated responses become material for later research and evaluation.

Conceptual loop: THEORY <-> ARTISTIC ACTION <-> COLLECTIVE RESPONSES.

VISITORS arrive by scanning a QR code at an exhibition and use their own smartphone. No account, no registration, anonymous. Mobile-first.

TWO PROMPTS:
1. "ART IS ______"
2. "I ACTED THROUGH ART TODAY BY ______"

RAW vs DERIVED DATA (critical):
- Raw responses are stored exactly as submitted and are NEVER modified or deleted by the website.
- Visualisation, themes, keywords, clusters and analysis work on derived data stored in separate tables.

PAGES: / (participation), /glossary (living glossary, 3 areas), /exhibition (projector mode), /admin (protected).

DESIGN: minimal, experimental, editorial, spacious, contemporary, artistic. Not corporate, not dashboard-like. Few buttons, no menus. Generous whitespace, one strong typographic voice (a refined serif or a characterful grotesk, plus a monospace for small details). Restrained palette with a dark mode for the exhibition screen. Data and relations are the visual language.

PRIVACY: no names, emails, IP addresses or tracking. Consent is stored with each response. Hosting region EU (GDPR).

LANGUAGES: German and English (store language per response).

STAGE 1 BUILD REQUEST:
Build Stage 1: the participation page and database storage.
DATABASE (create via migration, Supabase):
Table "locations": id (text, primary key, e.g. 'gallery-berlin-2026'), name, created_at.
Table "responses" (RAW DATA):
- id uuid primary key default gen_random_uuid()
- created_at timestamptz default now()
- art_is text (nullable, max 500 characters)
- acted_through_art text (nullable, max 500 characters)
- session_id text (random ID generated in the browser, not personal)
- location_id text references locations(id)
- language text ('de' or 'en')
- consent boolean not null
- hidden boolean not null default false
- check constraint: at least one of the two answers must be non-empty, and consent must be true.
SECURITY (Row Level Security, very important):
- Enable RLS on all tables.
- Anonymous visitors may INSERT into responses. They may NOT select, update or delete on responses.
- Create a view "public_responses" that returns only id, created_at, art_is, acted_through_art, language, from responses where consent = true and hidden = false. Allow anonymous SELECT on this view only.
- Nobody can update or delete rows in responses from the website.
PAGE "/" (mobile-first):
- Two prompts shown visually next to each other on desktop and stacked on mobile: "ART IS ______" and "I ACTED THROUGH ART TODAY BY ______". The blank is the input itself, written inline as if completing a sentence, not a form field with a label.
- The visitor can answer one or both. At least one is required. No other fields.
- A single short consent line with a checkbox: "My anonymous answer may be shown in the artwork and used for artistic research." Link to /privacy.
- A quiet submit action (not a loud button).
- Read the location from the URL, e.g. /?loc=gallery-berlin-2026, and store it as location_id.
- Generate a random session_id and keep it in localStorage.
- Detect language (de/en) from the browser with a small toggle DE/EN, and translate all interface text.
- After a successful submit show: "Your contribution has entered the collective field." with a gentle animation and a quiet link "Enter the glossary" that goes to /glossary.
- Friendly error message if saving fails.
Also create a simple /privacy page with placeholder text saying what is stored (the two answers, timestamp, anonymous session ID, location, language, consent) and that no personal data is collected.
Seed the locations table with one test location. Keep the design minimal and editorial as described in the project context.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f872ce45-3f52-47e6-994f-c3340b15b01f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
