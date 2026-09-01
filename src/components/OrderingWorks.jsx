'use client';

import { Sparkles, Sliders, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ORDER_STEPS = [
  {
    num: '01',
    icon: Sparkles,
    title: 'Choose your bake',
    subtitle: 'From the digital counter',
    copy: 'Select your favourite loaf, brownie box, layered parfait, savoury pastry tray, or party platter.',
  },
  {
    num: '02',
    icon: Sliders,
    title: 'Configure the details',
    subtitle: 'Toppings, crunches & sizes',
    copy: 'Customize loaf toppings, crust crunch, dipping sauces, and flavours tailored to your taste.',
  },
  {
    num: '03',
    icon: Clock,
    title: 'Baked fresh to order',
    subtitle: '24h advance notice',
    copy: 'We prepare every order from scratch in our Abeokuta kitchen for scheduled collection or delivery.',
  },
];

export default function OrderingWorks() {
  return (
    <section className="ordering-timeline-section" aria-labelledby="ordering-title">
      <div className="container ordering-timeline__inner">
        <div className="ordering-timeline__header">
          <span className="page-kicker">The Bakehouse Standard</span>
          <h2 id="ordering-title">How ordering works</h2>
          <p className="ordering-timeline__subtitle">
            Three simple steps between your craving and fresh oven warmth.
          </p>
        </div>

        <div className="ordering-timeline__grid" role="list">
          {ORDER_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="ordering-timeline__card" role="listitem">
                <div className="ordering-timeline__card-top">
                  <span className="ordering-timeline__number">{step.num}</span>
                  <span className="ordering-timeline__icon-badge" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                </div>
                <div className="ordering-timeline__card-content">
                  <span className="ordering-timeline__kicker">{step.subtitle}</span>
                  <h3 className="ordering-timeline__title">{step.title}</h3>
                  <p className="ordering-timeline__desc">{step.copy}</p>
                </div>
                {idx < ORDER_STEPS.length - 1 && (
                  <div className="ordering-timeline__connector" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {/* Quiet Reassurance & Support Bar */}
        <div className="ordering-timeline__support-bar">
          <div className="ordering-timeline__support-text">
            <strong>Need help with an existing order or dietary question?</strong>
            <span>Our Abeokuta kitchen counter is available on WhatsApp for quick customer support.</span>
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
