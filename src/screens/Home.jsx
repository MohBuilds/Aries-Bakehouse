'use client';

import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useCategories, useHomepageFeatured } from '../hooks/useCatalog.js';
import ProductCard from '../components/ProductCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ScrollRevealGroup from '../components/ScrollRevealGroup.jsx';
import CounterRail from '../components/CounterRail.jsx';
import CounterScroller from '../components/CounterScroller.jsx';
import OrderingWorks from '../components/OrderingWorks.jsx';
import { Button } from '../components/ui/button.jsx';

export default function Home({ categories: initialCategories, featured: initialFeatured } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { data: featured, loading: featuredLoading } = useHomepageFeatured(initialFeatured);

  return (
    <div className="home-page">
      {/* 1. Act 1: Decisive Opening Hero */}
      <HeroCarousel />

      {/* 2. Act 2: Signature Assembly Theatre (The Standout Experience) */}
      <CounterScroller />

      {/* 3. Act 3: Editorial Menu Discovery Wall */}
      {categoriesLoading ? (
        <div className="container category-showcase__loading" aria-label="Loading menu categories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <CounterRail categories={categories} />
      )}

      {/* 4. Act 4: Fresh Picks from the Counter */}
      <section className="container home-section home-section--fresh-picks" aria-labelledby="featured-title">
        <div className="home-section__header">
          <div>
            <span className="page-kicker">From the kitchen</span>
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

      {/* 5. Act 5: Calm Reassurance & How Ordering Works */}
      <OrderingWorks />
    </div>
  );
}
