import React from 'react';

/**
 * Lighting rig scaled for the 200×200 map.
 */
export default function Lighting() {
  return (
    <>
      {/* Sun — brighter but still allows for rover lights to shine */}
      <directionalLight
        position={[60, 150, 40]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={0.5}
        shadow-camera-far={400}
        shadow-bias={-0.0005}
      />

      {/* Increased ambient light for better overall visibility */}
      <ambientLight intensity={0.1} color="#0d1f33" />

      {/* Distant cold rim light */}
      <directionalLight position={[-50, 30, -60]} intensity={0.4} color="#5577cc" />
    </>
  );
}
