import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  CircleAlert,
  LockKeyhole,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import { addPaymentAttempt, saveOrder } from '../lib/orders.js';
import {
  SCHEDULE_ERRORS,
  SLOT_REASON_TEXT,
  fetchDeliveryZones,
  fetchSlotAvailability,
  friendlyOrderError,
  orderErrorCode,
  slotWindow,
} from '../lib/ordering.js';
import { loadPaystackScript } from '../lib/paystack.js';
import { supabase } from '../lib/supabaseClient.js';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { Input } from '../components/ui/input.jsx';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../components/ui/input-group.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible.jsx';

const WHATSAPP_NUMBER = '2348121145785';
const PAYMENT_POLLS = 8; // ~20 s of patience for slow methods (bank transfer, USSD)
const POLL_MS = 2500;

const newReference = () => `A11-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function dayParts(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return {
    weekday: date.toLocaleDateString('en-NG', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('en-NG', { month: 'short' }),
    long: date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

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
  const [zones, setZones] = useState(null);
  const [slotDays, setSlotDays] = useState(null);
  const [scheduleError, setScheduleError] = useState(false);
  const [zoneId, setZoneId] = useState('');
  const [area, setArea] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
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
  const attemptRef = useRef(null); // the unpaid order a retry should reuse: { key, orderId, orderNumber }
  const [lastPayment, setLastPayment] = useState(null); // { reference, orderId } for "check again"
  const [supportOrderNumber, setSupportOrderNumber] = useState('');
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const paymentDialogRef = useRef(null);
  const fieldRefs = useRef({});
  const discountFailCountRef = useRef(0);
  const discountCooldownUntilRef = useRef(0);

  const selectedZone = zones?.find((zone) => zone.id === zoneId) || null;
  const selectedDay = slotDays?.find((day) => day.date === date) || null;
  const selectedSlot = selectedDay?.slots.find((slot) => slot.code === time) || null;
  const discountAmount = discount?.amount || 0;
  // Delivery is only charged online once the owner has confirmed the zone's fee.
  const deliveryFee = fulfilment === 'delivery' && selectedZone?.fee_confirmed ? selectedZone.fee : 0;
  const feePending = fulfilment === 'delivery' && Boolean(selectedZone) && !selectedZone.fee_confirmed;
  // Display only: the database recomputes this and its figure is what Paystack charges.
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const errors = (() => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!phone.trim()) next.phone = 'Enter a phone number for order updates.';
    else if (!isValidNigerianPhone(phone)) next.phone = 'Use a valid Nigerian number, for example 0801 234 5678.';
    if (email.trim() && !isValidEmail(email)) next.email = 'Enter a complete email address, for example name@example.com.';
    if (fulfilment === 'delivery') {
      if (!zoneId) next.zone = 'Choose your delivery area.';
      else if (selectedZone?.areas.length > 0 && !area) next.area = 'Choose your neighbourhood.';
      else if (selectedZone?.areas.length === 0 && area.trim().length < 2) next.area = 'Tell us your neighbourhood.';
      if (address.trim().length < 10) next.address = 'Enter your street and a nearby landmark.';
    }
    if (!selectedSlot?.available) next.schedule = 'Choose a day and time slot.';
    return next;
  })();

  const formIsValid = Object.keys(errors).length === 0;
  const visibleError = (field) => (attempted || touched[field] ? errors[field] : '');
  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));

  useEffect(() => {
    trackEvent('checkout_started', { itemCount: items.length, subtotal });
  }, []);

  const refreshSchedule = useCallback(async () => {
    try {
      const [days, zoneRows] = await Promise.all([fetchSlotAvailability(21), fetchDeliveryZones()]);
      setSlotDays(days);
      setZones(zoneRows);
      setScheduleError(false);
    } catch (error) {
      console.error('Could not load delivery options:', error);
      setScheduleError(true);
    }
  }, []);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  // Keep the chosen slot valid: pick the first bookable one initially, and
  // move off a slot that has since filled up or run out of notice.
  useEffect(() => {
    if (!slotDays) return;
    const current = slotDays.find((day) => day.date === date)?.slots.find((slot) => slot.code === time);
    if (current?.available) return;
    const firstDay = slotDays.find((day) => day.open);
    setDate(firstDay?.date || '');
    setTime(firstDay?.slots.find((slot) => slot.available)?.code || '');
  }, [slotDays, date, time]);

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
      Promise.resolve().then(() => {
        if (!cancelled) setSavedAddresses(null);
      });
      return () => {
        cancelled = true;
      };
    }
    supabase
      .from('address')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error) setSavedAddresses(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [isRealAccount, customer?.id]);

  useEffect(() => {
    const paymentDialogOpen = paymentState === 'failed' || paymentState === 'unconfirmed' || paymentState === 'confirming';
    if (!paymentDialogOpen) return undefined;
    paymentDialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && paymentState !== 'confirming') setPaymentState('idle');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paymentState]);

  if (items.length === 0 && !buyNowItem && !cart.cartReady) {
    return (
      <div className="container checkout-empty" aria-busy="true" aria-label="Loading your order">
        <h1 className="visually-hidden">Checkout</h1>
        <div className="skeleton" style={{ height: 24, width: 160, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 260, borderRadius: 8 }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container checkout-empty">
        <span className="checkout-empty__icon">
          <ShoppingBag size={24} aria-hidden="true" />
        </span>
        <h1>Your cart is empty</h1>
        <p>Choose a loaf, box or platter from the counter before checking out.</p>
        <Link to="/menu" className="btn btn-primary">
          Browse the menu
        </Link>
      </div>
    );
  }

  function buildOrder(fallbackChannel = null, paymentReference = null) {
    return {
      items,
      discountCodeId: discount?.id || null,
      fulfilment,
      deliveryOptionId: zoneId,
      deliveryArea: area.trim(),
      address: address.trim(),
      date,
      time,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
      fallbackChannel,
      paymentReference,
    };
  }

  // Everything that makes one order different from another. If the customer
  // retries with the same details we reuse the unpaid order; if they edited
  // anything, a fresh order is created.
  function orderKey() {
    return JSON.stringify([
      items.map((item) => [item.productId, item.variantSelections || {}, item.qty]),
      fulfilment,
      zoneId,
      area.trim(),
      address.trim(),
      date,
      time,
      name.trim(),
      phone.trim(),
      email.trim(),
      notes.trim(),
      discount?.id || null,
    ]);
  }

  function finishAndLeave(id) {
    if (!buyNowItem) cart.clearCart();
    navigate(`/order/${id}/confirmation`);
  }

  // Paystack has taken the money; ask the server to confirm it. Slow methods
  // (bank transfer, USSD) report "pending" for a while, so we keep asking
  // instead of telling the customer something went wrong after one try.
  async function confirmPayment(reference, orderId) {
    setLastPayment({ reference, orderId });
    setPaymentState('confirming');
    for (let poll = 0; poll < PAYMENT_POLLS; poll += 1) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference } });
        if (!error && data?.confirmed) {
          toast.success('Payment confirmed', { description: 'Your order has been received.' });
          setSaving(false);
          finishAndLeave(orderId);
          return true;
        }
        if (!error && data?.failed) break;
      } catch (error) {
        console.error('verify-payment call failed:', error);
      }
      await wait(POLL_MS);
    }
    setSaving(false);
    setPaymentState('unconfirmed');
    return false;
  }

  async function payWithPaystack() {
    setSaving(true);
    setPaymentState('opening');
    try {
      const reference = newReference();
      const key = orderKey();
      let attempt = attemptRef.current;
      let amount;
      if (attempt && attempt.key === key) {
        ({ amount } = await addPaymentAttempt(attempt.orderId, reference));
      } else {
        const saved = await saveOrder(buildOrder(null, reference));
        attempt = { key, orderId: saved.id, orderNumber: saved.orderNumber };
        attemptRef.current = attempt;
        amount = saved.total;
      }
      if (!amount || amount <= 0) throw new Error('Order total is not payable online');
      setSupportOrderNumber(attempt.orderNumber);

      await loadPaystackScript();
      trackEvent('payment_initiated', { orderId: attempt.orderId, amount, reference });
      let completed = false;
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: email.trim() || `guest-${phone.replace(/\D/g, '')}@aries11.local`,
        // The server's total, never the browser's: a mismatch could take
        // money for an order that then refuses to confirm.
        amount: Math.round(amount * 100),
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: 'Order', variable_name: 'order_number', value: attempt.orderNumber },
            {
              display_name: 'Fulfilment',
              variable_name: 'fulfilment',
              value: fulfilment === 'delivery' ? `Delivery: ${area.trim()}` : 'Pickup',
            },
            { display_name: 'Slot', variable_name: 'slot', value: `${date} ${time}` },
          ],
        },
        onClose: () => {
          if (completed) return;
          setSaving(false);
          setPaymentState('failed');
        },
        callback: (response) => {
          completed = true;
          confirmPayment(response.reference, attempt.orderId);
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error('Order creation failed:', error);
      const code = orderErrorCode(error);
      toast.error('Payment could not start', { description: friendlyOrderError(error) });
      // The schedule moved under the customer: show them what's bookable now.
      if (code && SCHEDULE_ERRORS.has(code)) refreshSchedule();
      setSaving(false);
      setPaymentState('idle');
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
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">Your details, delivery and payment.</p>
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
                  ref={(node) => {
                    fieldRefs.current.name = node;
                  }}
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => markTouched('name')}
                  aria-invalid={Boolean(visibleError('name'))}
                  placeholder="e.g. Bukola Adeyemi"
                />
              </Field>
              <Field
                id="phone"
                label="Phone Number"
                required
                error={visibleError('phone')}
                hint="Nigerian mobile number for WhatsApp updates"
              >
                <Input
                  ref={(node) => {
                    fieldRefs.current.phone = node;
                  }}
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
              <Field
                id="email"
                label="Email Address"
                optional
                error={visibleError('email')}
                hint="For Paystack receipt & order confirmation"
              >
                <Input
                  ref={(node) => {
                    fieldRefs.current.email = node;
                  }}
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
                        onClick={() => {
                          setAddress(saved.address_text);
                          markTouched('address');
                        }}
                      >
                        {saved.label || 'Saved address'}
                        {saved.is_default ? ' · Default' : ''}
                      </button>
                    ))}
                  </div>
                )}
                <Field id="zone" label="Delivery area" required error={visibleError('zone')}>
                  {zones === null ? (
                    <div className="skeleton" style={{ height: 72, borderRadius: 12 }} aria-busy="true" />
                  ) : (
                    <div className="zone-list" role="radiogroup" aria-label="Delivery area">
                      {zones.map((zone) => (
                        <button
                          key={zone.id}
                          type="button"
                          role="radio"
                          aria-checked={zoneId === zone.id}
                          className={`zone-card${zoneId === zone.id ? ' is-active' : ''}`}
                          onClick={() => {
                            setZoneId(zone.id);
                            setArea('');
                            markTouched('zone');
                          }}
                        >
                          <span className="zone-card__check" aria-hidden="true">
                            {zoneId === zone.id && <Check size={13} />}
                          </span>
                          <span className="zone-card__copy">
                            <strong>{zone.name}</strong>
                            <span>{zone.description}</span>
                          </span>
                          <em className="zone-card__fee">{zone.fee_confirmed ? fmtNaira(zone.fee) : 'Fee on WhatsApp'}</em>
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
                {selectedZone && (
                  <Field id="area" label="Neighbourhood" required error={visibleError('area')}>
                    {selectedZone.areas.length > 0 ? (
                      <select
                        id="area"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                        onBlur={() => markTouched('area')}
                        aria-invalid={Boolean(visibleError('area'))}
                        className="checkout-select"
                      >
                        <option value="">Choose your neighbourhood</option>
                        {selectedZone.areas.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id="area"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                        onBlur={() => markTouched('area')}
                        aria-invalid={Boolean(visibleError('area'))}
                        placeholder="e.g. Ojere"
                      />
                    )}
                  </Field>
                )}
                <Field
                  id="address"
                  label="Street and landmark"
                  required
                  error={visibleError('address')}
                  hint="Include the street, house number and a recognisable landmark."
                >
                  <Textarea
                    ref={(node) => {
                      fieldRefs.current.address = node;
                    }}
                    id="address"
                    autoComplete="street-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    onBlur={() => markTouched('address')}
                    aria-invalid={Boolean(visibleError('address'))}
                    placeholder="e.g. 14 Housing Estate Road, near Continental Hotel"
                  />
                </Field>
              </div>
            )}
          </CheckoutSection>

          {/* Step 3: Schedule */}
          <CheckoutSection
            step="03"
            title="Date and time"
            description="Choose a day and a window. Everything is baked to order and handed over within your slot."
          >
            {scheduleError ? (
              <div className="schedule-error" role="alert">
                <p>We could not load the available times.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={refreshSchedule}>
                  Try again
                </button>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                  Order on WhatsApp instead
                </a>
              </div>
            ) : slotDays === null ? (
              <div className="skeleton" style={{ height: 150, borderRadius: 12 }} aria-busy="true" />
            ) : (
              <div className="schedule">
                <div className="schedule-days" role="radiogroup" aria-label="Date">
                  {slotDays
                    .filter((day) => !day.closed)
                    .slice(0, 14)
                    .map((day) => {
                      const parts = dayParts(day.date);
                      return (
                        <button
                          key={day.date}
                          type="button"
                          role="radio"
                          aria-checked={date === day.date}
                          aria-label={parts.long + (day.open ? '' : ', unavailable')}
                          disabled={!day.open}
                          className={`schedule-day${date === day.date ? ' is-active' : ''}`}
                          onClick={() => {
                            setDate(day.date);
                            if (!day.slots.find((slot) => slot.code === time)?.available) {
                              setTime(day.slots.find((slot) => slot.available)?.code || '');
                            }
                          }}
                        >
                          <small>{parts.weekday}</small>
                          <strong>{parts.day}</strong>
                          <small>{parts.month}</small>
                        </button>
                      );
                    })}
                </div>
                {selectedDay && (
                  <div className="schedule-slots" role="radiogroup" aria-label={`Time slot on ${dayParts(selectedDay.date).long}`}>
                    {selectedDay.slots.map((slot) => (
                      <button
                        key={slot.code}
                        type="button"
                        role="radio"
                        aria-checked={time === slot.code}
                        disabled={!slot.available}
                        className={`schedule-slot${time === slot.code ? ' is-active' : ''}`}
                        onClick={() => setTime(slot.code)}
                      >
                        <strong>{slot.label}</strong>
                        <span>{slotWindow(slot)}</span>
                        {!slot.available && <em>{SLOT_REASON_TEXT[slot.reason] || 'Unavailable'}</em>}
                        {slot.available && slot.remaining !== null && slot.remaining <= 3 && <em>{slot.remaining} left</em>}
                      </button>
                    ))}
                  </div>
                )}
                {visibleError('schedule') && <p className="field-message field-message--error">{visibleError('schedule')}</p>}
                <p className="schedule-note">
                  <Clock size={13} aria-hidden="true" />
                  {fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} happens inside your chosen window. Same-day orders are not available:
                  we need 24 hours of notice.
                </p>
              </div>
            )}
          </CheckoutSection>

          {/* Special Instructions Collapsible */}
          <Collapsible className="checkout-notes">
            <CollapsibleTrigger className="checkout-notes__trigger">
              <span>
                Special instructions / allergies <small>Optional</small>
              </span>
              <ChevronDown size={18} aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="checkout-notes__content">
                <label htmlFor="notes" className="visually-hidden">
                  Special instructions
                </label>
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
              <h2 className="checkout-summary__title">
                {items.length} {items.length === 1 ? 'bake' : 'bakes'}
              </h2>
            </div>
            {!buyNowItem && (
              <Link to="/cart" className="checkout-summary__edit-link">
                Edit cart
              </Link>
            )}
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
                <div className="checkout-summary__item-price">{item.price === null ? 'Price TBC' : fmtLineTotal(item.price, item.qty)}</div>
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
            <div>
              <span>Subtotal</span>
              <strong>{fmtNaira(subtotal)}</strong>
            </div>
            {discount && (
              <div className="checkout-totals__discount">
                <span>Discount · {discount.code}</span>
                <strong>-{fmtNaira(discountAmount)}</strong>
              </div>
            )}
            <div>
              <span>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              <strong>
                {fulfilment === 'pickup'
                  ? 'Free'
                  : !selectedZone
                    ? 'Choose an area'
                    : feePending
                      ? 'Confirmed on WhatsApp'
                      : fmtNaira(deliveryFee)}
              </strong>
            </div>
            {selectedSlot && (
              <div>
                <span>When</span>
                <strong>
                  {dayParts(date).weekday} {dayParts(date).day} {dayParts(date).month}, {selectedSlot.label}
                </strong>
              </div>
            )}
            <div className="checkout-totals__total">
              <span>{feePending ? 'Pay now (excl. delivery)' : 'Total'}</span>
              <strong>{fmtNaira(total)}</strong>
            </div>
          </div>

          {feePending && (
            <div className="checkout-summary__notice">
              <Clock size={14} aria-hidden="true" />
              <span>Pay for your bakes now. We will message you on WhatsApp to confirm the delivery fee before your slot.</span>
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
            <span>
              {saving && paymentState === 'opening' ? 'Connecting to Paystack...' : saving ? 'Confirming...' : `Pay ${fmtNaira(total)}`}
            </span>
          </button>

          {attempted && !formIsValid && (
            <Alert variant="destructive" className="checkout-submit-error">
              <CircleAlert size={17} aria-hidden="true" />
              <AlertDescription>Please check the highlighted fields above before continuing.</AlertDescription>
            </Alert>
          )}

          <div className="checkout-trust">
            <span>
              <LockKeyhole size={13} aria-hidden="true" />
              Secured via Paystack
            </span>
            <span>
              <ShieldCheck size={13} aria-hidden="true" />
              Verified before oven preparation
            </span>
          </div>
        </aside>
      </div>

      {/* Payment status: confirming / recovery */}
      {(paymentState === 'failed' || paymentState === 'unconfirmed' || paymentState === 'confirming') && (
        <div
          className="checkout-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && paymentState !== 'confirming') setPaymentState('idle');
          }}
        >
          <div
            ref={paymentDialogRef}
            className="checkout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-recovery-title"
            aria-busy={paymentState === 'confirming'}
            tabIndex={-1}
          >
            <span className="checkout-dialog__icon">
              <LockKeyhole size={22} aria-hidden="true" />
            </span>
            <p className="checkout-dialog__kicker">Payment status</p>
            <h2 id="payment-recovery-title">
              {paymentState === 'confirming'
                ? 'Confirming your payment…'
                : paymentState === 'failed'
                  ? 'Payment was not completed'
                  : 'We have not confirmed your payment yet'}
            </h2>
            <p className="checkout-dialog__copy">
              {paymentState === 'confirming'
                ? 'This usually takes a few seconds. Please keep this page open.'
                : paymentState === 'failed'
                  ? 'The payment window was closed before it finished. Nothing was charged, and your order details are safe here.'
                  : 'If you were debited, do not pay again. Paystack may still confirm it. Tap Check again, or message us with your order number and we will sort it out.'}
            </p>
            {paymentState !== 'confirming' && (
              <div className="checkout-dialog__actions">
                {paymentState === 'failed' && (
                  <button className="btn btn-primary" disabled={saving} onClick={payWithPaystack}>
                    Try payment again
                  </button>
                )}
                {paymentState === 'unconfirmed' && lastPayment && (
                  <button className="btn btn-primary" onClick={() => confirmPayment(lastPayment.reference, lastPayment.orderId)}>
                    Check again
                  </button>
                )}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Aries 11, I need help with my order${supportOrderNumber ? ` ${supportOrderNumber}` : ''}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>Message us</span>
                </a>
                <button className="checkout-dialog__cancel" onClick={() => setPaymentState('idle')}>
                  Return to form
                </button>
              </div>
            )}
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
        {required && (
          <span className="checkout-field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {optional && <small className="checkout-field__optional">Optional</small>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-message field-message--error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-message">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button type="button" className={`checkout-toggle-btn${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      {active && <Check size={14} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
