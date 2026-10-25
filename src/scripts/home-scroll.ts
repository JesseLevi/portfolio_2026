// Scrollgedrag van Home (#8): de actieve casetitel is de titel op de snaplijn
// (de plek waar de eerste titel bij het laden staat, direct onder de intro).
// CSS doet het snappen (html[data-home-snap]); dit script meet de introhoogte,
// bepaalt de actieve titel en wisselt paneel, kleur en aria mee.
//
// Haakpunten voor #13 en #14: getItems(), getActiveIndex(), setActive(i),
// scrollToItem(i) en het document-event `home-active` (detail: { index, slug }).
//
// Eindeloze lus (#14, desktop en touch, niet bij reduced motion): achter de
// lijst staat een kopie van intro + lijst (aria-hidden, inert). Staat de kopie
// na het scrollen exact op de plek van de beginstaat, dan springen we direct
// terug naar het origineel; het beeld is identiek, dus de sprong is onzichtbaar.
// getItems() bevat alleen de echte items; de kopieën tellen alleen mee voor
// het bepalen van het actieve item (ze dragen dezelfde data-index).

import { afterTransition, consumeReturnSlug } from './view-transition.ts';

const SNAP_ATTR = 'data-home-snap';
const REDUCED = '(prefers-reduced-motion: reduce)';
const LOOP_ATTR = 'data-home-loop';
const LOOP_QUERY = '(prefers-reduced-motion: no-preference)';
/** Terugval voor browsers zonder `scrollend`. */
const SCROLL_IDLE_MS = 150;
/** Wielafstand voorbij de laatste titel (deel van de viewporthoogte) voor de lus. */
const BRIDGE_THRESHOLD = 0.35;
/** Pauze in de wielinvoer (ms) waarna de opgetelde afstand vervalt. */
const BRIDGE_RESET_MS = 400;
/** Mobiele layout (paneel vast onderin), tot de `lg`-breakpoint. */
const MOBILE_QUERY = '(max-width: 1023px)';

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
/** <li>'s van de kopie-lijst (leeg als de lus uit staat). */
let cloneTitles: HTMLElement[] = [];

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

/** Gedeelde elementen van de overgang Home -> case: het blok en de screenshot. */
function setTransitionNames(panel: HTMLElement, on: boolean) {
  panel.style.viewTransitionName = on ? 'case-block' : '';
  const shot = panel.querySelector<HTMLElement>('[data-shot]');
  if (shot) shot.style.viewTransitionName = on ? 'case-shot' : '';
}

/**
 * Voor een klik op een niet-actieve titel of afbeelding: maak dat item direct
 * actief (zonder fades, anders legt de transitie een halve opacity vast) en
 * scrol het naar de snaplijn, zodat de scrollpositie in de history klopt bij terug.
 */
function onLeave(e: Event) {
  const slug = (e as CustomEvent<{ slug: string }>).detail.slug;
  const target = getItems().find((i) => i.slug === slug);
  if (!target || target.index === activeIndex) return;
  for (const item of getItems()) {
    item.title.style.transition = 'none';
    if (item.panel) item.panel.style.transition = 'none';
  }
  if (panelRoot) panelRoot.style.transition = 'none';
  setActive(target.index);
  scrollToItem(target.index, false);
  void document.body.offsetWidth; // reflow: de stijlwissel gebeurt zonder fade
}

/** Zet data-active op de kopie-titels die bij het actieve item horen. */
function syncCloneActive(): void {
  for (const li of cloneTitles) {
    li.toggleAttribute('data-active', Number(li.dataset.index) === activeIndex);
  }
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
      // View Transition (#13): de namen staan alleen op het actieve item.
      setTransitionNames(item.panel, on);
      // Het paneel is geen tabstop (de titel is het toetsenbordpad) en
      // alleen de zichtbare afbeelding hoort in de toegankelijkheidsboom.
      item.panel.setAttribute('tabindex', '-1');
      if (on) item.panel.removeAttribute('aria-hidden');
      else item.panel.setAttribute('aria-hidden', 'true');
    }
  }
  syncCloneActive();
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
  const titles = [...getItems().map((i) => i.title), ...cloneTitles];
  for (const li of titles) {
    const d = Math.abs(li.getBoundingClientRect().top - line);
    if (d < bestDist) {
      bestDist = d;
      best = Number(li.dataset.index);
    }
  }
  return best;
}

