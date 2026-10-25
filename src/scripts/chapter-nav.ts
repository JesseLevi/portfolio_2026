// Gedrag van de hoofdstuk-indicator.
// Zichtbaar zodra het eerste hoofdstuk het midden van de viewport bereikt (de hero is dan
// voorbij); weer weg als het eerste blok onder het midden terugzakt. Actief is het blok
// dat het midden bereikt heeft en als laatste begon.

let cleanup: (() => void) | null = null;

function init() {
  cleanup?.();
  cleanup = null;

  const nav = document.querySelector<HTMLElement>('[data-chapter-nav]');
  if (!nav) return;
  const links = [
    ...nav.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]'),
  ];
  const sections = links.map((a) =>
    document.getElementById(decodeURIComponent(a.hash.slice(1))),
  );
  if (sections.some((s) => !s)) return;

  // Actief = het laatste blok waarvan de bovenrand op of boven het midden ligt.
  const render = () => {
    const mid = window.innerHeight / 2;
    let active = -1;
    sections.forEach((s, i) => {
      if (s!.getBoundingClientRect().top <= mid) active = i;
    });
    nav.dataset.visible = String(active >= 0);
    links.forEach((a, i) => {
      a.dataset.active = String(i === active);
      if (i === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  // De observer (lijn op het midden) vangt layoutwijzigingen en gewone scrolls op; de
  // scroll-listener dekt sprongen waarbij een blok van boven naar onder het midden gaat
  // zonder de lijn te kruisen (de observer meldt dat niet).
  const observer = new IntersectionObserver(render, {
    rootMargin: '-50% 0px -50% 0px',
  });
  sections.forEach((s) => observer.observe(s!));
  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  render();

  const onClick = (e: MouseEvent) => {
    const i = links.indexOf(e.currentTarget as HTMLAnchorElement);
    e.preventDefault();
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    sections[i]!.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'center',
    });
  };
  links.forEach((a) => a.addEventListener('click', onClick));

  cleanup = () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    links.forEach((a) => a.removeEventListener('click', onClick));
  };
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
});

export {};
