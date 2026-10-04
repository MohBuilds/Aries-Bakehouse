// Shared content + geometry for the homepage Brownie Box film.
// Every claim here is backed by the catalogue (sizes, flavours, "mix flavours
// (same price)", 24-hour notice) or is directly visible in the photography.

const FILM_ROOT = '/uploads/film';

export const FILM_ASSETS = {
  suspended: `${FILM_ROOT}/box-suspended.webp`,
  assembled: `${FILM_ROOT}/box-assembled.webp`,
  frame: (size, index) => `${FILM_ROOT}/drop/${size}/${String(index + 1).padStart(2, '0')}.webp`,
  frameCount: 61,
  monogram: '/uploads/Aries11_Monogram_Transparent.svg',
};

export const PRODUCT_HREF = '/product/brownie-box';
export const WHATSAPP_ORDER_URL =
  'https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%27d%20like%20to%20order%20a%20brownie%20box.';

// Cut-outs were traced from box-suspended.webp, so `box` is each piece's
// bounding box as a percentage of that square photo. `drift` is where the
// piece floats to during the separation, in % of the plate.
export const PIECES = [
  {
    id: 'biscoff',
    name: 'Biscoff',
    note: 'Biscuit over a chocolate drizzle',
    cutout: `${FILM_ROOT}/pieces/cut-biscoff.webp`,
    box: { x: 13.876, y: 28.469, w: 34.689, h: 29.187 },
    drift: { x: -21, y: -15, r: -7 },
    labelSide: 'start',
  },
  {
    id: 'oreo',
    name: 'Oreos',
    note: 'Cookies-and-cream, split cookies on top',
    cutout: `${FILM_ROOT}/pieces/cut-oreo.webp`,
    box: { x: 47.847, y: 11.962, w: 31.34, h: 34.37 },
    drift: { x: 19, y: -10, r: 6 },
    labelSide: 'end',
  },
  {
    id: 'coconut',
    name: 'Coconut Crunch',
    note: 'Piped cream, toasted coconut',
    cutout: `${FILM_ROOT}/pieces/cut-coconut.webp`,
    box: { x: 22.887, y: 50.319, w: 34.37, h: 31.18 },
    drift: { x: -17, y: 16, r: 5 },
    labelSide: 'start',
  },
  {
    id: 'dark',
    name: 'Dark Chocolate',
    note: 'Crackled top, a square of dark chocolate',
    cutout: `${FILM_ROOT}/pieces/cut-dark.webp`,
    box: { x: 52.392, y: 46.172, w: 33.174, h: 26.794 },
    drift: { x: 21, y: 14, r: -5 },
    labelSide: 'end',
  },
];

export const MACROS = [
  {
    id: 'biscoff',
    name: 'Biscoff',
    line: 'Caramelised biscuit, pressed into a ripple of chocolate.',
    image: '/uploads/aries11-brownie-biscoff-single.webp',
    focus: '45% 40%',
  },
  {
    id: 'oreo',
    name: 'Oreos',
    line: 'Whipped cookies-and-cream, finished with split cookies.',
    image: '/uploads/aries11-brownie-oreos-single.webp',
    focus: '52% 45%',
  },
  {
    id: 'coconut',
    name: 'Coconut Crunch',
    line: 'Piped cream under a drift of toasted coconut.',
    image: '/uploads/aries11-brownie-coconutcrunch-single.webp',
    focus: '48% 48%',
  },
  {
    id: 'dark',
    name: 'Dark Chocolate',
    line: 'A crackled crust around a square of dark chocolate.',
    image: '/uploads/aries11-brownie-darkchocolate-single.webp',
    focus: '50% 46%',
  },
];

export const TURNTABLE_CALLOUTS = [
  { id: 'sizes', value: '4 · 6 · 9 · 16', label: 'Box sizes' },
  { id: 'finishes', value: '5 finishes', label: 'Mix them at no extra cost' },
  { id: 'fulfil', value: '24 hours', label: 'Notice, then pickup or delivery in Abeokuta' },
];

// Timeline positions (arbitrary units; the scroll length is derived from
// TOTAL so every unit is the same distance of scroll).
export const T = {
  revealStart: 4,
  separateStart: 18,
  macroStart: 34,
  macroBeat: 5.5,
  reassembleStart: 57,
  dropStart: 69.5,
  dropEnd: 78,
  turntableStart: 79,
  turntableEnd: 95,
  finalStart: 95.5,
  TOTAL: 106,
};

export const CHAPTERS = [
  { id: 'open', label: 'Open', at: 0 },
  { id: 'finishes', label: 'Finishes', at: 11 },
  { id: 'close-up', label: 'Up close', at: T.macroStart + 2.5 },
  { id: 'boxed', label: 'Boxed', at: T.reassembleStart + 1 },
  { id: 'every-angle', label: 'Every angle', at: T.turntableStart + 2 },
  { id: 'order', label: 'Order', at: T.TOTAL },
];
