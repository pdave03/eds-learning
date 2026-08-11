import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { decorateSocialLinks } from '../social-media/social-media.js';

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

  // Reuse the social-media block to turn the "Follow Us" links into icons.
  // The social-media CSS is only auto-loaded when a `.social-media` block is
  // decorated, so load it explicitly here since we reuse only the function.
  const social = footer.querySelector('.footer-social ul');
  if (social) {
    loadCSS(`${window.hlx.codeBasePath}/blocks/social-media/social-media.css`);
    social.classList.add('social-media-list');
    decorateSocialLinks(social, { variant: 'light' });
  }

  // Underline the footer nav link for the current page. A link matches when
  // the current page IS that page (e.g. /us/en/magazine) OR is a child of it
  // (e.g. /us/en/magazine/arctic-surfing), so section and article pages both
  // mark the same top-level link as selected.
  const footerNav = footer.querySelector('.footer-nav');
  if (footerNav) {
    const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
    footerNav.querySelectorAll('a[href]').forEach((a) => {
      let linkPath;
      try {
        linkPath = new URL(a.href, window.location).pathname.replace(/\.html$/, '').replace(/\/+$/, '');
      } catch (e) {
        return;
      }
      if (linkPath && (currentPath === linkPath || currentPath.startsWith(`${linkPath}/`))) {
        const li = a.closest('li') || a;
        li.classList.add('footer-nav-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  block.append(footer);
}
