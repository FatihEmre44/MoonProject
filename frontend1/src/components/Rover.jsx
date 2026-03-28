import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Rover — redesigned stylized rover parked on the map.
 */
export default function Rover({ position = [0, 0, 0], rotationY = 0 }) {
  const roverRef = useRef();

  const wheels = useMemo(
    () => [
      [-0.58, -0.2, 0.54],
      [0, -0.2, 0.58],
      [0.58, -0.2, 0.54],
      [-0.58, -0.2, -0.54],
      [0, -0.2, -0.58],
      [0.58, -0.2, -0.54],
    ],
    []
  );

  useFrame((state) => {
    if (!roverRef.current) return;
    // Keep the rover alive with a subtle sensor bounce.
    roverRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.8) * 0.015;
  });

  return (
    <group ref={roverRef} position={position} rotation={[0, rotationY, 0]}>
      {/* Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.24, 1.5]} />
        <meshStandardMaterial color="#c9ced4" roughness={0.48} metalness={0.72} />
      </mesh>

      {/* Front wedge */}
      <mesh position={[0, -0.02, 0.9]} castShadow>
        <boxGeometry args={[0.98, 0.14, 0.34]} />
        <meshStandardMaterial color="#9099a3" roughness={0.55} metalness={0.7} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.23, 0.02]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.86]} />
        <meshStandardMaterial color="#222934" roughness={0.22} metalness={0.88} />
      </mesh>
      <mesh position={[0, 0.27, 0.48]} castShadow>
        <boxGeometry args={[0.58, 0.14, 0.05]} />
        <meshStandardMaterial
          color="#83ddff"
          emissive="#26c8ff"
          emissiveIntensity={0.65}
          transparent
          opacity={0.92}
          roughness={0.12}
          metalness={0.75}
        />
      </mesh>

      {/* Side rails */}
      <mesh position={[0.72, 0.02, 0]} castShadow>
        <boxGeometry args={[0.06, 0.2, 1.44]} />
        <meshStandardMaterial color="#f6b84a" roughness={0.5} metalness={0.52} />
      </mesh>
      <mesh position={[-0.72, 0.02, 0]} castShadow>
        <boxGeometry args={[0.06, 0.2, 1.44]} />
        <meshStandardMaterial color="#f6b84a" roughness={0.5} metalness={0.52} />
      </mesh>

      {/* Mast and sensors */}
      <mesh position={[0, 0.58, -0.12]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.42, 12]} />
        <meshStandardMaterial color="#d7dbe0" roughness={0.32} metalness={0.92} />
      </mesh>
      <mesh position={[0, 0.83, -0.08]} castShadow>
        <boxGeometry args={[0.34, 0.1, 0.2]} />
        <meshStandardMaterial color="#1f2733" roughness={0.25} metalness={0.84} />
      </mesh>
      <mesh position={[0, 0.83, 0.02]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#64f5e6" emissive="#29d9ce" emissiveIntensity={1.4} />
      </mesh>

      {/* Communication dish */}
      <mesh position={[-0.42, 0.5, -0.32]} rotation={[0.45, 0.2, -0.25]} castShadow>
        <cylinderGeometry args={[0.16, 0.03, 0.05, 20]} />
        <meshStandardMaterial color="#e1e5ea" roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Rear battery pack */}
      <mesh position={[0, 0.06, -0.88]} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.24]} />
        <meshStandardMaterial color="#474f5b" roughness={0.5} metalness={0.64} />
      </mesh>

      {/* Wheels */}
      {wheels.map(([x, y, z], index) => (
        <group key={index} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.16, 20]} />
            <meshStandardMaterial color="#20242b" roughness={0.9} metalness={0.28} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.17, 10]} />
            <meshStandardMaterial color="#97a0ac" roughness={0.25} metalness={0.92} />
          </mesh>
        </group>
      ))}

      {/* Lights */}
      <mesh position={[0.26, 0, 1.07]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#fffbe8" emissive="#fffbe8" emissiveIntensity={2.8} />
      </mesh>
      <mesh position={[-0.26, 0, 1.07]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#fffbe8" emissive="#fffbe8" emissiveIntensity={2.8} />
      </mesh>
      <pointLight position={[0, 0.04, 1.1]} intensity={1.3} color="#fff4d1" distance={5} />
    </group>
  );
}
