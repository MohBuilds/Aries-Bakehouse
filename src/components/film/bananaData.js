// Content + timing for the homepage Banana Bread film. Prices and sizes come
// from the live catalogue (see src/app/page.jsx); nothing here invents a number.

const ROOT = '/uploads/film-bb';

export const BB_PRODUCT_HREF = '/product/signature-banana-bread';
export const BB_WHATSAPP_URL =
  'https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%27d%20like%20to%20order%20banana%20bread.';

export const still = (name) => ({
  src: `${ROOT}/${name}.webp`,
  srcSet: `${ROOT}/${name}-720.webp 720w, ${ROOT}/${name}.webp 1254w`,
});

export const SEQUENCES = {
  explode: { count: 80, url: (size, i) => `${ROOT}/explode/${size}/${String(i + 1).padStart(2, '0')}.webp` },
  drop: { count: 80, url: (size, i) => `${ROOT}/drop/${size}/${String(i + 1).padStart(2, '0')}.webp` },
  orbit: { count: 64, url: (size, i) => `${ROOT}/orbit/${size}/${String(i + 1).padStart(2, '0')}.webp` },
};

// Toppings shown on the loaf, in film order. All stills are pixel-aligned
// with plain.webp, so a cross-dissolve reads as the topping changing.
export const FINISHES = [
  { id: 'plain', label: 'Plain' },
  { id: 'oreo', label: 'Oreo' },
  { id: 'doublechoc', label: 'Double Chocolate' },
  { id: 'coconut', label: 'Coconut Flakes' },
  { id: 'nuts', label: 'Nuts Crunch' },
  { id: 'biscoff', label: 'Biscoff' },
  { id: 'mixed', label: 'Mixed' },
];

export const MACROS = [
  { id: 'crumb', title: 'The crumb', line: 'Dense, tender and flecked with ripe banana.' },
  { id: 'crust', title: 'The crust', line: 'A deep caramel dome that cracks as it rises.' },
];

// Where each loaf sits in sizes.webp (% of the image), for the price tags.
export const SIZE_TAGS = [
  { id: 'mini', x: 18 },
  { id: 'medium', x: 44.5 },
  { id: 'large', x: 75 },
];

export const T = {
  slicedAt: 8.5,
  explodeStart: 13,
  explodeEnd: 26,
  macroStart: 27,
  macroBeat: 6.5,
  finishesStart: 41,
  dropStart: 45,
  dropEnd: 52.5,
  toppingStep: 3,
  sizesStart: 77,
  orbitStart: 89.5,
  orbitEnd: 103.5,
  finalStart: 104,
  TOTAL: 116,
};
