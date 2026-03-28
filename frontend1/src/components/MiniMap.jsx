import React, { useRef, useEffect, useCallback } from 'react';
import { getTerrainHeight } from '../utils/terrainUtils';
import { gridToWorld } from '../utils/coordinateMapper';

/**
 * MiniMap — 2D canvas overlay in the top-right corner showing the full map,
 * craters, rover path, and current position.
 */
export default function MiniMap({
  gridSize = 200,
  craters = [],
  roverPath = [],
  currentStep = 0,
}) {
  const canvasRef = useRef();
  const terrainImageRef = useRef(null);
  const MAP_PX = 200;

  // Render static terrain heightmap once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(MAP_PX, MAP_PX);
    const half = gridSize / 2;

    for (let py = 0; py < MAP_PX; py++) {
      for (let px = 0; px < MAP_PX; px++) {
        const worldX = (px / MAP_PX - 0.5) * gridSize;
        const worldZ = (py / MAP_PX - 0.5) * gridSize;
        const h = getTerrainHeight(worldX, worldZ);
        const b = Math.max(20, Math.min(220, Math.floor(((h + 5) / 10) * 180 + 30)));
        const idx = (py * MAP_PX + px) * 4;
        img.data[idx]     = Math.floor(b * 0.55);
        img.data[idx + 1] = Math.floor(b * 0.53);
        img.data[idx + 2] = Math.floor(b * 0.65);
        img.data[idx + 3] = 255;
      }
    }

    // Cache the terrain image
    terrainImageRef.current = img;

    // Draw path (static)
    ctx.putImageData(img, 0, 0);
    drawStaticOverlay(ctx);
  }, [gridSize, craters, roverPath]);

  // Redraw rover position on step change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !terrainImageRef.current) return;
    const ctx = canvas.getContext('2d');

    // Restore terrain
    ctx.putImageData(terrainImageRef.current, 0, 0);
    drawStaticOverlay(ctx);

    // Rover dot
    const roverGrid = roverPath[currentStep] || [0, 0];
    const { x: rx, z: rz } = gridToWorld(roverGrid[0], roverGrid[1], { gridWidth: gridSize, gridHeight: gridSize });
    const rpx = (rx / gridSize + 0.5) * MAP_PX;
    const rpy = (rz / gridSize + 0.5) * MAP_PX;

    // Glow
    const grad = ctx.createRadialGradient(rpx, rpy, 0, rpx, rpy, 10);
    grad.addColorStop(0, 'rgba(57,255,20,0.8)');
    grad.addColorStop(1, 'rgba(57,255,20,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rpx, rpy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Dot
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(rpx, rpy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [currentStep, gridSize, roverPath]);

  const drawStaticOverlay = useCallback((ctx) => {
    // Draw rover path
    if (roverPath.length > 1) {
      ctx.strokeStyle = 'rgba(57,255,20,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roverPath.forEach(([col, row], i) => {
        const { x, z } = gridToWorld(col, row, { gridWidth: gridSize, gridHeight: gridSize });
        const px = (x / gridSize + 0.5) * MAP_PX;
        const py = (z / gridSize + 0.5) * MAP_PX;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Draw craters
    ctx.strokeStyle = 'rgba(255,120,30,0.4)';
    ctx.lineWidth = 1;
    craters.forEach((c) => {
      const { x, z } = gridToWorld(c.col, c.row, { gridWidth: gridSize, gridHeight: gridSize });
      const px = (x / gridSize + 0.5) * MAP_PX;
      const py = (z / gridSize + 0.5) * MAP_PX;
      const r = (c.radius / gridSize) * MAP_PX * 2;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(r, 2), 0, Math.PI * 2);
      ctx.stroke();
    });

    // Start / End markers
    if (roverPath.length > 0) {
      const [sc, sr] = roverPath[0];
      const { x: sx, z: sz } = gridToWorld(sc, sr, { gridWidth: gridSize, gridHeight: gridSize });
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.arc((sx / gridSize + 0.5) * MAP_PX, (sz / gridSize + 0.5) * MAP_PX, 3, 0, Math.PI * 2);
      ctx.fill();

      const [ec, er] = roverPath[roverPath.length - 1];
      const { x: ex, z: ez } = gridToWorld(ec, er, { gridWidth: gridSize, gridHeight: gridSize });
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc((ex / gridSize + 0.5) * MAP_PX, (ez / gridSize + 0.5) * MAP_PX, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [gridSize, roverPath, craters]);

  return (
    <div className="minimap-container" id="minimap">
      <div className="minimap-header">
        <span className="minimap-icon">◈</span> MAP
      </div>
      <canvas
        ref={canvasRef}
        width={MAP_PX}
        height={MAP_PX}
        className="minimap-canvas"
      />
      <div className="minimap-coords">
        {roverPath[currentStep]
          ? `[${roverPath[currentStep][0]}, ${roverPath[currentStep][1]}]`
          : '[0, 0]'}
      </div>
    </div>
  );
}
