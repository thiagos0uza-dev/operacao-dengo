import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { simulator as T } from '../../content/config'
import { waitScene } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { ui, useUIValue } from '../../game/state/ui'
import { choose, enterSim, finishEmergency, shutdown, startEmergency } from './script'
import { sfx } from '../../audio/sound'

type Sim = { idx: number; stage: 'ask' | 'react' | 'after' | 'alarm' | 'checklist' | 'done'; last?: string }

const SPAM = ['oi', 'oi?', 'tá aí?', '??', 'oii', 'aconteceu algo?', 'responde', '???', 'tô preocupado', 'cadê vc', 'alô', '😐', 'ok então', 'oi???', 'mandei msg', '...', '37']

export default function SimulatorOverlay() {
  const runId = useGame((s) => s.runId)
  const busy = useGame((s) => s.busy)
  const sim = useUIValue<Sim>('sim')
  const spam = useUIValue<boolean>('spam')
  const calls = useUIValue<number | null>('calls')
  const off = useUIValue<string | null>('shutdown')

  useEffect(() => {
    waitScene('simulator').then(() => enterSim())
  }, [runId])

  if (!sim) return null
  const isEmergency = sim.idx === 2
  const sit = !isEmergency ? T.situations[sim.idx] : null

  return (
    <>
      <AnimatePresence mode="wait">
        {sit && (sim.stage === 'ask' || sim.stage === 'after') && (
          <motion.div key={sit.id + sim.stage} className="os-window sim" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
            <div className="os-bar">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              {T.header} <em>{T.version}</em>
            </div>
            <div className="os-body">
              <div className="sim-title">{sit.title}</div>
              {sim.stage === 'ask' ? (
                <>
                  {sit.setup.map((l, i) => (
                    <motion.p key={l} className="sim-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.5 }}>
                      {l}
                    </motion.p>
                  ))}
                  <p className="sim-q">{sit.question}</p>
                  <div className="choices">
                    {sit.choices.map((c, i) => (
                      <motion.button
                        key={c.id}
                        className="choice"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.12 }}
                        disabled={busy}
                        onClick={() => {
                          sfx('click')
                          choose(sim.idx, c)
                        }}
                        data-testid={`choice-${c.id}`}
                      >
                        <span className="key">{String.fromCharCode(65 + i)}</span>
                        {c.label}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="row">
                  <button className="btn ghost" onClick={() => ui.set('sim', { idx: sim.idx, stage: 'ask' })} data-testid="sim-again">
                    testar outra opção
                  </button>
                  <button
                    className="btn primary"
                    onClick={() => {
                      sfx('click')
                      if (sim.idx === 0) ui.set('sim', { idx: 1, stage: 'ask' })
                      else startEmergency()
                    }}
                    data-testid="sim-next"
                  >
                    próxima situação →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEmergency && sim.stage === 'alarm' && <div className="banner alarm">{T.emergency.alarm}</div>}
      {isEmergency && sim.stage === 'checklist' && <Checklist />}

      <AnimatePresence>
        {spam && (
          <motion.div key="spam" className="spam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <SpamBubbles />
          </motion.div>
        )}
      </AnimatePresence>
      {calls ? (
        <div className="calls">
          <div className="calls-ring">📞</div>
          <div>ligação nº {calls}</div>
          <small>chamando... chamando... ela tá dançando</small>
        </div>
      ) : null}
      {off && (
        <div className="shutdown">
          {off === 'off' ? (
            <>
              <div className="shutdown-x">✕</div>
              <p>{T.emergency.shutdown}</p>
            </>
          ) : (
            <p className="mono">{T.emergency.reboot}</p>
          )}
        </div>
      )}
    </>
  )
}

function SpamBubbles() {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= SPAM.length) return
    const id = setTimeout(() => setN(n + 1), useGame.getState().settings.reducedMotion ? 40 : 120)
    return () => clearTimeout(id)
  }, [n])
  return (
    <div className="phone">
      <div className="phone-head">Você · digitando compulsivamente</div>
      <div className="bubbles">
        {SPAM.slice(0, n).map((m, i) => (
          <motion.div key={i} className="bubble" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {m}
          </motion.div>
        ))}
      </div>
      <div className="phone-count">{Math.min(37, Math.round((n / SPAM.length) * 37))} mensagens enviadas</div>
    </div>
  )
}

function Checklist() {
  const E = T.emergency
  const [seen, setSeen] = useState<number[]>([])
  const busy = useGame((s) => s.busy)
  const all = seen.length >= E.items.length
  return (
    <motion.div className="os-window sim emergency" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <div className="os-bar danger">⚠ {E.protocol}</div>
      <div className="os-body">
        <div className="sim-title">{E.title}</div>
        <p className="sim-setup">{E.setup}</p>
        <p className="mono small muted">{E.instructions}</p>
        <ul className="checklist">
          {E.items.map((it, i) => {
            const open = seen.includes(i)
            return (
              <li key={it.label}>
                <button
                  className={`check ${open ? 'open ' + it.tone : ''}`}
                  disabled={busy}
                  onClick={() => {
                    if (!open) setSeen([...seen, i])
                    sfx(it.tone === 'danger' ? 'error' : 'blip')
                    if (it.tone === 'danger' && !open) shutdown()
                  }}
                  data-testid={`check-${i}`}
                >
                  <span className="box">{open ? (it.tone === 'danger' ? '✕' : it.tone === 'warn' ? '!' : '✓') : ''}</span>
                  <span className="lbl">{it.label}</span>
                  {open && <span className="st">{it.status}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        {all && (
          <motion.button className="btn primary" initial={{ scale: 0 }} animate={{ scale: 1 }} disabled={busy} onClick={() => finishEmergency()} data-testid="emergency-done">
            EXECUTAR PROTOCOLO
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
