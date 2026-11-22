import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent, type ThreeElements } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGame } from '../../game/state/store'
import { glow } from '../materials'
import { palette } from '../../content/config'

type Props = ThreeElements['group'] & {
  hid: string
  label?: string
  labelY?: number
  ring?: number
  done?: boolean
  hidden?: boolean
  onActivate: () => void
  children: ReactNode
}

/** Objeto interativo: clicável no 3D, com anel pulsante e etiqueta tocável. */
export function Hotspot({ hid, label, labelY = 1.4, ring = 0.7, done, hidden, onActivate, children, ...rest }: Props) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const busy = useGame((s) => s.busy || !!s.dialog)
  const hover = useRef(false)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const t = clock.elapsedTime
    const k = 1 + ((t * 0.8) % 1) * 0.35
    ringRef.current.scale.setScalar(k * ring)
    const m = ringRef.current.material as THREE.MeshBasicMaterial
    m.opacity = (busy ? 0.08 : done ? 0.18 : 0.55) * (1 - ((t * 0.8) % 1)) + (hover.current ? 0.3 : 0)
  })

  const activate = (e?: ThreeEvent<MouseEvent>) => {
    if (e) {
      e.stopPropagation()
      if (e.delta > 10) return
    }
    if (useGame.getState().busy || useGame.getState().dialog) return
    onActivate()
  }

  return (
    <group {...rest}>
      <group
        onClick={activate}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover.current = true
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hover.current = false
          document.body.style.cursor = ''
        }}
      >
        {children}
      </group>
      {!hidden && (
        <mesh ref={ringRef} rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.92, 1, 40]} />
          <meshBasicMaterial color={done ? palette.lavender : palette.cyan} transparent opacity={0.5} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {label && !hidden && (
        <Html position={[0, labelY, 0]} center zIndexRange={[20, 10]}>
          <button className={`hotspot ${done ? 'done' : ''} ${busy ? 'dim' : ''}`} data-hotspot={hid} onClick={() => activate()} aria-label={label}>
            {done ? '✓ ' : ''}
            {label}
          </button>
        </Html>
      )}
    </group>
  )
}

export const ringMat = () => glow(palette.cyan, 0.5)
