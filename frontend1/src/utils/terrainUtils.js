/**
 * terrainUtils.js
 * 3 moon region profiles: low / medium / high crater density.
 */

/* ── Noise primitives ── */
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a, b, t) { return a + t * (b - a) }
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

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

function evalMicroMound(cellX, cellZ, localX, localZ, profile) {
  const presence = hash2d(cellX * 17 + 11, cellZ * 19 + 23)
  if (presence > profile.microMoundDensity) return 0

  const centerX = (hash2d(cellX * 13 + 101, cellZ * 7 + 59) - 0.5) * 0.7
  const centerZ = (hash2d(cellX * 5 + 73, cellZ * 11 + 41) - 0.5) * 0.7
  const radius = 0.16 + hash2d(cellX * 29 + 37, cellZ * 31 + 47) * 0.32

  const dx = localX - centerX
  const dz = localZ - centerZ
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist >= radius) return 0

  const t = 1 - dist / radius
  const shape = t * t * (1.1 + t * 0.8)

  // Bazi mikro tepecikleri biraz asimetrik yaparak dogal daginiklik verir.
  const skew = (hash2d(cellX * 43 + 17, cellZ * 41 + 19) - 0.5) * 0.45
  const amp = profile.microMoundAmp * (0.55 + hash2d(cellX * 3 + 89, cellZ * 2 + 97) * 0.9)

  return shape * amp * (1 + skew * Math.sign(dx + dz))
}

