import React from 'react';
import { Stars as DreiStars } from '@react-three/drei';

/**
 * Space skybox — larger radius for the bigger scene.
 */
export default function Stars() {
  return (
    <DreiStars
      radius={300}
      depth={120}
      count={6000}
      factor={6}
      saturation={0.1}
      fade
      speed={1.2}
    />
  );
}
