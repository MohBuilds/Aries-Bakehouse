import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ArrowUpRight, Search as SearchIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import { matchesProduct } from '../lib/catalogBrowse.js';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';

const QUICK_SUGGESTIONS = ['Banana Bread', 'Brownie Boxes', 'Cake Parfait', 'Pastry Trays', 'Small Chops'];

function subscribeToSearch(callback) {
  window.addEventListener('popstate', callback);
  window.addEventListener('aries-search-change', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('aries-search-change', callback);
  };
}
function readSearch() {
  return window.location.search;
}
function serverSearch() {
  return '';
}

export default function Search() {
  const search = useSyncExternalStore(subscribeToSearch, readSearch, serverSearch);
  const input = useMemo(() => new URLSearchParams(search).get('q') || '', [search]);
  function setInput(value) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set('q', value);
    else params.delete('q');
    const query = params.toString();
    window.history.replaceState(null, '', '/search' + (query ? '?' + query : ''));
    window.dispatchEvent(new Event('aries-search-change'));
  }
  const { data: products, loading: productsLoading, error: productsError, retry: retryProducts } = useProducts();
  const { data: categories } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim().length >= 2) trackEvent('search_performed', { query: input.trim() });
    }, 250);
    return () => clearTimeout(timer);
  }, [input]);

  const query = input.trim();
  const results = useMemo(() => {
    if (query.length < 2 || !products) return [];
    return products.filter((product) => matchesProduct(product, query));
  }, [query, products]);

  return (
    <div className="search-page">
      {/* 1. Prominent Search Header */}
      <section className="container search-hero-section">
        <h1 className="search-hero-title">Find your bake</h1>
        <p className="search-hero-subtitle">Search by name or category.</p>

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
            <button type="button" onClick={() => setInput('')} aria-label="Clear search query" className="search-clear-button">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="search-quick-tags" aria-label="Suggested search terms">
          {QUICK_SUGGESTIONS.map((tag) => (
            <button key={tag} type="button" onClick={() => setInput(tag)} className="search-quick-chip">
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
        ) : productsError ? (
          <EmptyState icon={SearchIcon} title="Search is unavailable" desc="Check your connection and try again.">
            <button type="button" className="btn btn-primary" onClick={retryProducts}>
              Try again
            </button>
          </EmptyState>
        ) : results.length > 0 ? (
          <>
            <div className="search-results-meta-bar">
              <h2>Results for “{query}”</h2>
              <span>
                {results.length} {results.length === 1 ? 'bake found' : 'bakes found'}
              </span>
            </div>
            <div className="editorial-product-grid">
              {results.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon={SearchIcon} title={`No bakes matching “${query}”`} desc="Try another search or browse a category.">
            <DiscoveryCategories categories={categories} compact />
          </EmptyState>
        )}
      </section>
    </div>
  );
}

function DiscoveryCategories({ categories, compact = false }) {
  if (!categories?.length) return null;
  return (
    <div className={`search-categories-panel${compact ? ' is-compact' : ''}`}>
      <div className="search-categories-panel__head">
        <h3>Browse categories</h3>
      </div>
      <div className="search-categories-panel__grid">
        {categories.map((category) => (
          <Link key={category.id} to={`/menu/${category.id}`} className="search-category-tile">
            <div>
              <strong>{category.name}</strong>
              <p>{category.desc || 'Explore bakes'}</p>
            </div>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
