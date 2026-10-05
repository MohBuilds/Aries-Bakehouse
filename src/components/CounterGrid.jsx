import Image from 'next/image';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { fmtNaira } from '../lib/format.js';

// One tile per category, keyed by category slug. `href` goes straight to the
// category's flagship product (the previous one-click path); anything without
// an entry here falls back to its category page and its stored photo.
const TILES = {
  'banana-bread': {
    image: '/uploads/aries11-bananabread-topping-mixed.webp',
    alt: 'A banana bread loaf with Oreo, Biscoff, nut and raisin toppings',
    href: '/product/signature-banana-bread',
  },
  'small-chops': {
    image: '/uploads/aries11-smallchops-platter-large.webp',
    alt: 'A small chops platter with puff-puff, samosas and spring rolls',
    href: '/product/small-chops-platter',
  },
  'brownies-cookies': {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'A box of four brownies with different toppings',
    href: '/product/brownie-box',
  },
  pastries: {
    image: '/uploads/aries11-pastries-mixedtray-complete.webp',
    alt: 'A tray of golden pastries and sausage rolls',
    href: '/product/mixed-pastry-tray',
  },
  'cake-treats': {
    image: '/uploads/aries11-caketreats-parfait-redvelvet.png',
    alt: 'A red velvet cake parfait cup',
    href: '/product/cake-parfait',
  },
  'ice-cream-twist': {
    image: '/uploads/aries11-caketreats-icecreamtwist-chocolate.png',
    alt: 'A chocolate ice cream cake twist cup',
    href: '/product/ice-cream-cake-twist',
  },
};

// Price shown on each tile, derived from live product data so it can never
// drift from what checkout charges. Unpriced products stay "Price TBC".
function categoryPrice(products, categoryId) {
  const items = products.filter((product) => product.category === categoryId);
  if (!items.length) return null;
  const priced = items.filter((product) => product.startingPrice != null);
  if (!priced.length) return 'Price TBC';
  const lowest = Math.min(...priced.map((product) => product.startingPrice));
  const hasRange = items.length > 1 || priced.some((product) => product.priceFrom);
  return `${hasRange ? 'From ' : ''}${fmtNaira(lowest)}`;
}

export default function CounterGrid({ categories = [], products = [] }) {
  const unique = categories.filter((c, index, all) => all.findIndex((x) => x.id === c.id) === index);
  if (unique.length === 0) return null;

  return (
    <section id="menu-preview" className="container counter" aria-labelledby="counter-title">
      <header className="counter__head">
        <h2 id="counter-title">Bakes for every table.</h2>
        <Link to="/menu" className="counter__all">
          <span>See the full menu</span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <ul className="counter__grid">
        {unique.map((category) => {
          const tile = TILES[category.id];
          const price = categoryPrice(products, category.id);
          return (
            <li key={category.id}>
              <Link to={tile?.href || `/menu/${category.id}`} className="counter-tile">
                <span className="counter-tile__media">
                  <Image
                    src={tile?.image || category.image}
                    alt={tile?.alt || category.name}
                    fill
                    sizes="(min-width: 1024px) 370px, (min-width: 640px) 33vw, 50vw"
                    className="counter-tile__img"
                  />
                  <span className="counter-tile__go" aria-hidden="true">
                    <ArrowUpRight size={18} />
                  </span>
                </span>
                <span className="counter-tile__body">
                  <span className="counter-tile__name">{category.name}</span>
                  {price && <span className="counter-tile__price">{price}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
