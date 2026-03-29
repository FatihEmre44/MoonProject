function formatBreakdownLabel(breakdown = {}) {
  const kucuk = Number(breakdown.kucuk || 0);
  const orta = Number(breakdown.orta || 0);
  const buyuk = Number(breakdown.buyuk || 0);
  return `kucuk:${kucuk}, orta:${orta}, buyuk:${buyuk}`;
}

function buildDeterministicReport(data = {}) {
  const routeContext = data.routeContext || {};
  const astar = routeContext.astarMetrics || {};
  const crater = routeContext.craterSummary || {};
  const exposure = routeContext.routeExposure || {};

  const batteryLevel = data.batteryLevel || 'Bilinmiyor';
  const riskScore = data.riskScore || 'Bilinmiyor';

  const stepCount = Number(astar.stepCount || 0);
  const totalCost = Number(astar.totalCost || 0);
  const averageCostPerStep = Number(astar.averageCostPerStep || 0);
  const craterCount = Number(crater.routeNearbyCount || 0);
  const nearObstacleRatio = Number(exposure.nearObstacleRatio || 0);

  // Veri eksikse haber ver
  if (!stepCount || totalCost === 0) {
    return 'Rota analiz verisi henüz yükleniyor veya ruta bulunamadı. Lütfen hedef seçip tekrar deneyin.';
  }

  // Kısa (3-4 cümle) ve öz rapor
  const lines = [
    `A* algoritması ${stepCount} adımda ${totalCost} maliyetli roTA buldu (ortalama adım maliyeti: ${averageCostPerStep.toFixed(1)}).`,
    `Risk seviyesi "${riskScore}", batarya tüketimi "${batteryLevel}".`,
    craterCount > 0 
      ? `Rota yakında ${craterCount} obruk var ancak güvenli koridor seçildi.` 
      : `Hedefe engelsiz şekilde ulaşmak mümkün.`
  ];

  if (nearObstacleRatio > 0.3) {
    lines.push(`Dikkat: yolun %${(nearObstacleRatio * 100).toFixed(0)}'i engel yakının, dikkatle ilerlenmelidir.`);
  }

  return lines.join(' ');
}

/**
 * Rover telemetri analizini OpenAI (GPT) ile yorumlayıp rapor oluşturur.
 * @param {Object} telemetryData - A* ve Telemetri fonksiyonundan gelen veriler
 */
export async function generateMissionReport(telemetryData) {
  return buildDeterministicReport(telemetryData);
}