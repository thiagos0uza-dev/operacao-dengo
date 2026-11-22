import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Robot } from '../../three/characters/Robot'
import { Hotspot } from '../../three/objects/Hotspot'
import { Planet, SkyDome, useCanvasTex } from '../../three/objects/Common'
import { glow, std } from '../../three/materials'
import { on } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { useUIValue } from '../../game/state/ui'
import { freedom as T, palette } from '../../content/config'
import { FONT_DISPLAY, fitText } from '../../utils/canvas'
import { destroy } from './script'

const BARS = 16
const R = 1.7

export default function FreedomScene() {
  const flags = useGame((s) => s.flags)
  const play = useUIValue<string>('free') === 'play'
  const bars = useRef<THREE.Group>(null!)
  const top = useRef<THREE.Group>(null!)
  const walls = useRef<THREE.Group>(null!)
  const sky = useRef<THREE.Group>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const sign = useRef<THREE.Group>(null!)

  const signTex = useCanvasTex(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#1a1633'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = palette.alert
    ctx.lineWidth = 8
    ctx.strokeRect(6, 6, w - 12, h - 12)
    fitText(ctx, T.sign, { x: 24, y: 16, w: w - 48, h: h - 32, color: palette.alert, max: 60, font: FONT_DISPLAY })
  })

  useEffect(() => {
    useGame.setState({ sceneReady: 'freedom' })
    return on('free:open', () => {
      const reduced = useGame.getState().settings.reducedMotion
      const d = reduced ? 0.3 : 1
      bars.current.children.forEach((b, i) => {
        gsap.to(b.position, { y: 9 + Math.random() * 3, duration: 1.4 * d, delay: (i % 8) * 0.08 * d, ease: 'power2.in' })
        gsap.to(b.rotation, { z: (Math.random() - 0.5) * 2, duration: 1.4 * d, delay: i * 0.05 * d })
      })
      gsap.to(top.current.position, { y: 12, duration: 1.6 * d, delay: 0.3 * d, ease: 'power2.in' })
      gsap.to(sign.current.position, { y: -0.5, duration: 0.8 * d, ease: 'bounce.out' })
      gsap.to(sign.current.rotation, { x: -1.4, duration: 0.8 * d })
      walls.current.children.forEach((w, i) => {
        gsap.to(w.children[0].rotation, { x: -Math.PI / 2, duration: 1.6 * d, delay: (0.8 + i * 0.15) * d, ease: 'bounce.out' })
      })
      sky.current.visible = true
      gsap.fromTo(sky.current.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 2.5 * d, delay: 1 * d, ease: 'power2.out' })
      gsap.to(hemi.current, { intensity: 1.4, duration: 3 * d, delay: d })
    })
  }, [])

  return (
    <>
      <color attach="background" args={['#07051a']} />
      <hemisphereLight ref={hemi} args={['#ffd6ea', '#1b1238', 0.35]} />
      <spotLight position={[0, 6, 2]} angle={0.5} penumbra={0.7} intensity={45} color="#d8d0ff" distance={14} />
      <pointLight position={[0, 1.5, 0]} color={palette.alert} intensity={4} distance={5} />

      {/* céu que aparece quando as paredes caem */}
      <group ref={sky} visible={false}>
        <SkyDome top="#3a2a7a" bottom="#ff9ab8" radius={60} />
        <Stars radius={40} depth={15} count={900} factor={3} fade speed={0.8} />
        <Orbiters />
      </group>

      {/* paredes da sala velha */}
      <group ref={walls}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2
          return (
            <group key={i} rotation-y={a}>
              <group position={[0, 0, -4.2]}>
                <mesh position-y={2.5} material={std('#1d1838', { rough: 1 })}>
                  <boxGeometry args={[8.4, 5, 0.15]} />
                </mesh>
              </group>
            </group>
          )
        })}
      </group>
      <mesh position-y={-0.05} material={std('#1d1838', { rough: 1 })}>
        <boxGeometry args={[9, 0.1, 9]} />
      </mesh>

      {/* gaiola */}
      <mesh position-y={0.08} material={std('#4a4466', { metal: 0.6, rough: 0.4 })}>
        <cylinderGeometry args={[R + 0.15, R + 0.2, 0.16, 20]} />
      </mesh>
      <group ref={bars}>
        {Array.from({ length: BARS }, (_, i) => {
          const a = (i / BARS) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * R, 1.6, Math.sin(a) * R]} material={std('#8a84a8', { metal: 0.7, rough: 0.35 })}>
              <cylinderGeometry args={[0.04, 0.04, 3.1, 6]} />
            </mesh>
          )
        })}
      </group>
      <group ref={top}>
        <mesh position-y={3.15} rotation-x={Math.PI / 2} material={std('#8a84a8', { metal: 0.7, rough: 0.35 })}>
          <torusGeometry args={[R, 0.07, 6, 28]} />
        </mesh>
        <mesh position-y={3.15} material={std('#4a4466', { metal: 0.6 })}>
          <sphereGeometry args={[R, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      <group ref={sign} position={[0, 2.75, R + 0.1]}>
        <mesh>
          <planeGeometry args={[1.8, 0.56]} />
          <meshBasicMaterial map={signTex} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* objetos absurdos dentro da gaiola */}
      {T.objects.map((o, i) => {
        const pos: [number, number, number][] = [[-0.85, 0.16, 0.6], [-0.7, 0.16, -0.5], [0.85, 0.16, 0.55], [0.6, 0.16, -0.45]]
        const done = !!flags['free.' + o.id]
        return (
          <Hotspot key={o.id} hid={o.id} label={play && !done ? o.name : undefined} hidden={!play || done} labelY={o.id === 'insta' ? 1.7 : 1.0} ring={0.45} position={pos[i]} onActivate={() => destroy(o.id)}>
            <CageObject id={o.id} done={done} />
          </Hotspot>
        )
      })}

      <Robot position={[2.8, 0, 1.2]} rotation-y={-0.6} />
    </>
  )
}

