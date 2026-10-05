'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtNaira } from '../../lib/format.js';
import { scrollToY } from '../SmoothScroll.jsx';
import { prefersStatic, useFrameSequences, whenIntent } from './filmUtils.js';
import { BB_PRODUCT_HREF, BB_WHATSAPP_URL, FINISHES, MACROS, SEQUENCES, SIZE_TAGS, T, still } from './bananaData.js';

const HERO_ALT = 'A freshly baked Aries 11 banana bread loaf with a cracked golden dome, steam rising from the top';
const FINISH_ALT = {
  plain: 'Plain banana bread loaf',
  oreo: 'Banana bread topped with Oreo cookies',
  doublechoc: 'Double chocolate banana bread covered in chocolate chips',
  coconut: 'Banana bread topped with toasted coconut flakes',
  nuts: 'Banana bread with a nuts crunch topping',
  biscoff: 'Banana bread with a Biscoff crumb topping',
  mixed: 'Banana bread with mixed toppings: Oreo, chocolate chips, coconut and more',
};

function usePricing(sizes) {
  const list = Array.isArray(sizes) ? sizes.filter((s) => s.price != null) : [];
  const byId = Object.fromEntries(list.map((s) => [s.id, s]));
  const mixable = list.find((s) => s.mixedPrice != null);
  const mixExtra = mixable ? mixable.mixedPrice - mixable.price : null;
  const mini = byId.mini;
  return {
    byId,
    mixExtra: mixExtra > 0 ? mixExtra : null,
    miniMin: mini?.minQty > 1 ? mini.minQty : null,
    line: list.length ? list.map((s) => `${s.label} ${fmtNaira(s.price)}`).join(' · ') : null,
  };
}

