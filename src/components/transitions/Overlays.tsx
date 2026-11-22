import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { boot, meta } from '../../content/config'
import { useGame, resumeTarget } from '../../game/state/store'
import { goTo } from '../../game/interactions/director'
import { setSoundEnabled, sfx } from '../../audio/sound'
import { Face } from '../dialogs/DialogBox'

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout className={`toast ${t.kind}`} initial={{ x: 60, opacity: 0, scale: 0.9 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: 60, opacity: 0 }}>
            {t.kind === 'alert' ? '⚠ ' : t.kind === 'item' ? '✦ ' : ''}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Curtain() {
  const text = useGame((s) => s.curtain)
  return (
    <AnimatePresence>
      {text && (
        <motion.div className="curtain" initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(150% at 50% 50%)' }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
          <div className="loader-face">
            <Face mood="focused" size={72} />
          </div>
          <div className="loader-bar">
            <div />
          </div>
          <p className="mono">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Tela de boot: precisa de um toque (libera o áudio) e pergunta sobre o som. */
export function Boot() {
  const [n, setN] = useState(0)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (n < boot.lines.length) {
      const id = setTimeout(() => setN(n + 1), n === 0 ? 300 : 420)
      return () => clearTimeout(id)
    }
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    const done = () => setReady(true)
    if (fonts) Promise.race([fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(done)
    else done()
  }, [n])

  const start = (sound: boolean) => {
    useGame.getState().setSetting('sound', sound)
    setSoundEnabled(sound)
    if (sound) sfx('powerup')
    const s = useGame.getState()
    goTo(resumeTarget(s))
  }

  return (
    <div className="boot">
      <div className="boot-inner">
        <div className="mono small muted">{meta.os}</div>
        <ul className="boot-lines mono">
          {boot.lines.slice(0, n).map((l) => (
            <li key={l} className={l.includes('falhou') ? 'bad' : ''}>
              &gt; {l}
            </li>
          ))}
        </ul>
        <AnimatePresence>
          {ready && (
            <motion.div className="boot-ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Face mood="happy" size={80} />
              <p>{boot.question}</p>
              <div className="row">
                <button className="btn primary" onClick={() => start(true)} data-testid="boot-sound">
                  🔊 {boot.soundOn}
                </button>
                <button className="btn ghost" onClick={() => start(false)} data-testid="boot-silent">
                  {boot.soundOff}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
