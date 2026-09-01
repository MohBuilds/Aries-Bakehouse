import { Clock, MapPin, Truck, ShieldCheck, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ZONES = [
  { area: 'Ibara & Environs', desc: 'Central Abeokuta residential and commercial hubs.' },
  { area: 'Oke-Mosan & Secretariat', desc: 'Government district and corporate offices.' },
  { area: 'Kuto, Isale-Igbein & Camp', desc: 'University and residential corridors.' },
  { area: 'Adigbe, Obantoko & Other Zones', desc: 'Outlying neighbourhoods with confirmed delivery dispatch.' },
];

export default function Delivery() {
  return (
    <div className="container content-page">
      <header className="content-page__header">
        <span className="page-kicker">Fulfilment & Abeokuta Zones</span>
        <h1 className="content-page__title">Delivery & Pickup Information</h1>
        <p className="content-page__subtitle">
          Everything you need to know about collecting your bakes or arranging doorstep delivery in Abeokuta.
        </p>
      </header>

      <div className="content-page__sections">
        {/* Highlight 24h rule */}
        <div className="content-page__callout">
          <Clock size={20} aria-hidden="true" />
          <div>
            <strong>24-Hour Notice Policy</strong>
            <p>
              Every bake is made from scratch for your specific order. Checkout restricts ordering to dates at least 24 hours in advance so our kitchen can prepare fresh.
            </p>
          </div>
        </div>

        <article className="content-page__card">
          <div className="content-page__card-header">
            <Truck size={20} aria-hidden="true" />
            <h2>Doorstep Delivery Across Abeokuta</h2>
          </div>
          <p>
            We deliver across Abeokuta to ensure your bakes arrive fresh. Delivery fees are calculated based on your exact address and confirmed by our counter team before final dispatch.
          </p>

          <div className="delivery-zones-grid">
            {ZONES.map((zone) => (
              <div key={zone.area} className="delivery-zone-item">
                <MapPin size={16} aria-hidden="true" />
                <div>
                  <strong>{zone.area}</strong>
                  <span>{zone.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="content-page__card">
          <div className="content-page__card-header">
            <MapPin size={20} aria-hidden="true" />
            <h2>Counter Pickup in Abeokuta</h2>
          </div>
          <p>
            Prefer to pick up your order directly? You can select Free Counter Pickup during checkout. 
            The exact kitchen collection address in Abeokuta will be confirmed upon order confirmation.
          </p>
        </article>

        <article className="content-page__card">
          <div className="content-page__card-header">
            <ShieldCheck size={20} aria-hidden="true" />
            <h2>Packaging & Transit Care</h2>
          </div>
          <p>
            All bakes—from fragile fudgy brownie boxes to multi-layer parfaits and hot pastry trays—are securely boxed and sealed for safe transit in Abeokuta weather.
          </p>
        </article>
      </div>

      <div className="content-page__footer-action">
        <div>
          <h3>Have a specific delivery question?</h3>
          <p>Chat directly with our Abeokuta counter team on WhatsApp.</p>
        </div>
        <a
          href="https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20have%20a%20delivery%20question."
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
