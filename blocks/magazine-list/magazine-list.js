import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';

const PAGE_SIZE = 500;

/**
 * Resolves the magazine section root relative to the current page, so the
 * block works under any locale prefix (e.g. `/us/en/magazine`, `/fr/fr/magazine`).
 * The magazine listing lives at `/.../magazine`, so default to that section even
 * when the block is placed on another page (e.g. the homepage).
 * @returns {string} The `/.../magazine` path with no trailing slash
 */
function getMagazineRoot() {
  const { pathname } = window.location;
  const match = pathname.match(/^(.*\/magazine)(\/|$)/);
  if (match) return match[1];
  // Not under /magazine (e.g. homepage): derive the locale prefix and append it.
  const locale = pathname.match(/^(\/[a-z]{2}\/[a-z]{2})(\/|$)/);
  return locale ? `${locale[1]}/magazine` : '/us/en/magazine';
}

/**
 * Fetches every entry from a query-index, paging through results.
 * @param {string} path Path to the query-index.json endpoint
 * @returns {Promise<object[]>} All indexed entries
 */
async function fetchAllEntries(path) {
  const entries = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(`${path}?limit=${PAGE_SIZE}&offset=${offset}`);
    if (!resp.ok) break;
    // eslint-disable-next-line no-await-in-loop
    const json = await resp.json();
    entries.push(...json.data);
    total = json.total;
    offset += json.limit;
  }
  return entries;
}

/**
 * Builds a single card from an index entry, using the SAME markup and classes
 * as the hardcoded cards-article block so the two render identically (and share
 * cards-article.css).
 * @param {object} entry Query-index entry (title, description, image, path, ...)
 * @returns {HTMLLIElement} The card list item
 */
function buildCard(entry) {
  const li = document.createElement('li');

  // image cell — image wrapped in its article link (matches cards-article)
  if (entry.image) {
    const imageCell = document.createElement('div');
    imageCell.className = 'cards-article-card-image';
    const imgP = document.createElement('p');
    const imgLink = document.createElement('a');
    imgLink.href = entry.path;
    imgLink.setAttribute('aria-label', entry.title || '');
    const optimized = createOptimizedPicture(entry.image, entry.title, false, [{ width: '750' }]);
    // reserve the card aspect-ratio box up front to avoid layout shift (CLS)
    const cardImg = optimized.querySelector('img');
    if (cardImg) {
      cardImg.setAttribute('width', '765');
      cardImg.setAttribute('height', '535');
    }
    imgLink.append(optimized);
    imgP.append(imgLink);
    imageCell.append(imgP);
    li.append(imageCell);
  }

  // body cell — title link + description
  const body = document.createElement('div');
  body.className = 'cards-article-card-body';

  const titleP = document.createElement('p');
  const titleLink = document.createElement('a');
  titleLink.href = entry.path;
  titleLink.title = entry.title || '';
  titleLink.className = 'cards-article-card-title';
  titleLink.textContent = entry.title || '';
  titleP.append(titleLink);
  body.append(titleP);

  if (entry.description) {
    const description = document.createElement('p');
    description.className = 'cards-article-card-description';
    description.textContent = entry.description;
    body.append(description);
  }

  li.append(body);
  return li;
}

/**
 * Loads and decorates the magazine-list block.
 * Queries all published, indexed pages under /magazine and renders them as a
 * card grid that is visually identical to the hardcoded cards-article block.
 * @param {Element} block The magazine-list block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // reuse the cards-article styling so both card grids look identical
  loadCSS(`${window.hlx.codeBasePath}/blocks/cards-article/cards-article.css`);

  const magazineRoot = getMagazineRoot();
  let entries = [];
  try {
    // Read the site-wide index and filter to the magazine section below. (The
    // default /query-index.json is always generated; a section-scoped index is
    // not guaranteed to exist.)
    entries = await fetchAllEntries('/query-index.json');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load magazine index', error);
  }

  entries = entries
    .filter((entry) => entry.path?.startsWith(`${magazineRoot}/`) && !entry.robots?.includes('noindex'))
    .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'magazine-list-empty';
    empty.textContent = 'No magazine articles found.';
    block.append(empty);
    return;
  }

  // Render inside a `.cards-article` wrapper so cards-article.css applies and
  // the output is pixel-identical to the hardcoded cards.
  const cards = document.createElement('div');
  cards.className = 'cards-article';
  const ul = document.createElement('ul');
  entries.forEach((entry) => ul.append(buildCard(entry)));
  cards.append(ul);
  block.append(cards);
}
