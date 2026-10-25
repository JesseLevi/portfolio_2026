// Eenmalig script: genereert public/og.png, favicon.svg, favicon-32.png en apple-touch-icon.png
// uit src/assets/avatar.png. De uitvoer staat in de repo; draai dit alleen als de avatar of de tekst wijzigt.
//   INTER_MEDIUM=/pad/naar/Inter-Medium.ttf node scripts/make-brand-assets.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const { INTER_MEDIUM } = process.env;
if (!INTER_MEDIUM)
  throw new Error('Zet INTER_MEDIUM op het pad naar Inter-Medium.ttf');
// sharp is een dependency van Astro en niet direct van dit project: laad hem via Astro.
const fromAstro = createRequire(
  createRequire(import.meta.url).resolve('astro/package.json'),
);
const sharp = fromAstro('sharp');

const avatarPath = 'src/assets/avatar.png';
mkdirSync('public', { recursive: true });

// --- OG-afbeelding 1200x630 ---
// De intro van Home (Intro.astro + Avatar.astro) op schaal, maar met de avatar naast de tekst:
// avatar 62 met ring en inner shadows, 16 gap, naam en rol allebei 22px Medium, 6 gap ertussen.
// S volgt uit de breedte: het blok vult de OG tot MARGIN van de randen.
const W = 1200;
const H = 630;
const MARGIN = 120;
const { default: opentype } = await import('opentype.js');
// opentype.loadSync geeft in v2 niets terug: parse de buffer zelf.
const font = opentype.parse(new Uint8Array(readFileSync(INTER_MEDIUM)).buffer);
// Glyph voor glyph met kerning (op 1px): de shaping van opentype.js struikelt over de ccmp-lookups van Inter.
const layout = (content) => {
  let x = 0;
  let prev = null;
  const glyphs = [];
  for (const char of content) {
    const glyph = font.charToGlyph(char);
    if (prev) x += font.getKerningValue(prev, glyph) / font.unitsPerEm;
    glyphs.push([glyph, x]);
    x += glyph.advanceWidth / font.unitsPerEm;
    prev = glyph;
  }
  return { glyphs, width: x };
};
const name = layout('Jesse Kamps');
const role = layout('Designer voor web en identiteit');
const S = (W - 2 * MARGIN) / (62 + 16 + 22 * Math.max(name.width, role.width));
const AV = 62 * S;
const TEXT = 22 * S;
const em = TEXT / font.unitsPerEm;
// line-height: normal = ascender + descender uit hhea.
const lineH = (font.ascender - font.descender) * em;
const textH = lineH + 6 * S + lineH;
const top = (H - AV) / 2;
const textTop = (H - textH) / 2;
const textLeft = MARGIN + AV + 16 * S;
const text = (line, color, y) =>
  `<path fill="${color}" d="${line.glyphs
    .map(([glyph, x]) =>
      glyph
        .getPath(textLeft + x * TEXT, y + font.ascender * em, TEXT)
        .toPathData(2),
    )
    .join('')}"/>`;

const r = AV / 2;
const cx = MARGIN + r;
const cy = top + r;
// Inset box-shadow: een vlak met een cirkelgat (straal r - spread), verschoven en vervaagd, binnen de cirkel.
const inset = (id, y, blur, spread) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(blur * S) / 2}"/></filter>
  <path filter="url(#${id})" clip-path="url(#av)" fill="rgb(0 0 0 / .25)" fill-rule="evenodd"
    d="M${cx - 2 * r} ${cy - 2 * r}h${4 * r}v${4 * r}h${-4 * r}z M${cx} ${cy + y * S - (r - spread * S)}a${r - spread * S} ${r - spread * S} 0 1 0 0.01 0z"/>`;
const avatar = (
  await sharp(avatarPath)
    .resize(Math.round(AV * 2))
    .png()
    .toBuffer()
).toString('base64');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <defs><clipPath id="av"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
  <image href="data:image/png;base64,${avatar}" x="${MARGIN}" y="${top}" width="${AV}" height="${AV}" clip-path="url(#av)"/>
  ${inset('s1', 2, 10, -4)}
  ${inset('s2', 3, 4, -5)}
  <circle cx="${cx}" cy="${cy}" r="${r - S / 2}" fill="none" stroke="#f2f2f2" stroke-width="${S}"/>
  ${text(name, '#000000', textTop)}
  ${text(role, '#949494', textTop + lineH + 6 * S)}
</svg>`;
await sharp(Buffer.from(svg))
  .flatten({ background: '#ffffff' })
  .png()
  .toFile('public/og.png');
console.log(`OG: schaal ${S.toFixed(2)}`);

// --- Favicon ---
const b64 = (await sharp(avatarPath).resize(96, 96).png().toBuffer()).toString(
  'base64',
);
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs><clipPath id="c"><circle cx="48" cy="48" r="48"/></clipPath></defs>
  <circle cx="48" cy="48" r="48" fill="#fff"/>
  <image href="data:image/png;base64,${b64}" width="96" height="96" clip-path="url(#c)"/>
</svg>
`,
);

const round = (size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`,
  );
await sharp(avatarPath)
  .resize(32, 32)
  .composite([{ input: round(32), blend: 'dest-in' }])
  .png()
  .toFile('public/favicon-32.png');

// Apple vult transparantie zwart: witte achtergrond, avatar met marge.
const inner = await sharp(avatarPath).resize(132, 132).png().toBuffer();
await sharp({
  create: { width: 180, height: 180, channels: 3, background: '#ffffff' },
})
  .composite([{ input: inner, left: 24, top: 24 }])
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('Klaar: og.png, favicon.svg, favicon-32.png, apple-touch-icon.png');