function evalKnoll(cellX, cellZ, localX, localZ, profile) {
  const presence = hash2d(cellX * 31 + 7, cellZ * 37 + 13)
  if (presence > profile.knollDensity) return 0

  const cx = (hash2d(cellX * 17 + 211, cellZ * 19 + 223) - 0.5) * 0.9
  const cz = (hash2d(cellX * 23 + 317, cellZ * 29 + 331) - 0.5) * 0.9
  const r = 0.35 + hash2d(cellX * 41 + 401, cellZ * 43 + 409) * 0.65

  const dx = localX - cx
  const dz = localZ - cz
  const d = Math.sqrt(dx * dx + dz * dz)
  if (d >= r) return 0

  const t = 1 - d / r
  const cone = Math.pow(t, 1.6)
  const topNoise = (hash2d(cellX * 53 + 19, cellZ * 59 + 23) - 0.5) * 0.35
  const amp = profile.knollAmp * (0.65 + hash2d(cellX * 47 + 29, cellZ * 61 + 31) * 0.9)
  return cone * amp * (1 + topNoise)
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
    ruggedAmp: 0.35,
    curvatureLift: 7.5,
    curvaturePower: 1.2,
    edgeDrop: 5.2,
    cornerSink: 18,
    microMoundAmp: 0.45,
    microMoundDensity: 0.2,
    knollAmp: 0.7,
    knollDensity: 0.1,
    knollScale: 0.14,
    offset: [0, 0],
    ruggedZones: [
      { wx: -30, wz: 20, r: 22, intensity: 0.6 },
      { wx: 48, wz: -35, r: 18, intensity: 0.5 },
    ],
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
    terrainSegments: 320,
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
    ruggedAmp: 0.85,
    curvatureLift: 10.5,
    curvaturePower: 1.25,
    edgeDrop: 7.8,
    cornerSink: 24,
    microMoundAmp: 0.85,
    microMoundDensity: 0.28,
    knollAmp: 1.25,
    knollDensity: 0.16,
    knollScale: 0.17,
    offset: [500, 500],
    ruggedZones: [
      { wx: -20, wz: 18, r: 24, intensity: 1.0 },
      { wx: 42, wz: -16, r: 20, intensity: 0.9 },
      { wx: -58, wz: -42, r: 28, intensity: 0.95 },
    ],
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
    terrainSegments: 320,
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
    ruggedAmp: 1.7,
    curvatureLift: 14.0,
    curvaturePower: 1.35,
    edgeDrop: 10.5,
    cornerSink: 32,
    microMoundAmp: 1.35,
    microMoundDensity: 0.36,
    knollAmp: 2.1,
    knollDensity: 0.24,
    knollScale: 0.2,
    offset: [1200, 1200],
    ruggedZones: [
      { wx: -56, wz: -46, r: 30, intensity: 1.3 },
      { wx: 35, wz: 30, r: 24, intensity: 1.2 },
      { wx: 72, wz: -20, r: 22, intensity: 1.25 },
      { wx: -18, wz: 66, r: 20, intensity: 1.1 },
      { wx: -70, wz: 10, r: 18, intensity: 1.0 },
    ],
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
    // Cok yogun haritada cizimi kilitlememek icin geometri/cozum basitlestirilir.
    terrainSegments: 220,
    rockCount: 1800,
    boulderCount: 140,
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
  const mapRadius = 105

  let h = 0
  h += (fbm((worldX + ox) * s * 0.3 + 50, (worldZ + oz) * s * 0.3 + 50, 5) - 0.5) * p.hillAmp
  h += (fbm((worldX + ox) * s * 1.5 + 150, (worldZ + oz) * s * 1.5 + 150, 4) - 0.5) * p.bumpAmp
  h += (fbm((worldX + ox) * s * 4 + 300, (worldZ + oz) * s * 4 + 300, 3) - 0.5) * p.detailAmp

  // Dengesiz engebeler: ridged + chaotic katmanlar ile gercekci pürüzlülük.
  const warpX = worldX + (fbm((worldX + ox) * s * 0.9 + 700, (worldZ + oz) * s * 0.9 + 700, 3) - 0.5) * 8
  const warpZ = worldZ + (fbm((worldX + ox) * s * 0.9 + 820, (worldZ + oz) * s * 0.9 + 820, 3) - 0.5) * 8
  const ruggedNoise = fbm((warpX + ox) * s * 8.5 + 930, (warpZ + oz) * s * 8.5 + 930, 4)
  const ruggedSigned = ruggedNoise * 2 - 1
  const ridge = 1 - Math.abs(ruggedSigned)
  h += (ridge * 1.1 + ruggedSigned * 0.55) * p.ruggedAmp

  // Mikro dagciklar: hucre bazli dengesiz, kucuk engebe katmani.
  const moundX = (worldX + ox) * s * 13.5
  const moundZ = (worldZ + oz) * s * 13.5
  const baseCellX = Math.floor(moundX)
  const baseCellZ = Math.floor(moundZ)

  for (let ozCell = -1; ozCell <= 1; ozCell++) {
    for (let oxCell = -1; oxCell <= 1; oxCell++) {
      const cellX = baseCellX + oxCell
      const cellZ = baseCellZ + ozCell
      const localX = moundX - (cellX + 0.5)
      const localZ = moundZ - (cellZ + 0.5)
      h += evalMicroMound(cellX, cellZ, localX, localZ, p)
    }
  }

  // Daha belirgin mini dagciklar (knolls): gozle secilen dengesiz tepecikler.
  const knollScale = p.knollScale || 0.17
  const knollX = (worldX + ox) * knollScale
  const knollZ = (worldZ + oz) * knollScale
  const kCellX = Math.floor(knollX)
  const kCellZ = Math.floor(knollZ)

  for (let kz = -1; kz <= 1; kz++) {
    for (let kx = -1; kx <= 1; kx++) {
      const cellX = kCellX + kx
      const cellZ = kCellZ + kz
      const localX = knollX - (cellX + 0.5)
      const localZ = knollZ - (cellZ + 0.5)
      h += evalKnoll(cellX, cellZ, localX, localZ, p)
    }
  }

  for (const zone of p.ruggedZones || []) {
    const dx = worldX - zone.wx
    const dz = worldZ - zone.wz
    const dist = Math.sqrt(dx * dx + dz * dz)
    const influenceRadius = zone.r * 1.75

    if (dist <= influenceRadius) {
      const falloff = 1 - dist / influenceRadius
      const localChaos = (fbm(
        (worldX + ox + zone.wx) * s * 11 + 1200,
        (worldZ + oz + zone.wz) * s * 11 + 1200,
        3,
      ) - 0.5) * 2
      const ripple = Math.sin((worldX * 0.37) + (worldZ * 0.29) + localChaos * 2.4)
      h += (localChaos * 1.25 + ripple * 0.55) * zone.intensity * falloff
    }
  }

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

  // Genel yüzey eğriliği: merkezde kubbe, kenar/koselerde ice katlama etkisi.
  const radial = Math.hypot(worldX, worldZ)
  const radialRaw = radial / mapRadius
  const radialN = Math.max(0, Math.min(1, radialRaw))
  const sphericalCap = Math.sqrt(Math.max(0, 1 - radialN * radialN))
  const curvaturePower = p.curvaturePower || 1.25
  const dome = Math.pow(sphericalCap, curvaturePower)

  const nx = Math.abs(worldX) / mapRadius
  const nz = Math.abs(worldZ) / mapRadius
  const squareN = Math.max(nx, nz)
  const cornerN = Math.min(1, Math.hypot(nx, nz) / Math.SQRT2)

  const edgeFold = smoothstep(0.68, 1.0, squareN)
  const cornerFold = smoothstep(0.72, 1.0, cornerN)

  h += (dome - 0.2) * (p.curvatureLift || 0)
  h -= Math.pow(edgeFold, 2.2) * (p.edgeDrop || 0)
  h -= Math.pow(cornerFold, 2.7) * (p.cornerSink || 24)

  // Kare plane'in dis sinirlarinda da dusus devam etsin.
  if (squareN > 1) {
    const overflow = squareN - 1
    h -= overflow * overflow * (p.cornerSink || 24) * 1.3
  }

  return h
}
