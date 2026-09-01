import { MessageCircle, ArrowUpRight, Calendar, Users, HelpCircle } from 'lucide-react';

const WHATSAPP_ORDER_URL = 'https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20would%20like%20to%20place%20a%20custom%20order.';

export default function WhatsAppConcierge() {
  return (
    <section className="whatsapp-concierge-section" aria-labelledby="whatsapp-concierge-title">
      <div className="container whatsapp-concierge__inner">
        <div className="whatsapp-concierge__box">
          <div className="whatsapp-concierge__left">
            <div className="whatsapp-concierge__kicker">
              <MessageCircle size={15} aria-hidden="true" />
              <span>Direct Concierge</span>
            </div>

            <h2 id="whatsapp-concierge-title" className="whatsapp-concierge__title">
              Order directly with our team on WhatsApp.
            </h2>

            <p className="whatsapp-concierge__lead">
              Have special dietary requests, need bespoke event platters, or prefer personal assistance? 
              Chat live with our Abeokuta counter team to curate your bake.
            </p>

            <div className="whatsapp-concierge__reasons">
              <div className="whatsapp-concierge__reason">
                <Users size={16} aria-hidden="true" />
                <span>Large party platters & corporate orders</span>
              </div>
              <div className="whatsapp-concierge__reason">
                <Calendar size={16} aria-hidden="true" />
                <span>Specific future date scheduling</span>
              </div>
              <div className="whatsapp-concierge__reason">
                <HelpCircle size={16} aria-hidden="true" />
                <span>Ingredient advice & flavor tailoring</span>
              </div>
            </div>

            <div className="whatsapp-concierge__cta-wrap">
              <a
                href={WHATSAPP_ORDER_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp whatsapp-concierge__button"
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span>Chat on WhatsApp</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <span className="whatsapp-concierge__hours">
                Active Monday–Saturday · 9:00 AM – 7:00 PM WAT
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
