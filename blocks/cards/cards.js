import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Renders an "article" card: image cell + body cell (title link + description).
 * Used by the `cards article` variant and reused by other blocks that build the
 * same markup (adventure-tabs, magazine-list).
 * @param {Element} li the card list item (its children are the source cells)
 */
export function decorateArticleCard(li) {
  [...li.children].forEach((div) => {
    if (div.children.length === 1 && div.querySelector('picture')) {
      div.className = 'cards-card-image';
    } else {
      div.className = 'cards-card-body';
      // the first link is the card title
      const titleLink = div.querySelector('a');
      if (titleLink) titleLink.classList.add('cards-card-title');
      // wrap the remaining (description) nodes after the title in a paragraph
      const desc = document.createElement('p');
      desc.className = 'cards-card-description';
      let node = titleLink ? titleLink.nextSibling : div.firstChild;
      while (node) {
        const next = node.nextSibling;
        desc.append(node);
        node = next;
      }
      if (desc.textContent.trim()) div.append(desc);
    }
  });
}

/**
 * Renders a members-only card: body cell (title, description, "Read More")
 * followed by the image cell below it.
 * @param {Element} li the card list item
 * @param {Element} row the source row whose cells populate the card
 */
function decorateMemberCard(li, row) {
  const cells = [...row.children];
  // the image cell is the one holding a picture/image; the other is the body
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const bodyCell = cells.find((c) => c !== imageCell) || cells[0];

  if (bodyCell) {
    bodyCell.className = 'cards-member-body';
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
  if (imageCell) {
    imageCell.className = 'cards-member-image';
    li.append(imageCell);
  }
}

/**
 * Renders a default card: each cell becomes image or body.
 * @param {Element} li the card list item
 */
function decorateDefaultCard(li) {
  [...li.children].forEach((div) => {
    if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
    else div.className = 'cards-card-body';
  });
}

/**
 * Cards block with variants (class-based, one base block):
 *   - default    → generic image + body cards
 *   - `article`  → WKND recent-articles / adventures cards (title link + desc)
 *   - `member`   → members-only locked cards (body then image)
 * Set image width/height for the article variant to reserve the aspect-ratio
 * box and avoid layout shift (CLS).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const isArticle = block.classList.contains('article');
  const isMember = block.classList.contains('member');

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    if (isMember) {
      decorateMemberCard(li, row);
    } else {
      while (row.firstElementChild) li.append(row.firstElementChild);
      if (isArticle) decorateArticleCard(li);
      else decorateDefaultCard(li);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    if (isArticle) {
      // Reserve the card's aspect-ratio box immediately (prevents CLS).
      const newImg = optimized.querySelector('img');
      if (newImg) {
        newImg.setAttribute('width', '765');
        newImg.setAttribute('height', '535');
      }
    }
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
