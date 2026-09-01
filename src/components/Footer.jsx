import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';

const FOOTER_LINKS = [
  ['Menu', '/menu'],
  ['About', '/about'],
  ['Contact', '/contact'],
  ['Delivery', '/delivery'],
  ['FAQ', '/faq'],
];

const SUPPORT_URL = 'https://wa.me/2348121145785';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__statement">
          <span>Still thinking about it?</span>
          <h2>Let’s bake something<br /><em>worth gathering for.</em></h2>
          <Link to="/menu" className="site-footer__menu-cta">Explore the menu <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="site-footer__brand">
          <BrandLogo tone="light" />
          <p>Made to order in Abeokuta.<br />Please allow at least 24 hours.</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <span className="site-footer__col-label">Explore</span>
          {FOOTER_LINKS.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>

        <div className="site-footer__support">
          <span className="site-footer__col-label">Support</span>
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">Message WhatsApp support</a>
          <span className="site-footer__support-hours">Monday–Saturday, 9am–7pm</span>
        </div>

        <div className="site-footer__base">
          <span>&copy; {new Date().getFullYear()} Aries 11 Bakehouse</span>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/returns">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
