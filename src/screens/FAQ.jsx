import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible.jsx';

const FAQS = [
  {
    category: 'Ordering & Timing',
    items: [
      {
        q: 'How much notice do you need for an order?',
        a: 'Please allow at least 24 hours before pickup or delivery. Available dates are shown at checkout.',
      },
      {
        q: 'Can I order custom platters or large corporate boxes?',
        a: 'Yes. Build your order on the menu, or message us on WhatsApp to arrange quantities and timing.',
      },
    ],
  },
  {
    category: 'Payment & Pricing',
    items: [
      {
        q: 'How do I pay for my order?',
        a: 'Pay through Paystack at checkout. Items marked Price TBC need team price confirmation before payment. WhatsApp assistance is available.',
      },
      {
        q: 'Are there hidden fees?',
        a: 'Product prices are shown on the menu. Delivery is charged separately; our team confirms the fee for your address.',
      },
    ],
  },
  {
    category: 'Fulfilment & Care',
    items: [
      {
        q: 'Do you deliver across Abeokuta?',
        a: 'We deliver locally in Abeokuta, with availability and fees confirmed for your address. Free pickup is also available.',
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
        <h1 className="content-page__title">Common questions</h1>
        <p className="content-page__subtitle">Ordering, payment and caring for your bakes.</p>
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
                  <Collapsible key={item.q} open={isOpen} onOpenChange={() => toggle(id)} className={`faq-item${isOpen ? ' is-open' : ''}`}>
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
          <p>Ask our kitchen on WhatsApp.</p>
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
