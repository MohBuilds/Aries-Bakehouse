import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';

const FOOTER_LINKS = {
  menu: [
    { label: 'All bakes', to: '/menu' },
    { label: 'Banana Bread', to: '/menu/banana-bread' },
    { label: 'Brownie Boxes', to: '/menu/brownies-cookies' },
    { label: 'Cake Treats & Parfaits', to: '/menu/cake-treats' },
    { label: 'Pastry Trays', to: '/menu/pastries' },
    { label: 'Small Chops Platters', to: '/menu/small-chops' },
  ],
  explore: [
    { label: 'About us', to: '/about' },
    { label: 'Delivery & pickup', to: '/delivery' },
    { label: 'FAQs', to: '/faq' },
    { label: 'Your account', to: '/account' },
    { label: 'Contact', to: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Returns & Cancellations', to: '/returns' },
  ],
};

const SUPPORT_URL = 'https://wa.me/2348121145785';

export default function Footer() {
  return (
    <footer className="site-footer" data-site-footer>
      {/* Main navigation columns & details */}
      <div className="site-footer__main">
        <div className="container site-footer__main-grid">
          {/* Col 1: Brand & Preorder Promise */}
          <div className="site-footer__brand-col">
            <BrandLogo className="site-footer__logo" loading="lazy" />
            <p className="site-footer__mission">Made to order in Abeokuta, Ogun State.</p>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="site-footer__support-link">
              <MessageCircle size={16} aria-hidden="true" /> +234 812 114 5785
            </a>
            <span className="site-footer__hours-tag">Mon–Sat · 9 AM–7 PM WAT</span>
          </div>

          {/* Col 2: Menu Categories */}
          <nav className="site-footer__col" aria-label="Menu">
            <h2 className="site-footer__col-heading">Menu</h2>
            <ul className="site-footer__link-list">
              {FOOTER_LINKS.menu.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 3: Exploration & Info */}
          <nav className="site-footer__col" aria-label="Help">
            <h2 className="site-footer__col-heading">Help</h2>
            <ul className="site-footer__link-list">
              {FOOTER_LINKS.explore.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom copyright and legal */}
      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p className="site-footer__copyright">&copy; {new Date().getFullYear()} Aries 11 Bakehouse. All rights reserved.</p>
          <div className="site-footer__legal-links">
            {FOOTER_LINKS.legal.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
