# portfolio_2026

Portfolio van Jesse Kamps, gebouwd vanuit Figma. Stand van zaken: `docs/HANDOFF.md`. Ticketstatus: [GitHub Project](https://github.com/users/JesseLevi/projects/2).

## Stack

- Astro (statische output) + Tailwind, TypeScript strict, pnpm.
- Pages CMS: config in `.pages.yml`, content als bestanden in de repo. Het Astro-collectieschema (zod) en `.pages.yml` lopen altijd gelijk.
- Hosting op Vercel. Afbeeldingen staan in de repo en worden geoptimaliseerd met Astro `<Image>`/`<Picture>`. Video komt later via een URL-veld (Cloudflare Stream/R2).
- Geen Figma-variabelen of tokens: de styling staat in code (Tailwind-config).
- Geen dark mode.
- Alleen Nederlands, maar klaar voor Engels: Astro i18n-routing (`nl` standaard, zonder prefix), content per taal in een map (`cases/nl/`), en alle UI-teksten in `src/i18n/`, nooit hardcoded in componenten.

## Figma

- Bestand `TXNyd3UorTlXBoZJnFutXm`, pagina "Exploration". Sectie Home `6169:28410`, sectie Case `6169:28409`.
- Lees het bestand via de `figma-console`-bridge (`figma_get_status` met `probe: true`, daarna `figma_execute`). **Meet waarden in de nodes** (padding, gap, fontSize, fills, effects). Lees ze niet af van een screenshot.
- De annotaties (`node.annotations`) zijn de spec voor gedrag.
- De frame "About" (`6169:27104`) is eigenlijk de **mobiele case-pagina**. De pagina "Over" heeft geen Figma-frame: die is direct in code gebouwd (2026-10-27).
- De mockups in de frames worden op de site gewone afbeeldingen.
- **De Figma wordt nog bijgewerkt en gaat altijd voor.** Meet bij elk ticket opnieuw; maten in issues kunnen verouderd zijn (de avatar-ring is bijvoorbeeld `#f2f2f2` geworden).

## Afspraken in de code

- Live: https://jessekamps.vercel.app (Vercel-project `portfolio-2026`). De automatisch gegenereerde `*.vercel.app`-URL's per deploy zitten achter Vercel-authenticatie.
- Routes: Home `/`, case `/werk/<slug>`, Over `/over`. Engels later onder `/en/...`.
- Inter 4 staat op `font-optical-sizing: none`, anders is grote tekst smaller dan in Figma.
- `BaseLayout` heeft de props `title`, `description` en `noindex`, plus een slot `head`. `NavPill` en `ContactDrawer` staan al in de layout; pagina's plaatsen ze niet zelf.
- Elk element met het attribuut `data-open-contact` opent de contact-drawer.
- Avatar en contactillustratie zijn SVG's die met `scripts/illustrations/trace.py` uit de PNG's getraceerd zijn, in lagen (hoofd, ogen, damp, been). De animatie-CSS zit in de SVG en begint met de blik naar de bezoeker. De avatar is een `<img>` met via `<picture>` een `-static.svg` bij reduced motion; de contactillustratie staat inline, zodat de animatie bij elk openen van de drawer opnieuw begint. Pas de animatie aan in `scripts/illustrations/*.css` en draai het script opnieuw; bewerk de SVG's niet met de hand. `avatar.png` blijft de bron, ook voor de OG-afbeelding.
- Screenshots in parallelle worktrees: draai `scratchpad/shot.sh` van de orchestrator (een lock op poort 4329), niet `pnpm screenshot` direct.

## Ontwerpbeslissingen (Jesse, 2026-10-25)

- Grijze tekst blijft `#949494`, ook bij kleine tekst.
- Blokratio 5:3. Een dubbel blok zijn twee kolommen met 8px gap, elke helft 4:5 (2026-10-25).
- Screenshot: radius 8 en vaste schaduw, overal hetzelfde (niet meeschalen).
- **Home:** de lijst met casetitels is één blok, zo breed als de breedste titel, gecentreerd in de linkerkolom. De intro (avatar, naam, knoppen) lijnt links uit op dat blok.
- **Case:** de titel staat altijd gecentreerd ten opzichte van de viewport. De meta-kolom loopt van de linkerkant van de titel tot de rechterrand van de container.
- Tekstblok: volle breedte, links uitgelijnd, 16px van de rand.
- Kleur is in te stellen per blok (`color`). De kleur van de hero is ook de kleur van het paneel op Home.
- De knop Expertise linkt naar `/over#diensten`, het persoonsicoon in de nav naar `/over`.
- Drawer op mobiel (onder `lg`): een pull-up panel over de volle breedte, vast aan de onderkant, radius 32 bovenaan, met grip en 20% zwarte waas. Omlaag vegen sluit hem.
- Geen eindeloze lus op touch (2026-10-25): op iOS Safari ging er te veel mis. De lus staat alleen aan bij `pointer: fine`.

## Pagina "Over" (Jesse, 2026-10-27)

- Een gecentreerde marketingpagina in de grammatica van de case-pagina (container 1026, blokken 5:3 en 4:5, de hoofdstuk-indicator). Geen Figma-ontwerp; direct gebouwd. Inhoud in `src/content/about/<taal>.yml` (Pages CMS: "Over").
- Volgorde: kop met belofte en klanten (namen als tekst, ze linken naar de case), diensten (brand, landing, product), "Mijn werkwijze", "Geselecteerd werk", slot "Schuif aan." met de contactillustratie (de lege kruk is de uitnodiging).
- Bij het laden komen de elementen t/m de fold één voor één binnen (CSS, `.enter` in `over.astro`). Verder geen scroll-reveals: de rest van de site heeft die ook niet.
- Alleen per project. Geen beloftes zoals een reactietijd of een gratis kennismaking. Geen cv-feiten (stages, werkgevers).
- De dienstkaarten hebben levende UI-fragmenten (`src/components/about/demos/`, `src/styles/demos.css`, `src/scripts/demos.ts`): opbouwen, de cursor van de site klikt een bediening, het fragment reageert. Eén keer in beeld, opnieuw bij hover of tik; bij reduced motion de eindstaat.
- "Geselecteerd werk" (naar Marvin Schwaibold): kaarten in 4:5 met de hero van de case sterk vervaagd als achtergrond, een donkere shade van onderen en het logo wit met een zachte schaduw. Zonder logo staat de naam er als woordmerk. Logo's in `src/assets/clients/`.

## Toegankelijkheid

- Fallback bij `prefers-reduced-motion` voor snap, lus, cursor en animaties.
- Met Tab door de caselijst wisselt de afbeelding mee.
- De contact-drawer is een native `<dialog>`.
- De eigen cursor alleen bij `pointer: fine`.

## Werkwijze

- Eén PR per ticket. De orchestrator merget (squash) zodra de PR geverifieerd is; Jesse heeft daar volledig mandaat voor gegeven en sluit de issues.
- Board: `Backlog → Ready → In progress → In review → Done`. Een kaart gaat naar "In progress" vóór de code, en naar "In review" pas als er een PR is. Alleen de orchestrator werkt het board bij.
- **Af betekent geverifieerd:**
  - `pnpm lint`, `pnpm typecheck` en `pnpm build` zijn groen in CI;
  - bij UI een Playwright-screenshot op 1440 en 402 naast het Figma-frame.
- Worktrees vertakken van `main`. Draai Playwright-runs na elkaar: parallelle agents delen anders een poort.
- Controleer met `git status` en `git log` dat er echt gecommit is. Een branch zonder PR is niet "in review".
- Geen signed commits en geen zware rulesets.

## Commando's

- `pnpm dev`: dev-server.
- `pnpm build`: statische build naar `dist/`.
- `pnpm preview`: serveert `dist/` (poort 4329 bij `pnpm screenshot`).
- `pnpm lint`: ESLint en `prettier --check`.
- `pnpm format`: Prettier schrijft de opmaak.
- `pnpm typecheck`: `astro check`.
- `pnpm screenshot`: Playwright-screenshots (desktop 1440x900, mobiel 402x874) naar `screenshots/<viewport>/<route>.png`. Bouwt niet zelf: draai eerst `pnpm build`. Extra routes via `SCREENSHOT_ROUTES="/,/cases/x"` of de array in `e2e/screenshots.spec.ts`.
