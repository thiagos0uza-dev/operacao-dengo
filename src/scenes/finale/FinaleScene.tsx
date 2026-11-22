import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useFrame } from '@react-three/fiber'
import { Line, Stars } from '@react-three/drei'
import { Robot } from '../../three/characters/Robot'
import { Planet, SkyDome } from '../../three/objects/Common'
import { glow, std } from '../../three/materials'
import { on } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { palette } from '../../content/config'

const CENTER = new THREE.Vector3(0, 4.9, -6)
const HEART_N = 90

/** Metade de um coração paramétrico; a outra metade é o espelho. */
function heartPoint(t: number, side: 1 | -1) {
  const x = 16 * Math.sin(t) ** 3
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
  return new THREE.Vector3(CENTER.x + side * x * 0.13, CENTER.y + y * 0.13, CENTER.z)
}

export default function FinaleScene() {
  const phase = useGame((s) => s.phase)
  const robotRef = useRef<THREE.Group>(null!)
  const a = useRef<THREE.Group>(null!)
  const b = useRef<THREE.Group>(null!)
  const mode = useRef<'apart' | 'heart' | 'together' | 'calm'>('apart')
  const prog = useRef({ k: 0 })
  const [drawn, setDrawn] = useState(0)
  const halves = useMemo(() => {
    const L: THREE.Vector3[] = []
    const R: THREE.Vector3[] = []
    for (let i = 0; i <= HEART_N; i++) {
      const t = (i / HEART_N) * Math.PI
      R.push(heartPoint(t, 1))
      L.push(heartPoint(t, -1))
    }
    return { L, R }
  }, [])

  useEffect(() => {
    const offs = [
      on('planets', (m) => {
        mode.current = m as typeof mode.current
        if (m === 'heart') {
          prog.current.k = 0
          setDrawn(0)
          const reduced = useGame.getState().settings.reducedMotion
          gsap.to(prog.current, {
            k: 1,
            duration: reduced ? 0.6 : 4,
            ease: 'power1.inOut',
            onUpdate: () => setDrawn(Math.round(prog.current.k * HEART_N)),
            onComplete: () => void (mode.current = 'together'),
          })
        }
      }),
      on('robot:place', (p) => {
        const pos = p as number[]
        gsap.killTweensOf(robotRef.current.position)
        robotRef.current.position.set(pos[0], pos[1], pos[2])
      }),
      on('robot:fly', () => gsap.to(robotRef.current.position, { y: 9, x: 3, duration: 1.8, ease: 'power2.in' })),
      on('robot:away', () => robotRef.current.position.set(3, 9, 0)),
      on('robot:return', () => gsap.fromTo(robotRef.current.position, { x: 3, y: 9 }, { x: 0, y: 0, z: 0, duration: 1.6, ease: 'power2.out' })),
    ]
    return () => offs.forEach((f) => f())
  }, [])

  useEffect(() => {
    useGame.setState({ sceneReady: phase })
  }, [phase])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const m = mode.current
    if (m === 'apart' || m === 'calm') {
      const s = m === 'calm' ? 0.25 : 0.4
      a.current.position.set(CENTER.x - 3.2 + Math.cos(t * s) * 0.5, CENTER.y + 0.6 + Math.sin(t * s * 1.3) * 0.4, CENTER.z + Math.sin(t * s) * 0.5)
      b.current.position.set(CENTER.x + 3.2 + Math.cos(-t * s * 0.9) * 0.5, CENTER.y - 0.4 + Math.cos(t * s) * 0.4, CENTER.z + Math.sin(-t * s) * 0.5)
    } else if (m === 'heart') {
      const i = Math.min(HEART_N, Math.round(prog.current.k * HEART_N))
      a.current.position.copy(halves.L[i])
      b.current.position.copy(halves.R[i])
    } else {
      // juntos: dançam um ao redor do outro no centro do coração
      const r = 0.55
      a.current.position.set(CENTER.x + Math.cos(t) * r, CENTER.y - 0.2 + Math.sin(t * 2) * 0.1, CENTER.z + Math.sin(t) * r)
      b.current.position.set(CENTER.x - Math.cos(t) * r, CENTER.y - 0.2 - Math.sin(t * 2) * 0.1, CENTER.z - Math.sin(t) * r)
    }
  })

  const yes = phase === 'yes'
  return (
    <>
      <SkyDome top={yes ? '#3b2a86' : '#1d1846'} bottom={yes ? '#ff9ab8' : '#6a5aa8'} radius={70} />
      <fog attach="fog" args={[yes ? '#5a3a8a' : '#2a2458', 18, 60]} />
      <Stars radius={45} depth={20} count={1600} factor={3.2} fade speed={0.7} />
      <hemisphereLight args={['#ffd6ea', '#2a1f5c', 0.9]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.1} color="#ffe6f2" />
      <pointLight position={[0, 1.6, 0.8]} color={palette.gold} intensity={6} distance={5} />

      {/* ilhazinha flutuante */}
      <group>
        <mesh position-y={-0.35} material={std('#4a3f8f', { rough: 0.9 })} scale={[1, 0.6, 1]}>
          <coneGeometry args={[1.9, 2.2, 9]} />
        </mesh>
        <mesh position-y={0.62} rotation-y={0.2} material={std('#6fd6a0', { rough: 1 })}>
          <cylinderGeometry args={[1.85, 1.9, 0.12, 9]} />
        </mesh>
        <mesh position={[-1.1, 0.7, -0.4]} material={std('#3b327a')}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 5]} />
        </mesh>
        <mesh position={[-1.1, 1.3, -0.4]} material={glow(palette.gold)}>
          <icosahedronGeometry args={[0.1, 1]} />
        </mesh>
        {[[0.9, -0.6], [1.2, 0.5], [-0.6, 0.9], [0.2, -1.1]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.78, z]} material={std(i % 2 ? palette.pink : palette.lavender)}>
            <icosahedronGeometry args={[0.09, 0]} />
          </mesh>
        ))}
      </group>
      <group position-y={0.68}>
        <Robot ref={robotRef} position={[0, 0, 0]} shadow={false} />
      </group>

      {/* os dois planetas */}
      <group ref={a}>
        <Planet color={palette.lavender} ring ringColor={palette.pink} size={0.42} />
        <pointLight color={palette.lavender} intensity={2} distance={4} />
      </group>
      <group ref={b}>
        <Planet color={palette.coral} size={0.36} spin={0.5} />
        <pointLight color={palette.coral} intensity={2} distance={4} />
      </group>

      {drawn > 1 && (
        <>
          <Line points={halves.L.slice(0, drawn + 1)} color={palette.pink} lineWidth={3} transparent opacity={0.9} />
          <Line points={halves.R.slice(0, drawn + 1)} color={palette.pink} lineWidth={3} transparent opacity={0.9} />
        </>
      )}
    </>
  )
}
