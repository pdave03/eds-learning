/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-body. Custom block (magazine article pages).
 * Source: https://wknd.site/us/en/magazine/*.html (div.contentfragment)
 *
 * The article long-form body renders inside a single content-fragment wrapper
 * (div.contentfragment) as a stream of paragraphs, H2/H3 subheadings and inline
 * images in reading order. This parser collects those nodes, in order, into one
 * block cell so the article-body block can style them as a reading column.
 *
 * One block row, one cell containing the ordered body content.
 */
export default function parse(element, { document }) {
  const nodes = [];

  // Walk the body content in document order, keeping headings, paragraphs and
  // images (wrapped in their <picture>/<p> if present).
  const selector = 'h1, h2, h3, h4, h5, h6, p, picture, img';
  const seen = new Set();
  element.querySelectorAll(selector).forEach((el) => {
    // Skip the content-fragment's own title heading — it duplicates the page
    // <h1> already rendered above the body.
    if (el.classList && el.classList.contains('cmp-contentfragment__title')) return;
    // Skip an <img> whose <picture> ancestor was already captured.
    if (el.tagName === 'IMG' && el.closest('picture')) return;
    // Skip a <picture>/<img> already inside a captured <p>.
    if ((el.tagName === 'PICTURE' || el.tagName === 'IMG') && el.closest('p')) return;
    // Avoid duplicates (nested matches).
    if ([...seen].some((s) => s.contains(el))) return;

    const text = el.textContent.trim();
    const hasMedia = el.querySelector && el.querySelector('picture, img');
    if (!text && !hasMedia && el.tagName !== 'PICTURE' && el.tagName !== 'IMG') return;

    seen.add(el);
    nodes.push(el);
  });

  if (!nodes.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[nodes]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'article-body', cells });
  element.replaceWith(block);
}
