// Positie van de nav-pil op de case-pagina (Figma 6166:24666, annotatie).
// Desktop, bij het laden: het midden van de pil ligt op de onderrand van de hero.
// Na scrollen schuift de pil naar zijn vaste plek (40px van de onderkant); terug
// bovenaan schuift hij weer naar de hero-rand. Elders: --nav-pill-y wordt 0.
// De pil verschuift met `transform: translateY(var(--nav-pill-y))`; de x-centrering
// zit in de `translate`-property (Tailwind), dus de twee botsen niet.
// De eerste positie wordt vóór de eerste paint gezet door het inline script in NavPill.

const DESKTOP = '(min-width: 768px)'; // `md`: vanaf hier is de case-layout desktop
const FIXED_BOTTOM = 40; // vaste plek (md:--nav-pill-bottom)
const HALF = 24; // halve pilhoogte
const SCROLLED = 8; // px scroll vanaf wanneer de pil naar de vaste plek gaat
const DURATION = 450; // iets rustiger dan de 300ms van de pil zelf

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia(DESKTOP);

const nav = () => document.querySelector<HTMLElement>('[data-nav-pill]');

/** Verschuiving omhoog (px) t.o.v. de vaste plek, of 0 bij de fallback. */
function heroOffset(): number {
  const hero = document.querySelector<HTMLElement>('[data-case-hero]');
  if (!hero || !desktop.matches) return 0;
  const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
  const bottom = window.innerHeight - heroBottom - HALF;
  // Hero buiten beeld of te laag: de pil zou onder de vaste plek komen.
  return bottom > FIXED_BOTTOM ? bottom - FIXED_BOTTOM : 0;
}

function set(animate: boolean) {
  const el = nav();
  if (!el) return;
  const y = window.scrollY > SCROLLED ? 0 : heroOffset();
  el.style.transition =
    animate && !reduced.matches
      ? `transform ${DURATION}ms var(--nav-ease)`
      : 'none';
  el.style.setProperty('--nav-pill-y', `${-y}px`);
}

let scrolledBefore = window.scrollY > SCROLLED;
const onScroll = () => {
  const scrolled = window.scrollY > SCROLLED;
  if (scrolled === scrolledBefore) return;
  scrolledBefore = scrolled;
  set(true);
};

// Bij navigatie (pil blijft staan): direct zetten, zonder animatie.
document.addEventListener('astro:after-swap', () => {
  scrolledBefore = false;
  set(false);
});
document.addEventListener('astro:page-load', () => {
  scrolledBefore = window.scrollY > SCROLLED;
  set(false);
});
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => set(false));
