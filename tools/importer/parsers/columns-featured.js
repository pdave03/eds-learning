/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/us/en.html (div.teaser.cmp-teaser--featured)
 * Generated: 2026-08-10
 *
 * Block library structure (Columns): first row = block name ("Columns (featured)");
 * second row defines the columns. This variant is a featured article teaser rendered
 * as two side-by-side columns:
 * - Cell 1: image (left in the source layout).
 * - Cell 2: text content — pretitle, title (heading), description, CTA link.
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector(':scope .cmp-teaser') || element;

  // Image column.
  const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Text column pieces.
  // NOTE: title selector must exclude the pretitle — `[class*="title"]` would
  // otherwise also match `cmp-teaser__pretitle` (contains "title") and, since the
  // pretitle appears first in DOM order, querySelector would return it for both,
  // dropping the real heading.
  const pretitle = teaser.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
  const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = teaser.querySelector('.cmp-teaser__description, [class*="description"]');
  const cta = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

  const textCell = [];
  if (pretitle) textCell.push(pretitle);
  if (title) textCell.push(title);
  if (description) textCell.push(description);
  if (cta) textCell.push(cta);

  // Empty-block guard: no title/description means nothing meaningful to render.
  if (!img && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // One content row, two columns: image | text (image on the left).
  const cells = [[img || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (featured)', cells });
  element.replaceWith(block);
}
