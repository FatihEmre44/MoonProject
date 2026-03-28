import { useEffect, useState, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import IntroScreen from './components/ui/IntroScreen'
import MenuTrigger from './components/ui/MenuTrigger'
import ControlSidebar from './components/ui/ControlSidebar'
import MoonSurface from './components/MoonSurface'
import Lighting from './components/Lighting'
import Stars from './components/Stars'
import Rover from './components/Rover'

const INITIAL_TELEMETRY = {
    speed: 1.85,
    pitch: -2.4,
    roll: 1.3,
    x: 126.5,
    y: 4.1,
    z: -342.7,
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

const ROVER_PATH = [
    [-50, 0, -60],
    [-20, 0, -40],
    [0, 0, -10],
    [30, 0, 20],
    [50, 0, 50],
    [40, 0, 80],
    [0, 0, 90],
    [-40, 0, 70],
]

function randomRange(min, max) {
    return Math.random() * (max - min) + min
}

export default function App() {
    const [isStarted, setIsStarted] = useState(false)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [isGridEnabled, setIsGridEnabled] = useState(true)

    const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY)

    const [target, setTarget] = useState(INITIAL_TARGET)

    const [logs, setLogs] = useState(INITIAL_LOGS)

    useEffect(() => {
        if (!isStarted) {
            return undefined
        }

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
    }, [isStarted])

    const handleRecalculatePath = () => {
        setLogs((prev) => [
            ...prev.slice(-7),
            { id: Date.now(), text: 'Path recalculation requested', level: 'ok' },
        ])
        setTarget((prev) => ({ ...prev, distance: prev.distance + randomRange(20, 120) }))
    }

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
        setIsStarted(false)
        setIsPanelOpen(false)
        setIsGridEnabled(true)
        setTelemetry(INITIAL_TELEMETRY)
        setTarget(INITIAL_TARGET)
        setLogs(INITIAL_LOGS)
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
                        camera={{ position: [0, 120, 120], fov: 55 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Suspense fallback={null}>
                            <Stars />
                            <Lighting />
                            <MoonSurface isGridEnabled={isGridEnabled} />
                            <Rover path={ROVER_PATH} isPlaying={isStarted} speed={1} />
                        </Suspense>
                    </Canvas>
                )}
            </motion.section>

            <div className="pointer-events-none absolute inset-0 z-50">
                <AnimatePresence mode="wait">
                    {!isStarted && <IntroScreen key="intro" onStart={() => setIsStarted(true)} />}
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
                                isGridEnabled={isGridEnabled}
                                onRecalculatePath={handleRecalculatePath}
                                onToggleGrid={handleToggleGrid}
                                onResetSimulation={handleResetSimulation}
                                onClose={() => setIsPanelOpen(false)}
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
