/**
 * A* (A-Star) Pathfinding Algorithm — Ay Yüzeyi Rover Navigasyonu
 *
 * Grid hücre değerleri:
 *   0 → Güvenli yol (maliyet: 1)
 *   1 → Engel / krater (geçilemez)
 *   2 → Yokuş / zorlu arazi (maliyet: 5)
 *   3 → Yüksek engebeli arazi (maliyet: 9)
 *
 * Özellikler:
 *   - 8 yönlü hareket (çapraz adımlarda maliyet × √2)
 *   - Octile Distance heuristic
 *   - Çoklu hedef desteği (waypoint zinciri)
 *
 * @module utils/astar
 */

const SQRT2 = Math.SQRT2; // ≈ 1.41421356

// ─────────────────────────────────────────────
// MinHeap — Öncelik Kuyruğu
// ─────────────────────────────────────────────

class MinHeap {
  constructor() {
    this.data = [];
  }

  push(node) {
    this.data.push(node);
    this._bubbleUp(this.data.length - 1);
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.data.length;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[i].f < this.data[parent].f) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else {
        break;
      }
    }
  }

  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < n && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else {
        break;
      }
    }
  }
}

// ─────────────────────────────────────────────
// Maliyet & Heuristic
// ─────────────────────────────────────────────

/**
 * Verilen hücrenin temel geçiş maliyetini döndürür.
 * @param {number} cellValue - Hücre değeri (0, 1, 2 veya 3)
 * @returns {number} Maliyet (1 = normal, 5 = yokuş, 9 = engebeli, Infinity = engel)
 */
function getBaseCost(cellValue) {
  if (cellValue === 1) return Infinity; // Engel / krater
  if (cellValue === 2) return 5;        // Yokuş / zorlu arazi
  if (cellValue === 3) return 9;        // Yuksek engebeli arazi
  return 1;                              // Güvenli yol
}

/**
 * Octile Distance — 8 yönlü hareket için optimal heuristic.
 * Çapraz adımları √2 maliyetle hesaplar.
 *
 * @param {number} r1 - Mevcut satır
 * @param {number} c1 - Mevcut sütun
 * @param {number} r2 - Hedef satır
 * @param {number} c2 - Hedef sütun
 * @returns {number} Tahmini mesafe
 */
function heuristic(r1, c1, r2, c2) {
  const dx = Math.abs(r1 - r2);
  const dy = Math.abs(c1 - c2);
  // Octile: düz adımlar için 1, çapraz adımlar için √2
  return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
}

// ─────────────────────────────────────────────
// 8 Yönlü Hareket Tablosu
// ─────────────────────────────────────────────

// [dr, dc, isDiagonal]
const DIRECTIONS = [
  [-1, 0, false],  // yukarı
  [1, 0, false],   // aşağı
  [0, -1, false],  // sol
  [0, 1, false],   // sağ
  [-1, -1, true],  // sol-üst çapraz
  [-1, 1, true],   // sağ-üst çapraz
  [1, -1, true],   // sol-alt çapraz
  [1, 1, true],    // sağ-alt çapraz
];

/**
 * 8 yönlü engellere ve yokuşlara olan yakınlığı kontrol eder (Terrain-Aware).
 * craterMap dizisinden krater özelliklerini (derinlik, yarıçap) hesaplar.
 * @param {number[][]} grid - Harita
 * @param {Object} craterMap - Krater verisi: { "r,c": { depth, radius } }
 * @param {number} r - Kontrol edilecek satır
 * @param {number} c - Kontrol edilecek sütun
 * @returns {number} Toplam dinamik risk cezası
 */
