// Eenmalig script: genereert public/og.png, favicon.svg, favicon-32.png en apple-touch-icon.png
// uit src/assets/avatar.png. De uitvoer staat in de repo; draai dit alleen als de avatar of de tekst wijzigt.
//   INTER_MEDIUM=/pad/naar/Inter-Medium.ttf node scripts/make-brand-assets.mjs
// Zonder INTER_MEDIUM valt de tekst terug op een systeemfont (sans-serif).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const interPath = process.env.INTER_MEDIUM;
// sharp is een dependency van Astro en niet direct van dit project: laad hem via Astro.
const fromAstro = createRequire(
  createRequire(import.meta.url).resolve('astro/package.json'),
);
const sharp = fromAstro('sharp');

const avatarPath = 'src/assets/avatar.png';
mkdirSync('public', { recursive: true });

// --- OG-afbeelding 1200x630 ---
const AV = 280;
const circle = (size, extra = '') =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" ${extra}/></svg>`,
  );
// Avatar op een witte schijf, bijgesneden tot een cirkel, met de ring van de site (#f2f2f2).
const avatar = await sharp(avatarPath)
  .resize(AV, AV)
  .flatten({ background: '#ffffff' })
  .composite([{ input: circle(AV), blend: 'dest-in' }])
  .png()
  .toBuffer();
const ring = circle(AV, 'fill="none" stroke="#f2f2f2" stroke-width="2"');
// Tekst: met INTER_MEDIUM worden de glyphs als paden getekend (opentype.js, geen systeemfont nodig);
// zonder valt hij terug op een SVG-<text> in een systeemfont.
let font = null;
if (interPath) {
  const { default: opentype } = await import('opentype.js');
  font = opentype.loadSync(interPath);
}
const line = (content, size, color, y) => {
  const body = font
    ? `<path fill="${color}" d="${font.getPath(content, 0, size, size).toPathData(2)}"/>`
    : `<text y="${size}" font-family="sans-serif" font-weight="500" font-size="${size}" fill="${color}">${content}</text>`;
  return sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="${Math.ceil(size * 1.4)}">${body}</svg>`,
    ),
  )
    .png()
    .toBuffer()
    .then((input) => ({ input, left: 470, top: y }));
};
const name = await line('Jesse Kamps', 84, '#000000', 217);
const role = await line('Designer voor web en identiteit', 42, '#949494', 335);
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: '#ffffff' },
})
  .composite([
    { input: avatar, left: 120, top: 175 },
    { input: ring, left: 120, top: 175 },
    name,
    role,
  ])
  .png()
  .toFile('public/og.png');

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
