export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-featured-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is the only content in the column → image column
          picWrapper.classList.add('columns-featured-img-col');
        }
      } else {
        // the other column holds the text content
        col.classList.add('columns-featured-content-col');
        // a paragraph that appears before the heading is the eyebrow / pretitle
        const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
        const firstP = col.querySelector('p');
        if (heading && firstP) {
          const order = firstP.compareDocumentPosition(heading);
          // eslint-disable-next-line no-bitwise
          if (order & Node.DOCUMENT_POSITION_FOLLOWING) {
            firstP.classList.add('columns-featured-eyebrow');
          }
        }
      }
    });
  });
}