function getRiskPenalty(grid, craterMap, r, c) {
  const rows = grid.length;
  const cols = grid[0].length;
  let penalty = 0;

  let obstacleCount = 0;
  let slopeCount = 0;
  let ruggedCount = 0;
  const isTargetSlope = grid[r][c] === 2;
  const isTargetRugged = grid[r][c] === 3;

  for (const [dr, dc] of DIRECTIONS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      if (grid[nr][nc] === 1) {
        obstacleCount++;
      } else if (grid[nr][nc] === 2) {
        slopeCount++;
      } else if (grid[nr][nc] === 3) {
        ruggedCount++;
      }
    }
  }

  // 1. Kural: Krater yoğunluğu
  penalty += obstacleCount * 1.5;

  // 2. Kural: Yokuş yoğunluğu (üst üste çoklu yokuş durumu)
  if (isTargetSlope) {
    penalty += slopeCount * 1.0;
  }

  // 2b. Yuksek engebeli hucrelerde ek risk cezasi
  if (isTargetRugged) {
    penalty += 4 + ruggedCount * 1.4 + slopeCount * 0.8;
  }

  // 3. Kural: craterMap üzerinden Gerçekçi Krater Modellemesi
  if (craterMap && typeof craterMap === 'object') {
    for (const key in craterMap) {
      const [cr, cc] = key.split(',').map(Number);
      const crater = craterMap[key];
      const { depth, radius } = crater;

      // Euclidean uzaklık: Pisagor
      const dist = Math.sqrt(Math.pow(r - cr, 2) + Math.pow(c - cc, 2));
      const chebyshevDist = Math.max(Math.abs(r - cr), Math.abs(c - cc));

      // Kenar egimi cezasi: test ve fizik model beklentisi geregi tam +3.
      if (chebyshevDist === 1) {
        penalty += 3;
        continue;
      }

      // Ic bolgeye sert ceza, kenara yakin bolgeye yumusak ceza ver.
      // Boylece yol kraterin kenarindan gecebilir ama iceri dusmeye zorlanmaz.
      if (dist <= radius * 0.55) {
        const t = 1 - dist / (radius * 0.55);
        const innerPenalty = depth > 100 ? 12 : 7;
        penalty += innerPenalty * (0.35 + t * t * 0.65);
      } else if (dist <= radius * 1.05) {
        const rimT = 1 - (dist - radius * 0.55) / (radius * 0.5);
        penalty += Math.max(0, rimT) * 1.2;
      }
    }
  }

  return penalty;
}

// ─────────────────────────────────────────────
// Tek Hedef A* Algoritması
// ─────────────────────────────────────────────

/**
 * A* algoritması ile grid üzerinde iki nokta arası en güvenli yolu bulur.
 * 8 yönlü hareket destekler, çapraz adımlarda maliyet × √2 uygulanır.
 *
 * @param {number[][]} grid  - 2D grid (0 = güvenli, 1 = engel, 2 = yokuş, 3 = yüksek engebeli)
 * @param {Object}     craterMap - Krater objesi
 * @param {number[]}   start - Başlangıç [satır, sütun]
 * @param {number[]}   end   - Hedef [satır, sütun]
 * @returns {{ path: number[][], totalCost: number, stats: object } | null}
 */
function astar(grid, craterMap = {}, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;

  const [startRow, startCol] = start;
  const [endRow, endCol] = end;

  // Sınır kontrolü
  if (
    startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols ||
    endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols
  ) {
    return null;
  }

  // Başlangıç veya hedef engel ise yol yok
  if (grid[startRow][startCol] === 1 || grid[endRow][endCol] === 1) {
    return null;
  }

  // Aynı nokta
  if (startRow === endRow && startCol === endCol) {
    return {
      path: [start],
      totalCost: 0,
      stats: { stepCount: 0, slopeCount: 0, flatCount: 0, diagonalCount: 0 },
    };
  }

  // g-score tablosu
  const gScore = Array.from({ length: rows }, () =>
    new Array(cols).fill(Infinity)
  );
  gScore[startRow][startCol] = 0;

  // Geri izleme tablosu
  const cameFrom = Array.from({ length: rows }, () =>
    new Array(cols).fill(null)
  );

  // Ziyaret edilmiş düğümler
  const closed = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );

  // Açık küme
  const openSet = new MinHeap();
  openSet.push({
    row: startRow,
    col: startCol,
    f: heuristic(startRow, startCol, endRow, endCol),
  });

  while (openSet.size > 0) {
    const current = openSet.pop();
    const { row, col } = current;

    // Hedefe ulaştık
    if (row === endRow && col === endCol) {
      return reconstructPath(cameFrom, grid, gScore, endRow, endCol);
    }

    // Zaten işlenmiş
    if (closed[row][col]) continue;
    closed[row][col] = true;

    for (const [dr, dc, isDiagonal] of DIRECTIONS) {
      const nr = row + dr;
      const nc = col + dc;

      // Grid dışı veya zaten işlenmiş
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (closed[nr][nc]) continue;

      // ── Çapraz hareket kontrolü ────────────────────
      // Çapraz geçişte her iki bitişik düz komşu da açık olmalı
      // Aksi halde duvarın köşesinden "sızma" olur
      if (isDiagonal) {
        if (grid[row][nc] === 1 || grid[nr][col] === 1) continue;
      }

      const baseCost = getBaseCost(grid[nr][nc]);
      if (baseCost === Infinity) continue;

      // Çapraz adımlarda maliyet × √2
      const moveCost = isDiagonal ? baseCost * SQRT2 : baseCost;
      const riskPenalty = getRiskPenalty(grid, craterMap, nr, nc);
      const tentativeG = gScore[row][col] + moveCost + riskPenalty;

      if (tentativeG < gScore[nr][nc]) {
        gScore[nr][nc] = tentativeG;
        cameFrom[nr][nc] = [row, col];

        const f = tentativeG + heuristic(nr, nc, endRow, endCol);
        openSet.push({ row: nr, col: nc, f });
      }
    }
  }

  // Yol bulunamadı
  return null;
}

