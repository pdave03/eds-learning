/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section boundaries.
 *
 * Establishes EDS section breaks (<hr>) between the 4 logical content sections
 * of the WKND homepage template. Driven by payload.template.sections (so the
 * validator recognises it as a section transformer and runs section validation).
 *
 * Runs in afterTransform ONLY: block parsers run between beforeTransform and
 * afterTransform, so by the time this executes the carousel/teaser/image-list
 * blocks have been replaced by tables. Every anchor below was chosen because it
 * SURVIVES parsing (verified against migration-work/cleaned.html parsed with
 * jsdom, which resolves AEM's malformed unclosed <img>/<meta> tags like a
 * browser does).
 *
 * WHY the template section `selector`s are NOT used verbatim:
 * WKND groups content into two `main.cmp-layout-container--fixed` wrappers that
 * do NOT line up with the 4 logical sections. The verified reading order of the
 * flattened DOM is:
 *   1. carousel (hero)                          <- section 1 (Hero Carousel)
 *   2. teaser.cmp-teaser--featured              <- section 2 (Featured Article)   [inside fixed #1]
 *   3. title.cmp-title--underline "Recent..."   <- section 3 (Recent Articles)    [inside fixed #1]
 *      + recent cards + "All Articles" button
 *   4. title.cmp-title--underline "Next..."     <- section 4 (Next Adventures)    [inside fixed #1]
 *      + Climbing NZ teaser (imagebottom)       [content-grid sibling, after fixed #1]
 *      + "Where do you want to go?" + next cards + "All Trips" button [inside fixed #2]
 * The "Next Adventures" title is the LAST child of the first fixed container,
 * while the template's section-4 selector points at the second fixed container
 * (which actually holds "Where do you want to go?"). Anchoring to that selector
 * would drop the break in the wrong place. So each boundary is resolved to the
 * correct, parse-stable element in document order.
 *
 * Section breaks inserted (sections.length - 1 = 3):
 *  - before the first main.cmp-layout-container--fixed  (Hero  | Featured)
 *  - before the "Recent Articles" underline title       (Featured | Recent)
 *  - before the "Next Adventures" underline title        (Recent | Next Adventures)
 *
 * Section Metadata: none. All 4 template sections have style === null, so no
 * Section Metadata blocks are created (expected count 0). The guarded block
 * below is kept for reuse on future WKND pages that may carry a section style.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * WKND homepage: its content is grouped into two `main.cmp-layout-container--fixed`
 * wrappers that don't line up with the 4 logical sections, and block selectors
 * are replaced by parsers before this hook runs. So the homepage boundaries are
 * resolved to hand-picked, parse-stable anchors (see the file header). This map
 * is keyed by the homepage template name only.
 */
function findHomepageSectionStart(element, section, underlineTitles) {
  switch (section.id) {
    case 'section-1':
      return null; // Hero Carousel — first section, no break before it.
    case 'section-2':
      // Featured Article — first fixed layout container (survives parsing).
      return element.querySelector('main.cmp-layout-container--fixed');
    case 'section-3':
      return underlineTitles[0] || null; // Recent Articles — 1st underline title.
    case 'section-4':
      return underlineTitles[1] || null; // Next Adventures — 2nd underline title.
    default:
      return null;
  }
}

/**
 * Generic resolver for other WKND pages (e.g. magazine): anchor each section
 * break to the first surviving element it can find, in this order:
 *   1. the section's first default-content selector (headings/titles survive
 *      parsing and are the natural section start), then
 *   2. the section `selector` itself.
 * Block selectors (e.g. div.teaser.cmp-teaser--*) are NOT used as anchors here
 * because parsers replace them with tables before afterTransform runs.
 * @returns {Element|null}
 */
function findGenericSectionStart(element, section, index, usedAnchors) {
  if (index === 0) return null; // first section — no break before it.

  const trySelectors = [];
  if (Array.isArray(section.defaultContent)) trySelectors.push(...section.defaultContent);
  if (typeof section.selector === 'string') trySelectors.push(section.selector);
  else if (Array.isArray(section.selector)) trySelectors.push(...section.selector);

  // For each selector, pick the FIRST matching element not already claimed by an
  // earlier section. This lets repeated selectors (e.g. two
  // div.title.cmp-title--underline titles) resolve to distinct anchors in
  // document order, so each section gets its own break point.
  for (let i = 0; i < trySelectors.length; i += 1) {
    const matches = Array.from(element.querySelectorAll(trySelectors[i]));
    const el = matches.find((m) => m.parentNode && !usedAnchors.has(m));
    if (el) {
      usedAnchors.add(el);
      return el;
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || !Array.isArray(sections) || sections.length < 2) return;

    const { document } = payload;
    const isHomepage = template.name === 'homepage';

    // The underlined section titles in document order. Default content, so they
    // survive block parsing (used by the homepage-specific anchor resolver).
    const underlineTitles = Array.from(
      element.querySelectorAll('div.title.cmp-title--underline'),
    );

    // Pass 1: resolve each section's anchor in FORWARD document order. The
    // generic resolver claims anchors so repeated selectors map to distinct
    // elements; the homepage resolver uses fixed, order-independent anchors.
    const usedAnchors = new Set();
    const resolved = sections.map((section, i) => ({
      section,
      index: i,
      start: isHomepage
        ? findHomepageSectionStart(element, section, underlineTitles)
        : findGenericSectionStart(element, section, i, usedAnchors),
    }));

    // Pass 2: insert breaks/metadata in REVERSE order so inserting a node for a
    // later section never shifts the resolved anchor of an earlier one.
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, index, start } = resolved[i];
      if (!start || !start.parentNode) continue;

      // Section Metadata — only when the template section defines a style.
      // (Inert on the homepage: every section has style === null.)
      if (section.style) {
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        start.parentNode.insertBefore(metadataBlock, start.nextSibling);
      }

      // Section break before every section except the first.
      if (index > 0) {
        const hr = document.createElement('hr');
        start.parentNode.insertBefore(hr, start);
      }
    }
  }
}
