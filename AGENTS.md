<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Agents

- Raw `responses` rows are insert-only from the website (no select/update/delete grants); public reads go through the `public_responses` view. Why: raw research data must never be altered by the site.
- Derived data (themes, clusters, keywords) lives in separate tables, never on `responses`. Why: keeps raw vs derived data separate.
- Interface strings live in `src/lib/i18n.ts` (de/en). Why: every response stores its language; UI must be fully bilingual.
