import { getEntry, type CollectionEntry } from 'astro:content';
import { getCases } from './cases';

export type About = CollectionEntry<'about'>['data'];
export type Service = About['services']['items'][number];

/** De inhoud van de pagina "Over" in één taal (about/<taal>.yml). */
export async function getAbout(locale: string): Promise<About> {
  const entry = await getEntry('about', locale);
  if (!entry) {
    throw new Error(
      `Over (${locale}): src/content/about/${locale}.yml ontbreekt.`,
    );
  }

  // Een klant linkt naar zijn case: een typfout in het CMS breekt de build, niet de link.
  const slugs = new Set((await getCases(locale)).map((c) => c.data.slug));
  for (const { name, case: slug } of entry.data.clients.items) {
    if (slug && !slugs.has(slug)) {
      throw new Error(
        `Over (${locale}): klant "${name}" verwijst naar onbekende case "${slug}".`,
      );
    }
  }

  return entry.data;
}
