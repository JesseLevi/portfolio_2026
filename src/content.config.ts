import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = '#efefef';

const color = z
  .string()
  .regex(HEX_COLOR, 'Gebruik een hexkleur als #efefef')
  .default(DEFAULT_COLOR);

const fit = z.enum(['contained', 'full-bleed']).default('contained');

const cases = defineCollection({
  // Eén YAML-bestand per case, per taal in een map: cases/nl/<slug>.yml.
  // Het id wordt `nl/<slug>`; getCases(locale) filtert daarop.
  loader: glob({
    pattern: '*/*.yml',
    base: './src/content/cases',
    generateId: ({ entry }) => entry.replace(/\.yml$/, ''),
  }),
  schema: ({ image }) => {
    const pair = z.object({ image: image(), alt: z.string() });

    const blocks = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('image'),
        chapter: z.string(),
        image: image(),
        alt: z.string(),
        fit,
        color,
        caption: z.string().optional(),
      }),
      z.object({
        type: z.literal('double'),
        chapter: z.string(),
        left: pair,
        right: pair,
        fit,
        color,
        caption: z.string().optional(),
      }),
      z.object({
        type: z.literal('text'),
        chapter: z.string(),
        // Platte tekst; alinea's gescheiden door een lege regel.
        body: z.string(),
      }),
    ]);

    return z.object({
      title: z.string(),
      // Gelijk aan de bestandsnaam; getCases() controleert dat.
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      order: z.number(),
      agency: z.string(),
      // Meerregelige platte tekst; alinea's gescheiden door een lege regel.
      work: z.string(),
      hero: z.object({
        image: image(),
        alt: z.string(),
        // Ook de kleur van het paneel op Home.
        color,
      }),
      blocks: z.array(blocks),
    });
  },
});

const about = defineCollection({
  // Eén YAML-bestand per taal: about/nl.yml. Het id is de taal.
  loader: glob({
    pattern: '*.yml',
    base: './src/content/about',
    generateId: ({ entry }) => entry.replace(/\.yml$/, ''),
  }),
  schema: () => {
    const text = z.object({ title: z.string(), body: z.string() });

    return z.object({
      // Statuspil boven de kop.
      status: z.string(),
      // De kop: zwart, met de ondertitel in grijs erachter.
      title: z.string(),
      subtitle: z.string(),
      clients: z.object({
        label: z.string(),
        // `case` is de slug van een case; dan linkt de naam ernaartoe (getAbout() controleert hem).
        items: z.array(
          z.object({ name: z.string(), case: z.string().optional() }),
        ),
      }),
      services: z.object({
        title: z.string(),
        items: z.array(
          z.object({
            title: z.string(),
            body: z.string(),
            deliverables: z.array(z.string()),
            // Kleur van het blok achter het fragment.
            color,
            // Welk levend UI-fragment in het blok staat (code, geen upload).
            demo: z.enum(['product', 'web', 'brand']),
          }),
        ),
      }),
      process: z.object({ title: z.string(), steps: z.array(text) }),
      about: z.object({
        title: z.string(),
        body: z.string(),
        facts: z.array(z.object({ label: z.string(), value: z.string() })),
      }),
      closing: text,
    });
  },
});

export const collections = { cases, about };
