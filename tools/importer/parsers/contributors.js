/* eslint-disable */
/* global WebImporter */
/**
 * Parser for contributors. Custom block (About Us page).
 * Source: https://wknd.site/us/en/about-us.html
 * Generated: 2026-08-10
 *
 * Each contributor is a WKND layout container holding an image + two titles
 * (name h3, role h5) + a social nav. Per the requirement, the block keeps only
 * the photo, name and title (social bar omitted).
 *
 * One block row with two cells:
 *  - Cell 1: the contributor photo.
 *  - Cell 2: name (heading) + title/role (heading).
 * Each contributor is its own single-item block; contributors.css lays the
 * consecutive blocks out as a responsive grid within the section.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.image img, .cmp-image img, img');

  // Name = first title heading; role = second. Fall back to any headings.
  const headings = [...element.querySelectorAll('.title .cmp-title__text, .cmp-title__text, h1, h2, h3, h4, h5, h6')];
  const name = headings[0] || null;
  const role = headings[1] || null;

  const textCell = [];
  if (name) {
    // normalise the name to an h3 heading
    const h = document.createElement('h3');
    h.textContent = name.textContent.trim();
    textCell.push(h);
  }
  if (role) {
    const p = document.createElement('h5');
    p.textContent = role.textContent.trim();
    textCell.push(p);
  }

  // Empty-block guard.
  if (!img && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[img || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'contributors', cells });
  element.replaceWith(block);
}
