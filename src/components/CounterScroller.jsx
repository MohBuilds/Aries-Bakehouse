'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const SHOWCASE = [
  {
    id: 'banana-bread',
    name: 'Banana Bread',
    kicker: 'Signature Loaf',
    title: 'Your loaf, built layer by layer.',
    copy: 'Fresh banana puree baked with your choice of 7 artisan crunches, Belgian chocolate, or dried fruit.',
    href: '/product/signature-banana-bread',
    cta: 'Build your loaf',
    video: '/uploads/assembly/banana-bread-final.mp4',
    fallback: '/uploads/aries11-bananabread-topping-mixed.webp',
  },
  {
    id: 'brownies',
    name: 'Brownie Boxes',
    kicker: 'Fudgy Squares',
    title: 'Fudgy squares, packed your way.',
    copy: 'Boxes of 4, 6, 9 or 16 fudgy brownie squares finished with Biscoff, Oreo, coconut, or melted chocolate.',
    href: '/product/brownie-box',
    cta: 'Build a brownie box',
    video: '/uploads/assembly/brownies-final.mp4',
    fallback: '/uploads/aries11-brownies-box-4.png',
  },
  {
    id: 'cake-parfait',
    name: 'Cake Parfait',
    kicker: 'Chilled Treat',
    title: 'Cake, cream, and one cool finish.',
    copy: 'Velvet chocolate or vanilla sponge layered with whipped cream and crunches, served ice-cold.',
    href: '/product/cake-parfait',
    cta: 'Choose your parfait',
    video: '/uploads/assembly/cake-parfait-final.mp4',
    fallback: '/uploads/aries11-caketreats-icecreamtwist-chocolate.png',
  },
  {
    id: 'pastries',
    name: 'Pastry Trays',
    kicker: 'Savoury Bakes',
    title: 'Golden pastries, gathered for the table.',
    copy: 'Flaky suya meat pies, spiced fish pies, and golden sausage rolls packed for sharing.',
    href: '/product/mixed-pastry-tray',
    cta: 'Choose a pastry tray',
    video: '/uploads/assembly/pastries-final.mp4',
    fallback: '/uploads/aries11-pastries-mixedtray-complete.webp',
  },
  {
    id: 'small-chops',
    name: 'Small Chops',
    kicker: 'Party Platter',
    title: 'A full party platter comes together.',
    copy: 'Freshly fried puff-puff, crispy beef samosas, and golden spring rolls arranged on platters.',
    href: '/product/small-chops-platter',
    cta: 'Choose a platter',
    video: '/uploads/assembly/small-chops-final.mp4',
    fallback: '/uploads/aries11-smallchops-platter-small.webp',
  },
];

function FloatingProductMedia({ product, active, allowVideo }) {
  const videoRef = useRef(null);
  const holdTimer = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    window.clearTimeout(holdTimer.current);
    if (active && allowVideo) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    return () => window.clearTimeout(holdTimer.current);
  }, [active, allowVideo]);

  const holdFinalFrame = () => {
    if (!active) return;
    holdTimer.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    }, 1400);
  };

  return (
    <div className="counter-scroller__stage" aria-hidden="true">
      <div className="counter-scroller__ambient-glow" />
      {allowVideo ? (
        <video
          ref={videoRef}
          src={product.video}
          poster={product.fallback}
          muted
          playsInline
          preload={active ? 'auto' : 'none'}
          onEnded={holdFinalFrame}
          className={`counter-scroller__floating-video${active ? ' is-active' : ''}`}
        />
      ) : (
        <Image
          src={product.fallback}
          alt={product.name}
          width={640}
          height={640}
          sizes="(max-width: 1023px) 90vw, 55vw"
          className="counter-scroller__floating-img"
        />
      )}
    </div>
  );
}

export default function CounterScroller() {
  const saveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState('hold');
  const targetRef = useRef(0);
  const transitionTimers = useRef([]);

  useEffect(() => () => transitionTimers.current.forEach(window.clearTimeout), []);

  function showSlide(index) {
    if (index === active && phase === 'hold') return;
    transitionTimers.current.forEach(window.clearTimeout);
    targetRef.current = index;
    if (reducedMotion) {
      setActive(index);
      setPhase('hold');
      return;
    }
    setPhase('exit');
    transitionTimers.current = [window.setTimeout(() => {
      setActive(index);
      setPhase('arrival');
      transitionTimers.current = [window.setTimeout(() => setPhase('hold'), 650)];
    }, 180)];
  }

  function handleNext() {
    showSlide((targetRef.current + 1) % SHOWCASE.length);
  }

  function handlePrev() {
    showSlide((targetRef.current - 1 + SHOWCASE.length) % SHOWCASE.length);
  }

  return (
    <section className="counter-scroller-section" aria-labelledby="assembly-title">
      <div className="container">
        {/* Section Header */}
        <div className="counter-scroller__heading">
          <div>
            <span className="page-kicker page-kicker--light">The Assembly Theatre</span>
            <h2 id="assembly-title">See every bake come together.</h2>
            <p>Handcrafted, configured by you, and baked fresh with 24 hours notice.</p>
          </div>

          {/* Modern Ambient Floating Controls */}
          <div className="counter-scroller__glass-controls">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous signature bake"
              className="counter-scroller__glass-btn"
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </button>

            {/* Pagination Capsule Dots */}
            <div className="counter-scroller__dots" role="tablist" aria-label="Signature bakes pagination">
              {SHOWCASE.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-label={`Go to ${item.name}`}
                  title={item.name}
                  aria-selected={idx === active}
                  onClick={() => showSlide(idx)}
                  className={`counter-scroller__dot${idx === active ? ' is-active' : ''}`}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next signature bake"
              className="counter-scroller__glass-btn"
            >
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* In-Place Animated Carousel Viewport */}
        <div className="counter-scroller__carousel-wrap">
          <motion.div
            className="counter-scroller__track"
            animate={{ x: `-${active * 100}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {SHOWCASE.map((product, index) => (
              <article
                key={product.id}
                className={`counter-scroller__card${index === active ? ` is-active is-${phase}` : ''}`}
                aria-hidden={index !== active}
              >
                <div className="counter-scroller__inner">
                  {/* Clean Frameless Media Stage */}
                  <FloatingProductMedia
                    product={product}
                    active={index === active}
                    allowVideo={!saveData && !reducedMotion}
                  />

                  {/* Refined Copy Panel */}
                  <div className="counter-scroller__copy">
                    <span className="counter-scroller__slide-kicker">{product.kicker}</span>
                    <h3>{product.title}</h3>
                    <p>{product.copy}</p>

                    <Link to={product.href} tabIndex={index === active ? undefined : -1} className="btn btn-primary counter-scroller__cta">
                      <span>{product.cta}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
