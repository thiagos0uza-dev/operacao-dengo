import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { freedom as T } from '../../content/config'
import { emit, waitScene } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { useUIValue } from '../../game/state/ui'
import { FallbackActions } from '../../components/ui/FallbackActions'
import { destroy, enterFreedom } from './script'
import { sfx } from '../../audio/sound'

export default function FreedomOverlay() {
  const runId = useGame((s) => s.runId)
  const flags = useGame((s) => s.flags)
  const play = useUIValue<string>('free') === 'play'
  const insta = useUIValue<{ step: string; n: number } | null>('insta')
  const msg = useUIValue<number | null>('messages')

  useEffect(() => {
    waitScene('freedom').then(() => enterFreedom())
  }, [runId])

  return (
    <>
      {play && (
        <div className="hint-pill">
          peças desmontadas: {T.objects.filter((o) => flags['free.' + o.id]).length}/{T.objects.length}
        </div>
      )}

      <AnimatePresence>
        {insta && (
          <motion.div key="insta" className="os-window insta" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.3, rotate: -20, opacity: 0 }}>
            <div className="os-bar">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              {T.insta.title} · <em>{T.insta.subtitle}</em>
            </div>
            <div className="os-body">
              <div className="radar">
                <div className="sweep" />
              </div>
              <ul className="scan">
                {T.insta.scan.slice(0, insta.n).map((l) => (
                  <motion.li key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    &gt; {l}
                  </motion.li>
                ))}
              </ul>
              {insta.step === 'switch' && (
                <motion.button
                  className="kill-switch"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    sfx('click')
                    emit('insta:off')
                  }}
                  data-testid="insta-off"
                >
                  {T.insta.switchLabel}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {msg !== null && msg !== undefined && (
          <motion.button
            key={msg}
            className="free-msg serif"
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            transition={{ duration: 1.1 }}
            onClick={() => emit('free:next')}
            data-testid="free-next"
          >
            <span>{T.messages[msg]}</span>
            <small>toque para continuar</small>
          </motion.button>
        )}
      </AnimatePresence>

      {play && <FallbackActions actions={T.objects.filter((o) => !flags['free.' + o.id]).map((o) => ({ id: o.id, label: o.name, fn: () => destroy(o.id) }))} />}
    </>
  )
}
