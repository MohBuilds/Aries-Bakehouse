'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtNaira } from '../../lib/format.js';
import { scrollToY } from '../SmoothScroll.jsx';
import BoxModel from './BoxModel.jsx';
import { CHAPTERS, FILM_ASSETS, MACROS, PIECES, PRODUCT_HREF, T, TURNTABLE_CALLOUTS, WHATSAPP_ORDER_URL } from './filmData.js';

gsap.registerPlugin(ScrollTrigger);

const HERO_ALT =
  'An open Aries 11 Brownie Box holding four brownies — Biscoff, Oreo, coconut crunch and dark chocolate — with the Oreo square suspended mid-drop above the box';

// Devices that would stutter through a canvas scrub + 3D turntable get the
// static editorial version instead (reduced motion is handled in CSS too, so
// it never flashes the cinematic layout).
function prefersStatic() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const { connection, deviceMemory, hardwareConcurrency } = navigator;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return true;
  if (deviceMemory && deviceMemory <= 2) return true;
  if (hardwareConcurrency && hardwareConcurrency <= 2) return true;
  return false;
}

function whenIdle(callback) {
  const run = () =>
    window.requestIdleCallback ? window.requestIdleCallback(callback, { timeout: 1200 }) : window.setTimeout(callback, 250);
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

export default function BrownieFilm({ featured = [] }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const suspendedRef = useRef(null);
  const assembledRef = useRef(null);
  const modelApi = useRef(null);
  const modelSizerRef = useRef(null);
  const progressRef = useRef(null);
  const triggerRef = useRef(null);
  const frames = useRef([]);
  const frameState = useRef({ value: 0 });

  const [mode, setMode] = useState('cinematic');
  const [deferred, setDeferred] = useState(false);
  const [chapter, setChapter] = useState(0);

  const product = featured.find((item) => item.slug === 'brownie-box');
  const priceLine = product?.startingPrice != null ? `Box of 4 from ${fmtNaira(product.startingPrice)}` : null;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMode(prefersStatic() ? 'static' : 'cinematic');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (mode !== 'cinematic') return;
    whenIdle(() => setDeferred(true));
  }, [mode]);

  // ---------------------------------------------------------------- frames
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width) return;
    const ctx = canvas.getContext('2d');
    const list = frames.current;
    const value = frameState.current.value;
    const index = Math.min(FILM_ASSETS.frameCount - 1, Math.floor(value));
    const mix = value - index;
    const ready = (i) => list[i]?.complete && list[i].naturalWidth > 0;

    let base = null;
    for (let d = 0; d < FILM_ASSETS.frameCount && !base; d += 1) {
      if (ready(index - d)) base = list[index - d];
      else if (ready(index + d)) base = list[index + d];
    }
    if (!base) {
      // No frames yet: fall back to whichever end-state still is closer.
      const still = value < FILM_ASSETS.frameCount / 2 ? suspendedRef.current : assembledRef.current;
      if (still?.complete && still.naturalWidth) base = still;
    }
    if (!base) return;

    const { width, height } = canvas;
    ctx.globalAlpha = 1;
    ctx.drawImage(base, 0, 0, width, height);
    if (mix > 0.02 && ready(index + 1) && base === list[index]) {
      // Cross-blend neighbouring frames so slow scrolling stays fluid.
      ctx.globalAlpha = mix;
      ctx.drawImage(list[index + 1], 0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    if (mode !== 'cinematic') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.round(entry.contentRect.width * dpr);
      if (size && canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
        drawFrame();
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [mode, drawFrame]);

  useEffect(() => {
    if (mode !== 'cinematic' || !deferred) return undefined;
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = (canvas?.clientWidth || 600) * dpr > 620 ? 'lg' : 'sm';
    let cancelled = false;
    let next = 0;
    const list = new Array(FILM_ASSETS.frameCount);
    frames.current = list;

    const pump = () => {
      if (cancelled || next >= FILM_ASSETS.frameCount) return;
      const i = next;
      next += 1;
      const img = new window.Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        if (cancelled) return;
        if (Math.abs(i - frameState.current.value) < 2) drawFrame();
        pump();
      };
      img.src = FILM_ASSETS.frame(size, i);
      list[i] = img;
    };
    for (let k = 0; k < 4; k += 1) pump();
    return () => {
      cancelled = true;
    };
  }, [mode, deferred, drawFrame]);

  // ------------------------------------------------------------ the film
  useEffect(() => {
    if (mode !== 'cinematic') return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    ScrollTrigger.config({ ignoreMobileResize: true });
    const q = gsap.utils.selector(root);
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;
    const desktop = () => vw() >= 1024;
    const plate = q('.film__plate')[0];
    const plateSize = () => plate.offsetWidth;
    const cam = { theta: -18, phi: -50 };
    const renderModel = () => modelApi.current?.render(cam.theta, cam.phi);

    const sizeModel = () => {
      const target = desktop() ? Math.min(vw() * 0.3, vh() * 0.44) : Math.min(vw() * 0.46, vh() * 0.28);
      modelSizerRef.current?.style.setProperty('--model-scale', (target / 330).toFixed(3));
    };
    sizeModel();
    renderModel();
    ScrollTrigger.addEventListener('refreshInit', sizeModel);

    const ctx = gsap.context(() => {
      const rig = q('.film__rig');
      const photo = q('.film__photo');
      const pieces = q('.film__piece');
      const shadows = q('.film__piece-shadow');
      const labels = q('.film__label-inner');
      const bars = q('.film__letterbox');
      const glow = q('.film__glow');
      const sweep = q('.film__sweep');
      const flash = q('.film__flash');
      const macros = q('.film__macro');
      const model = q('.film__model');
      const modelZoom = q('.film__model-zoom');
      const callouts = q('.film__callout');
      const copy = (name) => q(`[data-copy="${name}"]`);

      const heroRig = () => (desktop() ? { x: vw() * 0.2, y: vh() * 0.03, scale: 0.98 } : { x: 0, y: -vh() * 0.15, scale: 0.92 });
      const revealRig = () => (desktop() ? { x: 0, y: -vh() * 0.07, scale: 1.24 } : { x: 0, y: -vh() * 0.07, scale: 1.12 });
      const splitRig = () => (desktop() ? { scale: 0.9, y: 0 } : { scale: 0.8, y: -vh() * 0.06 });
      const boxedRig = () => (desktop() ? { x: vw() * 0.17, y: 0, scale: 1.02 } : { x: 0, y: -vh() * 0.13, scale: 0.92 });
      const inOut = (name, start, end) => {
        tl.to(copy(name), { opacity: 1, y: 0, duration: 2.4, ease: 'power2.out' }, start);
        tl.to(copy(name), { opacity: 0, y: -28, duration: 2, ease: 'power2.in' }, end);
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
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            root.toggleAttribute('data-hero-off', time >= 3);
            root.toggleAttribute('data-final-live', time > T.TOTAL - 6);
            let active = 0;
            CHAPTERS.forEach((c, i) => {
              if (time >= c.at - 1.5) active = i;
            });
            setChapter((current) => (current === active ? current : active));
          },
        },
      });
      triggerRef.current = tl.scrollTrigger;

      // 01 · Open → reveal: the camera eases off its hero angle and pushes in.
      tl.to(q('.film__cue'), { opacity: 0, duration: 1.2 }, 0.2);
      tl.to(copy('hero'), { opacity: 0, y: -48, duration: 4.5, ease: 'power2.in' }, 1.2);
      tl.fromTo(
        rig,
        { x: () => heroRig().x, y: () => heroRig().y, scale: () => heroRig().scale, rotationX: 9, rotationZ: -2.5 },
        {
          x: () => revealRig().x,
          y: () => revealRig().y,
          scale: () => revealRig().scale,
          rotationX: 0,
          rotationZ: 0,
          duration: 13,
          ease: 'power2.inOut',
        },
        T.revealStart - 2,
      );
      tl.to(glow, { scale: 1.2, opacity: 1, duration: 10 }, 3);
      tl.fromTo(sweep, { xPercent: -120, opacity: 0 }, { xPercent: 120, opacity: 1, duration: 8, ease: 'power1.inOut' }, 6);
      tl.to(sweep, { opacity: 0, duration: 2 }, 12);
      inOut('finishes', 8.5, 15.5);

      // 02 · Separate: the photo falls away and the four squares lift apart.
      tl.set(pieces, { autoAlpha: 1 }, T.separateStart);
      tl.to(photo, { autoAlpha: 0, duration: 4.5, ease: 'power1.in' }, T.separateStart + 0.4);
      tl.to(rig, { scale: () => splitRig().scale, y: () => splitRig().y, duration: 9, ease: 'power2.inOut' }, T.separateStart);
      PIECES.forEach((piece, i) => {
        tl.to(
          pieces[i],
          {
            x: () => (plateSize() * piece.drift.x) / 100,
            y: () => (plateSize() * piece.drift.y) / 100,
            rotation: piece.drift.r,
            scale: 1.05,
            duration: 9,
            ease: 'power3.inOut',
          },
          T.separateStart + 0.6 + i * 0.5,
        );
      });
      tl.to(shadows, { opacity: 1, y: 26, scale: 1.08, duration: 8, ease: 'power2.out' }, T.separateStart + 1);
      tl.to(bars, { scaleY: 1, duration: 6, ease: 'power2.inOut' }, T.separateStart);
      tl.to(glow, { scale: 0.85, opacity: 0.7, duration: 8 }, T.separateStart);
      tl.to(labels, { opacity: 1, y: 0, duration: 2.4, stagger: 0.7, ease: 'power2.out' }, 24.5);
      inOut('mixed', 25, 31.5);
      tl.to(labels, { opacity: 0, duration: 2, stagger: 0.2 }, 31.5);

      // 03 · Up close: dive through the pieces into macro shots.
      tl.to(rig, { scale: () => splitRig().scale * 2.8, autoAlpha: 0, duration: 4, ease: 'power2.in' }, T.macroStart);
      MACROS.forEach((macro, i) => {
        const start = T.macroStart + 1 + i * T.macroBeat;
        const dir = i % 2 ? -1 : 1;
        tl.to(macros[i], { autoAlpha: 1, duration: 1.6, ease: 'power1.inOut' }, start);
        tl.fromTo(
          q(`.film__macro[data-id="${macro.id}"] img`),
          { scale: 1.34, xPercent: dir * 2.5 },
          { scale: 1.06, xPercent: -dir * 2.5, duration: T.macroBeat + 2, ease: 'none' },
          start,
        );
        tl.to(copy(`macro-${macro.id}`), { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out' }, start + 0.9);
        tl.to(copy(`macro-${macro.id}`), { opacity: 0, y: -20, duration: 1.2, ease: 'power2.in' }, start + T.macroBeat - 1);
      });
      tl.to(macros, { autoAlpha: 0, duration: 2.5 }, T.reassembleStart);

      // 04 · Boxed: the squares fly home, then the final piece drops in.
      tl.to(rig, { scale: () => splitRig().scale, autoAlpha: 1, duration: 3, ease: 'power2.out' }, T.reassembleStart - 0.2);
      tl.to(pieces, { x: 0, y: 0, rotation: 0, scale: 1, duration: 8.5, ease: 'power3.inOut', stagger: 0.45 }, T.reassembleStart + 2);
      tl.to(shadows, { opacity: 0, y: 0, scale: 1, duration: 6 }, T.reassembleStart + 4.5);
      tl.to(
        rig,
        { x: () => boxedRig().x, y: () => boxedRig().y, scale: () => boxedRig().scale, duration: 10, ease: 'power2.inOut' },
        T.reassembleStart + 3,
      );
      tl.to(photo, { autoAlpha: 1, duration: 3, ease: 'power1.out' }, T.dropStart - 3);
      tl.set(pieces, { autoAlpha: 0 }, T.dropStart + 0.1);
      tl.to(bars, { scaleY: 0, duration: 5, ease: 'power2.inOut' }, T.dropStart - 3.5);
      tl.to(glow, { scale: 1.1, opacity: 1, duration: 6 }, T.dropStart - 3);
      inOut('boxed', T.reassembleStart + 8, T.dropEnd - 1.5);
      tl.to(q('.film__still--suspended'), { autoAlpha: 0, duration: 0.6 }, T.dropStart + 0.1);
      tl.to(
        frameState.current,
        {
          value: FILM_ASSETS.frameCount - 1,
          duration: T.dropEnd - T.dropStart - 0.5,
          ease: 'none',
          onUpdate: drawFrame,
        },
        T.dropStart + 0.3,
      );
      tl.to(q('.film__still--assembled'), { autoAlpha: 1, duration: 0.8 }, T.dropEnd - 0.4);

      // 05 · Every angle: match-cut to the 3D box and turn it a full 360°.
      tl.to(flash, { opacity: 0.5, duration: 1.1, ease: 'power2.in' }, T.turntableStart - 0.6);
      tl.to(flash, { opacity: 0, duration: 2.4, ease: 'power2.out' }, T.turntableStart + 0.5);
      tl.to(rig, { autoAlpha: 0, scale: () => boxedRig().scale * 0.92, duration: 2, ease: 'power2.in' }, T.turntableStart);
      tl.to(model, { autoAlpha: 1, duration: 2.2, ease: 'power2.out' }, T.turntableStart + 0.5);
      tl.fromTo(modelZoom, { scale: 0.9 }, { scale: 1.08, duration: 9, ease: 'sine.inOut' }, T.turntableStart + 0.5);
      tl.to(modelZoom, { scale: 1, duration: 6.5, ease: 'sine.inOut' }, T.turntableStart + 9.5);
      tl.to(
        cam,
        { theta: 342, duration: T.turntableEnd - T.turntableStart - 0.5, ease: 'power1.inOut', onUpdate: renderModel },
        T.turntableStart + 0.5,
      );
      tl.to(cam, { phi: -24, duration: 8, ease: 'sine.inOut', onUpdate: renderModel }, T.turntableStart + 0.5);
      tl.to(cam, { phi: -38, duration: 7.5, ease: 'sine.inOut', onUpdate: renderModel }, T.turntableStart + 8.5);
      inOut('angle', T.turntableStart + 1.5, T.turntableEnd - 2);
      TURNTABLE_CALLOUTS.forEach((callout, i) => {
        const start = T.turntableStart + 2.5 + i * 4.2;
        tl.to(callouts[i], { autoAlpha: 1, y: 0, duration: 1.4, ease: 'power2.out' }, start);
        tl.to(callouts[i], { autoAlpha: 0, y: -16, duration: 1, ease: 'power2.in' }, start + 3);
      });

      // 06 · Order: the box steps aside for the call to action.
      tl.to(
        modelZoom,
        {
          x: () => (desktop() ? -vw() * 0.2 : 0),
          y: () => (desktop() ? vh() * 0.05 : -vh() * 0.17),
          scale: () => (desktop() ? 0.86 : 0.74),
          duration: 5,
          ease: 'power2.inOut',
        },
        T.finalStart,
      );
      tl.to(copy('final'), { opacity: 1, y: 0, duration: 4, ease: 'power3.out' }, T.finalStart + 2);
      tl.to({}, { duration: 0.01 }, T.TOTAL - 0.01);
    }, root);

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', sizeModel);
      triggerRef.current = null;
      ctx.revert();
    };
  }, [mode, drawFrame]);

  // Re-measure once late images / fonts settle the layout.
  useEffect(() => {
    if (mode === 'cinematic' && deferred) ScrollTrigger.refresh();
  }, [mode, deferred]);

  const scrollToTime = useCallback((time, immediate = false) => {
    const st = triggerRef.current;
    if (!st) return;
    scrollToY(st.start + (Math.min(time, T.TOTAL) / T.TOTAL) * (st.end - st.start), { immediate });
  }, []);

  const skipFilm = (event) => {
    const target = document.getElementById('after-film');
    if (!target) return;
    event.preventDefault();
    scrollToY(target.getBoundingClientRect().top + window.scrollY - 72, { immediate: true });
    target.focus({ preventScroll: true });
  };

  // Keyboard users tabbing into a scene that is off-screen get scrolled to it.
  const handleFocus = (event) => {
    const scene = event.target.closest('[data-at]');
    const st = triggerRef.current;
    if (!scene || !st) return;
    const at = Number(scene.dataset.at);
    const time = st.progress * T.TOTAL;
    if (Math.abs(time - at) > 4) scrollToTime(at, true);
  };

  return (
    <div className="film-switch" data-mode={mode}>
      {mode === 'cinematic' && (
        <section
          id="brownie-film"
          ref={rootRef}
          className="film"
          aria-labelledby="film-title"
          style={{ '--film-length': T.TOTAL }}
          onFocus={handleFocus}
        >
          <div className="film__stage">
            <div className="film__backdrop" aria-hidden="true" />

            <div className="film__camera">
              <div className="film__rig">
                <div className="film__glow" aria-hidden="true" />
                <div className="film__plate">
                  <div className="film__photo">
                    <canvas ref={canvasRef} className="film__canvas" aria-hidden="true" />
                    <Image
                      ref={suspendedRef}
                      src={FILM_ASSETS.suspended}
                      alt={HERO_ALT}
                      fill
                      priority
                      sizes="(min-width: 1024px) 58vw, 94vw"
                      className="film__still film__still--suspended"
                    />
                    <img
                      ref={assembledRef}
                      src={deferred ? FILM_ASSETS.assembled : undefined}
                      alt=""
                      decoding="async"
                      className="film__still film__still--assembled"
                    />
                  </div>
                  <div className="film__sweep" aria-hidden="true" />
                  <div className="film__pieces" aria-hidden="true">
                    {PIECES.map((piece) => (
                      <div
                        key={piece.id}
                        className="film__piece"
                        style={{
                          left: `${piece.box.x}%`,
                          top: `${piece.box.y}%`,
                          width: `${piece.box.w}%`,
                          height: `${piece.box.h}%`,
                        }}
                      >
                        <div className="film__piece-shadow" />
                        <img src={deferred ? piece.cutout : undefined} alt="" decoding="async" />
                      </div>
                    ))}
                  </div>
                  <ul className="film__labels" aria-label="The four finishes in this box">
                    {PIECES.map((piece) => (
                      <li
                        key={piece.id}
                        className={`film__label film__label--${piece.labelSide}`}
                        style={{
                          left: `${piece.box.x + piece.box.w / 2 + piece.drift.x}%`,
                          top: `${piece.box.y + piece.box.h / 2 + piece.drift.y}%`,
                        }}
                      >
                        <span className="film__label-inner">
                          <strong>{piece.name}</strong>
                          <span>{piece.note}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="film__model" aria-hidden="true">
              <div className="film__model-zoom">
                <div className="film__model-sizer" ref={modelSizerRef}>
                  <BoxModel apiRef={modelApi} textures={deferred} />
                </div>
              </div>
            </div>

            <div className="film__macros">
              {MACROS.map((macro, i) => (
                <figure key={macro.id} className="film__macro" data-id={macro.id}>
                  <img
                    src={deferred ? macro.image : undefined}
                    alt={`Close-up of a ${macro.name} brownie`}
                    decoding="async"
                    style={{ objectPosition: macro.focus }}
                  />
                  <figcaption className="film__copy film__copy--macro" data-copy={`macro-${macro.id}`}>
                    <span className="film__count">
                      {String(i + 1).padStart(2, '0')} / {String(MACROS.length).padStart(2, '0')}
                    </span>
                    <h3>{macro.name}</h3>
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

            {/* Copy: all of it stays in the accessibility tree (opacity only). */}
            <div className="film__copy film__copy--hero" data-copy="hero" data-at="0">
              <p className="film__kicker">Brownie Box · Made to order in Abeokuta</p>
              <h1 id="film-title">
                Every square,
                <br />
                <em>your call.</em>
              </h1>
              <p className="film__lede">
                Fudge-centre brownies in five finishes. Mix them in one box at no extra cost, baked fresh with 24 hours&rsquo; notice.
              </p>
              <div className="film__actions">
                <Link to={PRODUCT_HREF} className="btn film__btn-primary">
                  <span>Build your box</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/menu" className="film__btn-text">
                  See the full menu
                </Link>
              </div>
            </div>

            <div className="film__cue" aria-hidden="true">
              <span>Scroll to open the box</span>
              <i />
            </div>

            <div className="film__copy film__copy--center" data-copy="finishes">
              <p className="film__kicker">Five finishes</p>
              <h2>Pick one finish, or mix them all.</h2>
              <p>Biscoff, Oreos, coconut crunch, dark and white chocolate. A mixed box costs the same.</p>
            </div>

            <p className="film__copy film__caption" data-copy="mixed">
              Shown: a mixed box of 4
            </p>

            <div className="film__copy film__copy--side" data-copy="boxed">
              <p className="film__kicker">Boxed for you</p>
              <h2>Baked for your order. Packed to share.</h2>
              <p>Nothing waits on a shelf. Order at least 24 hours ahead and we bake your exact box.</p>
            </div>

            <div className="film__copy film__copy--top" data-copy="angle">
              <p className="film__kicker">Every angle</p>
            </div>
            <dl className="film__callouts">
              {TURNTABLE_CALLOUTS.map((callout) => (
                <div key={callout.id} className="film__callout">
                  <dt>{callout.label}</dt>
                  <dd>{callout.value}</dd>
                </div>
              ))}
            </dl>

            <div className="film__copy film__copy--final" data-copy="final" data-at={T.TOTAL}>
              <p className="film__kicker">Brownie Box</p>
              <h2>Build your box.</h2>
              <p>Choose a size, pick your finishes, tell us when. We bake it fresh for you.</p>
              {priceLine && (
                <p className="film__price">
                  {priceLine}
                  <span aria-hidden="true"> · </span>
                  24-hour notice
                </p>
              )}
              <div className="film__actions">
                <Link to={PRODUCT_HREF} className="btn film__btn-primary">
                  <span>Build your brownie box</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <a href={WHATSAPP_ORDER_URL} target="_blank" rel="noreferrer" className="btn btn-whatsapp film__btn-whatsapp">
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>Order on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="film__hud">
              <a href="#after-film" className="film__skip" onClick={skipFilm}>
                Skip the film
                <ArrowDown size={13} aria-hidden="true" />
              </a>
              <nav className="film__chapters" aria-label="Film chapters">
                <ol>
                  {CHAPTERS.map((c, i) => (
                    <li key={c.id}>
                      <button type="button" aria-current={chapter === i ? 'step' : undefined} onClick={() => scrollToTime(c.at)}>
                        <span className="film__chapter-index">{String(i + 1).padStart(2, '0')}</span>
                        <span className="film__chapter-label">{c.label}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
              <div className="film__progress" aria-hidden="true">
                <span ref={progressRef} />
              </div>
            </div>
          </div>
        </section>
      )}

      <FilmStatic priceLine={priceLine} />
      <div id="after-film" tabIndex={-1} />
    </div>
  );
}

// Reduced-motion / low-power version: the same story as a calm, stacked
// editorial page — no pinning, no scrubbing.
function FilmStatic({ priceLine }) {
  return (
    <section className="film-static" aria-labelledby="film-static-title">
      <div className="film-static__band">
        <div className="container film-static__hero">
          <div className="film-static__copy">
            <p className="film__kicker">Brownie Box · Made to order in Abeokuta</p>
            <h1 id="film-static-title">
              Every square, <em>your call.</em>
            </h1>
            <p className="film__lede">
              Fudge-centre brownies in five finishes. Mix them in one box at no extra cost, baked fresh with 24 hours&rsquo; notice.
            </p>
            <div className="film__actions">
              <Link to={PRODUCT_HREF} className="btn film__btn-primary">
                <span>Build your box</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/menu" className="film__btn-text">
                See the full menu
              </Link>
            </div>
          </div>
          <div className="film-static__media">
            <Image
              src={FILM_ASSETS.assembled}
              alt="An open Aries 11 Brownie Box holding four brownies: Biscoff, Oreo, coconut crunch and dark chocolate"
              fill
              sizes="(min-width: 1024px) 46vw, 92vw"
            />
          </div>
        </div>
      </div>

      <div className="container film-static__finishes">
        <h2>Pick one finish, or mix them all.</h2>
        <p>Biscoff, Oreos, coconut crunch, dark and white chocolate. A mixed box costs the same.</p>
        <ul>
          {MACROS.map((macro) => (
            <li key={macro.id}>
              <img src={macro.image} alt={`Close-up of a ${macro.name} brownie`} loading="lazy" decoding="async" />
              <h3>{macro.name}</h3>
              <p>{macro.line}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="container film-static__final">
        <h2>Build your box.</h2>
        <dl>
          {TURNTABLE_CALLOUTS.map((callout) => (
            <div key={callout.id}>
              <dt>{callout.label}</dt>
              <dd>{callout.value}</dd>
            </div>
          ))}
        </dl>
        {priceLine && <p className="film__price">{priceLine} · 24-hour notice</p>}
        <div className="film__actions">
          <Link to={PRODUCT_HREF} className="btn film__btn-primary">
            <span>Build your brownie box</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <a href={WHATSAPP_ORDER_URL} target="_blank" rel="noreferrer" className="btn btn-whatsapp film__btn-whatsapp">
            <MessageCircle size={15} aria-hidden="true" />
            <span>Order on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
