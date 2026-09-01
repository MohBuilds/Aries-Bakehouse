import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, CircleAlert, LockKeyhole, MapPin, MessageCircle, ShieldCheck, ShoppingBag, Clock, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtLineTotal, fmtNaira, tomorrowISODate } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import { saveOrder } from '../lib/orders.js';
import { loadPaystackScript } from '../lib/paystack.js';
import { supabase } from '../lib/supabaseClient.js';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { DatePicker } from '../components/ui/date-picker.jsx';
import { Input } from '../components/ui/input.jsx';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../components/ui/input-group.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible.jsx';

const WHATSAPP_NUMBER = '2348121145785';
const TIME_OPTIONS = ['morning', 'afternoon', 'evening'];

function isValidNigerianPhone(value) {
  const compact = value.trim().replace(/[\s()-]/g, '');
  return /^(?:\+?234|0)[789]\d{9}$/.test(compact);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

export default function Checkout() {
  const cart = useCart();
  const { customer, isRealAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedAddresses, setSavedAddresses] = useState(null);
  const buyNowItem = location.state?.buyNowItem || null;
  const items = buyNowItem ? [buyNowItem] : cart.items;
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0), [items]);
  const hasUnpricedItems = items.some((item) => item.price === null || item.price === undefined);

  const [fulfilment, setFulfilment] = useState('pickup');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(tomorrowISODate());
  const [time, setTime] = useState('morning');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState(location.state?.discount?.code || '');
  const [discount, setDiscount] = useState(location.state?.discount || null);
  const [discountStatus, setDiscountStatus] = useState('idle');
  const [discountMsg, setDiscountMsg] = useState('');
  const [paymentState, setPaymentState] = useState('idle');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const paymentDialogRef = useRef(null);
  const fieldRefs = useRef({});
  const discountFailCountRef = useRef(0);
  const discountCooldownUntilRef = useRef(0);

  const discountAmount = discount?.amount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const errors = useMemo(() => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!phone.trim()) next.phone = 'Enter a phone number for order updates.';
    else if (!isValidNigerianPhone(phone)) next.phone = 'Use a valid Nigerian number, for example 0801 234 5678.';
    if (email.trim() && !isValidEmail(email)) next.email = 'Enter a complete email address, for example name@example.com.';
    if (fulfilment === 'delivery' && address.trim().length < 10) next.address = 'Enter a complete delivery address in Abeokuta.';
    if (!date || date < tomorrowISODate()) next.date = 'Choose a date with at least 24 hours notice.';
    if (!TIME_OPTIONS.includes(time)) next.time = 'Choose a valid collection or delivery time.';
    return next;
  }, [name, phone, email, fulfilment, address, date, time]);

  const formIsValid = Object.keys(errors).length === 0;
  const visibleError = (field) => (attempted || touched[field]) ? errors[field] : '';
  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));

  useEffect(() => {
    trackEvent('checkout_started', { itemCount: items.length, subtotal });
  }, []);

  useEffect(() => {
    if (!isRealAccount || !customer) return;
    Promise.resolve().then(() => {
      setName((current) => current || customer.name || '');
      setPhone((current) => current || customer.phone || '');
      setEmail((current) => current || customer.email || '');
    });
  }, [isRealAccount, customer]);

  useEffect(() => {
    let cancelled = false;
    if (!isRealAccount || !customer?.id) {
      Promise.resolve().then(() => { if (!cancelled) setSavedAddresses(null); });
      return () => { cancelled = true; };
    }
    supabase.from('address').select('*').eq('customer_id', customer.id)
      .order('is_default', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error) setSavedAddresses(data || []);
      });
    return () => { cancelled = true; };
  }, [isRealAccount, customer?.id]);

  useEffect(() => {
    const paymentDialogOpen = paymentState === 'failed' || paymentState === 'unconfirmed';
    if (!paymentDialogOpen) return undefined;
    paymentDialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPaymentState('idle');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paymentState]);

  if (items.length === 0) {
    return (
      <div className="container checkout-empty">
        <span className="checkout-empty__icon"><ShoppingBag size={24} aria-hidden="true" /></span>
        <h1>Your cart is empty</h1>
        <p>Choose a loaf, box or platter from the counter before checking out.</p>
        <Link to="/menu" className="btn btn-primary">Browse the menu</Link>
      </div>
    );
  }

  function buildOrder(status, fallbackChannel = null, paymentReference = null) {
    return {
      items, subtotal, subtotalLabel: fmtNaira(subtotal), hasUnpricedItems,
      discountCodeId: discount?.id || null, discountAmount, deliveryFee: 0, total,
      fulfilment, address: address.trim(), date, time, name: name.trim(), phone: phone.trim(),
      email: email.trim(), notes: notes.trim(), status, fallbackChannel, paymentReference, createdAt: Date.now(),
    };
  }

  function finishAndLeave(id) {
    if (!buyNowItem) cart.clearCart();
    navigate(`/order/${id}/confirmation`);
  }

  async function payWithPaystack() {
    setSaving(true);
    setPaymentState('opening');
    try {
      const reference = `A11-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const orderId = await saveOrder(buildOrder('pending', null, reference));
      await loadPaystackScript();
      trackEvent('payment_initiated', { orderId, amount: total, reference });
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: email.trim() || `guest-${phone.replace(/\D/g, '')}@aries11.local`,
        amount: Math.round(total * 100),
        currency: 'NGN',
        ref: reference,
        onClose: () => {
          setSaving(false);
          setPaymentState('failed');
        },
        callback: (response) => {
          (async () => {
            try {
              const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: response.reference } });
              if (!error && data?.confirmed) {
                toast.success('Payment confirmed', { description: 'Your order has been received.' });
                finishAndLeave(orderId);
              } else {
                setPaymentState('unconfirmed');
              }
            } catch (error) {
              console.error('verify-payment call failed:', error);
              setPaymentState('unconfirmed');
            } finally {
              setSaving(false);
            }
          })();
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Payment could not start', { description: 'Your details are still here. Please try again.' });
      setSaving(false);
      setPaymentState('failed');
    }
  }

  function handleCheckout(event) {
    event.preventDefault();
    setAttempted(true);
    if (!formIsValid || hasUnpricedItems) {
      const firstError = Object.keys(errors)[0];
      if (firstError) window.requestAnimationFrame(() => fieldRefs.current[firstError]?.focus());
      return;
    }
    payWithPaystack();
  }

  async function applyDiscount() {
    if (Date.now() < discountCooldownUntilRef.current) {
      setDiscountStatus('error');
      setDiscountMsg('Too many attempts — please wait a moment before trying again.');
      return;
    }
    if (!discountCode.trim()) {
      setDiscountStatus('error');
      setDiscountMsg('Enter a discount code first.');
      return;
    }
    setDiscountStatus('working');
    setDiscountMsg('');
    try {
      const applied = await redeemDiscountCode(discountCode, subtotal);
      discountFailCountRef.current = 0;
      setDiscount(applied);
      setDiscountStatus('applied');
      setDiscountMsg(`${applied.code} applied.`);
      trackEvent('discount_code_used', { code: applied.code, amount: applied.amount });
    } catch (error) {
      discountFailCountRef.current += 1;
      if (discountFailCountRef.current >= 5) {
        discountCooldownUntilRef.current = Date.now() + 30_000;
        discountFailCountRef.current = 0;
      }
      setDiscount(null);
      setDiscountStatus('error');
      setDiscountMsg(error.message);
    }
  }

  return (
    <div className="container checkout-page">
      <header className="checkout-header">
        <div>
          <span className="page-kicker">Reassuring & Direct</span>
          <h1 className="checkout-title">Complete Your Order</h1>
          <p className="checkout-subtitle">
            Confirm your details, preferred date, and fulfilment method before payment.
          </p>
        </div>
        <div className="checkout-help">
          <Link to="/delivery">Delivery Info</Link>
          <Link to="/faq">FAQ</Link>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
            <MessageCircle size={15} aria-hidden="true" />
            <span>WhatsApp Help</span>
          </a>
        </div>
      </header>

      <div className="checkout-layout">
        <form id="checkout-form" className="checkout-form-panel" onSubmit={handleCheckout} noValidate>
          {/* Step 1: Contact Details */}
          <CheckoutSection step="01" title="Contact Details" description="We use these details for order receipts and kitchen updates.">
            <div className="checkout-field-grid">
              <Field id="name" label="Full Name" required error={visibleError('name')}>
                <Input
                  ref={(node) => { fieldRefs.current.name = node; }}
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => markTouched('name')}
                  aria-invalid={Boolean(visibleError('name'))}
                  placeholder="e.g. Bukola Adeyemi"
                />
              </Field>
              <Field id="phone" label="Phone Number" required error={visibleError('phone')} hint="Nigerian mobile number for WhatsApp updates">
                <Input
                  ref={(node) => { fieldRefs.current.phone = node; }}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  onBlur={() => markTouched('phone')}
                  aria-invalid={Boolean(visibleError('phone'))}
                  placeholder="0801 234 5678"
                />
              </Field>
              <Field id="email" label="Email Address" optional error={visibleError('email')} hint="For Paystack receipt & order confirmation">
                <Input
                  ref={(node) => { fieldRefs.current.email = node; }}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => markTouched('email')}
                  aria-invalid={Boolean(visibleError('email'))}
                  placeholder="name@example.com"
                />
              </Field>
            </div>
            {!isRealAccount && (
              <p className="checkout-account-note">
                Guest checkout active. <Link to="/account">Sign in to auto-fill saved details.</Link>
              </p>
            )}
          </CheckoutSection>

          {/* Step 2: Fulfilment */}
          <CheckoutSection step="02" title="Fulfilment" description="Choose pickup in Abeokuta or doorstep delivery.">
            <div className="checkout-segmented" role="group" aria-label="Fulfilment method">
              <ToggleButton active={fulfilment === 'pickup'} onClick={() => setFulfilment('pickup')}>
                Pickup in Abeokuta
              </ToggleButton>
              <ToggleButton active={fulfilment === 'delivery'} onClick={() => setFulfilment('delivery')}>
                Doorstep Delivery
              </ToggleButton>
            </div>
            {fulfilment === 'pickup' ? (
              <div className="checkout-info-row">
                <MapPin size={18} aria-hidden="true" />
                <div>
                  <strong>Bakehouse Counter Collection</strong>
                  <span>Exact pickup address in Abeokuta is confirmed once the kitchen accepts your order.</span>
                </div>
              </div>
            ) : (
              <div className="checkout-delivery-fields">
                {savedAddresses?.length > 0 && (
                  <div className="checkout-saved-addresses">
                    {savedAddresses.map((saved) => (
                      <button
                        key={saved.id}
                        type="button"
                        onClick={() => { setAddress(saved.address_text); markTouched('address'); }}
                      >
                        {saved.label || 'Saved address'}{saved.is_default ? ' · Default' : ''}
                      </button>
                    ))}
                  </div>
                )}
                <Field id="address" label="Delivery Address in Abeokuta" required error={visibleError('address')} hint="Include street, area, and a recognizable landmark. Delivery fee is confirmed after address review.">
                  <Textarea
                    ref={(node) => { fieldRefs.current.address = node; }}
                    id="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    onBlur={() => markTouched('address')}
                    aria-invalid={Boolean(visibleError('address'))}
                    placeholder="e.g. 14 Ibara Housing Estate, near Continental Hotel, Abeokuta"
                  />
                </Field>
              </div>
            )}
          </CheckoutSection>

          {/* Step 3: Schedule */}
          <CheckoutSection step="03" title="Schedule" description="All bakes require at least 24 hours advance notice.">
            <div className="checkout-field-grid checkout-field-grid--two">
              <Field id="date" label="Preferred Date" required error={visibleError('date')}>
                <DatePicker
                  ref={(node) => { fieldRefs.current.date = node; }}
                  id="date"
                  value={date}
                  min={tomorrowISODate()}
                  onChange={setDate}
                  onBlur={() => markTouched('date')}
                  displayFormat="EEE, d MMM yyyy"
                  aria-invalid={Boolean(visibleError('date'))}
                />
              </Field>
              <Field id="time" label="Preferred Time Slot" required error={visibleError('time')}>
                <select
                  ref={(node) => { fieldRefs.current.time = node; }}
                  id="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  onBlur={() => markTouched('time')}
                  aria-invalid={Boolean(visibleError('time'))}
                  className="checkout-select"
                >
                  <option value="morning">Morning (9:00 AM – 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM – 4:00 PM)</option>
                  <option value="evening">Evening (4:00 PM – 7:00 PM)</option>
                </select>
              </Field>
            </div>
          </CheckoutSection>

          {/* Special Instructions Collapsible */}
          <Collapsible className="checkout-notes">
            <CollapsibleTrigger className="checkout-notes__trigger">
              <span>Special instructions / allergies <small>Optional</small></span>
              <ChevronDown size={18} aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="checkout-notes__content">
                <label htmlFor="notes" className="visually-hidden">Special instructions</label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Gifting note, allergy restrictions, or arrival instructions..."
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>

        {/* Persistent Order Summary */}
        <aside className="checkout-summary" aria-label="Order summary">
          <div className="checkout-summary__header">
            <div>
              <p className="checkout-summary__kicker">Order Summary</p>
              <h2 className="checkout-summary__title">{items.length} {items.length === 1 ? 'bake' : 'bakes'}</h2>
            </div>
            {!buyNowItem && <Link to="/cart" className="checkout-summary__edit-link">Edit cart</Link>}
          </div>

          <div className="checkout-summary__items">
            {items.map((item) => (
              <div key={item.id} className="checkout-summary__item">
                <span className="checkout-summary__image">
                  {item.image ? <img src={item.image} alt="" loading="lazy" /> : <ShoppingBag size={17} aria-hidden="true" />}
                </span>
                <div className="checkout-summary__item-copy">
                  <strong>{item.name}</strong>
                  <span>Quantity {item.qty}</span>
                </div>
                <div className="checkout-summary__item-price">
                  {item.price === null ? 'Price TBC' : fmtLineTotal(item.price, item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Discount code */}
          <div className="checkout-discount">
            <label htmlFor="checkout-discount">Discount Code</label>
            <InputGroup className="checkout-discount__group">
              <InputGroupInput
                id="checkout-discount"
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                placeholder="Enter code"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton disabled={discountStatus === 'working'} onClick={applyDiscount}>
                  {discountStatus === 'working' ? '...' : 'Apply'}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {discountMsg && (
              <p className={`checkout-discount-msg ${discountStatus === 'error' ? 'is-error' : 'is-success'}`} role="alert">
                {discountMsg}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="checkout-totals">
            <div><span>Subtotal</span><strong>{fmtNaira(subtotal)}</strong></div>
            {discount && (
              <div className="checkout-totals__discount">
                <span>Discount · {discount.code}</span>
                <strong>-{fmtNaira(discountAmount)}</strong>
              </div>
            )}
            <div>
              <span>Fulfilment</span>
              <strong>{fulfilment === 'pickup' ? 'Pickup (Free)' : 'Doorstep Delivery'}</strong>
            </div>
            <div className="checkout-totals__total">
              <span>{fulfilment === 'delivery' ? 'Subtotal (excl. delivery fee)' : 'Total'}</span>
              <strong>{fmtNaira(total)}</strong>
            </div>
          </div>

          {fulfilment === 'delivery' && (
            <div className="checkout-summary__notice">
              <Clock size={14} aria-hidden="true" />
              <span>Delivery fee is confirmed after our team reviews your exact Abeokuta location.</span>
            </div>
          )}

          {hasUnpricedItems && (
            <div className="checkout-summary__notice is-warning">
              Online payment is unavailable because an item in your order needs team price confirmation.
            </div>
          )}

          <button
            className="btn btn-primary btn-lg checkout-pay-button"
            type="submit"
            form="checkout-form"
            disabled={saving || hasUnpricedItems}
            aria-busy={saving && paymentState === 'opening'}
          >
            <LockKeyhole size={16} aria-hidden="true" />
            <span>{saving && paymentState === 'opening' ? 'Connecting to Paystack...' : `Pay ${fmtNaira(total)}`}</span>
          </button>

          {attempted && !formIsValid && (
            <Alert variant="destructive" className="checkout-submit-error">
              <CircleAlert size={17} aria-hidden="true" />
              <AlertDescription>Please check the highlighted fields above before continuing.</AlertDescription>
            </Alert>
          )}

          <div className="checkout-trust">
            <span><LockKeyhole size={13} aria-hidden="true" />Secured via Paystack</span>
            <span><ShieldCheck size={13} aria-hidden="true" />Verified before oven preparation</span>
          </div>
        </aside>
      </div>

      {/* Payment Recovery / Failed Modal */}
      {(paymentState === 'failed' || paymentState === 'unconfirmed') && (
        <div
          className="checkout-dialog-backdrop"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentState('idle'); }}
        >
          <div ref={paymentDialogRef} className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-recovery-title" tabIndex={-1}>
            <span className="checkout-dialog__icon"><LockKeyhole size={22} aria-hidden="true" /></span>
            <p className="checkout-dialog__kicker">Payment Status</p>
            <h2 id="payment-recovery-title">
              {paymentState === 'failed' ? 'Payment was not completed' : 'Payment confirmation pending'}
            </h2>
            <p className="checkout-dialog__copy">
              {paymentState === 'failed'
                ? 'The payment popup was closed before confirmation. Your selected items and order details are safe here.'
                : 'If you were debited, Paystack may still confirm the transaction automatically. Check your bank notification before trying again.'}
            </p>
            <div className="checkout-dialog__actions">
              {paymentState === 'failed' && (
                <button className="btn btn-primary" disabled={saving} onClick={payWithPaystack}>
                  Try payment again
                </button>
              )}
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <MessageCircle size={15} aria-hidden="true" />
                <span>Contact support</span>
              </a>
              <button className="checkout-dialog__cancel" onClick={() => setPaymentState('idle')}>
                Return to form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Pay Bar */}
      <div className="mobile-sticky-action checkout-mobile-pay">
        <div className="checkout-mobile-pay__row">
          <div className="mobile-sticky-action__meta">
            <span className="mobile-sticky-action__label">Order total</span>
            <strong className="mobile-sticky-action__price">{fmtNaira(total)}</strong>
          </div>
          <span className="checkout-mobile-pay__type">{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</span>
        </div>
        <button
          className="btn btn-primary btn-lg"
          type="submit"
          form="checkout-form"
          disabled={saving || hasUnpricedItems}
          aria-busy={saving && paymentState === 'opening'}
        >
          {saving && paymentState === 'opening' ? 'Opening Paystack...' : `Pay ${fmtNaira(total)}`}
        </button>
      </div>
    </div>
  );
}

function CheckoutSection({ step, title, description, children }) {
  return (
    <section className="checkout-section">
      <div className="checkout-section__heading">
        <span className="checkout-section__step-pill">{step}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="checkout-section__body">{children}</div>
    </section>
  );
}

function Field({ id, label, required, optional, error, hint, children }) {
  return (
    <div className={`checkout-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id} className="checkout-field__label">
        {label}
        {required && <span className="checkout-field__required" aria-hidden="true"> *</span>}
        {optional && <small className="checkout-field__optional">Optional</small>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-message field-message--error">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-message">{hint}</p>
      ) : null}
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`checkout-toggle-btn${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {active && <Check size={14} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
