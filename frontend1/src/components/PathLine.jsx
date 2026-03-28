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
        <group>
          {/* Main solid line */}
          <Line
            points={visitedPath}
            color="#39ff14"
            lineWidth={8}
            transparent
            opacity={1.0}
            raycast={() => null}
          />
          {/* Outer glow layer */}
          <Line
            points={visitedPath}
            color="#8fff71"
            lineWidth={24}
            transparent
            opacity={0.25}
            raycast={() => null}
          />
        </group>
      )}

      {/* Unvisited portion — bright neon blue/cyan for pathfinding */}
      {unvisitedPath.length >= 2 && (
        <group>
          {/* Main solid line */}
          <Line
            points={unvisitedPath}
            color="#00ffe1"
            lineWidth={6}
            transparent
            opacity={0.9}
            dashed
            dashSize={0.8}
            gapSize={0.4}
            raycast={() => null}
          />
          {/* Outer glow layer */}
          <Line
            points={unvisitedPath}
            color="#80fff1"
            lineWidth={18}
            transparent
            opacity={0.2}
            raycast={() => null}
          />
        </group>
      )}

      {/* Start marker - Cyber Pillar */}
      {path.length > 0 && (
        <group position={path[0]}>
          <mesh position={[0, 1.5, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.15, 0.15, 3, 16]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00e5ff"
              emissiveIntensity={3}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <torusGeometry args={[0.6, 0.08, 16, 32]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00e5ff" emissiveIntensity={4} />
          </mesh>
        </group>
      )}

      {/* End marker - Target Cyber Pillar */}
      {path.length > 1 && (
        <group position={path[path.length - 1]}>
          <mesh position={[0, 2, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.25, 0.25, 4, 16]} />
            <meshStandardMaterial
              color="#ff5f5f"
              emissive="#ff3030"
              emissiveIntensity={3}
              transparent
              opacity={0.7}
            />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <torusGeometry args={[1.2, 0.1, 16, 48]} />
            <meshStandardMaterial color="#ff5f5f" emissive="#ff3030" emissiveIntensity={4} />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <torusGeometry args={[0.6, 0.06, 16, 32]} />
            <meshStandardMaterial color="#ff5f5f" emissive="#ff3030" emissiveIntensity={4} />
          </mesh>
        </group>
      )}
    </group>
  );
}
