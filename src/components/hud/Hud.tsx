import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Backpack, Settings as Gear, Volume2, VolumeX, X } from 'lucide-react'
import { chapters, easterEggs, inventory, meta, settingsText as S } from '../../content/config'
import { progressOf, useGame } from '../../game/state/store'
import { setSoundEnabled, sfx } from '../../audio/sound'
import { MilkMooPanel, CupSvg } from '../ui/MilkMoo'
import { chaosMode } from '../../scenes/operations/script'

const ICONS: Record<string, string> = { dengo: '☁️', pass: '🗝️', memes: '📦', hug: '🧸', quiet: '🪐', premium: '🛌', ram: '💾', battery: '🔋' }

export function Hud() {
  const phase = useGame((s) => s.phase)
  const flags = useGame((s) => s.flags)
  const sound = useGame((s) => s.settings.sound)
  const panel = useGame((s) => s.panel)
  const setPanel = useGame((s) => s.setPanel)
  const pct = progressOf(flags)
  const logoTaps = useRef(0)
  const chapterIdx = chapters.findIndex((c) => c.id === (phase === 'yes' || phase === 'no' ? 'finale' : phase))

  if (phase === 'boot') return null
  const minimal = phase === 'finale' || phase === 'yes' || phase === 'no' || phase === 'intro'

  return (
    <>
      <div className="hud">
        <button
          className="hud-logo"
          onClick={() => {
            // easter egg: 3 toques no logo abrem o diagnóstico emocional
            logoTaps.current++
            if (logoTaps.current >= 3) {
              logoTaps.current = 0
              sfx('open')
              setPanel('diagnosis')
            }
          }}
          aria-label="Operação Dengo"
        >
          <span className="dot" />
          {meta.shortTitle}
        </button>
        {!minimal && (
          <div className="hud-progress" aria-label={`Investigação ${pct}%`}>
            <div className="hud-progress-label">
              Investigação: <b>{pct}%</b>
              {chapterIdx >= 0 && <span className="chapter"> · {chapters[chapterIdx].name}</span>}
            </div>
            <div className="hud-bar">
              <motion.div animate={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="hud-actions">
          {flags['intro.done'] && (
            <button className="icon-btn" onClick={() => (sfx('open'), setPanel('inventory'))} aria-label="Inventário" data-testid="open-inventory">
              <Backpack size={20} />
            </button>
          )}
          <button
            className="icon-btn"
            onClick={() => {
              const on = !sound
              useGame.getState().setSetting('sound', on)
              setSoundEnabled(on)
              if (on) sfx('click')
            }}
            aria-label={sound ? 'Desligar som' : 'Ligar som'}
            data-testid="toggle-sound"
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button className="icon-btn" onClick={() => (sfx('open'), setPanel('settings'))} aria-label="Configurações" data-testid="open-settings">
            <Gear size={20} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {panel === 'settings' && <SettingsPanel key="s" onClose={() => setPanel(null)} />}
        {panel === 'inventory' && <InventoryPanel key="i" onClose={() => setPanel(null)} />}
        {panel === 'diagnosis' && <DiagnosisPanel key="d" onClose={() => setPanel(null)} />}
      </AnimatePresence>
    </>
  )
}

function Sheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: React.ReactNode; className?: string }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className={`os-window sheet ${className}`}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="os-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          {title}
          <button className="close" onClick={onClose} aria-label="Fechar" data-testid="close-sheet">
            <X size={18} />
          </button>
        </div>
        <div className="os-body">{children}</div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------- */
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useGame((g) => g.settings)
  const set = useGame((g) => g.setSetting)
  const [saudade, setSaudade] = useState(100)
  const [confirm, setConfirm] = useState(false)
  const [nudge, setNudge] = useState(false)

  useEffect(() => {
    if (s.chaos >= 95) chaosMode()
  }, [s.chaos])

  return (
    <Sheet title={S.title} onClose={onClose} className={s.clueless ? 'clueless' : ''}>
      <h3>{S.real}</h3>
      <label className="row-set">
        <span>{S.sound}</span>
        <input
          type="checkbox"
          checked={s.sound}
          onChange={(e) => {
            set('sound', e.target.checked)
            setSoundEnabled(e.target.checked)
          }}
        />
      </label>
      <label className="row-set">
        <span>{S.volume}</span>
        <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => set('volume', +e.target.value)} />
      </label>
      <label className="row-set">
        <span>{S.reducedMotion}</span>
        <input type="checkbox" checked={s.reducedMotion} onChange={(e) => set('reducedMotion', e.target.checked)} />
      </label>
      <label className="row-set">
        <span>{S.quality}</span>
        <select value={s.quality} onChange={(e) => set('quality', e.target.value as typeof s.quality)}>
          <option value="auto">automática</option>
          <option value="low">leve</option>
          <option value="high">bonita</option>
        </select>
      </label>

      <h3>{S.absurd}</h3>
      <label className="row-set">
        <span>
          {S.dengo} <em>{s.dengo}%</em>
        </span>
        <input type="range" min={0} max={100} value={s.dengo} onChange={(e) => set('dengo', +e.target.value)} />
      </label>
      <label className="row-set">
        <span>
          {S.chaos} <em>{s.chaos >= 95 ? 'PERIGO' : s.chaos + '%'}</em>
        </span>
        <input type="range" min={0} max={100} value={s.chaos} onChange={(e) => set('chaos', +e.target.value)} />
      </label>
      <label className="row-set">
        <span>
          {S.jokes} <em>{S.jokeLabels[s.jokes]}</em>
        </span>
        <input type="range" min={0} max={4} value={s.jokes} onChange={(e) => set('jokes', +e.target.value)} />
      </label>
      <label className="row-set">
        <span>
          {S.speed} <em>{s.speed.toFixed(1)}x</em>
        </span>
        <input type="range" min={0.3} max={2.5} step={0.1} value={s.speed} onChange={(e) => set('speed', +e.target.value)} />
      </label>
      <label className="row-set">
        <span>
          {S.saudade} <em className={nudge ? 'shake' : ''}>{saudade}%</em>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={saudade}
          onChange={(e) => setSaudade(+e.target.value)}
          onPointerUp={() => {
            setSaudade(100)
            setNudge(true)
            sfx('error')
            setTimeout(() => setNudge(false), 900)
          }}
          onKeyUp={() => setSaudade(100)}
        />
      </label>
      {nudge && <p className="mono small accent">{S.saudadeLocked}</p>}
      <label className="row-set">
        <span>{S.clueless}</span>
        <input type="checkbox" checked={s.clueless} onChange={(e) => set('clueless', e.target.checked)} />
      </label>

      <button
        className={`btn ${confirm ? 'danger' : 'ghost'} wide`}
        onClick={() => {
          if (!confirm) return setConfirm(true)
          useGame.getState().reset()
          location.reload()
        }}
      >
        {confirm ? S.restartConfirm : S.restart}
      </button>
    </Sheet>
  )
}