function CageObject({ id, done }: { id: string; done: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const a = useRef<THREE.Group>(null!)
  const b = useRef<THREE.Group>(null!)
  const led = useRef<THREE.Mesh>(null!)
  const dish = useRef<THREE.Group>(null!)

  useEffect(() => {
    if (done) g.current.visible = false
    const offs = [
      on('free:reset', () => void (g.current.visible = !done)),
      on('free:' + id, () => {
        if (id === 'cuffs') {
          gsap.to(a.current.position, { x: -1.6, y: 1.5, duration: 0.8, ease: 'power2.out' })
          gsap.to(b.current.position, { x: 1.6, y: 1.2, duration: 0.8, ease: 'power2.out' })
          gsap.to(g.current.scale, { x: 0, y: 0, z: 0, duration: 0.4, delay: 0.7 })
        } else if (id === 'contract') {
          gsap.to(g.current.scale, { y: 0, duration: 0.6, ease: 'power2.in' })
        } else if (id === 'gps') {
          ;(led.current.material as THREE.MeshBasicMaterial).color.set('#222233')
          gsap.to(g.current.rotation, { z: -Math.PI / 2, duration: 0.7, ease: 'bounce.out', delay: 0.4 })
          gsap.to(g.current.scale, { x: 0, y: 0, z: 0, duration: 0.4, delay: 1.3 })
        } else if (id === 'insta') {
          const tl = gsap.timeline()
          tl.to(g.current.rotation, { z: 0.2, duration: 0.06, yoyo: true, repeat: 15 })
          tl.to(dish.current.position, { y: 4, x: 1.5, duration: 0.8, ease: 'power2.out' })
          tl.to(dish.current.rotation, { z: 6, duration: 0.8 }, '<')
          tl.to(g.current.rotation, { x: -Math.PI / 2, duration: 0.6, ease: 'bounce.out' })
          tl.to(g.current.scale, { x: 0, y: 0, z: 0, duration: 0.4 })
        }
      }),
      on('free:insta-on', () => {
        if (id === 'insta') gsap.to(dish.current.rotation, { y: Math.PI * 6, duration: 6, ease: 'none' })
      }),
    ]
    return () => offs.forEach((f) => f())
  }, [id, done])

  useFrame(({ clock }) => {
    if (led.current && id === 'gps') led.current.visible = Math.sin(clock.elapsedTime * 8) > 0 || !g.current.visible
  })

  const screen = useCanvasTex(256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#120f26'
    ctx.fillRect(0, 0, w, h)
    const gr = ctx.createLinearGradient(0, 0, w, h)
    gr.addColorStop(0, '#feda75')
    gr.addColorStop(0.5, '#d62976')
    gr.addColorStop(1, '#4f5bd5')
    ctx.strokeStyle = gr
    ctx.lineWidth = 12
    ctx.strokeRect(w / 2 - 50, 30, 100, 100)
    ctx.beginPath()
    ctx.arc(w / 2, 80, 26, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#ffd6e6'
    ctx.font = `800 22px ${FONT_DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('SEGUIDÔMETRO', w / 2, 170)
  })

  const content = useMemo(() => {
    switch (id) {
      case 'cuffs':
        return (
          <>
            <group ref={a} position={[-0.17, 0.12, 0]}>
              <mesh rotation-x={Math.PI / 2} material={std('#c9c3e6', { metal: 0.8, rough: 0.25 })}>
                <torusGeometry args={[0.15, 0.04, 6, 16]} />
              </mesh>
            </group>
            <group ref={b} position={[0.17, 0.12, 0]}>
              <mesh rotation-x={Math.PI / 2} material={std('#c9c3e6', { metal: 0.8, rough: 0.25 })}>
                <torusGeometry args={[0.15, 0.04, 6, 16]} />
              </mesh>
            </group>
            <mesh position-y={0.12} rotation-z={Math.PI / 2} material={std('#8a84a8', { metal: 0.8 })}>
              <cylinderGeometry args={[0.02, 0.02, 0.1, 5]} />
            </mesh>
          </>
        )
      case 'contract':
        return (
          <>
            {Array.from({ length: 9 }, (_, i) => (
              <mesh key={i} position-y={0.03 + i * 0.05} rotation-y={(i % 3) * 0.12 - 0.1} material={std(i % 2 ? '#fff6e8' : '#f0e6d2')}>
                <boxGeometry args={[0.5, 0.045, 0.66]} />
              </mesh>
            ))}
            <mesh position={[0, 0.5, 0]} rotation-x={-Math.PI / 2} material={glow(palette.alert)}>
              <circleGeometry args={[0.08, 12]} />
            </mesh>
          </>
        )
      case 'gps':
        return (
          <>
            <mesh position-y={0.25} material={std('#3b327a')}>
              <boxGeometry args={[0.36, 0.5, 0.22]} />
            </mesh>
            <mesh position={[0.1, 0.65, 0]} material={std('#8a84a8')}>
              <cylinderGeometry args={[0.015, 0.015, 0.35, 5]} />
            </mesh>
            <mesh ref={led} position={[0.1, 0.84, 0]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <meshBasicMaterial color={palette.alert} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.3, 0.115]} material={glow('#7dffb0')}>
              <planeGeometry args={[0.26, 0.18]} />
            </mesh>
          </>
        )
      default:
        return (
          <>
            <mesh position-y={0.35} material={std('#3b327a')}>
              <cylinderGeometry args={[0.05, 0.12, 0.7, 8]} />
            </mesh>
            <group position-y={0.95}>
              <mesh material={std('#1a1633', { flat: false })}>
                <boxGeometry args={[0.72, 0.56, 0.08]} />
              </mesh>
              <mesh position-z={0.045}>
                <planeGeometry args={[0.66, 0.5]} />
                <meshBasicMaterial map={screen} toneMapped={false} />
              </mesh>
            </group>
            <group ref={dish} position={[0, 1.35, 0]}>
              <mesh rotation-x={-0.6} material={std('#c9c3e6', { metal: 0.6, rough: 0.3 })}>
                <sphereGeometry args={[0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3]} />
              </mesh>
            </group>
          </>
        )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, screen])

  return <group ref={g}>{content}</group>
}

/** Dois planetinhas em órbitas livres: se cruzam, mas ninguém prende ninguém. */
function Orbiters() {
  const a = useRef<THREE.Group>(null!)
  const b = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.35
    a.current.position.set(Math.cos(t) * 3.2, 3.6 + Math.sin(t * 1.3) * 0.5, Math.sin(t) * 1.6 - 1)
    b.current.position.set(Math.cos(-t * 0.8 + 2) * 2.4, 3.2 + Math.cos(t) * 0.6, Math.sin(-t * 0.8 + 2) * 1.4 - 1)
  })
  return (
    <>
      <group ref={a}>
        <Planet color={palette.lavender} ring ringColor={palette.pink} size={0.35} />
      </group>
      <group ref={b}>
        <Planet color={palette.coral} size={0.28} spin={0.5} />
      </group>
    </>
  )
}
