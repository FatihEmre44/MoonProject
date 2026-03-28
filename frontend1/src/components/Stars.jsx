import React from 'react';
import { Stars as DreiStars } from '@react-three/drei';

/**
 * Space skybox — larger radius for the bigger scene.
 */
export default function Stars() {
  return (
    <DreiStars
      radius={500}
      depth={100}
      count={1200}
      factor={2.5}
      saturation={0}
      fade
      speed={0.5}
    />
  );
}
