import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, MessageCircle, Utensils, Truck, Sparkles, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../lib/orders.js';
import { describeSlot, loadSlots } from '../lib/ordering.js';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import EmptyState from '../components/EmptyState.jsx';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined);
  const [slots, setSlots] = useState(null);

  useEffect(() => {
    loadSlots().then(setSlots);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (order === undefined) {
    return (
      <div className="container order-state-loading">
        <div className="skeleton" style={{ height: 40, width: '40%', margin: '40px auto 20px', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 260, maxWidth: 640, margin: '0 auto', borderRadius: 16 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <main className="container order-confirmation">
        <EmptyState
          title="Order not found"
          desc="We couldn’t find this order. Please check your confirmation link or browse our menu."
          actionLabel="Browse the menu"
          actionTo="/menu"
        />
      </main>
    );
  }

  const pending = order.status === 'pending';
  const supportUrl = `https://wa.me/2348121145785?text=${encodeURIComponent(
    `Hello Aries 11 Bakehouse, I am checking in on my order #${order.orderNumber || order.id?.slice(0, 8)}.`,
  )}`;

  return (
    <main className="container order-confirmation-page">
      {/* 1. Celebratory Header */}
      <header className="order-confirmation__header">
        <div className="order-confirmation__icon-badge">
          {pending ? <Clock3 size={28} aria-hidden="true" /> : <Sparkles size={28} aria-hidden="true" />}
        </div>
        <span className="page-kicker">{pending ? 'Payment Pending' : 'Order Confirmed'}</span>
        <h1 className="order-confirmation__title">{pending ? 'Your order is recorded.' : 'Baked for the moment.'}</h1>
        <p className="order-confirmation__subtitle">
          {pending
            ? 'We are confirming your payment. The kitchen has received your details.'
            : `Thank you, ${order.name || 'valued customer'}. Your bakes are scheduled with our Abeokuta kitchen.`}
        </p>
        <div className="order-confirmation__ref-pill">
          <span>Order #{order.orderNumber || order.id?.slice(0, 8)}</span>
        </div>
      </header>

      {/* 2. Visual Status Timeline */}
      <section className="order-confirmation__timeline-card" aria-label="Order preparation progress">
        <h2 className="order-confirmation__section-title">Kitchen Timeline</h2>
        <div className="order-status-steps">
          <div className="order-status-step is-complete">
            <span className="order-status-step__dot">
              <CheckCircle2 size={16} />
            </span>
            <div className="order-status-step__copy">
              <strong>Order Received</strong>
              <span>Details & receipt logged</span>
            </div>
          </div>

          <div className={`order-status-step${!pending ? ' is-active' : ''}`}>
            <span className="order-status-step__dot">
              <Utensils size={16} />
            </span>
            <div className="order-status-step__copy">
              <strong>Kitchen Preparation</strong>
              <span>Handcrafted 24h before date</span>
            </div>
          </div>

          <div className="order-status-step">
            <span className="order-status-step__dot">
              <Truck size={16} />
            </span>
            <div className="order-status-step__copy">
              <strong>{order.fulfilment === 'pickup' ? 'Counter Pickup' : 'Delivery Dispatch'}</strong>
              <span>{order.fulfilment === 'pickup' ? 'Ready at Abeokuta counter' : 'Dispatched to your address'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Receipt & Configured Items */}
      <section className="order-confirmation__panel">
        <h2 className="order-confirmation__section-title">Order Receipt</h2>
        <div className="order-confirmation__items">
          {order.items?.map((item, idx) => (
            <div key={item.id || idx} className="order-confirmation__item-row">
              <div className="order-confirmation__item-info">
                <strong>{item.name}</strong>
                <span>Quantity: {item.qty}</span>
              </div>
              <span className="order-confirmation__item-total">
                {item.price === null ? 'Price TBC' : fmtLineTotal(item.price, item.qty)}
              </span>
            </div>
          ))}
        </div>

        <div className="order-confirmation__summary-totals">
          <div className="order-confirmation__total-line">
            <span>Total Paid</span>
            <strong>{fmtNaira(order.total)}</strong>
          </div>
          {order.hasUnpricedItems && (
            <p className="order-confirmation__notice">The displayed total excludes custom items awaiting price confirmation.</p>
          )}
        </div>

        <dl className="order-confirmation__details-grid">
          <div>
            <dt>
              <Truck size={14} aria-hidden="true" /> Fulfilment
            </dt>
            <dd>{order.fulfilment === 'pickup' ? 'Pickup in Abeokuta' : 'Doorstep Delivery'}</dd>
          </div>
          {order.fulfilment === 'delivery' && (
            <div>
              <dt>
                <MapPin size={14} aria-hidden="true" /> Address
              </dt>
              <dd>{[order.deliveryArea, order.address].filter(Boolean).join(' · ') || 'Address on file'}</dd>
            </div>
          )}
          {order.fulfilment === 'delivery' && order.deliveryFeePending && (
            <div>
              <dt>
                <Truck size={14} aria-hidden="true" /> Delivery fee
              </dt>
              <dd>We will confirm it on WhatsApp before your slot</dd>
            </div>
          )}
          <div>
            <dt>
              <Calendar size={14} aria-hidden="true" /> Scheduled Date
            </dt>
            <dd>
              {order.date
                ? new Date(`${order.date}T12:00:00`).toLocaleDateString('en-NG', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'To be scheduled'}
            </dd>
          </div>
          <div>
            <dt>
              <Clock3 size={14} aria-hidden="true" /> Time Window
            </dt>
            <dd>{order.time ? describeSlot(slots, order.time) : 'To be scheduled'}</dd>
          </div>
        </dl>
      </section>

      {/* 4. Action Pathways */}
      <div className="order-confirmation__actions-card">
        <div className="order-confirmation__actions-left">
          <h3>Need to confirm delivery or add items?</h3>
          <p>Chat directly with our counter team on WhatsApp with your order number.</p>
        </div>
        <div className="order-confirmation__buttons">
          <a href={supportUrl} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
            <MessageCircle size={16} aria-hidden="true" />
            <span>Chat with Bakers</span>
          </a>
          <Link to={`/account/orders/${order.id}`} className="btn btn-secondary">
            <span>Track order</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <Link to="/menu" className="order-confirmation__menu-link">
            Explore more bakes
          </Link>
        </div>
      </div>
    </main>
  );
}
