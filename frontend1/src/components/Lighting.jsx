import React from 'react';

/**
 * Lighting rig scaled for the 200×200 map.
 */
export default function Lighting() {
  return (
    <>
      {/* Sun — harsh directional with large shadow coverage */}
      <directionalLight
        position={[60, 80, 40]}
        intensity={2.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={0.5}
        shadow-camera-far={300}
        shadow-bias={-0.0005}
      />

      {/* Neon blue ambient fill */}
      <ambientLight intensity={0.25} color="#1a3a5c" />

      {/* Subtle warm fill from below-left */}
      <pointLight position={[-40, 10, -50]} intensity={0.5} color="#3a2a5c" />

      {/* Distant cold rim light */}
      <directionalLight position={[-50, 30, -60]} intensity={0.4} color="#4466aa" />
    </>
  );
}
