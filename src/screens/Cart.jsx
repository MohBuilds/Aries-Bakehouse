import { useState } from 'react';
import { ArrowLeft, LockKeyhole, Minus, Plus, ShoppingBag, Trash2, Clock, MessageCircle, ArrowUpRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';

const WHATSAPP_SUPPORT_URL = 'https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20have%20a%20question%20about%20my%20cart.';

export default function Cart() {
  const { items, subtotal, hasUnpricedItems, updateQty, removeFromCart, addToCart } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [discountStatus, setDiscountStatus] = useState('idle');
  const [discountMsg, setDiscountMsg] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const total = Math.max(0, subtotal - (discount?.amount || 0));

  function handleRemove(item) {
    removeFromCart(item.id);
    const id = toast.info('Removed from cart', {
      description: item.name,
      actionProps: {
        children: 'Undo',
        onClick() {
          addToCart(item, { silent: true });
          toast.close(id);
        },
      },
    });
  }

  async function applyDiscount(event) {
    event.preventDefault();
    if (!discountCode.trim()) {
      setDiscountStatus('error');
      setDiscountMsg('Enter a discount code first.');
      return;
    }
    setDiscountStatus('working');
    setDiscountMsg('');
    try {
      const applied = await redeemDiscountCode(discountCode, subtotal);
      setDiscount(applied);
      setDiscountStatus('applied');
      setDiscountMsg(`${applied.code} applied.`);
      trackEvent('discount_code_used', { code: applied.code, amount: applied.amount });
    } catch (error) {
      setDiscount(null);
      setDiscountStatus('error');
      setDiscountMsg(error.message);
    }
  }

  if (items.length === 0) {
    return (
      <main className="container cart-page cart-page--empty">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          desc="Choose a loaf, brownie box or platter from the counter to build your order."
          actionLabel="Explore the menu"
          actionTo="/menu"
        />
      </main>
    );
  }

  return (
    <main className="container cart-page">
      {/* Header */}
      <header className="cart-page__header">
        <div>
          <span className="page-kicker">Your Selection</span>
          <h1 className="cart-page__title">Review Your Bakes</h1>
          <p className="cart-page__subtitle">
            {items.length} bake{items.length === 1 ? '' : 's'} configured and ready for the kitchen.
          </p>
        </div>
        <Link to="/menu" className="cart-page__continue">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Add more treats</span>
        </Link>
      </header>

      <div className="cart-layout">
        {/* Left Column: Configured Line Items */}
        <section className="cart-items" aria-label="Cart items">
          {items.map((item) => {
            const hasOptions = item.variantSelections && Object.keys(item.variantSelections).length > 0;

            return (
              <article key={item.id} className="cart-item-card">
                {/* Large Product Thumbnail */}
                <div className="cart-item-card__media">
                  {item.image ? (
                    <img loading="lazy" src={item.image} alt={item.name} />
                  ) : (
                    <div className="cart-item-card__fallback">
                      <ShoppingBag size={24} aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Details & Config breakdown */}
                <div className="cart-item-card__content">
                  <div className="cart-item-card__title-row">
                    <h2 className="cart-item-card__name">{item.name}</h2>
                    <strong className="cart-item-card__line-total">
                      {item.price === null ? 'Price TBC' : fmtLineTotal(item.price, item.qty)}
                    </strong>
                  </div>

                  <p className="cart-item-card__unit-price">
                    {item.price === null ? 'Price confirmed before payment' : `${fmtNaira(item.price)} each`}
                  </p>

                  {/* Compact Quantity Stepper & Remove */}
                  <div className="cart-item-card__controls">
                    <div className="cart-quantity-pill" aria-label={`${item.name} quantity`}>
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={item.qty <= 1}
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="cart-quantity-btn"
                      >
                        <Minus size={13} aria-hidden="true" />
                      </button>
                      <span aria-live="polite" className="cart-quantity-val">{item.qty}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="cart-quantity-btn"
                      >
                        <Plus size={13} aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-item-card__remove-btn"
                      onClick={() => handleRemove(item)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* 24-Hour Notice Reminder Box */}
          <div className="cart-preorder-notice">
            <Clock size={18} aria-hidden="true" />
            <div>
              <strong>24-Hour Notice Requirement</strong>
              <p>Every item is baked fresh in Abeokuta. Please confirm your delivery or pickup date for at least 24 hours from now.</p>
            </div>
          </div>
        </section>

        {/* Right Column: Order Summary & Checkout */}
        <aside className="cart-summary-panel" aria-label="Cart summary">
          <h2 className="cart-summary__heading">Order Summary</h2>

          {/* Totals breakdown */}
          <div className="cart-summary__rows">
            <div className="cart-summary__row">
              <span>Subtotal ({items.length} {items.length === 1 ? 'bake' : 'bakes'})</span>
              <strong>{fmtNaira(subtotal)}</strong>
            </div>

            {discount && (
              <div className="cart-summary__row is-discount">
                <span>Discount ({discount.code})</span>
                <strong>-{fmtNaira(discount.amount)}</strong>
              </div>
            )}

            <div className="cart-summary__row">
              <span>Fulfilment</span>
              <span className="cart-summary__faint">Calculated at checkout</span>
            </div>

            <div className="cart-summary__total-row">
              <span>Estimated Total</span>
              <strong>{fmtNaira(total)}</strong>
            </div>
          </div>

          {hasUnpricedItems && (
            <div className="cart-summary__notice">
              Some configured items require manual price confirmation by the team before online payment.
            </div>
          )}

          {/* Secondary Discount Accordion */}
          <div className="cart-discount-secondary">
            {!showDiscountInput && !discount ? (
              <button
                type="button"
                className="cart-discount-toggle"
                onClick={() => setShowDiscountInput(true)}
              >
                <Tag size={14} aria-hidden="true" />
                <span>Add discount or gift code</span>
              </button>
            ) : (
              <form className="cart-discount-form" onSubmit={applyDiscount}>
                <div className="cart-discount-input-wrap">
                  <input
                    id="discount"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    aria-label="Discount code"
                    className="cart-discount-input"
                  />
                  <button
                    type="submit"
                    disabled={discountStatus === 'working'}
                    className="cart-discount-btn"
                  >
                    {discountStatus === 'working' ? '...' : 'Apply'}
                  </button>
                </div>
                {discountMsg && (
                  <p className={`cart-discount-msg ${discountStatus === 'error' ? 'is-error' : 'is-success'}`} role="alert">
                    {discountMsg}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Dominant Primary Checkout Button */}
          <Link
            to="/checkout"
            state={discount ? { discount } : undefined}
            className="btn btn-primary btn-lg cart-checkout-btn"
          >
            <LockKeyhole size={16} aria-hidden="true" />
            <span>Proceed to Checkout</span>
          </Link>

          {/* Branded WhatsApp Intentional Alternative */}
          <div className="cart-whatsapp-option">
            <span className="cart-whatsapp-option__divider">or prefer human assistance?</span>
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="cart-whatsapp-option__link"
            >
              <MessageCircle size={16} aria-hidden="true" />
              <span>Order or clarify details on WhatsApp</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
