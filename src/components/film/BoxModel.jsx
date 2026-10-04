'use client';

import { useEffect, useMemo, useRef } from 'react';
import { FILM_ASSETS } from './filmData.js';

// A CSS-3D stand-in for the Brownie Box, textured with the real product
// photography (top faces were perspective-rectified from the single-brownie
// shots). Faces are lit in JS from their world-space normals so the light
// stays fixed while the box turns — that's what sells the rotation.

const S = 300; // inner box width/depth
const WALL = 58;
const T = 4; // card thickness
const B = 134; // brownie footprint
const H = 46; // brownie height
const LID_OPEN = 104; // degrees
const TEX = '/uploads/film/tex';

// Light comes from upper-left, slightly toward the viewer (view space).
const L = normalize([-0.42, -0.78, 0.46]);

function normalize([x, y, z]) {
  const m = Math.hypot(x, y, z);
  return [x / m, y / m, z / m];
}

const ROT = {
  front: ['', [0, 0, 1]],
  back: ['rotateY(180deg)', [0, 0, -1]],
  left: ['rotateY(-90deg)', [-1, 0, 0]],
  right: ['rotateY(90deg)', [1, 0, 0]],
  up: ['rotateX(90deg)', [0, -1, 0]],
  down: ['rotateX(-90deg)', [0, 1, 0]],
};

function face(key, w, h, [x, y, z], dir, className, style = {}) {
  const [rot, normal] = ROT[dir];
  return { key, w, h, transform: `translate3d(${x}px, ${y}px, ${z}px) ${rot}`, normal, className, style };
}

function rotateX([x, y, z], deg) {
  const a = (deg * Math.PI) / 180;
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}

function buildFaces(textures) {
  const O = S + 2 * T;
  const midY = -WALL / 2;
  const faces = [
    face('floor', S, S, [0, -0.5, 0], 'up', 'box-face box-face--floor'),
    face('wall-front-out', O, WALL, [0, midY, O / 2], 'front', 'box-face box-face--out'),
    face('wall-back-out', O, WALL, [0, midY, -O / 2], 'back', 'box-face box-face--out'),
    face('wall-left-out', O, WALL, [-O / 2, midY, 0], 'left', 'box-face box-face--out'),
    face('wall-right-out', O, WALL, [O / 2, midY, 0], 'right', 'box-face box-face--out'),
    face('wall-front-in', S, WALL, [0, midY, S / 2], 'back', 'box-face box-face--in'),
    face('wall-back-in', S, WALL, [0, midY, -S / 2], 'front', 'box-face box-face--in'),
    face('wall-left-in', S, WALL, [-S / 2, midY, 0], 'right', 'box-face box-face--in'),
    face('wall-right-in', S, WALL, [S / 2, midY, 0], 'left', 'box-face box-face--in'),
    face('rim-front', O, T, [0, -WALL, (O - T) / 2], 'up', 'box-face box-face--rim'),
    face('rim-back', O, T, [0, -WALL, -(O - T) / 2], 'up', 'box-face box-face--rim'),
    face('rim-left', T, O, [-(O - T) / 2, -WALL, 0], 'up', 'box-face box-face--rim'),
    face('rim-right', T, O, [(O - T) / 2, -WALL, 0], 'up', 'box-face box-face--rim'),
  ];

  const grid = [
    ['biscoff', -1, -1],
    ['oreo', 1, -1],
    ['coconut', -1, 1],
    ['dark', 1, 1],
  ];
  const offset = (S - 2 * B) / 4 + B / 2;
  grid.forEach(([id, gx, gz]) => {
    const cx = gx * offset;
    const cz = gz * offset;
    const top = textures ? { backgroundImage: `url(${TEX}/${id}-top.webp)` } : {};
    const side = textures ? { backgroundImage: `url(${TEX}/${id}-side.webp)` } : {};
    faces.push(
      face(`${id}-top`, B, B, [cx, -H, cz], 'up', 'box-face box-face--brownie-top', top),
      face(`${id}-front`, B, H, [cx, -H / 2, cz + B / 2], 'front', 'box-face box-face--brownie-side', side),
      face(`${id}-back`, B, H, [cx, -H / 2, cz - B / 2], 'back', 'box-face box-face--brownie-side', side),
      face(`${id}-left`, B, H, [cx - B / 2, -H / 2, cz], 'left', 'box-face box-face--brownie-side', side),
      face(`${id}-right`, B, H, [cx + B / 2, -H / 2, cz], 'right', 'box-face box-face--brownie-side', side),
    );
  });

  return faces;
}

