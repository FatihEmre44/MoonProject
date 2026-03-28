import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';

/**
 * Draws a neon green line along the rover's path on the moon surface.
 * 
 * Props:
 * - path: Array of [x, y, z] world positions
 * - currentStep: index of the rover's current position (to color visited vs unvisited)
 */
export default function PathLine({ path = [], currentStep = 0 }) {
  // Split path into visited (brighter) and unvisited (dimmer) segments
  const visitedPath = useMemo(
    () => path.slice(0, currentStep + 1),
    [path, currentStep]
  );

  const unvisitedPath = useMemo(
    () => path.slice(currentStep),
    [path, currentStep]
  );

  if (path.length < 2) return null;

  return (
    <group>
      {/* Visited portion — bright neon green */}
      {visitedPath.length >= 2 && (
        <Line
          points={visitedPath}
          color="#39ff14"
          lineWidth={3}
          transparent
          opacity={0.9}
        />
      )}

      {/* Unvisited portion — dim neon green */}
      {unvisitedPath.length >= 2 && (
        <Line
          points={unvisitedPath}
          color="#39ff14"
          lineWidth={1.5}
          transparent
          opacity={0.3}
          dashed
          dashSize={0.15}
          gapSize={0.1}
        />
      )}

      {/* Start marker */}
      {path.length > 0 && (
        <mesh position={path[0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={1}
          />
        </mesh>
      )}

      {/* End marker */}
      {path.length > 1 && (
        <mesh position={path[path.length - 1]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff4444"
            emissiveIntensity={1}
          />
        </mesh>
      )}
    </group>
  );
}
