'use client';

import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useCategories, useHomepageFeatured } from '../hooks/useCatalog.js';
import ProductCard from '../components/ProductCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ScrollRevealGroup from '../components/ScrollRevealGroup.jsx';
import CounterRail from '../components/CounterRail.jsx';
import SignatureLoafSpotlight from '../components/SignatureLoafSpotlight.jsx';
import CounterScroller from '../components/CounterScroller.jsx';
import OrderingWorks from '../components/OrderingWorks.jsx';
import PreorderPromise from '../components/PreorderPromise.jsx';
import WhatsAppConcierge from '../components/WhatsAppConcierge.jsx';
import { Button } from '../components/ui/button.jsx';

export default function Home({ categories: initialCategories, featured: initialFeatured } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { data: featured, loading: featuredLoading } = useHomepageFeatured(initialFeatured);

  return (
    <div className="home-page">
      {/* 1. Decisive Cinematic Opening */}
      <HeroCarousel />

      {/* 2. Editorial Menu Discovery Wall */}
      {categoriesLoading ? (
        <div className="container category-showcase__loading" aria-label="Loading menu categories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <CounterRail categories={categories} />
      )}

      {/* 3. Signature Spotlight Moment */}
      <SignatureLoafSpotlight />

      {/* 4. Signature Assembly Experience (The Wow Moment) */}
      <CounterScroller />

      {/* 5. Fresh Picks Editorial Grid */}
      <section className="container home-section home-section--fresh-picks" aria-labelledby="featured-title">
        <div className="home-section__header">
          <div>
            <p className="home-section__kicker">From the kitchen</p>
            <h2 id="featured-title">Fresh picks</h2>
            <p>Made-to-order favourites for a thoughtful treat or an easy gathering.</p>
          </div>
          <Button asChild variant="secondary" className="home-section__viewall-btn">
            <Link to="/menu">
              <span>View full menu</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {featuredLoading ? (
          <div className="home-product-grid" aria-label="Loading featured products">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton home-product-grid__skeleton" />
            ))}
          </div>
        ) : featured?.length > 0 ? (
          <ScrollRevealGroup className="home-product-grid">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} variant="floating" />
            ))}
          </ScrollRevealGroup>
        ) : null}
      </section>

      {/* 6. Calm Three-Part Ordering Timeline */}
      <OrderingWorks />

      {/* 7. The 24-Hour Preorder Brand Promise */}
      <PreorderPromise />

      {/* 8. Branded WhatsApp Concierge Ordering */}
      <WhatsAppConcierge />
    </div>
  );
}
