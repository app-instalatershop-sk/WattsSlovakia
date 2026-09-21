/**
 * Pohyb viazaný na rolovanie (DESIGN.md kap. 16.1). Knižnica Motion, jedna krivka, krátke vzdialenosti.
 *
 *  data-reveal            prvok sa pri vstupe do okna zdvihne a zjaví
 *  data-reveal-group      jeho deti prídu odstupňovane po 70 ms
 *  data-parallax="0.12"   prvok sa pri rolovaní jemne posúva (podiel z výšky rodiča)
 *
 * Bez JavaScriptu je všetko viditeľné (nepriehľadnosť sa sťahuje až tu). Pri „obmedziť pohyb“ sa nič nehýbe.
 */
import { animate, inView, stagger, scroll } from 'motion';

const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];
const MARGIN = '0px 0px -12% 0px';

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-done])').forEach((el) => {
    el.dataset.done = '1';
    el.style.opacity = '0';
    inView(el, () => {
      animate(el, { opacity: [0, 1], y: [18, 0] }, { duration: 0.6, ease: EASE });
    }, { margin: MARGIN });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal-group]:not([data-done])').forEach((group) => {
    group.dataset.done = '1';
    const kids = Array.from(group.children) as HTMLElement[];
    kids.forEach((k) => (k.style.opacity = '0'));
    inView(group, () => {
      animate(kids, { opacity: [0, 1], y: [18, 0] }, { duration: 0.55, delay: stagger(0.07), ease: EASE });
    }, { margin: MARGIN });
  });

  document.querySelectorAll<HTMLElement>('[data-parallax]:not([data-done])').forEach((el) => {
    el.dataset.done = '1';
    const f = parseFloat(el.dataset.parallax ?? '0.12');
    const target = (el.closest('section') as HTMLElement | null) ?? el;
    const shift = Math.round(target.offsetHeight * f);
    scroll(animate(el, { y: [shift * -0.5, shift * 0.5] }, { ease: 'linear' }), {
      target,
      offset: ['start end', 'end start'],
    });
  });
}

init();
document.addEventListener('astro:page-load', init);
