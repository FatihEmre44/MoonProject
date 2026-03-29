import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { getTerrainHeight, getMapProfile } from '../utils/terrainUtils'
import {
  TERRAIN_PLANE_SIZE,
  ROCK_SPREAD_FACTOR,
  BOULDER_SPREAD_FACTOR,
  generateRockInstances,
  generateBoulderInstances,
} from '../utils/obstacleField'

/**
 * Moon surface — procedural terrain driven by selectedMap profile.
 */
export default function MoonSurface({
  selectedMap = 'crater-a',
  isGridEnabled = true,
  onSelectTarget,
}) {
  const planeSize = TERRAIN_PLANE_SIZE

  const profile = getMapProfile(selectedMap)
  const segments = profile.terrainSegments || 320

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const [cr, cg, cb] = profile.colorBase
    const range = profile.colorRange

    const mapRadius = planeSize * 0.5
    const fadeStart = planeSize * 0.28

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i)
      const ly = pos.getY(i)

      // Kenardan uzakligi hesapla ve edge factor belirle
      const dist = Math.hypot(lx, ly)
      const edgeFactor = Math.max(
        0,
        Math.min(1, (dist - fadeStart) / (mapRadius - fadeStart))
      )

      const nx = Math.abs(lx) / mapRadius
      const ny = Math.abs(ly) / mapRadius
      const squareN = Math.max(nx, ny)
      const cornerN = Math.min(1, Math.hypot(nx, ny) / Math.SQRT2)
      const edgeFold = Math.max(0, Math.min(1, (squareN - 0.64) / 0.36))
      const cornerFold = Math.max(0, Math.min(1, (cornerN - 0.7) / 0.3))
      
      // Yukseklik terrain fonksiyonundan gelir (kuresel egim + yerel engebeler dahil).
      const h = getTerrainHeight(lx, -ly, selectedMap)

      pos.setZ(i, h)

      const t = Math.max(0, Math.min(1, (h + 8) / 16))
      const baseR = cr + t * range
      const baseG = cg + t * range * 0.95
      const baseB = cb + t * range * 1.05

      // Kenar karartilmasi guclendirme
      const edgeDark = Math.max(
        0.03,
        1 - edgeFactor * 0.65 - edgeFold * 0.72 - cornerFold * 0.95,
      )

      colors[i * 3] = baseR * edgeDark
      colors[i * 3 + 1] = baseG * edgeDark
      colors[i * 3 + 2] = baseB * edgeDark
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [selectedMap, planeSize, segments])

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation()
        if (e.button !== 0 && e.button !== 2) return
        onSelectTarget?.({ x: e.point.x, z: e.point.z, button: e.button })
      }}
    >
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        castShadow
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          vertexColors
          roughness={0.95}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {isGridEnabled && <SparseGrid size={planeSize} spacing={15} />}
      <CircularVignette size={planeSize} />

      <Rocks count={profile.rockCount} spread={planeSize * ROCK_SPREAD_FACTOR} mapId={selectedMap} />
      <Boulders count={profile.boulderCount} spread={planeSize * BOULDER_SPREAD_FACTOR} mapId={selectedMap} />
    </group>
  )
}

function SparseGrid({ size, spacing = 15 }) {
  const lines = useMemo(() => {
    const half = size / 2
    const radius = size * 0.47
    const pts = []

    const safeRoot = (v) => Math.sqrt(Math.max(0, v))

    for (let i = -half; i <= half; i += spacing) {
      // Dairesel clip: yatay grid cizgileri
      if (Math.abs(i) <= radius) {
        const xMax = safeRoot(radius * radius - i * i)
        pts.push(new THREE.Vector3(-xMax, 0.02, i), new THREE.Vector3(xMax, 0.02, i))
      }

      // Dairesel clip: dikey grid cizgileri
      if (Math.abs(i) <= radius) {
        const zMax = safeRoot(radius * radius - i * i)
        pts.push(new THREE.Vector3(i, 0.02, -zMax), new THREE.Vector3(i, 0.02, zMax))
      }
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

function CircularVignette({ size }) {
  const innerRadius = size * 0.38
  const outerRadius = size * 0.9

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} raycast={() => null}>
      <ringGeometry args={[innerRadius, outerRadius, 96]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.62} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

function Rocks({ count = 2000, spread = 180, mapId = 'crater-a' }) {
  const meshRef = useRef()
  const instances = useMemo(
    () => generateRockInstances({ mapId, count, spread }),
    [count, spread, mapId],
  )

  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const dummy = new THREE.Object3D()

    for (let i = 0; i < instances.length; i++) {
      const item = instances[i]
      const y = getTerrainHeight(item.x, item.z, mapId)

      dummy.position.set(item.x, y + item.scaleX * 0.3, item.z)
      dummy.rotation.set(item.rotX, item.rotY, item.rotZ)
      dummy.scale.set(item.scaleX, item.scaleY, item.scaleZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [instances, mapId])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow raycast={() => null} frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a4a4a" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  )
}

function Boulders({ count = 150, spread = 170, mapId = 'crater-a' }) {
  const meshRef = useRef()
  const instances = useMemo(
    () => generateBoulderInstances({ mapId, count, spread }),
    [count, spread, mapId],
  )

  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const dummy = new THREE.Object3D()

    for (let i = 0; i < instances.length; i++) {
      const item = instances[i]
      const y = getTerrainHeight(item.x, item.z, mapId)

      dummy.position.set(item.x, y + item.scaleX * 0.2, item.z)
      dummy.rotation.set(item.rotX, item.rotY, item.rotZ)
      dummy.scale.set(item.scaleX, item.scaleY, item.scaleZ)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [instances, mapId])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow raycast={() => null} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3d3d3d" roughness={1} metalness={0.08} />
    </instancedMesh>
  )
}
