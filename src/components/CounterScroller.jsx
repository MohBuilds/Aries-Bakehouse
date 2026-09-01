'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const SHOWCASE = [
  {
    id: 'banana-bread',
    name: 'Banana Bread',
    kicker: 'The Signature Loaf',
    title: 'Your loaf, built layer by layer',
    copy: 'Choose your loaf size, then finish it with Biscoff, Oreo, toasted coconut, raisins, walnut crunch, or melted Belgian chocolate.',
    href: '/product/signature-banana-bread',
    cta: 'Build your loaf',
    tags: ['Fresh Banana Puree', '7 Crunch Toppings', 'Mini or Standard'],
    video: '/uploads/assembly/banana-bread-final.mp4',
    fallback: '/uploads/aries11-bananabread-topping-mixed.webp',
  },
  {
    id: 'brownies',
    name: 'Brownie Boxes',
    kicker: 'Rich Fudgy Squares',
    title: 'Fudgy squares, packed your way',
    copy: 'Choose a box of 4, 6, 9, or 16 fudgy squares. Customized with Biscoff swirl, crushed Oreo, coconut flakes, or white & dark chocolate.',
    href: '/product/brownie-box',
    cta: 'Build a brownie box',
    tags: ['Pure Dark Cocoa', 'Custom Box Sizes', 'Topping Swirls'],
    video: '/uploads/assembly/brownies-final.mp4',
    fallback: '/uploads/aries11-brownies-box-4.png',
  },
  {
    id: 'cake-parfait',
    name: 'Cake Parfait',
    kicker: 'Layered Chilled Treat',
    title: 'Cake, cream, and one cool finish',
    copy: 'Decadent chocolate or red velvet sponge layered with silky whipped cream and crunches, made fresh to order in two individual sizes.',
    href: '/product/cake-parfait',
    cta: 'Choose your parfait',
    tags: ['Moist Velvet Sponge', 'Silky Cream Layers', 'Served Chilled'],
    video: '/uploads/assembly/cake-parfait-final.mp4',
    fallback: '/uploads/aries11-caketreats-parfait-chocolate.png',
  },
  {
    id: 'pastries',
    name: 'Pastry Trays',
    kicker: 'Savoury Golden Bakes',
    title: 'Golden pastries, gathered for the table',
    copy: 'Suya meat pie, spiced fish pie, and flaky sausage rolls packed as a mixed sharing tray or a full tray of your absolute favourite.',
    href: '/product/mixed-pastry-tray',
    cta: 'Choose your pastries',
    tags: ['Flaky Butter Crust', 'Suya Spiced Beef', 'Party Sharing Trays'],
    video: '/uploads/assembly/pastries-final.mp4',
    fallback: '/uploads/aries11-pastries-mixedtray-complete.webp',
  },
  {
    id: 'small-chops',
    name: 'Small Chops',
    kicker: 'Abeokuta Party Platter',
    title: 'A full party platter comes together',
    copy: 'Freshly fried puff-puff, crispy beef samosas, golden spring rolls, and peppered bites, arranged fresh on a platter for your gathering.',
    href: '/product/small-chops-platter',
    cta: 'Choose a platter',
    tags: ['Hot Crispy Bites', 'Platter Arrangements', 'Celebration Ready'],
    video: '/uploads/assembly/small-chops-final.mp4',
    fallback: '/uploads/aries11-smallchops-platter-large.webp',
  },
];

const RAIL_TIMES = SHOWCASE.flatMap((_, index) => {
  const start = index / SHOWCASE.length;
  const end = (index + 1) / SHOWCASE.length;
  return index === SHOWCASE.length - 1 ? [start, 1] : [start, start + (end - start) * 0.75];
});

const RAIL_POSITIONS = SHOWCASE.flatMap((_, index) => {
  const position = `-${(index / SHOWCASE.length) * 100}%`;
  return [position, position];
});

