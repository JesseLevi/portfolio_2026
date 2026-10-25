import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseEntry = CollectionEntry<'cases'>;
export type CaseBlock = CaseEntry['data']['blocks'][number];

/** Alle cases van één taal, gesorteerd op `order`. */
export async function getCases(locale: string): Promise<CaseEntry[]> {
  const entries = await getCollection('cases', ({ id }) =>
    id.startsWith(`${locale}/`),
  );

  for (const entry of entries) {
    const file = entry.id.slice(locale.length + 1);
    if (entry.data.slug !== file) {
      throw new Error(
        `Case ${entry.id}: slug "${entry.data.slug}" moet gelijk zijn aan de bestandsnaam "${file}".`,
      );
    }
  }
  const orders = entries.map((e) => e.data.order);
  if (new Set(orders).size !== orders.length) {
    throw new Error(`Cases (${locale}): 'order' moet uniek zijn.`);
  }

  return entries.sort((a, b) => a.data.order - b.data.order);
}
