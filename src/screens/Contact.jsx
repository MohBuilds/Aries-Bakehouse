import { Link } from 'react-router-dom';
import { MessageCircle, ArrowUpRight } from 'lucide-react';

export default function Contact() {
  return (
    <div className="container contact-page">
      <header className="contact-intro">
        <div className="contact-intro__copy">
          <h1>Let’s talk bakes.</h1>
          <p>Questions about an order, custom platter or delivery? Reach our kitchen on WhatsApp.</p>
          <a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" className="btn btn-whatsapp">
            <MessageCircle size={18} aria-hidden="true" /> Message on WhatsApp
          </a>
        </div>
        <dl className="contact-facts">
          <div>
            <dt>Phone</dt>
            <dd>
              <a href="tel:+2348121145785">+234 812 114 5785</a>
            </dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>
              Monday–Saturday
              <br />
              9:00 AM–7:00 PM WAT
            </dd>
          </div>
          <div>
            <dt>Pickup</dt>
            <dd>
              Abeokuta, Ogun State
              <br />
              <span>Exact address confirmed with your order.</span>
            </dd>
          </div>
          <div>
            <dt>Notice</dt>
            <dd>At least 24 hours before pickup or delivery.</dd>
          </div>
        </dl>
      </header>
      <nav className="contact-resources" aria-label="Ordering information">
        <Link to="/delivery">
          Delivery & pickup <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/faq">
          Common questions <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}