export default function BananaFilm({ sizes = null }) {
  const rootRef = useRef(null);
  const [mode, setMode] = useState('cinematic');
  const [deferred, setDeferred] = useState(false);
  // Which frame sequences to fetch: each unlocks as its scene approaches.
  const [reach, setReach] = useState(0);
  const pricing = usePricing(sizes);
  const wanted = mode === 'cinematic' && deferred ? ['explode', 'drop', 'orbit'].slice(0, reach + 1) : [];
  const { states, draw, canvasRef } = useFrameSequences(SEQUENCES, wanted);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMode(prefersStatic() ? 'static' : 'cinematic');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (mode !== 'cinematic') return undefined;
    return whenIntent(() => setDeferred(true));
  }, [mode]);

  // ------------------------------------------------------------ the film
  // Built on first intent, not on load: the hero frame is already composed
  // in CSS, so this keeps ~150 tweens out of hydration on slow phones.
  useEffect(() => {
    if (mode !== 'cinematic' || !deferred) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    let ctx;
    let cancelled = false;

    // GSAP is fetched here, on first intent, so it never weighs on first paint.
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      const q = gsap.utils.selector(root);
      const vw = () => window.innerWidth;
      const vh = () => window.innerHeight;
      const desktop = () => vw() >= 1024;

      ctx = gsap.context(() => {
        const rig = q('.bb-rig');
        const layer = (name) => q(`[data-layer="${name}"]`);
        const seq = (name) => q(`[data-seq="${name}"]`);
        const copy = (name) => q(`[data-copy="${name}"]`);
        const bars = q('.film__letterbox');
        const flash = q('.film__flash');
        const macros = q('.film__macro');
        const items = q('.bb-finishes__item');
        const callouts = q('.film__callout');
        const tags = q('.bb-size-tag__inner');

        const pose = {
          hero: () => (desktop() ? { x: vw() * 0.12, y: 0, scale: 1 } : { x: 0, y: 0, scale: 1 }),
          cut: () => (desktop() ? { x: 0, y: -vh() * 0.08, scale: 1 } : { x: 0, y: 0, scale: 1.08 }),
          explode: () => (desktop() ? { x: 0, y: vh() * 0.05, scale: 0.86 } : { x: 0, y: 0, scale: 0.6 }),
          finishes: () => (desktop() ? { x: vw() * 0.14, y: 0, scale: 0.96 } : { x: 0, y: 0, scale: 0.94 }),
          sizes: () => (desktop() ? { x: 0, y: -vh() * 0.12, scale: 0.8 } : { x: 0, y: 0, scale: 0.5 }),
          orbit: () => (desktop() ? { x: -vw() * 0.09, y: 0, scale: 1 } : { x: 0, y: 0, scale: 0.96 }),
          final: () => (desktop() ? { x: -vw() * 0.21, y: 0, scale: 0.86 } : { x: 0, y: -vh() * 0.07, scale: 0.8 }),
        };
        const moveTo = (name, at, duration, ease = 'power2.inOut') => {
          tl.to(
            rig,
            {
              x: () => pose[name]().x,
              y: () => pose[name]().y,
              scale: () => pose[name]().scale,
              duration,
              ease,
            },
            at,
          );
        };
        const inOut = (name, start, end) => {
          tl.to(copy(name), { opacity: 1, y: 0, duration: 2.2, ease: 'power2.out' }, start);
          tl.to(copy(name), { opacity: 0, y: -26, duration: 1.8, ease: 'power2.in' }, end);
        };
        const swap = (from, to, at, duration = 1.2) => {
          tl.to(to, { autoAlpha: 1, duration, ease: 'power1.inOut' }, at);
          tl.to(from, { autoAlpha: 0, duration: 0.01 }, at + duration);
        };
        const scrub = (name, start, end) => {
          tl.to(
            states[name],
            {
              value: SEQUENCES[name].count - 1,
              duration: end - start,
              ease: 'none',
              onUpdate: () => draw(name),
            },
            start,
          );
        };

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const time = self.progress * T.TOTAL;
              root.toggleAttribute('data-hero-off', time >= 3);
              root.toggleAttribute('data-final-live', time > T.TOTAL - 6);
              const needed = time > T.sizesStart - 25 ? 2 : time > T.dropStart - 28 ? 1 : 0;
              setReach((current) => Math.max(current, needed));
            },
          },
        });

        // 01 · Open → the cut. Camera pushes in; a blade of light slices it.
        tl.fromTo(
          rig,
          { x: () => pose.hero().x, y: () => pose.hero().y, scale: () => pose.hero().scale },
          { x: () => pose.cut().x, y: () => pose.cut().y, scale: () => pose.cut().scale, duration: 10, ease: 'power2.inOut' },
          1,
        );
        tl.to(q('.film__cue'), { opacity: 0, duration: 1.2 }, 0.2);
        tl.to(copy('hero'), { opacity: 0, y: -48, duration: 4.5, ease: 'power2.in' }, 1.2);
        tl.fromTo(
          q('.bb-blade'),
          { xPercent: -130, opacity: 0 },
          { xPercent: 130, opacity: 1, duration: 3.2, ease: 'power2.inOut' },
          T.slicedAt - 1.6,
        );
        tl.to(q('.bb-blade'), { opacity: 0, duration: 0.8 }, T.slicedAt + 1.4);
        swap(layer('hero'), layer('sliced'), T.slicedAt, 1);

        // 02 · Sliced: the loaf comes apart, slice by slice.
        inOut('cut', T.slicedAt + 1.5, T.explodeStart + 2.5);
        moveTo('explode', T.explodeStart - 1, 5);
        swap(layer('sliced'), seq('explode'), T.explodeStart, 1.4);
        scrub('explode', T.explodeStart + 0.6, T.explodeEnd);
        tl.to(bars, { scaleY: 1, duration: 5, ease: 'power2.inOut' }, T.explodeStart);

        // 03 · Up close: two macro shots with a slow push.
        tl.to(rig, { autoAlpha: 0, duration: 1.5 }, T.macroStart + 0.5);
        MACROS.forEach((macro, i) => {
          const start = T.macroStart + i * T.macroBeat;
          const dir = i % 2 ? -1 : 1;
          tl.to(macros[i], { autoAlpha: 1, duration: 1.6, ease: 'power1.inOut' }, start);
          tl.fromTo(
            q(`.film__macro[data-id="${macro.id}"] img`),
            { scale: 1.28, xPercent: dir * 2 },
            { scale: 1.04, xPercent: -dir * 2, duration: T.macroBeat + 2, ease: 'none' },
            start,
          );
          tl.to(copy(`macro-${macro.id}`), { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out' }, start + 0.9);
          tl.to(copy(`macro-${macro.id}`), { opacity: 0, y: -20, duration: 1.2, ease: 'power2.in' }, start + T.macroBeat - 1.2);
        });
        tl.to(macros, { autoAlpha: 0, duration: 1.8 }, T.finishesStart - 1);
        tl.to(bars, { scaleY: 0, duration: 4, ease: 'power2.inOut' }, T.finishesStart - 1.5);

        // 04 · Toppings: the same loaf, re-finished on every step of scroll.
        tl.set(seq('explode'), { autoAlpha: 0 }, T.finishesStart - 1);
        tl.set(layer('plain'), { autoAlpha: 1 }, T.finishesStart - 1);
        tl.set(
          rig,
          { x: () => pose.finishes().x, y: () => pose.finishes().y, scale: () => pose.finishes().scale * 1.06 },
          T.finishesStart - 1,
        );
        tl.to(rig, { autoAlpha: 1, scale: () => pose.finishes().scale, duration: 2.4, ease: 'power2.out' }, T.finishesStart - 0.8);
        tl.to(copy('finishes'), { opacity: 1, y: 0, duration: 2.2, ease: 'power2.out' }, T.finishesStart);
        tl.to(items[0], { opacity: 1, duration: 0.8 }, T.finishesStart + 0.5);

        // Plain → Oreo is the real drop footage (a cut to a closer camera).
        tl.to(flash, { opacity: 0.35, duration: 0.6, ease: 'power2.in' }, T.dropStart - 0.4);
        tl.to(flash, { opacity: 0, duration: 1.4, ease: 'power2.out' }, T.dropStart + 0.2);
        swap(layer('plain'), seq('drop'), T.dropStart, 0.6);
        scrub('drop', T.dropStart + 0.3, T.dropEnd);
        swap(seq('drop'), layer('oreo'), T.dropEnd, 1);
        tl.to(items[0], { opacity: 0.42, duration: 0.8 }, T.dropStart + 1);
        tl.to(items[1], { opacity: 1, duration: 0.8 }, T.dropStart + 1);

        const order = FINISHES.map((f) => f.id);
        for (let i = 2; i < order.length; i += 1) {
          const at = T.dropEnd + 2 + (i - 2) * T.toppingStep;
          swap(layer(order[i - 1]), layer(order[i]), at, 1.1);
          tl.to(items[i - 1], { opacity: 0.42, duration: 0.8 }, at);
          tl.to(items[i], { opacity: 1, duration: 0.8 }, at);
          tl.fromTo(rig, { rotation: 0 }, { rotation: i % 2 ? 0.6 : -0.6, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, at);
        }
        const mixedAt = T.dropEnd + 2 + (order.length - 3) * T.toppingStep;
        tl.to(copy('mixed'), { opacity: 1, y: 0, duration: 1.6, ease: 'power2.out' }, mixedAt + 0.6);
        tl.to([copy('finishes'), copy('mixed')], { opacity: 0, y: -24, duration: 1.8, ease: 'power2.in' }, T.sizesStart - 2);

        // 05 · Sizes: three loaves, live prices.
        moveTo('sizes', T.sizesStart - 1.5, 3);
        swap(layer('mixed'), layer('sizes'), T.sizesStart - 1, 1.4);
        inOut('sizes', T.sizesStart + 0.8, T.orbitStart - 2.5);
        tl.to(tags, { opacity: 1, y: 0, duration: 1.4, stagger: 0.5, ease: 'power2.out' }, T.sizesStart + 1.6);
        tl.to(tags, { opacity: 0, duration: 1.2 }, T.orbitStart - 2.5);

        // 06 · Every angle: the mixed loaf turns under a fixed key light.
        moveTo('orbit', T.orbitStart - 1.5, 3);
        swap(layer('sizes'), seq('orbit'), T.orbitStart - 0.8, 1.4);
        scrub('orbit', T.orbitStart, T.orbitEnd);
        callouts.forEach((callout, i) => {
          const start = T.orbitStart + 1.2 + i * 4.2;
          tl.to(callout, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, start);
          tl.to(callout, { autoAlpha: 0, y: -16, duration: 1, ease: 'power2.in' }, start + 3);
        });

        // 07 · Order.
        moveTo('final', T.finalStart, 5);
        swap(seq('orbit'), layer('final'), T.finalStart, 1.6);
        tl.to(copy('final'), { opacity: 1, y: 0, duration: 4, ease: 'power3.out' }, T.finalStart + 2);
        tl.to({}, { duration: 0.01 }, T.TOTAL - 0.01);
      }, root);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [mode, deferred, states, draw]);

  // Film time <-> page scroll, measured from the section itself so it works
  // before the timeline exists (it's built on first intent).
  const filmRange = () => {
    const root = rootRef.current;
    if (!root) return null;
    const start = root.getBoundingClientRect().top + window.scrollY;
    return { start, length: root.offsetHeight - window.innerHeight };
  };

  const scrollToTime = (time, immediate = false) => {
    const range = filmRange();
    if (!range) return;
    scrollToY(range.start + (Math.min(time, T.TOTAL) / T.TOTAL) * range.length, { immediate });
  };

  const skipFilm = (event) => {
    const target = document.getElementById('after-film');
    if (!target) return;
    event.preventDefault();
    scrollToY(target.getBoundingClientRect().top + window.scrollY - 72, { immediate: true });
    target.focus({ preventScroll: true });
  };

  const handleFocus = (event) => {
    const scene = event.target.closest('[data-at]');
    const range = filmRange();
    if (!scene || !range) return;
    const time = ((window.scrollY - range.start) / range.length) * T.TOTAL;
    const at = Number(scene.dataset.at);
    if (Math.abs(time - at) > 4) scrollToTime(at, true);
  };

  const lazy = (name) => (deferred ? still(name) : {});

  return (
    <div className="film-switch" data-mode={mode}>
      {mode === 'cinematic' && (
        <section
          id="home-film"
          data-film
          ref={rootRef}
          className="film film--bb"
          aria-labelledby="bb-film-title"
          style={{ '--film-length': T.TOTAL }}
          onFocus={handleFocus}
        >
          <div className="film__stage">
            <div className="film__backdrop" aria-hidden="true" />

            <div className="bb-rig">
              <div className="bb-frame">
                <div className="bb-glow" aria-hidden="true" />
                <div className="bb-layer bb-square bb-layer--on" data-layer="hero">
                  <Image src={still('hero').src} alt={HERO_ALT} fill priority sizes="(min-width: 1024px) 100vh, 98vw" />
                </div>
                <div className="bb-layer bb-square" data-layer="sliced" aria-hidden="true">
                  <img {...lazy('sliced')} sizes="(min-width: 1024px) 100vh, 98vw" alt="" decoding="async" />
                </div>
                <canvas ref={canvasRef('explode')} data-seq="explode" className="bb-layer bb-full" aria-hidden="true" />
                {FINISHES.map((finish) => (
                  <div key={finish.id} className="bb-layer bb-square" data-layer={finish.id}>
                    <img {...lazy(finish.id)} sizes="(min-width: 1024px) 100vh, 98vw" alt={FINISH_ALT[finish.id]} decoding="async" />
                  </div>
                ))}
                <canvas ref={canvasRef('drop')} data-seq="drop" className="bb-layer bb-full" aria-hidden="true" />
                <div className="bb-layer bb-wide" data-layer="sizes">
                  <img
                    src={deferred ? '/uploads/film-bb/sizes.webp' : undefined}
                    srcSet={deferred ? '/uploads/film-bb/sizes-900.webp 900w, /uploads/film-bb/sizes.webp 1774w' : undefined}
                    sizes="(min-width: 1024px) 100vw, 172vw"
                    alt="Mini, medium and large banana bread loaves side by side"
                    decoding="async"
                  />
                </div>
                <canvas ref={canvasRef('orbit')} data-seq="orbit" className="bb-layer bb-square" aria-hidden="true" />
                <div className="bb-layer bb-square" data-layer="final" aria-hidden="true">
                  <img {...lazy('mixed')} sizes="(min-width: 1024px) 100vh, 98vw" alt="" decoding="async" />
                </div>
                <div className="bb-blade" aria-hidden="true" />
              </div>
              {/* Same box as the frame but unmasked, so labels stay crisp. */}
              <div className="bb-frame-overlay">
                <div className="bb-wide bb-wide--tags">
                  {SIZE_TAGS.map((tag) => {
                    const size = pricing.byId[tag.id];
                    if (!size) return null;
                    return (
                      <p key={tag.id} className="bb-size-tag" style={{ left: `${tag.x}%` }}>
                        <span className="bb-size-tag__inner">
                          <strong>{size.label}</strong>
                          <span>{fmtNaira(size.price)}</span>
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="film__macros">
              {MACROS.map((macro) => (
                <figure key={macro.id} className="film__macro" data-id={macro.id}>
                  <img {...lazy(macro.id)} sizes="100vw" alt={`Close-up of the banana bread ${macro.id}`} decoding="async" />
                  <figcaption className="film__copy film__copy--macro" data-copy={`macro-${macro.id}`}>
                    <h3>{macro.title}</h3>
                    <p>{macro.line}</p>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="film__scrim" aria-hidden="true" />
            <div className="film__letterbox film__letterbox--top" aria-hidden="true" />
            <div className="film__letterbox film__letterbox--bottom" aria-hidden="true" />
            <div className="film__flash" aria-hidden="true" />
            <div className="film__grain" aria-hidden="true" />

            <div className="film__copy film__copy--hero" data-copy="hero" data-at="0">
              <p className="film__kicker">Made to order in Abeokuta</p>
              <h1 id="bb-film-title">
                Baked for
                <br />
                <em>the moment.</em>
              </h1>
              <p className="film__lede">
                Ripe banana, brown butter and the topping you choose. Baked fresh for your order with 24 hours&rsquo; notice.
              </p>
              <div className="film__actions">
                <Link to={BB_PRODUCT_HREF} className="btn film__btn-primary">
                  <span>Build your loaf</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/menu" className="film__btn-text">
                  See the full menu
                </Link>
              </div>
            </div>

            <div className="film__cue" aria-hidden="true">
              <span>Scroll to slice</span>
              <i />
            </div>

            <div className="film__copy film__copy--center" data-copy="cut">
              <p className="film__kicker">Ripe banana · Brown butter</p>
              <h2>Good all the way through.</h2>
              <p>Every loaf is baked to order, so it reaches you fresh, not from a shelf.</p>
            </div>

            <div className="film__copy film__copy--side bb-finishes" data-copy="finishes">
              <p className="film__kicker">Toppings</p>
              <h2>One loaf. Your finish.</h2>
              <ol className="bb-finishes__list">
                {FINISHES.map((finish, i) => (
                  <li key={finish.id} className="bb-finishes__item">
                    <span className="bb-finishes__index">{String(i + 1).padStart(2, '0')}</span>
                    {finish.label}
                  </li>
                ))}
              </ol>
              <p className="bb-finishes__note">Raisins are on the menu too.</p>
              <p className="bb-mixed-note" data-copy="mixed">
                {pricing.mixExtra
                  ? `Can't choose? Mix toppings on a medium or large loaf for +${fmtNaira(pricing.mixExtra)}.`
                  : "Can't choose? Mix toppings on a medium or large loaf."}
              </p>
            </div>

            <div className="film__copy film__copy--center bb-sizes-copy" data-copy="sizes">
              <p className="film__kicker">Three sizes</p>
              <h2>A treat for one, or the whole table.</h2>
              {pricing.miniMin && <p>Minis are ordered in fours or more. Medium and large are made to share.</p>}
            </div>
            <dl className="film__callouts">
              <div className="film__callout">
                <dt>Toppings, or mix them</dt>
                <dd>7</dd>
              </div>
              <div className="film__callout">
                <dt>Mini, medium and large</dt>
                <dd>3 sizes</dd>
              </div>
              <div className="film__callout">
                <dt>Notice, then pickup or delivery in Abeokuta</dt>
                <dd>24 hours</dd>
              </div>
            </dl>

            <div className="film__copy film__copy--final" data-copy="final" data-at={T.TOTAL}>
              <p className="film__kicker">Banana Bread</p>
              <h2>Build your loaf.</h2>
              <p>Pick a size and a topping, or mix them. We bake it fresh for your day.</p>
              {pricing.line && <p className="film__price">{pricing.line}</p>}
              <div className="film__actions">
                <Link to={BB_PRODUCT_HREF} className="btn film__btn-primary">
                  <span>Build your loaf</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <a href={BB_WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn-whatsapp film__btn-whatsapp">
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="film__hud">
              <a href="#after-film" className="skip-link film__skip-link" onClick={skipFilm}>
                Skip the film
              </a>
            </div>
          </div>
        </section>
      )}
      {mode === 'cinematic' && <div className="film-end" aria-hidden="true" />}

      <BananaStatic pricing={pricing} />
      <div id="after-film" tabIndex={-1} />
    </div>
  );
}

// Reduced-motion / low-power version: the same story, stacked and still.
function BananaStatic({ pricing }) {
  return (
    <section className="film-static" aria-labelledby="bb-static-title">
      <div className="film-static__band">
        <div className="container film-static__hero">
          <div className="film-static__copy">
            <p className="film__kicker">Made to order in Abeokuta</p>
            <h1 id="bb-static-title">
              Baked for <em>the moment.</em>
            </h1>
            <p className="film__lede">
              Ripe banana, brown butter and the topping you choose. Baked fresh for your order with 24 hours&rsquo; notice.
            </p>
            <div className="film__actions">
              <Link to={BB_PRODUCT_HREF} className="btn film__btn-primary">
                <span>Build your loaf</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/menu" className="film__btn-text">
                See the full menu
              </Link>
            </div>
          </div>
          <div className="film-static__media">
            <Image src={still('hero').src} alt={HERO_ALT} fill sizes="(min-width: 1024px) 46vw, 92vw" />
          </div>
        </div>
      </div>

      <div className="container film-static__finishes">
        <h2>One loaf. Your finish.</h2>
        <p>Seven toppings, raisins included. Can&rsquo;t choose? Mix them on a medium or large loaf.</p>
        <ul className="film-static__grid--bb">
          {FINISHES.filter((f) => f.id !== 'plain').map((finish) => (
            <li key={finish.id}>
              <img src={`/uploads/film-bb/${finish.id}-720.webp`} alt={FINISH_ALT[finish.id]} loading="lazy" decoding="async" />
              <h3>{finish.label}</h3>
            </li>
          ))}
        </ul>
      </div>

      <div className="container film-static__final">
        <h2>Build your loaf.</h2>
        {pricing.line && <p className="film__price">{pricing.line}</p>}
        <div className="film__actions">
          <Link to={BB_PRODUCT_HREF} className="btn film__btn-primary">
            <span>Build your loaf</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <a href={BB_WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn btn-whatsapp film__btn-whatsapp">
            <MessageCircle size={15} aria-hidden="true" />
            <span>Order on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
