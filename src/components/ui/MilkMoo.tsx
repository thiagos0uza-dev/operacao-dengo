import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { easterEggs } from '../../content/config'
import { emit } from '../../game/interactions/director'
import { sfx } from '../../audio/sound'

export function CupSvg({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d="M50 8 c-4 6 -14 6 -16 14 c-14 0 -20 10 -14 18 h60 c6 -8 0 -18 -14 -18 c-2 -8 -12 -8 -16 -14z" fill="#ffe3ee" stroke="#1a1633" strokeWidth="3" />
      <path d="M34 22 c8 4 24 4 32 0" stroke="#ff6fa5" strokeWidth="3" fill="none" />
      <circle cx="50" cy="9" r="5" fill="#ff3b5c" stroke="#1a1633" strokeWidth="2.5" />
      <path d="M22 40 h56 l-7 52 h-42z" fill="#fff" stroke="#1a1633" strokeWidth="3" />
      <ellipse cx="38" cy="56" rx="6" ry="4.5" fill="#1a1633" />
      <ellipse cx="62" cy="72" rx="7" ry="5" fill="#1a1633" />
      <ellipse cx="44" cy="82" rx="4" ry="3" fill="#1a1633" />
      <text x="50" y="68" textAnchor="middle" fontSize="13" fontWeight="900" fill="#ff6fa5" fontFamily="Bricolage Grotesque Variable, sans-serif">
        MOO ∞
      </text>
      <path d="M62 6 l-6 34" stroke="#ff6fa5" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

const thresholds = Object.keys(easterEggs.milkMoo).map(Number).sort((a, b) => a - b)

/** Item lendário. Cada toque piora (melhora?) a situação. */
export function MilkMooPanel({ onClose }: { onClose: () => void }) {
  const [n, setN] = useState(0)
  const [line, setLine] = useState('Toque no copo. Ele nunca acaba.')
  const level = thresholds.filter((t) => n >= t).length
  const cups = Math.min(40, Math.floor(n * 1.2))

  const tap = () => {
    const k = n + 1
    setN(k)
    sfx(k % 5 === 0 ? 'pop' : 'squeak', { rate: 0.9 + Math.min(1, k / 30) })
    const l = easterEggs.milkMoo[k]
    if (l) setLine(l)
    if (k === 35) emit('confetti', { pos: [0, 2, 2], n: 160 })
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className={`card legendary lvl-${Math.min(level, 6)}`} initial={{ scale: 0.7, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <div className="rarity">★ ITEM LENDÁRIO ★</div>
        <h2>Milk Moo Infinito</h2>
        <p className="muted">Nunca acaba. Cientistas não sabem explicar. O robô também não.</p>
        <div className="moo-stage">
          {Array.from({ length: cups }, (_, i) => (
            <span key={i} className="mini-cup" style={{ left: `${(i * 37) % 92}%`, animationDelay: `${(i % 7) * 0.13}s` }}>
              <CupSvg size={26} />
            </span>
          ))}
          <motion.button className="moo-cup" onClick={tap} whileTap={{ scale: 0.85, rotate: -8 }} aria-label="Tocar no Milk Moo" data-testid="milkmoo-cup">
            <CupSvg size={130} />
          </motion.button>
        </div>
        <div className="moo-count">reabastecido {n}x · estoque restante: ∞</div>
        <AnimatePresence mode="wait">
          <motion.p key={line} className="moo-line" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
            {line}
          </motion.p>
        </AnimatePresence>
        <button className="btn ghost" onClick={onClose} data-testid="milkmoo-close">
          Guardar (ele continua cheio)
        </button>
      </motion.div>
    </motion.div>
  )
}
