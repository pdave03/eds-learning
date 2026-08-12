import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Article body block. Holds the long-form article content (paragraphs, H2
 * subheadings, and inline images) in a single constrained-width column with
 * article typography. Content is authored as the block's default content, so
 * decoration only needs to optimise images and tag the block for styling.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Optimise any inline article images.
  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]),
    );
  });

  // Images that sit alone in a paragraph get a full-width figure treatment.
  block.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('picture') && !p.textContent.trim()) {
      p.classList.add('article-body-figure');
    }
  });
}
