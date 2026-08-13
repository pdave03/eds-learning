/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the FAQs accordion (EDS accordion block).
 * Source: https://wknd.site/us/en/faqs.html (div.accordion / div.cmp-accordion)
 *
 * WKND renders the FAQ as an AEM accordion component: an outer
 * <div class="cmp-accordion"> containing one <div.cmp-accordion__item> per
 * question. Each item has a header/button with the question in
 * <span.cmp-accordion__title> and a <div.cmp-accordion__panel> holding the
 * answer (rich text inside a nested container/text component).
 *
 * Output (matches the EDS accordion convention): the block table has 2 columns.
 * The first row is the block name ("accordion"); each subsequent row is one
 * accordion item as two cells:
 *   [ <title cell: question text>, <content cell: answer markup> ]
 * When rendered, clicking the title toggles the display of its content.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-accordion__item')];
  const cells = [];

  items.forEach((item) => {
    // Title cell (mandatory): the clickable question/label.
    const titleEl = item.querySelector('.cmp-accordion__title');
    const question = titleEl ? (titleEl.textContent || '').trim() : '';
    if (!question) return;

    // Content cell (mandatory): the answer body revealed when expanded.
    const panel = item.querySelector('.cmp-accordion__panel');
    const answer = document.createElement('div');
    let sources = panel ? [...panel.querySelectorAll('.cmp-text')] : [];
    if (!sources.length && panel) sources = [panel];

    sources.forEach((src) => {
      const paras = [...src.querySelectorAll('p')];
      if (paras.length) {
        paras.forEach((p) => answer.append(p.cloneNode(true)));
      } else {
        const text = (src.textContent || '').trim();
        if (text) {
          const p = document.createElement('p');
          p.textContent = text;
          answer.append(p);
        }
      }
    });

    cells.push([question, answer]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
