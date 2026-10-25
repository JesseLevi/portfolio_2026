// Contact-drawer: één keer geregistreerd op `document`, zodat het blijft werken
// na navigatie met <ClientRouter />. De dialog wordt pas bij het klikken gezocht.

const DRAWER_ID = 'contact-drawer';

const getDrawer = () =>
  document.getElementById(DRAWER_ID) as HTMLDialogElement | null;

// Afspraak met de nav-pil (#5): `contact-drawer` met `detail.open` op document.
const announce = (open: boolean) =>
  document.dispatchEvent(
    new CustomEvent('contact-drawer', { detail: { open } }),
  );

// Mobiel is de drawer een pull-up panel: omlaag vegen sluit hem. Zelfde
// breakpoint als de CSS in ContactDrawer.astro.
const mobile = window.matchMedia('(max-width: 1023px)');
const draggable = new WeakSet<HTMLDialogElement>();

// Per dialog-element één keer; na een navigatie is het een nieuw element.
const enableDrag = (drawer: HTMLDialogElement) => {
  if (draggable.has(drawer)) return;
  draggable.add(drawer);
  const panel = drawer.querySelector<HTMLElement>('.panel');

  let tracking = false;
  let dragging = false;
  let startY = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;

  drawer.addEventListener(
    'touchstart',
    (event) => {
      if (!mobile.matches || event.touches.length !== 1) return;
      // Alleen slepen als de inhoud bovenaan staat; anders scrollt het paneel.
      tracking = (panel?.scrollTop ?? 0) <= 0;
      dragging = false;
      startY = lastY = event.touches[0].clientY;
      lastT = event.timeStamp;
      velocity = 0;
    },
    { passive: true },
  );

  drawer.addEventListener(
    'touchmove',
    (event) => {
      if (!tracking) return;
      const y = event.touches[0].clientY;
      const dy = y - startY;
      if (!dragging) {
        if (dy < -4) tracking = false;
        if (dy <= 4) return;
        dragging = true;
        drawer.dataset.dragging = '';
      }
      event.preventDefault();
      velocity = (y - lastY) / Math.max(1, event.timeStamp - lastT);
      lastY = y;
      lastT = event.timeStamp;
      drawer.style.translate = `0 ${Math.max(0, dy)}px`;
    },
    { passive: false },
  );

  const end = () => {
    tracking = false;
    if (!dragging) return;
    dragging = false;
    // De transitie loopt vanaf de sleeppositie terug naar 0 of door naar dicht.
    delete drawer.dataset.dragging;
    drawer.style.translate = '';
    const dy = lastY - startY;
    if (dy > drawer.offsetHeight * 0.25 || velocity > 0.5) drawer.close();
  };
  drawer.addEventListener('touchend', end);
  drawer.addEventListener('touchcancel', end);
};

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const drawer = getDrawer();
  if (!drawer) return;

  if (target.closest('[data-open-contact]')) {
    event.preventDefault();
    if (!drawer.open) {
      drawer.showModal();
      enableDrag(drawer);
      announce(true);
    }
    return;
  }

  if (!drawer.open) return;

  if (target.closest('[data-close-contact]')) {
    drawer.close();
  } else if (target === drawer) {
    // Een klik op de backdrop landt op de dialog zelf, buiten het paneel.
    const r = drawer.getBoundingClientRect();
    const inside =
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom;
    if (!inside) drawer.close();
  }
});

// `close` bubbelt niet: luister in de capture-fase. Dekt Esc, knop en backdrop.
document.addEventListener(
  'close',
  (event) => {
    if ((event.target as Element | null)?.id === DRAWER_ID) announce(false);
  },
  true,
);

// Navigatie met open drawer: de nieuwe pagina heeft een gesloten dialog.
document.addEventListener('astro:before-swap', () => {
  if (getDrawer()?.open) announce(false);
});
