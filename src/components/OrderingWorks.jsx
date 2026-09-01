'use client';

import { Sparkles, Sliders, Clock } from 'lucide-react';

const ORDER_STEPS = [
  {
    num: '01',
    icon: Sparkles,
    title: 'Choose your bake',
    subtitle: 'Browse the counter',
    copy: 'Select your favourite loaf, brownie box, layered parfait, savoury pastry tray or sharing platter.',
  },
  {
    num: '02',
    icon: Sliders,
    title: 'Configure the details',
    subtitle: 'Tailor toppings & sizes',
    copy: 'Choose sizes, crust crunches, sauces, and flavour mixes crafted specifically to your preference.',
  },
  {
    num: '03',
    icon: Clock,
    title: 'Baked fresh with 24h notice',
    subtitle: 'Delivered or ready for pickup',
    copy: 'Every order is freshly prepared in our Abeokuta kitchen. Allow at least 24 hours for oven perfection.',
  },
];

export default function OrderingWorks() {
  return (
    <section className="ordering-timeline-section" aria-labelledby="ordering-title">
      <div className="container ordering-timeline__inner">
        <div className="ordering-timeline__header">
          <p className="home-section__kicker">The Process</p>
          <h2 id="ordering-title">How ordering works</h2>
          <p className="ordering-timeline__subtitle">
            Three simple steps between your craving and a freshly baked box.
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
      </div>
    </section>
  );
}
