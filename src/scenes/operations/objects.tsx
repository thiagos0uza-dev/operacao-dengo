import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { on, emit } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { glow, heartGeometry, std } from '../../three/materials'
import { Floaty, MilkMooCup, Planet, useCanvasTex } from '../../three/objects/Common'
import { FONT_DISPLAY, FONT_MONO, fitText, roundRect } from '../../utils/canvas'
import { easterEggs, palette } from '../../content/config'
import { progressOf } from '../../game/state/store'

type G = ThreeElements['group']

/* ===================================================================== */
/*  Sala                                                                  */
/* ===================================================================== */
export function Room() {
  const windowTex = useCanvasTex(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w / 2, h / 2, w * 0.7)
    g.addColorStop(0, '#2a1f5c')
    g.addColorStop(1, '#07051a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.9})`
      const s = Math.random() * 2.2
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s)
    }
    const p = ctx.createRadialGradient(w * 0.66, h * 0.62, 10, w * 0.7, h * 0.66, 120)
    p.addColorStop(0, '#ffb0cf')
    p.addColorStop(0.6, '#a07cff')
    p.addColorStop(1, '#3a2a7a')
    ctx.fillStyle = p
    ctx.beginPath()
    ctx.arc(w * 0.7, h * 0.66, 110, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,220,240,.55)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.ellipse(w * 0.7, h * 0.66, 190, 34, -0.3, 0, Math.PI * 2)
    ctx.stroke()
  })
  return (
    <group>
      <mesh position-y={-0.05} material={std('#231c49', { rough: 0.9 })}>
        <cylinderGeometry args={[7.2, 7.2, 0.1, 10]} />
      </mesh>
      <mesh position-y={0.01} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.6, 2.68, 48]} />
        <meshBasicMaterial color={palette.violet} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh position-y={0.01} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[5.2, 5.25, 64]} />
        <meshBasicMaterial color={palette.cyan} transparent opacity={0.15} toneMapped={false} />
      </mesh>
      {/* parede curva ao fundo */}
      <mesh position-y={2.4} material={std('#2c2458', { rough: 0.85, flat: true })}>
        <cylinderGeometry args={[6.6, 6.6, 4.9, 12, 1, true, Math.PI * 0.62, Math.PI * 0.76]} />
      </mesh>
      {/* frisos de luz */}
      {[0.6, 4.4].map((y) => (
        <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
          <torusGeometry args={[6.5, 0.025, 4, 64, Math.PI * 0.76]} />
          <meshBasicMaterial color={y < 1 ? palette.pink : palette.violet} toneMapped={false} />
        </mesh>
      ))}
      {/* janela redonda */}
      <group position={[0, 2.7, -6.25]}>
        <mesh>
          <circleGeometry args={[1.55, 40]} />
          <meshBasicMaterial map={windowTex} toneMapped={false} />
        </mesh>
        <mesh position-z={0.02} material={std('#d9d3ff', { rough: 0.4, metal: 0.4 })}>
          <torusGeometry args={[1.6, 0.12, 8, 40]} />
        </mesh>
      </group>
      {/* teto com luminárias */}
      <mesh position-y={4.85} rotation-x={Math.PI / 2} material={std('#1b1640', { rough: 1 })}>
        <circleGeometry args={[6.7, 12]} />
      </mesh>
    </group>
  )
}

/* ===================================================================== */
/*  Luzes com "humores"                                                  */
/* ===================================================================== */
type LightMode = 'off' | 'dark' | 'alarm' | 'normal' | 'love' | 'soft'
const MODES: Record<LightMode, { hemi: number; key: number; pink: number; cyan: number; red: number; color: string }> = {
  off: { hemi: 0.05, key: 0, pink: 0, cyan: 0.4, red: 0, color: '#ffffff' },
  dark: { hemi: 0.35, key: 0.25, pink: 4, cyan: 6, red: 0, color: '#c9bfff' },
  alarm: { hemi: 0.25, key: 0.2, pink: 1, cyan: 2, red: 30, color: '#ff8899' },
  normal: { hemi: 1.0, key: 1.4, pink: 8, cyan: 6, red: 0, color: '#ffffff' },
  love: { hemi: 1.0, key: 1.1, pink: 22, cyan: 4, red: 0, color: '#ffd6ea' },
  soft: { hemi: 0.55, key: 0.5, pink: 12, cyan: 3, red: 0, color: '#ffd6ea' },
}

