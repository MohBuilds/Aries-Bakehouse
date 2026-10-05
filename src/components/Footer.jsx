import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, Clock, MapPin } from 'lucide-react';
import OrderingWorks from './OrderingWorks.jsx';
import BrandLogo from './BrandLogo.jsx';

const FOOTER_LINKS = {
  menu: [
    { label: 'Full Menu', to: '/menu' },
    { label: 'Banana Bread', to: '/menu/banana-bread' },
    { label: 'Brownie Boxes', to: '/menu/brownies' },
    { label: 'Cake Treats & Parfaits', to: '/menu/cake-treats' },
    { label: 'Pastry Trays', to: '/menu/pastries' },
    { label: 'Small Chops Platters', to: '/menu/small-chops' },
  ],
  explore: [
    { label: 'Our Story & Kitchen', to: '/about' },
    { label: 'Delivery & Abeokuta Zones', to: '/delivery' },
    { label: 'Frequently Asked Questions', to: '/faq' },
    { label: 'Customer Account', to: '/account' },
    { label: 'Contact Us', to: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Returns & Cancellations', to: '/returns' },
  ],
};

const SUPPORT_URL = 'https://wa.me/2348121145785';

export default function Footer({ showOrdering = false }) {
  return (
    <footer className="site-footer" data-site-footer>
      {/* Top closing invitation */}
      <div className="site-footer__closing-hero">
        <div className="container site-footer__closing-inner">
          <div className="site-footer__closing-copy">
            <h2 className="site-footer__closing-title">
              Let’s bake something<br />
              <em>worth gathering for.</em>
            </h2>
            <p className="site-footer__closing-desc">
              All bakes are made to order from scratch in Abeokuta. Reserve your bake with 24 hours notice.
            </p>
          </div>
          <div className="site-footer__closing-actions">
            <Link to="/menu" className="btn site-footer__cta-menu">
              <span>Explore the menu</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="btn site-footer__cta-whatsapp">
              <MessageCircle size={17} aria-hidden="true" />
              <span>WhatsApp support</span>
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>

      {showOrdering && <OrderingWorks />}

      {/* Main navigation columns & details */}
      <div className="site-footer__main">
        <div className="container site-footer__main-grid">
          {/* Col 1: Brand & Preorder Promise */}
          <div className="site-footer__brand-col">
            <BrandLogo className="site-footer__logo" loading="lazy" />
            <p className="site-footer__mission">
              Handcrafted bakery in Abeokuta, Nigeria. We celebrate real ingredients, deep chocolate, and custom bakes tailored to your moment.
            </p>
            <div className="site-footer__pill-info">
              <div className="site-footer__pill-item">
                <Clock size={15} aria-hidden="true" />
                <span>24 hours advance notice required</span>
              </div>
              <div className="site-footer__pill-item">
                <MapPin size={15} aria-hidden="true" />
                <span>Abeokuta, Ogun State, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Col 2: Menu Categories */}
          <nav className="site-footer__col" aria-label="Menu categories">
            <h3 className="site-footer__col-heading">Catalogue</h3>
            <ul className="site-footer__link-list">
              {FOOTER_LINKS.menu.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 3: Exploration & Info */}
          <nav className="site-footer__col" aria-label="Quick links">
            <h3 className="site-footer__col-heading">Information</h3>
            <ul className="site-footer__link-list">
              {FOOTER_LINKS.explore.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 4: Support & Direct WhatsApp */}
          <div className="site-footer__col site-footer__support-col">
            <h3 className="site-footer__col-heading">Support & Ordering</h3>
            <p className="site-footer__support-text">
              Questions about an upcoming celebration, custom order or delivery radius?
            </p>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="site-footer__support-link">
              <MessageCircle size={16} aria-hidden="true" />
              <span>+234 812 114 5785</span>
              <span className="visually-hidden"> (chat on WhatsApp, opens in a new tab)</span>
            </a>
            <span className="site-footer__hours-tag">
              Mon–Sat: 9:00 AM – 7:00 PM WAT
            </span>
          </div>
        </div>
      </div>

      {/* Bottom copyright and legal */}
      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p className="site-footer__copyright">
            &copy; {new Date().getFullYear()} Aries 11 Bakehouse. All rights reserved.
          </p>
          <div className="site-footer__legal-links">
            {FOOTER_LINKS.legal.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
