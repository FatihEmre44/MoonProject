import { motion } from 'framer-motion'

const contourPaths = [
    'M40 76 C150 28, 260 32, 352 80 S548 130, 660 76',
    'M24 150 C124 98, 260 104, 360 152 S548 206, 680 148',
    'M30 236 C140 182, 288 196, 388 246 S586 292, 690 236',
    'M52 322 C164 274, 300 286, 408 330 S600 382, 702 332',
    'M66 408 C192 362, 332 374, 446 418 S628 468, 720 420',
]

export default function Minimap({ isGridEnabled, isStarted }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isStarted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none fixed right-6 top-6 z-40 h-36 w-36 overflow-hidden rounded-xl border border-cyan-300/20 bg-black/20 backdrop-blur-sm"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(0,242,255,0.12),transparent_50%)]" />

            {isGridEnabled && (
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            'linear-gradient(0deg, rgba(0,242,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.4) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                    }}
                />
            )}

            <svg
                viewBox="0 0 760 520"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="minimapRouteGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0, 242, 255, 0.3)" />
                        <stop offset="100%" stopColor="rgba(0, 242, 255, 0.7)" />
                    </linearGradient>
                </defs>

                {contourPaths.map((path, idx) => (
                    <path
                        key={idx}
                        d={path}
                        fill="none"
                        stroke="rgba(0, 242, 255, 0.25)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                ))}

                <path
                    d="M80 420 C190 340, 280 330, 358 292 S520 200, 650 116"
                    fill="none"
                    stroke="url(#minimapRouteGlow)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray="6 8"
                />

                <circle cx="356" cy="294" r="5" fill="rgba(0, 242, 255, 0.9)" />
                <circle cx="650" cy="116" r="6" fill="rgba(40, 255, 192, 0.85)" />
            </svg>

            <motion.div
                animate={{ x: ['8%', '82%', '8%'], y: ['20%', '62%', '20%'] }}
                transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
                className="pointer-events-none absolute h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.9)]"
            />

            <div className="pointer-events-none absolute bottom-1 left-1 rounded-sm bg-black/40 px-1.5 py-0.5 text-[7px] tracking-[0.2em] text-cyan-100/60">
                MAP
            </div>
        </motion.div>
    )
}
