// Overgang Home <-> case (#13). De gedeelde elementen zijn het blok
// (`case-block`) en de screenshot (`case-shot`). De naam staat op elke pagina
// op precies één element: op Home op het actieve paneel-item (home-scroll.ts,
// setActive), op de case-pagina op de hero (global.css).
//
// Dit script (op elke pagina geladen via BaseLayout):
// - Home -> case: meldt de slug aan home-scroll (`home-leave`), dat dat item
//   direct actief maakt, ook als de klik op een andere titel was;
// - case -> Home: onthoudt de slug (home-scroll morpht alleen naar die case) en
//   zet de naam van de hero uit als die buiten beeld staat;
// - zet `data-vt="to-case" | "to-home"` op <html> voor de radius-animatie.

const CASE_PATH = /^\/werk\/([^/]+)\/?$/;

let returnSlug: string | null = null;
let transitionDone: Promise<unknown> = Promise.resolve();

/** Slug van de case waar we net vandaan komen (of '' = geen morph), eenmalig. */
export function consumeReturnSlug(): string | null {
  const slug = returnSlug;
  returnSlug = null;
  return slug;
}

/** Voer `fn` uit zodra de lopende overgang (inclusief animaties) klaar is. */
export function afterTransition(fn: () => void): void {
  void transitionDone.then(fn);
}

document.addEventListener('astro:before-swap', (e) => {
  transitionDone = e.viewTransition.finished.catch(() => undefined);
});

document.addEventListener('astro:before-preparation', (e) => {
  const { to } = e;
  returnSlug = null;
  const hero = document.querySelector<HTMLElement>('[data-case-hero]');
  if (hero) {
    // We verlaten een case. Staat de hero buiten beeld, dan geen morph.
    const r = hero.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    if (!visible) hero.setAttribute('data-vt-off', '');
    if (to.pathname === '/') {
      returnSlug = visible ? (hero.dataset.case ?? '') : '';
    }
    return;
  }
  const match = CASE_PATH.exec(to.pathname);
  if (match) {
    document.dispatchEvent(
      new CustomEvent('home-leave', { detail: { slug: match[1] } }),
    );
  }
});

document.addEventListener('astro:after-swap', () => {
  document.documentElement.dataset.vt = document.querySelector(
    '[data-case-hero]',
  )
    ? 'to-case'
    : 'to-home';
});
