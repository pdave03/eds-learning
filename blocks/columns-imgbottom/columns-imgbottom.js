export default function decorate(block) {
  // Source rows: one row holds the text (heading + description + CTA),
  // another row holds the full-width image. Merge them into a single
  // positioned stage so the image becomes a full-bleed background and the
  // text renders in a white content box overlapping its bottom (same visual
  // treatment as a carousel-hero slide).
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
