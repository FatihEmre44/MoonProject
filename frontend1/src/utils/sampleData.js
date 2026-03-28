/**
 * sampleData.js
 * 200×200 grid — 10× larger map with scattered craters and a long rover path.
 */

export const GRID_SIZE = 200;

/* ── Craters ── */
export const CRATERS = [
  { col: 15,  row: 15,  radius: 3 },
  { col: 45,  row: 10,  radius: 4.5 },
  { col: 10,  row: 40,  radius: 2.5 },
  { col: 60,  row: 20,  radius: 5 },
  { col: 30,  row: 65,  radius: 3.5 },
  { col: 80,  row: 30,  radius: 4 },
  { col: 20,  row: 90,  radius: 3 },
  { col: 50,  row: 75,  radius: 6 },
  { col: 110, row: 25,  radius: 4.5 },
  { col: 95,  row: 55,  radius: 3.5 },
  { col: 75,  row: 80,  radius: 5.5 },
  { col: 130, row: 45,  radius: 4 },
  { col: 150, row: 70,  radius: 5 },
  { col: 115, row: 110, radius: 6 },
  { col: 65,  row: 120, radius: 3 },
  { col: 140, row: 30,  radius: 3.5 },
  { col: 170, row: 50,  radius: 4 },
  { col: 160, row: 90,  radius: 5.5 },
  { col: 40,  row: 140, radius: 4.5 },
  { col: 90,  row: 130, radius: 3 },
  { col: 120, row: 145, radius: 4 },
  { col: 155, row: 120, radius: 3.5 },
  { col: 180, row: 110, radius: 5 },
  { col: 30,  row: 170, radius: 6 },
  { col: 100, row: 160, radius: 4 },
  { col: 145, row: 160, radius: 5.5 },
  { col: 175, row: 145, radius: 4 },
  { col: 60,  row: 180, radius: 3.5 },
  { col: 130, row: 175, radius: 4.5 },
  { col: 185, row: 180, radius: 3 },
  { col: 10,  row: 120, radius: 4 },
  { col: 195, row: 60,  radius: 3.5 },
  { col: 5,   row: 195, radius: 5 },
  { col: 80,  row: 170, radius: 4 },
  { col: 170, row: 170, radius: 6 },
];

// Pre-compute world positions (avoids circular dependency with coordinateMapper)
const half = (GRID_SIZE - 1) / 2;
export const CRATERS_WORLD = CRATERS.map((c) => ({
  worldX: c.col - half,
  worldZ: c.row - half,
  radius: c.radius,
}));

/* ── Rover path generation ── */
const WAYPOINTS = [
  [5, 5], [25, 8], [40, 25], [35, 50], [55, 55],
  [70, 40], [90, 45], [100, 65], [85, 85], [100, 100],
  [120, 90], [140, 105], [130, 125], [145, 140], [165, 135],
  [175, 155], [185, 170], [190, 190], [195, 195],
];

function interpolateWaypoints(wps) {
  const path = [wps[0]];
  for (let w = 0; w < wps.length - 1; w++) {
    let [cx, cy] = wps[w];
    const [ex, ey] = wps[w + 1];
    while (cx !== ex || cy !== ey) {
      const rdx = ex - cx;
      const rdy = ey - cy;
      if (Math.abs(rdx) >= Math.abs(rdy)) cx += Math.sign(rdx);
      else cy += Math.sign(rdy);
      path.push([cx, cy]);
    }
  }
  return path;
}

export const ROVER_PATH = interpolateWaypoints(WAYPOINTS);
