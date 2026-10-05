import Image from 'next/image';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { fmtNaira } from '../lib/format.js';
import { productImageFit, productImagePadding, productImageSource } from '../lib/media.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const imageSrc = productImageSource(product);
  const canQuickAdd = !product.configurator && !product.outOfStock && Number.isFinite(product.startingPrice);
  const priceKnown = Number.isFinite(product.startingPrice);
  return (
    <article className="editorial-card">
      <div className="editorial-card__media-box">
        <Link to={'/product/' + product.slug} className="editorial-card__image-link" aria-label={'View ' + product.name}>
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 359px) 100vw, (max-width: 1023px) 50vw, 33vw"
            unoptimized={!imageSrc.startsWith('/')}
            style={{ objectFit: productImageFit(product), padding: productImagePadding(product) }}
          />
        </Link>
        {product.outOfStock && <span className="editorial-card__availability">Unavailable</span>}
        {canQuickAdd && (
          <button
            type="button"
            className="editorial-card__quick-add"
            aria-label={'Add ' + product.name + ' to cart'}
            onClick={() =>
              addToCart({
                id: product.slug,
                name: product.name,
                price: product.startingPrice,
                image: imageSrc,
                productId: product.id,
                qty: Math.max(1, product.minQty || 1),
                variantSelections: {},
              })
            }
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="editorial-card__body">
        <h2 className="editorial-card__title">
          <Link to={'/product/' + product.slug}>{product.name}</Link>
        </h2>
        <span className="editorial-card__price">
          {priceKnown ? (product.priceFrom || product.configurator ? 'From ' : '') + fmtNaira(product.startingPrice) : 'Price to confirm'}
        </span>
        {product.desc && <p className="editorial-card__description">{product.desc}</p>}
        <Link to={'/product/' + product.slug} className="editorial-card__action-link">
          {product.configurator ? 'Choose options' : 'View bake'} <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
