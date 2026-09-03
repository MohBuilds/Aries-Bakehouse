'use client';

import { MessageCircle, ArrowUpRight } from 'lucide-react';

const ORDER_STEPS = [
  {
    num: '01',
    title: 'Choose your bake',
    copy: 'Browse our signature loaves, brownie boxes, layered parfaits, savoury pastry trays, or sharing platters.',
  },
  {
    num: '02',
    title: 'Customize the details',
    copy: 'Tailor your loaf crunches, brownie box assortments, dipping sauces, and flavours to your exact taste.',
  },
  {
    num: '03',
    title: 'Baked fresh to order',
    copy: 'Prepared from scratch in our Abeokuta kitchen with 24 hours advance notice for pickup or delivery.',
  },
];

export default function OrderingWorks() {
  return (
    <section className="ordering-timeline-section" aria-labelledby="ordering-title">
      <div className="container ordering-timeline__inner">
        <div className="ordering-timeline__header">
          <span className="page-kicker">The Kitchen Standard</span>
          <h2 id="ordering-title">How ordering works</h2>
          <p className="ordering-timeline__subtitle">
            Three simple steps between your craving and fresh oven warmth.
          </p>
        </div>

        <div className="ordering-timeline__grid" role="list">
          {ORDER_STEPS.map((step) => (
            <div key={step.num} className="ordering-timeline__card" role="listitem">
              <span className="ordering-timeline__number">{step.num}</span>
              <h3 className="ordering-timeline__title">{step.title}</h3>
              <p className="ordering-timeline__desc">{step.copy}</p>
            </div>
          ))}
        </div>

        {/* Quiet Reassurance Support Line */}
        <div className="ordering-timeline__support-bar">
          <div className="ordering-timeline__support-text">
            <strong>Have an upcoming celebration or dietary question?</strong>
            <span>Our counter team is available on WhatsApp for quick customer support.</span>
          </div>
          <a
            href="https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20have%20a%20support%20question."
            target="_blank"
            rel="noreferrer"
            className="ordering-timeline__support-link"
          >
            <MessageCircle size={15} aria-hidden="true" />
            <span>WhatsApp Support</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
