import { Link } from 'react-router-dom';
import { MessageCircle, Phone, MapPin, Clock, ArrowUpRight, HelpCircle, Truck } from 'lucide-react';

const SUPPORT_URL = 'https://wa.me/2348121145785';

export default function Contact() {
  return (
    <div className="contact-page">
      <section className="container contact-intro" aria-labelledby="contact-title">
        <div className="contact-intro__copy">
          <span className="page-kicker">Direct Counter Assistance</span>
          <h1 id="contact-title">We’re here to help.</h1>
          <p>
            Have a question about an upcoming celebration, need help with an existing order, or want to coordinate specific delivery timing? Message our team directly.
          </p>
        </div>
        <div className="contact-intro__action">
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="btn btn-whatsapp contact-intro__whatsapp-btn">
            <MessageCircle size={18} aria-hidden="true" />
            <span>Message on WhatsApp</span>
          </a>
          <span className="contact-intro__hours">Active Monday–Saturday · 9:00 AM – 7:00 PM WAT</span>
        </div>
      </section>

      <section className="container contact-details-grid" aria-labelledby="contact-details-title">
        <div className="contact-card">
          <div className="contact-card__icon"><MessageCircle size={22} /></div>
          <h3>WhatsApp Concierge</h3>
          <p>The fastest way to reach our baking team for custom orders and order status updates.</p>
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="contact-card__link">
            <span>+234 812 114 5785</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon"><MapPin size={22} /></div>
          <h3>Abeokuta Kitchen</h3>
          <p>All bakes are prepared fresh in Abeokuta, Ogun State. Exact pickup address confirmed upon order.</p>
          <Link to="/delivery" className="contact-card__link">
            <span>View delivery zones</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon"><Clock size={22} /></div>
          <h3>Operating Hours</h3>
          <p>Baking & support active Monday to Saturday. Please ensure at least 24 hours advance notice.</p>
          <Link to="/faq" className="contact-card__link">
            <span>Browse FAQs</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
