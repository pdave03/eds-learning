/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html (div.carousel.cmp-carousel--hero)
 * Generated: 2026-08-10
 *
 * Block library structure (Carousel): 2 columns, multiple rows.
 * - Row 1: block name ("Carousel (hero)").
 * - Each subsequent row = one slide: cell 1 = image (mandatory),
 *   cell 2 = text content (title heading, description, CTA link).
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item panel containing a hero teaser.
  const slides = Array.from(element.querySelectorAll(':scope .cmp-carousel__item'));

  const cells = [];

  slides.forEach((slide) => {
    const teaser = slide.querySelector('.teaser, .cmp-teaser') || slide;

    // Image cell (mandatory) — pull the actual <img> node.
    const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // Text cell — title (heading), description, CTA link.
    const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    const description = teaser.querySelector('.cmp-teaser__description, [class*="description"]');
    const cta = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

    const textCell = [];
    if (title) textCell.push(title);
    if (description) textCell.push(description);
    if (cta) textCell.push(cta);

    // Only emit a slide row if it has any content.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard: nothing extracted, unwrap element.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
