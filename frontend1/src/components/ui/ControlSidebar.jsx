import { motion } from 'framer-motion'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'

function lineClass(level) {
    if (level === 'warn') {
        return 'text-rose-400'
    }
    return 'text-cyan-100/90'
}

function TelemetryRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-cyan-300/15 py-2 text-xs">
            <span className="text-cyan-200/70">{label}</span>
            <span className="text-cyan-100">{value}</span>
        </div>
    )
}

export default function ControlSidebar({
    isOpen,
    telemetry,
    target,
    isGridEnabled,
    onRecalculatePath,
    onToggleGrid,
    onResetSimulation,
    onClose,
    selectedMap,
    onSelectMap,
}) {
    const [isMapMenuOpen, setIsMapMenuOpen] = useState(false)
    const maps = [
        { id: 'crater-a', label: 'Crater A-19' },
        { id: 'vallis', label: 'Vallis Marineris' },
        { id: 'olympus', label: 'Olympus Mons' },
        { id: 'polar', label: 'Polar Region' },
    ]
    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-auto absolute inset-0 bg-black/0"
                />
            )}

            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: isOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 160, damping: 23 }}
                className="panel-glass pointer-events-auto absolute left-0 top-0 h-full w-full max-w-md rounded-r-3xl p-6"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="close-chip absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/14 bg-black/0 text-sm text-cyan-100/70 transition-colors hover:border-cyan-200/35 hover:bg-cyan-950/12 hover:text-cyan-50"
                    aria-label="Close panel"
                >
                    ×
                </button>

                <header className="mb-6 border-b border-cyan-300/20 pb-4">
                    <div className="mb-2 flex items-center gap-3">
                        <span className="status-pulse inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <h2 className="text-sm tracking-[0.22em] text-cyan-100">ROVER OS v1.0 - ACTIVE</h2>
                    </div>
                    <p className="text-[11px] text-cyan-200/70">LUNAR LINK ONLINE</p>
                </header>

                <section className="mb-5">
                    <h3 className="mb-2 text-xs tracking-[0.3em] text-cyan-200/70">TELEMETRY</h3>
                    <div className="rounded-xl border border-cyan-300/10 bg-black/0 px-3">
                        <TelemetryRow label="Anlik Hiz" value={`${telemetry.speed.toFixed(2)} m/s`} />
                        <TelemetryRow label="Pitch" value={`${telemetry.pitch.toFixed(1)} deg`} />
                        <TelemetryRow label="Roll" value={`${telemetry.roll.toFixed(1)} deg`} />
                        <TelemetryRow label="X" value={telemetry.x.toFixed(2)} />
                        <TelemetryRow label="Y" value={telemetry.y.toFixed(2)} />
                        <TelemetryRow label="Z" value={telemetry.z.toFixed(2)} />
                        <TelemetryRow label="Sicaklik" value={`${telemetry.temperature.toFixed(1)} °C`} />
                    </div>
                </section>

                <section className="mb-6 rounded-xl border border-cyan-300/10 bg-black/0 p-3">
                    <h3 className="mb-3 text-xs tracking-[0.3em] text-cyan-200/70">TARGET INFO</h3>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-cyan-200/75">Target Node</span>
                        <span className="text-cyan-100">{target.name}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-cyan-200/75">Remaining Distance</span>
                        <span className="text-cyan-100">{target.distance.toFixed(0)} meters</span>
                    </div>
                </section>

                <section className="mb-6 rounded-xl border border-cyan-300/10 bg-black/0 p-3">
                    <h3 className="mb-3 text-xs tracking-[0.3em] text-cyan-200/70">MAP SELECTION</h3>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMapMenuOpen(!isMapMenuOpen)}
                        className="w-full rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 transition-all hover:bg-cyan-500/15"
                    >
                        {maps.find((m) => m.id === selectedMap)?.label} ▼
                    </motion.button>
                    <AnimatePresence>
                        {isMapMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mt-2 space-y-2"
                            >
                                {maps.map((map) => (
                                    <motion.button
                                        key={map.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            onSelectMap(map.id)
                                            setIsMapMenuOpen(false)
                                        }}
                                        className={`w-full rounded-lg border px-3 py-2 text-xs transition-all ${selectedMap === map.id
                                                ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
                                                : 'border-cyan-300/20 bg-black/20 text-cyan-200/70 hover:bg-cyan-500/10'
                                            }`}
                                    >
                                        ✓ {map.label}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                <footer className="mt-auto flex flex-col gap-3">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={onResetSimulation}
                        className="rounded-xl border border-rose-400/45 bg-rose-500/15 px-4 py-3 text-xs tracking-[0.2em] text-rose-200"
                    >
                        SIMULASYONU SIFIRLA
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={onRecalculatePath}
                        className="rounded-xl border border-amber-400/45 bg-amber-500/15 px-4 py-3 text-xs tracking-[0.2em] text-amber-200"
                    >
                        RECALCULATE PATH
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={onToggleGrid}
                        className="rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-4 py-3 text-xs tracking-[0.2em] text-cyan-100"
                    >
                        TOGGLE GRID {isGridEnabled ? 'ON' : 'OFF'}
                    </motion.button>
                </footer>
            </motion.aside>
        </>
    )
}
