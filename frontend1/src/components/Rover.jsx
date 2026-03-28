import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Rover — a detailed space-vehicle (lunar rover) that animates along a path.
 */
export default function Rover({
  path = [],
  isPlaying = false,
  speed = 1,
  onStep,
  onFinish,
}) {
  const groupRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressRef = useRef(0);
  const currentIndexRef = useRef(0);
  const hasFinished = useRef(false);
  const wheelRefs = [useRef(), useRef(), useRef(), useRef()];

  // Reset when playback stops
  useEffect(() => {
    if (!isPlaying) {
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      progressRef.current = 0;
      hasFinished.current = false;

      if (groupRef.current && path.length > 0) {
        const [x, y, z] = path[0];
        groupRef.current.position.set(x, y + 0.35, z);
      }
    }
  }, [isPlaying, path]);

  useFrame((_, delta) => {
    if (!isPlaying || path.length < 2 || !groupRef.current) return;
    if (hasFinished.current) return;

    const idx = currentIndexRef.current;
    if (idx >= path.length - 1) {
      hasFinished.current = true;
      onFinish?.();
      return;
    }

    progressRef.current += delta * speed;

    if (progressRef.current >= 1) {
      progressRef.current = 0;
      const nextIdx = idx + 1;
      currentIndexRef.current = nextIdx;
      setCurrentIndex(nextIdx);
      onStep?.(nextIdx);

      if (nextIdx >= path.length - 1) {
        const [fx, fy, fz] = path[path.length - 1];
        groupRef.current.position.set(fx, fy + 0.35, fz);
        hasFinished.current = true;
        onFinish?.();
        return;
      }
    }

    // Lerp position
    const ci = currentIndexRef.current;
    const [cx, cy, cz] = path[ci];
    const [nx, ny, nz] = path[Math.min(ci + 1, path.length - 1)];
    const t = progressRef.current;

    groupRef.current.position.set(
      THREE.MathUtils.lerp(cx, nx, t),
      THREE.MathUtils.lerp(cy, ny, t) + 0.35,
      THREE.MathUtils.lerp(cz, nz, t)
    );

    // Face movement direction
    if (ci < path.length - 1) {
      const dir = new THREE.Vector3(nx - cx, 0, nz - cz);
      if (dir.length() > 0.001) {
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          angle,
          0.15
        );
      }
    }

    // Spin wheels
    wheelRefs.forEach((ref) => {
      if (ref.current) ref.current.rotation.x += delta * speed * 6;
    });
  });

  if (path.length === 0) return null;
  const [sx, sy, sz] = path[0];

  return (
    <group ref={groupRef} position={[sx, sy + 0.35, sz]}>
      {/* ── Main body (angular spacecraft hull) ── */}
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.22, 1.3]} />
        <meshStandardMaterial color="#b8b8c0" roughness={0.4} metalness={0.85} />
      </mesh>

      {/* Body side accents */}
      <mesh position={[0.46, 0, 0]} castShadow>
        <boxGeometry args={[0.02, 0.18, 1.2]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.3} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-0.46, 0, 0]} castShadow>
        <boxGeometry args={[0.02, 0.18, 1.2]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.3} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* ── Top cabin / sensor dome ── */}
      <mesh position={[0, 0.2, -0.1]} castShadow>
        <boxGeometry args={[0.55, 0.18, 0.65]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.22, 0.24]} castShadow>
        <boxGeometry args={[0.48, 0.1, 0.06]} />
        <meshStandardMaterial color="#00bfff" emissive="#00bfff" emissiveIntensity={0.6} transparent opacity={0.8} roughness={0.1} metalness={1} />
      </mesh>

      {/* ── Solar panels ── */}
      <group position={[0.75, 0.15, 0]}>
        {/* Arm */}
        <mesh><boxGeometry args={[0.3, 0.03, 0.05]} /><meshStandardMaterial color="#888" metalness={0.9} roughness={0.3} /></mesh>
        {/* Panel */}
        <mesh position={[0.2, 0, 0]}><boxGeometry args={[0.55, 0.02, 0.85]} /><meshStandardMaterial color="#0d1b4c" roughness={0.3} metalness={0.6} emissive="#0a2472" emissiveIntensity={0.15} /></mesh>
        {/* Panel grid lines */}
        <mesh position={[0.2, 0.012, 0]}><boxGeometry args={[0.54, 0.002, 0.01]} /><meshStandardMaterial color="#1a3a7a" emissive="#2060c0" emissiveIntensity={0.3} /></mesh>
      </group>
      <group position={[-0.75, 0.15, 0]} scale={[-1, 1, 1]}>
        <mesh><boxGeometry args={[0.3, 0.03, 0.05]} /><meshStandardMaterial color="#888" metalness={0.9} roughness={0.3} /></mesh>
        <mesh position={[0.2, 0, 0]}><boxGeometry args={[0.55, 0.02, 0.85]} /><meshStandardMaterial color="#0d1b4c" roughness={0.3} metalness={0.6} emissive="#0a2472" emissiveIntensity={0.15} /></mesh>
        <mesh position={[0.2, 0.012, 0]}><boxGeometry args={[0.54, 0.002, 0.01]} /><meshStandardMaterial color="#1a3a7a" emissive="#2060c0" emissiveIntensity={0.3} /></mesh>
      </group>

      {/* ── Wheels (4) ── */}
      {[
        [-0.5, -0.22, 0.45],
        [0.5, -0.22, 0.45],
        [-0.5, -0.22, -0.45],
        [0.5, -0.22, -0.45],
      ].map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]}>
          {/* Wheel suspension arm */}
          <mesh position={[wx > 0 ? -0.12 : 0.12, 0.08, 0]}>
            <boxGeometry args={[0.15, 0.03, 0.04]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* Wheel */}
          <mesh ref={wheelRefs[i]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 16]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.4} />
          </mesh>
          {/* Wheel hub */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.11, 8]} />
            <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── Antenna ── */}
      <mesh position={[0.25, 0.55, -0.35]} castShadow>
        <cylinderGeometry args={[0.012, 0.008, 0.55, 6]} />
        <meshStandardMaterial color="#ccc" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Antenna tip (blinking light) */}
      <mesh position={[0.25, 0.83, -0.35]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      {/* Dish */}
      <mesh position={[-0.2, 0.45, -0.3]} rotation={[0.3, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.02, 0.04, 12]} />
        <meshStandardMaterial color="#ddd" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ── Headlights ── */}
      <mesh position={[0.25, 0.02, 0.66]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-0.25, 0.02, 0.66]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
      </mesh>
      <spotLight position={[0, 0.05, 0.7]} target-position={[0, -0.5, 3]} angle={0.4} penumbra={0.6} intensity={4} distance={8} color="#ffffee" />

      {/* ── Tail lights ── */}
      <mesh position={[0.3, 0.02, -0.66]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-0.3, 0.02, -0.66]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>

      {/* ── Neon underglow ── */}
      <pointLight position={[0, -0.15, 0]} color="#39ff14" intensity={3} distance={4} decay={2} />
    </group>
  );
}
