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
 * swaps the label for a branded SVG icon. It is also exported as
 * `decorateSocialLinks` so other blocks (e.g. the footer) can reuse the exact
 * same rendering on an existing set of anchors without re-authoring content.
 */

// Inline SVGs (fill: currentColor) — no external assets, works everywhere.
const ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M23.95 4.57c-.88.39-1.83.65-2.82.77a4.93 4.93 0 0 0 2.16-2.72c-.95.56-2 .97-3.12 1.19a4.92 4.92 0 0 0-8.38 4.48A13.97 13.97 0 0 1 1.64 3.16a4.92 4.92 0 0 0 1.52 6.57 4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 4.96 4.96 0 0 1-2.22.08 4.93 4.93 0 0 0 4.6 3.42A9.87 9.87 0 0 1 0 19.54a13.94 13.94 0 0 0 7.55 2.21c9.05 0 14-7.5 14-14 0-.21 0-.42-.02-.63A9.94 9.94 0 0 0 24 4.59l-.05-.02Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.79.22 2.43.47.66.25 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.36.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.79-.47 2.43-.25.66-.6 1.22-1.15 1.77-.55.55-1.11.9-1.77 1.15-.64.25-1.36.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.79.47-2.43.25-.66.6-1.22 1.15-1.77.55-.55 1.11-.9 1.77-1.15.64-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.51.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.31.88-.35 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.21 1.51.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.31 1.86.35 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.51-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.31-.88.35-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.21-1.51-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.31-1.86-.35-1.05-.05-1.37-.06-4.04-.06Zm0 3.06a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28Zm0 8.48a3.34 3.34 0 1 0 0-6.68 3.34 3.34 0 0 0 0 6.68Zm6.54-8.68a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.6 24 12 24 12s0-3.6-.5-5.5ZM9.6 15.57V8.43L15.82 12l-6.22 3.57Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
  pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.85 6.36 9.31-.09-.79-.17-2 .03-2.86.18-.78 1.18-4.97 1.18-4.97s-.3-.6-.3-1.5c0-1.4.81-2.45 1.83-2.45.86 0 1.28.65 1.28 1.42 0 .87-.55 2.17-.84 3.38-.24 1.01.51 1.84 1.5 1.84 1.8 0 3.19-1.9 3.19-4.64 0-2.43-1.74-4.12-4.23-4.12-2.88 0-4.58 2.16-4.58 4.4 0 .87.34 1.8.75 2.31.08.1.09.19.07.29-.08.32-.25 1.01-.28 1.15-.05.19-.15.23-.35.14-1.3-.61-2.11-2.5-2.11-4.03 0-3.28 2.38-6.29 6.87-6.29 3.61 0 6.41 2.57 6.41 6 0 3.58-2.26 6.47-5.4 6.47-1.05 0-2.04-.55-2.38-1.19l-.65 2.47c-.23.9-.86 2.03-1.29 2.72.97.3 2 .46 3.07.46 5.52 0 10-4.48 10-10S17.52 2 12 2Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.9a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-.7-5.09v-3.3a5.87 5.87 0 0 0-5.02 5.82 5.87 5.87 0 0 0 5.87 5.87 5.87 5.87 0 0 0 5.87-5.87V9.4a7.44 7.44 0 0 0 4.35 1.39V7.6a4.28 4.28 0 0 1-3.4-1.78Z"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10.6 13.4a1 1 0 0 0 1.42 0l4.24-4.24a3 3 0 0 0-4.24-4.24l-1.42 1.41 1.42 1.42 1.41-1.42a1 1 0 0 1 1.42 1.42l-4.25 4.24a1 1 0 0 0 0 1.41Zm2.8-2.8a1 1 0 0 0-1.42 0L7.74 14.84a3 3 0 0 0 4.24 4.24l1.42-1.41-1.42-1.42-1.41 1.42a1 1 0 0 1-1.42-1.42l4.25-4.24a1 1 0 0 0 0-1.41Z"/></svg>',
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

    anchor.innerHTML = ICONS[key] || ICONS.link;
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
