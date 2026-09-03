'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_META = {
  'banana-bread': {
    image: '/uploads/aries11-bananabread-topping-mixed.webp',
    alt: 'Freshly baked Aries 11 Banana Bread with assorted toppings',
    price: 'From ₦4,500',
    type: 'Signature Loaf',
    isConfigurable: true,
    tagline: 'Moist, rich, and topped to your exact craving with 7 crunch choices.',
    highlights: ['Mini or Standard Loaf', 'Biscoff, Oreo & Coconut', 'Zero Preservatives'],
    cta: 'Build your loaf',
    href: '/product/signature-banana-bread',
  },
  'brownies': {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'Aries 11 luxury fudgy brownie box',
    price: 'From ₦5,000',
    type: 'Fudgy Brownie Box',
    isConfigurable: true,
    tagline: 'Dense, fudgy squares finished with luxury crunches and Belgian chocolate.',
    highlights: ['Boxes of 4, 6, 9 or 16', 'Double Chocolate Swirls', 'Gift-Ready Box'],
    cta: 'Build a brownie box',
    href: '/product/brownie-box',
  },
  'brownies-cookies': {
    image: '/uploads/aries11-brownies-box-4.png',
    alt: 'Aries 11 luxury fudgy brownie box',
    price: 'From ₦5,000',
    type: 'Fudgy Brownie Box',
    isConfigurable: true,
    tagline: 'Dense, fudgy squares finished with luxury crunches and Belgian chocolate.',
    highlights: ['Boxes of 4, 6, 9 or 16', 'Double Chocolate Swirls', 'Gift-Ready Box'],
    cta: 'Build a brownie box',
    href: '/product/brownie-box',
  },
  'cake-treats': {
    image: '/uploads/aries11-caketreats-parfait-chocolate.png',
    alt: 'Aries 11 Cake Parfait layered dessert',
    price: 'From ₦3,000',
    type: 'Layered Parfait',
    isConfigurable: true,
    tagline: 'Decadent velvet sponge layered with silky whipped cream, served cold.',
    highlights: ['Red Velvet or Chocolate', 'Whipped Cream Layers', 'Served Chilled'],
    cta: 'Choose your parfait',
    href: '/product/cake-parfait',
  },
  'pastries': {
    image: '/uploads/aries11-pastries-mixedtray-complete.webp',
    alt: 'Aries 11 flaky golden pastry tray',
    price: 'From ₦6,500',
    type: 'Savoury Pastry Tray',
    isConfigurable: true,
    tagline: 'Suya pie, fish pie and sausage rolls baked golden for sharing.',
    highlights: ['Flaky Butter Pastry', 'Suya Spiced Beef', 'Sharing Trays'],
    cta: 'Choose a pastry tray',
    href: '/product/mixed-pastry-tray',
  },
  'small-chops': {
    image: '/uploads/aries11-smallchops-platter-large.webp',
    alt: 'Aries 11 hot small chops platter with samosas and puff puff',
    price: 'From ₦4,000',
    type: 'Party Platter',
    isConfigurable: false,
    tagline: 'Freshly made puff-puff, samosas and spring rolls arranged for gatherings.',
    highlights: ['Hot & Crispy Bites', 'Platters from 10 to 50+', 'Party Gathering Ready'],
    cta: 'Choose a platter',
    href: '/product/small-chops-platter',
  },
};

const DEFAULT_META = {
  image: '/uploads/aries11-brand-collection-hero.webp',
  alt: 'Aries 11 Bakehouse artisanal menu spread',
  price: 'Made fresh',
  type: 'Made to order',
  isConfigurable: false,
  tagline: 'Handcrafted in Abeokuta with 24 hours notice.',
  highlights: ['24h Notice', 'Abeokuta Pickup & Delivery', '100% Made Fresh'],
  cta: 'Explore category',
  href: '/menu',
};

export default function CounterRail({ categories = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!categories || categories.length === 0) return null;

  const validCategories = categories.filter(
    (c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx
  );
  
  const currentCategory = validCategories[currentIndex] || validCategories[0];
  const meta = CATEGORY_META[currentCategory.id] || DEFAULT_META;

  function nextSlide() {
    setCurrentIndex((prev) => (prev + 1) % validCategories.length);
  }

  function prevSlide() {
    setCurrentIndex((prev) => (prev - 1 + validCategories.length) % validCategories.length);
  }

  return (
    <section
      id="menu-preview"
      className="container catalogue-carousel-section"
      aria-labelledby="catalogue-carousel-title"
    >
      {/* 1. Header with Sideways Controls */}
      <div className="catalogue-carousel-header">
        <div>
          <span className="page-kicker">The Counter Catalogue</span>
          <h2 id="catalogue-carousel-title">Bakes for every table.</h2>
          <p className="catalogue-carousel-subtitle">
            Browse made-to-order bakes by category. Configure sizes, crunches, and flavours.
          </p>
        </div>

        {/* Sideways Navigation Controls */}
        <div className="catalogue-carousel-controls" aria-label="Catalogue slide navigation">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous category"
            className="catalogue-nav-btn"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <span className="catalogue-nav-counter">
            {String(currentIndex + 1).padStart(2, '0')} / {String(validCategories.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next category"
            className="catalogue-nav-btn"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 2. Category Pill Chips Bar */}
      <div className="catalogue-chips-rail" role="tablist" aria-label="Menu categories">
        {validCategories.map((category, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setCurrentIndex(idx)}
              className={`catalogue-chip${isActive ? ' is-active' : ''}`}
            >
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Luxury Carousel Showcase Card */}
      <div className="catalogue-stage-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory.id}
            className="catalogue-stage-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Left Media Canvas */}
            <div className="catalogue-stage-media">
              <img
                src={meta.image}
                alt={meta.alt}
                loading="eager"
                decoding="async"
                className="catalogue-stage-img"
              />
              <span className="catalogue-stage-badge">
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
            </div>

            {/* Right Details Panel */}
            <div className="catalogue-stage-content">
              <div className="catalogue-stage-kicker-row">
                <span className="catalogue-stage-kicker">{meta.type}</span>
                <strong className="catalogue-stage-price">{meta.price}</strong>
              </div>

              <h3 className="catalogue-stage-title">{currentCategory.name}</h3>
              <p className="catalogue-stage-tagline">{currentCategory.desc || meta.tagline}</p>

              {/* Key Highlights */}
              {meta.highlights && (
                <ul className="catalogue-stage-highlights" aria-label="Category features">
                  {meta.highlights.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Action Buttons */}
              <div className="catalogue-stage-actions">
                <Link to={meta.href || `/menu/${currentCategory.id}`} className="btn btn-primary catalogue-stage-primary-cta">
                  <span>{meta.cta}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link to={`/menu/${currentCategory.id}`} className="btn btn-secondary catalogue-stage-secondary-cta">
                  <span>Browse category</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
