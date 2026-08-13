/**
 * Accordion block — a list of collapsible question/answer items.
 *
 * Authoring contract: each row is one item with two cells:
 *   | <question / summary> | <answer / panel content> |
 * The block renders each row as a native <details><summary> element, so items
 * are keyboard-accessible and collapsed by default. Multiple items can be open
 * at the same time (opening one does not close the others).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const items = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const summaryCell = cells[0];
    const panelCell = cells[1];
    if (!summaryCell || !(summaryCell.textContent || '').trim()) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    // keep only the question text; the source cell may wrap it in <p>
    summary.textContent = (summaryCell.textContent || '').trim();

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (panelCell) {
      // move the authored answer markup (paragraphs, links) into the panel
      while (panelCell.firstChild) body.append(panelCell.firstChild);
    }

    details.append(summary, body);
    items.push(details);
  });

  if (!items.length) return;

  block.replaceChildren(...items);
}
