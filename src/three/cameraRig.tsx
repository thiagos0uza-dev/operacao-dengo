import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame } from '../game/state/store'

/* Câmera cinematográfica única. As cenas pedem "planos"; o rig cuida do resto:
 * enquadramento por orientação da tela, arrastar para olhar em volta e tremidas. */

type V3 = [number, number, number]
const rig = {
  pos: new THREE.Vector3(0, 2, 8),
  target: new THREE.Vector3(0, 1, 0),
  fov: 50,
  yaw: 0,
  yawLimit: 0,
  shakeK: 0,
  fit: true,
}

const yawTarget = { v: 0 }

export const cam = {
  /** Corta ou desliza para um plano. */
  shot(pos: V3, target: V3, dur = 1.6, ease = 'power2.inOut', fov?: number) {
    const reduced = useGame.getState().settings.reducedMotion
    const d = reduced ? Math.min(dur, 0.35) : dur
    gsap.killTweensOf(rig.pos)
    gsap.killTweensOf(rig.target)
    if (d <= 0) {
      rig.pos.set(...pos)
      rig.target.set(...target)
      if (fov) rig.fov = fov
      return Promise.resolve()
    }
    if (fov) gsap.to(rig, { fov, duration: d, ease })
    gsap.to(rig.target, { x: target[0], y: target[1], z: target[2], duration: d, ease })
    return new Promise<void>((r) => gsap.to(rig.pos, { x: pos[0], y: pos[1], z: pos[2], duration: d, ease, onComplete: r }))
  },
  cut(pos: V3, target: V3, fov?: number) {
    return cam.shot(pos, target, 0, 'none', fov)
  },
  shake(k = 0.2, dur = 0.6) {
    if (useGame.getState().settings.reducedMotion) return
    rig.shakeK = Math.max(rig.shakeK, k)
    gsap.to(rig, { shakeK: 0, duration: dur, ease: 'power2.out' })
  },
  /** Permite arrastar para olhar em volta (essencial em tela vertical). */
  look(limit: number) {
    rig.yawLimit = limit
    if (!limit) yawTarget.v = 0
  },
  fit(on: boolean) {
    rig.fit = on
  },
}

export function CameraRig() {
  const { camera, gl, size } = useThree()
  const drag = useRef<{ x: number; start: number } | null>(null)
  const tmp = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = gl.domElement
    const down = (e: PointerEvent) => {
      if (!rig.yawLimit) return
      drag.current = { x: e.clientX, start: yawTarget.v }
    }
    const move = (e: PointerEvent) => {
      if (!drag.current || !rig.yawLimit) return
      const dx = (e.clientX - drag.current.x) / Math.max(320, el.clientWidth)
      yawTarget.v = THREE.MathUtils.clamp(drag.current.start - dx * 2.2, -rig.yawLimit, rig.yawLimit)
    }
    const up = () => (drag.current = null)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl])

  useFrame((state, dt) => {
    const aspect = size.width / size.height
    // telas verticais: afasta a câmera para caber mais cena
    const fitK = rig.fit ? (aspect >= 1.2 ? 1 : aspect >= 0.8 ? 1.18 : 1.42) : 1
    rig.yaw = THREE.MathUtils.damp(rig.yaw, yawTarget.v, 6, dt)
    const off = tmp.current.copy(rig.pos).sub(rig.target).multiplyScalar(fitK)
    off.applyAxisAngle(THREE.Object3D.DEFAULT_UP, rig.yaw)
    camera.position.copy(rig.target).add(off)
    const chaos = useGame.getState().settings.chaos
    const wob = useGame.getState().settings.reducedMotion ? 0 : Math.max(0, chaos - 40) / 600
    const t = state.clock.elapsedTime
    const sk = rig.shakeK + wob
    if (sk > 0) camera.position.add(new THREE.Vector3(Math.sin(t * 47) * sk, Math.sin(t * 39) * sk * 0.7, Math.sin(t * 31) * sk * 0.5))
    camera.lookAt(rig.target)
    if (wob) camera.rotateZ(Math.sin(t * 1.3) * wob * 0.8)
    const pc = camera as THREE.PerspectiveCamera
    const fov = rig.fov + (aspect < 0.8 ? 6 : 0)
    if (Math.abs(pc.fov - fov) > 0.01) {
      pc.fov = fov
      pc.updateProjectionMatrix()
    }
  })
  return null
}
