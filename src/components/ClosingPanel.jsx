import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/2348121145785';

const STEPS = [
  { title: 'Choose', copy: 'Pick a bake, a size and your toppings.' },
  { title: 'Order', copy: 'Pay online, or finish on WhatsApp.' },
  { title: 'Collect', copy: 'Ready after 24 hours’ notice. Pickup or Abeokuta delivery.' },
];

// The page's single closing call to action: one headline, one primary and one
// WhatsApp button, and how ordering works in three short lines.
export default function ClosingPanel() {
  return (
    <section className="closing" data-closing aria-labelledby="closing-title">
      <div className="container closing__inner">
        <div className="closing__lead">
          <h2 id="closing-title">
            Let’s bake something <em>worth gathering for.</em>
          </h2>
          <div className="closing__actions">
            <Link to="/menu" className="btn closing__primary">
              <span>Explore the menu</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
              <MessageCircle size={16} aria-hidden="true" />
              <span>WhatsApp us</span>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <ol className="closing__steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="closing__num" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
