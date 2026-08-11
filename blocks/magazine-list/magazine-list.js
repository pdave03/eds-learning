import { createOptimizedPicture } from '../../scripts/aem.js';

const PAGE_SIZE = 500;

/**
 * Resolves the magazine section root relative to the current page, so the
 * block works under any locale prefix (e.g. `/us/en/magazine`, `/fr/fr/magazine`).
 * @returns {string} The `/.../magazine` path with no trailing slash
 */
function getMagazineRoot() {
  const { pathname } = window.location;
  const match = pathname.match(/^(.*\/magazine)(\/|$)/);
  return match ? match[1] : '/magazine';
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
 * Builds a single magazine card from an index entry.
 * @param {object} entry Query-index entry (title, description, image, path, ...)
 * @returns {HTMLLIElement} The card list item
 */
function buildCard(entry) {
  const li = document.createElement('li');
  li.className = 'magazine-list-card';

  const link = document.createElement('a');
  link.href = entry.path;
  link.setAttribute('aria-label', entry.title);

  if (entry.image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'magazine-list-card-image';
    imageWrapper.append(createOptimizedPicture(entry.image, entry.title, false, [{ width: '750' }]));
    link.append(imageWrapper);
  }

  const body = document.createElement('div');
  body.className = 'magazine-list-card-body';

  const title = document.createElement('h3');
  title.textContent = entry.title;
  body.append(title);

  if (entry.description) {
    const description = document.createElement('p');
    description.textContent = entry.description;
    body.append(description);
  }

  link.append(body);
  li.append(link);
  return li;
}

/**
 * Loads and decorates the magazine-list block.
 * Queries all published, indexed pages under /magazine and renders them as a card grid.
 * @param {Element} block The magazine-list block element
 */
export default async function decorate(block) {
  block.textContent = '';

  const magazineRoot = getMagazineRoot();
  let entries = [];
  try {
    entries = await fetchAllEntries(`${magazineRoot}/query-index.json`);
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

  const ul = document.createElement('ul');
  entries.forEach((entry) => ul.append(buildCard(entry)));
  block.append(ul);
}
