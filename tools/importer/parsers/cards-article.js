/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://wknd.site/us/en.html (div.image-list.list)
 * Generated: 2026-08-10
 *
 * Block library structure (Cards): 2 columns, multiple rows.
 * - Row 1: block name ("Cards (article)").
 * - Each subsequent row = one card:
 *   - Cell 1: image (mandatory) — kept wrapped in its link to the article.
 *   - Cell 2: text content — title (as a link) + description.
 *
 * The block appears twice on the page; both instances have identical structure.
 * The validation hook runs this parser once per matching element, so it only
 * needs to handle a single `div.image-list.list` instance.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope .cmp-image-list__item'));

  const cells = [];

  items.forEach((item) => {
    // Cell 1: image wrapped in its article link. Prefer the anchor that wraps
    // the image so the card image stays linked; fall back to the bare <img>.
    const imageLink = item.querySelector('a.cmp-image-list__item-image-link, .cmp-image-list__item-image a');
    const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');
    let imageCell = '';
    if (imageLink && img) {
      imageCell = imageLink; // anchor already contains the image
    } else if (img) {
      imageCell = img;
    }

    // Cell 2: title (as link) + description.
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link, .cmp-image-list__item-title-link');
    const title = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"]');

    const textCell = [];
    // Prefer the title link (keeps the title clickable); otherwise the plain title.
    if (titleLink) textCell.push(titleLink);
    else if (title) textCell.push(title);
    if (description) textCell.push(description);

    // Only add a row if the card has any content.
    if (imageCell || textCell.length) {
      cells.push([imageCell, textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (article)', cells });
  element.replaceWith(block);
}
