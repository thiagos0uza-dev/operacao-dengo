import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent, type ThreeElements } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { useGame, type Prop } from '../../game/state/store'
import { glow, heartGeometry, std } from '../materials'
import { blobShadowTexture, radialGlowTexture, signTexture } from '../../utils/canvas'
import { easterEggs, palette } from '../../content/config'
import { sfx } from '../../audio/sound'

const D = THREE.MathUtils.damp
const C = {
  shell: palette.shell,
  accent: palette.violet,
  pink: palette.pink,
  screen: '#120f26',
  eye: palette.cyan,
}

type Props = ThreeElements['group'] & { interactive?: boolean; shadow?: boolean }

/** R-404. Corpo facetado, cabeça arredondada, tela de rosto expressiva. */
export const Robot = forwardRef<THREE.Group, Props>(function Robot({ interactive = true, shadow = true, ...rest }, ref) {
  const props = useGame((s) => s.robot.props)
  const sign = useGame((s) => s.robot.sign)
  const quip = useGame((s) => s.robot.quip)
  const quipId = useGame((s) => s.robot.quipId)

  const floatG = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const squash = useRef<THREE.Group>(null!)
  const eyes = useRef<THREE.Group[]>([])
  const mouth = useRef<THREE.Group>(null!)
  const blush = useRef<THREE.Mesh[]>([])
  const chest = useRef<THREE.Mesh>(null!)
  const thrust = useRef<THREE.Sprite>(null!)
  const sweat = useRef<THREE.Mesh>(null!)
  const stars = useRef<THREE.Group>(null!)
  const shadowRef = useRef<THREE.Mesh>(null!)
  const beacon = useRef<THREE.Mesh>(null!)

  const st = useRef({ t: 0, spin: 0, blink: 0, nextBlink: 2, squash: 0, dart: 0 })
  const glowTex = useMemo(() => radialGlowTexture('#7ff3ff'), [])
  const signTex = useMemo(() => (sign ? signTexture(sign) : null), [sign])
  useEffect(() => () => signTex?.dispose(), [signTex])

  const has = (p: Prop) => props.includes(p)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { robot, settings } = useGame.getState()
    const s = st.current
    const speed = settings.speed
    s.t += dt * speed
    const t = s.t
    const a = robot.anim
    const mood = robot.mood

    // alvos
    let y = 0.95 + Math.sin(t * 2) * 0.05
    let bx = 0, bz = 0, hx = 0, hy = Math.sin(t * 0.5) * 0.25, hz = 0
    let lx = 0.1 + Math.sin(t * 1.6) * 0.08, lz = -0.25, rx = 0.1 + Math.sin(t * 1.6 + 1) * 0.08, rz = 0.25
    let spinV = 0
    let thrustK = 1

    switch (a) {
      case 'type':
        hx = 0.25; hy = 0; bx = 0.12
        lx = -1.15 + Math.sin(t * 22) * 0.12; rx = -1.15 + Math.sin(t * 22 + 2) * 0.12; lz = -0.05; rz = 0.05
        break
      case 'panic':
        bz = Math.sin(t * 31) * 0.14; bx = Math.sin(t * 23) * 0.08; hy = Math.sin(t * 17) * 0.5
        lz = -2.5 + Math.sin(t * 25) * 0.5; rz = 2.5 + Math.sin(t * 27) * 0.5; lx = -0.3; rx = -0.3
        y = 1.05 + Math.abs(Math.sin(t * 12)) * 0.15
        break
      case 'wave':
        rz = 2.6 + Math.sin(t * 9) * 0.35; hz = 0.15; hy = 0
        break
      case 'dance':
        bz = Math.sin(t * 6) * 0.25; y = 1 + Math.abs(Math.sin(t * 6)) * 0.22; hz = -Math.sin(t * 6) * 0.2; hy = 0
        lz = -1.5 - Math.sin(t * 6) * 1.1; rz = 1.5 - Math.sin(t * 6) * 1.1
        spinV = Math.sin(t * 1.5) > 0.85 ? 9 : 0
        break
      case 'bow':
        bx = 0.55; hx = 0.35; hy = 0; rx = -0.9; rz = -0.35; lx = 0.4
        break
      case 'run':
        bx = 0.35; y = 0.95 + Math.abs(Math.sin(t * 16)) * 0.12; hy = 0
        lx = Math.sin(t * 16) * 1.1; rx = -Math.sin(t * 16) * 1.1; thrustK = 2.2
        break
      case 'fall':
        bz = 1.45; y = 0.45; hy = 0; lz = -2.2; rz = 0.6; thrustK = 0.1
        break
      case 'spin':
        spinV = 14; lz = -1.9; rz = 1.9; y = 1.1
        break
      case 'carry':
        lz = -2.85; rz = 2.85; lx = 0; rx = 0; bz = Math.sin(t * 3) * 0.12; hy = Math.sin(t * 3) * 0.2; y = 0.9 + Math.sin(t * 6) * 0.03
        break
      case 'nervous':
        bz = Math.sin(t * 40) * 0.03; hx = 0.18; hy = Math.sin(t * 3) * 0.15
        lx = -0.7; rx = -0.7; lz = 0.35; rz = -0.35
        break
      case 'sit':
        y = 0.62; bx = -0.18; hx = 0.18; hy = 0; lx = -0.95; rx = -0.95; lz = 0.15; rz = -0.15; thrustK = 0.15
        break
      case 'hold':
        lx = -1.45; rx = -1.45; lz = 0.28; rz = -0.28; hy = 0; hz = Math.sin(t * 1.5) * 0.06
        break
      case 'thumbs':
        rx = -1.25; rz = 0.4; hz = -0.12; hy = 0
        break
      case 'stamp': {
        const k = (t * 3.2) % 1
        rx = k < 0.6 ? -2.4 : -0.55; lx = -0.5; hx = 0.25; hy = 0
        break
      }
      case 'fly':
        lx = 0.7; rx = 0.7; lz = -0.4; rz = 0.4; hx = -0.2; thrustK = 3.2
        break
      case 'look':
        hy = 0; hz = 0.14 * Math.sin(t * 0.8)
        break
    }
    if (useGame.getState().chaos) {
      spinV += 2.5
      bz += Math.sin(t * 2) * 0.4
    }

    const k = 8 * speed
    floatG.current.position.y = D(floatG.current.position.y, y, k, dt)
    body.current.rotation.x = D(body.current.rotation.x, bx, k, dt)
    body.current.rotation.z = D(body.current.rotation.z, bz, k, dt)
    head.current.rotation.x = D(head.current.rotation.x, hx, k, dt)
    head.current.rotation.y = D(head.current.rotation.y, hy, k, dt)
    head.current.rotation.z = D(head.current.rotation.z, hz, k, dt)
    armL.current.rotation.x = D(armL.current.rotation.x, lx, k * 1.4, dt)
    armL.current.rotation.z = D(armL.current.rotation.z, lz, k * 1.4, dt)
    armR.current.rotation.x = D(armR.current.rotation.x, rx, k * 1.4, dt)
    armR.current.rotation.z = D(armR.current.rotation.z, rz, k * 1.4, dt)
    s.spin += spinV * dt
    if (!spinV) s.spin = D(s.spin, Math.round(s.spin / (Math.PI * 2)) * Math.PI * 2, 5, dt)
    floatG.current.rotation.y = s.spin

    // squash ao ser clicado
    s.squash = D(s.squash, 0, 7, dt)
    const sq = Math.sin(s.squash * 9) * s.squash
    squash.current.scale.set(1 + sq * 0.25, 1 - sq * 0.25, 1 + sq * 0.25)

    // piscar
    s.nextBlink -= dt
    if (s.nextBlink < 0) {
      s.blink = 1
      s.nextBlink = 2 + Math.random() * 3
    }
    s.blink = Math.max(0, s.blink - dt * 7)
    const blinkY = 1 - Math.sin(s.blink * Math.PI) * 0.9

    // expressões
    const vis = {
      cap: ['idle', 'focused', 'nervous', 'sad', 'confused', 'panic'].includes(mood),
      arc: mood === 'happy' || mood === 'proud',
      heart: mood === 'love',
      x: mood === 'dizzy',
      lid: mood === 'sad',
    }
    s.dart = mood === 'nervous' ? Math.sin(t * 9) * 0.03 : 0
    eyes.current.forEach((e, i) => {
      if (!e) return
      const [cap, arc, hrt, x, lid] = e.children
      cap.visible = vis.cap
      arc.visible = vis.arc
      hrt.visible = vis.heart
      x.visible = vis.x
      lid.visible = vis.lid
      let sc = 1
      if (mood === 'panic') sc = 1.45 + Math.sin(t * 30) * 0.08
      if (mood === 'nervous') sc = 0.7
      if (mood === 'confused') sc = i === 0 ? 0.65 : 1.25
      cap.scale.set(sc, (mood === 'focused' ? 0.55 : sc) * blinkY, sc)
      hrt.scale.setScalar(0.11 * (1 + Math.sin(t * 8) * 0.12))
      x.rotation.z = mood === 'dizzy' ? t * 6 : 0
      e.position.x = (i === 0 ? -0.17 : 0.17) + s.dart
    })
    const [mLine, mSmile, mO] = mouth.current.children
    mLine.visible = ['idle', 'focused', 'sad', 'confused', 'nervous'].includes(mood)
    mSmile.visible = ['happy', 'proud', 'love', 'dizzy'].includes(mood)
    mO.visible = mood === 'panic'
    mLine.rotation.z = mood === 'confused' ? 0.3 : mood === 'nervous' ? Math.sin(t * 20) * 0.15 : 0
    mLine.scale.x = mood === 'sad' ? 0.7 : 1

    const dengo = settings.dengo / 100
    const blushK = (mood === 'love' ? 0.9 : mood === 'happy' || mood === 'nervous' ? 0.45 : 0.1) * (0.3 + dengo)
    blush.current.forEach((b) => b && ((b.material as THREE.MeshBasicMaterial).opacity = D((b.material as THREE.MeshBasicMaterial).opacity, blushK, 4, dt)))
    chest.current.scale.setScalar(0.07 * (1 + Math.max(0, Math.sin(t * (mood === 'love' || mood === 'panic' ? 9 : 3))) * 0.2))

    thrust.current.scale.setScalar(D(thrust.current.scale.x, 0.55 * thrustK * (0.9 + Math.sin(t * 30) * 0.1), 10, dt))
    sweat.current.visible = mood === 'nervous' || mood === 'panic' || has('sweat')
    sweat.current.position.y = 0.2 - ((t * 0.4) % 0.3)
    stars.current.visible = mood === 'dizzy' || has('stars')
    stars.current.rotation.y = t * 4
    if (beacon.current) beacon.current.rotation.y = t * 8
    if (shadowRef.current) {
      const h = floatG.current.position.y
      shadowRef.current.scale.setScalar(1.25 - h * 0.25)
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return
    e.stopPropagation()
    if (e.delta > 10) return
    st.current.squash = 1
    const g = useGame.getState()
    const n = g.robotClicks + 1
    useGame.setState({ robotClicks: n })
    sfx('boop', { rate: 0.8 + Math.random() * 0.5 })
    const line = easterEggs.robotClicks[n]
    if (line) g.setRobot({ quip: line, quipId: g.robot.quipId + 1 })
  }

  return (
    <group ref={ref} {...rest}>
      {shadow && (
        <mesh ref={shadowRef} rotation-x={-Math.PI / 2} position-y={0.01} renderOrder={-1}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial map={blobShadowTexture()} transparent depthWrite={false} />
        </mesh>
      )}
      <group ref={squash}>
        <group ref={floatG} position-y={0.95}>
          {/* área de clique generosa (dedos não são precisos) */}
          <mesh visible={false} position-y={0.35} onClick={onClick}>
            <capsuleGeometry args={[0.6, 1, 4, 8]} />
          </mesh>
          <group ref={body}>
            {/* corpo */}
            <mesh scale={[1.05, 1.05, 0.95]} material={std(C.shell, { rough: 0.45 })}>
              <icosahedronGeometry args={[0.48, 2]} />
            </mesh>
            <mesh position={[0, -0.05, 0.35]} rotation-x={0.25} material={std(C.accent, { rough: 0.5 })}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
            </mesh>
            <mesh ref={chest} position={[0, -0.03, 0.43]} rotation-x={0.25} geometry={heartGeometry()} material={glow(C.pink)} scale={0.07} />
            <mesh position-y={-0.48} material={std(C.accent)}>
              <cylinderGeometry args={[0.16, 0.24, 0.14, 10]} />
            </mesh>
            <sprite ref={thrust} position-y={-0.62} scale={0.55}>
              <spriteMaterial map={glowTex} color={palette.cyan} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>

            {/* cabeça */}
            <group ref={head} position-y={0.72}>
              <RoundedBox args={[1.02, 0.74, 0.74]} radius={0.22} smoothness={3} material={std(C.shell, { rough: 0.4, flat: false })} />
              <RoundedBox args={[0.84, 0.54, 0.08]} radius={0.04} smoothness={2} position-z={0.34} material={std(C.screen, { rough: 0.2, metal: 0.3, flat: false })} />
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.53, 0, 0]} rotation-z={Math.PI / 2} material={std(C.accent)}>
                  <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
                </mesh>
              ))}
              {/* antena */}
              <mesh position-y={0.47} material={std('#9a93c9')}>
                <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
              </mesh>
              <mesh position-y={0.6} material={glow(C.pink)}>
                <icosahedronGeometry args={[0.07, 1]} />
              </mesh>

              {/* olhos */}
              {[0, 1].map((i) => (
                <group key={i} ref={(g) => void (g && (eyes.current[i] = g))} position={[i === 0 ? -0.17 : 0.17, 0.04, 0.39]}>
                  <mesh material={glow(C.eye)}>
                    <capsuleGeometry args={[0.05, 0.08, 4, 10]} />
                  </mesh>
                  <mesh material={glow(C.eye)}>
                    <torusGeometry args={[0.07, 0.02, 6, 16, Math.PI]} />
                  </mesh>
                  <mesh geometry={heartGeometry()} material={glow(C.pink)} scale={0.11} />
                  <group>
                    <mesh rotation-z={Math.PI / 4} material={glow(C.eye)}>
                      <boxGeometry args={[0.16, 0.035, 0.01]} />
                    </mesh>
                    <mesh rotation-z={-Math.PI / 4} material={glow(C.eye)}>
                      <boxGeometry args={[0.16, 0.035, 0.01]} />
                    </mesh>
                  </group>
                  <mesh position={[0, 0.06, 0.015]} rotation-z={i === 0 ? -0.35 : 0.35} material={std(C.screen, { flat: false })}>
                    <boxGeometry args={[0.18, 0.07, 0.01]} />
                  </mesh>
                </group>
              ))}
              {/* boca */}
              <group ref={mouth} position={[0, -0.14, 0.39]}>
                <mesh material={glow(C.eye)}>
                  <boxGeometry args={[0.12, 0.018, 0.01]} />
                </mesh>
                <mesh rotation-z={Math.PI} material={glow(C.eye)}>
                  <torusGeometry args={[0.06, 0.016, 6, 14, Math.PI]} />
                </mesh>
                <mesh material={glow(C.eye)}>
                  <torusGeometry args={[0.04, 0.014, 6, 14]} />
                </mesh>
              </group>
              {/* bochechas */}
              {[-1, 1].map((s, i) => (
                <mesh key={s} ref={(m) => void (m && (blush.current[i] = m))} position={[s * 0.3, -0.1, 0.385]}>
                  <circleGeometry args={[0.06, 14]} />
                  <meshBasicMaterial color={C.pink} transparent opacity={0.1} toneMapped={false} depthWrite={false} />
                </mesh>
              ))}
              {/* gota de suor */}
              <mesh ref={sweat} position={[0.5, 0.2, 0.25]} scale={[0.045, 0.07, 0.045]} material={glow('#9be7ff')}>
                <sphereGeometry args={[1, 8, 8]} />
              </mesh>
              {/* estrelinhas de tontura */}
              <group ref={stars} position-y={0.55}>
                {[0, 1, 2].map((i) => (
                  <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.45, 0, Math.sin((i * Math.PI * 2) / 3) * 0.45]} material={glow(palette.gold)}>
                    <octahedronGeometry args={[0.07, 0]} />
                  </mesh>
                ))}
              </group>

              {/* chapéus */}
              {has('bowler') && <Bowler position-y={0.4} />}
              {has('detective') && (
                <group position-y={0.36}>
                  <mesh material={std('#8a6a4a')} scale={[1, 0.6, 1]}>
                    <sphereGeometry args={[0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  </mesh>
                  <mesh position-z={0.25} rotation-x={0.2} material={std('#6d5238')}>
                    <cylinderGeometry args={[0.3, 0.3, 0.03, 10, 1, false, -Math.PI / 2, Math.PI]} />
                  </mesh>
                </group>
              )}
              {has('helmet') && (
                <group position-y={0.3}>
                  <mesh material={std(palette.gold, { rough: 0.35 })} scale={[1.15, 0.75, 1.05]}>
                    <sphereGeometry args={[0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  </mesh>
                  <mesh ref={beacon} position-y={0.4} material={glow(palette.alert)}>
                    <cylinderGeometry args={[0.08, 0.1, 0.14, 8]} />
                  </mesh>
                </group>
              )}
              {has('partyhat') && (
                <mesh position={[0.15, 0.6, 0]} rotation-z={-0.3} material={std(palette.pink)}>
                  <coneGeometry args={[0.18, 0.45, 10]} />
                </mesh>
              )}
            </group>

            {/* braços (destacados, estilo boneco) */}
            <group ref={armL} position={[-0.62, 0.1, 0]}>
              <mesh position-y={-0.2} material={std(C.shell, { flat: false })}>
                <capsuleGeometry args={[0.085, 0.24, 4, 8]} />
              </mesh>
              <mesh position-y={-0.42} material={std(C.accent)}>
                <icosahedronGeometry args={[0.12, 1]} />
              </mesh>
              <group position-y={-0.5}>{has('chocolates') && <Chocolates />}</group>
            </group>
            <group ref={armR} position={[0.62, 0.1, 0]}>
              <mesh position-y={-0.2} material={std(C.shell, { flat: false })}>
                <capsuleGeometry args={[0.085, 0.24, 4, 8]} />
              </mesh>
              <mesh position-y={-0.42} material={std(C.accent)}>
                <icosahedronGeometry args={[0.12, 1]} />
              </mesh>
              <group position-y={-0.52}>
                {has('magnifier') && <Magnifier />}
                {has('phone') && <Phone />}
                {has('firstaid') && <FirstAid />}
                {has('stamp') && <Stamp />}
                {has('book') && <Book />}
                {has('bowlerHand') && <Bowler rotation-x={Math.PI / 2} position-z={0.1} />}
              </group>
            </group>

            {/* placa segurada à frente */}
            {has('sign') && signTex && (
              <group position={[0, 0.45, 0.62]} rotation-x={-0.08}>
                <mesh position-y={-0.45} material={std('#b48a5a')}>
                  <boxGeometry args={[0.05, 0.6, 0.05]} />
                </mesh>
                <mesh>
                  <planeGeometry args={[1.25, 0.78]} />
                  <meshStandardMaterial map={signTex} roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            {has('planet') && (
              <group position={[0, 0.25, 0.7]}>
                <mesh material={std(palette.lavender)}>
                  <icosahedronGeometry args={[0.22, 1]} />
                </mesh>
                <mesh rotation-x={1.2} material={std(palette.pink)}>
                  <torusGeometry args={[0.32, 0.02, 4, 24]} />
                </mesh>
              </group>
            )}
          </group>

          {quip && <Quip key={quipId} text={quip} />}
        </group>
      </group>
    </group>
  )
})

function Quip({ text }: { text: string }) {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setShow(false), Math.max(2600, text.length * 70))
    return () => clearTimeout(id)
  }, [text])
  if (!show) return null
  return (
    <Html position={[0, 1.75, 0]} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
      <div className="quip">{text}</div>
    </Html>
  )
}

