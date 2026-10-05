import { MessageCircle } from 'lucide-react';
const ZONES = ['Ibara', 'Oke-Mosan', 'Kuto', 'Isale-Igbein', 'Camp', 'Adigbe', 'Obantoko'];

export default function Delivery() {
  return (
    <div className="container content-page delivery-page">
      <header className="content-page__header">
        <h1 className="content-page__title">Delivery & pickup</h1>
        <p className="content-page__subtitle">Made to order in Abeokuta. Please allow at least 24 hours’ notice.</p>
      </header>
      <div className="delivery-options">
        <section aria-labelledby="pickup-title">
          <h2 id="pickup-title">Collect from the kitchen</h2>
          <p>Choose free pickup at checkout. We’ll confirm the Abeokuta collection address with your order.</p>
          <span className="delivery-options__price">Free pickup</span>
        </section>
        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title">Delivered to your door</h2>
          <p>
            Enter your address and a nearby landmark at checkout. Our team confirms availability and the delivery fee for your location.
          </p>
          <span className="delivery-options__price">Fee confirmed separately</span>
        </section>
      </div>
      <section className="delivery-areas" aria-labelledby="delivery-areas-title">
        <h2 id="delivery-areas-title">Around Abeokuta</h2>
        <p>We serve these areas and nearby neighbourhoods. Message us to confirm your address.</p>
        <ul>
          {ZONES.map((area) => (
            <li key={area}>{area}</li>
          ))}
        </ul>
        <a
          href="https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20can%20you%20confirm%20delivery%20to%20my%20address%3F"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          <MessageCircle size={17} aria-hidden="true" /> Check my delivery address
        </a>
      </section>
    </div>
  );
}
