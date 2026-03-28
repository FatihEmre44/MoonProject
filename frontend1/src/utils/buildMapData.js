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
import { getMapProfile } from './terrainUtils.js';

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
function buildMapGrid(craters) {
    const grid = Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => 0)
    );

    // Her krater için grid'i işaretle
    craters.forEach(({ col, row, radius }) => {
        // Krater etrafında engel/obstacle işaretle
        // radius'ün 1.5 katı içini engel olarak tut (daha güvenli)
        const obstacleRadius = radius * 1.2;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const dist = Math.sqrt(Math.pow(r - row, 2) + Math.pow(c - col, 2));

                // Krater merkezine çok yakın: engel (1)
                if (dist <= obstacleRadius) {
                    grid[r][c] = 1;
                }
                // Krater kenarındaki eğim (slope): 2
                // Not: Bir hucre bir kez engel (1) olduysa daha sonra 2 ile ezilmemeli.
                else if (dist <= radius * 2.5 && grid[r][c] !== 1) {
                    grid[r][c] = 2;
                }
            }
        }
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

/**
 * 3D Harita Profili'nden (MAP_PROFILES'deki craters) mapData oluştur.
 * 
 * @param {string} mapId - Harita profili: 'low-crater', 'mid-crater', 'high-crater'
 * @returns {{ mapGrid, craterMap, waypoints }}
 */
export function buildMapDataFromProfile(mapId = 'mid-crater') {
    const profile = getMapProfile(mapId);

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

    const mapGrid = buildMapGrid(craters2D);
    const craterMap = buildCraterMap(craters2D);

    // Waypoints'i kullan (sampleData.js'den geliyor)
    const waypoints = WAYPOINTS || [[0, 0], [100, 100]];

    return {
        mapGrid,
        craterMap,
        waypoints,
        metadata: {
            gridSize: GRID_SIZE,
            craterCount: craters2D.length,
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
    const waypoints = WAYPOINTS || [[0, 0], [100, 100]];

    return {
        mapGrid,
        craterMap,
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
export function createAstarRequest(mapGrid, craterMap, waypoints, startNode = null, targetNode = null) {
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
        };
    }

    // Multi-route request
    return {
        mapGrid,
        waypoints,
        craterMap,
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
    const { mapGrid, craterMap, waypoints } = mapData;

    let endpoint = useMultiRoute || waypoints.length > 2
        ? '/api/plan-multi-route'
        : '/api/plan-route';

    let payload;
    if (useMultiRoute || waypoints.length > 2) {
        payload = {
            mapGrid,
            waypoints,
            craterMap,
        };
    } else {
        payload = createAstarRequest(mapGrid, craterMap, waypoints);
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
