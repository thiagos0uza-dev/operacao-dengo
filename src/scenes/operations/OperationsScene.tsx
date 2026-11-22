import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { Stars } from '@react-three/drei'
import { Robot } from '../../three/characters/Robot'
import { Hotspot } from '../../three/objects/Hotspot'
import { Floaty } from '../../three/objects/Common'
import { on } from '../../game/interactions/director'
import { useGame, opInvestigations } from '../../game/state/store'
import { useUIValue } from '../../game/state/ui'
import { operations as T } from '../../content/config'
import { CoffeeMachine, DataPanel, DengoPile, Desk, Door, FloatingPlanets, Lights, MysteryBox, Poster, PrivatePlanet, RedButton, Room, StationExterior } from './objects'
import { actBox, actButton, actCoffee, actComputer, actDoor, actHatch, actMilkMoo, actPlanets, actPoster } from './script'
import { SPOT } from './script'

export default function OperationsScene() {
  const phase = useGame((s) => s.phase)
  const flags = useGame((s) => s.flags)
  const quality = useGame((s) => s.settings.quality)
  const [stage, setStage] = useState<'exterior' | 'interior'>('interior')
  const robotRef = useRef<THREE.Group>(null!)
  const hopRefs = useRef<THREE.Group[]>([])
  const poster = useUIValue<number>('poster') ?? 0
  const hub = phase === 'operations'

  useEffect(() => {
    const offs = [
      on('stage', (s) => setStage(s as 'exterior' | 'interior')),
      on('robot:place', (p) => {
        const { pos, rotY } = p as { pos: number[]; rotY: number }
        gsap.killTweensOf(robotRef.current.position)
        robotRef.current.position.set(pos[0], pos[1], pos[2])
        robotRef.current.rotation.y = rotY
      }),
      on('robot:to', (p) => {
        const { pos, rotY, dur } = p as { pos: number[]; rotY: number; dur: number }
        gsap.killTweensOf(robotRef.current.position)
        gsap.to(robotRef.current.position, { x: pos[0], y: pos[1], z: pos[2], duration: dur, ease: 'power2.inOut' })
        gsap.to(robotRef.current.rotation, { y: rotY, duration: Math.min(dur, 0.5) })
      }),
      on('robot:circle', () => {
        const r = robotRef.current
        useGame.getState().setRobot({ anim: 'run' })
        const o = { a: 0 }
        gsap.to(o, {
          a: Math.PI * 4,
          duration: 2.8,
          ease: 'none',
          onUpdate: () => {
            r.position.set(Math.sin(o.a) * 2.2, 0, Math.cos(o.a) * 1.6 + 0.6)
            r.rotation.y = o.a + Math.PI / 2
          },
        })
      }),
      on('hop', () =>
        hopRefs.current.forEach((g, i) => g && gsap.fromTo(g.position, { y: 0 }, { y: 0.35 + (i % 3) * 0.15, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', delay: i * 0.05 })),
      ),
    ]
    return () => offs.forEach((f) => f())
  }, [])

  useEffect(() => {
    useGame.setState({ sceneReady: phase })
  }, [phase])

  const hop = (i: number) => (g: THREE.Group | null) => void (g && (hopRefs.current[i] = g))
  const unlocked = opInvestigations(flags) >= 3 || !!flags['op.done']

  return (
    <>
      <color attach="background" args={['#0b0918']} />
      <fog attach="fog" args={['#0b0918', 14, 40]} />
      <Stars radius={60} depth={30} count={quality === 'low' ? 500 : 1400} factor={3} fade speed={0.6} />
      <Lights initial={phase === 'intro' ? 'dark' : flags['op.button'] ? 'love' : 'normal'} />

      {stage === 'exterior' && <StationExterior />}
      <group visible={stage === 'interior'}>
          <Room />
          <Floaty seed={1}>
            <Hotspot hid="computer" label={hub ? T.labels.computer : undefined} hidden={!hub} done={flags['op.computer']} labelY={2.35} ring={1.2} position={[-1.7, 0, -0.9]} rotation-y={0.35} onActivate={actComputer}>
              <group ref={hop(0)}>
                <Desk />
              </group>
            </Hotspot>
          </Floaty>
          <Floaty seed={2}>
            <Hotspot hid="coffee" label={hub ? T.labels.coffee : undefined} hidden={!hub} done={flags['op.coffee']} labelY={2.1} position={[-3.7, 0, 0.1]} rotation-y={0.55} onActivate={actCoffee}>
              <group ref={hop(1)}>
                <CoffeeMachine />
              </group>
            </Hotspot>
          </Floaty>
          <Floaty seed={3}>
            <Hotspot hid="redButton" label={hub ? T.labels.redButton : undefined} hidden={!hub} done={flags['op.button']} labelY={1.75} position={[3.6, 0, 0.1]} rotation-y={-0.55} onActivate={actButton}>
              <group ref={hop(2)}>
                <RedButton />
              </group>
            </Hotspot>
          </Floaty>
          <Floaty seed={4}>
            <Hotspot hid="box" label={hub ? (flags['op.box'] ? 'Milk Moo ∞' : T.labels.box) : undefined} hidden={!hub} done={flags['op.box']} labelY={1.35} ring={0.6} position={[1.9, 0, 0.9]} rotation-y={-0.3} onActivate={actBox}>
              <group ref={hop(3)}>
                <MysteryBox opened={!!flags['op.box']} />
              </group>
            </Hotspot>
          </Floaty>
          <Hotspot hid="door" label={hub ? (unlocked ? 'Próxima missão →' : T.labels.door) : undefined} hidden={!hub} labelY={3.2} ring={1.2} position={[4.7, 0, -2.9]} rotation-y={-0.95} onActivate={actDoor}>
            <Door unlocked={unlocked} />
          </Hotspot>
          <Floaty seed={5}>
            <DataPanel position={[2.6, 2.5, -5.6]} rotation-y={-0.4} />
          </Floaty>
          <group position={[-2.9, 2.3, -5.75]} rotation-y={0.45}>
            <group
              onClick={(e) => {
                e.stopPropagation()
                if (e.delta > 10 || !hub) return
                if (poster >= 3) actHatch()
                else actPoster()
              }}
            >
              <Poster stage={poster} />
            </group>
          </group>
          {hub && <FloatingPlanets onTap={actPlanets} />}
          <DengoPile arranged={!!flags['op.coffee.dengo']} robotRef={robotRef} onMilkMoo={actMilkMoo} />
          <PrivatePlanet present={!!flags['op.coffee.space']} />
          <Robot ref={robotRef} position={phase === 'intro' ? SPOT.desk : SPOT.hub} rotation-y={phase === 'intro' ? Math.PI + 0.35 : 0} />
      </group>
    </>
  )
}
