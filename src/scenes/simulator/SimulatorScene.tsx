import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Robot } from '../../three/characters/Robot'
import { useCanvasTex } from '../../three/objects/Common'
import { glow, std } from '../../three/materials'
import { on } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { palette } from '../../content/config'
import { FONT_DISPLAY, FONT_MONO, roundRect } from '../../utils/canvas'

export default function SimulatorScene() {
  const phase = useGame((s) => s.phase)
  useEffect(() => {
    useGame.setState({ sceneReady: phase })
  }, [phase])
  return (
    <>
      <color attach="background" args={['#0d0a20']} />
      <fog attach="fog" args={['#0d0a20', 10, 30]} />
      <Stars radius={50} depth={20} count={800} factor={3} fade speed={0.5} />
      <SimLights />
      {/* palco */}
      <mesh position-y={-0.1} material={std('#231c49', { rough: 0.85 })}>
        <cylinderGeometry args={[3.2, 3.4, 0.2, 12]} />
      </mesh>
      <mesh position-y={0.01} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3.0, 3.1, 48]} />
        <meshBasicMaterial color={palette.cyan} toneMapped={false} />
      </mesh>
      <BigScreen />
      <Board />
      <Scroll />
      <MemeCard />
      <Disco />
      <Robot position={[0, 0, 0.3]} />
    </>
  )
}

function SimLights() {
  const red = useRef<THREE.PointLight>(null!)
  const alarm = useRef(false)
  useEffect(() => on('sim:alarm', (v) => (alarm.current = !!v)), [])
  useFrame(({ clock }) => {
    red.current.intensity = alarm.current ? 20 + Math.sin(clock.elapsedTime * 12) * 18 : 0
  })
  return (
    <>
      <hemisphereLight args={['#cfc6ff', '#1b1238', 0.9]} />
      <directionalLight position={[2, 6, 5]} intensity={1.3} />
      <spotLight position={[0, 7, 2]} angle={0.45} penumbra={0.6} intensity={60} color="#ffe6f2" distance={14} />
      <pointLight position={[-3, 2, -2]} color={palette.violet} intensity={10} distance={10} />
      <pointLight ref={red} position={[0, 4, 1]} color={palette.alert} intensity={0} distance={14} />
    </>
  )
}

