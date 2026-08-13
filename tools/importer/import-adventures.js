/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsImgbottomParser from './parsers/columns-imgbottom.js';
import adventureTabsParser from './parsers/adventure-tabs.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-imgbottom': columnsImgbottomParser,
  'adventure-tabs': adventureTabsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (adventures)
const PAGE_TEMPLATE = {
  name: 'adventures',
  description: 'WKND Adventures page: hero teaser (Next Adventures style via columns-imgbottom) + Current Adventures tab filter (adventure-tabs).',
  urls: [
    'https://wknd.site/us/en/adventures.html',
  ],
  blocks: [
    {
      name: 'columns-imgbottom',
      instances: ['div.teaser.cmp-teaser--hero'],
    },
    {
      name: 'adventure-tabs',
      instances: ['div.tabs.cmp-tabs', 'div.cmp-tabs'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: 'div.teaser.cmp-teaser--hero',
      style: null,
      blocks: ['columns-imgbottom'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Current Adventures',
      selector: 'div.cmp-tabs',
      style: null,
      blocks: ['adventure-tabs'],
      defaultContent: ['div.title.cmp-title--underline'],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup then sections (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        // avoid double-adding when multiple selectors match the same element
        if (claimed.has(element)) return;
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
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

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
