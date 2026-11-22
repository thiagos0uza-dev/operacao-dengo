import { Suspense, lazy, useState, type ReactElement } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useGame } from '../game/state/store'
import { CameraRig } from './cameraRig'
import { Bursts } from './effects/Bursts'
import { isLowEnd } from '../utils/device'

const OperationsScene = lazy(() => import('../scenes/operations/OperationsScene'))
const SimulatorScene = lazy(() => import('../scenes/simulator/SimulatorScene'))
const FreedomScene = lazy(() => import('../scenes/freedom/FreedomScene'))
const FinaleScene = lazy(() => import('../scenes/finale/FinaleScene'))

/** Um único Canvas para a experiência inteira: troca só o conteúdo. */
export default function Stage() {
  const phase = useGame((s) => s.phase)
  const quality = useGame((s) => s.settings.quality)
  const [autoDpr, setAutoDpr] = useState(() => (isLowEnd() ? 1 : 1.5))
  const dpr = quality === 'low' ? 1 : quality === 'high' ? Math.min(2, window.devicePixelRatio || 1) : autoDpr

  let scene: ReactElement | null = null
  if (phase === 'intro' || phase === 'operations') scene = <OperationsScene />
  else if (phase === 'simulator') scene = <SimulatorScene />
  else if (phase === 'freedom') scene = <FreedomScene />
  else if (phase === 'finale' || phase === 'yes' || phase === 'no') scene = <FinaleScene />

  return (
    <Canvas
      className="stage"
      dpr={dpr}
      camera={{ fov: 50, near: 0.1, far: 200, position: [0, 2, 8] }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => gl.setClearColor('#0b0918')}
    >
      {quality === 'auto' && (
        <PerformanceMonitor onDecline={() => setAutoDpr(1)} onIncline={() => setAutoDpr(Math.min(1.75, window.devicePixelRatio || 1))} flipflops={3} />
      )}
      <CameraRig />
      <Bursts />
      <Suspense fallback={null}>{scene}</Suspense>
    </Canvas>
  )
}
