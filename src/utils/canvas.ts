import * as THREE from 'three'

export const FONT_DISPLAY = '"Bricolage Grotesque Variable", "Segoe UI", system-ui, sans-serif'
export const FONT_MONO = '"JetBrains Mono Variable", ui-monospace, Consolas, monospace'

/** Cria uma textura desenhada em canvas. Leve, local e sem fontes remotas. */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Quebra texto em linhas que cabem na largura. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}

export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  { x, y, w, h, max = 120, min = 18, weight = 800, font = FONT_DISPLAY, color = '#1a1633', lineHeight = 1.1 }: {
    x: number; y: number; w: number; h: number; max?: number; min?: number; weight?: number; font?: string; color?: string; lineHeight?: number
  },
) {
  let size = max
  let lines: string[] = []
  for (; size >= min; size -= 2) {
    ctx.font = `${weight} ${size}px ${font}`
    lines = wrap(ctx, text, w)
    if (lines.length * size * lineHeight <= h && lines.every((l) => ctx.measureText(l).width <= w)) break
  }
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const total = lines.length * size * lineHeight
  lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + (h - total) / 2 + size * lineHeight * (i + 0.5)))
}

/** Placa de papelão com texto (usada pelo robô e pelos cenários). */
export function signTexture(text: string, opts: { bg?: string; fg?: string; w?: number; h?: number; border?: string } = {}) {
  const { bg = '#fff6e8', fg = '#1a1633', w = 512, h = 320, border = '#e0c9a6' } = opts
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = border
    roundRect(ctx, 0, 0, w, h, 28)
    ctx.fill()
    ctx.fillStyle = bg
    roundRect(ctx, 12, 12, w - 24, h - 24, 20)
    ctx.fill()
    fitText(ctx, text, { x: 36, y: 30, w: w - 72, h: h - 60, color: fg, max: 84 })
  })
}

export function radialGlowTexture(color = '#ffffff') {
  return canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, color)
    g.addColorStop(0.25, color + 'aa')
    g.addColorStop(1, color + '00')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
}

let shadowTex: THREE.Texture | null = null
export function blobShadowTexture() {
  if (shadowTex) return shadowTex
  shadowTex = canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(5,3,20,0.55)')
    g.addColorStop(1, 'rgba(5,3,20,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
  return shadowTex
}
