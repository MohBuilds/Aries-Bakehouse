'use client';

import { useMemo, useState } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import { matchesProduct, sortProducts } from '../lib/catalogBrowse.js';
import ProductCard from '../components/ProductCard.jsx';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.jsx';

const CATEGORY_EDITORIAL = {
  all: {
    title: 'Our menu',
    subtitle: 'Choose your bake. Make it yours.',
  },
  'banana-bread': {
    title: 'Banana bread',
    subtitle: 'Choose your loaf size and favourite topping.',
  },
  brownies: {
    title: 'Brownie boxes',
    subtitle: 'Fudgy brownies in boxes of 4, 6, 9 or 16.',
  },
  'brownies-cookies': {
    title: 'Brownie boxes',
    subtitle: 'Fudgy brownies in boxes of 4, 6, 9 or 16.',
  },
  'cake-treats': {
    title: 'Cake treats & parfaits',
    subtitle: 'Layered parfaits and chilled cake treats.',
  },
  pastries: {
    title: 'Pastry trays',
    subtitle: 'Meat pies, fish pies and sausage rolls for sharing.',
  },
  'small-chops': {
    title: 'Small chops',
    subtitle: 'Samosas, spring rolls and puff-puff, made for sharing.',
  },
};

export default function Menu({ categories: initialCategories, products: initialProducts } = {}) {
  const { category: categoryFromRoute } = useParams();
  const category = categoryFromRoute === 'brownies' ? 'brownies-cookies' : categoryFromRoute || 'all';
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');

  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { data: products, loading: productsLoading, error: productsError, retry: retryProducts } = useProducts(initialProducts);

  const filtered = useMemo(() => {
    let list = products || [];
    if (category !== 'all') list = list.filter((product) => product.category === category);
    if (search.trim()) list = list.filter((product) => matchesProduct(product, search));
    return sortProducts(list, sort);
  }, [category, products, search, sort]);

  const activeCategoryObj = categories?.find((item) => item.id === category);
  const activeCategoryName = category === 'all' ? 'All bakes' : activeCategoryObj?.name || formatCategoryName(category);

  const editorialCopy = CATEGORY_EDITORIAL[category] || {
    title: `${activeCategoryName}.`,
    subtitle: 'Made fresh to order with at least 24 hours notice in our Abeokuta kitchen.',
  };

  return (
    <div className="menu-page">
      {/* 1. Large Editorial Category Introduction */}
      <section className="menu-hero-section" aria-labelledby="menu-title">
        <div className="container">
          <MenuBreadcrumb category={category} categoryName={activeCategoryName} />
          <h1 id="menu-title" className="menu-hero-title">
            {editorialCopy.title}
          </h1>
          <p className="menu-hero-subtitle">{editorialCopy.subtitle}</p>
        </div>
      </section>

      {/* 2. Sticky Category Navigation Rail */}
      <div className="menu-sticky-nav-wrap">
        <div className="container menu-sticky-nav-inner">
          <nav className="menu-category-rail" aria-label="Filter by product category">
            {[{ id: 'all', name: 'All bakes' }, ...(categoriesLoading ? [] : categories || [])].map((item) => {
              const isActive = category === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.id === 'all' ? '/menu' : `/menu/${item.id}`}
                  scroll={false}
                  aria-current={isActive ? 'page' : undefined}
                  className={`menu-category-pill${isActive ? ' is-active' : ''}`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Search & Sort Bar */}
          <div className="menu-quick-filters">
            <div className="menu-search-box">
              <SearchIcon size={16} aria-hidden="true" className="menu-search-icon" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bakes..."
                aria-label="Search the menu"
                className="menu-search-input"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="menu-search-clear">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="menu-sort-box">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products" className="menu-sort-select">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Editorial Catalogue Grid */}
      <section className="container menu-catalogue-section" aria-label={`${activeCategoryName} products`}>
        <div className="menu-status-bar">
          <span className="menu-status-count" role="status">
            <strong>{activeCategoryName}</strong>
            {!productsLoading && (
              <>
                {' '}
                · {filtered.length} {filtered.length === 1 ? 'bake' : 'bakes'}
              </>
            )}
          </span>
          <span className="menu-status-promise">24-hour notice</span>
        </div>

        {productsLoading ? (
          <div className="editorial-product-grid" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton editorial-card__skeleton" />
            ))}
          </div>
        ) : productsError ? (
          <div className="menu-empty-state" role="alert">
            <h2>We couldn’t load the menu</h2>
            <p>Check your connection and try again.</p>
            <button type="button" className="btn btn-primary" onClick={retryProducts}>
              Try again
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="editorial-product-grid">
            {filtered.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="menu-empty-state">
            <h3>No bakes found</h3>
            <p>Try a different search or browse all bakes.</p>
            <button type="button" onClick={() => setSearch('')} className="btn btn-primary">
              Clear search
            </button>
            {category !== 'all' && (
              <Link to="/menu" className="text-link">
                Browse all bakes
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function MenuBreadcrumb({ category, categoryName }) {
  const showingCategory = category !== 'all';
  return (
    <Breadcrumb className="menu-breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {showingCategory ? <BreadcrumbLink render={<Link to="/menu" />}>Menu</BreadcrumbLink> : <BreadcrumbPage>Menu</BreadcrumbPage>}
        </BreadcrumbItem>
        {showingCategory && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{categoryName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function formatCategoryName(value) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
