import { AnimatePresence, motion } from 'framer-motion'

export default function RouteBot({
    isStarted,
    message,
    riskScore,
    status,
    hasRoute,
    isExplaining,
    onExplainRoute,
}) {
    return (
        <AnimatePresence>
            {isStarted && (
                <motion.aside
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.98 }}
                    transition={{ duration: 0.28 }}
                    className="pointer-events-auto z-40 rounded-2xl border border-cyan-300/20 bg-black/45 p-4 backdrop-blur-md"
                    style={{
                        position: 'fixed',
                        right: '1.25rem',
                        bottom: '1.25rem',
                        width: '360px',
                        maxWidth: 'calc(100vw - 2.5rem)',
                    }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-500/15 text-xs text-cyan-100">
                                AI
                            </span>
                            <div>
                                <p className="text-[10px] tracking-[0.25em] text-cyan-200/70">ROTA BOTU</p>
                                <p className="text-[11px] text-cyan-100/90">Rota karar aciklamasi</p>
                            </div>
                        </div>
                        {riskScore && (
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-100/85">
                                Risk: {riskScore}
                            </span>
                        )}
                    </div>

                    <div className="rounded-xl border border-cyan-300/12 bg-black/25 p-3">
                        <p className="text-xs leading-5 text-cyan-100/92">
                            {message || 'Hedef secin ve rota planlayin. Bot, neden bu rotanin secildigini burada aciklar.'}
                        </p>
                        {status && (
                            <p className="mt-2 text-[11px] text-cyan-200/70">Durum: {status}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onExplainRoute}
                        disabled={isExplaining || !hasRoute}
                        className={`mt-3 w-full rounded-xl border px-3 py-2 text-xs tracking-[0.2em] transition-all ${isExplaining
                            ? 'cursor-wait border-amber-300/40 bg-amber-500/10 text-amber-200/70'
                            : hasRoute
                                ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
                                : 'cursor-not-allowed border-slate-400/25 bg-slate-500/10 text-slate-300/65'
                            }`}
                    >
                        {isExplaining ? 'ACIKLAMA HAZIRLANIYOR' : 'NEDEN BU ROTAYI SECTI?'}
                    </button>
                </motion.aside>
            )}
        </AnimatePresence>
    )
}
