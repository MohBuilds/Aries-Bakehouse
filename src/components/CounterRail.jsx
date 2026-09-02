'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_META = {
  'banana-bread': {
    image: '/uploads/aries11-bananabread-topping-mixed.webp',
    alt: 'Freshly baked Aries 11 Banana Bread with assorted toppings',
    price: 'From ₦4,500',
    type: 'Configurable loaf',
    isConfigurable: true,
    tagline: 'Moist, rich, and topped to your exact craving.',
    cta: 'Build a loaf',
  },
  'brownies': {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'Aries 11 luxury fudgy brownie box',
    price: 'From ₦5,000',
    type: 'Configurable box',
    isConfigurable: true,
    tagline: 'Dense, fudgy squares finished with luxury crunches.',
    cta: 'Build a box',
  },
  'brownies-cookies': {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'Aries 11 luxury fudgy brownie box',
    price: 'From ₦5,000',
    type: 'Configurable box',
    isConfigurable: true,
    tagline: 'Dense, fudgy squares finished with luxury crunches.',
    cta: 'Build a box',
  },
  'cake-treats': {
    image: '/uploads/aries11-caketreats-parfait-chocolate.png',
    alt: 'Aries 11 Cake Parfait layered dessert',
    price: 'From ₦3,000',
    type: 'Made to order',
    isConfigurable: true,
    tagline: 'Layered parfaits and cake twists served chilled.',
    cta: 'Explore parfaits',
  },
  'pastries': {
    image: '/uploads/aries11-pastries-mixedtray-complete.webp',
    alt: 'Aries 11 flaky golden pastry tray',
    price: 'From ₦6,500',
    type: 'Curated tray',
    isConfigurable: true,
    tagline: 'Suya pie, fish pie and sausage rolls fresh from the oven.',
    cta: 'Choose a tray',
  },
  'small-chops': {
    image: '/uploads/aries11-smallchops-platter-large.webp',
    alt: 'Aries 11 hot small chops platter with samosas and puff puff',
    price: 'From ₦4,000',
    type: 'Party platter',
    isConfigurable: false,
    tagline: 'Puff-puff, samosas and spring rolls arranged for sharing.',
    cta: 'Choose a platter',
  },
};

const DEFAULT_META = {
  image: '/uploads/aries11-brand-collection-hero.webp',
  alt: 'Aries 11 Bakehouse artisanal menu spread',
  price: 'Made fresh',
  type: 'Made to order',
  isConfigurable: false,
  tagline: 'Handcrafted in Abeokuta with 24 hours notice.',
  cta: 'Explore category',
};

export default function CounterRail({ categories }) {
  const [activeCategory, setActiveCategory] = useState(
    categories?.[0]?.id || 'banana-bread'
  );

  if (!categories?.length) return null;

  const currentMeta = CATEGORY_META[activeCategory] || DEFAULT_META;

  return (
    <section
      id="menu-preview"
      className="container menu-wall-section"
      aria-labelledby="menu-wall-title"
    >
      <div className="menu-wall-header">
        <div>
          <span className="page-kicker">The Counter Catalogue</span>
          <h2 id="menu-wall-title">Bakes for every table.</h2>
          <p className="menu-wall-subtitle">
            Explore our made-to-order menu. Choose your category, customize the details, and give the kitchen 24 hours.
          </p>
        </div>
        <Link to="/menu" className="menu-wall-viewall">
          <span>Explore all bakes</span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="menu-wall-layout">
        {/* Category Selection Rail */}
        <div className="menu-wall-nav" role="list">
          {categories.map((category, index) => {
            const meta = CATEGORY_META[category.id] || DEFAULT_META;
            const isActive = activeCategory === category.id;

            return (
              <div
                key={category.id}
                role="listitem"
                className={`menu-wall-item${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveCategory(category.id)}
                onFocus={() => setActiveCategory(category.id)}
              >
                <Link
                  to={`/menu/${category.id}`}
                  className="menu-wall-item__link"
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="menu-wall-item__head">
                    <span className="menu-wall-item__index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="menu-wall-item__title">{category.name}</h3>
                  </div>

                  <p className="menu-wall-item__desc">
                    {category.desc || meta.tagline}
                  </p>

                  <div className="menu-wall-item__meta">
                    <span className="menu-wall-item__price">{meta.price}</span>
                    <span className={`menu-wall-item__type${meta.isConfigurable ? ' is-configurable' : ''}`}>
                      {meta.isConfigurable ? (
                        <>
                          <Sliders size={12} aria-hidden="true" />
                          <span>Customizable</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} aria-hidden="true" />
                          <span>{meta.type}</span>
                        </>
                      )}
                    </span>
                    <span className="menu-wall-item__arrow">
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </span>
                  </div>
                </Link>

                {/* Mobile Preview Reveal */}
                <div className="menu-wall-item__mobile-preview">
                  <img
                    src={meta.image}
                    alt={meta.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Dynamic Preview Stage */}
        <aside className="menu-wall-stage" aria-label="Category Preview">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              className="menu-wall-stage__frame"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={currentMeta.image}
                alt={currentMeta.alt}
                className="menu-wall-stage__img"
                decoding="async"
              />
              <div className="menu-wall-stage__caption">
                <div className="menu-wall-stage__caption-meta">
                  <strong>{currentMeta.type}</strong>
                  <span className="menu-wall-stage__caption-price">{currentMeta.price}</span>
                </div>
                <p>{currentMeta.tagline}</p>
                <Link to={`/menu/${activeCategory}`} className="menu-wall-stage__cta">
                  <span>{currentMeta.cta}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>
    </section>
  );
}