function Bowler(p: ThreeElements['group']) {
  return (
    <group {...p}>
      <mesh material={std('#2a2440', { rough: 0.6 })}>
        <cylinderGeometry args={[0.38, 0.38, 0.035, 18]} />
      </mesh>
      <mesh position-y={0.14} material={std('#2a2440', { rough: 0.6 })} scale={[1, 1.1, 1]}>
        <sphereGeometry args={[0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position-y={0.03} material={std(palette.pink)}>
        <cylinderGeometry args={[0.245, 0.245, 0.06, 18]} />
      </mesh>
    </group>
  )
}

function Magnifier() {
  return (
    <group rotation-x={-0.6} position-z={0.1}>
      <mesh position-y={-0.15} material={std('#6d5238')}>
        <cylinderGeometry args={[0.03, 0.035, 0.3, 6]} />
      </mesh>
      <mesh position-y={-0.42} material={std('#c9c3e6', { metal: 0.6, rough: 0.3 })}>
        <torusGeometry args={[0.16, 0.03, 6, 18]} />
      </mesh>
      <mesh position-y={-0.42}>
        <circleGeometry args={[0.15, 18]} />
        <meshStandardMaterial color="#bff6ff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Phone() {
  return (
    <group rotation-x={-1.2} position-z={0.08}>
      <RoundedBox args={[0.2, 0.36, 0.03]} radius={0.03} material={std('#1a1633', { flat: false })} />
      <mesh position-z={0.017}>
        <planeGeometry args={[0.17, 0.31]} />
        <meshBasicMaterial color={palette.cyan} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Chocolates() {
  return (
    <group rotation-x={-0.4}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -i * 0.07, 0.05]} rotation-y={i * 0.3} material={std(i % 2 ? '#7a4a2e' : '#5b3320')}>
          <boxGeometry args={[0.3, 0.06, 0.18]} />
        </mesh>
      ))}
      <mesh position={[0, 0.04, 0.05]} material={std(palette.gold, { metal: 0.5, rough: 0.3 })}>
        <boxGeometry args={[0.32, 0.02, 0.06]} />
      </mesh>
    </group>
  )
}

