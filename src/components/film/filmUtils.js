'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Devices that would stutter through canvas scrubbing get the static
// editorial version instead (reduced motion is also handled in CSS so it
// never flashes the cinematic layout).
export function prefersStatic() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const { connection, deviceMemory, hardwareConcurrency } = navigator;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return true;
  if (deviceMemory && deviceMemory <= 2) return true;
  if (hardwareConcurrency && hardwareConcurrency <= 2) return true;
  return false;
}

// Resolves on the visitor's first sign of intent to move past the hero
// (scroll, wheel, touch, key, pointer), or straight away if the page was
// restored part-way down. Keeps film assets off the initial page load.
export function whenIntent(callback) {
  const events = ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'];
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    events.forEach((e) => window.removeEventListener(e, fire));
    callback();
  };
  if (window.scrollY > 40) {
    fire();
    return () => {};
  }
  events.forEach((e) => window.addEventListener(e, fire, { passive: true, once: true }));
  return () => {
    done = true;
    events.forEach((e) => window.removeEventListener(e, fire));
  };
}

const MAX_DPR = 1.5;
const MAX_CANVAS = 1920;

// Scroll-scrubbed image sequences drawn to <canvas>. GSAP tweens
// `states[name].value` (a fractional frame index) and calls `draw(name)`.
// Frames load only for sequences named in `wanted`, four at a time.
// Missing frames fall back to the nearest loaded one; with none loaded the
// canvas stays clear so the still underneath shows.
export function useFrameSequences(defs, wanted) {
  // A stable, mutable store (GSAP tweens `value` in place); never re-created.
  const [states] = useState(() => Object.fromEntries(Object.keys(defs).map((name) => [name, { value: 0, frames: [], canvas: null }])));

  const draw = useCallback(
    (name) => {
      const state = states[name];
      const canvas = state?.canvas;
      if (!canvas || !canvas.width) return;
      const ctx = canvas.getContext('2d');
      const { frames, value } = state;
      const count = defs[name].count;
      const index = Math.max(0, Math.min(count - 1, Math.floor(value)));
      const mix = value - index;
      const ready = (i) => frames[i]?.complete && frames[i].naturalWidth > 0;

      let base = null;
      for (let d = 0; d < count && !base; d += 1) {
        if (ready(index - d)) base = frames[index - d];
        else if (ready(index + d)) base = frames[index + d];
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!base) return;
      ctx.globalAlpha = 1;
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
      if (mix > 0.02 && base === frames[index] && ready(index + 1)) {
        ctx.globalAlpha = mix;
        ctx.drawImage(frames[index + 1], 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }
    },
    [defs, states],
  );

  const observer = useRef(null);
  useEffect(() => {
    observer.current = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const canvas = entry.target;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const scale = Math.min(dpr, MAX_CANVAS / Math.max(1, entry.contentRect.width));
        const w = Math.round(entry.contentRect.width * scale);
        const h = Math.round(entry.contentRect.height * scale);
        if (w && h && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w;
          canvas.height = h;
          draw(canvas.dataset.seq);
        }
      });
    });
    Object.values(states).forEach((s) => s.canvas && observer.current.observe(s.canvas));
    return () => observer.current.disconnect();
  }, [draw, states]);

  // Stable per-name ref callbacks, so re-renders don't detach the canvases.
  const refCallbacks = useRef({});
  const canvasRef = useCallback(
    (name) => {
      if (!refCallbacks.current[name]) {
        refCallbacks.current[name] = (el) => {
          const state = states[name];
          if (state.canvas && observer.current) observer.current.unobserve(state.canvas);
          state.canvas = el;
          if (el && observer.current) observer.current.observe(el);
        };
      }
      return refCallbacks.current[name];
    },
    [states],
  );

  // One persistent queue: sequences are appended as they become wanted
  // (`wanted` lists names, nearest scene first) and drained four at a time.
  const loader = useRef({ queue: [], active: 0, requested: new Set(), disposed: false });
  useEffect(() => {
    const l = loader.current;
    l.disposed = false;
    return () => {
      l.disposed = true;
    };
  }, []);

  const wantedKey = wanted.join(',');
  useEffect(() => {
    const l = loader.current;
    const pump = () => {
      while (!l.disposed && l.active < 4 && l.queue.length) {
        const [name, i, src] = l.queue.shift();
        const img = new window.Image();
        img.decoding = 'async';
        l.active += 1;
        img.onload = img.onerror = () => {
          l.active -= 1;
          if (l.disposed) return;
          if (Math.abs(i - states[name].value) < 2) draw(name);
          pump();
        };
        img.src = src;
        states[name].frames[i] = img;
      }
    };
    wantedKey
      .split(',')
      .filter(Boolean)
      .forEach((name) => {
        if (l.requested.has(name) || !defs[name]) return;
        l.requested.add(name);
        const canvas = states[name].canvas;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const size = (canvas?.clientWidth || 800) * dpr > 760 ? 'lg' : 'sm';
        states[name].frames = new Array(defs[name].count);
        for (let i = 0; i < defs[name].count; i += 1) l.queue.push([name, i, defs[name].url(size, i)]);
      });
    pump();
  }, [wantedKey, defs, draw, states]);

  return { states, draw, canvasRef };
}
