import Image from 'next/image';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function About() {
  return (
    <div className="container about-page">
      <section className="about-intro" aria-labelledby="about-title">
        <div className="about-intro__copy">
          <h1 id="about-title">
            Baked in Abeokuta.
            <br />
            <em>Made for your table.</em>
          </h1>
          <p>
            Aries 11 Bakehouse makes banana bread, brownies, cake treats, pastries and small chops to order. Choose your bake, make it
            yours, and leave the baking to us.
          </p>
          <Link to="/menu" className="btn btn-primary">
            Browse the menu <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="about-intro__image">
          <Image
            src="/uploads/aries11-brand-collection-hero.webp"
            alt="Banana bread, brownies and pastries from Aries 11 Bakehouse"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            priority
          />
        </div>
      </section>
      <section className="about-standard" aria-labelledby="about-standard-title">
        <h2 id="about-standard-title">
          A little planning.
          <br />A freshly made bake.
        </h2>
        <div className="about-standard__details">
          <div>
            <h3>Made to order</h3>
            <p>Give us at least 24 hours’ notice. Each order is prepared from scratch in our Abeokuta kitchen.</p>
          </div>
          <div>
            <h3>Your choice of finish</h3>
            <p>Pick your toppings, flavours and sizes on the product page, from a loaf for home to a platter for sharing.</p>
          </div>
          <div>
            <h3>Pickup or local delivery</h3>
            <p>Collect in Abeokuta or arrange delivery. We confirm the pickup address or delivery fee with your order.</p>
          </div>
          <Link to="/contact" className="text-link">
            Planning a celebration? Talk to us <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
