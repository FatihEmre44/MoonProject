/**
 * terrainUtils.js
 * 3 moon region profiles: low / medium / high crater density.
 */

/* ── Noise primitives ── */
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a, b, t) { return a + t * (b - a) }

function hash2d(ix, iy) {
  let a = (ix | 0) * 1597334677
  let b = (iy | 0) * 3812015801
  a ^= b
  a = Math.imul(a, 2654435769)
  a ^= a >>> 16
  return (a & 0x7fffffff) / 0x7fffffff
}

function valueNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  return lerp(
    lerp(hash2d(ix, iy), hash2d(ix + 1, iy), fade(fx)),
    lerp(hash2d(ix, iy + 1), hash2d(ix + 1, iy + 1), fade(fx)),
    fade(fy)
  )
}

function fbm(x, y, octaves = 5, lac = 2.0, gain = 0.5) {
  let sum = 0, amp = 1, freq = 1, max = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp
    max += amp
    amp *= gain
    freq *= lac
  }
  return sum / max
}

export function seededRandom(seed) {
  let s = seed | 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 2246822507)
    s = Math.imul(s ^ (s >>> 13), 3266489909)
    s ^= s >>> 16
    return (s >>> 0) / 4294967296
  }
}

/* ── 3 Map Profiles ── */
const MAP_PROFILES = {
  'low-crater': {
    label: 'Mare Tranquillitatis',
    description: 'Düz bazaltik ova, az sayıda küçük krater',
    baseScale: 0.012,
    hillAmp: 2.5,
    bumpAmp: 0.8,
    detailAmp: 0.25,
    offset: [0, 0],
    craters: [
      { wx: 30, wz: -40, r: 6 },
      { wx: -50, wz: 25, r: 5 },
      { wx: 60, wz: 55, r: 4 },
      { wx: -25, wz: -60, r: 5 },
      { wx: 70, wz: -15, r: 3 },
      { wx: -65, wz: -45, r: 4 },
    ],
    colorBase: [0.28, 0.27, 0.26],
    colorRange: 0.12,
    rockCount: 800,
    boulderCount: 40,
  },
  'mid-crater': {
    label: 'Oceanus Procellarum',
    description: 'Orta yoğunlukta krater alanı',
    baseScale: 0.02,
    hillAmp: 4,
    bumpAmp: 1.8,
    detailAmp: 0.5,
    offset: [500, 500],
    craters: [
      { wx: 0, wz: 0, r: 14 },
      { wx: 40, wz: -30, r: 9 },
      { wx: -45, wz: 35, r: 10 },
      { wx: -20, wz: -55, r: 7 },
      { wx: 55, wz: 45, r: 8 },
      { wx: -60, wz: -15, r: 11 },
      { wx: 25, wz: 60, r: 6 },
      { wx: -35, wz: 65, r: 7 },
      { wx: 65, wz: -45, r: 5 },
      { wx: -70, wz: 55, r: 8 },
      { wx: 10, wz: -70, r: 6 },
      { wx: 50, wz: 15, r: 5 },
      { wx: -15, wz: 30, r: 4 },
    ],
    colorBase: [0.30, 0.29, 0.28],
    colorRange: 0.16,
    rockCount: 1800,
    boulderCount: 120,
  },
  'high-crater': {
    label: 'Tycho Highlands',
    description: 'Yoğun krater bölgesi, sert arazi',
    baseScale: 0.028,
    hillAmp: 6,
    bumpAmp: 3,
    detailAmp: 0.9,
    offset: [1200, 1200],
    craters: [
      { wx: 0, wz: 0, r: 18 },
      { wx: 35, wz: -22, r: 12 },
      { wx: -40, wz: 30, r: 14 },
      { wx: -25, wz: -48, r: 9 },
      { wx: 52, wz: 42, r: 11 },
      { wx: -62, wz: -12, r: 15 },
      { wx: 22, wz: 58, r: 8 },
      { wx: -18, wz: 62, r: 10 },
      { wx: 68, wz: -35, r: 7 },
      { wx: -52, wz: -55, r: 13 },
      { wx: 72, wz: 18, r: 6 },
      { wx: -32, wz: 72, r: 9 },
      { wx: 48, wz: -62, r: 8 },
      { wx: -72, wz: 48, r: 10 },
      { wx: 12, wz: -72, r: 14 },
      { wx: 62, wz: 62, r: 7 },
      { wx: -68, wz: -42, r: 11 },
      { wx: 30, wz: 30, r: 5 },
      { wx: -10, wz: -32, r: 6 },
      { wx: 78, wz: -8, r: 8 },
      { wx: -48, wz: 15, r: 7 },
      { wx: 15, wz: 42, r: 5 },
      { wx: -55, wz: -70, r: 9 },
      { wx: 42, wz: -15, r: 6 },
      { wx: -78, wz: 25, r: 10 },
    ],
    colorBase: [0.34, 0.32, 0.30],
    colorRange: 0.20,
    rockCount: 3000,
    boulderCount: 250,
  },
}

export function getMapProfile(mapId) {
  return MAP_PROFILES[mapId] || MAP_PROFILES['mid-crater']
}

export function getAllMaps() {
  return Object.entries(MAP_PROFILES).map(([id, p]) => ({
    id,
    label: p.label,
    description: p.description,
  }))
}

/* ── Height function ── */
export function getTerrainHeight(worldX, worldZ, mapId = 'mid-crater') {
  const p = getMapProfile(mapId)
  const s = p.baseScale
  const ox = p.offset[0], oz = p.offset[1]

  let h = 0
  h += (fbm((worldX + ox) * s * 0.3 + 50, (worldZ + oz) * s * 0.3 + 50, 5) - 0.5) * p.hillAmp
  h += (fbm((worldX + ox) * s * 1.5 + 150, (worldZ + oz) * s * 1.5 + 150, 4) - 0.5) * p.bumpAmp
  h += (fbm((worldX + ox) * s * 4 + 300, (worldZ + oz) * s * 4 + 300, 3) - 0.5) * p.detailAmp

  for (const c of p.craters) {
    const dx = worldX - c.wx
    const dz = worldZ - c.wz
    const dist = Math.sqrt(dx * dx + dz * dz)
    const r = c.r

    if (dist < r * 2.5) {
      if (dist < r) {
        const t = dist / r
        h -= r * 0.35 * (1 - t * t)
      } else if (dist < r * 1.35) {
        const t = (dist - r) / (r * 0.35)
        h += r * 0.12 * Math.cos(t * Math.PI * 0.5)
      }
    }
  }

  return h
}