function useManualScrollProgress(trackRef) {
  const progress = useMotionValue(0);
  useEffect(() => {
    const element = trackRef.current;
    if (!element) return undefined;
    let animationFrame = null;
    const update = () => {
      animationFrame = null;
      const rect = element.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      progress.set(distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0);
    };
    const requestUpdate = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [progress, trackRef]);
  return progress;
}

function FloatingProductMedia({ product, active, allowVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && allowVideo) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, allowVideo]);

  return (
    <div className="counter-scroller__stage counter-scroller__stage--frameless" aria-hidden="true">
      <div className="counter-scroller__ambient-glow" />
      <span className="counter-scroller__ghost-name">{product.name}</span>
      
      {/* Floating Product Render / Video */}
      {allowVideo ? (
        <video
          ref={videoRef}
          src={product.video}
          muted
          loop
          playsInline
          preload={active ? 'auto' : 'metadata'}
          className={`counter-scroller__floating-video${active ? ' is-active' : ''}`}
        />
      ) : (
        <img
          src={product.fallback}
          alt={product.name}
          className="counter-scroller__floating-img"
        />
      )}
      
      <div className="counter-scroller__stage-badge">
        <Sparkles size={13} aria-hidden="true" />
        <span>Made to order</span>
      </div>
    </div>
  );
}

export default function CounterScroller() {
  const trackRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const saveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData);
  const progress = useManualScrollProgress(trackRef);
  const [active, setActive] = useState(0);
  const railX = useTransform(progress, RAIL_TIMES, RAIL_POSITIONS);
  const progressScale = useTransform(progress, [0, 1], [0, 1]);

  useMotionValueEvent(progress, 'change', (value) => {
    const scaled = Math.min(SHOWCASE.length - 0.001, value * SHOWCASE.length);
    const nextActive = Math.floor(scaled);
    setActive((current) => (current === nextActive ? current : nextActive));
  });

  if (reduceMotion) {
    return (
      <section className="container counter-scroller counter-scroller--static" aria-labelledby="assembly-title">
        <span className="page-kicker page-kicker--light">The Assembly Theatre</span>
        <h2 id="assembly-title">See every bake come together</h2>
        <p className="counter-scroller__intro">Made to order in Abeokuta, from the first layer to the final box.</p>
        <div className="counter-scroller__static-grid">
          {SHOWCASE.map((product) => (
            <Link key={product.id} to={product.href} className="counter-scroller__static-card">
              <img src={product.fallback} alt={`${product.name} from Aries 11 Bakehouse`} loading="lazy" decoding="async" />
              <strong>{product.name}</strong>
              <span>{product.copy}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={trackRef} className="counter-scroller" aria-labelledby="assembly-title">
      <div className="counter-scroller__viewport">
        <div className="container counter-scroller__heading">
          <span className="page-kicker page-kicker--light">The Assembly Theatre</span>
          <h2 id="assembly-title">See every bake come together.</h2>
          <p>Handcrafted, configured by you, and baked fresh for your moment.</p>
        </div>

        <motion.div className="counter-scroller__rail" style={{ x: railX, width: `${SHOWCASE.length * 100}%` }}>
          {SHOWCASE.map((product, index) => (
            <article key={product.id} className="counter-scroller__slide" style={{ width: `${100 / SHOWCASE.length}%` }}>
              <div className="container counter-scroller__inner">
                {/* 1. Frameless Floating Media Stage */}
                <FloatingProductMedia
                  product={product}
                  active={index === active}
                  allowVideo={!saveData}
                />

                {/* 2. Editorial Story & Configuration Tags */}
                <div className="counter-scroller__copy">
                  <span className="counter-scroller__count">
                    {String(index + 1).padStart(2, '0')} / {String(SHOWCASE.length).padStart(2, '0')}
                  </span>
                  <span className="counter-scroller__slide-kicker">{product.kicker}</span>
                  <h3>{product.title}</h3>
                  <p>{product.copy}</p>

                  <div className="counter-scroller__tags" aria-label="Bake features">
                    {product.tags.map((tag) => (
                      <span key={tag} className="counter-scroller__tag">{tag}</span>
                    ))}
                  </div>

                  <Link to={product.href} className="btn btn-primary counter-scroller__cta">
                    <span>{product.cta}</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </motion.div>

        {/* Bottom Horizontal Progress Bar */}
        <div className="container counter-scroller__progress" aria-hidden="true">
          <motion.span style={{ scaleX: progressScale }} />
        </div>
      </div>
    </section>
  );
}
