import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, seededRandom } from '../utils/terrainUtils';

/**
 * Moon surface — procedural terrain with vertex displacement,
 * crater depressions, scattered rocks and boulders.
 */
export default function MoonSurface({ gridSize = 200 }) {
  const planeSize = gridSize + 10;
  const segments = 512;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const worldX = lx;
      const worldZ = -ly;
      const h = getTerrainHeight(worldX, worldZ);
      pos.setZ(i, h);

      // Height-based vertex color for natural look
      const t = Math.max(0, Math.min(1, (h + 5) / 10));
      const base = 0.18 + t * 0.32;
      colors[i * 3]     = base * 0.95;
      colors[i * 3 + 1] = base * 0.93;
      colors[i * 3 + 2] = base * 1.0;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [planeSize, segments]);

  return (
    <group>
      {/* Terrain mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          vertexColors
          roughness={0.95}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Grid lines — sparse (every 10 units) */}
      <SparseGrid gridSize={gridSize} spacing={10} />

      {/* Rocks */}
      <Rocks count={3000} spread={planeSize * 0.9} />

      {/* Boulders */}
      <Boulders count={200} spread={planeSize * 0.85} />
    </group>
  );
}

/* ── Sparse grid lines ── */
function SparseGrid({ gridSize, spacing = 10 }) {
  const lines = useMemo(() => {
    const half = gridSize / 2;
    const pts = [];
    for (let i = -half; i <= half; i += spacing) {
      pts.push(new THREE.Vector3(-half, 0.02, i), new THREE.Vector3(half, 0.02, i));
      pts.push(new THREE.Vector3(i, 0.02, -half), new THREE.Vector3(i, 0.02, half));
    }
    return pts;
  }, [gridSize, spacing]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(lines.flatMap(p => [p.x, p.y, p.z]))}
          count={lines.length}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00d4ff" transparent opacity={0.04} />
    </lineSegments>
  );
}

/* ── Instanced rocks ── */
function Rocks({ count = 3000, spread = 180 }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;
    const rng = seededRandom(42);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * spread;
      const z = (rng() - 0.5) * spread;
      const y = getTerrainHeight(x, z);
      const sc = 0.08 + rng() * 0.3;

      dummy.position.set(x, y + sc * 0.3, z);
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      dummy.scale.set(sc, sc * (0.4 + rng() * 0.6), sc);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, spread]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a4a4a" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
}

/* ── Larger boulders ── */
function Boulders({ count = 200, spread = 170 }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;
    const rng = seededRandom(123);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * spread;
      const z = (rng() - 0.5) * spread;
      const y = getTerrainHeight(x, z);
      const sc = 0.4 + rng() * 1.2;

      dummy.position.set(x, y + sc * 0.25, z);
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * 0.5);
      dummy.scale.set(sc, sc * (0.3 + rng() * 0.5), sc * (0.7 + rng() * 0.3));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, spread]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3d3d3d" roughness={1} metalness={0.08} />
    </instancedMesh>
  );
}
