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
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
    // Carry over the source image's intrinsic dimensions so the browser
    // reserves space and avoids layout shift (CLS). Fall back to the WKND
    // article image ratio (1280x853) when the source omits them.
    const newImg = optimized.querySelector('img');
    if (newImg) {
      newImg.setAttribute('width', img.getAttribute('width') || '1280');
      newImg.setAttribute('height', img.getAttribute('height') || '853');
    }
    img.closest('picture').replaceWith(optimized);
  });

  // Images that sit alone in a paragraph get a full-width figure treatment.
  block.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('picture') && !p.textContent.trim()) {
      p.classList.add('article-body-figure');
    }
  });
}
