/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 *
 * Source: AEM Core Components (WKND) page. Every selector below was verified
 * against migration-work/cleaned.html (parsed with jsdom, which resolves the
 * malformed unclosed <img>/<meta> tags the way a browser does).
 *
 * Responsibilities:
 *  - Remove non-authorable site chrome: header/footer experience fragments,
 *    mobile nav toggle/overlay, and the Adobe demdex tracking iframe.
 *  - Remove decorative separators BEFORE parsing so their
 *    <hr class="cmp-separator__horizontal-rule"> are not misread as EDS
 *    section breaks by the section transformer (which runs in afterTransform).
 *  - Strip AEM-specific attributes (data-cmp-*, data-cmp-data-layer-*) and
 *    microdata (itemscope/itemtype/itemprop/itemid) from every element.
 *  - Remove stray non-content elements (<meta> injected inside cmp-image,
 *    <iframe>, <noscript>, <script>, <style>, <link>).
 *
 * Note on redundant AEM grid wrappers (div.aem-Grid, div.cmp-container,
 * main.cmp-layout-container--fixed, ...): these carry no authorable content and
 * are discarded automatically by the helix-importer markdown conversion (which
 * drops non-semantic wrapper divs and all class/id attributes). They are left
 * in place on purpose: parsers run BETWEEN beforeTransform and afterTransform
 * and rely on those selectors (e.g. div.image-list.list,
 * div.teaser.cmp-teaser--featured) to extract blocks. Unwrapping them here would
 * break parser matching.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

// AEM component attributes to strip from every element (verified: only present
// on <body>, but stripped everywhere for robustness across WKND pages).
const AEM_ATTR_PREFIXES = ['data-cmp-'];
const MICRODATA_ATTRS = ['itemscope', 'itemtype', 'itemprop', 'itemid'];

function stripAemAttributes(el) {
  // Copy the live NamedNodeMap to an array before mutating.
  Array.from(el.attributes).forEach((attr) => {
    const name = attr.name;
    if (AEM_ATTR_PREFIXES.some((prefix) => name.startsWith(prefix))
      || MICRODATA_ATTRS.includes(name)) {
      el.removeAttribute(name);
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Decorative rules that would otherwise become false section breaks.
    // Found in cleaned.html: <div class="separator ..."><div class="cmp-separator">
    //   <hr class="cmp-separator__horizontal-rule"></div></div>
    // (3 occurrences: 2 between content blocks, 1 in the footer XF).
    // Removing the wrapper here, before the section transformer runs in
    // afterTransform, keeps the real <hr> section breaks accurate.
    WebImporter.DOMUtils.remove(element, ['div.separator']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (handled by common header/footer components).
    // Verified single matches in cleaned.html.
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment.cmp-experiencefragment--header', // site header XF
      'footer.experiencefragment.cmp-experiencefragment--footer', // site footer XF
      '#toggleNav', // mobile nav hamburger toggle
      '#mobileNav', // mobile nav overlay
    ]);

    // Stray non-content elements.
    // - <meta> tags are injected inside div.cmp-image by AEM (6 occurrences).
    // - <iframe id="destination_publishing_iframe_..."> is Adobe demdex tracking.
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'meta',
      'noscript',
      'script',
      'style',
      'link',
    ]);

    // Article-page social-share chrome (magazine article pages only): the
    // "SHARE THIS STORY" title + the share-buttons building block are UI, not
    // authorable content. Selectors are absent on other WKND templates, so
    // this is a no-op there.
    WebImporter.DOMUtils.remove(element, [
      'div.buildingblock.cmp-buildingblock--btn-list',
    ]);
    element.querySelectorAll('div.title').forEach((t) => {
      if (/^\s*share this story\s*$/i.test(t.textContent || '')) t.remove();
    });

    // Strip AEM component attributes + microdata from the root and every element.
    stripAemAttributes(element);
    element.querySelectorAll('*').forEach(stripAemAttributes);
  }
}
