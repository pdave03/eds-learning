/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-imgbottom. Base: columns.
 * Source: https://wknd.site/us/en.html (div.teaser.cmp-teaser--imagebottom)
 * Generated: 2026-08-10
 *
 * Block library structure (Columns): first row = block name ("Columns (imgbottom)");
 * subsequent rows define the layout, each with the same column count.
 *
 * This variant stacks text above a full-width image. To render text-above-image
 * stacked, use two single-column rows:
 * - Row 1 (1 cell): text content — title (heading), description, CTA link.
 * - Row 2 (1 cell): the full-width image below.
 * Both rows have one column, so they stack vertically.
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector(':scope .cmp-teaser') || element;

  // Text content.
  const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = teaser.querySelector('.cmp-teaser__description, [class*="description"]');
  const cta = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

  // Bottom image.
  const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const textCell = [];
  if (title) textCell.push(title);
  if (description) textCell.push(description);
  if (cta) textCell.push(cta);

  // Empty-block guard.
  if (!textCell.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Row 1: text (single column).
  cells.push([textCell.length ? textCell : '']);
  // Row 2: image below (single column). Only add if present.
  if (img) cells.push([img]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-imgbottom', cells });
  element.replaceWith(block);
}