function FirstAid() {
  return (
    <group rotation-x={-0.3} position-z={0.05}>
      <RoundedBox args={[0.36, 0.26, 0.16]} radius={0.04} material={std('#ffffff', { flat: false })} />
      <mesh position-z={0.085} material={glow(palette.pink)}>
        <boxGeometry args={[0.16, 0.05, 0.01]} />
      </mesh>
      <mesh position-z={0.085} material={glow(palette.pink)}>
        <boxGeometry args={[0.05, 0.16, 0.01]} />
      </mesh>
    </group>
  )
}

function Stamp() {
  return (
    <group position-y={-0.08}>
      <mesh material={std('#6d5238')}>
        <cylinderGeometry args={[0.05, 0.06, 0.18, 8]} />
      </mesh>
      <mesh position-y={-0.14} material={std(palette.alert)}>
        <boxGeometry args={[0.24, 0.08, 0.16]} />
      </mesh>
    </group>
  )
}

function Book() {
  return (
    <group rotation-x={-1.1} position-z={0.12}>
      <mesh position-x={-0.11} rotation-y={0.25} material={std(palette.violet)}>
        <boxGeometry args={[0.22, 0.3, 0.02]} />
      </mesh>
      <mesh position-x={0.11} rotation-y={-0.25} material={std(palette.violet)}>
        <boxGeometry args={[0.22, 0.3, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={std('#fff6e8')}>
        <boxGeometry args={[0.38, 0.27, 0.02]} />
      </mesh>
    </group>
  )
}
