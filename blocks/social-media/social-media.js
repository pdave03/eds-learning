/*
 * Social Media block — reusable across the site (footer, About Us, any page).
 *
 * Authoring contract: a block containing one or more links, one per network,
 * e.g. a list of anchors whose href or text names the network:
 *
 *   | Social Media |
 *   | :----------- |
 *   | Facebook  https://facebook.com/wknd  |
 *   | Instagram https://instagram.com/wknd |
 *
 * The decorate function detects the network from each link's href/text and
 * swaps the label for a branded icon. Icons live in /icons/{network}.svg and
 * are referenced via the standard EDS icon pattern (<span class="icon
 * icon-{network}">), then recoloured per variant with a CSS mask so the same
 * SVG works as white-on-dark, ink-on-light, etc. It is also exported as
 * `decorateSocialLinks` so other blocks (e.g. the footer) can reuse the exact
 * same rendering on an existing set of anchors without re-authoring content.
 */

// Icon file name (in /icons/) per detected network. The generic fallback uses
// icons/social-link.svg.
const ICON_NAME = {
  facebook: 'facebook',
  twitter: 'twitter',
  instagram: 'instagram',
  youtube: 'youtube',
  linkedin: 'linkedin',
  pinterest: 'pinterest',
  tiktok: 'tiktok',
  link: 'social-link',
};

// Network detection: keywords found in the link href or its text.
const NETWORKS = [
  { key: 'facebook', match: ['facebook', 'fb.com', 'fb.me'] },
  { key: 'twitter', match: ['twitter', 'x.com'], label: 'Twitter' },
  { key: 'instagram', match: ['instagram', 'instagr.am'] },
  { key: 'youtube', match: ['youtube', 'youtu.be'] },
  { key: 'linkedin', match: ['linkedin', 'lnkd.in'] },
  { key: 'pinterest', match: ['pinterest', 'pin.it'] },
  { key: 'tiktok', match: ['tiktok'] },
];

function detectNetwork(anchor) {
  const haystack = `${anchor.getAttribute('href') || ''} ${anchor.textContent || ''}`.toLowerCase();
  return NETWORKS.find((n) => n.match.some((m) => haystack.includes(m)));
}

/**
 * Turn a set of social links (any container) into branded icon buttons.
 * Reusable by other blocks — keeps the original href, adds an accessible label.
 * @param {Element} container element holding the social <a> links
 * @param {Object} [options]
 * @param {'dark'|'light'} [options.variant='dark'] visual variant:
 *   'dark' = black square buttons with white icons,
 *   'light' = white band with black icons.
 * @returns {Element} the same container, decorated
 */
export function decorateSocialLinks(container, { variant = 'dark' } = {}) {
  container.classList.add(`social-media-${variant === 'light' ? 'light' : 'dark'}`);
  container.querySelectorAll('a').forEach((anchor) => {
    const network = detectNetwork(anchor);
    const key = network ? network.key : 'link';
    const label = anchor.textContent.trim() || (network ? network.label || network.key : 'link');

    anchor.classList.add('social-media-link', `social-media-${key}`);
    anchor.setAttribute('aria-label', label);
    anchor.title = label;

    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('http')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }

    // Standard EDS icon pattern: <span class="icon icon-{name}"> resolving to
    // /icons/{name}.svg. The CSS masks it so it recolours per variant/hover.
    const iconName = ICON_NAME[key] || ICON_NAME.link;
    anchor.textContent = '';
    const icon = document.createElement('span');
    icon.className = `icon icon-${iconName}`;
    anchor.append(icon);
  });
  return container;
}

/**
 * loads and decorates the social-media block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // gather the links into a single list, preserving order
  const anchors = [...block.querySelectorAll('a')];
  if (!anchors.length) return;

  // variant from a block option/class (default dark)
  const variant = block.classList.contains('light') ? 'light' : 'dark';

  const list = document.createElement('ul');
  list.className = 'social-media-list';
  anchors.forEach((anchor) => {
    const li = document.createElement('li');
    li.append(anchor);
    list.append(li);
  });

  block.textContent = '';
  block.append(list);

  decorateSocialLinks(block, { variant });
}
