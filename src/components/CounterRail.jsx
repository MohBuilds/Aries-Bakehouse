'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { fmtNaira } from '../lib/format.js';

const CATEGORY_META = {
  'banana-bread': {
    image: '/uploads/aries11-bananabread-topping-mixed.webp',
    alt: 'Aries 11 Banana Bread with toppings',
    type: 'Signature Loaf',
    tagline: 'Ripe banana loaf with brown butter and your choice of seven toppings.',
    cta: 'Build your loaf',
    href: '/product/signature-banana-bread',
  },
  brownies: {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'Aries 11 Brownie Box',
    type: 'Fudgy Squares',
    tagline: 'Rich, fudgy brownie boxes in 4, 6, 9 or 16 squares finished with crunches.',
    cta: 'Build a brownie box',
    href: '/product/brownie-box',
  },
  'brownies-cookies': {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'Aries 11 Brownie Box',
    type: 'Fudgy Squares',
    tagline: 'Rich, fudgy brownie boxes in 4, 6, 9 or 16 squares finished with crunches.',
    cta: 'Build a brownie box',
    href: '/product/brownie-box',
  },
  'cake-treats': {
    image: '/uploads/aries11-caketreats-icecreamtwist-chocolate.png',
    alt: 'Aries 11 Ice Cream Twist',
    type: 'Chilled Treat',
    tagline: 'Chocolate or red velvet sponge twisted with icy cream and crunches — served cold.',
    cta: 'Choose your treat',
    href: '/product/cake-parfait',
  },
  pastries: {
    image: '/uploads/aries11-pastries-mixedtray-complete.webp',
    alt: 'Aries 11 Pastry Tray',
    type: 'Savoury Trays',
    tagline: 'Suya meat pies, spiced fish pies, and sausage rolls baked fresh for sharing.',
    cta: 'Choose a pastry tray',
    href: '/product/mixed-pastry-tray',
  },
  'small-chops': {
    image: '/uploads/aries11-smallchops-platter-small.webp',
    alt: 'Aries 11 Small Chops Platter',
    type: 'Party Platter',
    tagline: 'Hot puff-puff, crispy samosas, and golden spring rolls arranged on platters.',
    cta: 'Choose a platter',
    href: '/product/small-chops-platter',
  },
};

const DEFAULT_META = {
  image: '/uploads/aries11-brand-collection-hero.webp',
  alt: 'Aries 11 Bakehouse artisanal menu spread',
  type: 'Made to order',
  tagline: 'Handcrafted in Abeokuta with 24 hours notice.',
  cta: 'Explore category',
  href: '/menu',
};

// Price shown on each category card, derived from live product data so it
// can never drift from what checkout charges. Unpriced products stay "TBC".
function categoryPrice(products, categoryId) {
  const items = products.filter((product) => product.category === categoryId);
  if (!items.length) return null;
  const priced = items.filter((product) => product.startingPrice != null);
  if (!priced.length) return 'Price TBC';
  const lowest = Math.min(...priced.map((product) => product.startingPrice));
  const hasRange = items.length > 1 || priced.some((product) => product.priceFrom);
  return `${hasRange ? 'From ' : ''}${fmtNaira(lowest)}`;
}

export default function CounterRail({ categories = [], products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!categories || categories.length === 0) return null;

  const validCategories = categories.filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx);

  const currentCategory = validCategories[currentIndex] || validCategories[0];
  const meta = CATEGORY_META[currentCategory.id] || DEFAULT_META;
  const price = categoryPrice(products, currentCategory.id);

  function nextSlide() {
    setCurrentIndex((prev) => (prev + 1) % validCategories.length);
  }

  function prevSlide() {
    setCurrentIndex((prev) => (prev - 1 + validCategories.length) % validCategories.length);
  }

  return (
    <section id="menu-preview" className="container catalogue-carousel-section" aria-labelledby="catalogue-carousel-title">
      {/* Header with Sideways Controls */}
      <div className="catalogue-carousel-header">
        <div>
          <span className="page-kicker">The Counter Catalogue</span>
          <h2 id="catalogue-carousel-title">Bakes for every table.</h2>
          <p className="catalogue-carousel-subtitle">Browse made-to-order selections. Choose a category and configure the details.</p>
        </div>

        <div className="catalogue-carousel-controls" role="group" aria-label="Catalogue slide navigation">
          <button type="button" onClick={prevSlide} aria-label="Previous category" className="catalogue-nav-btn">
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <span className="catalogue-nav-counter" aria-live="polite">
            {String(currentIndex + 1).padStart(2, '0')} / {String(validCategories.length).padStart(2, '0')}
          </span>
          <button type="button" onClick={nextSlide} aria-label="Next category" className="catalogue-nav-btn">
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="catalogue-chips-rail" role="group" aria-label="Menu categories">
        {validCategories.map((category, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setCurrentIndex(idx)}
              className={`catalogue-chip${isActive ? ' is-active' : ''}`}
            >
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Luxury Showcase Card */}
      <div className="catalogue-stage-card">
        <div key={currentCategory.id} className="catalogue-stage-grid catalogue-stage-grid--enter">
          {/* Clean Photography Frame */}
          <div className="catalogue-stage-media">
            <Image src={meta.image} alt={meta.alt} fill sizes="(max-width: 899px) 100vw, 55vw" className="catalogue-stage-img" />
          </div>

          {/* Clean Details Panel */}
          <div className="catalogue-stage-content">
            <div className="catalogue-stage-kicker-row">
              <span className="catalogue-stage-kicker">{meta.type}</span>
              {price && <strong className="catalogue-stage-price">{price}</strong>}
            </div>

            <h3 className="catalogue-stage-title">{currentCategory.name}</h3>
            <p className="catalogue-stage-tagline">{currentCategory.desc || meta.tagline}</p>

            <div className="catalogue-stage-actions">
              <Link to={meta.href || `/menu/${currentCategory.id}`} className="btn btn-primary catalogue-stage-primary-cta">
                <span>{meta.cta}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
              <Link to={`/menu/${currentCategory.id}`} className="catalogue-stage-link">
                <span>View category</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
