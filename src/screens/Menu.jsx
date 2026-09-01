'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
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
    title: 'The complete bakehouse counter.',
    subtitle: 'From signature banana bread loaves to fudgy brownie boxes and party sharing platters. Made from scratch in Abeokuta.',
  },
  'banana-bread': {
    title: 'Signature Banana Bread.',
    subtitle: 'Ultra-moist loaves crafted in two sizes, finished with your choice of 7 signature toppings.',
  },
  'brownies': {
    title: 'Luxury Brownie Boxes.',
    subtitle: 'Deep cocoa, fudgy centers, and crisp toppings in gift boxes of 4, 6, 9, or 16 squares.',
  },
  'brownies-cookies': {
    title: 'Luxury Brownie Boxes.',
    subtitle: 'Deep cocoa, fudgy centers, and crisp toppings in gift boxes of 4, 6, 9, or 16 squares.',
  },
  'cake-treats': {
    title: 'Cake Treats & Parfaits.',
    subtitle: 'Decadent parfaits and ice-cold cake twists layered with rich creams and sponge cakes.',
  },
  'pastries': {
    title: 'Golden Pastry Trays.',
    subtitle: 'Suya meat pies, fish pies, and buttery sausage rolls gathered hot for your gathering.',
  },
  'small-chops': {
    title: 'Small Chops Platters.',
    subtitle: 'Crisp samosas, golden spring rolls, and hot puff-puff platters arranged fresh for sharing.',
  },
};

export default function Menu({ categories: initialCategories, products: initialProducts } = {}) {
  const { category: categoryFromRoute } = useParams();
  const [category, setCategory] = useState(categoryFromRoute || 'all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const navRailRef = useRef(null);

  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { data: products, loading: productsLoading } = useProducts(initialProducts);

  useEffect(() => {
    // Keep the selected tab aligned when navigating directly between category routes.
    setCategory(categoryFromRoute || 'all');
  }, [categoryFromRoute]);

  const filtered = useMemo(() => {
    let list = products || [];
    if (category !== 'all') list = list.filter((product) => product.category === category);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter((product) => (
        product.name.toLowerCase().includes(query)
        || product.desc?.toLowerCase().includes(query)
      ));
    }
    if (sort === 'price-asc') list = [...list].sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
    if (sort === 'price-desc') list = [...list].sort((a, b) => (b.startingPrice ?? -Infinity) - (a.startingPrice ?? -Infinity));
    if (sort === 'newest') list = [...list].reverse();
    return list;
  }, [category, products, search, sort]);

  const activeCategoryObj = categories?.find((item) => item.id === category);
  const activeCategoryName = category === 'all'
    ? 'All treats'
    : activeCategoryObj?.name || formatCategoryName(category);

  const editorialCopy = CATEGORY_EDITORIAL[category] || {
    title: `${activeCategoryName}.`,
    subtitle: 'Made fresh to order with at least 24 hours notice in our Abeokuta kitchen.',
  };

  function selectCategory(id) {
    setCategory(id);
  }

  return (
    <div className="menu-page">
      {/* 1. Large Editorial Category Introduction */}
      <section className="menu-hero-section" aria-labelledby="menu-title">
        <div className="container">
          <MenuBreadcrumb category={category} categoryName={activeCategoryName} />
          <span className="page-kicker">Made to order in Abeokuta</span>
          <h1 id="menu-title" className="menu-hero-title">{editorialCopy.title}</h1>
          <p className="menu-hero-subtitle">{editorialCopy.subtitle}</p>
        </div>
      </section>

      {/* 2. Sticky Category Navigation Rail */}
      <div className="menu-sticky-nav-wrap">
        <div className="container menu-sticky-nav-inner">
          <nav
            ref={navRailRef}
            className="menu-category-rail"
            aria-label="Filter by product category"
          >
            {[{ id: 'all', name: 'All Bakes' }, ...(categoriesLoading ? [] : categories || [])].map((item) => {
              const isActive = category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCategory(item.id)}
                  className={`menu-category-pill${isActive ? ' is-active' : ''}`}
                >
                  <span>{item.name}</span>
                </button>
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
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="menu-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="menu-sort-box">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort products"
                className="menu-sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Editorial Catalogue Grid */}
      <section className="container menu-catalogue-section" aria-label={`${activeCategoryName} products`}>
        <div className="menu-status-bar">
          <span className="menu-status-count">
            <strong>{activeCategoryName}</strong>
            {!productsLoading && <> · {filtered.length} {filtered.length === 1 ? 'bake' : 'bakes'}</>}
          </span>
          <span className="menu-status-promise">All bakes require 24 hours notice</span>
        </div>

        {productsLoading ? (
          <div className="editorial-product-grid" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton editorial-card__skeleton" />
            ))}
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
            <p>We couldn’t find any treats matching your search. Try another query or reset the filters.</p>
            <button
              type="button"
              onClick={() => { setCategory('all'); setSearch(''); }}
              className="btn btn-primary"
            >
              Show all bakes
            </button>
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
          {showingCategory
            ? <BreadcrumbLink render={<Link to="/menu" />}>Menu</BreadcrumbLink>
            : <BreadcrumbPage>Menu</BreadcrumbPage>}
        </BreadcrumbItem>
        {showingCategory && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{categoryName}</BreadcrumbPage></BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function formatCategoryName(value) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
