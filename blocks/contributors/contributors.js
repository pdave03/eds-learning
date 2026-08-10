import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Contributors block. Each source row is one contributor with two cells:
 *  - cell 1: the contributor photo
 *  - cell 2: text — name (heading) + title/role
 * Rendered as a responsive grid of cards: circular photo, name, then title.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    const bodyCell = cells.find((c) => c !== imageCell) || cells[0];

    if (imageCell) {
      imageCell.className = 'contributors-photo';
      li.append(imageCell);
    }

    if (bodyCell) {
      bodyCell.className = 'contributors-info';
      // first heading = name; any following heading = title/role
      const headings = [...bodyCell.querySelectorAll('h1, h2, h3, h4, h5, h6')];
      if (headings[0]) headings[0].classList.add('contributors-name');
      if (headings[1]) headings[1].classList.add('contributors-title');
      li.append(bodyCell);
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }])));
  block.replaceChildren(ul);
}
