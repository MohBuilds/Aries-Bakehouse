import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, ShieldCheck, ShoppingBag, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import { fmtNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useProduct, useProductReviews, useRelatedProducts } from '../hooks/useCatalog.js';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PillSelector from '../components/PillSelector.jsx';
import SwatchPicker from '../components/SwatchPicker.jsx';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { productImageFit, productImagePadding } from '../lib/media.js';
import { trackEvent } from '../lib/analytics.js';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { product, rules, loading, error, retry } = useProduct(slug);

  if (loading) {
    return (
      <div className="container product-detail-loading">
        <div className="skeleton product-detail-loading__media" />
        <div className="product-detail-loading__controls">
          <div className="skeleton" style={{ height: 20, width: '30%', borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 48, width: '80%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 90, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
        </div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="container" role={error ? 'alert' : undefined}>
        <EmptyState
          headingLevel={1}
          title={error ? 'We couldn’t load this bake' : 'Bake not found'}
          desc={error ? 'Check your connection and try again.' : 'This bake is no longer on the menu.'}
          actionLabel="Browse the menu"
          actionTo="/menu"
        >
          {error && (
            <button type="button" className="btn btn-secondary" onClick={retry}>
              Try again
            </button>
          )}
        </EmptyState>
      </div>
    );
  }

  return <ProductDetailView slug={slug} product={product} rules={rules} />;
}

function ProductDetailView({ slug, product, rules }) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('aries11_recently_viewed');
      const slugs = raw ? JSON.parse(raw) : [];
      const next = [slug, ...slugs.filter((item) => item !== slug)].slice(0, 6);
      window.localStorage.setItem('aries11_recently_viewed', JSON.stringify(next));
    } catch (err) {
      console.error('Recently viewed save failed:', err);
    }
  }, [slug]);

  useEffect(() => {
    trackEvent('product_viewed', { productId: product.id, slug, name: product.name });
  }, [product.id, product.name, slug]);

  switch (product.configurator) {
    case 'banana-bread':
      return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeBananaBreadConfig} />;
    case 'small-chops':
      return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeSmallChopsConfig} />;
    case 'brownies':
      return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeBrowniesConfig} />;
    case 'pastries':
      return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makePastriesConfig} />;
    case 'cake':
      return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeCakeConfig} />;
    default:
      return <SimpleProduct key={slug} product={product} />;
  }
}

function PreorderCommitmentCard() {
  return (
    <div className="product-preorder-promise">
      <div className="product-preorder-promise__icon">
        <Clock size={18} aria-hidden="true" />
      </div>
      <div className="product-preorder-promise__text">
        <strong>Made to order · 24-hour notice</strong>
        <p>Choose pickup or delivery at checkout, at least 24 hours ahead.</p>
      </div>
    </div>
  );
}

function ProductInfoBlock({ product }) {
  return (
    <details className="product-info-accordion">
      <summary className="product-info-accordion__title">Ingredients & care</summary>
      <InfoRow label="Ingredients" value={confirmedInfo(product?.ingredientsNote, 'Ask our kitchen for the ingredients for this bake.')} />
      <InfoRow
        label="Allergens"
        value={confirmedInfo(product?.allergenNote, 'Please check with our kitchen before ordering if you have an allergy.')}
      />
      <InfoRow label="Storage" value={confirmedInfo(product?.storageNote, 'Ask our kitchen for storage instructions for this bake.')} />
    </details>
  );
}

function confirmedInfo(value, fallback) {
  return !value || value.trim().toUpperCase() === 'TBC' ? fallback : value;
}

function InfoRow({ label, value }) {
  return (
    <div className="product-info-row">
      <span className="product-info-row__label">{label}</span>
      <span className="product-info-row__value">{value}</span>
    </div>
  );
}

