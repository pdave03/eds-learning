/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleBodyParser from './parsers/article-body.js';
import articleBylineParser from './parsers/article-byline.js';
import articleRelatedParser from './parsers/article-related.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY - map block name to the parser used on THIS template.
// The byline renders as a `contributors` block and the "Up Next" list as a
// `cards-article` block, but both need article-specific extraction, so they
// map to dedicated parsers here.
const parsers = {
  'article-body': articleBodyParser,
  contributors: articleBylineParser,
  'cards-article': articleRelatedParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (magazine-article)
const PAGE_TEMPLATE = {
  name: 'magazine-article',
  description: 'WKND magazine article pages: hero image, title + subtitle, long-form article body, author byline (contributors), and an Up Next related-articles list (cards-article).',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
    'https://wknd.site/us/en/magazine/san-diego-surf.html',
    'https://wknd.site/us/en/magazine/ski-touring.html',
    'https://wknd.site/us/en/magazine/guide-la-skateparks.html',
    'https://wknd.site/us/en/magazine/western-australia.html',
  ],
  blocks: [
    {
      name: 'article-body',
      instances: ['article.contentfragment'],
    },
    {
      name: 'contributors',
      instances: ['div.cmp-byline'],
    },
    {
      name: 'cards-article',
      instances: ['div.list.cmp-list--upnext'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Article',
      selector: 'article.contentfragment',
      style: null,
      blocks: ['article-body', 'contributors'],
      defaultContent: ['div.title.cmp-title--underline'],
    },
    {
      id: 'section-2',
      name: 'Up Next',
      selector: 'div.list.cmp-list--upnext',
      style: null,
      blocks: ['cards-article'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup then sections (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. sanitized path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
