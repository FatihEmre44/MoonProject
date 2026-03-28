import { motion } from 'framer-motion'

export default function IntroScreen({ onStart }) {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/35 p-6"
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="panel-glass w-full max-w-xl rounded-3xl p-8 text-center"
            >
                <p className="mb-2 text-xs tracking-[0.45em] text-cyan-200/80">LUNAR ROVER CONTROL</p>
                <h1 className="mb-8 text-2xl font-semibold tracking-[0.2em] text-cyan-100">
                    MISSION CONTROL HUD
                </h1>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onStart}
                    className="mx-auto rounded-xl border border-cyan-300/40 bg-black/20 px-8 py-4 text-sm font-semibold tracking-[0.3em] text-cyan-100 transition-colors hover:border-cyan-300 hover:bg-cyan-950/18"
                >
                    START SIMULATION
                </motion.button>
            </motion.div>
        </motion.section>
    )
}
