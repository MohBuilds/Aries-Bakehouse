import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, Clock, Sparkles, Heart, ShieldCheck, MapPin } from 'lucide-react';
import SignatureLoafSpotlight from '../components/SignatureLoafSpotlight.jsx';

const VALUES = [
  {
    icon: Clock,
    title: 'Zero Pre-Baking',
    description: 'We do not hold bakes in warmers or store them on shelves. Every order starts with fresh measurements when your booking is placed.',
  },
  {
    icon: Sparkles,
    title: 'Honest, Pure Ingredients',
    description: 'Real butter, rich Nigerian cocoa, ripe sweet bananas, and premium toppings. No shortcuts, artificial fillers, or preservatives.',
  },
  {
    icon: Heart,
    title: 'Customized To Your Craving',
    description: 'From 7 banana bread crunches to tailored brownie boxes and mixed party platters, every bake reflects your unique moment.',
  },
  {
    icon: MapPin,
    title: 'Proudly Abeokuta',
    description: 'Crafted in our local kitchen to elevate everyday gatherings, birthdays, and thoughtful gifting across Ogun State.',
  },
];

export default function About() {
  return (
    <div className="about-page">
      {/* 1. Cinematic Opening Statement */}
      <section className="about-hero" aria-labelledby="about-title">
        <img
          src="/uploads/aries11-brand-collection-hero.webp"
          alt="Aries 11 Bakehouse collection spread"
          className="about-hero__bg"
        />
        <div className="about-hero__scrim" aria-hidden="true" />
        <div className="container about-hero__content">
          <span className="page-kicker page-kicker--light">Our Story & Craft</span>
          <h1 id="about-title">A home kitchen idea,<br /><em>baked for Abeokuta.</em></h1>
          <p>
            Aries 11 Bakehouse was born from a simple devotion: that baking should be intimate, 
            made entirely to order, and worth gathering for.
          </p>
        </div>
      </section>

      {/* 2. Brand Origin & Spotlight */}
      <SignatureLoafSpotlight
        className="signature-loaf--about"
        badge="The Origin"
        headingId="about-beginning-title"
        title="It started with one loaf."
        description="Banana bread was where our standards were forged. Seven toppings now give each loaf an individual voice, while the same uncompromising craft extends into brownie boxes, layered parfaits, golden pastries, and party platters."
        ctaLabel="Build your loaf"
      />

      {/* 3. The 24-Hour Philosophy */}
      <section className="about-philosophy-section" aria-labelledby="about-philosophy-title">
        <div className="container about-philosophy__inner">
          <div className="about-philosophy__text">
            <span className="page-kicker">The Craft Standard</span>
            <h2 id="about-philosophy-title">Fresh takes thoughtful planning.</h2>
            <p>
              In an era of mass-produced supermarket racks, we chose the quieter path of made-to-order craft. 
              Requiring 24 hours advance notice ensures our bakers have time to source farm-fresh eggs, prove doughs at natural pace, 
              and box your order minutes before delivery.
            </p>
            <div className="about-philosophy__metrics">
              <div className="about-philosophy__metric">
                <strong>24h</strong>
                <span>Notice for perfection</span>
              </div>
              <div className="about-philosophy__metric">
                <strong>100%</strong>
                <span>Made from scratch</span>
              </div>
              <div className="about-philosophy__metric">
                <strong>0</strong>
                <span>Artificial preservatives</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Values Grid */}
      <section className="container about-values-section" aria-labelledby="about-values-title">
        <div className="about-values__header">
          <span className="page-kicker">What We Stand For</span>
          <h2 id="about-values-title">Our Kitchen Commitments</h2>
        </div>
        <div className="about-values__grid">
          {VALUES.map((val) => {
            const Icon = val.icon;
            return (
              <div key={val.title} className="about-value-card">
                <div className="about-value-card__icon">
                  <Icon size={22} />
                </div>
                <h3>{val.title}</h3>
                <p>{val.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Closing Invitation */}
      <section className="about-closing-section" aria-labelledby="about-closing-title">
        <div className="container about-closing__box">
          <h2 id="about-closing-title">Ready for your table?</h2>
          <p>
            Explore our curated menu or message our kitchen team directly on WhatsApp for custom platters and celebrations.
          </p>
          <div className="about-closing__actions">
            <Link to="/menu" className="btn btn-primary">
              <span>Explore the menu</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20would%20like%20to%20learn%20more%20about%20your%20bakes."
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <MessageCircle size={16} aria-hidden="true" />
              <span>Chat with bakers</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
