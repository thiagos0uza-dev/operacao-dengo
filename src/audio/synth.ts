/* Síntese procedural: gera WAVs em memória. Nenhum arquivo de áudio externo. */

export const SR = 22050

export function encodeWav(samples: Float32Array, sampleRate = SR): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const v = new DataView(buf)
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  w(0, 'RIFF')
  v.setUint32(4, 36 + samples.length * 2, true)
  w(8, 'WAVE')
  w(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  w(36, 'data')
  v.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(44 + i * 2, s * 0x7fff, true)
  }
  return buf
}

const TAU = Math.PI * 2
const noteHz = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

/** Gerador determinístico, para a música soar igual em todo lugar. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

type Osc = 'sine' | 'square' | 'saw' | 'tri'
function osc(type: Osc, phase: number) {
  const p = phase % 1
  switch (type) {
    case 'sine':
      return Math.sin(p * TAU)
    case 'square':
      return p < 0.5 ? 1 : -1
    case 'saw':
      return p * 2 - 1
    case 'tri':
      return 1 - 4 * Math.abs(p - 0.5)
  }
}

function render(seconds: number, fn: (t: number, i: number) => number) {
  const n = Math.floor(seconds * SR)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i)
  return out
}

function normalize(a: Float32Array, peak = 0.85) {
  let m = 0
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]))
  if (m > 0) for (let i = 0; i < a.length; i++) a[i] = (a[i] / m) * peak
  return a
}

/** Tom com glissando e envelope exponencial. */
function tone(dur: number, f0: number, f1: number, type: Osc = 'sine', decay = 6, attack = 0.004) {
  let ph = 0
  return render(dur, (t) => {
    const f = f0 + (f1 - f0) * (t / dur)
    ph += f / SR
    const env = Math.min(1, t / attack) * Math.exp(-decay * t)
    return osc(type, ph) * env
  })
}

function noise(dur: number, decay: number, seed = 7, lp = 0.5) {
  const r = rng(seed)
  let y = 0
  return render(dur, (t) => {
    y += lp * (r() * 2 - 1 - y)
    return y * Math.exp(-decay * t)
  })
}

function mix(...parts: [Float32Array, number, number?][]) {
  const len = Math.max(...parts.map(([a, , off = 0]) => a.length + Math.floor(off * SR)))
  const out = new Float32Array(len)
  for (const [a, g, off = 0] of parts) {
    const o = Math.floor(off * SR)
    for (let i = 0; i < a.length; i++) out[i + o] += a[i] * g
  }
  return out
}

/* --------------------------------------------------------------------------
 *  Efeitos sonoros
 * ------------------------------------------------------------------------*/
export const SFX = {
  blip: () => tone(0.05, 900, 1150, 'tri', 40),
  click: () => tone(0.04, 1400, 1100, 'square', 70),
  open: () => mix([tone(0.09, 520, 640, 'tri', 25), 0.6], [tone(0.14, 780, 980, 'tri', 18), 0.6, 0.07]),
  close: () => mix([tone(0.09, 780, 640, 'tri', 25), 0.6], [tone(0.12, 520, 420, 'tri', 18), 0.6, 0.06]),
  boop: () => tone(0.16, 380, 620, 'sine', 14),
  pop: () => mix([noise(0.12, 30, 3, 0.9), 0.6], [tone(0.12, 700, 180, 'sine', 20), 0.8]),
  whoosh: () => {
    const r = rng(11)
    let y = 0
    return render(0.6, (t) => {
      const k = 0.05 + 0.5 * Math.sin((t / 0.6) * Math.PI)
      y += k * (r() * 2 - 1 - y)
      return y * Math.sin((t / 0.6) * Math.PI) * 0.8
    })
  },
  thud: () => mix([tone(0.3, 130, 45, 'sine', 12), 1], [noise(0.1, 40, 5, 0.3), 0.5]),
  clink: () => mix([tone(0.4, 2400, 2350, 'sine', 9), 0.5], [tone(0.35, 3300, 3280, 'sine', 12), 0.3, 0.02]),
  error: () => mix([tone(0.14, 200, 190, 'square', 4), 0.35], [tone(0.18, 160, 150, 'square', 4), 0.35, 0.17]),
  success: () =>
    mix(
      ...[72, 76, 79, 84].map((n, i) => [tone(0.5, noteHz(n), noteHz(n), 'tri', 5), 0.45, i * 0.08] as [Float32Array, number, number]),
    ),
  sparkle: () => {
    const r = rng(21)
    return mix(...Array.from({ length: 6 }, (_, i) => [tone(0.25, 1800 + r() * 1800, 2400 + r() * 1500, 'sine', 14), 0.25, i * 0.05] as [Float32Array, number, number]))
  },
  alarm: () => {
    let ph = 0
    return render(1.2, (t) => {
      const f = 620 + 300 * (0.5 - 0.5 * Math.cos((t / 0.6) * TAU))
      ph += f / SR
      return osc('saw', ph) * 0.35 * Math.min(1, t * 30) * Math.min(1, (1.2 - t) * 20)
    })
  },
  type: () => mix([noise(0.03, 120, 9, 0.8), 0.7], [tone(0.03, 2200, 1800, 'square', 120), 0.15]),
  shred: () => {
    const r = rng(33)
    let y = 0
    return render(0.7, (t) => {
      y += 0.6 * (r() * 2 - 1 - y)
      return y * (0.5 + 0.5 * Math.sign(Math.sin(t * 90))) * Math.exp(-2 * t)
    })
  },
  powerdown: () => tone(0.9, 700, 50, 'saw', 2.5),
  powerup: () => tone(0.6, 80, 900, 'tri', 1.5, 0.05),
  stamp: () => mix([tone(0.25, 90, 40, 'sine', 14), 1], [noise(0.08, 50, 13, 0.9), 0.8]),
  firework: () => {
    const r = rng(41)
    return mix([noise(0.25, 14, 41, 0.9), 0.8], ...Array.from({ length: 14 }, () => [noise(0.03, 90, Math.floor(r() * 999), 0.95), 0.4, 0.2 + r() * 0.8] as [Float32Array, number, number]))
  },
  squeak: () => tone(0.18, 900, 1600, 'sine', 10),
  heart: () => mix([tone(0.18, noteHz(76), noteHz(76), 'sine', 10), 0.5], [tone(0.4, noteHz(83), noteHz(83), 'sine', 6), 0.5, 0.12]),
  crash: () => mix([noise(0.5, 6, 51, 0.9), 0.8], [tone(0.4, 200, 60, 'square', 8), 0.3], [tone(0.3, 3000, 2800, 'sine', 12), 0.2, 0.05]),
}

