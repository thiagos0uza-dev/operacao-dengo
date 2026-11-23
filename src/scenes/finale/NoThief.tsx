import { useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import type { Mood } from '../../content/config'
import { finale as T } from '../../content/config'
import { Face } from '../../components/dialogs/DialogBox'
import { useGame } from '../../game/state/store'
import { sfx } from '../../audio/sound'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * O R-404 tenta "confiscar" o botão Não duas vezes...
 * e na terceira devolve, porque foi programado para respeitar a escolha dela.
 */
export function NoThief({ onNo }: { onNo: () => void }) {
  const [scope, animate] = useAnimate()
  const [stage, setStage] = useState(0) // 0 e 1 = roubos; 2 = devolução; 3 = livre
  const [busy, setBusy] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  const [mood, setMood] = useState<Mood>('panic')
  const [show, setShow] = useState(false)
  const used = useRef<string[]>([])

  const pick = () => {
    const pool = T.noThief.lines.filter((l) => !used.current.includes(l))
    const l = pool[Math.floor(Math.random() * pool.length)] ?? T.noThief.lines[0]
    used.current.push(l)
    return l
  }

  const act = async () => {
    if (busy || stage >= 3) return
    setBusy(true)
    const k = useGame.getState().settings.reducedMotion ? 0.35 : 1
    const W = window.innerWidth
    const off = W * 0.9
    try {
      setShow(true)
      if (stage < 2) {
        // entra correndo pela direita
        setMood('panic')
        sfx('whoosh')
        await animate('.thief', { x: [off, 0], rotate: [-12, 0] }, { duration: 0.45 * k, ease: 'easeOut' })
        setMood('proud')
        setLine(pick())
        sfx('boop', { rate: 1.3 })
        await animate('.thief', { y: [0, -14, 0] }, { duration: 0.3 * k })
        await animate('.no-btn', { rotate: [0, -6, 6, 0], scale: [1, 0.94, 1] }, { duration: 0.35 * k })
        if (stage === 0) {
          // agarra e foge com o botão
          sfx('squeak')
          animate('.no-btn', { x: off, rotate: 14 }, { duration: 0.7 * k, ease: 'easeIn' })
          await animate('.thief', { x: off, rotate: 10 }, { duration: 0.7 * k, ease: 'easeIn' })
          setLine(null)
          await sleep(900 * k)
          // o botão volta escondidinho (o robô esqueceu de trancar a gaveta)
          await animate('.no-btn', { x: 0, rotate: 0 }, { type: 'spring', stiffness: 260, damping: 18 })
        } else {
          // segunda tentativa: foge... e tropeça
          sfx('squeak')
          animate('.no-btn', { x: off * 0.45, rotate: 10 }, { duration: 0.45 * k, ease: 'easeIn' })
          await animate('.thief', { x: off * 0.45 }, { duration: 0.45 * k, ease: 'easeIn' })
          setMood('dizzy')
          setLine(T.noThief.trip)
          sfx('crash')
          animate('.no-btn', { x: [off * 0.45, off * 0.2, 0], y: [0, -90, 0], rotate: [10, 200, 360] }, { duration: 0.9 * k, ease: 'easeOut' })
          await animate('.thief', { rotate: 90, y: 18 }, { duration: 0.3 * k, ease: 'easeIn' })
          await sleep(1300 * k)
          await animate('.thief', { rotate: 0, y: 0 }, { duration: 0.3 * k })
          setLine(null)
          await animate('.thief', { x: off }, { duration: 0.5 * k, ease: 'easeIn' })
        }
        setStage(stage + 1)
      } else {
        // terceira vez: devolve e respeita
        setMood('sad')
        await animate('.thief', { x: [off, 0], rotate: 0 }, { duration: 0.9 * k, ease: 'easeOut' })
        setLine(T.noThief.giveBack[0])
        await sleep(2200 * k)
        setMood('happy')
        setLine(T.noThief.giveBack[1])
        await animate('.thief', { rotate: [0, 18, 0] }, { duration: 0.6 * k })
        await sleep(2600 * k)
        setLine(null)
        await animate('.thief', { x: off, opacity: 0 }, { duration: 0.6 * k, ease: 'easeIn' })
        setShow(false)
        setStage(3)
      }
    } finally {
      setBusy(false)
    }
  }

  const free = stage >= 3 && !busy

  return (
    <div ref={scope} className="no-wrap" onPointerEnter={(e) => e.pointerType === 'mouse' && !free && act()}>
      <button
        className={`btn answer no no-btn ${free ? 'free' : ''}`}
        onPointerDown={(e) => {
          if (!free) {
            e.preventDefault()
            act()
          }
        }}
        onClick={() => free && onNo()}
        data-testid="answer-no"
        aria-label={T.no}
      >
        {T.no}
      </button>
      <div className="thief" style={{ visibility: show ? 'visible' : 'hidden', transform: 'translateX(90vw)' }} aria-hidden>
        <AnimatePresence>
          {line && (
            <motion.div key={line} className="thief-bubble" initial={{ scale: 0.4, opacity: 0, y: 6 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.6, opacity: 0 }}>
              {line}
            </motion.div>
          )}
        </AnimatePresence>
        <Face mood={mood} size={58} />
        <svg className="thief-body" width="58" height="34" viewBox="0 0 58 34">
          <ellipse cx="29" cy="14" rx="17" ry="13" fill="#ece9ff" />
          <circle cx="29" cy="14" r="5" fill="#7c6cff" />
          <path d="M26 13 l3 3 l3 -3 a2 2 0 0 0 -3 -2 a2 2 0 0 0 -3 2z" fill="#ff6fa5" />
          <rect x="8" y="9" width="8" height="5" rx="2.5" fill="#ece9ff" transform="rotate(-25 12 11)" />
          <rect x="42" y="9" width="8" height="5" rx="2.5" fill="#ece9ff" transform="rotate(25 46 11)" />
          <ellipse cx="29" cy="31" rx="7" ry="2.5" fill="#7ff3ff" opacity=".8" />
        </svg>
      </div>
    </div>
  )
}
