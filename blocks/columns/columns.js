/**
 * Decorates the default columns layout: flag picture-only columns as image
 * columns so CSS can order/lay them out.
 * @param {Element} block The block element
 */
function decorateDefault(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}

/**
 * `featured` variant: image on one side, grey content panel on the other, with
 * an optional eyebrow paragraph above the heading.
 * @param {Element} block The block element
 */
function decorateFeatured(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-featured-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-featured-img-col');
        }
      } else {
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

/**
 * `imgbottom` variant: full-bleed image with a white content box overlapping
 * its bottom (same visual treatment as a carousel-hero slide).
 * @param {Element} block The block element
 */
function decorateImgbottom(block) {
  const stage = document.createElement('div');
  stage.className = 'columns-imgbottom-stage';

  let contentCol;
  let imageCol;

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (col.querySelector('picture')) {
        col.classList.add('columns-imgbottom-img-col');
        imageCol = col;
      } else {
        col.classList.add('columns-imgbottom-content-col');
        contentCol = col;
      }
    });
  });

  // image first (background layer), then content (overlay)
  if (imageCol) stage.append(imageCol);
  if (contentCol) stage.append(contentCol);

  block.replaceChildren(stage);
}

/**
 * Columns block with variants (class-based, one base block):
 *   - default     → generic multi-column layout with image columns
 *   - `featured`  → WKND featured article (image + grey content panel)
 *   - `imgbottom` → full-bleed image with an overlapping white content box
 * @param {Element} block The block element
 */
export default function decorate(block) {
  if (block.classList.contains('imgbottom')) decorateImgbottom(block);
  else if (block.classList.contains('featured')) decorateFeatured(block);
  else decorateDefault(block);
}
