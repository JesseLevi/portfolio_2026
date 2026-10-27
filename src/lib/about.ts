import { getEntry, type CollectionEntry } from 'astro:content';
import { getCases } from './cases';

export type About = CollectionEntry<'about'>['data'];
export type Service = About['services']['items'][number];
export type WorkItem = About['work']['items'][number];

/** De inhoud van de pagina "Over" in één taal (about/<taal>.yml). */
export async function getAbout(locale: string): Promise<About> {
  const entry = await getEntry('about', locale);
  if (!entry) {
    throw new Error(
      `Over (${locale}): src/content/about/${locale}.yml ontbreekt.`,
    );
  }

  // Klanten en kaarten verwijzen naar een case: een typfout in het CMS breekt de build, niet de link.
  const slugs = new Set((await getCases(locale)).map((c) => c.data.slug));
  const refs = [
    ...entry.data.clients.items.map((c) => [c.name, c.case] as const),
    ...entry.data.work.items.map((w) => ['werk', w.case] as const),
  ];
  for (const [from, slug] of refs) {
    if (slug && !slugs.has(slug)) {
      throw new Error(
        `Over (${locale}): "${from}" verwijst naar onbekende case "${slug}".`,
      );
    }
  }

  return entry.data;
}
