import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Collapses the mobile menu (used on Escape and on resize to desktop).
 * @param {Element} nav The nav element
 */
function closeMenu(nav) {
  nav.setAttribute('aria-expanded', 'false');
  const hamburger = nav.querySelector('.nav-hamburger button');
  if (hamburger) hamburger.setAttribute('aria-label', 'Open navigation');
  document.body.style.removeProperty('overflow-y');
}

/**
 * Toggles the mobile menu open/closed.
 * @param {Element} nav The nav element
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const hamburger = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (hamburger) {
    hamburger.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (!nav) return;
    // close the locale dropdown if open
    const openLocale = nav.querySelector('.nav-locale[aria-expanded="true"]');
    if (openLocale) {
      openLocale.setAttribute('aria-expanded', 'false');
      return;
    }
    if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      closeMenu(nav);
      const hamburger = nav.querySelector('.nav-hamburger button');
      if (hamburger) hamburger.focus();
    }
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment — dual-fetch: localhost content path first, then EDS/DA path
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  let loadedNavPath = '/content/nav';
  let fragment = await loadFragment(loadedNavPath);
  if (!fragment) { loadedNavPath = navPath; fragment = await loadFragment(navPath); }
  if (!fragment) return;

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Rebase relative nav images (e.g. images/logo.svg) against the nav fragment
  // location that actually loaded, so they resolve in both local (/content) and prod.
  const navBase = new URL(loadedNavPath, window.location);
  nav.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
      img.src = new URL(src, navBase).href;
    }
  });

  // The nav fragment has three sections: utility bar, brand, and nav links.
  const classes = ['utility', 'brand', 'sections'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // --- Utility bar: Sign In + locale selector ---
  const navUtility = nav.querySelector('.nav-utility');
  if (navUtility) {
    // Content may be wrapped in a .default-content-wrapper by EDS decoration.
    const utilContent = navUtility.querySelector('.default-content-wrapper') || navUtility;
    // The first <p> holds Sign In; the second <p> holds the current locale (flag + label);
    // the <ul> holds the full country -> language list (the dropdown).
    const localeToggle = utilContent.querySelector(':scope > p:nth-of-type(2)');
    const localeList = utilContent.querySelector(':scope > ul');
    if (localeToggle && localeList) {
      const wrapper = document.createElement('div');
      wrapper.className = 'nav-locale';
      wrapper.setAttribute('aria-expanded', 'false');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-locale-toggle';
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      while (localeToggle.firstChild) button.append(localeToggle.firstChild);
      localeToggle.remove();
      localeList.classList.add('nav-locale-list');
      wrapper.append(button, localeList);
      utilContent.append(wrapper);
      button.addEventListener('click', () => {
        const open = wrapper.getAttribute('aria-expanded') === 'true';
        wrapper.setAttribute('aria-expanded', open ? 'false' : 'true');
        button.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }
  }

  // --- Brand: unwrap the logo link so it is not styled as a button ---
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const container = brandLink.closest('.button-container');
      if (container) container.className = '';
      const p = brandLink.closest('p');
      if (p) p.className = '';
    }
  }

  // --- Search: build the search control in JS (form controls are not in the fragment) ---
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const search = document.createElement('div');
    search.className = 'nav-search';
    const form = document.createElement('form');
    form.setAttribute('role', 'search');
    form.action = '/us/en/search.html';
    const label = document.createElement('label');
    label.className = 'nav-search-label';
    label.setAttribute('aria-label', 'Search');
    const input = document.createElement('input');
    input.type = 'search';
    input.name = 'q';
    input.placeholder = 'Search';
    input.setAttribute('aria-label', 'Search');
    label.append(input);
    form.append(label);
    search.append(form);
    // place search in a dedicated tools area
    const navTools = document.createElement('div');
    navTools.className = 'nav-tools';
    navTools.append(search);
    nav.append(navTools);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // reset menu state on breakpoint change (prevents layout breakage on resize)
  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) closeMenu(nav);
  });

  window.addEventListener('keydown', closeOnEscape);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
