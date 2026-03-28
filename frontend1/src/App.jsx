import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import MenuTrigger from './components/ui/MenuTrigger'
import ControlSidebar from './components/ui/ControlSidebar'
import Minimap from './components/ui/Minimap'
import MoonSurface from './components/MoonSurface'
import PathLine from './components/PathLine'
import Lighting from './components/Lighting'
import Stars from './components/Stars'
import Rover from './components/Rover'
import { getTerrainHeight } from './utils/terrainUtils'
import { worldToGrid, gridToWorld, pathToWorld } from './utils/coordinateMapper'
import { buildMapDataFromProfile, sendAstarRequest } from './utils/buildMapData'

const INITIAL_TELEMETRY = {
    speed: 1.85,
    pitch: -2.4,
    roll: 1.3,
    x: 126.5,
    y: 4.1,
    z: -342.7,
    temperature: 45.2,
}

const INITIAL_TARGET = {
    name: 'Crater A-19',
    distance: 1480,
}

const INITIAL_LOGS = [
    { id: 1, text: 'ROVER OS v1.0 boot complete', level: 'ok' },
    { id: 2, text: 'Navigation uplink established', level: 'ok' },
    { id: 3, text: 'Pathfinding...', level: 'ok' },
]

const missionMessages = [
    'Pathfinding...',
    'Lidar scan in progress',
    'Obstacle detected: micro crater',
    'Autonomous correction applied',
    'Signal stable with relay node',
    'Thermal sensors nominal',
    'Subsurface scan complete',
]

const ROVER_ANCHORS = {
    'low-crater': [0, 0, 78],
    'mid-crater': [0, 0, 78],
    'high-crater': [0, 0, 78],
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min
}

function CameraController({ roverPosition, isRoverFocused }) {
    const { camera } = useThree()
    const mapPosition = useMemo(() => new THREE.Vector3(0, 120, 120), [])
    const mapLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), [])
    const targetPosition = useMemo(() => new THREE.Vector3(), [])
    const targetLookAt = useMemo(() => new THREE.Vector3(), [])

    useFrame(() => {
        if (isRoverFocused) {
            targetPosition.set(roverPosition[0] + 10, roverPosition[1] + 6, roverPosition[2] + 10)
            targetLookAt.set(roverPosition[0], roverPosition[1] + 1.1, roverPosition[2])
        } else {
            targetPosition.copy(mapPosition)
            targetLookAt.copy(mapLookAt)
        }

        camera.position.lerp(targetPosition, 0.08)
        camera.lookAt(targetLookAt)
    })

    return null
}

function TargetMarker({ position }) {
    const markerRef = useRef(null)

    useFrame((state) => {
        if (!markerRef.current) return
        const t = state.clock.elapsedTime
        markerRef.current.rotation.y = t * 1.5
        markerRef.current.position.y = position[1] + 0.4 + Math.sin(t * 3.2) * 0.08
    })

    return (
        <group ref={(node) => { markerRef.current = node }} position={[position[0], position[1] + 0.4, position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
                <ringGeometry args={[0.35, 0.48, 48]} />
                <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.85} transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0.35, 0]} raycast={() => null}>
                <coneGeometry args={[0.12, 0.3, 20]} />
                <meshStandardMaterial color="#ff5f5f" emissive="#ff4040" emissiveIntensity={0.9} />
            </mesh>
        </group>
    )
}

