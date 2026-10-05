// Shared matching keeps category names and plural searches consistent.
function words(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (['brownies', 'cookies', 'pies'].includes(word)) return word.slice(0, -1);
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (/(?:x|ch|sh|ss|z)es$/.test(word)) return word.slice(0, -2);
      return word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
    });
}

export function matchesProduct(product, query) {
  const tokens = words(query);
  const content = words(`${product.name} ${product.category || ''} ${product.desc || ''}`);
  return tokens.every((token) => content.some((word) => word.includes(token)));
}

export function sortProducts(products, sort) {
  if (sort === 'featured') return products;
  return [...products].sort((a, b) => {
    const aKnown = Number.isFinite(a.startingPrice);
    const bKnown = Number.isFinite(b.startingPrice);
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    if (!aKnown) return 0;
    return sort === 'price-desc' ? b.startingPrice - a.startingPrice : a.startingPrice - b.startingPrice;
  });
}
