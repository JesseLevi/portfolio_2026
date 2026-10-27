import { getEntry, type CollectionEntry } from 'astro:content';

export type About = CollectionEntry<'about'>['data'];
export type Service = About['services'][number];
export type Client = About['clients'][number];

/** De inhoud van de pagina "Over" in één taal (about/<taal>.yml). */
export async function getAbout(locale: string): Promise<About> {
  const entry = await getEntry('about', locale);
  if (!entry) {
    throw new Error(
      `Over (${locale}): src/content/about/${locale}.yml ontbreekt.`,
    );
  }
  return entry.data;
}
