import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight, seededRandom } from '../utils/terrainUtils';

/**
 * Rover — high-detail rover with forward motion and realistic impact response.
 */
export default function Rover({
  initialPosition = [0, 0, 0],
  rotationY = 0,
  mapId = 'mid-crater',
  isPlaying = false,
  routePoints = [],
  onPositionChange,
  onObstacleHit,
  onRouteComplete,
  resetSignal = 0,
}) {
  const roverRef = useRef();
  const mastHeadRef = useRef();
  const dishRef = useRef();
  const navLeftRef = useRef();
  const navRightRef = useRef();
  const emitAccumulatorRef = useRef(0);

  const motionRef = useRef({
    x: initialPosition[0],
    z: initialPosition[2],
    headingY: rotationY,
    routeIndex: 0,
    routeCompleted: false,
    impact: 0,
    impactSide: 1,
    passedObstacleIndexes: new Set(),
  });

  const FORWARD_SPEED = 4.3;
  const ROUTE_SPEED = 5.8;

  const obstacles = useMemo(() => {
    const seed = mapId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + 1337;
    const rng = seededRandom(seed);
    const list = [];
    const startZ = initialPosition[2];
    for (let i = 0; i < 10; i++) {
      list.push({
        x: (rng() - 0.5) * 0.62,
        z: startZ - 7 - i * (6.8 + rng() * 3.2),
        radius: 0.24 + rng() * 0.08,
      });
    }
    return list;
  }, [mapId, initialPosition]);

  useEffect(() => {
    const hasRoute = Array.isArray(routePoints) && routePoints.length > 0;
    const startX = hasRoute ? routePoints[0][0] : initialPosition[0];
    const startZ = hasRoute ? routePoints[0][2] : initialPosition[2];

    motionRef.current = {
      x: startX,
      z: startZ,
      headingY: rotationY,
      routeIndex: 0,
      routeCompleted: false,
      impact: 0,
      impactSide: 1,
      passedObstacleIndexes: new Set(),
    };
    emitAccumulatorRef.current = 0;
  }, [initialPosition, mapId, resetSignal, rotationY, routePoints]);

  const wheelPositions = useMemo(
    () => [
      [-0.64, -0.24, 0.62],
      [0, -0.24, 0.66],
      [0.64, -0.24, 0.62],
      [-0.64, -0.24, -0.62],
      [0, -0.24, -0.66],
      [0.64, -0.24, -0.62],
    ],
    []
  );

  const ventRows = useMemo(
    () => [-0.18, -0.06, 0.06, 0.18],
    []
  );

  const solarCells = useMemo(() => {
    const cells = [];
    for (let x = -0.16; x <= 0.16; x += 0.08) {
      for (let z = -0.34; z <= 0.34; z += 0.09) {
        cells.push([x, z]);
      }
    }
    return cells;
  }, []);

  useFrame((state, delta) => {
    if (!roverRef.current) return;

    const motion = motionRef.current;

    const hasRoute = Array.isArray(routePoints) && routePoints.length > 1;

    if (isPlaying) {
      if (hasRoute) {
        const nextIndex = Math.min(motion.routeIndex + 1, routePoints.length - 1);
        const targetPoint = routePoints[nextIndex];
        const dx = targetPoint[0] - motion.x;
        const dz = targetPoint[2] - motion.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.0001) {
          motion.headingY = Math.atan2(dx, dz);
        }

        if (dist <= 0.08) {
          motion.x = targetPoint[0];
          motion.z = targetPoint[2];

          if (motion.routeIndex < routePoints.length - 1) {
            motion.routeIndex += 1;
          }

          if (motion.routeIndex >= routePoints.length - 1 && !motion.routeCompleted) {
            motion.routeCompleted = true;
            onRouteComplete?.();
          }
        } else {
          const step = Math.min(ROUTE_SPEED * delta, dist);
          motion.x += (dx / dist) * step;
          motion.z += (dz / dist) * step;
        }
      } else {
        motion.z -= FORWARD_SPEED * delta;
      }
    }

    if (!hasRoute) {
      for (let i = 0; i < obstacles.length; i++) {
        if (motion.passedObstacleIndexes.has(i)) continue;
        const rock = obstacles[i];
        const dz = Math.abs(motion.z - rock.z);
        const dx = Math.abs(motion.x - rock.x);

        if (dz < 0.44 && dx < rock.radius) {
          motion.impact = 1;
          motion.impactSide = rock.x >= motion.x ? 1 : -1;
          motion.passedObstacleIndexes.add(i);
          onObstacleHit?.(i);
        }
      }
    }

    const t = state.clock.elapsedTime;
    motion.impact = Math.max(0, motion.impact - delta * 2.8);

    const centerHeight = getTerrainHeight(motion.x, motion.z, mapId);
    const forwardHeight = getTerrainHeight(motion.x, motion.z - 0.8, mapId);
    const rearHeight = getTerrainHeight(motion.x, motion.z + 0.8, mapId);
    const rightHeight = getTerrainHeight(motion.x + 0.75, motion.z, mapId);
    const leftHeight = getTerrainHeight(motion.x - 0.75, motion.z, mapId);

    const basePitch = Math.atan2(forwardHeight - rearHeight, 1.6) * 0.7;
    const baseRoll = Math.atan2(rightHeight - leftHeight, 1.5) * 0.6;

    const idleBounce = Math.sin(t * 4.3) * 0.01;
    const hitShakeY = Math.sin(t * 72) * 0.05 * motion.impact;
    const hitShakeX = Math.sin(t * 92) * 0.018 * motion.impact * motion.impactSide;
    const hitPitch = Math.sin(t * 58) * 0.1 * motion.impact;
    const hitRoll = Math.sin(t * 64) * 0.12 * motion.impact * motion.impactSide;
    const hitYaw = Math.sin(t * 34) * 0.06 * motion.impact * motion.impactSide;

    const worldY = centerHeight + 0.48;
    roverRef.current.position.set(
      motion.x + hitShakeX,
      worldY + idleBounce + hitShakeY,
      motion.z
    );
    roverRef.current.rotation.set(
      basePitch + hitPitch,
      motion.headingY + hitYaw,
      baseRoll + hitRoll
    );

    onPositionChange?.([motion.x, worldY, motion.z]);

    if (mastHeadRef.current) {
      mastHeadRef.current.rotation.y += delta * 0.3;
    }

    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(t * 0.65) * 0.45;
      dishRef.current.rotation.x = 0.42 + Math.sin(t * 0.5) * 0.08;
    }

    const navIntensity = 1.2 + Math.sin(t * 5) * 0.45;
    if (navLeftRef.current) navLeftRef.current.emissiveIntensity = navIntensity;
    if (navRightRef.current) navRightRef.current.emissiveIntensity = navIntensity;
  });

  return (
    <group ref={roverRef} position={initialPosition} rotation={[0, rotationY, 0]}>
      {/* Lower hull and skid */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.48, 0.26, 1.7]} />
        <meshStandardMaterial color="#c0c5cc" roughness={0.45} metalness={0.74} />
      </mesh>
      <mesh position={[0, -0.13, 0]} castShadow>
        <boxGeometry args={[1.2, 0.06, 1.28]} />
        <meshStandardMaterial color="#505865" roughness={0.62} metalness={0.46} />
      </mesh>

      {/* Front bumper and probes */}
      <mesh position={[0, -0.01, 0.98]} castShadow>
        <boxGeometry args={[1.14, 0.17, 0.2]} />
        <meshStandardMaterial color="#8a94a0" roughness={0.52} metalness={0.68} />
      </mesh>
      <mesh position={[0.42, -0.02, 1.08]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.28, 10]} />
        <meshStandardMaterial color="#ced3d9" roughness={0.28} metalness={0.94} />
      </mesh>
      <mesh position={[-0.42, -0.02, 1.08]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.28, 10]} />
        <meshStandardMaterial color="#ced3d9" roughness={0.28} metalness={0.94} />
      </mesh>

      {/* Side armor and vent channels */}
      <mesh position={[0.78, 0.03, 0]} castShadow>
        <boxGeometry args={[0.08, 0.22, 1.62]} />
        <meshStandardMaterial color="#dfad55" roughness={0.52} metalness={0.45} />
      </mesh>
      <mesh position={[-0.78, 0.03, 0]} castShadow>
        <boxGeometry args={[0.08, 0.22, 1.62]} />
        <meshStandardMaterial color="#dfad55" roughness={0.52} metalness={0.45} />
      </mesh>
      {ventRows.map((z, i) => (
        <mesh key={`vent-r-${i}`} position={[0.67, 0.03, z]} castShadow>
          <boxGeometry args={[0.06, 0.02, 0.06]} />
          <meshStandardMaterial color="#1f2730" roughness={0.9} metalness={0.12} />
        </mesh>
      ))}
      {ventRows.map((z, i) => (
        <mesh key={`vent-l-${i}`} position={[-0.67, 0.03, z]} castShadow>
          <boxGeometry args={[0.06, 0.02, 0.06]} />
          <meshStandardMaterial color="#1f2730" roughness={0.9} metalness={0.12} />
        </mesh>
      ))}

      {/* Main cabin */}
      <mesh position={[0, 0.24, 0.02]} castShadow>
        <boxGeometry args={[0.88, 0.32, 0.98]} />
        <meshStandardMaterial color="#242d3a" roughness={0.2} metalness={0.88} />
      </mesh>
      <mesh position={[0, 0.31, 0.54]} castShadow>
        <boxGeometry args={[0.63, 0.15, 0.06]} />
        <meshStandardMaterial
          color="#8de7ff"
          emissive="#2ecfff"
          emissiveIntensity={0.68}
          transparent
          opacity={0.88}
          roughness={0.1}
          metalness={0.72}
        />
      </mesh>
      <mesh position={[0.36, 0.3, 0.02]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.52]} />
        <meshStandardMaterial color="#86dfff" emissive="#1fb9f8" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.36, 0.3, 0.02]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.52]} />
        <meshStandardMaterial color="#86dfff" emissive="#1fb9f8" emissiveIntensity={0.3} />
      </mesh>

      {/* Roof rack + solar mat */}
      <mesh position={[0, 0.46, -0.04]} castShadow>
        <boxGeometry args={[0.9, 0.03, 1.02]} />
        <meshStandardMaterial color="#7b8593" roughness={0.45} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.48, -0.04]} castShadow>
        <boxGeometry args={[0.74, 0.015, 0.84]} />
        <meshStandardMaterial color="#0a2248" roughness={0.35} metalness={0.6} emissive="#123a80" emissiveIntensity={0.18} />
      </mesh>
      {solarCells.map(([x, z], i) => (
        <mesh key={`cell-${i}`} position={[x, 0.491, z]}>
          <boxGeometry args={[0.05, 0.002, 0.055]} />
          <meshStandardMaterial color="#2a58a8" emissive="#2e6cce" emissiveIntensity={0.22} />
        </mesh>
      ))}

      {/* Sensor mast */}
      <mesh position={[0.04, 0.68, -0.08]} castShadow>
        <cylinderGeometry args={[0.028, 0.03, 0.42, 14]} />
        <meshStandardMaterial color="#d6dbe1" roughness={0.28} metalness={0.95} />
      </mesh>
      <group ref={mastHeadRef} position={[0.04, 0.91, -0.08]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.11, 0.22]} />
          <meshStandardMaterial color="#1f2733" roughness={0.24} metalness={0.84} />
        </mesh>
        <mesh position={[0, 0.01, 0.12]}>
          <boxGeometry args={[0.24, 0.08, 0.03]} />
          <meshStandardMaterial color="#6af0ff" emissive="#2acfff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.15, -0.01, 0.07]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#9cf7ff" emissive="#3de8ff" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[-0.15, -0.01, 0.07]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#9cf7ff" emissive="#3de8ff" emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* Communication dish assembly */}
      <group ref={dishRef} position={[-0.54, 0.57, -0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.024, 0.024, 0.2, 10]} />
          <meshStandardMaterial color="#cfd5dc" roughness={0.28} metalness={0.94} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.03, 0.05, 28]} />
          <meshStandardMaterial color="#e3e7ec" roughness={0.34} metalness={0.85} />
        </mesh>
      </group>

      {/* Robotic arm */}
      <group position={[0.86, 0.2, -0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 12]} />
          <meshStandardMaterial color="#ccd2d9" roughness={0.33} metalness={0.91} />
        </mesh>
        <mesh position={[0.15, 0.06, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.28, 0.05, 0.05]} />
          <meshStandardMaterial color="#9ca5b1" roughness={0.45} metalness={0.72} />
        </mesh>
        <mesh position={[0.29, -0.01, 0]} rotation={[0, 0, 0.52]} castShadow>
          <boxGeometry args={[0.21, 0.045, 0.045]} />
          <meshStandardMaterial color="#b2bbc7" roughness={0.38} metalness={0.8} />
        </mesh>
        <mesh position={[0.39, 0.08, 0]} castShadow>
          <boxGeometry args={[0.08, 0.03, 0.12]} />
          <meshStandardMaterial color="#5f6976" roughness={0.55} metalness={0.58} />
        </mesh>
      </group>

      {/* Rear payload and radiator fins */}
      <mesh position={[0, 0.08, -1.02]} castShadow>
        <boxGeometry args={[1.02, 0.2, 0.3]} />
        <meshStandardMaterial color="#424b58" roughness={0.52} metalness={0.62} />
      </mesh>
      {[-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36].map((x, i) => (
        <mesh key={`fin-${i}`} position={[x, 0.2, -1.14]} castShadow>
          <boxGeometry args={[0.04, 0.16, 0.02]} />
          <meshStandardMaterial color="#8892a0" roughness={0.4} metalness={0.78} />
        </mesh>
      ))}

      {/* Suspension links */}
      {wheelPositions.map(([x, y, z], index) => (
        <group key={`susp-${index}`} position={[x, y + 0.14, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.04, 0.2]} />
            <meshStandardMaterial color="#747f8c" roughness={0.5} metalness={0.62} />
          </mesh>
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
            <meshStandardMaterial color="#9aa4b1" roughness={0.35} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Wheels with hubs and tread rings */}
      {wheelPositions.map(([x, y, z], index) => (
        <group key={`wheel-${index}`} position={[x, y, z]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.21, 0.21, 0.18, 28]} />
            <meshStandardMaterial color="#1a1d23" roughness={0.92} metalness={0.2} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.17, 0.018, 8, 24]} />
            <meshStandardMaterial color="#3c434f" roughness={0.74} metalness={0.35} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.085, 0.085, 0.19, 12]} />
            <meshStandardMaterial color="#a4adba" roughness={0.24} metalness={0.94} />
          </mesh>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <mesh
              key={`lug-${index}-${deg}`}
              position={[
                Math.cos((deg * Math.PI) / 180) * 0.11,
                Math.sin((deg * Math.PI) / 180) * 0.11,
                0,
              ]}
              rotation={[0, 0, (deg * Math.PI) / 180]}
            >
              <boxGeometry args={[0.02, 0.04, 0.025]} />
              <meshStandardMaterial color="#7f8998" roughness={0.42} metalness={0.82} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Navigation and status lights */}
      <mesh position={[0.3, 0.02, 1.13]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#fff8de" emissive="#fff8de" emissiveIntensity={2.8} />
      </mesh>
      <mesh position={[-0.3, 0.02, 1.13]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#fff8de" emissive="#fff8de" emissiveIntensity={2.8} />
      </mesh>
      
      {/* High-range exploration lights */}
      <pointLight 
        position={[0, 1.5, 1.3]} 
        intensity={18} 
        color="#fffceb" 
        distance={25} 
        decay={1.8}
        castShadow
      />
      <spotLight 
        position={[0, 1.2, 0.9]} 
        angle={0.6} 
        intensity={25} 
        color="#fffcee" 
        distance={45} 
        decay={1.6} 
        penumbra={0.5} 
        castShadow
      />

      <mesh position={[0.42, 0.55, -0.58]}>
        <sphereGeometry args={[0.033, 10, 10]} />
        <meshStandardMaterial ref={navLeftRef} color="#5ef7d3" emissive="#1de8be" emissiveIntensity={1.2} />
      </mesh>
      <group position={[-0.42, 0.55, -0.58]}>
        <mesh>
          <sphereGeometry args={[0.033, 10, 10]} />
          <meshStandardMaterial ref={navRightRef} color="#ff6f7f" emissive="#ff405e" emissiveIntensity={1.2} />
        </mesh>
      </group>
      
      {/* Chassis accent lights */}
      <pointLight position={[0, 0.55, -0.58]} intensity={0.6} color="#53ffd5" distance={2.8} />
    </group>
  );
}
