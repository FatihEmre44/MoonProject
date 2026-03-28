import { seededRandom } from './terrainUtils.js';

export const TERRAIN_PLANE_SIZE = 210;
export const ROCK_SPREAD_FACTOR = 0.88;
export const BOULDER_SPREAD_FACTOR = 0.82;
export const LARGE_BOULDER_BLOCK_SCALE = 0.95;

function hashStringSeed(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function createMapRandom(mapId, baseSeed) {
  return seededRandom((baseSeed ^ hashStringSeed(mapId)) | 0);
}

export function generateRockInstances({
  mapId,
  count,
  spread = TERRAIN_PLANE_SIZE * ROCK_SPREAD_FACTOR,
}) {
  const rng = createMapRandom(mapId, 42);
  const instances = [];

  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * spread;
    const z = (rng() - 0.5) * spread;
    const scale = 0.06 + rng() * 0.28;

    instances.push({
      x,
      z,
      scaleX: scale,
      scaleY: scale * (0.3 + rng() * 0.7),
      scaleZ: scale,
      rotX: rng() * Math.PI,
      rotY: rng() * Math.PI,
      rotZ: rng() * Math.PI,
    });
  }

  return instances;
}

export function generateBoulderInstances({
  mapId,
  count,
  spread = TERRAIN_PLANE_SIZE * BOULDER_SPREAD_FACTOR,
}) {
  const rng = createMapRandom(mapId, 777);
  const instances = [];

  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * spread;
    const z = (rng() - 0.5) * spread;
    const scale = 0.4 + rng() * 1.0;
    const scaleZ = scale * (0.6 + rng() * 0.4);

    instances.push({
      x,
      z,
      scale,
      scaleX: scale,
      scaleY: scale * (0.3 + rng() * 0.5),
      scaleZ,
      rotX: rng() * Math.PI,
      rotY: rng() * Math.PI,
      rotZ: rng() * 0.5 * Math.PI,
    });
  }

  return instances;
}

export function buildLargeBoulderObstacles({
  mapId,
  boulderCount,
  spread = TERRAIN_PLANE_SIZE * BOULDER_SPREAD_FACTOR,
  minBlockingScale = LARGE_BOULDER_BLOCK_SCALE,
  roverClearance = 0.35,
}) {
  return generateBoulderInstances({ mapId, count: boulderCount, spread })
    .filter((boulder) => boulder.scale >= minBlockingScale)
    .map((boulder) => ({
      x: boulder.x,
      z: boulder.z,
      radius: Math.max(boulder.scaleX, boulder.scaleZ) + roverClearance,
    }));
}