/**
 * Eindeloze lus: plaatst een kopie van intro + lijst achter de lijst en springt
 * na het scrollen terug als de kopie de plek van het origineel heeft bereikt.
 * Geeft de opruimfunctie terug (`restore`: eerst naar het origineel springen).
 */
function enableLoop(): (restore: boolean) => void {
  if (!list || !introEl || !list.parentElement) return () => {};
  const column = list.parentElement;
  const root = document.documentElement;

  const clone = document.createElement('div');
  clone.setAttribute('data-home-loop-clone', '');
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  // Minstens een viewport hoog, zodat de kopie-intro exact op 0 kan komen. lvh:
  // op iOS is de viewport groter zodra de balken inklappen; met svh haalt de
  // scroll dan de beginstaat van de kopie niet en springt de lus nooit terug.
  clone.style.minHeight = '100lvh';

  const introCopy = introEl.cloneNode(true) as HTMLElement;
  introCopy.removeAttribute('data-home-intro');
  const listCopy = list.cloneNode(true) as HTMLElement;
  listCopy.removeAttribute('data-case-list');
  for (const a of listCopy.querySelectorAll('a')) {
    a.setAttribute('tabindex', '-1');
  }
  clone.append(introCopy, listCopy);
  for (const el of clone.querySelectorAll('[data-open-contact]')) {
    el.removeAttribute('data-open-contact');
  }
  column.append(clone);
  cloneTitles = [
    ...listCopy.querySelectorAll<HTMLElement>(':scope > li[data-index]'),
  ];
  root.setAttribute(LOOP_ATTR, '');
  syncCloneActive();

  // Mobiel: boven de kopie-intro horen geen titels. Zodra de laatste titel de
  // snaplijn verlaat, vervaagt de originele lijst; als de kopie-intro de
  // snaplijn bereikt (één titelhoogte later) is hij weg.
  const mobileMq = window.matchMedia(MOBILE_QUERY);
  const list0 = list;
  let fadeRaf = 0;
  const fade = () => {
    fadeRaf = 0;
    const range = getItems().at(-1)?.title.offsetHeight ?? 0;
    const rest = clone.getBoundingClientRect().top - snapLine();
    const opacity =
      mobileMq.matches && range > 0
        ? Math.min(1, Math.max(0, rest / range))
        : 1;
    list0.style.opacity = opacity < 1 ? String(opacity) : '';
  };
  const onFadeScroll = () => {
    if (!fadeRaf) fadeRaf = requestAnimationFrame(fade);
  };
  window.addEventListener('scroll', onFadeScroll, { passive: true });
  mobileMq.addEventListener('change', fade);

  /** Spring terug zodra de kopie op de plek van het origineel staat. */
  const wrap = () => {
    const start = clone.getBoundingClientRect().top + window.scrollY;
    const y = window.scrollY;
    if (y < start - 2) return;
    window.scrollTo({ top: Math.max(0, y - start), behavior: 'instant' });
    fade(); // direct, anders staat het origineel één frame onzichtbaar
  };
  // Van de laatste titel naar de kopie-intro is één scherm (intro + titel). Eén
  // wieltik haalt de halve afstand niet, en dan snapt de browser terug. Daarom
  // scrollen we zelf door naar de kopie, maar pas als de wielafstand omlaag
  // voorbij de laatste titel de drempel haalt: zo snapt de laatste case niet
  // bij de eerste tik al weg. (Bij het event staat scrollY al na de tik; vandaar
  // >= i.p.v. ===.)
  let bridging = false;
  let pull = 0;
  let lastWheel = 0;
  const onWheel = (e: WheelEvent) => {
    if (bridging || e.ctrlKey) return;
    const lastTitle = getItems().at(-1)?.title;
    if (!lastTitle) return;
    const lastSnap =
      lastTitle.getBoundingClientRect().top + window.scrollY - snapLine();
    const start = clone.getBoundingClientRect().top + window.scrollY;
    const y = window.scrollY;
    if (e.deltaY <= 0 || y < lastSnap - 2 || y >= start - 2) {
      pull = 0;
      return;
    }
    if (e.timeStamp - lastWheel > BRIDGE_RESET_MS) pull = 0;
    lastWheel = e.timeStamp;
    const unit =
      e.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;
    pull += e.deltaY * unit;
    if (pull < window.innerHeight * BRIDGE_THRESHOLD) return;
    pull = 0;
    bridging = true;
    window.scrollTo({ top: start, behavior: 'smooth' });
  };
  const endBridge = () => {
    bridging = false;
  };
  window.addEventListener('scrollend', endBridge);
  window.addEventListener('wheel', onWheel, { passive: true });

  let idle: number | undefined;
  const onScrollIdle = () => {
    window.clearTimeout(idle);
    idle = window.setTimeout(() => {
      bridging = false;
      wrap();
    }, SCROLL_IDLE_MS);
  };
  const hasScrollEnd = 'onscrollend' in window;
  if (hasScrollEnd) window.addEventListener('scrollend', wrap);
  else window.addEventListener('scroll', onScrollIdle, { passive: true });

  return (restore) => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scrollend', endBridge);
    window.removeEventListener('scrollend', wrap);
    window.removeEventListener('scroll', onScrollIdle);
    window.clearTimeout(idle);
    window.removeEventListener('scroll', onFadeScroll);
    mobileMq.removeEventListener('change', fade);
    cancelAnimationFrame(fadeRaf);
    list0.style.opacity = '';
    // Sta je op de kopie (zelfde beeld), ga dan eerst naar het origineel.
    if (restore) wrap();
    clone.remove();
    cloneTitles = [];
    root.removeAttribute(LOOP_ATTR);
  };
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

  // Lus aan/uit volgens de media query (ook bij wijzigingen tijdens het gebruik).
  const loopMq = window.matchMedia(LOOP_QUERY);
  let disableLoop: ((restore: boolean) => void) | null = null;
  const syncLoop = () => {
    if (loopMq.matches && !disableLoop) disableLoop = enableLoop();
    else if (!loopMq.matches && disableLoop) {
      disableLoop(true);
      disableLoop = null;
    }
  };
  syncLoop();
  loopMq.addEventListener('change', syncLoop);

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
  document.addEventListener('home-leave', onLeave);

  activeIndex = -1;
  setActive(closestIndex());

  // Terug van een case: alleen morphen naar het paneel van die case. Staat Home
  // bij een ander item (Home-link: begint bovenaan), dan vervalt de morph en
  // blijft er een crossfade over.
  const returning = consumeReturnSlug();
  if (returning !== null) {
    for (const item of getItems()) {
      if (item.panel && item.slug !== returning) {
        setTransitionNames(item.panel, false);
      }
    }
    // Na de overgang horen de namen weer op het actieve item (volgende klik).
    const currentPanel = panelRoot;
    afterTransition(() => {
      if (panelRoot !== currentPanel) return;
      const active = getItems().find((i) => i.index === activeIndex);
      if (active?.panel) setTransitionNames(active.panel, true);
    });
  }

  const currentList = list;
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('scrollend', endPending);
    window.removeEventListener('resize', onScroll);
    currentList?.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('home-leave', onLeave);
    loopMq.removeEventListener('change', syncLoop);
    disableLoop?.(false);
    disableLoop = null;
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
  // Al opgezet bij astro:after-swap voor deze pagina: niet nog eens.
  if (cleanup && list?.isConnected) return;
  teardown();
  list = document.querySelector<HTMLElement>('[data-case-list]');
  panelRoot = document.querySelector<HTMLElement>('[data-case-panel]');
  introEl = document.querySelector<HTMLElement>('[data-home-intro]');
  if (!list || !panelRoot) return;
  cleanup = setup();
}

// Eén keer registreren (een module-script draait één keer, ook met <ClientRouter />).
// Bij navigatie al op astro:after-swap: dat valt nog binnen de update van de
// View Transition, dus de namen van het paneel staan vóór de nieuwe snapshot.
// astro:page-load komt pas daarna (eerste laadbeurt, of als dit script nog niet
// geladen was).
document.addEventListener('astro:after-swap', init);
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', teardown);
