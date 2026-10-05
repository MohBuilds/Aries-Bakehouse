'use client';

import { useCategories } from '../hooks/useCatalog.js';
import BananaFilm from '../components/film/BananaFilm.jsx';
import CounterGrid from '../components/CounterGrid.jsx';
import ClosingPanel from '../components/ClosingPanel.jsx';

export default function Home({ categories: initialCategories, products = [], bananaSizes = null } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);

  return (
    <div className="home-page">
      {/* Act 1: Scroll-scrubbed Banana Bread film (hero → toppings → sizes → order) */}
      <BananaFilm sizes={bananaSizes} />

      {/* Act 2: every category at a glance, priced from live product data */}
      {categoriesLoading ? (
        <div className="container category-showcase__loading" aria-label="Loading menu categories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <CounterGrid categories={categories} products={products} />
      )}

      {/* Act 3: the one closing call to action + how ordering works */}
      <ClosingPanel />
    </div>
  );
}
