/**
 * Telemetri Hesaplama Modülü
 *
 * A* algoritmasının döndürdüğü { path, totalCost, stats } verisini alarak
 * batarya tüketimi, risk skoru ve detaylı analiz raporu üretir.
 *
 * @module utils/telemetry
 */

/**
 * Yol üzerindeki her adımın engel hücrelerine (1) olan yakınlığını analiz eder.
 * Bir adım, 4 yönde (yukarı/aşağı/sol/sağ) komşu bir engele sahipse
 * "tehlikeli" sayılır. Çapraz komşular da kontrol edilir.
 *
 * @param {number[][]} path - Koordinat dizisi [[r,c], ...]
 * @param {number[][]} grid - Orijinal harita grid'i
 * @returns {{ dangerCount: number, dangerRatio: number, dangerZones: number[][] }}
 */
function analyzeObstacleProximity(path, grid) {
  const rows = grid.length;
  const cols = grid[0].length;

  // 8 yönlü komşuluk (düz + çapraz)
  const neighbors = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  const dangerZones = [];

  for (const [r, c] of path) {
    let isNearObstacle = false;

    for (const [dr, dc] of neighbors) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (grid[nr][nc] === 1) {
          isNearObstacle = true;
          break;
        }
      }
    }

    if (isNearObstacle) {
      dangerZones.push([r, c]);
    }
  }

  const dangerCount = dangerZones.length;
  const dangerRatio = path.length > 0
    ? parseFloat((dangerCount / path.length).toFixed(2))
    : 0;

  return { dangerCount, dangerRatio, dangerZones };
}

/**
 * Batarya tuketimini niteliksel seviyeye cevirir.
 * Bu alan AI raporlarinda ham yuzde yerine kullanilir.
 */
function classifyBatteryUsage(batteryPercent) {
  if (batteryPercent <= 30) return 'Dusuk';
  if (batteryPercent <= 60) return 'Orta';
  if (batteryPercent <= 100) return 'Yuksek';
  if (batteryPercent <= 160) return 'Cok Yuksek';
  return 'Asiri Yuksek';
}

/**
 * A* sonucundan telemetri raporu üretir.
 *
 * @param {object}     astarResult       - astar() fonksiyonunun döndürdüğü obje
 * @param {number[][]} astarResult.path  - Koordinat dizisi
 * @param {number}     astarResult.totalCost - Toplam yol maliyeti
 * @param {object}     astarResult.stats - { stepCount, slopeCount, flatCount }
 * @param {number[][]} grid              - Orijinal harita grid'i (engel yakınlığı için)
 * @returns {object}   Telemetri raporu
 *
 * @example
 * const astar = require('./astar');
 * const { calculateTelemetry } = require('./telemetry');
 *
 * const result = astar(grid, [0,0], [4,4]);
 * const telemetry = calculateTelemetry(result, grid);
 *
 * // telemetry:
 * // {
 * //   batteryUsage: "%5.6",
 * //   batteryPercent: 5.6,
 * //   riskScore: "Düşük",
 * //   riskDetails: {
 * //     costPerStep: 1,
 * //     slopeRatio: 0,
 * //     dangerRatio: 0.25,
 * //     dangerZones: [[1,0], [2,0]],
 * //   },
 * //   summary: { ... },
 * //   status: "Rota Güvenli"
 * // }
 */
function calculateTelemetry(astarResult, grid) {
  if (!astarResult) {
    return {
      batteryUsage: '%0',
      batteryPercent: 0,
      batteryLevel: 'Dusuk',
      riskScore: 'Hesaplanamadı',
      riskDetails: null,
      summary: null,
      status: 'Rota Bulunamadı',
    };
  }

  const { path, totalCost, stats } = astarResult;
  const { stepCount, slopeCount, flatCount, diagonalCount = 0 } = stats;

  // Çoklu hedef (astarMulti) desteği: her bacak için ayrı telemetri hesapla
  let legsReport = null;
  if (astarResult.legs && astarResult.legs.length > 0) {
    legsReport = astarResult.legs.map((leg) => {
      // Recursive çağrı: A* tekil sonuç formatını taklit et
      return calculateTelemetry({ path: leg.path, totalCost: leg.cost, stats: leg.stats }, grid);
    });
  }

  // ─────────────────────────────────────
  // 1. BATARYA TÜKETİMİ
  // ─────────────────────────────────────
  // Formül: (totalCost * 0.7) + (diagonal çapraz adımlar * 0.3)
  const batteryPercent = parseFloat(((totalCost * 0.7) + (diagonalCount * 0.3)).toFixed(1));
  const batteryUsage = `%${batteryPercent}`;
  const batteryLevel = classifyBatteryUsage(batteryPercent);

  // ─────────────────────────────────────
  // 2. RİSK SKORU
  // ─────────────────────────────────────

  // 2a. Maliyet bazlı risk: totalCost / stepCount > 2 → Yüksek
  const costPerStep = stepCount > 0
    ? parseFloat((totalCost / stepCount).toFixed(2))
    : 0;
  const isCostRisky = costPerStep > 2;

  // 2b. Yokuş oranı
  const slopeRatio = stepCount > 0
    ? parseFloat((slopeCount / stepCount).toFixed(2))
    : 0;

  // 2c. Engel yakınlığı analizi
  const proximity = analyzeObstacleProximity(path, grid);
  const isProximityRisky = proximity.dangerRatio > 0.5; // Yolun %50'den fazlası engele yakınsa

  // Risk kararı: maliyet VEYA engel yakınlığı yüksekse → Yüksek
  let riskScore;
  if (isCostRisky && isProximityRisky) {
    riskScore = 'Kritik';
  } else if (isCostRisky || isProximityRisky) {
    riskScore = 'Yüksek';
  } else if (proximity.dangerRatio > 0.25 || slopeRatio > 0.3) {
    riskScore = 'Orta';
  } else {
    riskScore = 'Düşük';
  }

  // ─────────────────────────────────────
  // 3. ÖZET ve DURUM
  // ─────────────────────────────────────
  const summary = {
    totalSteps: stepCount,
    totalCost,
    slopeSteps: slopeCount,
    flatSteps: flatCount,
    diagonalSteps: diagonalCount,
    slopeRatio,
    obstacleNearSteps: proximity.dangerCount,
  };

  let status;
  if (riskScore === 'Kritik') {
    status = 'Rota Tehlikeli — Alternatif önerilir';
  } else if (riskScore === 'Yüksek') {
    status = 'Rota Riskli — Dikkatli ilerlenmeli';
  } else if (riskScore === 'Orta') {
    status = 'Rota Kabul Edilebilir';
  } else {
    status = 'Rota Güvenli';
  }

  return {
    batteryUsage,
    batteryPercent,
    batteryLevel,
    riskScore,
    riskDetails: {
      costPerStep,
      slopeRatio,
      dangerRatio: proximity.dangerRatio,
      dangerZones: proximity.dangerZones,
    },
    summary,
    status,
    legsReport,
  };
}

export { calculateTelemetry, analyzeObstacleProximity };
