import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Toegankelijkheidstest (axe) op de belangrijkste staten. Draait mee met `pnpm screenshot`,
// of los met `pnpm a11y` (bouw eerst met `pnpm build`).

/** Bewuste uitzondering: grijze tekst blijft #949494 (zie CLAUDE.md, "Ontwerpbeslissingen"). */
const MUTED = '#949494';

async function scan(page: Page) {
  // Wacht op de eindstaat: entree-animaties maken tekst kort lichter dan hij is. Alleen
  // lopende, eindige animaties op de gewone tijdlijn: oneindige (de pulserende statusstip) en
  // scroll-gestuurde (de veil van de lus op Home) raken nooit klaar.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === 'running' &&
            a.timeline === document.timeline &&
            a.effect?.getComputedTiming().endTime !== Infinity,
        )
        .map((a) => a.finished),
    ),
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();

  // `color-contrast` blijft aan voor alles behalve elementen met voorgrondkleur #949494.
  // Een rule kan niet per kleur worden uitgesloten, dus filteren we de nodes na afloop.
  return violations
    .map((v) =>
      v.id === 'color-contrast'
        ? {
            ...v,
            nodes: v.nodes.filter(
              (n) =>
                !n.any.some(
                  (c) =>
                    (c.data as { fgColor?: string } | null)?.fgColor === MUTED,
                ),
            ),
          }
        : v,
    )
    .filter((v) => v.nodes.length > 0);
}

/** Structuur: één h1, landmarks, alt-teksten. */
async function expectStructure(page: Page) {
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  // Elke <nav> heeft een eigen naam (de case heeft er twee: hoofdnavigatie en hoofdstukken).
  await expect(page.locator('nav[data-nav-pill]')).toHaveCount(1);
  await expect(page.locator('nav:not([aria-label])')).toHaveCount(0);
  const missingAlt = await page.locator('img:not([alt])').count();
  expect(missingAlt, 'img zonder alt-attribuut').toBe(0);
}

const pages = [
  { name: 'home', url: '/' },
  { name: 'case', url: '/werk/suitsupply' },
  { name: 'over', url: '/over' },
  { name: '404', url: '/404' },
];

for (const { name, url } of pages) {
  test(`a11y ${name}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await expectStructure(page);
    expect(await scan(page)).toEqual([]);
  });
}

test('a11y contact-drawer open', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('nav [data-open-contact]').click();
  const drawer = page.locator('dialog#contact-drawer');
  await expect(drawer).toBeVisible();
  // Wacht tot de openingsanimatie klaar is (contrastmeting op de eindkleur).
  await expect(drawer).toHaveCSS('opacity', '1');
  await expectStructure(page);
  expect(await scan(page)).toEqual([]);
});
