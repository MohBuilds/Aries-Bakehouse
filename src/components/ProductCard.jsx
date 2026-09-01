import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sliders, Sparkles, Plus, ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { fmtNaira } from '../lib/format.js';
import { getVariantRules } from '../lib/catalog.js';
import { productImageFit, productImagePadding, productImageSource } from '../lib/media.js';
import { ingredientKindFor, variantColorFor } from '../lib/variantPresentation.js';
import { Button } from './ui/button.jsx';

const CARD_VARIANT_KEY = {
  'banana-bread': 'toppings',
  brownies: 'flavours',
  cake: 'flavours',
};

export default function ProductCard({ product, variant = 'grid' }) {
  const { addToCart } = useCart();
  const canQuickAdd = !product.configurator && !product.outOfStock && product.startingPrice !== null;
  const [previewImage, setPreviewImage] = useState(null);
  const [tapActive, setTapActive] = useState(false);
  const [swatches, setSwatches] = useState(null);
  const variantKey = CARD_VARIANT_KEY[product.configurator];
  const canSwatch = Boolean(variantKey);
  const imageSrc = productImageSource(product);
  const isFloating = variant === 'floating';
  const imageFit = isFloating ? 'contain' : productImageFit(product);
  const imagePadding = isFloating ? 20 : productImagePadding(product);

  useEffect(() => {
    if (!canSwatch) return;
    let cancelled = false;
    getVariantRules(product.slug, product.configurator).then((rules) => {
      if (!cancelled) setSwatches(rules?.[variantKey] || []);
    });
    return () => { cancelled = true; };
  }, [canSwatch, product.configurator, product.slug, variantKey]);

  function handleTapState() {
    if (!window.matchMedia('(hover: none)').matches) return;
    setTapActive(true);
    window.setTimeout(() => setTapActive(false), 900);
  }

  return (
    <article
      className={`editorial-card${isFloating ? ' editorial-card--floating' : ''}${tapActive ? ' editorial-card--tapped' : ''}`}
      data-reveal-item
      onPointerDown={handleTapState}
      style={{ opacity: product.outOfStock ? 0.6 : 1 }}
    >
      {/* Product Visual Container */}
      <div
        className="editorial-card__media-box"
        style={{ padding: imagePadding }}
        onMouseLeave={() => setPreviewImage(null)}
      >
        <Link
          to={`/product/${product.slug}`}
          className="editorial-card__image-link"
          aria-label={`View ${product.name}`}
        >
          <img
            loading="lazy"
            src={previewImage || imageSrc}
            alt={product.name}
            onError={(event) => {
              if (event.currentTarget.src !== new URL(imageSrc, window.location.origin).href) {
                event.currentTarget.src = imageSrc;
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: previewImage ? 'cover' : imageFit,
            }}
          />
        </Link>

        {/* Configuration or Bake Status Badge */}
        <div className="editorial-card__badge-row">
          {product.configurator ? (
            <span className="editorial-badge editorial-badge--config">
              <Sliders size={11} aria-hidden="true" />
              <span>Customizable</span>
            </span>
          ) : product.badge ? (
            <span className="editorial-badge editorial-badge--olive">
              <Sparkles size={11} aria-hidden="true" />
              <span>{product.badge}</span>
            </span>
          ) : null}

          {canQuickAdd && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                addToCart({
                  id: product.slug,
                  name: product.name,
                  price: product.startingPrice,
                  image: imageSrc,
                  productId: product.id,
                  variantSelections: {},
                });
              }}
              aria-label={`Quick add ${product.name} to cart`}
              className="editorial-card__quick-add"
            >
              <Plus size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Swatches if available */}
      {swatches && swatches.length > 0 && (
        <div
          className="editorial-card__swatches"
          aria-label={`Preview ${product.name} options`}
          onMouseLeave={() => setPreviewImage(null)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPreviewImage(null);
          }}
        >
          {swatches.map((sw) => (
            <button
              key={sw.id}
              type="button"
              title={sw.label}
              aria-label={`Preview ${sw.label}`}
              aria-pressed={previewImage === sw.image}
              onMouseEnter={() => setPreviewImage(sw.image)}
              onFocus={() => setPreviewImage(sw.image)}
              onClick={() => setPreviewImage((current) => (current === sw.image ? null : sw.image))}
              className={previewImage === sw.image ? 'is-active' : ''}
            >
              <span
                className="editorial-card__swatch-color"
                style={{ background: variantColorFor(sw.id, sw.color) }}
                aria-hidden="true"
              >
                <span className={`swatch-picker__ingredient swatch-picker__ingredient--${ingredientKindFor(sw.id)}`} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Body / Metadata */}
      <div className="editorial-card__body">
        <div className="editorial-card__title-row">
          <Link to={`/product/${product.slug}`} className="editorial-card__title">
            {product.name}
          </Link>
          <span className="editorial-card__price">
            {product.startingPrice === null
              ? 'Price TBC'
              : (product.priceFrom || product.configurator ? `From ${fmtNaira(product.startingPrice)}` : fmtNaira(product.startingPrice))}
          </span>
        </div>

        {product.desc && (
          <p className="editorial-card__description">{product.desc}</p>
        )}

        <div className="editorial-card__footer">
          <span className="editorial-card__notice">Made to order · 24h</span>
          <Link to={`/product/${product.slug}`} className="editorial-card__action-link">
            <span>{product.configurator ? 'Build your bake' : 'View details'}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
