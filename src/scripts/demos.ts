// Levende UI-fragmenten op de pagina "Over" (CSS: src/styles/demos.css).
// Een fragment speelt één keer af zodra het grotendeels in beeld is; daarna opnieuw bij
// hover (muis) of een tik. Bij reduced motion zet het script niets: dan staat de eindstaat er.

type State = 'idle' | 'build' | 'aim' | 'press' | 'done';

// Moment (ms na de start) waarop elke staat ingaat.
const TIMELINE: [State, number][] = [
  ['build', 60],
  ['aim', 1300],
  ['press', 2150],
  ['done', 2330],
];

let cleanup: (() => void) | null = null;

function init() {
  cleanup?.();
  cleanup = null;

  const stages = [
    ...document.querySelectorAll<HTMLElement>('[data-demo-stage]'),
  ];
  if (!stages.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const timers = new Set<number>();
  const playing = new WeakSet<HTMLElement>();

  const demoOf = (stage: HTMLElement) =>
    stage.querySelector<HTMLElement>('[data-demo]')!;

  // Zonder animatie terug naar het begin.
  const reset = (demo: HTMLElement) => {
    demo.dataset.instant = '';
    demo.dataset.state = 'idle';
    void demo.offsetWidth;
    delete demo.dataset.instant;
  };

  const play = (demo: HTMLElement) => {
    if (playing.has(demo)) return;
    playing.add(demo);
    reset(demo);
    for (const [state, at] of TIMELINE) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        demo.dataset.state = state;
        if (state === 'done') playing.delete(demo);
      }, at);
      timers.add(id);
    }
  };

  stages.forEach((stage) => reset(demoOf(stage)));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        play(demoOf(entry.target as HTMLElement));
      }
    },
    { threshold: 0.6 },
  );
  stages.forEach((stage) => observer.observe(stage));

  // Opnieuw afspelen: muis erop, of tikken. Pas als het fragment al eens gespeeld heeft.
  const replay = (e: PointerEvent) => {
    const stage = e.currentTarget as HTMLElement;
    const demo = demoOf(stage);
    if (demo.dataset.state !== 'done') return;
    if (e.type === 'pointerenter' && e.pointerType !== 'mouse') return;
    play(demo);
  };
  stages.forEach((stage) => {
    stage.addEventListener('pointerenter', replay);
    stage.addEventListener('pointerup', replay);
  });

  cleanup = () => {
    observer.disconnect();
    timers.forEach((id) => window.clearTimeout(id));
    stages.forEach((stage) => {
      stage.removeEventListener('pointerenter', replay);
      stage.removeEventListener('pointerup', replay);
    });
  };
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
});

export {};
