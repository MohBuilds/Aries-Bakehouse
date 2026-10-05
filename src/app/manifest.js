export default function manifest() {
  return {
    id: '/',
    name: 'Aries 11 Bakehouse',
    short_name: 'Aries 11',
    description: 'Made-to-order banana bread, brownies, pastries, cake treats and small chops in Abeokuta.',
    lang: 'en-NG',
    dir: 'ltr',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#1C0D0A',
    theme_color: '#2B140F',
    categories: ['food', 'shopping', 'lifestyle'],
    prefer_related_applications: false,
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press the home-screen icon for these.
    shortcuts: [
      {
        name: 'Order banana bread',
        short_name: 'Banana bread',
        url: '/product/signature-banana-bread?source=shortcut',
        icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }],
      },
      { name: 'Browse the menu', short_name: 'Menu', url: '/menu?source=shortcut', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }] },
      { name: 'My cart', short_name: 'Cart', url: '/cart?source=shortcut', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }] },
      { name: 'My orders', short_name: 'Orders', url: '/account/orders?source=shortcut', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }] },
    ],
    // Shown in the richer install dialog on Android / desktop Chrome.
    screenshots: [
      { src: '/pwa-screenshots/home-narrow.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'A banana bread loaf, fresh from the oven' },
      { src: '/pwa-screenshots/toppings-narrow.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'One loaf, seven toppings' },
      { src: '/pwa-screenshots/menu-narrow.webp', sizes: '780x1688', type: 'image/webp', form_factor: 'narrow', label: 'Every bake, with live prices' },
      { src: '/pwa-screenshots/home-wide.webp', sizes: '1280x720', type: 'image/webp', form_factor: 'wide', label: 'Aries 11 Bakehouse' },
    ],
  };
}
