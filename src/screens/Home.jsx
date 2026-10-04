'use client';

import { useCategories } from '../hooks/useCatalog.js';
import BrownieFilm from '../components/film/BrownieFilm.jsx';
import CounterRail from '../components/CounterRail.jsx';

export default function Home({ categories: initialCategories, featured = [] } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);

  return (
    <div className="home-page">
      {/* Act 1–2: Scroll-scrubbed Brownie Box film (hero → 360° → CTA) */}
      <BrownieFilm featured={featured} />

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


    </div>
  );
}
