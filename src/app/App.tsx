import { Suspense, lazy, useEffect } from 'react'
import { useGame } from '../game/state/store'
import { on } from '../game/interactions/director'
import { setVolume, sfx } from '../audio/sound'
import type { SfxName } from '../audio/synth'
import { hasWebGL, isTouchDevice } from '../utils/device'
import { palette } from '../content/config'
import { Hud } from '../components/hud/Hud'
import { DialogBox } from '../components/dialogs/DialogBox'
import { Boot, Curtain, Toasts } from '../components/transitions/Overlays'
import OperationsOverlay from '../scenes/operations/OperationsOverlay'
import SimulatorOverlay from '../scenes/simulator/SimulatorOverlay'
import FreedomOverlay from '../scenes/freedom/FreedomOverlay'
import FinaleOverlay from '../scenes/finale/FinaleOverlay'
import { Face } from '../components/dialogs/DialogBox'

const Stage = lazy(() => import('../three/Stage'))

export default function App() {
  const phase = useGame((s) => s.phase)
  const webgl = useGame((s) => s.webgl)
  const reduced = useGame((s) => s.settings.reducedMotion)
  const clueless = useGame((s) => s.settings.clueless)
  const alarm = useGame((s) => s.alarm)
  const runId = useGame((s) => s.runId)

  useEffect(() => {
    useGame.setState({ webgl: hasWebGL(), isTouch: isTouchDevice() })
    // a paleta do config.ts vira variáveis CSS
    const r = document.documentElement.style
    Object.entries(palette).forEach(([k, v]) => r.setProperty(`--${k}`, v))
    const offSfx = on('sfx', (n) => sfx(n as SfxName))
    setVolume(useGame.getState().settings.volume)
    const unsub = useGame.subscribe((s, p) => s.settings.volume !== p.settings.volume && setVolume(s.settings.volume))
    return () => {
      offSfx()
      unsub()
    }
  }, [])

  return (
    <div className={`app phase-${phase} ${reduced ? 'reduced' : ''} ${clueless ? 'clueless' : ''} ${alarm ? 'alarm' : ''}`}>
      {phase !== 'boot' &&
        (webgl ? (
          <Suspense fallback={<div className="stage-loading mono">montando o universo...</div>}>
            <Stage />
          </Suspense>
        ) : (
          <div className="no-webgl">
            <Face mood="confused" size={140} />
            <p className="mono small">modo 2D: seu navegador não liberou o 3D, mas a investigação continua.</p>
          </div>
        ))}
      <div className="overlay" key={runId}>
        {(phase === 'intro' || phase === 'operations') && <OperationsOverlay />}
        {phase === 'simulator' && <SimulatorOverlay />}
        {phase === 'freedom' && <FreedomOverlay />}
        {(phase === 'finale' || phase === 'yes' || phase === 'no') && <FinaleOverlay />}
      </div>
      <Hud />
      <Toasts />
      <DialogBox />
      <Curtain />
      {phase === 'boot' && <Boot />}
    </div>
  )
}
