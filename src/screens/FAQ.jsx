import { useState } from 'react';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible.jsx';

const FAQS = [
  {
    category: 'Ordering & Timing',
    items: [
      {
        q: 'How much notice do you need for an order?',
        a: 'Every order requires at least 24 hours advance notice. We bake entirely to order from scratch rather than holding inventory on a shelf. The checkout calendar will only allow you to pick dates starting tomorrow onwards.',
      },
      {
        q: 'Can I order custom platters or large corporate boxes?',
        a: 'Yes! For large party platters, corporate gifting, or bespoke catering, you can build your order on our menu or message our WhatsApp concierge directly to coordinate specific quantities and arrival times.',
      },
    ],
  },
  {
    category: 'Payment & Pricing',
    items: [
      {
        q: 'How do I pay for my order?',
        a: 'Payment is completed online through Paystack at checkout via debit/credit card, bank transfer, or USSD. If an item in your cart is custom/unpriced (Price TBC), our team will confirm the final amount with you before taking payment.',
      },
      {
        q: 'Are there hidden fees?',
        a: 'No hidden fees. Product prices are clearly displayed on each item card. For delivery orders, the local delivery dispatch fee is calculated and confirmed based on your exact Abeokuta drop-off address.',
      },
    ],
  },
  {
    category: 'Fulfilment & Care',
    items: [
      {
        q: 'Do you deliver across Abeokuta?',
        a: 'Yes, we deliver across Abeokuta including Ibara, Oke-Mosan, Kuto, Camp, Adigbe, and surrounding areas. We also offer free pickup from our Abeokuta counter.',
      },
      {
        q: 'How should I store my bakes?',
        a: 'Banana bread and brownies remain moist and delicious at cool room temperature for 3 days, or refrigerated for up to 5 days. Cake parfaits and twist treats must be kept refrigerated and served chilled.',
      },
      {
        q: 'What if I have an ingredient allergy?',
        a: 'We list primary allergens on every product page. If you have a severe nut, dairy, or gluten allergy, please message our kitchen before ordering so we can confirm preparation safety.',
      },
    ],
  },
];

export default function FAQ() {
  const [openMap, setOpenMap] = useState({});

  function toggle(id) {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="container content-page">
      <header className="content-page__header">
        <span className="page-kicker">Help & Guidance</span>
        <h1 className="content-page__title">Frequently Asked Questions</h1>
        <p className="content-page__subtitle">
          Everything you need to know about our made-to-order bakes, timing, payments, and delivery.
        </p>
      </header>

      <div className="faq-categories-list">
        {FAQS.map((cat) => (
          <div key={cat.category} className="faq-category-block">
            <h2 className="faq-category-title">{cat.category}</h2>
            <div className="faq-list">
              {cat.items.map((item, idx) => {
                const id = `${cat.category}-${idx}`;
                const isOpen = Boolean(openMap[id]);
                return (
                  <Collapsible
                    key={item.q}
                    open={isOpen}
                    onOpenChange={() => toggle(id)}
                    className={`faq-item${isOpen ? ' is-open' : ''}`}
                  >
                    <CollapsibleTrigger className="faq-item__trigger">
                      <span>{item.q}</span>
                      <ChevronDown size={18} aria-hidden="true" className="faq-item__icon" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="faq-item__answer">{item.a}</div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="content-page__footer-action">
        <div>
          <h3>Didn’t find your answer?</h3>
          <p>Our kitchen team is available Monday to Saturday to answer any questions.</p>
        </div>
        <a
          href="https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20have%20a%20question."
          target="_blank"
          rel="noreferrer"
          className="btn btn-whatsapp"
        >
          <MessageCircle size={16} aria-hidden="true" />
          <span>Message on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
