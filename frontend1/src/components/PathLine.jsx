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
          lineWidth={5}
          transparent
          opacity={1.0}
          raycast={() => null}
        />
      )}

      {/* Unvisited portion — bright neon blue/cyan for pathfinding */}
      {unvisitedPath.length >= 2 && (
        <Line
          points={unvisitedPath}
          color="#00ffcc"
          lineWidth={4}
          transparent
          opacity={0.8}
          dashed
          dashSize={0.4}
          gapSize={0.2}
          raycast={() => null}
        />
      )}

      {/* Start marker */}
      {path.length > 0 && (
        <mesh position={path[0]} raycast={() => null}>
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00e5ff"
            emissiveIntensity={2}
          />
        </mesh>
      )}

      {/* End marker */}
      {path.length > 1 && (
        <mesh position={path[path.length - 1]} raycast={() => null}>
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshStandardMaterial
            color="#ff5f5f"
            emissive="#ff3030"
            emissiveIntensity={2}
          />
        </mesh>
      )}
    </group>
  );
}
