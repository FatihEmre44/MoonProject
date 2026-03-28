/**
 * terrainUtils.js
 * Procedural terrain generation using value noise + FBM for realistic moon surface.
 */
import { CRATERS_WORLD } from './sampleData';

/* ── Noise primitives ── */
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }

function hash2d(ix, iy) {
  let a = (ix | 0) * 1597334677;
  let b = (iy | 0) * 3812015801;
  a ^= b;
  a = Math.imul(a, 2654435769);
  a ^= a >>> 16;
  return (a & 0x7fffffff) / 0x7fffffff;
}

function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fade(fx);
  const uy = fade(fy);
  return lerp(
    lerp(hash2d(ix, iy), hash2d(ix + 1, iy), ux),
    lerp(hash2d(ix, iy + 1), hash2d(ix + 1, iy + 1), ux),
    uy
  );
}

function fbm(x, y, octaves = 6, lac = 2.0, gain = 0.5) {
  let sum = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    max += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / max;
}

/* ── Seeded random for rock placement ── */
export function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}

/* ── Main terrain height function ── */
export function getTerrainHeight(worldX, worldZ) {
  const s = 0.02;
  let h = 0;

  // Large rolling hills
  h += (fbm(worldX * s * 0.3 + 50, worldZ * s * 0.3 + 50, 5) - 0.5) * 6;
  // Medium mounds
  h += (fbm(worldX * s * 1.5 + 150, worldZ * s * 1.5 + 150, 4) - 0.5) * 2;
  // Fine pebble roughness
  h += (fbm(worldX * s * 4 + 300, worldZ * s * 4 + 300, 3) - 0.5) * 0.5;

  // Crater depressions & rims
  for (const c of CRATERS_WORLD) {
    const dx = worldX - c.worldX;
    const dz = worldZ - c.worldZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const r = c.radius * 2;

    if (dist < r * 2.5) {
      if (dist < r) {
        const t = dist / r;
        h -= r * 0.6 * (1 - t * t);
      } else if (dist < r * 1.4) {
        const t = (dist - r) / (r * 0.4);
        h += r * 0.2 * Math.cos(t * Math.PI * 0.5);
      }
    }
  }

  return h;
}
