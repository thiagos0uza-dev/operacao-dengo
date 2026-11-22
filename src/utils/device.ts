export function hasWebGL(): boolean {
  try {
    if (new URLSearchParams(location.search).has('nowebgl')) return false
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function isTouchDevice(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
  } catch {
    return false
  }
}

/** Heurística simples para começar com qualidade menor em aparelhos modestos. */
export function isLowEnd(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = navigator.hardwareConcurrency ?? 4
  return (nav.deviceMemory !== undefined && nav.deviceMemory <= 3) || cores <= 4
}

export function todayBR() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
