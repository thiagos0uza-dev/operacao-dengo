import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { easterEggs, meta, operations as T } from '../../content/config'
import { emit, waitScene } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { ui, useUIValue } from '../../game/state/ui'
import { MilkMooPanel } from '../../components/ui/MilkMoo'
import { FallbackActions } from '../../components/ui/FallbackActions'
import { actBox, actButton, actCoffee, actComputer, actDoor, actHatch, actPoster, closeSecret, enterHub, playIntro, startInvestigation } from './script'
import { sfx } from '../../audio/sound'

let skipNext = false

export default function OperationsOverlay() {
  const phase = useGame((s) => s.phase)
  const runId = useGame((s) => s.runId)
  const caption = useUIValue<string | null>('caption')
  const flash = useUIValue<number>('flash')
  const title = useUIValue<boolean>('title')
  const analysis = useUIValue<string | null>('analysis')
  const err = useUIValue<boolean>('error404')
  const chaos = useUIValue<boolean>('chaosBanner')
  const milk = useUIValue<boolean>('milkmoo')
  const secret = useUIValue<boolean>('secret')
  const notice = useUIValue<boolean>('finalNotice')
  const fade = useUIValue<boolean>('fade')
  const dragHint = useUIValue<boolean>('dragHint')
  const poster = useUIValue<number>('poster') ?? 0

  useEffect(() => {
    let dead = false
    waitScene(phase).then(() => {
      if (dead) return
      if (phase === 'intro') {
        const s = skipNext
        skipNext = false
        playIntro(s)
      } else enterHub()
    })
    return () => void (dead = true)
  }, [phase, runId])

  useEffect(() => {
    if (!dragHint) return
    const id = setTimeout(() => ui.set('dragHint', false), 4500)
    return () => clearTimeout(id)
  }, [dragHint])

  const skip = () => {
    skipNext = true
    useGame.getState().setPhase('intro')
  }

  return (
    <>
      <AnimatePresence>
        {caption && (
          <motion.div key="cap" className="caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
            {caption}
          </motion.div>
        )}
      </AnimatePresence>
      {flash ? <div key={flash} className="flash" /> : null}

      {phase === 'intro' && !title && (
        <button className="skip" onClick={skip} data-testid="skip-intro">
          pular »
        </button>
      )}

      <AnimatePresence>
        {title && (
          <motion.div key="title" className="title-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
            <motion.div className="title-kicker" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              arquivo confidencial nº 001
            </motion.div>
            <motion.h1 initial={{ letterSpacing: '0.4em', opacity: 0 }} animate={{ letterSpacing: '0.02em', opacity: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }}>
              <span>OPERAÇÃO:</span> DENGO NÃO É CONTRATO
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              {meta.subtitle}
            </motion.p>
            <motion.button
              className="btn primary big pulse"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3, type: 'spring' }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                sfx('click')
                startInvestigation()
              }}
              data-testid="start"
            >
              [ INICIAR INVESTIGAÇÃO ]
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{analysis && <AnalysisPanel key="an" step={analysis} />}</AnimatePresence>

      <AnimatePresence>
        {err && (
          <motion.div key="404" className="banner danger glitch" initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            {T.computer.error}
          </motion.div>
        )}
        {chaos && (
          <motion.div key="chaos" className="banner alarm" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            {T.redButton.chaos}
          </motion.div>
        )}
        {notice && (
          <motion.div key="notice" className="banner notice" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            ★ MISSÃO FINAL DISPONÍVEL ★
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {milk && (
          <MilkMooPanel
            key="milk"
            onClose={() => {
              ui.set('milkmoo', false)
              emit('milkmoo:close')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {secret && (
          <motion.div key="secret" className="secret-room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}>
            <div className="secret-glow" />
            <motion.div className="secret-card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 1.2 }}>
              <div className="title-kicker">{easterEggs.secretRoom.title}</div>
              <p className="serif">{easterEggs.secretRoom.message}</p>
              <p className="signature">{easterEggs.secretRoom.signature}</p>
              <button className="btn ghost" onClick={closeSecret}>
                voltar para a bagunça
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {dragHint && <div className="drag-hint">⟵ {T.dragHint} ⟶</div>}
      {fade && <div className="fade-out" />}

      {phase === 'operations' && (
        <FallbackActions
          actions={[
            { id: 'computer', label: T.labels.computer, fn: actComputer },
            { id: 'coffee', label: T.labels.coffee, fn: actCoffee },
            { id: 'redButton', label: T.labels.redButton, fn: actButton },
            { id: 'box', label: T.labels.box, fn: actBox },
            { id: 'poster', label: poster >= 3 ? 'Passagem secreta' : 'Pôster estranho', fn: poster >= 3 ? actHatch : actPoster },
            { id: 'door', label: T.labels.door, fn: actDoor },
          ]}
        />
      )}
    </>
  )
}

function AnalysisPanel({ step }: { step: string }) {
  const stats = T.computer.stats
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= stats.length) return
    const id = setTimeout(() => {
      setShown((n) => n + 1)
      sfx('blip')
    }, shown === 0 ? 500 : 380)
    return () => clearTimeout(id)
  }, [shown, stats.length])
  return (
    <motion.div className="os-window analysis" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 1.3, opacity: 0, rotate: 3 }}>
      <div className="os-bar">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        {T.computer.title}.exe
      </div>
      <div className="os-body">
        <div className="mono small accent">&gt; {T.computer.start}</div>
        <ul className="stats">
          {stats.slice(0, shown).map((s) => (
            <motion.li key={s.label} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <span>{s.label}</span>
              <b className={s.bar === 0 ? 'zero' : s.bar < 0 ? 'weird' : 'high'}>{s.value}</b>
              <div className="bar">
                <motion.div
                  className={s.bar === -1 ? 'overflow' : s.bar === -2 ? 'scan' : ''}
                  initial={{ width: 0 }}
                  animate={{ width: s.bar < 0 ? '100%' : `${s.bar * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </motion.li>
          ))}
        </ul>
        {step === 'stats' && shown >= stats.length && (
          <motion.button className="btn primary" initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => emit('analysis:calc')} data-testid="calc">
            CALCULAR CONCLUSÃO FINAL
          </motion.button>
        )}
        {step === 'calc' && (
          <div className="calc">
            <div className="mono small">{T.computer.calculating}</div>
            <div className="bar big">
              <div className="fill-anim" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