function productCategoryLabel(category) {
  if (category === 'brownies-cookies') return 'Brownies';
  return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProductBreadcrumb({ product }) {
  return (
    <Breadcrumb className="product-breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/menu" />}>Menu</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to={`/menu/${product.category}`} />}>{productCategoryLabel(product.category)}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{product.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Related({ slug }) {
  const { data: related, loading } = useRelatedProducts(slug, 4);
  if (loading || !related || related.length === 0) return null;
  return (
    <section className="container product-related-section" aria-labelledby="related-title">
      <div className="product-related-header">
        <h2 id="related-title">Pair with your bake</h2>
      </div>
      <div className="editorial-product-grid">
        {related.map((r) => (
          <ProductCard key={r.slug} product={r} />
        ))}
      </div>
    </section>
  );
}

function ProductGallery({ product, activeImage, alt }) {
  const images = useMemo(() => {
    const base = product.galleryImages?.length ? product.galleryImages : [{ url: product.image, alt: product.name }];
    const merged = [{ url: activeImage, alt }, ...base].filter((img) => img.url);
    return merged.filter((img, index) => merged.findIndex((x) => x.url === img.url) === index);
  }, [activeImage, alt, product.galleryImages, product.image, product.name]);
  const [selected, setSelected] = useState(activeImage || images[0]?.url);

  return (
    <div className="product-campaign-stage">
      <div className="product-campaign-stage__frame">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={selected}
            src={selected}
            alt={alt}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="product-campaign-stage__img"
            style={{ objectFit: productImageFit(product), padding: productImagePadding(product) }}
          />
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div aria-label="Product image gallery" className="product-campaign-stage__thumbs">
          {images.map((img) => (
            <button
              key={img.url}
              onClick={() => setSelected(img.url)}
              aria-label={`Show ${img.alt}`}
              className={`product-campaign-stage__thumb-btn${selected === img.url ? ' is-active' : ''}`}
            >
              <img src={img.url} alt="" style={{ objectFit: productImageFit(product) }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfiguredPreview({ product, image, label }) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState({ image, label });

  useEffect(() => {
    if (!image || image === displayed.image) return undefined;

    let cancelled = false;
    const preview = new window.Image();
    const showPreview = () => {
      if (!cancelled) setDisplayed({ image, label });
    };
    preview.onload = showPreview;
    preview.src = image;
    if (preview.complete && preview.naturalWidth > 0) queueMicrotask(showPreview);

    return () => {
      cancelled = true;
      preview.onload = null;
    };
  }, [displayed.image, displayed.label, image, label]);

  return (
    <div className="product-campaign-stage">
      <div className="product-campaign-stage__frame">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={displayed.image}
            src={displayed.image}
            alt={displayed.image === image ? label : displayed.label}
            fetchPriority="high"
            initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: reduceMotion ? 1 : 0, scale: 1.02 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
            className="product-campaign-stage__img"
            style={{ objectFit: productImageFit(product), padding: productImagePadding(product) }}
          />
        </AnimatePresence>
        <div className="product-campaign-stage__pill">
          <Sparkles size={13} aria-hidden="true" />
          <span>{displayed.image === image ? label : displayed.label}</span>
        </div>
      </div>
    </div>
  );
}

function ProductReviews({ slug }) {
  const { data: reviews, loading } = useProductReviews(slug, 6);
  if (loading || !reviews || reviews.length === 0) return null;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return (
    <section className="container product-reviews-section">
      <div className="product-reviews-header">
        <h2 className="product-reviews-title">Customer Reviews</h2>
        <span className="product-reviews-score">{average.toFixed(1)} / 5.0 Rating</span>
      </div>
      <div className="product-reviews-grid">
        {reviews.map((review) => (
          <div key={review.id} className="product-review-card">
            <div className="product-review-stars">
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </div>
            <p className="product-review-comment">&ldquo;{review.comment}&rdquo;</p>
            {review.author && <span className="product-review-author">— {review.author}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileProductAction({ price, summary, disabled = false, onAddToCart }) {
  return (
    <div className="mobile-sticky-action">
      <div className="mobile-sticky-action__meta">
        <span className="mobile-sticky-action__label">{summary || 'Order total'}</span>
        <strong className="mobile-sticky-action__price">{price}</strong>
      </div>
      <div className="mobile-sticky-action__buttons">
        <button type="button" className="btn btn-primary mobile-sticky-action__add" disabled={disabled} onClick={onAddToCart}>
          {disabled ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}

// Simple (no-configurator) products
function SimpleProduct({ product }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  const item = () => ({
    id: product.slug,
    name: product.name,
    price: product.startingPrice,
    qty,
    image: product.image,
    productId: product.id,
    variantSelections: {},
  });

  return (
    <div className="product-campaign-page">
      <div className="container">
        <ProductBreadcrumb product={product} />
      </div>

      <div className="container product-campaign-layout">
        {/* Left Column: Media Stage */}
        <div className="product-campaign-stage-col">
          <ProductGallery product={product} activeImage={product.image} alt={product.name} />
        </div>

        {/* Right Column: Information & Controls */}
        <div className="product-campaign-controls-col">
          <div className="product-campaign-header">
            <span className="editorial-badge editorial-badge--olive">{productCategoryLabel(product.category)}</span>
            <h1 className="product-campaign-title">{product.name}</h1>
            <div className="product-campaign-price">{product.startingPrice === null ? 'Price TBC' : fmtNaira(product.startingPrice)}</div>
            <p className="product-campaign-desc">{product.desc}</p>
          </div>

          <div className="product-campaign-sequence">
            <div className="product-composer__step">
              <div className="product-composer__section-label">Quantity</div>
              <QtyStepper qty={qty} setQty={setQty} min={1} />
            </div>

            <PreorderCommitmentCard />

            <div className="product-campaign-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg product-campaign-add-btn"
                disabled={product.outOfStock}
                onClick={() => addToCart(item(), { openDrawer: true })}
              >
                <ShoppingBag size={18} aria-hidden="true" />
                <span>{product.outOfStock ? 'Out of stock' : 'Add to cart'}</span>
              </button>
            </div>

            <ProductInfoBlock product={product} />
          </div>
        </div>
      </div>

      <MobileProductAction
        price={product.startingPrice === null ? 'Price TBC' : fmtNaira(product.startingPrice * qty)}
        disabled={product.outOfStock}
        onAddToCart={() => addToCart(item(), { openDrawer: true })}
      />
      <ProductReviews slug={product.slug} />
      <Related slug={product.slug} />
    </div>
  );
}

function QtyStepper({ qty, setQty, min = 1 }) {
  return (
    <div className="product-quantity-stepper">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={qty <= min}
        onClick={() => setQty(Math.max(min, qty - 1))}
        className="product-quantity-btn"
      >
        &minus;
      </button>
      <span aria-live="polite" className="product-quantity-val">
        {qty}
      </span>
      <button type="button" aria-label="Increase quantity" onClick={() => setQty(qty + 1)} className="product-quantity-btn">
        +
      </button>
    </div>
  );
}

// Configured products
function ConfiguredProduct({ product, rules, makeConfig }) {
  const { addToCart } = useCart();
  const config = useMemo(() => makeConfig(rules), [makeConfig, rules]);
  const [state, setState] = useState(() => config.initialState());

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackEvent('variant_selected', { productId: product.id, slug: product.slug, selections: state });
  }, [product.id, product.slug, state]);

  const unitPrice = config.unitPrice(state);
  const qty = state.qty;
  const priceKnown = unitPrice !== null;

  const variantImage = config.image(state) || product.image;
  const previewLabel = config.previewLabel ? config.previewLabel(state) : config.itemName(product, state);

  const buildItem = () => {
    const { qty: _qty, ...variantSelections } = state;
    return {
      id: `${product.slug}-${config.variantKey(state)}`,
      name: config.itemName(product, state),
      price: unitPrice,
      qty,
      image: variantImage,
      productId: product.id,
      variantSelections,
    };
  };

  return (
    <div className="product-campaign-page">
      <div className="container">
        <ProductBreadcrumb product={product} />
      </div>

      <div className="container product-campaign-layout">
        {/* Left Column: Interactive Media Stage */}
        <div className="product-campaign-stage-col">
          <ConfiguredPreview product={product} image={variantImage} label={previewLabel} />
        </div>

        {/* Right Column: Bake Building Sequence */}
        <div className="product-campaign-controls-col">
          <div className="product-campaign-header">
            <h1 className="product-campaign-title">{product.name}</h1>
            <div className="product-campaign-price">{priceKnown ? fmtNaira(unitPrice) : 'Price TBC'}</div>
            <p className="product-campaign-desc">{product.desc}</p>
          </div>

          <div className="product-campaign-sequence">
            {/* Step-by-step configuration fields */}
            <config.Fields state={state} setState={setState} />

            {/* Quantity */}
            <div className="product-composer__step">
              <div className="product-composer__section-label">Quantity</div>
              <QtyStepper qty={qty} setQty={(q) => setState((s) => ({ ...s, qty: q }))} min={config.minQty ? config.minQty(state) : 1} />
            </div>

            {/* 24-Hour Preorder Promise */}
            <PreorderCommitmentCard />

            {/* Live Animated Total */}
            <AnimatedTotal priceKnown={priceKnown} total={priceKnown ? unitPrice * qty : null} />

            {/* Main Action */}
            <div className="product-campaign-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg product-campaign-add-btn"
                disabled={product.outOfStock}
                onClick={() => addToCart(buildItem(), { openDrawer: true })}
              >
                <ShoppingBag size={18} aria-hidden="true" />
                <span>{product.outOfStock ? 'Unavailable' : 'Add to cart'}</span>
              </button>
            </div>

            {config.note && <div className="product-configurator__note">{config.note(state)}</div>}

            <ProductInfoBlock product={product} />
          </div>
        </div>
      </div>

      <MobileProductAction
        disabled={product.outOfStock}
        price={priceKnown ? fmtNaira(unitPrice * qty) : 'Price TBC'}
        summary={`${buildItem().name}${qty > 1 ? ` × ${qty}` : ''}`}
        onAddToCart={() => addToCart(buildItem(), { openDrawer: true })}
      />
      <ProductReviews slug={product.slug} />
      <Related slug={product.slug} />
    </div>
  );
}

function AnimatedTotal({ priceKnown, total }) {
  const reduceMotion = useReducedMotion();
  const text = priceKnown ? fmtNaira(total) : 'Price TBC';
  return (
    <div className="product-running-total">
      <span className="product-running-total__label">Running total</span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.strong
          key={text}
          initial={{ y: reduceMotion ? 0 : 10, opacity: reduceMotion ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduceMotion ? 0 : -10, opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="product-running-total__val"
        >
          {text}
        </motion.strong>
      </AnimatePresence>
    </div>
  );
}

function makeBananaBreadConfig(rules) {
  return {
    initialState: () => ({ size: 'medium', topping: 'plain', mixed: false, qty: 1 }),
    minQty: (state) => rules.sizes.find((s) => s.id === state.size)?.minQty ?? 1,
    unitPrice: (state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      return state.mixed && size.mixedPrice ? size.mixedPrice : size.price;
    },
    image: (state) => (state.mixed ? rules.mixedImage : rules.toppings.find((t) => t.id === state.topping)?.image),
    previewLabel: (state) => (state.mixed ? 'Mixed toppings' : rules.toppings.find((t) => t.id === state.topping)?.label),
    variantKey: (state) => `${state.size}-${state.mixed ? 'mixed' : state.topping}`,
    itemName: (product, state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      const topping = state.mixed ? 'Mixed Toppings' : rules.toppings.find((t) => t.id === state.topping)?.label;
      return `${size.label} Banana Bread — ${topping}`;
    },
    note: (state) =>
      state.size === 'mini' ? `Minimum quantity for Mini loaves: ${rules.sizes.find((s) => s.id === 'mini').minQty}` : null,
    Fields({ state, setState }) {
      const mixedAllowed = rules.mixedAllowedSizes.includes(state.size);
      const activeTopping = state.mixed ? null : rules.toppings.find((t) => t.id === state.topping);
      return (
        <div className="product-config-fields">
          <div className="product-composer__step">
            <div className="product-composer__section-label">Loaf size</div>
            <PillSelector
              ariaLabel="Size"
              options={rules.sizes.map((s) => ({ id: s.id, label: `${s.label} · ${fmtNaira(s.price)}` }))}
              value={state.size}
              onChange={(size) =>
                setState((s) => ({
                  ...s,
                  size,
                  mixed: rules.mixedAllowedSizes.includes(size) ? s.mixed : false,
                  qty: Math.max(s.qty, rules.sizes.find((x) => x.id === size).minQty || 1),
                }))
              }
            />
          </div>
          <div className="product-composer__step">
            <div className="product-composer__label-row">
              <div className="product-composer__section-label">Topping</div>
              {mixedAllowed && (
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, mixed: !s.mixed }))}
                  className={`product-config__mixed-btn${state.mixed ? ' is-active' : ''}`}
                >
                  {state.mixed ? 'Mixed selected ✓' : 'Mix toppings (+₦500)'}
                </button>
              )}
            </div>
            <SwatchPicker
              ariaLabel="Topping"
              disabled={state.mixed}
              options={rules.toppings.map((t) => ({ id: t.id, label: t.label, image: t.icon || t.image, color: t.color }))}
              value={state.topping}
              onChange={(topping) => setState((s) => ({ ...s, topping }))}
            />
            <div aria-live="polite" className="product-config__field-hint">
              {state.mixed
                ? 'A mix of artisan toppings distributed across your loaf.'
                : activeTopping
                  ? `${activeTopping.label} topping shown on loaf.`
                  : null}
            </div>
          </div>
        </div>
      );
    },
  };
}

function makeBrowniesConfig(rules) {
  return {
    initialState: () => ({ size: '4', flavour: 'biscoff', mixed: false, qty: 1 }),
    unitPrice: (state) => rules.sizes.find((s) => s.id === state.size)?.price,
    image: (state) => {
      if (state.mixed) return rules.sizes.find((s) => s.id === state.size)?.image;
      const flavourId = state.flavour.replaceAll('-', '');
      return `/uploads/aries11-brownies-box-${state.size}-${flavourId}.webp`;
    },
    previewLabel: (state) => {
      const size = rules.sizes.find((s) => s.id === state.size)?.label;
      const flavour = state.mixed ? 'Mixed flavours' : rules.flavours.find((f) => f.id === state.flavour)?.label;
      return `${size} · ${flavour}`;
    },
    variantKey: (state) => `${state.size}-${state.mixed ? 'mixed' : state.flavour}`,
    itemName: (product, state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      const flavour = state.mixed ? 'Mixed Flavours' : rules.flavours.find((f) => f.id === state.flavour)?.label;
      return `${size.label} Brownies — ${flavour}`;
    },
    Fields({ state, setState }) {
      return (
        <div className="product-config-fields">
          <div className="product-composer__step">
            <div className="product-composer__section-label">Box size</div>
            <PillSelector
              ariaLabel="Box size"
              options={rules.sizes.map((s) => ({ id: s.id, label: `${s.label} (${fmtNaira(s.price)})` }))}
              value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size }))}
            />
          </div>
          <div className="product-composer__step">
            <div className="product-composer__label-row">
              <div className="product-composer__section-label">Flavour</div>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, mixed: !s.mixed }))}
                className={`product-config__mixed-btn${state.mixed ? ' is-active' : ''}`}
              >
                {state.mixed ? 'Mixed box selected ✓' : 'Mix flavours (same price)'}
              </button>
            </div>
            <SwatchPicker
              ariaLabel="Flavour"
              disabled={state.mixed}
              options={rules.flavours.map((f) => ({ id: f.id, label: f.label, image: f.icon || f.image }))}
              value={state.flavour}
              onChange={(flavour) => setState((s) => ({ ...s, flavour }))}
            />
          </div>
        </div>
      );
    },
  };
}

function makePastriesConfig(rules) {
  return {
    initialState: () => ({ option: 'mixed', qty: 1 }),
    unitPrice: (state) => rules.options.find((o) => o.id === state.option)?.price,
    image: (state) => rules.options.find((o) => o.id === state.option)?.image,
    previewLabel: (state) => rules.options.find((o) => o.id === state.option)?.label,
    variantKey: (state) => state.option,
    itemName: (product, state) => rules.options.find((o) => o.id === state.option)?.label,
    note: () => rules.pieceCountNote,
    Fields({ state, setState }) {
      return (
        <div className="product-config-fields">
          <div className="product-composer__step">
            <div className="product-composer__section-label">Tray combination</div>
            <PillSelector
              ariaLabel="Pastry combination"
              options={rules.options.map((o) => ({ id: o.id, label: `${o.label} · ${fmtNaira(o.price)}` }))}
              value={state.option}
              onChange={(option) => setState((s) => ({ ...s, option }))}
            />
          </div>
        </div>
      );
    },
  };
}

function makeSmallChopsConfig(rules) {
  return {
    initialState: () => ({ platter: 'solo-survivor', qty: 1 }),
    unitPrice: (state) => rules.platters.find((p) => p.id === state.platter)?.price,
    image: (state) => rules.platters.find((p) => p.id === state.platter)?.image,
    previewLabel: (state) => rules.platters.find((p) => p.id === state.platter)?.label,
    variantKey: (state) => state.platter,
    itemName: (product, state) => rules.platters.find((p) => p.id === state.platter)?.label,
    Fields({ state, setState }) {
      return (
        <div className="product-config-fields">
          <div className="product-composer__step">
            <div className="product-composer__section-label">Platter size</div>
            <PillSelector
              ariaLabel="Platter size"
              options={rules.platters.map((p) => ({ id: p.id, label: `${p.label} · ${fmtNaira(p.price)}` }))}
              value={state.platter}
              onChange={(platter) => setState((s) => ({ ...s, platter }))}
            />
          </div>
        </div>
      );
    },
  };
}

function makeCakeConfig(rules) {
  return {
    initialState: () => ({ size: rules.sizes?.[0]?.id || 'standard', flavour: 'chocolate', qty: 1 }),
    unitPrice: (state) => {
      const sizeObj = rules.sizes?.find((s) => s.id === state.size);
      return sizeObj ? sizeObj.price : product.startingPrice;
    },
    image: (state) => {
      return rules.flavourImages?.[state.flavour] || product.image;
    },
    previewLabel: (state) => {
      const flv = rules.flavours?.find((f) => f.id === state.flavour)?.label || state.flavour;
      return `${flv}`;
    },
    variantKey: (state) => `${state.size}-${state.flavour}`,
    itemName: (product, state) => {
      const flv = rules.flavours?.find((f) => f.id === state.flavour)?.label || state.flavour;
      return `${product.name} — ${flv}`;
    },
    Fields({ state, setState }) {
      return (
        <div className="product-config-fields">
          {rules.sizes && rules.sizes.length > 1 && (
            <div className="product-composer__step">
              <div className="product-composer__section-label">Size</div>
              <PillSelector
                ariaLabel="Cake size"
                options={rules.sizes.map((s) => ({ id: s.id, label: `${s.label} · ${fmtNaira(s.price)}` }))}
                value={state.size}
                onChange={(size) => setState((s) => ({ ...s, size }))}
              />
            </div>
          )}
          {rules.flavours && rules.flavours.length > 0 && (
            <div className="product-composer__step">
              <div className="product-composer__section-label">Flavour</div>
              <SwatchPicker
                ariaLabel="Cake flavour"
                options={rules.flavours.map((f) => ({ id: f.id, label: f.label, image: f.icon || f.image }))}
                value={state.flavour}
                onChange={(flavour) => setState((s) => ({ ...s, flavour }))}
              />
            </div>
          )}
        </div>
      );
    },
  };
}
