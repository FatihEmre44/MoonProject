/**
 * buildMapData.js
 * Frontend 2D/3D harita verilerini A* algoritması için gerekli parametrelere dönüştür.
 * 
 * Dönüşüm:
 *   - 3D Krater Profili → 2D Grid (CRATERS) + craterMap
 *   - mapGrid: 200×200 (0=safe, 1=crater/obstacle, 2=slope)
 *   - craterMap: { "row,col": { depth, radius } }
 *   - waypoints: [[r,c], [r,c], ...] - sDefaultWaypoints
 */

import { GRID_SIZE, CRATERS, WAYPOINTS } from './sampleData.js';
import { getMapProfile, getTerrainHeight } from './terrainUtils.js';
import {
    TERRAIN_PLANE_SIZE,
    BOULDER_SPREAD_FACTOR,
    LARGE_BOULDER_BLOCK_SCALE,
    buildLargeBoulderObstacles,
} from './obstacleField.js';

const MAP_GRID_TUNING = {
    'low-crater': {
        obstacleScale: 1.2,
        slopeScale: 2.5,
        maxObstacleRatio: 0.38,
        ruggedSlopeThreshold: 0.22,
        extremeSlopeThreshold: 0.38,
        maxExtremeRatio: 0.06,
    },
    'mid-crater': {
        obstacleScale: 1.2,
        slopeScale: 2.5,
        maxObstacleRatio: 0.42,
        ruggedSlopeThreshold: 0.18,
        extremeSlopeThreshold: 0.32,
        maxExtremeRatio: 0.09,
    },
    'high-crater': {
        obstacleScale: 0.95,
        slopeScale: 2.0,
        maxObstacleRatio: 0.36,
        ruggedSlopeThreshold: 0.13,
        extremeSlopeThreshold: 0.23,
        maxExtremeRatio: 0.12,
    },
};

/**
 * Grid koordinatlarının sınır içinde olup olmadığını kontrol et.
 */
function isValidGridCoord(row, col) {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

/**
 * Dünya koordinatlarını (worldX, worldZ) grid koordinatlarına (col, row) dönüştür.
 * GRID_SIZE = 200 olduğunda, center = [100, 100]
 */
function worldToGridCoord(worldX, worldZ, gridSize = GRID_SIZE) {
    const center = (gridSize - 1) / 2;
    const col = Math.round(worldX + center);
    const row = Math.round(worldZ + center);
    return [row, col];
}

function paintCircleOnGrid(grid, centerRow, centerCol, radius, value) {
    const minRow = Math.max(0, Math.floor(centerRow - radius));
    const maxRow = Math.min(GRID_SIZE - 1, Math.ceil(centerRow + radius));
    const minCol = Math.max(0, Math.floor(centerCol - radius));
    const maxCol = Math.min(GRID_SIZE - 1, Math.ceil(centerCol + radius));

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            const dr = row - centerRow;
            const dc = col - centerCol;
            const dist = Math.sqrt(dr * dr + dc * dc);
            if (dist <= radius && (value === 1 || grid[row][col] !== 1)) {
                grid[row][col] = value;
            }
        }
    }
}

function countObstacleCells(grid) {
    let blocked = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === 1) blocked++;
        }
    }
    return blocked;
}

function countCellsByValue(grid, value) {
    let count = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === value) count++;
        }
    }
    return count;
}

function relaxObstacleDensity(grid, maxObstacleRatio) {
    const totalCells = GRID_SIZE * GRID_SIZE;
    let blocked = countObstacleCells(grid);
    if (blocked / totalCells <= maxObstacleRatio) return;

    const center = (GRID_SIZE - 1) / 2;
    const candidates = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] !== 1) continue;
            const distToCenter = Math.hypot(row - center, col - center);
            candidates.push({ row, col, distToCenter });
        }
    }

    // Once merkezdeki kritik engelleri koru, dis halkalari yumusat.
    candidates.sort((a, b) => b.distToCenter - a.distToCenter);

    for (const cell of candidates) {
        if (blocked / totalCells <= maxObstacleRatio) break;
        grid[cell.row][cell.col] = 2;
        blocked--;
    }
}

