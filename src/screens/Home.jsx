'use client';

import { useCategories } from '../hooks/useCatalog.js';
import BananaFilm from '../components/film/BananaFilm.jsx';
import CounterRail from '../components/CounterRail.jsx';

export default function Home({ categories: initialCategories, products = [], bananaSizes = null } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);

  return (
    <div className="home-page">
      {/* Act 1: Scroll-scrubbed Banana Bread film (hero → toppings → sizes → order) */}
      <BananaFilm sizes={bananaSizes} />

      {/* Act 2: The catalogue, priced from live product data */}
      {categoriesLoading ? (
        <div className="container category-showcase__loading" aria-label="Loading menu categories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <CounterRail categories={categories} products={products} />
      )}
    </div>
  );
}