export type SfxName = keyof typeof SFX

/* --------------------------------------------------------------------------
 *  Música
 * ------------------------------------------------------------------------*/

/** Piano suave: senóide com harmônicos que decaem mais rápido. */
function pianoNote(out: Float32Array, start: number, midi: number, dur: number, gain: number) {
  const f = noteHz(midi)
  const s0 = Math.floor(start * SR)
  const n = Math.floor(dur * SR)
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.01) * Math.exp(-2.2 * t)
    const v = Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) * Math.exp(-3 * t) + 0.12 * Math.sin(TAU * 3 * f * t) * Math.exp(-5 * t)
    out[s0 + i] += v * env * gain
  }
}

function padChord(out: Float32Array, start: number, notes: number[], dur: number, gain: number) {
  const s0 = Math.floor(start * SR)
  const n = Math.floor(dur * SR)
  for (let i = 0; i < n; i++) {
    const idx = (s0 + i) % out.length // dá a volta para o loop ficar contínuo
    const t = i / SR
    const env = Math.sin(Math.min(1, t / dur) * Math.PI) ** 1.5
    let v = 0
    for (const m of notes) {
      const f = noteHz(m)
      v += Math.sin(TAU * f * t) * 0.6 + osc('tri', f * 1.003 * t) * 0.25
    }
    out[idx] += (v / notes.length) * env * gain
  }
}

/** Ambiente da estação: acordes etéreos + sininhos esparsos. 24s em loop. */
export function ambientTrack() {
  const len = 24
  const out = new Float32Array(len * SR)
  const chords = [
    [53, 57, 60, 64],
    [52, 55, 59, 62],
    [50, 53, 57, 60],
    [48, 52, 55, 59],
  ]
  chords.forEach((c, i) => padChord(out, i * 6, c, 8, 0.32))
  const r = rng(5)
  const scale = [72, 74, 76, 79, 81, 84]
  for (let t = 0.5; t < len - 1; t += 1.5) {
    if (r() < 0.55) pianoNote(out, t + r() * 0.3, scale[Math.floor(r() * scale.length)], 2.5, 0.12)
  }
  return normalize(out, 0.55)
}

/** Final: progressão quente com melodia simples. 32s em loop. */
export function finaleTrack() {
  const len = 32
  const out = new Float32Array(len * SR)
  const chords = [
    [48, 55, 64, 67],
    [45, 52, 60, 64],
    [41, 53, 57, 60],
    [43, 55, 59, 62],
  ]
  chords.forEach((c, i) => {
    padChord(out, i * 8, c, 9, 0.22)
    for (let k = 0; k < 8; k++) pianoNote(out, i * 8 + k, c[(k % 3) + 1] - 12 + (k % 4 === 3 ? 12 : 0), 1.6, 0.1)
  })
  const melody: [number, number, number][] = [
    [0, 76, 1.5], [1.5, 79, 0.5], [2, 77, 1], [3, 76, 1], [4, 74, 2], [6, 72, 2],
    [8, 72, 1.5], [9.5, 76, 0.5], [10, 74, 1], [11, 72, 1], [12, 71, 3],
    [16, 69, 1.5], [17.5, 72, 0.5], [18, 77, 1], [19, 76, 1], [20, 74, 2], [22, 72, 2],
    [24, 71, 1.5], [25.5, 74, 0.5], [26, 79, 1.5], [27.5, 77, 0.5], [28, 76, 3.5],
  ]
  for (const [t, m, d] of melody) pianoNote(out, t, m, d + 1.5, 0.22)
  return normalize(out, 0.6)
}

/** Sala secreta: só uma caixinha de música lenta. 20s em loop. */
export function secretTrack() {
  const len = 20
  const out = new Float32Array(len * SR)
  const notes = [79, 76, 72, 76, 74, 71, 67, 71, 72, 76, 79, 84, 83, 79, 74, 71]
  notes.forEach((m, i) => pianoNote(out, i * 1.25, m, 2.4, 0.2))
  padChord(out, 0, [48, 55, 64], 10, 0.15)
  padChord(out, 10, [43, 55, 62], 10, 0.15)
  return normalize(out, 0.5)
}
