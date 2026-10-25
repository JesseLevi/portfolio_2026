// Scrollgedrag van Home (#8): de actieve casetitel is de titel op de snaplijn
// (de plek waar de eerste titel bij het laden staat, direct onder de intro).
// CSS doet het snappen (html[data-home-snap]); dit script meet de introhoogte,
// bepaalt de actieve titel en wisselt paneel, kleur en aria mee.
//
// Haakpunten voor #13 en #14: getItems(), getActiveIndex(), setActive(i),
// scrollToItem(i) en het document-event `home-active` (detail: { index, slug }).

const SNAP_ATTR = 'data-home-snap';
const REDUCED = '(prefers-reduced-motion: reduce)';

export interface HomeItem {
  index: number;
  slug: string;
  color: string;
  /** <li> in de titellijst. */
  title: HTMLElement;
  /** Titel-link in de lijst (het toetsenbordpad). */
  link: HTMLAnchorElement | null;
  /** Afbeeldingslink in het paneel. */
  panel: HTMLElement | null;
}

let list: HTMLElement | null = null;
let panelRoot: HTMLElement | null = null;
let introEl: HTMLElement | null = null;
let activeIndex = -1;
let pending: number | null = null;
let pendingTimer: number | undefined;
let cleanup: (() => void) | null = null;

/** Alle cases, gesorteerd op index. */
export function getItems(): HomeItem[] {
  if (!list) return [];
  return [...list.querySelectorAll<HTMLElement>(':scope > li[data-index]')].map(
    (title) => {
      const slug = title.dataset.case ?? '';
      return {
        index: Number(title.dataset.index),
        slug,
        color: title.dataset.color ?? '',
        title,
        link: title.querySelector('a'),
        panel:
          panelRoot?.querySelector<HTMLElement>(
            `a[data-case="${CSS.escape(slug)}"]`,
          ) ?? null,
      };
    },
  );
}

export function getActiveIndex(): number {
  return activeIndex;
}

/** Hoogte van de intro = y van de snaplijn (viewportcoördinaat). */
function snapLine(): number {
  return introEl?.getBoundingClientRect().height ?? 0;
}

/** Maak case `index` actief: lijst, paneel, kleur, aria. Scrolt niet. */
export function setActive(index: number): void {
  const items = getItems();
  const next = items.find((i) => i.index === index);
  if (!next || index === activeIndex) return;
  activeIndex = index;
  for (const item of items) {
    const on = item === next;
    item.title.toggleAttribute('data-active', on);
    if (item.panel) {
      item.panel.toggleAttribute('data-active', on);
      // Het paneel is geen tabstop (de titel is het toetsenbordpad) en
      // alleen de zichtbare afbeelding hoort in de toegankelijkheidsboom.
      item.panel.setAttribute('tabindex', '-1');
      if (on) item.panel.removeAttribute('aria-hidden');
      else item.panel.setAttribute('aria-hidden', 'true');
    }
  }
  if (next.color) panelRoot?.style.setProperty('--panel-color', next.color);
  document.dispatchEvent(
    new CustomEvent('home-active', { detail: { index, slug: next.slug } }),
  );
}

/** Scrol titel `index` naar de snaplijn. */
export function scrollToItem(index: number, smooth = true): void {
  const item = getItems().find((i) => i.index === index);
  if (!item) return;
  const top =
    item.title.getBoundingClientRect().top + window.scrollY - snapLine();
  const reduced = window.matchMedia(REDUCED).matches;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: smooth && !reduced ? 'smooth' : 'auto',
  });
}

/** Index van de titel met de bovenkant het dichtst bij de snaplijn. */
function closestIndex(): number {
  const line = snapLine();
  let best = 0;
  let bestDist = Infinity;
  for (const item of getItems()) {
    const d = Math.abs(item.title.getBoundingClientRect().top - line);
    if (d < bestDist) {
      bestDist = d;
      best = item.index;
    }
  }
  return best;
}

function setup(): () => void {
  const root = document.documentElement;
  const items = getItems();
  const last = items[items.length - 1]?.title;

  // Introhoogte en hoogte van het laatste item als CSS variables (de intro is op
  // mobiel variabel). Het eerste bepaalt scroll-margin-top, beide samen de
  // onderruimte waarmee de laatste titel de snaplijn kan bereiken.
  const measure = () => {
    root.style.setProperty('--intro-h', `${introEl?.offsetHeight ?? 0}px`);
    root.style.setProperty('--last-h', `${last?.offsetHeight ?? 0}px`);
  };
  measure();
  const ro = new ResizeObserver(measure);
  if (introEl) ro.observe(introEl);
  if (last) ro.observe(last);
  root.setAttribute(SNAP_ATTR, '');

  const update = () => {
    if (pending === null) setActive(closestIndex());
  };
  const endPending = () => {
    pending = null;
    window.clearTimeout(pendingTimer);
    update();
  };

  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };

  // Tab op een titel: actief maken en naar de snaplijn scrollen. Muisfocus (klik)
  // doet niets: de klik opent de case.
  const onFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    const li = target.closest<HTMLElement>('li[data-index]');
    if (!li || !list?.contains(li) || !target.matches(':focus-visible')) return;
    const index = Number(li.dataset.index);
    pending = index;
    window.clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(endPending, 900);
    setActive(index);
    scrollToItem(index);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scrollend', endPending);
  window.addEventListener('resize', onScroll);
  list?.addEventListener('focusin', onFocusIn);

  activeIndex = -1;
  setActive(closestIndex());

  const currentList = list;
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('scrollend', endPending);
    window.removeEventListener('resize', onScroll);
    currentList?.removeEventListener('focusin', onFocusIn);
    ro.disconnect();
    cancelAnimationFrame(raf);
    window.clearTimeout(pendingTimer);
    root.removeAttribute(SNAP_ATTR);
    root.style.removeProperty('--intro-h');
    root.style.removeProperty('--last-h');
    pending = null;
    activeIndex = -1;
    list = panelRoot = introEl = null;
  };
}

function teardown() {
  cleanup?.();
  cleanup = null;
}

function init() {
  teardown();
  list = document.querySelector<HTMLElement>('[data-case-list]');
  panelRoot = document.querySelector<HTMLElement>('[data-case-panel]');
  introEl = document.querySelector<HTMLElement>('[data-home-intro]');
  if (!list || !panelRoot) return;
  cleanup = setup();
}

// Eén keer registreren (een module-script draait één keer, ook met <ClientRouter />).
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
