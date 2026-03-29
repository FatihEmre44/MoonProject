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
  const boulder = routeContext.boulderSummary || {};
  const exposure = routeContext.routeExposure || {};

  if (!routeContext.astarMetrics) {
    return 'Rota analizi uretilemedi: A* baglam verisi eksik.';
  }

  const batteryLevel = data.batteryLevel || 'Bilinmiyor';
  const riskScore = data.riskScore || 'Bilinmiyor';

  const stepCount = Number(astar.stepCount || 0);
  const totalCost = Number(astar.totalCost || 0);
  const averageCostPerStep = Number(astar.averageCostPerStep || 0);
  const slopeCount = Number(astar.slopeCount || 0);
  const ruggedCount = Number(astar.ruggedCount || 0);

  const craterCount = Number(crater.routeNearbyCount || 0);
  const craterAstarCount = Number(crater.astarInfluenceCount || 0);
  const craterAvgRadius = Number(crater.averageRadius || 0);
  const craterAvgDepth = Number(crater.averageDepth || 0);

  const boulderCount = Number(boulder.routeNearbyCount || 0);
  const boulderAvgRadius = Number(boulder.averageRadius || 0);

  const nearObstacleRatio = Number(exposure.nearObstacleRatio || 0);

  return [
    `Rota A* tarafinda toplam maliyet ${totalCost} ve ${stepCount} adim ile secildi; adim basi maliyet ${averageCostPerStep}, egim adimi ${slopeCount}, yuksek engebeli adim ${ruggedCount}.`,
    `Obruk analizi: rota koridoru yakininda ${craterCount} obruk var (boyut dagilimi: ${formatBreakdownLabel(crater.sizeBreakdown)}), bunlardan ${craterAstarCount} tanesi A* risk cezasina dogrudan giriyor; ortalama yaricap ${craterAvgRadius}, ortalama derinlik ${craterAvgDepth}.`,
    `Kaya analizi: rota koridoru yakininda ${boulderCount} kaya var (boyut dagilimi: ${formatBreakdownLabel(boulder.sizeBreakdown)}), ortalama yaricap ${boulderAvgRadius}.`,
    `Engel yakinligi orani ${nearObstacleRatio}; toplam risk seviyesi ${riskScore}, batarya seviyesi ${batteryLevel}.`,
  ].join(' ');
}

/**
 * Rover telemetri analizini OpenAI (GPT) ile yorumlayıp rapor oluşturur.
 * @param {Object} telemetryData - A* ve Telemetri fonksiyonundan gelen veriler
 */
export async function generateMissionReport(telemetryData) {
  return buildDeterministicReport(telemetryData);
}