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

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const drawer = getDrawer();
  if (!drawer) return;

  if (target.closest('[data-open-contact]')) {
    event.preventDefault();
    if (!drawer.open) {
      drawer.showModal();
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
