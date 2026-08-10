import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment — dual-fetch: localhost content path first, then EDS/DA path
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let loadedFooterPath = '/content/footer';
  let fragment = await loadFragment(loadedFooterPath);
  if (!fragment) { loadedFooterPath = footerPath; fragment = await loadFragment(footerPath); }
  if (!fragment) return;

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Rebase relative footer images against the footer fragment location that loaded,
  // so they resolve in both local (/content) and production (DA root).
  const footerBase = new URL(loadedFooterPath, window.location);
  footer.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
      img.src = new URL(src, footerBase).href;
    }
  });

  // Label the footer sections: brand, nav, social, legal
  const classes = ['brand', 'nav', 'social', 'legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  block.append(footer);
}
