import { motion } from 'framer-motion'

const contourPaths = [
    'M40 76 C150 28, 260 32, 352 80 S548 130, 660 76',
    'M24 150 C124 98, 260 104, 360 152 S548 206, 680 148',
    'M30 236 C140 182, 288 196, 388 246 S586 292, 690 236',
    'M52 322 C164 274, 300 286, 408 330 S600 382, 702 332',
    'M66 408 C192 362, 332 374, 446 418 S628 468, 720 420',
]

export default function ModelMap({ isGridEnabled }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="relative h-full w-full overflow-hidden rounded-3xl border border-cyan-300/12 bg-cyan-950/6"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(0,242,255,0.18),transparent_40%),radial-gradient(circle_at_78%_68%,rgba(0,242,255,0.12),transparent_42%)]" />

            {isGridEnabled && <div className="scan-grid absolute inset-0 opacity-20" />}

            <svg
                viewBox="0 0 760 520"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0, 242, 255, 0.2)" />
                        <stop offset="100%" stopColor="rgba(0, 242, 255, 0.85)" />
                    </linearGradient>
                </defs>

                {contourPaths.map((path) => (
                    <path
                        key={path}
                        d={path}
                        fill="none"
                        stroke="rgba(0, 242, 255, 0.28)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                ))}

                <path
                    d="M80 420 C190 340, 280 330, 358 292 S520 200, 650 116"
                    fill="none"
                    stroke="url(#routeGlow)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="8 10"
                />

                <circle cx="356" cy="294" r="6" fill="rgba(0, 242, 255, 0.95)" />
                <circle cx="650" cy="116" r="8" fill="rgba(40, 255, 192, 0.92)" />
            </svg>

            <motion.div
                animate={{ x: ['8%', '82%', '8%'], y: ['20%', '62%', '20%'] }}
                transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
                className="absolute h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(0,242,255,0.85)]"
            />

            <div className="absolute left-4 top-4 rounded-md border border-cyan-300/20 bg-black/10 px-3 py-1.5 text-[10px] tracking-[0.28em] text-cyan-100/80">
                LUNAR MODEL MAP
            </div>
        </motion.div>
    )
}
