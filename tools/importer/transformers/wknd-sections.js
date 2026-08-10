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
 * Resolve the first content element of a section, in document/reading order,
 * using parse-stable anchors specific to the WKND homepage template.
 * @returns {Element|null} boundary element, or null when there is no break
 *   (section 1) or the anchor is not present on the page.
 */
function findSectionStart(element, section, underlineTitles) {
  switch (section.id) {
    case 'section-1':
      // Hero Carousel — first section, no break before it.
      return null;
    case 'section-2':
      // Featured Article — first fixed layout container survives parsing and is
      // the content-grid sibling immediately after the hero carousel.
      return element.querySelector('main.cmp-layout-container--fixed');
    case 'section-3':
      // Recent Articles — first underlined section title (default content).
      return underlineTitles[0] || null;
    case 'section-4':
      // Next Adventures — second underlined section title (default content).
      return underlineTitles[1] || null;
    default:
      return null;
  }
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || !Array.isArray(sections) || sections.length < 2) return;

    const { document } = payload;

    // The two underlined section titles ("Recent Articles", "Next Adventures")
    // in document order. Default content, so they survive block parsing.
    const underlineTitles = Array.from(
      element.querySelectorAll('div.title.cmp-title--underline'),
    );

    // Process sections in reverse document order so inserting a break for a
    // later section never shifts the anchor of an earlier one.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const start = findSectionStart(element, section, underlineTitles);
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
      if (i > 0) {
        const hr = document.createElement('hr');
        start.parentNode.insertBefore(hr, start);
      }
    }
  }
}
