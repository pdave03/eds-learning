import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-article-card-image';
      } else {
        div.className = 'cards-article-card-body';
        // the first link is the card title
        const titleLink = div.querySelector('a');
        if (titleLink) titleLink.classList.add('cards-article-card-title');
        // wrap the remaining (description) nodes after the title in a paragraph
        const desc = document.createElement('p');
        desc.className = 'cards-article-card-description';
        let node = titleLink ? titleLink.nextSibling : div.firstChild;
        while (node) {
          const next = node.nextSibling;
          desc.append(node);
          node = next;
        }
        if (desc.textContent.trim()) div.append(desc);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
