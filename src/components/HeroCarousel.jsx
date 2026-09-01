'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const WHATSAPP_SUPPORT_URL = 'https://wa.me/2348121145785?text=Hello%20Aries%2011%20Bakehouse%2C%20I%20have%20a%20question.';

export default function HeroCarousel() {
  const reduceMotion = useReducedMotion();
  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
  });

  return (
    <section className="home-hero home-hero--static" aria-labelledby="home-hero-title">
      <motion.div
        className="home-hero__backdrop"
        initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src="/uploads/aries11-brand-collection-hero.webp"
          alt="A spread of Aries 11 Bakehouse treats — banana bread loaves, brownies, small chops and cake cups"
          fill
          priority
          sizes="100vw"
          className="home-hero__backdrop-img"
        />
        <div className="home-hero__backdrop-scrim" aria-hidden="true" />
      </motion.div>

      <div className="container home-hero__static-inner">
        <div className="home-hero__static-copy">
          <motion.p className="home-hero__edition" {...reveal(0.05)}>Made to order · Abeokuta</motion.p>
          <motion.h1 id="home-hero-title" {...reveal(0.12)}>
            Baked for<br />
            <em>the moment.</em>
          </motion.h1>
          <motion.p className="home-hero__static-description" {...reveal(0.2)}>
            Banana bread, brownies, pastries, cake treats and small chops—configured by you and baked fresh for what comes next.
          </motion.p>
          <motion.div className="home-hero__static-actions" {...reveal(0.28)}>
            <Link to="/menu" className="btn home-hero__primary-action">
              <span>Explore the menu</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <a href={WHATSAPP_SUPPORT_URL} target="_blank" rel="noreferrer" className="home-hero__text-action">
              <MessageCircle size={15} aria-hidden="true" />
              <span>WhatsApp Support</span>
            </a>
          </motion.div>
        </div>
      </div>

      <a href="#menu-preview" className="home-hero__scroll-cue">
        <span>Discover</span><ArrowDown size={15} aria-hidden="true" />
      </a>
    </section>
  );
}