/* ---------------------------------------------------------------------- */
function InventoryPanel({ onClose }: { onClose: () => void }) {
  const [sel, setSel] = useState(inventory.items[0].id)
  const [milk, setMilk] = useState(false)
  const item = inventory.items.find((i) => i.id === sel)!
  return (
    <>
      <Sheet title={inventory.title} onClose={onClose} className="inventory">
        <p className="muted small">{inventory.note}</p>
        <div className="inv-grid">
          {inventory.items.map((it) => (
            <motion.button
              key={it.id}
              className={`inv-slot ${sel === it.id ? 'sel' : ''} ${it.legendary ? 'legendary' : ''}`}
              whileTap={{ scale: 0.9, rotate: -6 }}
              onClick={() => {
                setSel(it.id)
                sfx(it.legendary ? 'sparkle' : 'boop', { rate: 1.2 })
              }}
              data-testid={`inv-${it.id}`}
            >
              {it.legendary ? <CupSvg size={40} /> : <span className="emoji">{ICONS[it.id]}</span>}
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={sel} className={`inv-detail ${item.legendary ? 'legendary' : ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {item.legendary && <div className="rarity">★ LENDÁRIO ★</div>}
            <h4>{item.name}</h4>
            <p>{item.desc}</p>
            {item.legendary && (
              <button className="btn primary" onClick={() => setMilk(true)} data-testid="use-milkmoo">
                examinar (por sua conta e risco)
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </Sheet>
      <AnimatePresence>{milk && <MilkMooPanel key="m" onClose={() => setMilk(false)} />}</AnimatePresence>
    </>
  )
}

/* ---------------------------------------------------------------------- */
function DiagnosisPanel({ onClose }: { onClose: () => void }) {
  const D = easterEggs.diagnosis
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step >= D.steps.length + D.results.length) return
    const id = setTimeout(() => {
      setStep((n) => n + 1)
      sfx(step >= D.steps.length - 1 ? 'error' : 'blip')
    }, step < D.steps.length ? 900 : 700)
    return () => clearTimeout(id)
  }, [step, D.steps.length, D.results.length])
  return (
    <Sheet title={D.title} onClose={onClose}>
      <ul className="scan">
        {D.steps.slice(0, step).map((l) => (
          <li key={l}>&gt; {l}</li>
        ))}
      </ul>
      {step > D.steps.length && (
        <div className="diag-results">
          {D.results.slice(0, step - D.steps.length).map((r) => (
            <motion.div key={r} className="diag-result" initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {r}
            </motion.div>
          ))}
        </div>
      )}
    </Sheet>
  )
}