function BigScreen() {
  const tex = useCanvasTex(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0d0b22'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(124,108,255,.25)'
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.fillStyle = palette.cyan
    ctx.font = `800 54px ${FONT_DISPLAY}`
    ctx.fillText('SIMULADOR', 48, 100)
    ctx.fillStyle = palette.pink
    ctx.font = `600 28px ${FONT_MONO}`
    ctx.fillText('modo: extremamente sério', 48, 150)
    ctx.strokeStyle = palette.pink
    ctx.lineWidth = 5
    ctx.beginPath()
    for (let x = 0; x < w - 96; x += 4) ctx.lineTo(48 + x, 330 + Math.sin(x * 0.04) * 60 * Math.cos(x * 0.006))
    ctx.stroke()
    ctx.fillStyle = '#8c84c9'
    ctx.font = `500 24px ${FONT_MONO}`
    ctx.fillText('compreensão de humanos: 3%  ·  vontade de aprender: 100%', 48, 470)
  })
  return (
    <group position={[0, 2.6, -3]}>
      <mesh material={std('#1a1633', { flat: false })}>
        <boxGeometry args={[6.2, 3.2, 0.12]} />
      </mesh>
      <mesh position-z={0.07}>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Mural de investigação com fios vermelhos (cai do teto). */
function Board() {
  const g = useRef<THREE.Group>(null!)
  const tex = useCanvasTex(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = '#b98a58'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(80,50,20,${Math.random() * 0.25})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3)
    }
    const pics: [number, number, string][] = [
      [80, 70, 'tomando banho?'],
      [420, 50, 'dormindo'],
      [760, 90, 'vivendo a vida'],
      [140, 360, 'sem bateria'],
      [480, 340, 'comendo'],
      [790, 380, 'vendo série'],
    ]
    const centers = pics.map(([x, y]) => [x + 90, y + 100])
    ctx.strokeStyle = '#d0182f'
    ctx.lineWidth = 5
    for (let i = 0; i < centers.length; i++)
      for (let j = i + 1; j < centers.length; j += 2) {
        ctx.beginPath()
        ctx.moveTo(centers[i][0], centers[i][1])
        ctx.lineTo(centers[j][0], centers[j][1])
        ctx.stroke()
      }
    pics.forEach(([x, y, label], i) => {
      ctx.save()
      ctx.translate(x + 90, y + 100)
      ctx.rotate((i % 2 ? 1 : -1) * 0.06)
      ctx.fillStyle = '#fff'
      ctx.fillRect(-90, -100, 180, 210)
      ctx.fillStyle = ['#c9bfff', '#ffd6e6', '#bff6ff', '#ffe7b0', '#d4ffd9', '#ffd0c2'][i]
      ctx.fillRect(-76, -86, 152, 140)
      ctx.fillStyle = '#1a1633'
      ctx.font = `700 60px ${FONT_DISPLAY}`
      ctx.textAlign = 'center'
      ctx.fillText('?', 0, -2)
      ctx.font = `600 20px ${FONT_MONO}`
      ctx.fillText(label, 0, 88)
      ctx.fillStyle = '#d0182f'
      ctx.beginPath()
      ctx.arc(0, -92, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
    ctx.fillStyle = '#fff6e8'
    roundRect(ctx, w / 2 - 170, h - 70, 340, 52, 8)
    ctx.fill()
    ctx.fillStyle = '#d0182f'
    ctx.font = `800 30px ${FONT_DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('CASO: 5 HORAS SEM RESPOSTA', w / 2, h - 34)
  })
  useEffect(
    () =>
      on('sim:board', (v) => {
        gsap.to(g.current.position, { y: v ? 2.2 : 9, duration: v ? 0.8 : 0.6, ease: v ? 'bounce.out' : 'power2.in' })
      }),
    [],
  )
  return (
    <group ref={g} position={[0.5, 9, -1.6]}>
      <mesh>
        <planeGeometry args={[3.6, 2.25]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      <mesh position-z={-0.04} material={std('#6d5238')}>
        <boxGeometry args={[3.8, 2.45, 0.06]} />
      </mesh>
    </group>
  )
}

/** "Formulário de saída" de 40 páginas que desenrola até o chão. */
function Scroll() {
  const g = useRef<THREE.Group>(null!)
  const paper = useRef<THREE.Mesh>(null!)
  const tex = useCanvasTex(256, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e8'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1a1633'
    ctx.font = `800 22px ${FONT_DISPLAY}`
    ctx.fillText('FORMULÁRIO DE SAÍDA', 18, 40)
    ctx.font = `500 14px ${FONT_MONO}`
    const qs = ['1. por quê?', '2. por quê (detalhado)', '3. com quem?', '4. lista de convidados', '5. horário de volta', '6. foto do local', '7. justificativa', '8. por quê, de novo', '9. assinatura da mãe', '10. ...']
    for (let i = 0; i < 46; i++) {
      ctx.fillText(qs[i % qs.length], 18, 80 + i * 20)
      ctx.fillRect(160, 84 + i * 20, 80, 1)
    }
  })
  useEffect(
    () =>
      on('sim:scroll', (v) => {
        if (v === 'unroll') {
          g.current.visible = true
          g.current.scale.set(1, 1, 1)
          paper.current.scale.y = 0.01
          gsap.to(paper.current.scale, { y: 1, duration: 1.6, ease: 'power2.out' })
        } else if (v === 'tear') {
          gsap.to(g.current.scale, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'back.in(2)' })
        } else g.current.visible = false
      }),
    [],
  )
  return (
    <group ref={g} position={[0.1, 2.0, 1.05]} visible={false}>
      <mesh ref={paper} position-y={0} scale-y={0.01}>
        <planeGeometry args={[0.7, 2.8]} />
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function MemeCard() {
  const g = useRef<THREE.Group>(null!)
  const tex = useCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1a1633'
    ctx.font = `900 40px ${FONT_DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('ELA: *manda um meme*', w / 2, 70)
    ctx.fillStyle = '#c9bfff'
    roundRect(ctx, 136, 110, 240, 200, 40)
    ctx.fill()
    ctx.fillStyle = '#120f26'
    roundRect(ctx, 160, 140, 192, 130, 20)
    ctx.fill()
    ctx.strokeStyle = palette.cyan
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.arc(215, 210, 22, Math.PI, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(297, 210, 22, Math.PI, 0)
    ctx.stroke()
    ctx.fillStyle = '#1a1633'
    ctx.font = `900 38px ${FONT_DISPLAY}`
    ctx.fillText('O ROBÔ: melhor', w / 2, 380)
    ctx.fillText('conversa do dia', w / 2, 430)
  })
  useEffect(
    () =>
      on('sim:meme', () => {
        g.current.visible = true
        const tl = gsap.timeline({ onComplete: () => void (g.current.visible = false) })
        tl.fromTo(g.current.position, { x: 0.6, y: 1.4, z: 0.6 }, { x: 0, y: 2.2, z: 3.2, duration: 0.9, ease: 'power2.out' })
        tl.fromTo(g.current.rotation, { z: -2, y: 0 }, { z: 0, y: 0, duration: 0.9 }, 0)
        tl.to(g.current.position, { y: 2.3, duration: 1.4 })
        tl.to(g.current.position, { x: -6, y: 4, duration: 0.6, ease: 'power2.in' })
      }),
    [],
  )
  return (
    <group ref={g} visible={false}>
      <mesh>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={tex} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Globo de discoteca + luzes giratórias (modo festa). */
function Disco() {
  const g = useRef<THREE.Group>(null!)
  const beams = useRef<THREE.Group>(null!)
  const [on_, setOn] = useState(false)
  useEffect(
    () =>
      on('sim:party', (v) => {
        setOn(!!v)
        gsap.to(g.current.position, { y: v ? 4.3 : 9, duration: 0.9, ease: v ? 'bounce.out' : 'power2.in' })
      }),
    [],
  )
  useFrame((_, dt) => {
    g.current.rotation.y += dt * 1.5
    if (beams.current) beams.current.rotation.y -= dt * 2
  })
  return (
    <group ref={g} position={[0, 9, 0.4]}>
      <mesh position-y={1.2} material={std('#8c84c9')}>
        <cylinderGeometry args={[0.02, 0.02, 2.2, 4]} />
      </mesh>
      <mesh material={std('#e9e6ff', { metal: 0.9, rough: 0.15 })}>
        <icosahedronGeometry args={[0.45, 1]} />
      </mesh>
      {on_ && (
        <group ref={beams}>
          {[palette.pink, palette.cyan, palette.gold, palette.violet].map((c, i) => (
            <mesh key={c} rotation={[0.9, (i * Math.PI) / 2, 0]} position-y={-0.2}>
              <coneGeometry args={[0.5, 5, 10, 1, true]} />
              <primitive object={glow(c, 0.12)} attach="material" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
