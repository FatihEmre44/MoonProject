import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { getTerrainHeight, getMapProfile, seededRandom } from '../utils/terrainUtils'

/**
 * Moon surface — procedural terrain driven by selectedMap profile.
 */
export default function MoonSurface({ selectedMap = 'crater-a', isGridEnabled = true }) {
  const planeSize = 210
  const segments = 400

  const profile = getMapProfile(selectedMap)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const [cr, cg, cb] = profile.colorBase
    const range = profile.colorRange

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i)
      const ly = pos.getY(i)
      const h = getTerrainHeight(lx, -ly, selectedMap)
      pos.setZ(i, h)

      const t = Math.max(0, Math.min(1, (h + 8) / 16))
      colors[i * 3]     = cr + t * range
      colors[i * 3 + 1] = cg + t * range * 0.95
      colors[i * 3 + 2] = cb + t * range * 1.05
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [selectedMap, planeSize, segments])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          vertexColors
          roughness={0.95}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {isGridEnabled && <SparseGrid size={planeSize} spacing={15} />}

      <Rocks count={profile.rockCount} spread={planeSize * 0.88} mapId={selectedMap} />
      <Boulders count={profile.boulderCount} spread={planeSize * 0.82} mapId={selectedMap} />
    </group>
  )
}

function SparseGrid({ size, spacing = 15 }) {
  const lines = useMemo(() => {
    const half = size / 2
    const pts = []
    for (let i = -half; i <= half; i += spacing) {
      pts.push(new THREE.Vector3(-half, 0.02, i), new THREE.Vector3(half, 0.02, i))
      pts.push(new THREE.Vector3(i, 0.02, -half), new THREE.Vector3(i, 0.02, half))
    }
    return pts
  }, [size, spacing])

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
      <lineBasicMaterial color="#00f2ff" transparent opacity={0.035} />
    </lineSegments>
  )
}

function Rocks({ count = 2000, spread = 180, mapId = 'crater-a' }) {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current) return
    const rng = seededRandom(42)
    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * spread
      const z = (rng() - 0.5) * spread
      const y = getTerrainHeight(x, z, mapId)
      const sc = 0.06 + rng() * 0.28

      dummy.position.set(x, y + sc * 0.3, z)
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI)
      dummy.scale.set(sc, sc * (0.3 + rng() * 0.7), sc)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, spread, mapId])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a4a4a" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  )
}

function Boulders({ count = 150, spread = 170, mapId = 'crater-a' }) {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current) return
    const rng = seededRandom(777)
    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      const x = (rng() - 0.5) * spread
      const z = (rng() - 0.5) * spread
      const y = getTerrainHeight(x, z, mapId)
      const sc = 0.4 + rng() * 1.0

      dummy.position.set(x, y + sc * 0.2, z)
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * 0.5)
      dummy.scale.set(sc, sc * (0.3 + rng() * 0.5), sc * (0.6 + rng() * 0.4))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, spread, mapId])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3d3d3d" roughness={1} metalness={0.08} />
    </instancedMesh>
  )
}
