'use client';

import { useCategories } from '../hooks/useCatalog.js';
import HeroCarousel from '../components/HeroCarousel.jsx';
import CounterScroller from '../components/CounterScroller.jsx';
import CounterRail from '../components/CounterRail.jsx';
import OrderingWorks from '../components/OrderingWorks.jsx';

export default function Home({ categories: initialCategories } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);

  return (
    <div className="home-page">
      {/* Act 1: Decisive Opening Hero */}
      <HeroCarousel />

      {/* Act 2: Signature Assembly Theatre (Frameless Luxury Stage) */}
      <CounterScroller />

      {/* Act 3: The Integrated Counter Catalogue Stage */}
      {categoriesLoading ? (
        <div className="container category-showcase__loading" aria-label="Loading menu categories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <CounterRail categories={categories} />
      )}

      {/* Act 4: The 3-Step Ordering Process & Kitchen Reassurance */}
      <OrderingWorks />
    </div>
  );
}
