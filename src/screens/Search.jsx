import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search as SearchIcon, X, Sparkles, Sliders } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';

const QUICK_SUGGESTIONS = [
  'Banana Bread',
  'Brownie Boxes',
  'Cake Parfait',
  'Pastry Trays',
  'Small Chops',
  'Biscoff',
  'Oreo',
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const { data: products, loading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(input ? { q: input } : {}, { replace: true });
      if (input.trim().length >= 2) trackEvent('search_performed', { query: input.trim() });
    }, 250);
    return () => clearTimeout(timer);
  }, [input, setParams]);

  const query = input.trim();
  const results = useMemo(() => {
    if (query.length < 2 || !products) return [];
    const normalized = query.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(normalized) ||
      product.category?.toLowerCase().includes(normalized) ||
      product.desc?.toLowerCase().includes(normalized)
    );
  }, [query, products]);

  return (
    <main className="search-page">
      {/* 1. Prominent Search Header */}
      <section className="container search-hero-section">
        <span className="page-kicker">The Counter Catalogue</span>
        <h1 className="search-hero-title">Find your bake.</h1>
        <p className="search-hero-subtitle">
          Search by product name, topping crunch, box size, or flavour profile.
        </p>

        <div className="search-input-wrapper">
          <SearchIcon size={20} aria-hidden="true" className="search-input-icon" />
          <input
            id="search-main"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search banana bread, brownie box, small chops..."
            aria-label="Search the catalogue"
            className="search-main-field"
            autoFocus
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              aria-label="Clear search query"
              className="search-clear-button"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="search-quick-tags" aria-label="Suggested search terms">
          <span className="search-quick-label">Try searching:</span>
          {QUICK_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setInput(tag)}
              className="search-quick-chip"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Results or Discovery Categories */}
      <section className="container search-results-section" aria-live="polite">
        {query.length < 2 ? (
          <DiscoveryCategories categories={categories} />
        ) : productsLoading ? (
          <div className="editorial-product-grid" aria-label="Loading search results">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton editorial-card__skeleton" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="search-results-meta-bar">
              <h2>Results for “{query}”</h2>
              <span>{results.length} {results.length === 1 ? 'bake found' : 'bakes found'}</span>
            </div>
            <div className="editorial-product-grid">
              {results.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={`No bakes matching “${query}”`}
            desc="Try checking for typos or explore one of our made-to-order counter categories below."
          >
            <DiscoveryCategories categories={categories} compact />
          </EmptyState>
        )}
      </section>
    </main>
  );
}

function DiscoveryCategories({ categories, compact = false }) {
  if (!categories?.length) return null;
  return (
    <div className={`search-categories-panel${compact ? ' is-compact' : ''}`}>
      <div className="search-categories-panel__head">
        <span className="page-kicker">Explore by category</span>
        <h3>The Bakehouse Categories</h3>
      </div>
      <div className="search-categories-panel__grid">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/menu/${category.id}`}
            className="search-category-tile"
          >
            <div>
              <strong>{category.name}</strong>
              <p>{category.desc || 'Made fresh to order with 24h notice'}</p>
            </div>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
