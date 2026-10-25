# portfolio_2026

Portfolio van Jesse Kamps. Live: <https://jessekamps.vercel.app> (elke merge naar `main` deployt naar Vercel).

## Stack

Astro (statische output), Tailwind 4, TypeScript strict, pnpm (Node 22+). Hosting op Vercel.

## Commando's

```sh
pnpm install
pnpm dev          # dev-server
pnpm build        # statische build naar dist/
pnpm preview      # serveert dist/
pnpm lint         # ESLint + Prettier
pnpm typecheck    # astro check
pnpm screenshot   # Playwright-screenshots + a11y-test (eerst pnpm build)
pnpm a11y         # alleen de axe-toegankelijkheidstest
```

## Content

Cases staan als YAML in `src/content/cases/nl/` en worden beheerd via [Pages CMS](https://pagescms.org) (config: `.pages.yml`). Het schema in `src/content.config.ts` en `.pages.yml` lopen altijd gelijk. UI-teksten staan in `src/i18n/`.

## Meer

Afspraken, ontwerpbeslissingen en werkwijze: zie [CLAUDE.md](./CLAUDE.md). De site-URL staat in `astro.config.mjs` (`site`); die wijzigt als er een eigen domein komt. De OG-afbeelding en favicons in `public/` komen uit `scripts/make-brand-assets.mjs`.
