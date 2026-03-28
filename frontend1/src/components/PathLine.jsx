import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { getTerrainHeight } from '../utils/terrainUtils';

/**
 * Draws a neon cyan line along the rover's path on the moon surface.
 * 
 * Props:
 * - path: Array of [x, y, z] world positions
 * - currentStep: index of the rover's current position (to color visited vs unvisited)
 * - selectedMap: ID of the current map to sample heights from
 */
export default function PathLine({ path = [], currentStep = 0, selectedMap = 'mid-crater' }) {
  const Y_OFFSET = 0.6; // Slightly higher to be safe

  // Create a high-resolution path that hugs the terrain
  const pathWithOffset = useMemo(() => {
    if (path.length < 2) return [];

    const densePath = [];
    const MAX_SEGMENT_LENGTH = 0.5; // Sampling interval

    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i+1];
        
        const dx = p2[0] - p1[0];
        const dz = p2[2] - p1[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        const steps = Math.ceil(dist / MAX_SEGMENT_LENGTH);
        
        for (let s = 0; s < steps; s++) {
            const t = s / steps;
            const x = p1[0] + dx * t;
            const z = p1[2] + dz * t;
            // Sample terrain height at this specific spot
            const h = getTerrainHeight(x, z, selectedMap);
            densePath.push([x, h + Y_OFFSET, z]);
        }
    }
    
    // Add the final point
    const last = path[path.length - 1];
    densePath.push([last[0], getTerrainHeight(last[0], last[2], selectedMap) + Y_OFFSET, last[2]]);
    
    return densePath;
  }, [path, selectedMap]);

  // Adjust currentStep for the denser path (rough approximation)
  const denseCurrentStep = useMemo(() => {
    if (path.length < 2) return 0;
    // Map the original currentStep to the new dense index
    // This is approximate but works for visual tracking
    const ratio = currentStep / (path.length - 1);
    return Math.floor(ratio * (pathWithOffset.length - 1));
  }, [currentStep, path.length, pathWithOffset.length]);

  // Split path into visited (Passed) and unvisited (Remaining) segments
  const visitedPath = useMemo(
    () => pathWithOffset.slice(0, denseCurrentStep + 1),
    [pathWithOffset, denseCurrentStep]
  );

  const unvisitedPath = useMemo(
    () => pathWithOffset.slice(denseCurrentStep),
    [pathWithOffset, denseCurrentStep]
  );

  if (path.length < 2) return null;

  return (
    <group>
      {/* Visited portion — restored and set to neon cyan (not green) */}
      {visitedPath.length >= 2 && (
        <group>
          {/* Main solid line */}
          <Line
            points={visitedPath}
            color="#00ffe1"
            lineWidth={8}
            transparent
            opacity={0.8}
            raycast={() => null}
          />
          {/* Outer glow layer */}
          <Line
            points={visitedPath}
            color="#80fff1"
            lineWidth={24}
            transparent
            opacity={0.15}
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
