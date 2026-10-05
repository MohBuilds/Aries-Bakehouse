'use client';

import { useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'a11_intro_seen';

// Runs before first paint (inline), so a repeat visit in the same tab never
// flashes the loader: it only ever shows once per browser session.
const GUARD = `try{if(sessionStorage.getItem('${SEEN_KEY}'))document.documentElement.setAttribute('data-intro-seen','')}catch(e){}`;

const MIN_MS = 700; // long enough to read as intentional, never a flicker
const MAX_MS = 2600; // never hold the page hostage on a slow connection

// Branded curtain over the hero while the first frame and fonts settle, then
// it lifts. Rendered in the server HTML so it is on screen at first paint;
// pure CSS also lifts it after MAX_MS, so it can never get stuck if JS fails.
// Skipped entirely for reduced motion (CSS) and for repeat visits (guard).
export default function HeroLoader() {
  const ref = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    if (document.documentElement.hasAttribute('data-intro-seen')) {
      setGone(true);
      return undefined;
    }

    const started = performance.now();
    let finished = false;
    let removal;

    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add('is-done');
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* private mode: the loader just shows again next visit */
      }
      removal = window.setTimeout(() => setGone(true), 1100);
    };

    const heroImage = document.querySelector('[data-layer="hero"] img');
    const imageReady = new Promise((resolve) => {
      if (!heroImage || (heroImage.complete && heroImage.naturalWidth > 0)) resolve();
      else {
        heroImage.addEventListener('load', resolve, { once: true });
        heroImage.addEventListener('error', resolve, { once: true });
      }
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    const timeout = window.setTimeout(finish, MAX_MS);
    Promise.all([imageReady, fontsReady]).then(() => {
      window.setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - started)));
    });

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(removal);
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={ref} className="hero-loader" aria-hidden="true">
      <script dangerouslySetInnerHTML={{ __html: GUARD }} suppressHydrationWarning />
      <div className="hero-loader__mark">
        <img src="/uploads/Aries11_Primary_Dark.svg" alt="" width="681" height="344" decoding="async" fetchPriority="high" />
        <span className="hero-loader__line" />
      </div>
    </div>
  );
}
