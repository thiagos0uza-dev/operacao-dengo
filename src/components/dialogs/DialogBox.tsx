import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Mood } from '../../content/config'
import { people } from '../../content/config'
import { useGame } from '../../game/state/store'
import { advanceDialog } from '../../game/interactions/director'
import { sfx } from '../../audio/sound'

/** Caixa de fala do R-404 com efeito de máquina de escrever. */
export function DialogBox() {
  const dialog = useGame((s) => s.dialog)
  const reduced = useGame((s) => s.settings.reducedMotion)
  const clueless = useGame((s) => s.settings.clueless)
  const line = dialog ? dialog.lines[dialog.index] : null
  const [shown, setShown] = useState(0)
  const full = line ? line.text.length : 0
  const done = shown >= full
  const key = dialog ? `${dialog.index}:${line?.text}` : ''
  const timer = useRef<number>(0)

  useEffect(() => {
    setShown(reduced ? 1e6 : 0)
  }, [key, reduced])

  useEffect(() => {
    if (!line || done) return
    timer.current = window.setTimeout(() => {
      setShown((n) => n + 2)
      if (shown % 6 === 0) sfx('blip', { rate: 0.9 + Math.random() * 0.3, volume: 0.25 })
    }, 22)
    return () => clearTimeout(timer.current)
  }, [line, shown, done])

  const isLast = dialog ? dialog.index >= dialog.lines.length - 1 : false
  const hasChoices = !!dialog?.choices && isLast

  const tap = () => {
    if (!dialog) return
    if (!done) return setShown(1e6)
    if (hasChoices) return
    sfx('click', { volume: 0.3 })
    advanceDialog()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  let text = line ? line.text.slice(0, shown) : ''
  if (clueless && done && text) text += ' (eu acho?)'

  return (
    <AnimatePresence>
      {dialog && line && (
        <motion.div className="dialog-wrap" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
          <div className="dialog" onClick={tap} role="button" tabIndex={0} aria-live="polite" data-testid="dialog">
            <Face mood={line.mood ?? 'idle'} />
            <div className="dialog-body">
              <div className="speaker">{people.robotName}</div>
              <p>{text}</p>
              {done && !hasChoices && <span className="next">▸</span>}
            </div>
          </div>
          {hasChoices && done && (
            <div className="dialog-choices">
              {dialog.choices!.map((c, i) => (
                <motion.button
                  key={c.id}
                  className="choice"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => {
                    sfx('click')
                    advanceDialog(c.id)
                  }}
                  data-testid={`ask-${c.id}`}
                >
                  {c.label}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Retratinho do robô que imita a expressão da cena 3D. */
export function Face({ mood, size = 64 }: { mood: Mood; size?: number }) {
  const eye = (x: number) => {
    switch (mood) {
      case 'happy':
      case 'proud':
        return <path d={`M${x - 7} 34 q7 -9 14 0`} stroke="#7ff3ff" strokeWidth="4" fill="none" strokeLinecap="round" />
      case 'love':
        return <path d={`M${x} 38 l-7 -7 a4 4 0 0 1 7 -4 a4 4 0 0 1 7 4z`} fill="#ff6fa5" />
      case 'dizzy':
        return <path d={`M${x - 6} 26 l12 12 M${x + 6} 26 l-12 12`} stroke="#7ff3ff" strokeWidth="3.5" strokeLinecap="round" />
      case 'panic':
        return <circle cx={x} cy="32" r="8" fill="#7ff3ff" />
      case 'nervous':
        return <rect x={x - 3} y="28" width="6" height="9" rx="3" fill="#7ff3ff" />
      case 'sad':
        return (
          <>
            <rect x={x - 4} y="28" width="8" height="12" rx="4" fill="#7ff3ff" />
            <path d={`M${x - 8} ${x < 32 ? 24 : 28} L${x + 8} ${x < 32 ? 28 : 24}`} stroke="#120f26" strokeWidth="6" />
          </>
        )
      case 'focused':
        return <rect x={x - 4} y="30" width="8" height="7" rx="3" fill="#7ff3ff" />
      case 'confused':
        return <rect x={x - 4} y={x < 32 ? 30 : 25} width="8" height={x < 32 ? 7 : 15} rx="4" fill="#7ff3ff" />
      default:
        return <rect x={x - 4} y="26" width="8" height="13" rx="4" fill="#7ff3ff" />
    }
  }
  const mouth =
    mood === 'panic' ? <circle cx="32" cy="47" r="3.5" stroke="#7ff3ff" strokeWidth="2.5" fill="none" /> : ['happy', 'proud', 'love', 'dizzy'].includes(mood) ? <path d="M26 45 q6 6 12 0" stroke="#7ff3ff" strokeWidth="2.5" fill="none" strokeLinecap="round" /> : <path d="M28 47 h8" stroke="#7ff3ff" strokeWidth="2.5" strokeLinecap="round" />
  return (
    <svg className={`face mood-${mood}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="5" r="3.5" fill="#ff6fa5" />
      <path d="M32 8 v6" stroke="#9a93c9" strokeWidth="2" />
      <rect x="4" y="13" width="56" height="44" rx="15" fill="#ece9ff" />
      <rect x="10" y="19" width="44" height="33" rx="8" fill="#120f26" />
      {eye(23)}
      {eye(41)}
      {mouth}
      {(mood === 'love' || mood === 'happy') && (
        <>
          <circle cx="15" cy="44" r="3.5" fill="#ff6fa5" opacity=".5" />
          <circle cx="49" cy="44" r="3.5" fill="#ff6fa5" opacity=".5" />
        </>
      )}
    </svg>
  )
}