export function Lights({ initial }: { initial: LightMode }) {
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const key = useRef<THREE.DirectionalLight>(null!)
  const pink = useRef<THREE.PointLight>(null!)
  const cyan = useRef<THREE.PointLight>(null!)
  const red = useRef<THREE.PointLight>(null!)
  const mode = useRef<LightMode>(initial)
  const apply = (m: LightMode, dur: number) => {
    mode.current = m
    const c = MODES[m]
    gsap.to(hemi.current, { intensity: c.hemi, duration: dur })
    gsap.to(key.current, { intensity: c.key, duration: dur })
    gsap.to(pink.current, { intensity: c.pink, duration: dur })
    gsap.to(cyan.current, { intensity: c.cyan, duration: dur })
    gsap.to(red.current, { intensity: c.red, duration: dur * 0.3 })
    const col = new THREE.Color(c.color)
    gsap.to(key.current.color, { r: col.r, g: col.g, b: col.b, duration: dur })
  }
  useEffect(() => {
    apply(initial, 0.01)
    return on('lights', (m) => apply(m as LightMode, 1.2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useFrame(({ clock }) => {
    if (mode.current === 'alarm') {
      const t = clock.elapsedTime
      red.current.intensity = 18 + Math.sin(t * 10) * 16
      red.current.position.x = Math.sin(t * 5) * 3
    }
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#cfc6ff', '#1b1238', 1]} />
      <directionalLight ref={key} position={[3, 6, 5]} intensity={1.2} />
      <pointLight ref={pink} position={[0, 2.8, -5]} color={palette.pink} distance={14} decay={1.6} />
      <pointLight ref={cyan} position={[-1.7, 1.6, -0.2]} color={palette.cyan} distance={6} decay={1.6} />
      <pointLight ref={red} position={[0, 4, 0]} color={palette.alert} distance={18} decay={1.2} intensity={0} />
    </>
  )
}

/* ===================================================================== */
/*  Mesa + computador + caneca                                           */
/* ===================================================================== */
export function Desk(p: G) {
  const mug = useRef<THREE.Group>(null!)
  const spill = useRef<THREE.Mesh>(null!)
  const screen = useRef<THREE.Mesh>(null!)
  const [broken, setBroken] = useState(false)
  const codeTex = useCanvasTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#0d0b22'
    ctx.fillRect(0, 0, w, h)
    ctx.font = `600 22px ${FONT_MONO}`
    const words = ['carinho', 'saudade', 'dengo', 'racional', 'calc', 'sentimento', 'if', 'abraço', 'erro', '???', 'beta']
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = i % 5 === 0 ? palette.pink : i % 3 === 0 ? palette.cyan : '#8c84c9'
      let line = ' '.repeat((i * 7) % 6)
      for (let k = 0; k < 4; k++) line += words[(i * 3 + k * 5) % words.length] + (k % 2 ? '() ' : '.')
      ctx.fillText(line, 16, 26 + i * 24)
    }
  })
  const errTex = useCanvasTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#2a0b1d'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = palette.alert
    ctx.font = `900 120px ${FONT_DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('404', w / 2, 160)
    ctx.font = `600 24px ${FONT_MONO}`
    ctx.fillStyle = '#ffd6e6'
    ctx.fillText('racionalidade não encontrada', w / 2, 230)
  })
  useFrame((_, dt) => {
    if (!broken) codeTex.offset.y = (codeTex.offset.y + dt * 0.05) % 1
  })
  useEffect(() => {
    codeTex.wrapS = codeTex.wrapT = THREE.RepeatWrapping
    const offs = [
      on('mug:fall', () => {
        const tl = gsap.timeline()
        tl.to(mug.current.rotation, { z: -1.7, duration: 0.35, ease: 'power2.in' })
          .to(mug.current.position, { x: 1.35, y: 0.08, z: 0.5, duration: 0.5, ease: 'power2.in' }, 0.15)
          .to(mug.current.rotation, { x: 2.5, duration: 0.5 }, 0.15)
          .to(spill.current.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'power2.out' }, 0.6)
      }),
      on('mug:reset', () => {
        mug.current.rotation.set(0, 0, 0)
        mug.current.position.set(0.85, 0.98, 0.15)
        spill.current.scale.setScalar(0.001)
      }),
      on('mug:fallen', () => {
        mug.current.rotation.set(2.5, 0, -1.7)
        mug.current.position.set(1.35, 0.08, 0.5)
        spill.current.scale.setScalar(1)
      }),
      on('computer:explode', () => {
        setBroken(true)
        gsap.fromTo(screen.current.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' })
      }),
      on('computer:fix', () => setBroken(false)),
    ]
    return () => offs.forEach((f) => f())
  }, [codeTex])

  return (
    <group {...p}>
      <RoundedBox args={[2.2, 0.1, 0.95]} radius={0.04} position-y={0.92} material={std('#d9d3ff', { rough: 0.5, flat: false })} />
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} material={std('#5b4fb3')}>
          <boxGeometry args={[0.12, 0.9, 0.8]} />
        </mesh>
      ))}
      {/* monitor */}
      <group position={[-0.15, 1.42, -0.2]}>
        <RoundedBox args={[1.25, 0.82, 0.08]} radius={0.05} material={std('#1a1633', { flat: false })} />
        <mesh ref={screen} position-z={0.045}>
          <planeGeometry args={[1.13, 0.7]} />
          <meshBasicMaterial map={broken ? errTex : codeTex} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.5, -0.05]} material={std('#5b4fb3')}>
          <cylinderGeometry args={[0.05, 0.12, 0.25, 8]} />
        </mesh>
      </group>
      {/* teclado */}
      <mesh position={[-0.15, 0.99, 0.22]} rotation-x={-0.08} material={std('#3b327a')}>
        <boxGeometry args={[0.8, 0.04, 0.26]} />
      </mesh>
      {/* caneca */}
      <group ref={mug} position={[0.85, 0.98, 0.15]}>
        <mesh position-y={0.12} material={std(palette.pink)}>
          <cylinderGeometry args={[0.1, 0.09, 0.24, 10]} />
        </mesh>
        <mesh position={[0.12, 0.13, 0]} material={std(palette.pink)}>
          <torusGeometry args={[0.06, 0.018, 6, 10]} />
        </mesh>
        <mesh position-y={0.23} material={std('#4a2a1a')}>
          <cylinderGeometry args={[0.085, 0.085, 0.01, 10]} />
        </mesh>
      </group>
      <mesh ref={spill} position={[1.05, 0.015, 0.75]} rotation-x={-Math.PI / 2} scale={0.001}>
        <circleGeometry args={[0.38, 12]} />
        <meshStandardMaterial color="#5a341f" roughness={0.15} />
      </mesh>
    </group>
  )
}

/* ===================================================================== */
/*  Máquina de café                                                      */
/* ===================================================================== */
export function CoffeeMachine(p: G) {
  const steam = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    steam.current.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.5 + i / 3) % 1
      c.position.y = 1.0 + k * 0.6
      c.scale.setScalar(0.06 + k * 0.1)
      ;((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - k)
    })
  })
  const label = useCanvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#120f26'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = palette.cyan
    ctx.font = `700 34px ${FONT_MONO}`
    ctx.textAlign = 'center'
    ctx.fillText('DENGO', w / 2, 56)
    ctx.fillStyle = palette.pink
    ctx.font = `600 22px ${FONT_MONO}`
    ctx.fillText('& café', w / 2, 96)
  })
  return (
    <group {...p}>
      <RoundedBox args={[0.9, 1.6, 0.7]} radius={0.12} position-y={0.8} material={std('#5b4fb3', { flat: false, rough: 0.5 })} />
      <RoundedBox args={[0.92, 0.35, 0.72]} radius={0.1} position-y={1.55} material={std(palette.shell, { flat: false })} />
      <mesh position={[0, 1.2, 0.36]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshBasicMaterial map={label} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.78, 0.33]} material={std('#1a1633')}>
        <boxGeometry args={[0.55, 0.5, 0.1]} />
      </mesh>
      <mesh position={[0, 0.95, 0.38]} material={std('#c9c3e6', { metal: 0.6, rough: 0.3 })}>
        <cylinderGeometry args={[0.04, 0.05, 0.12, 8]} />
      </mesh>
      <mesh position={[0, 0.62, 0.42]} material={std(palette.shell)}>
        <cylinderGeometry args={[0.1, 0.08, 0.18, 10]} />
      </mesh>
      <group ref={steam} position={[0, 0, 0.42]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ===================================================================== */
/*  Botão vermelho                                                        */
/* ===================================================================== */
export function RedButton(p: G) {
  const btn = useRef<THREE.Mesh>(null!)
  const plate = useCanvasTex(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#ffd27a'
    roundRect(ctx, 0, 0, w, h, 24)
    ctx.fill()
    ctx.fillStyle = '#1a1633'
    for (let x = -h; x < w; x += 46) {
      ctx.beginPath()
      ctx.moveTo(x, h)
      ctx.lineTo(x + 22, h)
      ctx.lineTo(x + 22 + h * 0.3, h - 28)
      ctx.lineTo(x + h * 0.3, h - 28)
      ctx.fill()
    }
    fitText(ctx, 'NÃO APERTE', { x: 20, y: 6, w: w - 40, h: h - 44, max: 90, color: '#1a1633', weight: 900 })
  })
  useEffect(
    () =>
      on('button:press', () => {
        gsap.timeline().to(btn.current.position, { y: 1.08, duration: 0.08 }).to(btn.current.position, { y: 1.2, duration: 0.5, ease: 'elastic.out(1,0.4)' })
      }),
    [],
  )
  return (
    <group {...p}>
      <mesh position-y={0.5} material={std('#3b327a')}>
        <cylinderGeometry args={[0.38, 0.5, 1, 8]} />
      </mesh>
      <mesh position-y={1.03} material={std('#1a1633')}>
        <cylinderGeometry args={[0.45, 0.42, 0.08, 16]} />
      </mesh>
      <mesh ref={btn} position-y={1.2} material={std(palette.alert, { rough: 0.25, flat: false, emissive: palette.alert, ei: 0.35 })}>
        <sphereGeometry args={[0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.55, 0.47]} rotation-x={-0.12}>
        <planeGeometry args={[0.8, 0.25]} />
        <meshBasicMaterial map={plate} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ===================================================================== */
/*  Caixa misteriosa (caixa dentro de caixa dentro de caixa...)          */
/* ===================================================================== */
export function MysteryBox({ opened, ...p }: G & { opened: boolean }) {
  const layers = useRef<THREE.Group[]>([])
  const lids = useRef<THREE.Mesh[]>([])
  const battery = useRef<THREE.Group>(null!)
  const q = useCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c99a62'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#a77a45'
    ctx.lineWidth = 10
    ctx.strokeRect(10, 10, w - 20, h - 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 170px ${FONT_DISPLAY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', w / 2, h / 2 + 8)
  })
  const sizes = [0.8, 0.56, 0.38, 0.24]
  useEffect(() => {
    const show = (done: boolean) => {
      layers.current.forEach((l, i) => {
        if (!l) return
        l.visible = done ? false : i === 0
        l.position.set(0, 0, 0)
        l.scale.setScalar(1)
      })
      if (battery.current) {
        battery.current.visible = done
        battery.current.position.set(0, 0.05, 0)
      }
    }
    show(opened)
    return on('box:open', () => {
      const tl = gsap.timeline()
      const L = layers.current
      tl.to(L[0].rotation, { z: 0.15, duration: 0.07, yoyo: true, repeat: 5 })
      sizes.forEach((s, i) => {
        const lid = lids.current[i]
        tl.add(() => emit('sfx', 'pop'))
        tl.to(lid.position, { y: s + 1.4, x: (i % 2 ? -1 : 1) * 0.9, duration: 0.45, ease: 'power2.out' })
        tl.to(lid.rotation, { z: (i % 2 ? 1 : -1) * 2.5, duration: 0.45 }, '<')
        tl.to(lid.scale, { x: 0, y: 0, z: 0, duration: 0.3 }, '>-0.1')
        if (i < sizes.length - 1) {
          tl.add(() => {
            L[i + 1].visible = true
            L[i + 1].position.y = 0
          })
          tl.to(L[i + 1].position, { y: s + 0.2, duration: 0.35, ease: 'back.out(2)' }, '<')
          tl.to(L[i].scale, { x: 0, y: 0, z: 0, duration: 0.3 }, '<')
          tl.to(L[i + 1].position, { y: 0, duration: 0.35, ease: 'bounce.out' })
        }
      })
      tl.add(() => {
        battery.current.visible = true
        emit('sparks', { pos: [p.position ? (p.position as number[])[0] : 0, 1, p.position ? (p.position as number[])[2] : 0], n: 40, spread: 0.6 })
      })
      tl.fromTo(battery.current.position, { y: 0 }, { y: 0.9, duration: 0.6, ease: 'back.out(2)' })
      tl.to(L[3].scale, { x: 0, y: 0, z: 0, duration: 0.25 }, '<')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  return (
    <group {...p}>
      {sizes.map((s, i) => (
        <group key={i} ref={(g) => void (g && (layers.current[i] = g))} visible={i === 0}>
          <mesh position-y={s / 2}>
            <boxGeometry args={[s, s, s]} />
            <meshStandardMaterial map={q} roughness={0.9} />
          </mesh>
          <mesh ref={(m) => void (m && (lids.current[i] = m))} position-y={s + 0.03} material={std('#b88a55')}>
            <boxGeometry args={[s * 1.06, 0.07, s * 1.06]} />
          </mesh>
        </group>
      ))}
      <group ref={battery} visible={false}>
        <BatteryModel scale={0.55} />
      </group>
    </group>
  )
}

export function BatteryModel(p: G) {
  const lvl = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    const k = 0.25 + ((clock.elapsedTime * 0.08) % 0.75)
    lvl.current.scale.y = k
    lvl.current.position.y = 0.12 + (0.9 * k) / 2
  })
  return (
    <group {...p}>
      <mesh position-y={0.6}>
        <cylinderGeometry args={[0.32, 0.32, 1, 16, 1, true]} />
        <meshStandardMaterial color="#c9bfff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={lvl} position-y={0.4} material={glow('#7dffb0')}>
        <cylinderGeometry args={[0.27, 0.27, 0.9, 16]} />
      </mesh>
      <mesh position-y={0.08} material={std('#3b327a')}>
        <cylinderGeometry args={[0.34, 0.34, 0.16, 16]} />
      </mesh>
      <mesh position-y={1.12} material={std('#3b327a')}>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
      </mesh>
      <mesh position-y={1.2} material={std('#c9c3e6', { metal: 0.6 })}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 10]} />
      </mesh>
    </group>
  )
}

/* ===================================================================== */
/*  Porta                                                                 */
/* ===================================================================== */
export function Door({ unlocked, ...p }: G & { unlocked: boolean }) {
  const l = useRef<THREE.Mesh>(null!)
  const r = useRef<THREE.Mesh>(null!)
  useEffect(
    () =>
      on('door:open', () => {
        gsap.to(l.current.position, { x: -1.05, duration: 0.8, ease: 'power3.inOut' })
        gsap.to(r.current.position, { x: 1.05, duration: 0.8, ease: 'power3.inOut' })
      }),
    [],
  )
  return (
    <group {...p}>
      <mesh position-y={1.4} material={std('#3b327a')}>
        <boxGeometry args={[2.3, 2.9, 0.3]} />
      </mesh>
      <mesh position={[0, 1.3, 0.1]}>
        <planeGeometry args={[1.9, 2.5]} />
        <meshBasicMaterial color="#ffd6ea" toneMapped={false} />
      </mesh>
      <mesh ref={l} position={[-0.48, 1.3, 0.18]} material={std('#8f84e0', { flat: false, rough: 0.4 })}>
        <boxGeometry args={[0.95, 2.5, 0.08]} />
      </mesh>
      <mesh ref={r} position={[0.48, 1.3, 0.18]} material={std('#8f84e0', { flat: false, rough: 0.4 })}>
        <boxGeometry args={[0.95, 2.5, 0.08]} />
      </mesh>
      <mesh position={[0, 2.75, 0.2]} material={glow(unlocked ? '#7dffb0' : palette.alert)}>
        <boxGeometry args={[0.5, 0.08, 0.04]} />
      </mesh>
    </group>
  )
}

/* ===================================================================== */
/*  Painel de dados (mostra o progresso)                                 */
/* ===================================================================== */
export function DataPanel(p: G) {
  const flags = useGame((s) => s.flags)
  const pct = progressOf(flags)
  const tex = useCanvasTex(
    512,
    320,
    (ctx, w, h) => {
      ctx.fillStyle = '#0d0b22'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = palette.violet
      ctx.lineWidth = 4
      ctx.strokeRect(6, 6, w - 12, h - 12)
      ctx.fillStyle = palette.lavender
      ctx.font = `700 24px ${FONT_MONO}`
      ctx.fillText('INVESTIGAÇÃO', 28, 50)
      ctx.fillStyle = palette.cyan
      ctx.font = `900 92px ${FONT_DISPLAY}`
      ctx.fillText(pct + '%', 28, 150)
      ctx.fillStyle = '#2a2458'
      ctx.fillRect(28, 180, w - 56, 18)
      ctx.fillStyle = palette.pink
      ctx.fillRect(28, 180, ((w - 56) * pct) / 100, 18)
      ctx.strokeStyle = palette.pink
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let x = 0; x < w - 56; x += 6) ctx.lineTo(28 + x, 260 + Math.sin(x * 0.08) * 18 * Math.sin(x * 0.013))
      ctx.stroke()
      ctx.fillStyle = '#8c84c9'
      ctx.font = `500 18px ${FONT_MONO}`
      ctx.fillText('sentimentos: fora da escala', 28, 305)
    },
    [pct],
  )
  return (
    <group {...p}>
      <RoundedBox args={[1.9, 1.25, 0.1]} radius={0.05} material={std('#1a1633', { flat: false })} />
      <mesh position-z={0.06}>
        <planeGeometry args={[1.76, 1.1]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ===================================================================== */
/*  Pôster + passagem secreta                                            */
/* ===================================================================== */
export function Poster({ stage, ...p }: G & { stage: number }) {
  const g = useRef<THREE.Group>(null!)
  const tex = useCanvasTex(320, 440, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e8'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = palette.alert
    ctx.beginPath()
    ctx.arc(w / 2, 130, 90, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff6e8'
    ctx.beginPath()
    ctx.arc(w / 2, 130, 70, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.translate(w / 2, 130)
    ctx.scale(0.75, 0.75)
    ctx.fillStyle = palette.pink
    ctx.beginPath()
    ctx.moveTo(0, 20)
    ctx.bezierCurveTo(-60, -30, -20, -70, 0, -35)
    ctx.bezierCurveTo(20, -70, 60, -30, 0, 20)
    ctx.fill()
    ctx.restore()
    ctx.strokeStyle = palette.alert
    ctx.lineWidth = 18
    ctx.beginPath()
    ctx.moveTo(w / 2 - 60, 70)
    ctx.lineTo(w / 2 + 60, 190)
    ctx.stroke()
    fitText(ctx, easterEggs.secretRoom.posterText, { x: 20, y: 240, w: w - 40, h: 180, color: '#1a1633', max: 52 })
  })
  useEffect(() => {
    if (!g.current) return
    if (stage === 1) gsap.fromTo(g.current.rotation, { z: 0.15 }, { z: 0, duration: 0.8, ease: 'elastic.out(1,0.3)' })
    if (stage === 2) gsap.to(g.current.rotation, { z: -0.5, duration: 0.6, ease: 'bounce.out' })
    if (stage >= 3) {
      gsap.to(g.current.position, { y: -2.1, duration: 0.7, ease: 'power2.in' })
      gsap.to(g.current.rotation, { z: -1.2, x: -1.2, duration: 0.7 })
    }
  }, [stage])
  return (
    <group {...p}>
      {stage >= 3 && (
        <group>
          <mesh position-z={-0.02} material={std('#120f26')}>
            <boxGeometry args={[0.8, 1.05, 0.02]} />
          </mesh>
          <mesh position-z={0.01}>
            <planeGeometry args={[0.66, 0.92]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
          <mesh position={[0.2, 0, 0.03]} material={glow(palette.pink)}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        </group>
      )}
      <group ref={g}>
        <mesh position-z={0.04}>
          <planeGeometry args={[0.95, 1.3]} />
          <meshStandardMaterial map={tex} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

/* ===================================================================== */
/*  Planetas flutuantes                                                   */
/* ===================================================================== */
export function FloatingPlanets({ onTap }: { onTap: () => void }) {
  const g = useRef<THREE.Group>(null!)
  const pulse = useRef(0)
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    g.current.children.forEach((c, i) => {
      c.position.y = [3.5, 3.9, 3.3][i] + Math.sin(t * 0.8 + i * 2) * 0.12
    })
    pulse.current = Math.max(0, pulse.current - dt * 2)
    g.current.scale.setScalar(1 + Math.sin(pulse.current * 12) * pulse.current * 0.1)
  })
  return (
    <group
      ref={g}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta > 10) return
        pulse.current = 1
        onTap()
      }}
    >
      <Planet position={[-1.4, 3.5, -2.2]} color={palette.lavender} ring ringColor={palette.pink} size={0.38} />
      <Planet position={[1.1, 3.9, -2.8]} color={palette.coral} size={0.26} spin={0.6} />
      <Planet position={[2.7, 3.3, -1.2]} color={palette.cyan} size={0.18} spin={0.9} />
    </group>
  )
}

/* ===================================================================== */
/*  Protocolo de dengo: a pilha absurda                                  */
/* ===================================================================== */
export function DengoPile({ arranged, robotRef, onMilkMoo }: { arranged: boolean; robotRef: React.RefObject<THREE.Group | null>; onMilkMoo: () => void }) {
  const root = useRef<THREE.Group>(null!)
  const items = useRef<THREE.Group[]>([])
  const carrying = useRef(false)
  const [visible, setVisible] = useState(arranged)
  // posições finais: um cantinho aconchegante perto da máquina de café
  const finals: [number, number, number, number][] = [
    [-2.4, 0, 1.9, 0.2], [-2.9, 0, 2.5, -0.4], [-1.85, 0, 2.6, 0.5], [-3.4, 0, 1.4, 0.8], [-2.2, 0, 3.0, 0], [-1.6, 0, 1.9, -0.3], [-2.95, 0, 3.15, 0.3],
  ]
  // posições na pilha carregada (em cima da cabeça do robô)
  const stack: [number, number, number][] = [[0, 2.1, 0], [0, 2.45, 0], [0.1, 2.8, 0], [-0.1, 3.4, 0], [0, 3.15, 0], [0.15, 4.1, 0], [-0.2, 3.9, 0.1]]
  const place = (arr: number[][], rel: boolean) => {
    items.current.forEach((it, i) => {
      if (!it) return
      const q = arr[i]
      it.position.set(q[0], q[1], q[2])
      it.rotation.set(0, rel ? 0 : (finals[i][3] as number), 0)
    })
  }
  useEffect(() => {
    if (arranged) {
      setVisible(true)
      requestAnimationFrame(() => place(finals, false))
    }
    const a = on('coffee:carry', () => {
      setVisible(true)
      carrying.current = true
      requestAnimationFrame(() => place(stack, true))
    })
    const b = on('coffee:drop', () => {
      carrying.current = false
      const base = root.current.position.clone()
      root.current.position.set(0, 0, 0)
      items.current.forEach((it, i) => {
        if (!it) return
        it.position.add(base)
        const f = finals[i]
        const tl = gsap.timeline({ delay: i * 0.12 })
        tl.to(it.position, { x: f[0], z: f[2], duration: 0.9, ease: 'power1.out' }, 0)
        tl.to(it.position, { y: f[1], duration: 0.9, ease: 'bounce.out' }, 0)
        tl.to(it.rotation, { y: f[3], z: 0, duration: 0.9 }, 0)
        tl.add(() => emit('sfx', 'thud'), 0.5)
      })
    })
    return () => {
      a()
      b()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arranged])
  useFrame(({ clock }) => {
    if (carrying.current && robotRef.current) {
      root.current.position.copy(robotRef.current.position)
      root.current.rotation.z = Math.sin(clock.elapsedTime * 3) * 0.08
    } else root.current.rotation.z = 0
  })
  const set = (i: number) => (g: THREE.Group | null) => void (g && (items.current[i] = g))
  return (
    <group ref={root} visible={visible}>
      {/* 48 cobertores (representados por uma pilha muito confiante) */}
      <group ref={set(0)}>
        {[0, 1, 2, 3, 4].map((k) => (
          <RoundedBox key={k} args={[0.9, 0.12, 0.7]} radius={0.05} position-y={0.06 + k * 0.12} rotation-y={k * 0.15} material={std([palette.pink, palette.lavender, palette.coral, palette.cyan, palette.gold][k], { flat: false, rough: 0.95 })} />
        ))}
      </group>
      {/* travesseiro gigante */}
      <group ref={set(1)}>
        <RoundedBox args={[1.1, 0.35, 0.7]} radius={0.17} smoothness={4} position-y={0.17} material={std('#ffffff', { flat: false, rough: 1 })} />
      </group>
      {/* chocolates */}
      <group ref={set(2)}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[0, 0.04 + k * 0.08, 0]} rotation-y={k * 0.4} material={std(k % 2 ? '#7a4a2e' : '#5b3320')}>
            <boxGeometry args={[0.42, 0.07, 0.22]} />
          </mesh>
        ))}
      </group>
      {/* urso maior que o robô */}
      <group ref={set(3)}>
        <Bear scale={1.25} />
      </group>
      {/* fortaleza de almofadas */}
      <group ref={set(4)}>
        {[[-0.3, 0], [0.3, 0], [0, -0.3]].map(([x, z], k) => (
          <mesh key={k} position={[x, 0.3, z]} material={std('#c99a62')}>
            <boxGeometry args={[0.3, 0.6, 0.3]} />
          </mesh>
        ))}
        <mesh position={[0, 0.75, -0.3]} material={std(palette.pink)}>
          <coneGeometry args={[0.2, 0.3, 4]} />
        </mesh>
      </group>
      {/* Milk Moo Infinito (lendário) */}
      <group ref={set(5)}>
        <group
          onClick={(e) => {
            e.stopPropagation()
            if (e.delta > 10) return
            onMilkMoo()
          }}
        >
          <MilkMooCup scale={0.7} />
        </group>
      </group>
      {/* coração de pelúcia */}
      <group ref={set(6)}>
        <mesh position-y={0.25} geometry={heartGeometry()} material={std(palette.pink, { flat: false, rough: 1 })} scale={0.45} />
      </group>
    </group>
  )
}

export function Bear(p: G) {
  const fur = std('#c98f63', { rough: 1 })
  const light = std('#f0c9a5', { rough: 1 })
  return (
    <group {...p}>
      <mesh position-y={0.5} scale={[1, 1.1, 0.9]} material={fur}>
        <icosahedronGeometry args={[0.45, 1]} />
      </mesh>
      <mesh position={[0, 0.45, 0.33]} scale={[1, 1.1, 0.5]} material={light}>
        <icosahedronGeometry args={[0.26, 1]} />
      </mesh>
      <mesh position-y={1.15} material={fur}>
        <icosahedronGeometry args={[0.34, 1]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.27, 1.42, 0]} material={fur}>
            <icosahedronGeometry args={[0.12, 1]} />
          </mesh>
          <mesh position={[s * 0.42, 0.65, 0.1]} rotation-z={s * 0.6} material={fur}>
            <capsuleGeometry args={[0.1, 0.25, 3, 6]} />
          </mesh>
          <mesh position={[s * 0.25, 0.12, 0.25]} material={fur}>
            <icosahedronGeometry args={[0.15, 1]} />
          </mesh>
          <mesh position={[s * 0.11, 1.22, 0.3]} material={std('#1a1633')}>
            <sphereGeometry args={[0.035, 6, 6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.08, 0.31]} scale={[1.2, 0.9, 0.8]} material={light}>
        <icosahedronGeometry args={[0.11, 1]} />
      </mesh>
      <mesh position={[0, 1.12, 0.4]} material={std('#1a1633')}>
        <sphereGeometry args={[0.035, 6, 6]} />
      </mesh>
      <mesh position={[0, 0.82, 0.38]} rotation-x={-0.2} geometry={heartGeometry()} material={std(palette.pink)} scale={0.12} />
    </group>
  )
}

/* ===================================================================== */
/*  Planetinha particular (protocolo "espaço")                           */
/* ===================================================================== */
export function PrivatePlanet({ present }: { present: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const [show, setShow] = useState(present)
  const k = useRef(present ? 1 : 0)
  useEffect(
    () =>
      on('coffee:space', () => {
        setShow(true)
        k.current = 0
        gsap.to(k, { current: 1, duration: 2.5, ease: 'power2.inOut' })
      }),
    [],
  )
  useFrame(({ clock }) => {
    if (!show) return
    const t = clock.elapsedTime * 0.25
    const orbit = new THREE.Vector3(Math.cos(t) * 4.2, 3.0 + Math.sin(t * 2) * 0.2, Math.sin(t) * 2.2 - 1)
    const start = new THREE.Vector3(0.1, 1.6, 1.6)
    g.current.position.lerpVectors(start, orbit, k.current)
  })
  if (!show) return null
  return (
    <group ref={g}>
      <Planet color={palette.lavender} ring ringColor={palette.pink} size={0.24} />
    </group>
  )
}

/* ===================================================================== */
/*  Estação vista de fora (abertura)                                     */
/* ===================================================================== */
export function StationExterior() {
  const g = useRef<THREE.Group>(null!)
  useFrame((_, dt) => void (g.current.rotation.y += dt * 0.08))
  return (
    <group>
      <group ref={g}>
        <mesh rotation-x={Math.PI / 2} material={std('#d9d3ff', { rough: 0.5 })}>
          <torusGeometry args={[2.4, 0.28, 8, 28]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation-y={(i * Math.PI) / 2} position-y={0} material={std('#8f84e0')}>
            <boxGeometry args={[4.6, 0.08, 0.12]} />
          </mesh>
        ))}
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4]} material={glow(i % 3 ? palette.gold : palette.pink)}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
            </mesh>
          )
        })}
      </group>
      <mesh material={std(palette.shell, { rough: 0.4 })}>
        <icosahedronGeometry args={[0.9, 1]} />
      </mesh>
      <mesh position-z={0.75} material={glow('#ffd6ea')}>
        <circleGeometry args={[0.3, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.9, 0.6, 0]} rotation-z={0.1 * s} material={std('#3b5bdb', { rough: 0.3, metal: 0.4 })}>
          <boxGeometry args={[1.6, 0.04, 0.7]} />
        </mesh>
      ))}
      <Planet position={[7, -3, -14]} color={palette.violet} ring ringColor={palette.pink} size={4} spin={0.02} />
      <Floaty>
        <Planet position={[-6, 3, -8]} color={palette.coral} size={0.9} spin={0.1} />
      </Floaty>
    </group>
  )
}
