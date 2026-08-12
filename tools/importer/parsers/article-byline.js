/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the article author byline. Reuses the contributors block so the
 * author (photo + name + role) renders with the same card styling as the
 * About Us contributors.
 * Source: https://wknd.site/us/en/magazine/*.html (div.cmp-byline)
 *
 * Byline DOM: .cmp-byline__image img + h2.cmp-byline__name + p.cmp-byline__occupations
 * Output: a `contributors` block row → [ image, [name (h3), role (h5)] ].
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.cmp-byline__image img, .cmp-image img, img');
  const nameEl = element.querySelector('.cmp-byline__name');
  const roleEl = element.querySelector('.cmp-byline__occupations');

  const textCell = [];
  if (nameEl) {
    const h = document.createElement('h3');
    h.textContent = nameEl.textContent.trim();
    textCell.push(h);
  }
  if (roleEl) {
    const p = document.createElement('h5');
    p.textContent = roleEl.textContent.trim();
    textCell.push(p);
  }

  if (!img && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[img || '', textCell.length ? textCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'contributors', cells });
  element.replaceWith(block);
}
