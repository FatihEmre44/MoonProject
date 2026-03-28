import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function RouteBot({
    isStarted,
    message,
    hasRoute,
    isExplaining,
    onExplainRoute,
}) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!isStarted) {
            setIsOpen(false)
        }
    }, [isStarted])

    return (
        <>
            <AnimatePresence>
                {isStarted && !isOpen && (
                    <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.22 }}
                        onClick={() => setIsOpen(true)}
                        className="pointer-events-auto fixed bottom-5 right-5 z-40 rounded-xl border border-cyan-300/30 bg-black/55 px-4 py-2 text-[11px] tracking-[0.22em] text-cyan-100 backdrop-blur-md transition-colors hover:bg-black/70"
                    >
                        ROTA BOTU
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isStarted && isOpen && (
                    <motion.aside
                        initial={{ opacity: 0, x: 28 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        transition={{ duration: 0.26 }}
                        className="pointer-events-auto fixed bottom-5 right-5 z-40 w-[360px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-cyan-300/20 bg-black/45 p-4 backdrop-blur-md"
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-500/15 text-xs text-cyan-100">
                                    AI
                                </span>
                                <div>
                                    <p className="text-[10px] tracking-[0.25em] text-cyan-200/70">ROTA BOTU</p>
                                    <p className="text-[11px] text-cyan-100/90">Rota karar aciklamasi</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-md border border-cyan-300/25 bg-cyan-500/10 px-2 py-1 text-[10px] tracking-[0.1em] text-cyan-100/90 hover:bg-cyan-500/20"
                                    aria-label="Rota botunu kapat"
                                >
                                    KAPAT
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-cyan-300/12 bg-black/25 p-3">
                            <p className="text-xs leading-5 text-cyan-100/92">
                                {message || 'Hedef secin ve rota planlayin. Bot, neden bu rotanin secildigini burada aciklar.'}
                            </p>
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
        </>
    )
}
