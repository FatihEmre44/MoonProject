import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { getTerrainHeight, getMapProfile } from '../../utils/terrainUtils'

const MAP_SIZE = 160
const WORLD_SPAN = 200

export default function Minimap({
    isStarted,
    selectedMap = 'mid-crater',
    isGridEnabled = true,
    isRoverFocused = false,
    onToggleGrid,
    onToggleRoverFocus,
    roverPath = [],
    roverPosition = [0, 0, 0],
}) {
    const canvasRef = useRef(null)

    // Render whole minimap (Terrain + Grid + Craters + Path + Rover)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE)
        
        const img = ctx.createImageData(MAP_SIZE, MAP_SIZE)
        const profile = getMapProfile(selectedMap)
        const [cr, cg, cb] = profile.colorBase

        // 1. Terrain Heightmap
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
        ctx.putImageData(img, 0, 0)

        // 2. Grid Lines
        if (isGridEnabled) {
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.12)'
            ctx.lineWidth = 0.7
            for (let i = 0; i <= MAP_SIZE; i += 16) {
                ctx.beginPath()
                ctx.moveTo(i + 0.5, 0); ctx.lineTo(i + 0.5, MAP_SIZE); ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(0, i + 0.5); ctx.lineTo(MAP_SIZE, i + 0.5); ctx.stroke()
            }
        }

        // 3. Craters
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

        // 4. Actual Rover Path
        if (roverPath && roverPath.length >= 2) {
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)'
            ctx.lineWidth = 1.8
            ctx.setLineDash([5, 3])
            ctx.beginPath()
            roverPath.forEach(([wx, , wz], i) => {
                const px = (wx / WORLD_SPAN + 0.5) * MAP_SIZE
                const py = (wz / WORLD_SPAN + 0.5) * MAP_SIZE
                if (i === 0) ctx.moveTo(px, py)
                else ctx.lineTo(px, py)
            })
            ctx.stroke()
            ctx.setLineDash([])

            // Markers for Start and End
            const [sx, , sz] = roverPath[0]
            const [ex, , ez] = roverPath[roverPath.length - 1]
            
            ctx.fillStyle = '#00f2ff'
            ctx.beginPath()
            ctx.arc((sx/WORLD_SPAN+0.5)*MAP_SIZE, (sz/WORLD_SPAN+0.5)*MAP_SIZE, 3, 0, Math.PI*2)
            ctx.fill()

            ctx.fillStyle = '#28ff78'
            ctx.beginPath()
            ctx.arc((ex/WORLD_SPAN+0.5)*MAP_SIZE, (ez/WORLD_SPAN+0.5)*MAP_SIZE, 3.5, 0, Math.PI*2)
            ctx.fill()
        }

        // 5. Rover Live Marker
        const rx = (roverPosition[0] / WORLD_SPAN + 0.5) * MAP_SIZE
        const ry = (roverPosition[2] / WORLD_SPAN + 0.5) * MAP_SIZE
        
        // Glow effect
        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, 8)
        grad.addColorStop(0, 'rgba(0, 242, 255, 0.6)')
        grad.addColorStop(1, 'rgba(0, 242, 255, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(rx, ry, 8, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#00f2ff'
        ctx.lineWidth = 1
        ctx.stroke()
        
    }, [selectedMap, isGridEnabled, roverPath, roverPosition])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isStarted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-auto fixed right-5 top-5 z-40 overflow-hidden rounded-xl border border-cyan-300/20 bg-black/25 backdrop-blur-md"
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
            <div className="relative overflow-hidden rounded-md border border-cyan-400/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <canvas
                    ref={canvasRef}
                    width={MAP_SIZE}
                    height={MAP_SIZE}
                    style={{
                        width: MAP_SIZE,
                        height: MAP_SIZE,
                        imageRendering: 'pixelated',
                        display: 'block'
                    }}
                />
                {/* corner shading overlay */}
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_35px_rgba(0,0,0,0.7)]" />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onToggleGrid}
                    className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[9px] tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-500/20"
                >
                    GRID {isGridEnabled ? 'AÇIK' : 'KAPALI'}
                </button>
                <button
                    type="button"
                    onClick={onToggleRoverFocus}
                    className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[9px] tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-500/20"
                >
                    {isRoverFocused ? 'HARİTAYI GÖSTER' : 'ROVERA YAKLAŞ'}
                </button>
            </div>
        </motion.div>
    )
}
