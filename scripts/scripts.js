import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Tags an article breadcrumb list so it can be styled.
 * The importer brings the breadcrumb in as a plain <ol> at the very top of the
 * page (before the <h1>) whose first item links to a parent page. Detect that
 * pattern and add the `breadcrumb` class; breadcrumb styling lives in
 * styles.css. Runs before section decoration so the <ol> is still at the top
 * of the content flow.
 * @param {Element} main The main container element
 */
function decorateBreadcrumb(main) {
  const ol = main.querySelector('ol');
  if (!ol || ol.classList.contains('breadcrumb')) return;
  // must start with a link to a parent page
  if (!ol.querySelector('li a[href]')) return;
  // must appear before the first heading (breadcrumbs sit at the top of the page).
  // Compare positions via a flat document-order list to avoid bitwise flags.
  const firstHeading = main.querySelector('h1, h2, h3, h4, h5, h6');
  if (firstHeading) {
    const all = [...main.querySelectorAll('*')];
    if (all.indexOf(ol) > all.indexOf(firstHeading)) return;
  }
  ol.classList.add('breadcrumb');
  ol.setAttribute('aria-label', 'Breadcrumb');
}

/**
 * Lays out a magazine article as two columns: the article content on the left
 * and the related-articles list as a right sidebar (matching the WKND design).
 * The importer emits the article body, byline and related list as flat sibling
 * wrappers in one section; this groups the main content and the aside into a
 * grid so CSS can place the aside on the right. Runs after decorateSections
 * (which creates the *-wrapper / *-container elements).
 * @param {Element} main The main container element
 */
function decorateArticleLayout(main) {
  const section = main.querySelector('.section.article-body-container.cards-article-container');
  if (!section || section.querySelector(':scope > .article-layout')) return;
  const aside = section.querySelector(':scope > .cards-article-wrapper');
  if (!aside) return;

  const layout = document.createElement('div');
  layout.className = 'article-layout';
  const content = document.createElement('div');
  content.className = 'article-main';
  const sidebar = document.createElement('aside');
  sidebar.className = 'article-aside';

  // "Share this story" label above the related list (matches the design).
  const asideHeading = document.createElement('p');
  asideHeading.className = 'article-aside-heading';
  asideHeading.textContent = 'Share this story';
  sidebar.append(asideHeading);

  // Move the section's children: the related list goes to the sidebar, the
  // rest (breadcrumb/title/byline default content, article body, author byline)
  // stays in the main column.
  [...section.children].forEach((child) => {
    if (child === aside) sidebar.append(child);
    else content.append(child);
  });

  layout.append(content, sidebar);
  section.append(layout);
  section.classList.add('article-layout-section');
}

/**
 * Lays out the FAQs page as two columns: the FAQ accordion on the left and a
 * "Need more help?" contact panel as a right sidebar (matching the WKND
 * design). The importer emits the title, accordion and the "Need more help?"
 * heading + text as flat sibling wrappers in one section; this groups the
 * accordion into a left column and everything after it into the aside. The page
 * title/intro (before the accordion) stays full-width on top. On mobile the two
 * columns stack with the "Need more help?" panel above the accordion.
 * Runs after decorateSections (which creates the *-wrapper / *-container
 * elements). Scoped to the accordion so it only affects the FAQs page.
 * @param {Element} main The main container element
 */
function decorateFaqsLayout(main) {
  const accordionWrapper = main.querySelector('.section > .accordion-wrapper');
  if (!accordionWrapper) return;
  const section = accordionWrapper.parentElement;
  if (section.querySelector(':scope > .faqs-layout')) return;

  const children = [...section.children];
  const accordionIndex = children.indexOf(accordionWrapper);

  const layout = document.createElement('div');
  layout.className = 'faqs-layout';
  const content = document.createElement('div');
  content.className = 'faqs-main';
  const sidebar = document.createElement('aside');
  sidebar.className = 'faqs-aside';

  // Everything before the accordion (title, intro) stays full-width on top;
  // the accordion goes to the main column; everything after it (the "Need more
  // help?" heading + text) goes to the aside.
  children.forEach((child, i) => {
    if (i < accordionIndex) return; // leave title/intro in place, above the grid
    if (i === accordionIndex) content.append(child);
    else sidebar.append(child);
  });

  layout.append(content, sidebar);
  section.append(layout);
  section.classList.add('faqs-layout-section');
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateBreadcrumb(main);
  decorateSections(main);
  decorateBlocks(main);
  // Layout grouping relies on the *-wrapper / *-container classes added by
  // decorateBlocks, so it must run after it (but before block JS decoration,
  // which happens later during loadSection).
  decorateArticleLayout(main);
  decorateFaqsLayout(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
