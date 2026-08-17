/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Up Next" related-articles list on magazine article pages.
 * Reuses the cards-article block, which renders image + text cards and handles
 * a missing image gracefully (these list items are title + date only).
 * Source: https://wknd.site/us/en/magazine/*.html (div.list.cmp-list--upnext)
 *
 * Each list item → one card row: [ '', [ title (as link), date ] ].
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-list__item')];
  const cells = [];

  items.forEach((item) => {
    const link = item.querySelector('a.cmp-list__item-link, a');
    const title = item.querySelector('.cmp-list__item-title');
    const date = item.querySelector('.cmp-list__item-date');
    if (!link && !title) return;

    const textCell = [];
    // keep the title clickable by wrapping its text in the item link
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href') || '#';
      a.textContent = (title ? title.textContent : link.textContent).trim();
      textCell.push(a);
    } else if (title) {
      textCell.push(title);
    }
    if (date && date.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = date.textContent.trim();
      textCell.push(p);
    }

    if (textCell.length) cells.push(['', textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (article)', cells });
  element.replaceWith(block);
}
