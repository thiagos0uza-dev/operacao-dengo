import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { useGame } from '../../game/state/store'
import { std } from '../materials'
import { canvasTexture } from '../../utils/canvas'

type G = ThreeElements['group']

/** Planeta low-poly com anel opcional. */
export function Planet({ color, ring, ringColor = '#ffffff', size = 0.5, spin = 0.3, ...rest }: G & { color: string; ring?: boolean; ringColor?: string; size?: number; spin?: number }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((_, dt) => void (g.current.rotation.y += dt * spin))
  return (
    <group {...rest}>
      <group ref={g}>
        <mesh material={std(color, { rough: 0.7 })}>
          <icosahedronGeometry args={[size, 1]} />
        </mesh>
      </group>
      {ring && (
        <mesh rotation={[1.25, 0, 0.3]} material={std(ringColor, { rough: 0.4 })}>
          <torusGeometry args={[size * 1.55, size * 0.06, 4, 32]} />
        </mesh>
      )}
    </group>
  )
}

/** Em modo caos, tudo que estiver aqui dentro perde a gravidade. */
export function Floaty({ children, seed = 1, ...rest }: G & { children: ReactNode; seed?: number }) {
  const g = useRef<THREE.Group>(null!)
  const base = useRef<THREE.Vector3 | null>(null)
  useFrame(({ clock }, dt) => {
    const chaos = useGame.getState().chaos
    const t = clock.elapsedTime
    const ty = chaos ? 1 + Math.sin(t * 0.7 + seed) * 0.6 + (seed % 3) * 0.3 : 0
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, ty, chaos ? 1.2 : 4, dt)
    const r = chaos ? Math.sin(t * 0.4 + seed) * 1.2 : 0
    g.current.rotation.z = THREE.MathUtils.damp(g.current.rotation.z, r, 1.5, dt)
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, chaos ? Math.cos(t * 0.3 + seed) * 0.8 : 0, 1.5, dt)
    if (!base.current) base.current = g.current.position.clone()
  })
  return (
    <group {...rest}>
      <group ref={g}>{children}</group>
    </group>
  )
}

/** Textura de canvas com descarte automático. */
export function useCanvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tex = useMemo(() => canvasTexture(w, h, draw), deps)
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

/** Céu em degradê (uma esfera invertida com shader mínimo). */
export function SkyDome({ top, bottom, radius = 80 }: { top: string; bottom: string; radius?: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float k = smoothstep(-0.3, 0.8, vP.y); gl_FragColor = vec4(mix(bottom, top, k), 1.0); }',
      }),
    [],
  )
  useEffect(() => {
    mat.uniforms.top.value.set(top)
    mat.uniforms.bottom.value.set(bottom)
  }, [top, bottom, mat])
  useEffect(() => () => mat.dispose(), [mat])
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[radius, 24, 16]} />
    </mesh>
  )
}

/** Copo de Milk Moo Infinito (lendário): sorvete que nunca acaba. */
export function MilkMooCup(p: G) {
  const swirl = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (swirl.current) swirl.current.rotation.y = clock.elapsedTime * 0.8
  })
  const label = useCanvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1a1633'
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.ellipse(20 + i * 38, 20 + (i % 2) * 70, 16, 12, i, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ff6fa5'
    ctx.font = '900 46px "Bricolage Grotesque Variable", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('MOO ∞', w / 2, h / 2)
  })
  return (
    <group {...p}>
      <mesh position-y={0.3}>
        <cylinderGeometry args={[0.32, 0.22, 0.6, 16, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-y={0.005} material={std('#ffffff')}>
        <cylinderGeometry args={[0.22, 0.22, 0.01, 16]} />
      </mesh>
      <group ref={swirl} position-y={0.6}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position-y={i * 0.11} scale={[1 - i * 0.2, 0.55, 1 - i * 0.2]} material={std(i % 2 ? '#fff3e6' : '#ffd6e6', { flat: false, rough: 0.8 })}>
            <torusGeometry args={[0.22, 0.12, 8, 16]} />
          </mesh>
        ))}
        <mesh position-y={0.46} material={std('#ff3b5c', { flat: false })}>
          <sphereGeometry args={[0.07, 10, 8]} />
        </mesh>
      </group>
      <mesh position={[0.12, 0.95, 0]} rotation-z={-0.25} material={std('#ff6fa5', { flat: false })}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
      </mesh>
    </group>
  )
}
