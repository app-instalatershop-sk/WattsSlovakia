/**
 * Pohyb viazaný na rolovanie (DESIGN.md kap. 16.1). Knižnica Motion, jedna krivka, krátke vzdialenosti.
 *
 *  data-reveal            prvok sa pri vstupe do okna zdvihne a zjaví
 *  data-reveal-group      jeho deti prídu odstupňovane po 70 ms
 *  data-parallax="0.12"   prvok sa pri rolovaní jemne posúva (podiel z výšky rodiča)
 *  data-otacaj="-4 3"     prvok sa pri prechode sekciou pootočí z prvého uhla na druhý (stupne)
 *  data-rozvin            premenná --rozvin ide s rolovaním od 0 po 1 a položky <li>, ku ktorým
 *                         dorazila, dostanú triedu is-on (rúra pri krokoch pokládky)
 *  data-mys               prvok dostáva --mx a --my (−1 až 1) podľa polohy myši; len pri myši
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

  document.querySelectorAll<HTMLElement>('[data-otacaj]:not([data-done])').forEach((el) => {
    el.dataset.done = '1';
    const [od = -4, po = 3] = (el.dataset.otacaj ?? '').split(' ').map(Number);
    const target = (el.closest('section') as HTMLElement | null) ?? el;
    scroll(animate(el, { rotate: [od, po] }, { ease: 'linear' }), {
      target,
      offset: ['start end', 'end start'],
    });
  });

  // Myš: prvok dostane --mx a --my od −1 po 1 podľa polohy kurzora. Len pri myši, nie pri dotyku.
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll<HTMLElement>('[data-mys]:not([data-mys-on])').forEach((el) => {
      el.dataset.mysOn = '1';
      let snimka = 0;
      el.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(snimka);
        snimka = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(snimka);
        el.style.setProperty('--mx', '0');
        el.style.setProperty('--my', '0');
      });
    });
  }

  document.querySelectorAll<HTMLElement>('[data-rozvin]:not([data-done])').forEach((wrap) => {
    wrap.dataset.done = '1';
    const items = Array.from(wrap.querySelectorAll<HTMLElement>('li'));
    wrap.classList.add('is-ready');
    scroll((p: number) => {
      wrap.style.setProperty('--rozvin', p.toFixed(4));
      const dosah = p * wrap.offsetHeight;
      items.forEach((li) => li.classList.toggle('is-on', dosah >= li.offsetTop + 4));
    }, { target: wrap, offset: ['start 80%', 'end 55%'] });
  });
}

init();
document.addEventListener('astro:page-load', init);
