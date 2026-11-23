import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { agentName, finale as T, people } from '../../content/config'
import { emit, waitScene } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { useUIValue } from '../../game/state/ui'
import { answer, enterFinale, enterNo, enterYes } from './script'
import { todayBR } from '../../utils/device'
import { NoThief } from './NoThief'

export default function FinaleOverlay() {
  const phase = useGame((s) => s.phase)
  const runId = useGame((s) => s.runId)
  const prop = useUIValue<number | 'question'>('proposal')
  const yesLine = useUIValue<number | null>('yesLine')
  const noLine = useUIValue<number | null>('noLine')
  const dossier = useUIValue<boolean>('dossier')
  const friend = useUIValue<boolean>('friend')

  useEffect(() => {
    waitScene(phase).then(() => {
      if (phase === 'finale') enterFinale()
      else if (phase === 'yes') enterYes()
      else enterNo()
    })
  }, [phase, runId])

  return (
    <>
      {phase === 'finale' && <div className="fade-in" />}
      <AnimatePresence mode="wait">
        {typeof prop === 'number' && (
          <motion.button
            key={prop}
            className="proposal-line serif"
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            transition={{ duration: 1.2 }}
            onClick={() => emit('proposal:next')}
            data-testid="proposal-next"
          >
            <span>{T.proposal[prop]}</span>
            <small>toque para continuar</small>
          </motion.button>
        )}
        {prop === 'question' && <Question key="q" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {typeof yesLine === 'number' && (
          <motion.div key={'y' + yesLine} className={`end-line ${yesLine === 0 ? 'mega' : ''}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
            {T.yesEnding.lines[yesLine]}
          </motion.div>
        )}
        {typeof noLine === 'number' && (
          <motion.div key={'n' + noLine} className="end-line serif soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            {T.noEnding.lines[noLine]}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{dossier && <Dossier key="d" />}</AnimatePresence>
      <AnimatePresence>
        {friend && (
          <motion.div key="f" className="friend-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
            <div className="title-kicker">missão encerrada com respeito</div>
            <p className="serif">{T.noEnding.friend}</p>
            <div className="robot-wave">🤖👋</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Question() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setReady(true), useGame.getState().settings.reducedMotion ? 300 : 2600)
    return () => clearTimeout(id)
  }, [])
  const words = T.question.split(' ')
  return (
    <motion.div className="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="serif">
        {words.map((w, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.32, duration: 0.8 }}>
            {w}{' '}
          </motion.span>
        ))}
      </h2>
      <AnimatePresence>
        {ready && (
          <motion.div className="answers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <button className="btn answer yes" onClick={() => answer('yes')} data-testid="answer-yes">
              {T.yes}
            </button>
            <NoThief onNo={() => answer('no')} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Dossier() {
  const E = T.yesEnding
  return (
    <motion.div className="dossier-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="dossier" initial={{ y: 60, rotate: -3, opacity: 0 }} animate={{ y: 0, rotate: -1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
        <div className="clip" />
        <div className="title-kicker">{E.dossierTitle}</div>
        <dl>
          <dt>Data</dt>
          <dd>{todayBR()}</dd>
          <dt>Envolvidos</dt>
          <dd>
            {people.myName} & {agentName()}
          </dd>
          <dt>Status</dt>
          <dd className="status">NÓS DOIS</dd>
          <dt>Observação</dt>
          <dd>espaço individual: funcionalidade permanente</dd>
          <dt>Milk Moo</dt>
          <dd>infinito (confirmado)</dd>
        </dl>
        <p className="serif last-words">{E.lastWords}</p>
        <ul className="credits">
          {E.credits.map(([k, v]) => (
            <li key={k}>
              <span>{k}</span>
              <b>{v.replace('{her}', agentName())}</b>
            </li>
          ))}
        </ul>
        <motion.div className="stamp" initial={{ scale: 3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 12 }}>
          {E.dossierStamp}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
