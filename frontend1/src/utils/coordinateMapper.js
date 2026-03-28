/**
 * coordinateMapper.js
 * Converts 2D grid coordinates ↔ 3D world positions (terrain-aware).
 */
import { getTerrainHeight } from './terrainUtils';

const TILE_SIZE = 1;

/**
 * Grid [col, row] → world {x, y, z}. y = terrain height + yOffset.
 */
export function gridToWorld(gridCol, gridRow, options = {}) {
  const { gridWidth = 200, gridHeight = 200, yOffset = 0, useTerrainHeight = false } = options;
  const x = (gridCol - (gridWidth - 1) / 2) * TILE_SIZE;
  const z = (gridRow - (gridHeight - 1) / 2) * TILE_SIZE;
  const y = useTerrainHeight ? getTerrainHeight(x, z) + yOffset : yOffset;
  return { x, y, z };
}

/**
 * World {x, z} → nearest grid {col, row}.
 */
export function worldToGrid(worldX, worldZ, options = {}) {
  const { gridWidth = 200, gridHeight = 200 } = options;
  const col = Math.round(worldX / TILE_SIZE + (gridWidth - 1) / 2);
  const row = Math.round(worldZ / TILE_SIZE + (gridHeight - 1) / 2);
  return { col, row };
}

/**
 * Array of [col, row] → Array of [x, y, z] with terrain height.
 */
export function pathToWorld(path, options = {}) {
  const { yOffset = 0.15, ...rest } = options;
  return path.map(([col, row]) => {
    const { x, z } = gridToWorld(col, row, rest);
    const y = getTerrainHeight(x, z) + yOffset;
    return [x, y, z];
  });
}
