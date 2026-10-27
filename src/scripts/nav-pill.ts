// Gedrag van de nav-pil: één cirkel schuift (transform + width) naar het doel-item,
// het label van het actieve item klapt uit (CSS, via data-active).
// De doelpositie wordt uit de eindmaten berekend, niet uit de lopende animatie.

const PAD = 8; // padding van de pil
const GAP = 8; // gap tussen items
const ICON = 16;
const PAD_ACTIVE = 12;
const SIZE_INACTIVE = 32;

type Id = 'home' | 'about' | 'contact';

let drawerOpen = false;
let hovered: Id | null = null;
let render: (() => void) | null = null;

// Home is alleen actief op `/`, Over op `/over`; op een case staat geen item aan,
// zodat Home een gewone link terug is (Figma 6166:24666).
const pageId = (): Id | null => {
  const path = location.pathname.replace(/\/$/, '') || '/';
  return path === '/' ? 'home' : path === '/over' ? 'about' : null;
};
const activeId = (): Id | null => (drawerOpen ? 'contact' : pageId());

function setup(nav: HTMLElement) {
  const circle = nav.querySelector<HTMLElement>('[data-nav-circle]')!;
  const items = [...nav.querySelectorAll<HTMLElement>('[data-nav-item]')];
  const ids = items.map((el) => el.dataset.navItem as Id);

  // Natuurlijke labelbreedte (incl. 4px links); scrollWidth negeert de 0fr-kolom.
  let labelWidth: Record<string, number> = {};
  const measure = () => {
    labelWidth = Object.fromEntries(
      items.map((el) => [
        el.dataset.navItem!,
        el.querySelector<HTMLElement>('[data-nav-label]')!.scrollWidth,
      ]),
    );
  };

  const widthOf = (id: Id, active: Id | null) =>
    id === active ? PAD_ACTIVE * 2 + ICON + labelWidth[id] : SIZE_INACTIVE;

  const place = (target: Id | null, active: Id | null) => {
    // Geen doel: de cirkel vervaagt op zijn plek.
    // Uit het niets: eerst zonder animatie op het doel zetten, dan alleen invagen.
    const hidden = circle.style.opacity === '0';
    circle.style.opacity = target ? '1' : '0';
    if (!target) return;
    let x = PAD;
    for (const id of ids) {
      if (id === target) break;
      x += widthOf(id, active) + GAP;
    }
    if (hidden) circle.style.transitionProperty = 'opacity';
    circle.style.width = `${widthOf(target, active)}px`;
    circle.style.transform = `translateX(${x}px)`;
    if (hidden) {
      void circle.offsetWidth;
      circle.style.transitionProperty = '';
    }
  };

  const apply = () => {
    const active = activeId();
    for (const el of items) {
      const id = el.dataset.navItem;
      const on = id === active;
      el.dataset.active = String(on);
      if (id === 'home' || id === 'about') {
        if (on) el.setAttribute('aria-current', 'page');
        else el.removeAttribute('aria-current');
      } else if (id === 'contact') {
        // Geen `page`: Contact is een knop, geen pagina.
        if (on) el.setAttribute('aria-current', 'true');
        else el.removeAttribute('aria-current');
      }
    }
    place(hovered ?? active, active);
  };

  const applyInstant = () => {
    circle.style.transition = 'none';
    apply();
    void circle.offsetWidth;
    circle.style.transition = '';
  };

  measure();
  applyInstant();
  void document.fonts.ready.then(() => {
    measure();
    applyInstant();
  });

  items.forEach((el) => {
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovered = el.dataset.navItem as Id;
      apply();
    });
  });
  nav.addEventListener('pointerleave', () => {
    hovered = null;
    apply();
  });

  return apply;
}

function init() {
  const nav = document.querySelector<HTMLElement>('[data-nav-pill]');
  if (!nav) return;
  // Bij transition:persist blijft dezelfde <nav> staan: niet opnieuw binden.
  if (nav.dataset.navBound === 'true') {
    render?.();
    return;
  }
  nav.dataset.navBound = 'true';
  render = setup(nav);
}

// Eén keer registreren (een module-script draait één keer, ook met <ClientRouter />).
document.addEventListener('astro:page-load', init);
document.addEventListener('contact-drawer', ((
  e: CustomEvent<{ open: boolean }>,
) => {
  drawerOpen = e.detail.open;
  hovered = null;
  render?.();
}) as EventListener);