function addRuggedTerrainLayer(grid, mapId, options = {}) {
    const {
        ruggedSlopeThreshold = 0.35,
        extremeSlopeThreshold = 0.6,
        maxExtremeRatio = 0.1,
    } = options;

    const center = (GRID_SIZE - 1) / 2;
    const sampleOffset = 0.8;

    // 0 = guvenli, 1 = engel, 2 = zorlu egim, 3 = yuksek engebeli alan
    for (let row = 1; row < GRID_SIZE - 1; row++) {
        for (let col = 1; col < GRID_SIZE - 1; col++) {
            if (grid[row][col] === 1) continue;

            const worldX = col - center;
            const worldZ = row - center;

            const hCenter = getTerrainHeight(worldX, worldZ, mapId);
            const hX = getTerrainHeight(worldX + sampleOffset, worldZ, mapId);
            const hZ = getTerrainHeight(worldX, worldZ + sampleOffset, mapId);
            const hXNeg = getTerrainHeight(worldX - sampleOffset, worldZ, mapId);
            const hZNeg = getTerrainHeight(worldX, worldZ - sampleOffset, mapId);
            const hDiag = getTerrainHeight(worldX + sampleOffset, worldZ + sampleOffset, mapId);

            const slopeMetric = Math.max(
                Math.abs(hX - hCenter),
                Math.abs(hZ - hCenter),
                Math.abs(hXNeg - hCenter),
                Math.abs(hZNeg - hCenter),
            );

            const roughnessMetric = (
                Math.abs(hX - hCenter) +
                Math.abs(hZ - hCenter) +
                Math.abs(hXNeg - hCenter) +
                Math.abs(hZNeg - hCenter) +
                Math.abs(hDiag - hCenter)
            ) / 5;

            const terrainMetric = slopeMetric * 0.72 + roughnessMetric * 0.58;

            if (terrainMetric >= extremeSlopeThreshold) {
                grid[row][col] = 3;
            } else if (terrainMetric >= ruggedSlopeThreshold && grid[row][col] === 0) {
                grid[row][col] = 2;
            }
        }
    }

    // Asiri engebeli hucreler cok yogunsa bir kismini zorlu egime indir.
    const totalCells = GRID_SIZE * GRID_SIZE;
    let extremeCount = countCellsByValue(grid, 3);
    if (extremeCount / totalCells <= maxExtremeRatio) return;

    const candidates = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] !== 3) continue;
            const distToCenter = Math.hypot(row - center, col - center);
            candidates.push({ row, col, distToCenter });
        }
    }

    candidates.sort((a, b) => b.distToCenter - a.distToCenter);

    for (const cell of candidates) {
        if (extremeCount / totalCells <= maxExtremeRatio) break;
        grid[cell.row][cell.col] = 2;
        extremeCount--;
    }
}

/**
 * 2D mapGrid oluştur: 200×200 array
 *   0 = Güvenli yol (default)
 *   1 = Engel / Krater (ve çevresi)
 *   2 = Yokuş / Zorlu arazi (krater kenarlarında eğim)
 * 
 * CRATERS array'ındeki kraterleri kullanarak engelleri işaretle.
 * @param {Array} crateres - CRATERS array: [{ col, row, radius }, ...]
 * @returns {number[][]} 200×200 mapGrid
 */
function buildMapGrid(craters, largeBoulders = [], options = {}) {
    const {
        obstacleScale = 1.2,
        slopeScale = 2.5,
        maxObstacleRatio = 0.42,
        mapId = 'mid-crater',
        ruggedSlopeThreshold = 0.35,
        extremeSlopeThreshold = 0.6,
        maxExtremeRatio = 0.1,
    } = options;

    const grid = Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => 0)
    );

    // Her krater için grid'i işaretle
    craters.forEach(({ col, row, radius }) => {
        // Krater etrafında engel/obstacle işaretle
        // radius'ün 1.5 katı içini engel olarak tut (daha güvenli)
        const obstacleRadius = radius * obstacleScale;

        paintCircleOnGrid(grid, row, col, obstacleRadius, 1);
        paintCircleOnGrid(grid, row, col, radius * slopeScale, 2);
    });

    // Sadece buyuk boulder'lar engel: kucuk taslardan gecise izin ver.
    largeBoulders.forEach(({ x, z, radius }) => {
        const [row, col] = worldToGridCoord(x, z);
        paintCircleOnGrid(grid, row, col, radius, 1);
    });

    relaxObstacleDensity(grid, maxObstacleRatio);
    addRuggedTerrainLayer(grid, mapId, {
        ruggedSlopeThreshold,
        extremeSlopeThreshold,
        maxExtremeRatio,
    });

    return grid;
}

