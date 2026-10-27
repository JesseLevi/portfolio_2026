// Pagina "Over": de lokale tijd in de statusregel en het licht in de pillen dat de cursor volgt.

const timeFormat = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

let clock: number | undefined;

function startClock(el: HTMLElement) {
  const template = el.dataset.template!;
  const tick = () => {
    el.textContent = ` · ${template.replace('{time}', timeFormat.format(new Date()))}`;
  };
  tick();
  el.hidden = false;
  // Op de volgende hele minuut bijwerken, daarna elke minuut.
  const now = new Date();
  clock = window.setTimeout(
    () => {
      tick();
      clock = window.setInterval(tick, 60_000);
    },
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds(),
  );
}

// Alleen met muis of trackpad, en niet bij reduced motion: dan blijft het licht op zijn plek.
function followPointer(card: HTMLElement) {
  const pill = card.querySelector<HTMLElement>('[data-pill]');
  if (!pill) return;
  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = pill.getBoundingClientRect();
    pill.style.setProperty(
      '--pill-x',
      `${((e.clientX - r.left) / r.width) * 100}%`,
    );
    pill.style.setProperty(
      '--pill-y',
      `${((e.clientY - r.top) / r.height) * 100}%`,
    );
  });
  card.addEventListener('pointerleave', () => {
    pill.style.removeProperty('--pill-x');
    pill.style.removeProperty('--pill-y');
  });
}

function initAbout() {
  const time = document.querySelector<HTMLElement>('[data-local-time]');
  if (time) startClock(time);

  if (
    matchMedia('(pointer: fine)').matches &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document
      .querySelectorAll<HTMLElement>('[data-service-card]')
      .forEach(followPointer);
  }
}

function stopClock() {
  window.clearTimeout(clock);
  window.clearInterval(clock);
}

// Eén keer registreren (een module-script draait één keer, ook met <ClientRouter />).
document.addEventListener('astro:page-load', initAbout);
document.addEventListener('astro:before-swap', stopClock);
