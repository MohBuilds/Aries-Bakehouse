import Home from '../screens/Home.jsx';
import { getCategories, getProducts, getVariantRules } from '../lib/catalog.js';

// ISR: re-fetched from Supabase at most once every 5 minutes per the Next.js
// data cache, instead of every visitor's browser hitting Supabase directly
// on every page load (previously all client-side via useEffect).
export const revalidate = 300;

export default async function HomePage() {
  const [categories, products, bananaRules] = await Promise.all([
    getCategories(),
    getProducts(),
    // The film still renders (without prices) if variant rules can't load.
    getVariantRules('signature-banana-bread', 'banana-bread').catch(() => null),
  ]);
  return <Home categories={categories} products={products} bananaSizes={bananaRules?.sizes ?? null} />;
}