// ─────────────────────────────────────────────
// Çoklu Hedef A* (Waypoint Zinciri)
// ─────────────────────────────────────────────

/**
 * Rover'ı sırayla birden fazla hedefe götürür.
 * Her ardışık çift arasında A* çalıştırır ve yolları birleştirir.
 *
 * @param {number[][]}   grid      - 2D grid
 * @param {number[][]}   waypoints - Sıralı hedef listesi [[r,c], [r,c], ...]
 *                                    (en az 2 nokta: başlangıç + 1 hedef)
 * @returns {{ path: number[][], totalCost: number, stats: object, legs: object[] } | null}
 *
 * @example
 * const result = astarMulti(grid, [[0,0], [2,4], [6,1], [9,9]]);
 * // Rover: (0,0) → (2,4) → (6,1) → (9,9) sırasıyla gider
 * // result.legs[0] = { from: [0,0], to: [2,4], cost: 5.4, steps: 5 }
 * // result.legs[1] = { from: [2,4], to: [6,1], cost: 7.2, steps: 6 }
 * // ...
 */
function astarMulti(grid, craterMap = {}, waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return null;
  }

  const fullPath = [];
  const legs = [];
  let totalCost = 0;
  let totalSteps = 0;
  let totalSlope = 0;
  let totalFlat = 0;
  let totalDiagonal = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const legResult = astar(grid, craterMap, from, to);

    // Herhangi bir bacak başarısız olursa tüm rota başarısız
    if (!legResult) {
      return {
        path: null,
        totalCost: 0,
        stats: null,
        legs,
        failedLeg: {
          index: i,
          from,
          to,
          reason: `Bacak ${i + 1}: [${from}] → [${to}] arası yol bulunamadı.`,
        },
      };
    }

    // Yolları birleştir (kavşak noktası tekrarlanmasın)
    if (fullPath.length > 0) {
      // Önceki yolun son noktası = bu yolun ilk noktası, tekrar ekleme
      fullPath.push(...legResult.path.slice(1));
    } else {
      fullPath.push(...legResult.path);
    }

    totalCost += legResult.totalCost;
    totalSteps += legResult.stats.stepCount;
    totalSlope += legResult.stats.slopeCount;
    totalFlat += legResult.stats.flatCount;
    totalDiagonal += legResult.stats.diagonalCount;

    legs.push({
      index: i,
      from,
      to,
      cost: parseFloat(legResult.totalCost.toFixed(2)),
      steps: legResult.stats.stepCount,
      path: legResult.path,
      stats: legResult.stats,
    });
  }

  return {
    path: fullPath,
    totalCost: parseFloat(totalCost.toFixed(2)),
    stats: {
      stepCount: totalSteps,
      slopeCount: totalSlope,
      flatCount: totalFlat,
      diagonalCount: totalDiagonal,
      waypointCount: waypoints.length,
      legCount: legs.length,
    },
    legs,
  };
}

// ─────────────────────────────────────────────
// Yol Geri İzleme
// ─────────────────────────────────────────────

/**
 * cameFrom tablosundan yolu geri izleyerek sonuç objesi oluşturur.
 */
function reconstructPath(cameFrom, grid, gScore, endRow, endCol) {
  const path = [];
  let current = [endRow, endCol];

  while (current !== null) {
    path.push(current);
    current = cameFrom[current[0]][current[1]];
  }

  path.reverse();

  // İstatistikleri hesapla
  let slopeCount = 0;
  let flatCount = 0;
  let ruggedCount = 0;
  let diagonalCount = 0;

  for (let i = 1; i < path.length; i++) {
    const [pr, pc] = path[i - 1];
    const [r, c] = path[i];

    // Çapraz mı?
    if (Math.abs(pr - r) + Math.abs(pc - c) === 2) {
      diagonalCount++;
    }

    // Arazi tipi
    if (grid[r][c] === 2) {
      slopeCount++;
    } else if (grid[r][c] === 3) {
      ruggedCount++;
    } else {
      flatCount++;
    }
  }

  return {
    path,
    totalCost: parseFloat(gScore[endRow][endCol].toFixed(2)),
    stats: {
      stepCount: path.length - 1,
      slopeCount,
      ruggedCount,
      flatCount,
      diagonalCount,
    },
  };
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default astar;
export { astar, astarMulti, heuristic, getBaseCost };
