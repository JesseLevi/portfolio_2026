# Handoff

**Stand (2026-10-25):** live op https://jessekamps.vercel.app. Alle tickets zijn gemerged behalve #15 (pagina "Over", wacht op ontwerp). Elke merge naar `main` deployt automatisch naar productie.

**Gebouwd:** Home (snap, actieve case, paneelwissel, eindeloze lus, ook op touch), case-pagina's (`/werk/<slug>`), de morph Home → Case, de nav-pil, de contact-drawer, de hoofdstuk-indicator, de case-nav, de eigen cursor, SEO (sitemap, OG, favicon), de 404 en een axe-test (`pnpm a11y`). Lighthouse geeft 100/100/100/100 op Home; op de case-pagina is Accessibility 96, alleen door de bewuste `#949494`.

**Open:**
- **Pages CMS:** de GitHub-app installeren op de repo (Jesse, één klik in de browser), daarna de media-upload en de preview testen.
- **Echte content:** de cases, afbeeldingen en teksten zijn placeholders (Belsimpel, KC en de blokken). Het agency staat overal op "Build in Amsterdam". De mail en de LinkedIn-URL in `src/config.ts` zijn placeholders.
- **Safari handmatig testen:** de eindeloze lus en scroll-snap, vooral op iOS (momentum, inklappende balken). Playwright-WebKit start niet op deze macOS-versie.
- **Eigen domein:** pas dan `site` in `astro.config.mjs` aan en zet de DNS bij de registrar.
- **#15 "Over":** zodra er een ontwerp is. Dan linken de knop Expertise en het persoonsicoon in de pil daarheen.
