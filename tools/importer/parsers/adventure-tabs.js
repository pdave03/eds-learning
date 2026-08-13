/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the adventures page tab filter (custom block).
 * Source: https://wknd.site/us/en/adventures.html (div.cmp-tabs)
 *
 * WKND renders the "current adventures" filter as a tabs component: an
 * <ol.cmp-tabs__tablist> of <li role="tab"> labels (All, Climbing, Cycling,
 * Skiing, Surfing, Travel) and a matching set of <li.cmp-tabs__tabpanel>, each
 * holding an image-list (cards). "All" is skipped here — the block rebuilds an
 * "All" tab itself from the union of the typed cards.
 *
 * Output: an `adventure-tabs` block with one row per card, three cells:
 *   [ <type>, <image>, [ <title link>, <description> ] ]
 * The block groups these by type and toggles visibility on tab click.
 */
export default function parse(element, { document }) {
  // tab labels in order, keyed by their controlled panel id
  const tabs = [...element.querySelectorAll('.cmp-tabs__tab')].map((t) => ({
    label: (t.textContent || '').trim(),
    panelId: t.getAttribute('aria-controls'),
  }));

  const cells = [];

  tabs.forEach(({ label, panelId }) => {
    // skip the aggregate "All" tab — the block reconstructs it
    if (/^all$/i.test(label)) return;
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    const items = [...panel.querySelectorAll('.cmp-image-list__item')];
    items.forEach((item) => {
      const imageLink = item.querySelector('a.cmp-image-list__item-image-link, .cmp-image-list__item-image a');
      const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');
      let imageCell = '';
      if (imageLink && img) imageCell = imageLink;
      else if (img) imageCell = img;

      const titleLink = item.querySelector('a.cmp-image-list__item-title-link, .cmp-image-list__item-title-link');
      const title = item.querySelector('.cmp-image-list__item-title');
      const description = item.querySelector('.cmp-image-list__item-description, [class*="description"]');

      const textCell = [];
      if (titleLink) textCell.push(titleLink);
      else if (title) textCell.push(title);
      if (description) textCell.push(description);

      if (imageCell || textCell.length) {
        cells.push([label, imageCell, textCell.length ? textCell : '']);
      }
    });
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-tabs', cells });
  element.replaceWith(block);
}
