'use client';

import { useEffect } from 'react';

let activeLenis = null;

// Programmatic scrolls must go through Lenis while it's running, otherwise
// its interpolated position fights the native jump.
export function scrollToY(y, { immediate = false } = {}) {
  if (activeLenis) {
    activeLenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.4 });
    return;
  }
  window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
}

// Smooth wheel scrolling for mouse/trackpad users only. Touch scrolling is
// already native-smooth, so phones never download Lenis or GSAP for this,
// and desktops load it after the page is idle rather than before first paint.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    let cancelled = false;
    let teardown = () => {};

    const start = async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
      });
      activeLenis = lenis;
      const update = () => ScrollTrigger.update();
      const raf = (time) => lenis.raf(time * 1000);
      lenis.on('scroll', update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      teardown = () => {
        lenis.off('scroll', update);
        gsap.ticker.remove(raf);
        lenis.destroy();
        activeLenis = null;
      };
    };

    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 300);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      teardown();
    };
  }, []);

  return null;
}
