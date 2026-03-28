import { motion } from 'framer-motion'

export default function MenuTrigger({ isPanelOpen, onClick }) {
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            onClick={onClick}
            className="menu-lines pointer-events-auto absolute left-6 top-6 flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-xl border border-cyan-300/40 bg-black/60 p-3 backdrop-blur-lg"
            aria-label={isPanelOpen ? 'Close control panel' : 'Open control panel'}
        >
            <span className={isPanelOpen ? 'translate-y-[3.5px] rotate-45 transition-transform' : 'transition-transform'} />
            <span className={isPanelOpen ? 'opacity-0 transition-opacity' : 'transition-opacity'} />
            <span className={isPanelOpen ? '-translate-y-[3.5px] -rotate-45 transition-transform' : 'transition-transform'} />
        </motion.button>
    )
}
