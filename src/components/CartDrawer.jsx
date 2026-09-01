import { useEffect, useRef } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X, LockKeyhole, MessageCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';

const WHATSAPP_SUPPORT_URL = 'https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20have%20a%20question%20about%20my%20cart.';

export default function CartDrawer() {
  const { items, subtotal, hasUnpricedItems, drawerOpen, closeDrawer, updateQty, removeFromCart } = useCart();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeDrawer, drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="cart-drawer-root">
      <button
        className="cart-drawer__backdrop"
        type="button"
        onClick={closeDrawer}
        aria-label="Close cart"
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        tabIndex={-1}
        className="cart-drawer"
      >
        <header className="cart-drawer__header">
          <div>
            <p className="cart-drawer__kicker">Your Selection</p>
            <h2 className="cart-drawer__title">
              Cart <span className="cart-drawer__count-pill">{items.length}</span>
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="cart-drawer__close-btn"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <span className="cart-drawer__empty-icon">
                <ShoppingBag size={26} aria-hidden="true" />
              </span>
              <h3>Your cart is empty</h3>
              <p>Add a freshly baked loaf, brownie box or platter from our counter.</p>
              <Link to="/menu" onClick={closeDrawer} className="btn btn-primary">
                Explore the menu
              </Link>
            </div>
          ) : (
            <div className="cart-drawer__items">
              {items.map((item) => (
                <article key={item.id} className="cart-drawer__item">
                  <span className="cart-drawer__image">
                    {item.image ? (
                      <img loading="lazy" src={item.image} alt="" />
                    ) : (
                      <ShoppingBag size={20} aria-hidden="true" />
                    )}
                  </span>
                  <div className="cart-drawer__copy">
                    <h3>{item.name}</h3>
                    <strong>
                      {item.price === null ? 'Price TBC' : fmtLineTotal(item.price, item.qty)}
                    </strong>
                    <div className="cart-drawer__controls">
                      <div className="cart-quantity-pill">
                        <button
                          type="button"
                          disabled={item.qty <= 1}
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          aria-label={`Decrease ${item.name} quantity`}
                          className="cart-quantity-btn"
                        >
                          <Minus size={12} aria-hidden="true" />
                        </button>
                        <span className="cart-quantity-val">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          aria-label={`Increase ${item.name} quantity`}
                          className="cart-quantity-btn"
                        >
                          <Plus size={12} aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart-drawer__remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              <div className="cart-drawer__promise">
                <Clock size={15} aria-hidden="true" />
                <span>Made fresh with 24 hours notice in Abeokuta</span>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Estimated Subtotal</span>
              <strong>{fmtNaira(subtotal)}</strong>
            </div>
            {hasUnpricedItems && (
              <p className="cart-drawer__unpriced-note">
                Some items require team price confirmation before payment.
              </p>
            )}
            <Link to="/checkout" onClick={closeDrawer} className="btn btn-primary btn-lg cart-drawer__checkout">
              <LockKeyhole size={16} aria-hidden="true" />
              <span>Checkout</span>
            </Link>
            <div className="cart-drawer__links">
              <Link to="/cart" onClick={closeDrawer} className="cart-drawer__view-cart">
                View & edit full cart
              </Link>
              <a
                href={WHATSAPP_SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="cart-drawer__whatsapp"
              >
                <MessageCircle size={14} aria-hidden="true" />
                <span>Order via WhatsApp</span>
              </a>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
