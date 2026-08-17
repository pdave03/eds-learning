import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';

/**
 * Adventure Tabs block — a filterable set of adventure cards.
 *
 * Authoring contract: each row is one card with three cells:
 *   | <type> | <image> | <title link> + <description> |
 * where <type> is the adventure category (e.g. Climbing, Surfing). The block
 * builds a tab bar from the distinct types (with a leading "All"), renders the
 * cards as a grid (reusing the cards "article" variant styling), and shows only the selected
 * type's cards when a tab is clicked ("All" shows everything).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // reuse the cards "article" variant styling for an identical card look
  loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards.css`);

  // 1. Parse rows into { type, image, body } card descriptors, in order.
  const cards = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const type = (cells[0].textContent || '').trim();
    // image cell = the one containing a picture; body = the remaining cell(s)
    const imageCell = cells.find((c) => c.querySelector('picture, img'));
    const bodyCell = cells.find((c) => c !== cells[0] && c !== imageCell)
      || cells[cells.length - 1];
    cards.push({ type, imageCell, bodyCell });
  });

  if (!cards.length) return;

  // 2. Distinct types in first-seen order, with a leading "All".
  const types = [];
  cards.forEach((c) => { if (c.type && !types.includes(c.type)) types.push(c.type); });
  const allLabel = 'All';

  // 3. Build the card grid (cards "article" variant markup) with a data-type per card.
  const grid = document.createElement('div');
  grid.className = 'cards article';
  const ul = document.createElement('ul');
  cards.forEach((c) => {
    const li = document.createElement('li');
    li.dataset.type = c.type;

    if (c.imageCell) {
      c.imageCell.className = 'cards-card-image';
      li.append(c.imageCell);
    }
    if (c.bodyCell) {
      c.bodyCell.className = 'cards-card-body';
      const titleLink = c.bodyCell.querySelector('a');
      if (titleLink) titleLink.classList.add('cards-card-title');
      // wrap any text after the title link as the description
      const desc = document.createElement('p');
      desc.className = 'cards-card-description';
      let node = titleLink ? titleLink.nextSibling : c.bodyCell.firstChild;
      while (node) {
        const next = node.nextSibling;
        desc.append(node);
        node = next;
      }
      if (desc.textContent.trim()) c.bodyCell.append(desc);
      li.append(c.bodyCell);
    }
    ul.append(li);
  });
  grid.append(ul);

  // optimise images + reserve aspect-ratio box (prevents CLS)
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    const newImg = optimized.querySelector('img');
    if (newImg) {
      newImg.setAttribute('width', '765');
      newImg.setAttribute('height', '535');
    }
    img.closest('picture').replaceWith(optimized);
  });

  // 4. Build the tab bar.
  const tablist = document.createElement('div');
  tablist.className = 'adventure-tabs-tablist';
  tablist.setAttribute('role', 'tablist');

  const applyFilter = (selected) => {
    ul.querySelectorAll(':scope > li').forEach((li) => {
      const show = selected === allLabel || li.dataset.type === selected;
      li.hidden = !show;
    });
    tablist.querySelectorAll('.adventure-tabs-tab').forEach((t) => {
      const active = t.dataset.type === selected;
      t.classList.toggle('adventure-tabs-tab-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.setAttribute('tabindex', active ? '0' : '-1');
    });
  };

  [allLabel, ...types].forEach((type, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'adventure-tabs-tab';
    tab.dataset.type = type;
    tab.textContent = type;
    tab.setAttribute('role', 'tab');
    if (i === 0) tab.classList.add('adventure-tabs-tab-active');
    tab.addEventListener('click', () => applyFilter(type));
    tablist.append(tab);
  });

  // 5. Render: tablist above the grid, default to "All".
  block.replaceChildren(tablist, grid);
  applyFilter(allLabel);
}