export default function App() {
    const [isStarted, setIsStarted] = useState(false)
    const [isRoverMoving, setIsRoverMoving] = useState(false)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [isGridEnabled, setIsGridEnabled] = useState(true)
    const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY)
    const [target, setTarget] = useState(INITIAL_TARGET)
    const [logs, setLogs] = useState(INITIAL_LOGS)
    const [selectedMap, setSelectedMap] = useState('mid-crater')
    const [isRoverFocused, setIsRoverFocused] = useState(false)
    const [roverResetSignal, setRoverResetSignal] = useState(0)
    const [selectedTargetGrid, setSelectedTargetGrid] = useState(null)
    const [plannedRouteWorld, setPlannedRouteWorld] = useState([])

    const roverStartPosition = useMemo(() => {
        const [x, , z] = ROVER_ANCHORS[selectedMap] ?? [0, 0, 78]
        return [x, getTerrainHeight(x, z, selectedMap) + 0.48, z]
    }, [selectedMap])

    const [roverLivePosition, setRoverLivePosition] = useState(roverStartPosition)

    const selectedTargetWorld = useMemo(() => {
        if (!selectedTargetGrid) return null
        const [row, col] = selectedTargetGrid
        const { x, z } = gridToWorld(col, row)
        const y = getTerrainHeight(x, z, selectedMap)
        return [x, y, z]
    }, [selectedTargetGrid, selectedMap])

    useEffect(() => {
        setRoverLivePosition(roverStartPosition)
    }, [roverStartPosition])

    useEffect(() => {
        setIsRoverMoving(false)
        setSelectedTargetGrid(null)
        setPlannedRouteWorld([])
        setTarget(INITIAL_TARGET)
        setRoverResetSignal((prev) => prev + 1)
    }, [selectedMap])

    const handleTerrainTargetSelect = ({ x, z }) => {
        const { row, col } = worldToGrid(x, z)
        const clampedRow = Math.max(0, Math.min(199, row))
        const clampedCol = Math.max(0, Math.min(199, col))
        setSelectedTargetGrid([clampedRow, clampedCol])

        const dx = x - roverLivePosition[0]
        const dz = z - roverLivePosition[2]
        const distance = Math.hypot(dx, dz)

        setTarget({
            name: `GRID [${clampedRow}, ${clampedCol}]`,
            distance,
        })

        setLogs((prev) => [
            ...prev.slice(-7),
            {
                id: Date.now(),
                text: `Hedef secildi: [${clampedRow}, ${clampedCol}]`,
                level: 'ok',
            },
        ])
    }

    const handlePlanRoute = async () => {
        if (!selectedTargetGrid) {
            throw new Error('Lutfen harita uzerinde hedef noktayi tiklayin')
        }

        const mapData = buildMapDataFromProfile(selectedMap)
        const start = worldToGrid(roverLivePosition[0], roverLivePosition[2])
        const waypoints = [
            [Math.max(0, Math.min(199, start.row)), Math.max(0, Math.min(199, start.col))],
            selectedTargetGrid,
        ]

        const result = await sendAstarRequest(
            { ...mapData, waypoints },
            'http://localhost:3000',
            false
        )

        if (!result?.success || !Array.isArray(result.path)) {
            return result
        }

        const worldPath = pathToWorld(result.path)
        setPlannedRouteWorld(worldPath)
        setIsRoverMoving(false)
        setRoverResetSignal((prev) => prev + 1)

        setLogs((prev) => [
            ...prev.slice(-7),
            {
                id: Date.now(),
                text: `Rota olusturuldu: ${result.stats.stepCount} adim`,
                level: 'ok',
            },
        ])

        return result
    }

    useEffect(() => {
        if (!isRoverMoving) return undefined

        const timer = setInterval(() => {
            setTelemetry((prev) => {
                const speed = Math.max(0.3, prev.speed + randomRange(-0.35, 0.45))
                const x = prev.x + speed * 0.72
                const y = Math.max(0, prev.y + randomRange(-0.22, 0.22))
                const z = prev.z + randomRange(0.9, 1.95)

                return {
                    speed,
                    pitch: randomRange(-14, 14),
                    roll: randomRange(-10, 10),
                    x,
                    y,
                    z,
                    temperature: Math.max(35, prev.temperature + randomRange(-2, 3)),
                }
            })

            setTarget((prev) => ({
                ...prev,
                distance: Math.max(0, prev.distance - randomRange(3, 9)),
            }))

            setLogs((prev) => {
                const next = missionMessages[Math.floor(Math.random() * missionMessages.length)]
                const level = next.toLowerCase().includes('obstacle') ? 'warn' : 'ok'
                const entry = { id: Date.now(), text: next, level }
                return [...prev.slice(-7), entry]
            })
        }, 950)

        return () => clearInterval(timer)
    }, [isRoverMoving])

    useEffect(() => {
        if (!selectedTargetGrid) return
        const [row, col] = selectedTargetGrid
        const targetWorld = gridToWorld(col, row)
        const distance = Math.hypot(
            targetWorld.x - roverLivePosition[0],
            targetWorld.z - roverLivePosition[2]
        )
        setTarget((prev) => ({
            ...prev,
            name: `GRID [${row}, ${col}]`,
            distance,
        }))
    }, [roverLivePosition, selectedTargetGrid])

    const handleToggleGrid = () => {
        setIsGridEnabled((prev) => !prev)
        setLogs((prev) => [
            ...prev.slice(-7),
            {
                id: Date.now(),
                text: `Navigation grid ${isGridEnabled ? 'disabled' : 'enabled'}`,
                level: 'ok',
            },
        ])
    }

    const handleResetSimulation = () => {
        // Reset rover motion timeline.
        setIsRoverMoving(false)
        setIsRoverFocused(false)
        setRoverResetSignal((prev) => prev + 1)
        setRoverLivePosition(roverStartPosition)
        setPlannedRouteWorld([])
        setSelectedTargetGrid(null)
        setTarget(INITIAL_TARGET)
    }

    const handleReturnToMenu = () => {
        setIsStarted(false)
        setIsRoverMoving(false)
        setIsPanelOpen(false)
        setIsGridEnabled(true)
        setIsRoverFocused(false)
        setTelemetry(INITIAL_TELEMETRY)
        setTarget(INITIAL_TARGET)
        setLogs(INITIAL_LOGS)
        setSelectedMap('mid-crater')
        setSelectedTargetGrid(null)
        setPlannedRouteWorld([])
        setRoverResetSignal((prev) => prev + 1)
    }

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-obsidian text-cyan-50">
            <div className="absolute inset-0 lunar-background" aria-hidden="true" />

            <motion.section
                initial={{ opacity: 0 }}
                animate={isStarted ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0"
            >
                {isStarted && (
                    <Canvas
                        camera={{ position: [0, 120, 120], fov: 55, far: 2000 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Suspense fallback={null}>
                            <Stars />
                            <Lighting />
                            <MoonSurface
                                selectedMap={selectedMap}
                                isGridEnabled={isGridEnabled}
                                onSelectTarget={handleTerrainTargetSelect}
                            />
                            {selectedTargetWorld && <TargetMarker position={selectedTargetWorld} />}
                            <PathLine path={plannedRouteWorld} currentStep={0} />
                            <Rover
                                initialPosition={roverStartPosition}
                                rotationY={Math.PI}
                                mapId={selectedMap}
                                isPlaying={isRoverMoving}
                                routePoints={plannedRouteWorld}
                                resetSignal={roverResetSignal}
                                onPositionChange={setRoverLivePosition}
                                onRouteComplete={() => {
                                    setIsRoverMoving(false)
                                    setLogs((prev) => [
                                        ...prev.slice(-7),
                                        {
                                            id: Date.now() + Math.random(),
                                            text: 'Rover hedefe ulasti',
                                            level: 'ok',
                                        },
                                    ])
                                }}
                                onObstacleHit={() => {
                                    setLogs((prev) => [
                                        ...prev.slice(-7),
                                        {
                                            id: Date.now() + Math.random(),
                                            text: 'Rock impact detected: stabilizer response active',
                                            level: 'warn',
                                        },
                                    ])
                                }}
                            />
                            <CameraController
                                roverPosition={roverLivePosition}
                                isRoverFocused={isRoverFocused}
                            />
                        </Suspense>
                    </Canvas>
                )}
            </motion.section>

            <div className="pointer-events-none absolute inset-0 z-50">
                <AnimatePresence mode="wait">
                    {!isStarted && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.35 } }}
                            className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/40 p-6"
                        >
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                className="panel-glass w-full max-w-xl rounded-3xl p-8 text-center"
                            >
                                <p className="mb-2 text-xs tracking-[0.45em] text-cyan-200/80">LUNAR ROVER CONTROL</p>
                                <h1 className="mb-6 text-2xl font-semibold tracking-[0.2em] text-cyan-100">
                                    MISSION CONTROL HUD
                                </h1>

                                <div className="mb-6">
                                    <h3 className="mb-3 text-xs tracking-[0.25em] text-cyan-200/70">HARİTA SEÇ</h3>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'low-crater', label: 'Mare Tranquillitatis', icon: '○' },
                                            { id: 'mid-crater', label: 'Oceanus Procellarum', icon: '◎' },
                                            { id: 'high-crater', label: 'Tycho Highlands', icon: '◉' },
                                        ].map((map) => (
                                            <motion.button
                                                key={map.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedMap(map.id)}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${selectedMap === map.id
                                                    ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                                                    : 'border-cyan-300/20 bg-black/20 text-cyan-200/70 hover:bg-cyan-500/10'
                                                    }`}
                                            >
                                                {map.icon} {map.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setIsStarted(true)}
                                    className="w-full rounded-xl border border-blue-400/50 bg-blue-500/20 px-6 py-4 text-sm font-bold tracking-[0.3em] text-blue-100 shadow-lg shadow-blue-500/20 transition-all hover:border-blue-300/70 hover:bg-blue-500/30 hover:shadow-blue-500/40"
                                >
                                    ▶▶▶ BAŞLAT ▶▶▶
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isStarted && (
                        <>
                            <MenuTrigger
                                isPanelOpen={isPanelOpen}
                                onClick={() => setIsPanelOpen((prev) => !prev)}
                            />

                            <ControlSidebar
                                isOpen={isPanelOpen}
                                telemetry={telemetry}
                                logs={logs}
                                target={target}
                                onResetSimulation={handleResetSimulation}
                                onReturnToMenu={handleReturnToMenu}
                                onClose={() => setIsPanelOpen(false)}
                                selectedMap={selectedMap}
                                onSelectMap={setSelectedMap}
                                selectedTargetGrid={selectedTargetGrid}
                                onPlanRoute={handlePlanRoute}
                                onStartRover={() => {
                                    if (plannedRouteWorld.length < 2) return
                                    setIsRoverMoving(true)
                                }}
                                canStartRover={plannedRouteWorld.length >= 2}
                            />

                            <Minimap
                                isStarted={isStarted}
                                selectedMap={selectedMap}
                                isGridEnabled={isGridEnabled}
                                isRoverFocused={isRoverFocused}
                                onToggleGrid={handleToggleGrid}
                                onToggleRoverFocus={() => setIsRoverFocused((prev) => !prev)}
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