/**
 * craterMap objesi oluştur: { "row,col": { depth, radius } }
 * 
 * Krater derinliği heuristic olarak radius'ten hesaplanır:
 *   - Küçük krater (r < 3): depth ~50m
 *   - Orta krater (r 3-5): depth ~100m
 *   - Büyük krater (r > 5): depth ~150m
 * 
 * @param {Array} craters - CRATERS array: [{ col, row, radius }, ...]
 * @returns {Object} { "row,col": { depth, radius } }
 */
function buildCraterMap(craters) {
    const craterMap = {};

    craters.forEach(({ col, row, radius }) => {
        // Derinlik: radius'e göre heusristik
        let depth;
        if (radius < 3) {
            depth = 50 + Math.random() * 30;  // 50-80m
        } else if (radius < 5) {
            depth = 100 + Math.random() * 50; // 100-150m
        } else {
            depth = 150 + Math.random() * 100; // 150-250m
        }

        const key = `${row},${col}`;
        craterMap[key] = {
            depth: Math.round(depth),
            radius: radius,
        };
    });

    return craterMap;
}

function buildBoulderMap(largeBoulders = []) {
    const boulderMap = [];

    largeBoulders.forEach(({ x, z, radius }) => {
        const [row, col] = worldToGridCoord(x, z);
        if (!isValidGridCoord(row, col)) return;

        let sizeClass = 'Kucuk';
        if (radius >= 1.8) {
            sizeClass = 'Buyuk';
        } else if (radius >= 1.25) {
            sizeClass = 'Orta';
        }

        boulderMap.push({
            row,
            col,
            radius: parseFloat(radius.toFixed(2)),
            sizeClass,
        });
    });

    return boulderMap;
}

/**
 * 3D Harita Profili'nden (MAP_PROFILES'deki craters) mapData oluştur.
 * 
 * @param {string} mapId - Harita profili: 'low-crater', 'mid-crater', 'high-crater'
 * @returns {{ mapGrid, craterMap, waypoints }}
 */
export function buildMapDataFromProfile(mapId = 'mid-crater') {
    const profile = getMapProfile(mapId);
    const tuning = MAP_GRID_TUNING[mapId] || MAP_GRID_TUNING['mid-crater'];

    if (!profile || !profile.craters) {
        console.warn(`Profile "${mapId}" bulunamadı, default profile kullanılıyor`);
        return buildMapDataFromProfile('mid-crater');
    }

    // 3D craters (wx, wz, r) → 2D craters (col, row, radius)
    const craters2D = profile.craters.map(({ wx, wz, r }) => {
        const center = (GRID_SIZE - 1) / 2;
        // Krater merkezini float koruyarak world->grid kuantalama kaymasini azalt.
        const col = wx + center;
        const row = wz + center;
        return { col, row, radius: r };
    });

    const largeBoulders = buildLargeBoulderObstacles({
        mapId,
        boulderCount: profile.boulderCount || 0,
        spread: TERRAIN_PLANE_SIZE * BOULDER_SPREAD_FACTOR,
        minBlockingScale: LARGE_BOULDER_BLOCK_SCALE,
    });

    const mapGrid = buildMapGrid(craters2D, largeBoulders, {
        ...tuning,
        mapId,
    });
    const craterMap = buildCraterMap(craters2D);
    const boulderMap = buildBoulderMap(largeBoulders);

    const ruggedCellCount = countCellsByValue(mapGrid, 3);
    const slopeCellCount = countCellsByValue(mapGrid, 2);

    // Waypoints'i kullan (sampleData.js'den geliyor)
    const waypoints = WAYPOINTS || [[0, 0], [100, 100]];

    return {
        mapGrid,
        craterMap,
        boulderMap,
        waypoints,
        metadata: {
            gridSize: GRID_SIZE,
            craterCount: craters2D.length,
            largeBoulderCount: largeBoulders.length,
            ruggedCellCount,
            slopeCellCount,
            mapProfile: mapId,
        },
    };
}