function buildLid(textures) {
  const O = S + 2 * T;
  const FLAP = 26;
  const lid = [
    face(
      'lid-out',
      O,
      O,
      [0, 0, O / 2],
      'up',
      'box-face box-face--lid-out',
      textures ? { backgroundImage: `url(${FILM_ASSETS.monogram})` } : {},
    ),
    face('lid-in', O, O, [0, 0.6, O / 2], 'down', 'box-face box-face--in'),
    face('flap-out', O, FLAP, [0, FLAP / 2, O], 'front', 'box-face box-face--out'),
    face('flap-in', O, FLAP, [0, FLAP / 2, O - 0.6], 'back', 'box-face box-face--in'),
  ];
  // Lid faces live inside the hinged group, so bake the hinge rotation into
  // their normals once.
  return lid.map((f) => ({ ...f, normal: rotateX(f.normal, LID_OPEN) }));
}

export default function BoxModel({ apiRef, textures }) {
  const worldRef = useRef(null);
  const faceEls = useRef(new Map());
  const faces = useMemo(() => buildFaces(textures), [textures]);
  const lid = useMemo(() => buildLid(textures), [textures]);

  useEffect(() => {
    const all = [...faces, ...lid];
    function render(theta, phi) {
      const world = worldRef.current;
      if (!world) return;
      world.style.transform = `rotateX(${phi}deg) rotateY(${theta}deg)`;
      const t = (theta * Math.PI) / 180;
      const p = (phi * Math.PI) / 180;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const cp = Math.cos(p);
      const sp = Math.sin(p);
      all.forEach((f) => {
        const el = faceEls.current.get(f.key);
        if (!el) return;
        const [nx, ny, nz] = f.normal;
        // rotateY then rotateX — same order CSS applies them.
        const x1 = nx * ct + nz * st;
        const z1 = -nx * st + nz * ct;
        const y2 = ny * cp - z1 * sp;
        const z2 = ny * sp + z1 * cp;
        const lambert = Math.max(0, x1 * L[0] + y2 * L[1] + z2 * L[2]);
        const dim = 1 - (0.5 + 0.5 * lambert);
        el.style.setProperty('--dim', dim.toFixed(3));
      });
    }
    if (apiRef) apiRef.current = { render };
    return () => {
      if (apiRef) apiRef.current = null;
    };
  }, [apiRef, faces, lid]);

  const renderFace = (f) => (
    <div
      key={f.key}
      ref={(el) => {
        if (el) faceEls.current.set(f.key, el);
        else faceEls.current.delete(f.key);
      }}
      className={f.className}
      style={{
        width: f.w,
        height: f.h,
        marginLeft: -f.w / 2,
        marginTop: -f.h / 2,
        transform: f.transform,
        ...f.style,
      }}
    />
  );

  return (
    <div className="box-model__world" ref={worldRef}>
      <div className="box-model__contact-shadow" />
      {faces.map(renderFace)}
      <div className="box-model__lid" style={{ transform: `translate3d(0, ${-WALL}px, ${-(S + 2 * T) / 2}px) rotateX(${LID_OPEN}deg)` }}>
        {lid.map(renderFace)}
      </div>
    </div>
  );
}
