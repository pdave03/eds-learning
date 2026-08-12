import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Members-only cards. Each source row is one locked card with two cells:
 *  - cell 1: text content (title, description, optional "Read More" link)
 *  - cell 2: the card image
 * Rendered as a 2-up grid where each card shows a yellow lock ribbon, the text
 * content, a gray "Read More" button, then the image below (matching WKND).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const bodyCell = cells.find((c) => c !== imageCell) || cells[0];

    // Body: title + description + "Read More".
    if (bodyCell) {
      bodyCell.className = 'cards-member-body';
      // The CTA is a link when available, otherwise the last (plain-text)
      // paragraph — the gated "Read More". Style either as the grey button.
      const link = bodyCell.querySelector('a');
      if (link) {
        link.classList.add('cards-member-cta');
      } else {
        const last = bodyCell.querySelector('p:last-of-type');
        if (last && /read more/i.test(last.textContent)) {
          last.classList.add('cards-member-cta', 'cards-member-cta-static');
        }
      }
      li.append(bodyCell);
    }

    // Image below the body.
    if (imageCell) {
      imageCell.className = 'cards-member-image';
      li.append(imageCell);
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
