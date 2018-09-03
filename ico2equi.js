const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

document.forms.image.image.addEventListener('change', e => {
  const img = $('#loaded');
  try { URL.revokeObjectURL(img.src); } catch (_) {}
  if (!e.target.files.length) return;

  img.addEventListener('load', run, {once: true});
  img.src = URL.createObjectURL(e.target.files[0]);
});


[...$$('input[type=radio]')].forEach(e => {
  e.addEventListener('change', run);
});

function run() {
  const canvas = $('canvas'), ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const img = $('#loaded');
  if (img.naturalWidth === 0 || img.naturalHeight === 0)
    return;

  const out = ctx.createImageData(w, h);
  const pixels = out.data;

  const src = getImageData(img);
  function src_rgb(x, y) {
    const offset = 4 * (Math.floor(x) + Math.floor(y) * src.width);
    return src.data[offset] << 16 | src.data[offset + 1] << 8 | src.data[offset + 2];
  }

  function dst_rgb(x, y, rgb) {
    const offset = 4 * (x + y * out.width);
    pixels[offset + 0] = (rgb >> 16) & 0xff;
    pixels[offset + 1] = (rgb >> 8) & 0xff;
    pixels[offset + 2] = (rgb) & 0xff;
    pixels[offset + 3] = 255;
  }

  const type = document.forms.options.split.value;

  for (let x = 0; x < w; ++x) {
    for (let y = 0; y < h; ++y) {
      let sx, sy;
      const f = x / w;
      const tri = Math.floor(f * 10); // which triangle (0...9)
      const tf = (f - (tri * 1/10)) * 10; // fraction within half-tri (0...1)
      if (y < h * 1/3) {
        const vf = y / (h / 3); // vertical scale (fraction of half-tri) (0...1)
        if (type === 'none') {
          const src_tris = 11;
          const base = tri / src_tris;
          if (tri % 2)
            sx = (base + tf * (vf / src_tris)) * src.width;
          else
            sx = (base + ((1-vf) + tf * vf) / src_tris) * src.width;
        } else {
          const src_tris = 10;
          const base = tri / src_tris;
          if ((type === 'top') === !!(tri % 2))
            sx = (base + ((1-vf) + tf * vf) / src_tris) * src.width;
          else
            sx = (base + tf * (vf / src_tris)) * src.width;
        }
      } else if (y < h * 2/3) {
        if (type === 'none') {
          const vf = (y - h / 3) / (h / 3); // vertical scale (fraction of half-tri) (0...1)
          const src_tris = 11;
          const base = ((tri === 0 && tf < vf) ? (src_tris - 1) : tri) / src_tris;
          sx = (base + tf / src_tris) * src.width;
        } else {
          sx = x / w * src.width;
        }
      } else {
        const vf = 1 - (y - h * 2/3) / (h / 3); // vertical scale (fraction of half-tri)
        if (type === 'none') {
          const src_tris = 11;
          const base = ((tri === 0 ? (src_tris - 1) : tri) ) / src_tris;
          if (tri % 2)
            sx = (base + ((1 - vf) + tf * vf) / src_tris) * src.width;
          else
            sx = (base + tf * (vf / src_tris)) * src.width;
        } else {
          const src_tris = 10;
          const base = tri / src_tris;
          if ((type === 'top') === !!(tri % 2))
            sx = (base + tf * (vf / src_tris)) * src.width;
          else
            sx = (base + ((1-vf) + tf * vf) / src_tris) * src.width;
        }
      }
      sy = y / h * src.height;
      dst_rgb(x, y, src_rgb(sx, sy));
    }
  }

  ctx.putImageData(out, 0, 0);

  function getImageData(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const voff = 0.025 * canvas.height;
    return ctx.getImageData(
      0,
      voff,
      canvas.width,
      canvas.height - voff * 2);
  }
}
