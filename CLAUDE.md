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
- De frame "About" (`6169:27104`) is eigenlijk de **mobiele case-pagina**. Een pagina "Over" is nog niet ontworpen.
- De mockups in de frames worden op de site gewone afbeeldingen.
- **De Figma wordt nog bijgewerkt en gaat altijd voor.** Meet bij elk ticket opnieuw; maten in issues kunnen verouderd zijn (de avatar-ring is bijvoorbeeld `#f2f2f2` geworden).

## Afspraken in de code

- Live: https://jessekamps.vercel.app (Vercel-project `portfolio-2026`). De automatisch gegenereerde `*.vercel.app`-URL's per deploy zitten achter Vercel-authenticatie.
- Routes: Home `/`, case `/werk/<slug>`. Engels later onder `/en/...`.
- Inter 4 staat op `font-optical-sizing: none`, anders is grote tekst smaller dan in Figma.
- `BaseLayout` heeft de props `title`, `description` en `noindex`, plus een slot `head`. `NavPill` en `ContactDrawer` staan al in de layout; pagina's plaatsen ze niet zelf.
- Elk element met het attribuut `data-open-contact` opent de contact-drawer.
- Screenshots in parallelle worktrees: draai `scratchpad/shot.sh` van de orchestrator (een lock op poort 4329), niet `pnpm screenshot` direct.

## Ontwerpbeslissingen (Jesse, 2026-10-25)

- Grijze tekst blijft `#949494`, ook bij kleine tekst.
- Blokratio 5:3. Een dubbel blok is een 5:3-container met twee kolommen en 8px gap.
- Screenshot: radius 8 en vaste schaduw, overal hetzelfde (niet meeschalen).
- **Home:** de lijst met casetitels is één blok, zo breed als de breedste titel, gecentreerd in de linkerkolom. De intro (avatar, naam, knoppen) lijnt links uit op dat blok.
- **Case:** de titel staat altijd gecentreerd ten opzichte van de viewport. De meta-kolom loopt van de linkerkant van de titel tot de rechterrand van de container.
- Tekstblok: volle breedte, links uitgelijnd, 16px van de rand.
- Kleur is in te stellen per blok (`color`). De kleur van de hero is ook de kleur van het paneel op Home.
- De knop Expertise en het persoonsicoon in de nav linken voorlopig nergens heen; de pagina "Over" komt later.
- Drawer op mobiel: hetzelfde paneel als op desktop, op elke rand 16px vrij.
- Geen eindeloze lus op touch (2026-10-25): op iOS Safari ging er te veel mis. De lus staat alleen aan bij `pointer: fine`.

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
