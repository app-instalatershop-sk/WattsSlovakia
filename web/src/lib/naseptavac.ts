import { hladaj, zvyrazni, esc, nacitajIndex, type Polozka } from './hladanie-klient';

/**
 * Našepkávač pod poľom hľadania v hlavičke: po dvoch znakoch ukáže šesť najlepších výsledkov a odkaz
 * na všetky. Šípky vyberajú, Enter otvorí vybraný výsledok (bez výberu odošle formulár na stránku
 * Hľadanie), Esc zatvorí. Vzor ARIA combobox so zoznamom (listbox).
 */
interface Texty { vsetky: string; nic: string; ciastocne: string; sprievodca: string; skupiny: Record<Polozka['s'], string>; sprievodcaUrl: string }

export function pripojNaseptavac(form: HTMLFormElement) {
  const vstup = form.querySelector<HTMLInputElement>('input[name="q"]');
  const panel = form.querySelector<HTMLElement>('[data-nas]');
  const zoznam = panel?.querySelector<HTMLElement>('[role="listbox"]');
  const pozn = panel?.querySelector<HTMLElement>('[data-nas-pozn]');
  if (!vstup || !panel || !zoznam || !pozn || !form.dataset.texty || !form.dataset.index) return;
  const tx: Texty = JSON.parse(form.dataset.texty);
  const url = form.dataset.index;
  const ikonaExt = form.querySelector<HTMLTemplateElement>('template[data-nas-ext]')?.innerHTML ?? '';
  let aktivna = -1;
  let casovac = 0;

  const moznosti = () => [...zoznam.querySelectorAll<HTMLAnchorElement>('[role="option"]')];
  const zatvor = () => {
    panel.hidden = true;
    vstup.setAttribute('aria-expanded', 'false');
    vstup.removeAttribute('aria-activedescendant');
    aktivna = -1;
  };
  const oznac = (i: number) => {
    const m = moznosti();
    aktivna = i;
    m.forEach((o, j) => o.setAttribute('aria-selected', String(j === i)));
    if (m[i]) { vstup.setAttribute('aria-activedescendant', m[i].id); m[i].scrollIntoView({ block: 'nearest' }); }
    else vstup.removeAttribute('aria-activedescendant');
  };

  const moznost = (id: string, href: string, obsah: string, trieda = '') => {
    const von = /^https?:/.test(href);
    return `<a role="option" id="${id}" aria-selected="false" class="nas-o${trieda}" href="${esc(href)}"${von ? ' target="_blank" rel="noopener"' : ''}>${obsah}${von ? ikonaExt : ''}</a>`;
  };

  async function ukaz() {
    const q = vstup.value.trim();
    if (q.length < 2) { zatvor(); return; }
    let index: Polozka[];
    try { index = await nacitajIndex(url); } catch { return; }
    if (vstup.value.trim() !== q) return; // medzitým písal ďalej, vykreslí ďalšie volanie
    const { vysledky, ciastocne, terminy } = hladaj(index, q);
    const prve = vysledky.slice(0, 6);
    const id = zoznam.id;
    const vsetkyUrl = `${form.getAttribute('action')}?q=${encodeURIComponent(q)}`;
    pozn.textContent = !vysledky.length ? tx.nic : ciastocne ? tx.ciastocne : '';
    pozn.hidden = !pozn.textContent;
    zoznam.innerHTML = prve.map(({ p }, i) => moznost(`${id}-${i}`, p.u,
      `<span class="nas-n">${zvyrazni(p.n, terminy)}</span><span class="nas-s">${esc(tx.skupiny[p.s])}</span>${p.d ? `<span class="nas-d">${zvyrazni(p.d, terminy)}</span>` : ''}`,
      p.s === 'kod' ? ' nas-kod' : '')).join('')
      + (vysledky.length > prve.length ? moznost(`${id}-v`, vsetkyUrl, `<span class="nas-n">${esc(tx.vsetky)} (${vysledky.length})</span>`, ' nas-vsetky') : '')
      + (!vysledky.length ? moznost(`${id}-s`, tx.sprievodcaUrl, `<span class="nas-n">${esc(tx.sprievodca)}</span>`, ' nas-vsetky') : '');
    aktivna = -1;
    vstup.removeAttribute('aria-activedescendant');
    panel.hidden = false;
    vstup.setAttribute('aria-expanded', 'true');
  }

  vstup.addEventListener('input', () => { clearTimeout(casovac); casovac = window.setTimeout(ukaz, 70); });
  vstup.addEventListener('focus', () => { if (vstup.value.trim().length >= 2) ukaz(); });
  vstup.addEventListener('keydown', (e) => {
    const m = moznosti();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (panel.hidden) { ukaz(); return; }
      if (!m.length) return;
      e.preventDefault();
      oznac(e.key === 'ArrowDown' ? (aktivna + 1) % m.length : aktivna <= 0 ? m.length - 1 : aktivna - 1);
    } else if (e.key === 'Enter' && !panel.hidden && m[aktivna]) {
      e.preventDefault();
      m[aktivna].click();
      zatvor();
    } else if (e.key === 'Escape' && !panel.hidden) {
      e.preventDefault();
      e.stopPropagation();
      zatvor();
    }
  });
  // Klik do zoznamu nesmie zobrať fokus z poľa, inak by sa zoznam zavrel skôr, než klik prejde.
  panel.addEventListener('pointerdown', (e) => e.preventDefault());
  zoznam.addEventListener('click', () => zatvor());
  form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement)) zatvor(); }, 0));
}