/**
 * Sample craters (sampleData.js'deki CRATERS) kullanarak mapData oluştur.
 * 
 * @returns {{ mapGrid, craterMap, waypoints }}
 */
export function buildMapDataFromSampleData() {
    const mapGrid = buildMapGrid(CRATERS);
    const craterMap = buildCraterMap(CRATERS);
    const boulderMap = [];
    const waypoints = WAYPOINTS || [[0, 0], [100, 100]];

    return {
        mapGrid,
        craterMap,
        boulderMap,
        waypoints,
        metadata: {
            gridSize: GRID_SIZE,
            craterCount: CRATERS.length,
            mapProfile: 'sample-data',
        },
    };
}

/**
 * API'ye göndermek için tam request payload oluştur.
 * 
 * @param {number[][]} mapGrid - 2D harita
 * @param {Object} craterMap - Krater verisi
 * @param {number[][]} waypoints - Waypoint listesi
 * @param {number[]} startNode - Başlangıç [row, col] (default: ilk waypoint)
 * @param {number[]} targetNode - Hedef [row, col] (default: son waypoint)
 * @returns {Object} API request payload
 */
export function createAstarRequest(mapGrid, craterMap, waypoints, startNode = null, targetNode = null, boulderMap = []) {
    if (!waypoints || waypoints.length < 2) {
        throw new Error('Minimum 2 waypoint gereklidir (başlangıç + hedef)');
    }

    const start = startNode || waypoints[0];
    const target = targetNode || waypoints[waypoints.length - 1];

    // Single route request
    if (waypoints.length === 2) {
        return {
            mapGrid,
            startNode: start,
            targetNode: target,
            craterMap,
            boulderMap,
        };
    }

    // Multi-route request
    return {
        mapGrid,
        waypoints,
        craterMap,
        boulderMap,
    };
}

/**
 * Backend API'ye istek gönder (/plan-route veya /plan-multi-route)
 * 
 * @param {Object} mapData - { mapGrid, craterMap, waypoints, metadata }
 * @param {string} apiBase - Backend URL (default: http://localhost:3000)
 * @param {boolean} useMultiRoute - true ise multi-route kullan
 * @returns {Promise<Object>} API cevabı
 */
export async function sendAstarRequest(mapData, apiBase = 'http://localhost:3000', useMultiRoute = false) {
    const { mapGrid, craterMap, waypoints, boulderMap = [] } = mapData;

    let endpoint = useMultiRoute || waypoints.length > 2
        ? '/api/plan-multi-route'
        : '/api/plan-route';

    let payload;
    if (useMultiRoute || waypoints.length > 2) {
        payload = {
            mapGrid,
            waypoints,
            craterMap,
            boulderMap,
        };
    } else {
        payload = createAstarRequest(mapGrid, craterMap, waypoints, null, null, boulderMap);
    }

    try {
        const response = await fetch(`${apiBase}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API hatası oluştu');
        }

        return data;
    } catch (error) {
        console.error('A* API çağırma hatası:', error);
        throw error;
    }
}
/**
 * Quick tester: Console'da test etmek için
 * window.testMapData()
 */
if (typeof window !== 'undefined') {
    window.testMapData = () => {
        const data = buildMapDataFromProfile('mid-crater');
        console.log('📊 mapGrid (100x100 örneği):', data.mapGrid.slice(0, 10).map(row => row.slice(0, 10)));
        console.log('🌋 craterMap:', Object.entries(data.craterMap).slice(0, 3));
        console.log('🛤️ waypoints:', data.waypoints);
        console.log('📈 metadata:', data.metadata);
        return data;
    };
}
export default {
    buildMapDataFromProfile,
    buildMapDataFromSampleData,
    createAstarRequest,
    sendAstarRequest,
};
