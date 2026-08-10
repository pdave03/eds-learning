import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { decorateSocialLinks } from '../social-media/social-media.js';

/**
 * Contributors block. Each source row is one contributor with up to three cells:
 *  - cell 1: the contributor photo
 *  - cell 2: text — name (heading) + title/role
 *  - cell 3: social links (optional) — rendered via the reusable social-media block
 * Rendered as a responsive grid of cards: circular photo, name, title, socials.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  let hasSocial = false;

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('picture'));
    // a social cell is one that has links but no headings
    const socialCell = cells.find((c) => c !== imageCell
      && c.querySelector('a') && !c.querySelector('h1, h2, h3, h4, h5, h6'));
    const bodyCell = cells.find((c) => c !== imageCell && c !== socialCell) || cells[0];

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

    if (socialCell && socialCell.querySelector('a')) {
      hasSocial = true;
      const social = document.createElement('div');
      social.className = 'contributors-social';
      const list = document.createElement('ul');
      list.className = 'social-media-list';
      [...socialCell.querySelectorAll('a')].forEach((a) => {
        const item = document.createElement('li');
        item.append(a);
        list.append(item);
      });
      decorateSocialLinks(list, { variant: 'dark' });
      social.append(list);
      li.append(social);
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }])));
  block.replaceChildren(ul);

  // social-media CSS is only auto-loaded for a `.social-media` block, so load
  // it explicitly since we reuse only the decorateSocialLinks function.
  if (hasSocial) loadCSS(`${window.hlx.codeBasePath}/blocks/social-media/social-media.css`);
}
