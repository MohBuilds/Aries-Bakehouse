'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

const SHOWCASE = [
  { id: 'banana-bread', name: 'Banana Bread', title: 'Your loaf, built layer by layer', copy: 'Choose your loaf size, then finish it with Biscoff, Oreo, coconut, raisins, nut crunch or chocolate.', href: '/product/signature-banana-bread', cta: 'Build your loaf', frames: ['/uploads/assembly/banana-bread-01.png', '/uploads/assembly/banana-bread-02.png'], video: '/uploads/assembly/banana-bread-final.mp4', fallback: '/uploads/aries11-bananabread-topping-mixed.webp' },
  { id: 'brownies', name: 'Brownie Boxes', title: 'Fudgy squares, packed your way', copy: 'Pick a box of 4, 6, 9 or 16 and finish it in Biscoff, Oreo, coconut crunch, white or dark chocolate.', href: '/product/brownie-box', cta: 'Build a brownie box', frames: ['/uploads/assembly/brownies-01.png', '/uploads/assembly/brownies-02.png'], video: '/uploads/assembly/brownies-final.mp4', fallback: '/uploads/aries11-brownies-box-4.png' },
  { id: 'cake-parfait', name: 'Cake Parfait', title: 'Cake, cream, and one cool finish', copy: 'Chocolate or red velvet cake layered with cream, made to order in two sizes.', href: '/product/cake-parfait', cta: 'Choose your parfait', frames: ['/uploads/assembly/cake-parfait-01.png', '/uploads/assembly/cake-parfait-02.png'], video: '/uploads/assembly/cake-parfait-final.mp4', fallback: '/uploads/aries11-caketreats-parfait-chocolate.png' },
  { id: 'pastries', name: 'Pastry Trays', title: 'Golden pastries, gathered for the table', copy: 'Suya pie, fish pie and sausage rolls packed as a mixed tray or a full tray of your favourite.', href: '/product/mixed-pastry-tray', cta: 'Choose your pastries', frames: ['/uploads/assembly/pastries-01.png', '/uploads/assembly/pastries-02.png'], video: '/uploads/assembly/pastries-final.mp4', fallback: '/uploads/aries11-pastries-mixedtray-complete.webp' },
  { id: 'small-chops', name: 'Small Chops', title: 'A full party platter comes together', copy: 'Puff-puff, samosas, spring rolls and more, arranged fresh for sharing.', href: '/product/small-chops-platter', cta: 'Choose a platter', frames: [], video: '/uploads/assembly/small-chops-final.mp4', fallback: '/uploads/aries11-smallchops-platter-large.webp' },
];

const RAIL_TIMES = SHOWCASE.flatMap((_, index) => {
  const start = index / SHOWCASE.length;
  const end = (index + 1) / SHOWCASE.length;
  return index === SHOWCASE.length - 1 ? [start, 1] : [start, start + (end - start) * 0.68];
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

function AssemblyMedia({ product, active, step, allowVideo }) {
  const videoRef = useRef(null);
  const showFinal = step === 2 || product.frames.length === 0;
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && showFinal && allowVideo) video.play().catch(() => {});
    else video.pause();
  }, [active, allowVideo, showFinal]);

  return (
    <div className="counter-scroller__stage" aria-hidden="true">
      <span className="counter-scroller__ghost-name">{product.name}</span>
      {product.frames.map((frame, index) => (
        <img key={frame} src={frame} alt="" loading={active ? 'eager' : 'lazy'} decoding="async" className={step === index ? 'is-visible' : ''} />
      ))}
      {!allowVideo && showFinal && <img src={product.fallback} alt="" className="is-visible" />}
      <video ref={videoRef} src={product.video} muted loop playsInline preload={active ? 'auto' : 'metadata'} className={allowVideo && showFinal ? 'is-visible' : ''} />
      <span className="counter-scroller__stage-label">
        {product.frames.length === 0 || step === 2 ? 'Freshly assembled' : `Assembly ${step + 1} of 2`}
      </span>
    </div>
  );
}

export default function CounterScroller() {
  const trackRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const saveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData);
  const progress = useManualScrollProgress(trackRef);
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const railX = useTransform(progress, RAIL_TIMES, RAIL_POSITIONS);
  const progressScale = useTransform(progress, [0, 1], [0, 1]);

  useMotionValueEvent(progress, 'change', (value) => {
    const scaled = Math.min(SHOWCASE.length - 0.001, value * SHOWCASE.length);
    const nextActive = Math.floor(scaled);
    const local = scaled - nextActive;
    setActive((current) => (current === nextActive ? current : nextActive));
    setStep(local < 0.23 ? 0 : local < 0.46 ? 1 : 2);
  });

  if (reduceMotion) {
    return (
      <section className="container counter-scroller counter-scroller--static" aria-labelledby="assembly-title">
        <h2 id="assembly-title">See every bake come together</h2>
        <p className="counter-scroller__intro">Made to order, from the first layer to the final box.</p>
        <div className="counter-scroller__static-grid">
          {SHOWCASE.map((product) => (
            <Link key={product.id} to={product.href} className="counter-scroller__static-card">
              <img src={product.fallback} alt={`${product.name} from Aries 11 Bakehouse`} loading="lazy" decoding="async" />
              <strong>{product.name}</strong><span>{product.copy}</span>
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
          <h2 id="assembly-title">See every bake come together</h2>
          <p>Scroll to assemble the counter, one made-to-order favourite at a time.</p>
        </div>
        <motion.div className="counter-scroller__rail" style={{ x: railX, width: `${SHOWCASE.length * 100}%` }}>
          {SHOWCASE.map((product, index) => (
            <article key={product.id} className="counter-scroller__slide" style={{ width: `${100 / SHOWCASE.length}%` }}>
              <div className="container counter-scroller__inner">
                <AssemblyMedia product={product} active={index === active} step={index === active ? step : 0} allowVideo={!saveData} />
                <div className="counter-scroller__copy">
                  <span className="counter-scroller__count">{String(index + 1).padStart(2, '0')} / {String(SHOWCASE.length).padStart(2, '0')}</span>
                  <h3>{product.title}</h3><p>{product.copy}</p>
                  <Link to={product.href} className="btn btn-primary">{product.cta}</Link>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
        <div className="container counter-scroller__progress" aria-hidden="true">
          <motion.span style={{ scaleX: progressScale }} />
        </div>
      </div>
    </section>
  );
}
