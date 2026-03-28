import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { getTerrainHeight, getMapProfile } from '../../utils/terrainUtils'

const MAP_SIZE = 160
const WORLD_SPAN = 200

export default function Minimap({ isStarted, selectedMap = 'mid-crater' }) {
    const canvasRef = useRef(null)
    const bgRef = useRef(null)

    // Render terrain heightmap when map changes
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const img = ctx.createImageData(MAP_SIZE, MAP_SIZE)
        const profile = getMapProfile(selectedMap)
        const [cr, cg, cb] = profile.colorBase

        for (let py = 0; py < MAP_SIZE; py++) {
            for (let px = 0; px < MAP_SIZE; px++) {
                const worldX = (px / MAP_SIZE - 0.5) * WORLD_SPAN
                const worldZ = (py / MAP_SIZE - 0.5) * WORLD_SPAN
                const h = getTerrainHeight(worldX, worldZ, selectedMap)

                const t = Math.max(0, Math.min(1, (h + 8) / 16))
                const r = Math.floor((cr + t * profile.colorRange) * 255)
                const g = Math.floor((cg + t * profile.colorRange * 0.95) * 255)
                const b = Math.floor((cb + t * profile.colorRange * 1.1) * 255)

                const idx = (py * MAP_SIZE + px) * 4
                img.data[idx] = Math.min(255, r)
                img.data[idx + 1] = Math.min(255, g)
                img.data[idx + 2] = Math.min(255, b + 15)
                img.data[idx + 3] = 255
            }
        }

        bgRef.current = img
        ctx.putImageData(img, 0, 0)

        // Draw craters as subtle circles
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)'
        ctx.lineWidth = 0.8
        for (const c of profile.craters) {
            const px = (c.wx / WORLD_SPAN + 0.5) * MAP_SIZE
            const py = (c.wz / WORLD_SPAN + 0.5) * MAP_SIZE
            const r = (c.r / WORLD_SPAN) * MAP_SIZE
            ctx.beginPath()
            ctx.arc(px, py, Math.max(r, 1.5), 0, Math.PI * 2)
            ctx.stroke()
        }

        // Draw rover path
        const pathPoints = [
            [0.15, 0.85], [0.22, 0.72], [0.30, 0.60],
            [0.42, 0.52], [0.55, 0.45], [0.65, 0.35],
            [0.78, 0.25], [0.85, 0.18],
        ]
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        pathPoints.forEach(([x, y], i) => {
            const px = x * MAP_SIZE, py = y * MAP_SIZE
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
        })
        ctx.stroke()
        ctx.setLineDash([])

        // Start & end markers
        ctx.fillStyle = 'rgba(0, 242, 255, 0.9)'
        ctx.beginPath()
        ctx.arc(pathPoints[0][0] * MAP_SIZE, pathPoints[0][1] * MAP_SIZE, 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(40, 255, 120, 0.9)'
        ctx.beginPath()
        const last = pathPoints[pathPoints.length - 1]
        ctx.arc(last[0] * MAP_SIZE, last[1] * MAP_SIZE, 3, 0, Math.PI * 2)
        ctx.fill()
    }, [selectedMap])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isStarted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none fixed right-5 top-5 z-40 overflow-hidden rounded-xl border border-cyan-300/25 bg-black/40 backdrop-blur-md"
            style={{ width: MAP_SIZE + 16, padding: 8 }}
        >
            {/* Header */}
            <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="text-[9px] font-bold tracking-[0.3em] text-cyan-300/80">◈ MAP</span>
                <span className="text-[8px] tracking-[0.15em] text-cyan-200/50">
                    {getMapProfile(selectedMap).label}
                </span>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={MAP_SIZE}
                height={MAP_SIZE}
                style={{
                    width: MAP_SIZE,
                    height: MAP_SIZE,
                    borderRadius: 6,
                    border: '1px solid rgba(0, 242, 255, 0.12)',
                    imageRendering: 'pixelated',
                }}
            />

            {/* Animated rover dot */}
            <motion.div
                animate={{
                    x: [MAP_SIZE * 0.15, MAP_SIZE * 0.42, MAP_SIZE * 0.65, MAP_SIZE * 0.85],
                    y: [MAP_SIZE * 0.85, MAP_SIZE * 0.52, MAP_SIZE * 0.35, MAP_SIZE * 0.18],
                }}
                transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
                className="pointer-events-none absolute"
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00f2ff',
                    boxShadow: '0 0 8px rgba(0,242,255,0.9), 0 0 16px rgba(0,242,255,0.4)',
                    left: 8,
                    top: 22,
                }}
            />
        </motion.div>
    )
}
