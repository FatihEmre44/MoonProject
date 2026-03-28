import React from 'react';
import { Stars as DreiStars } from '@react-three/drei';

/**
 * Space skybox — larger radius for the bigger scene.
 */
export default function Stars() {
  return (
    <DreiStars
      radius={800}
      depth={50}
      count={700}
      factor={3}
      saturation={0}
      fade
      speed={0.3}
    />
  );
}
