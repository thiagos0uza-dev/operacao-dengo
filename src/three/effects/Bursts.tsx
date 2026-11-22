import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { on } from '../../game/interactions/director'
import { useGame } from '../../game/state/store'
import { heartGeometry } from '../materials'
import { palette } from '../../content/config'

/* Sistema de partículas instanciado (1 draw call por tipo).
 * Eventos: 'confetti' | 'sparks' | 'hearts' com { pos, n }. */

type Kind = 'confetti' | 'sparks' | 'hearts'
type P = { pos: [number, number, number]; n?: number; spread?: number }

const COLORS = [palette.pink, palette.violet, palette.cyan, palette.gold, palette.lavender, palette.coral]

function Burst({ kind, max }: { kind: Kind; max: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const data = useMemo(
    () => ({
      p: new Float32Array(max * 3),
      v: new Float32Array(max * 3),
      r: new Float32Array(max * 3),
      life: new Float32Array(max),
      next: 0,
      active: 0,
    }),
    [max],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geo = useMemo(() => {
    if (kind === 'confetti') return new THREE.PlaneGeometry(0.09, 0.16)
    if (kind === 'sparks') return new THREE.OctahedronGeometry(0.05, 0)
    return heartGeometry()
  }, [kind])
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: kind === 'sparks',
        blending: kind === 'sparks' ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: kind !== 'sparks',
      }),
    [kind],
  )

  useEffect(() => {
    const m = mesh.current
    const c = new THREE.Color()
    for (let i = 0; i < max; i++) {
      m.setColorAt(i, c.set(kind === 'hearts' ? (i % 3 ? palette.pink : palette.lavender) : COLORS[i % COLORS.length]))
      dummy.position.set(0, -999, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    return on(kind, (payload) => {
      const { pos, n = 80, spread = 1 } = payload as P
      const reduced = useGame.getState().settings.reducedMotion
      const count = Math.floor(n * (reduced ? 0.35 : 1))
      for (let k = 0; k < count; k++) {
        const i = data.next
        data.next = (data.next + 1) % max
        data.p.set([pos[0] + (Math.random() - 0.5) * 0.2 * spread, pos[1], pos[2] + (Math.random() - 0.5) * 0.2 * spread], i * 3)
        const a = Math.random() * Math.PI * 2
        if (kind === 'confetti') {
          const s = 2 + Math.random() * 3
          data.v.set([Math.cos(a) * s * 0.6 * spread, 3 + Math.random() * 4, Math.sin(a) * s * 0.6 * spread], i * 3)
        } else if (kind === 'sparks') {
          const u = Math.random() * 2 - 1
          const s = (2.5 + Math.random() * 2) * spread
          const r = Math.sqrt(1 - u * u)
          data.v.set([r * Math.cos(a) * s, u * s, r * Math.sin(a) * s], i * 3)
        } else {
          data.p.set([pos[0] + (Math.random() - 0.5) * 8 * spread, pos[1] + Math.random() * 4, pos[2] + (Math.random() - 0.5) * 4 * spread], i * 3)
          data.v.set([(Math.random() - 0.5) * 0.4, -0.6 - Math.random() * 0.8, 0], i * 3)
        }
        data.r.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3)
        data.life[i] = kind === 'sparks' ? 1.4 : kind === 'hearts' ? 7 : 4
      }
      data.active = max
    })
  }, [kind, max, data, dummy])

  useFrame((_, rawDt) => {
    if (!data.active) return
    const dt = Math.min(rawDt, 0.05)
    const m = mesh.current
    let alive = 0
    for (let i = 0; i < max; i++) {
      if (data.life[i] <= 0) continue
      data.life[i] -= dt
      const j = i * 3
      if (data.life[i] <= 0) {
        dummy.position.set(0, -999, 0)
        dummy.scale.setScalar(0)
      } else {
        alive++
        if (kind === 'confetti') {
          data.v[j + 1] -= 6 * dt
          data.v[j] *= 0.985
          data.v[j + 2] *= 0.985
          if (data.v[j + 1] < -1.6) data.v[j + 1] = -1.6 // "flutua" como papel
        } else if (kind === 'sparks') {
          data.v[j + 1] -= 2.2 * dt
          data.v[j] *= 0.97
          data.v[j + 1] *= 0.97
          data.v[j + 2] *= 0.97
        }
        data.p[j] += data.v[j] * dt
        data.p[j + 1] += data.v[j + 1] * dt
        data.p[j + 2] += data.v[j + 2] * dt
        data.r[j] += dt * 4
        data.r[j + 1] += dt * 3
        dummy.position.set(data.p[j], data.p[j + 1], data.p[j + 2])
        if (kind === 'hearts') dummy.rotation.set(0, Math.sin(data.r[j]) * 0.6, Math.sin(data.r[j + 1]) * 0.3)
        else dummy.rotation.set(data.r[j], data.r[j + 1], data.r[j + 2])
        const fade = kind === 'sparks' ? Math.min(1, data.life[i] / 0.6) : Math.min(1, data.life[i] / 0.5)
        dummy.scale.setScalar((kind === 'hearts' ? 0.16 : 1) * fade)
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    if (!alive) data.active = 0
  })

  return <instancedMesh ref={mesh} args={[geo, mat, max]} frustumCulled={false} />
}

export function Bursts() {
  return (
    <>
      <Burst kind="confetti" max={260} />
      <Burst kind="sparks" max={260} />
      <Burst kind="hearts" max={90} />
    </>
  )
}
