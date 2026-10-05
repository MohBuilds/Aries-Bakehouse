import { useCallback, useEffect, useState } from 'react';
// Loaded on demand so pages that already have server data (e.g. the
// homepage) don't pull the Supabase SDK onto the critical path.
const loadCatalog = () => import('../lib/catalog.js');

// Tiny shared async-effect helper — every hook below follows the same
// loading/error/data shape, matching the "loading grid/gallery" states the
// spec already anticipated (§4/§6) for once the catalogue became real data.
//
// `initial`, when passed, is server-fetched data (see e.g. src/app/page.jsx,
// a Server Component that awaits catalog.js directly under an ISR
// `revalidate`) — when present, the hook seeds state from it and skips the
// client-side fetch entirely, so the page renders with data on first paint
// instead of a loading skeleton, and doesn't double-fetch what the server
// already fetched. Callers that don't pass `initial` keep fetching
// client-side exactly as before.
function useAsync(fn, deps, initial) {
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const [state, setState] = useState(
    initial !== undefined ? { data: initial, loading: false, error: null } : { data: null, loading: true, error: null },
  );

  useEffect(() => {
    if (initial !== undefined && attempt === 0) return;
    let cancelled = false;
    const load = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setState((current) => ({ ...current, loading: true }));
      try {
        const data = await fn();
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (error) {
        if (!cancelled) setState({ data: null, loading: false, error });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { ...state, retry };
}

export function useCategories(initial) {
  return useAsync(async () => (await loadCatalog()).getCategories(), [], initial);
}

export function useProducts(initial) {
  return useAsync(async () => (await loadCatalog()).getProducts(), [], initial);
}

export function useProduct(slug) {
  const { data, loading, error } = useAsync(async () => {
    const product = await (await loadCatalog()).findProduct(slug);
    if (!product) return null;
    const rules = product.configurator ? await (await loadCatalog()).getVariantRules(slug, product.configurator) : null;
    return { product, rules };
  }, [slug]);

  return { product: data?.product ?? null, rules: data?.rules ?? null, loading, error };
}

export function useRelatedProducts(slug, count = 4) {
  return useAsync(async () => (await loadCatalog()).relatedProducts(slug, count), [slug, count]);
}

export function useHomepageBestsellers(initial) {
  return useAsync(async () => (await loadCatalog()).getHomepageBestsellers(), [], initial);
}

export function useHomepageFeatured(initial) {
  return useAsync(async () => (await loadCatalog()).getHomepageFeatured(), [], initial);
}

export function useHomepageReviews(count = 3) {
  return useAsync(async () => (await loadCatalog()).getHomepageReviews(count), [count]);
}

export function useProductReviews(slug, count = 6) {
  return useAsync(async () => (await loadCatalog()).getProductReviews(slug, count), [slug, count]);
}
