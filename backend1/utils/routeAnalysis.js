function parseCraterEntries(craterMap = {}) {
    if (!craterMap || typeof craterMap !== 'object') return [];

    return Object.entries(craterMap)
        .map(([key, crater]) => {
            const [row, col] = key.split(',').map(Number);
            if (!Number.isFinite(row) || !Number.isFinite(col)) return null;

            return {
                row,
                col,
                radius: Number(crater?.radius || 0),
                depth: Number(crater?.depth || 0),
            };
        })
        .filter(Boolean);
}

function distanceToPath(row, col, path = []) {
    if (!Array.isArray(path) || path.length === 0) return Infinity;

    let minDist = Infinity;
    for (const [pr, pc] of path) {
        const dist = Math.hypot(pr - row, pc - col);
        if (dist < minDist) minDist = dist;
    }

    return minDist;
}

function chebyshevDistance(aRow, aCol, bRow, bCol) {
    return Math.max(Math.abs(aRow - bRow), Math.abs(aCol - bCol));
}

function analyzeCraterPathRelation(crater, path = []) {
    let minDist = Infinity;
    let minChebyshev = Infinity;

    for (const [pr, pc] of path) {
        const dist = Math.hypot(pr - crater.row, pc - crater.col);
        if (dist < minDist) minDist = dist;

        const cheb = chebyshevDistance(pr, pc, crater.row, crater.col);
        if (cheb < minChebyshev) minChebyshev = cheb;
    }

    // A* getRiskPenalty mantigina yakin: kenar komsulugu veya crater etki yaricapi
    const astarInfluence = minChebyshev === 1 || minDist <= crater.radius * 1.05;

    // Operasyonel yorum icin daha genis "rota cevresi" tanimi.
    const nearbyVisual = minDist <= Math.max(crater.radius * 1.8, crater.radius + 3.5);

    return {
        minDist,
        minChebyshev,
        astarInfluence,
        nearbyVisual,
    };
}

function classifyCraterSize(radius) {
    if (radius >= 5) return 'buyuk';
    if (radius >= 3) return 'orta';
    return 'kucuk';
}

function classifyBoulderSize(radius) {
    if (radius >= 1.8) return 'buyuk';
    if (radius >= 1.25) return 'orta';
    return 'kucuk';
}

function tallySizes(items, classifier) {
    const counts = { kucuk: 0, orta: 0, buyuk: 0 };

    for (const item of items) {
        const size = classifier(item.radius);
        counts[size] += 1;
    }

    return counts;
}

function summarizePathExposure(grid, path = []) {
    if (!Array.isArray(path) || path.length === 0) {
        return {
            nearObstacleSteps: 0,
            nearObstacleRatio: 0,
        };
    }

    const rows = grid.length;
    const cols = grid[0].length;
    const neighbors = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];

    let nearObstacleSteps = 0;

    for (const [r, c] of path) {
        let isNearObstacle = false;

        for (const [dr, dc] of neighbors) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (grid[nr][nc] === 1) {
                isNearObstacle = true;
                break;
            }
        }

        if (isNearObstacle) nearObstacleSteps += 1;
    }

    return {
        nearObstacleSteps,
        nearObstacleRatio: parseFloat((nearObstacleSteps / path.length).toFixed(2)),
    };
}

function round(value, digits = 2) {
    if (!Number.isFinite(value)) return 0;
    return parseFloat(value.toFixed(digits));
}

export function analyzeRouteContext({
    mapGrid,
    path,
    craterMap = {},
    boulderMap = [],
    totalCost = 0,
    stats = {},
    startNode = null,
    targetNode = null,
}) {
    if (!Array.isArray(path) || path.length === 0 || !Array.isArray(mapGrid) || mapGrid.length === 0) {
        return {
            startNode,
            targetNode,
            astarMetrics: {
                totalCost: round(totalCost),
                stepCount: stats?.stepCount || 0,
                diagonalCount: stats?.diagonalCount || 0,
                slopeCount: stats?.slopeCount || 0,
                ruggedCount: stats?.ruggedCount || 0,
                averageCostPerStep: 0,
            },
            craterSummary: {
                routeNearbyCount: 0,
                averageRadius: 0,
                averageDepth: 0,
                maxDepth: 0,
                sizeBreakdown: { kucuk: 0, orta: 0, buyuk: 0 },
            },
            boulderSummary: {
                routeNearbyCount: 0,
                averageRadius: 0,
                maxRadius: 0,
                sizeBreakdown: { kucuk: 0, orta: 0, buyuk: 0 },
            },
            routeExposure: {
                nearObstacleSteps: 0,
                nearObstacleRatio: 0,
            },
        };
    }

    const craterEntries = parseCraterEntries(craterMap);
    const corridorPadding = 2;

    const craterRelations = craterEntries.map((crater) => ({
        ...crater,
        relation: analyzeCraterPathRelation(crater, path),
    }));

    const nearbyCraters = craterRelations.filter((crater) => crater.relation.nearbyVisual);
    const astarInfluencedCraters = craterRelations.filter((crater) => crater.relation.astarInfluence);

    const nearbyBoulders = (Array.isArray(boulderMap) ? boulderMap : []).filter((boulder) => {
        const row = Number(boulder?.row);
        const col = Number(boulder?.col);
        const radius = Number(boulder?.radius || 0);
        if (!Number.isFinite(row) || !Number.isFinite(col)) return false;

        const minDist = distanceToPath(row, col, path);
        return minDist <= radius + 1.5;
    });

    const craterAverageRadius = nearbyCraters.length
        ? nearbyCraters.reduce((sum, c) => sum + c.radius, 0) / nearbyCraters.length
        : 0;

    const craterAverageDepth = nearbyCraters.length
        ? nearbyCraters.reduce((sum, c) => sum + c.depth, 0) / nearbyCraters.length
        : 0;

    const boulderAverageRadius = nearbyBoulders.length
        ? nearbyBoulders.reduce((sum, b) => sum + Number(b.radius || 0), 0) / nearbyBoulders.length
        : 0;

    const averageCostPerStep = stats?.stepCount
        ? totalCost / stats.stepCount
        : 0;

    return {
        startNode,
        targetNode,
        astarMetrics: {
            totalCost: round(totalCost),
            stepCount: stats?.stepCount || 0,
            diagonalCount: stats?.diagonalCount || 0,
            slopeCount: stats?.slopeCount || 0,
            ruggedCount: stats?.ruggedCount || 0,
            averageCostPerStep: round(averageCostPerStep),
        },
        craterSummary: {
            routeNearbyCount: nearbyCraters.length,
            astarInfluenceCount: astarInfluencedCraters.length,
            averageRadius: round(craterAverageRadius),
            averageDepth: round(craterAverageDepth),
            maxDepth: round(Math.max(0, ...nearbyCraters.map((c) => c.depth))),
            sizeBreakdown: tallySizes(nearbyCraters, classifyCraterSize),
        },
        boulderSummary: {
            routeNearbyCount: nearbyBoulders.length,
            averageRadius: round(boulderAverageRadius),
            maxRadius: round(Math.max(0, ...nearbyBoulders.map((b) => Number(b.radius || 0)))),
            sizeBreakdown: tallySizes(nearbyBoulders, classifyBoulderSize),
        },
        routeExposure: summarizePathExposure(mapGrid, path),
    };
}
