import * as THREE from 'three'

/* Materiais compartilhados: menos materiais = menos trocas de estado na GPU. */
const cache = new Map<string, THREE.Material>()

export function std(color: string, opts: { rough?: number; metal?: number; flat?: boolean; emissive?: string; ei?: number } = {}) {
  const { rough = 0.55, metal = 0.05, flat = true, emissive, ei = 1 } = opts
  const key = `s|${color}|${rough}|${metal}|${flat}|${emissive}|${ei}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
      flatShading: flat,
      emissive: emissive ?? '#000000',
      emissiveIntensity: emissive ? ei : 0,
    })
    cache.set(key, m)
  }
  return m as THREE.MeshStandardMaterial
}

export function glow(color: string, opacity = 1) {
  const key = `g|${color}|${opacity}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity })
    cache.set(key, m)
  }
  return m as THREE.MeshBasicMaterial
}

/** Forma de coração para extrusões. */
export function heartShape(s = 1) {
  const x = 0,
    y = 0
  const shape = new THREE.Shape()
  shape.moveTo(x, y + 0.25 * s)
  shape.bezierCurveTo(x, y + 0.3 * s, x - 0.05 * s, y + 0.45 * s, x - 0.25 * s, y + 0.45 * s)
  shape.bezierCurveTo(x - 0.55 * s, y + 0.45 * s, x - 0.55 * s, y + 0.1 * s, x - 0.55 * s, y + 0.1 * s)
  shape.bezierCurveTo(x - 0.55 * s, y - 0.1 * s, x - 0.35 * s, y - 0.32 * s, x, y - 0.5 * s)
  shape.bezierCurveTo(x + 0.35 * s, y - 0.32 * s, x + 0.55 * s, y - 0.1 * s, x + 0.55 * s, y + 0.1 * s)
  shape.bezierCurveTo(x + 0.55 * s, y + 0.1 * s, x + 0.55 * s, y + 0.45 * s, x + 0.25 * s, y + 0.45 * s)
  shape.bezierCurveTo(x + 0.1 * s, y + 0.45 * s, x, y + 0.3 * s, x, y + 0.25 * s)
  return shape
}

let heartGeo: THREE.ExtrudeGeometry | null = null
export function heartGeometry() {
  if (!heartGeo) {
    heartGeo = new THREE.ExtrudeGeometry(heartShape(1), { depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 8 })
    heartGeo.center()
  }
  return heartGeo
}
