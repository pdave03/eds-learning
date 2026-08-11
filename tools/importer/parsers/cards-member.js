/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-member. Base: cards (member/secure variant).
 * Source: https://wknd.site/us/en/magazine.html (div.teaser.cmp-teaser--secure)
 * Generated: 2026-08-10
 *
 * Follows the Cards block convention: 2 columns, one row per card, with the
 * image in cell 1 and the text content (title, description, CTA) in cell 2.
 *
 * Members-only teasers carry a title + short description + a (gated, non-link)
 * "Read More". The source "Read More" is NOT a link (the destination only
 * exists after sign-in), so it is preserved as plain text rather than
 * fabricating a URL. cards-member.js renders the image below the text per the
 * WKND design.
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector(':scope .cmp-teaser') || element;

  const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = teaser.querySelector('.cmp-teaser__description, [class*="description"]');
  const action = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container');
  const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const textCell = [];
  if (title) textCell.push(title);
  if (description) textCell.push(description);
  if (action) {
    const label = action.textContent.trim();
    if (label) {
      const link = action.querySelector('a');
      if (link) {
        textCell.push(link);
      } else {
        // Gated "Read More" — no destination in source; keep as plain text.
        const p = document.createElement('p');
        p.textContent = label;
        textCell.push(p);
      }
    }
  }

  // Empty-block guard.
  if (!textCell.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Cards convention: one row per card — [ image | text ].
  const cells = [[img || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-member', cells });
  element.replaceWith(block);
}
