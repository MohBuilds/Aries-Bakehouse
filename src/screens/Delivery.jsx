'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtNaira } from '../lib/format.js';
import { DEFAULT_SLOTS, fetchDeliveryZones, loadSlots, slotWindow } from '../lib/ordering.js';

// Shown if the live zones cannot be read (offline, outage).
const FALLBACK_AREAS = ['Ibara', 'Oke-Mosan', 'Kuto', 'Isale-Igbein', 'Camp', 'Adigbe', 'Obantoko'];

export default function Delivery() {
  const [zones, setZones] = useState(null);
  const [slots, setSlots] = useState(DEFAULT_SLOTS);

  useEffect(() => {
    let cancelled = false;
    fetchDeliveryZones()
      .then((rows) => !cancelled && setZones(rows))
      .catch(() => !cancelled && setZones([]));
    loadSlots().then((rows) => !cancelled && setSlots(rows));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container content-page delivery-page">
      <header className="content-page__header">
        <h1 className="content-page__title">Delivery &amp; pickup</h1>
        <p className="content-page__subtitle">Made to order in Abeokuta. Choose a day and a time slot, with at least 24 hours of notice.</p>
      </header>

      <div className="delivery-options">
        <section aria-labelledby="pickup-title">
          <h2 id="pickup-title">Collect from the kitchen</h2>
          <p>Choose free pickup at checkout and a time slot. We confirm the Abeokuta collection address with your order.</p>
          <span className="delivery-options__price">Free pickup</span>
        </section>
        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title">Delivered to your door</h2>
          <p>
            Pick your area at checkout. Your order arrives inside the slot you choose, never sooner, because everything is baked for you.
          </p>
          <span className="delivery-options__price">By area</span>
        </section>
      </div>

      <section className="delivery-areas" aria-labelledby="delivery-slots-title">
        <h2 id="delivery-slots-title">Time slots</h2>
        <p>Three windows a day, Monday to Saturday. Pickup and delivery both happen inside your slot.</p>
        <ul>
          {slots.map((slot) => (
            <li key={slot.code}>
              <strong>{slot.label}</strong> {slotWindow(slot)}
            </li>
          ))}
        </ul>
      </section>

      <section className="delivery-areas" aria-labelledby="delivery-areas-title">
        <h2 id="delivery-areas-title">Delivery areas</h2>
        {zones?.length ? (
          <ul>
            {zones.map((zone) => (
              <li key={zone.id}>
                <strong>{zone.name}</strong> {zone.description ? `· ${zone.description} ` : ''}
                <em>{zone.fee_confirmed ? `· ${fmtNaira(zone.fee)}` : '· fee confirmed on WhatsApp'}</em>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p>We serve these areas and nearby neighbourhoods. Message us to confirm your address.</p>
            <ul>
              {FALLBACK_AREAS.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </>
        )}
        <div className="delivery-areas__actions">
          <Link to="/menu" className="btn btn-primary">
            Start an order
          </Link>
          <a
            href="https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20can%20you%20confirm%20delivery%20to%20my%20address%3F"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            <MessageCircle size={17} aria-hidden="true" /> Check my delivery address
          </a>
        </div>
      </section>
    </div>
  );
}
