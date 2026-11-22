import { Howl, Howler } from 'howler'
import { SFX, encodeWav, ambientTrack, finaleTrack, secretTrack, type SfxName } from './synth'

/* Gerenciador de áudio. Nada toca antes de a pessoa escolher ligar o som. */

const cache = new Map<string, Howl>()
let enabled = false
let musicName: MusicName | null = null
let current: Howl | null = null

export type MusicName = 'ambient' | 'finale' | 'secret'
const MUSIC: Record<MusicName, () => Float32Array> = { ambient: ambientTrack, finale: finaleTrack, secret: secretTrack }
const MUSIC_VOL: Record<MusicName, number> = { ambient: 0.35, finale: 0.6, secret: 0.5 }

function urlOf(samples: Float32Array) {
  return URL.createObjectURL(new Blob([encodeWav(samples)], { type: 'audio/wav' }))
}

function getSfx(name: SfxName) {
  let h = cache.get(name)
  if (!h) {
    h = new Howl({ src: [urlOf(SFX[name]())], format: ['wav'], volume: 0.5 })
    cache.set(name, h)
  }
  return h
}

function getMusic(name: MusicName) {
  const key = 'm:' + name
  let h = cache.get(key)
  if (!h) {
    h = new Howl({ src: [urlOf(MUSIC[name]())], format: ['wav'], loop: true, volume: 0 })
    cache.set(key, h)
  }
  return h
}

const throttle = new Map<string, number>()

export function sfx(name: SfxName, opts: { rate?: number; volume?: number } = {}) {
  if (!enabled) return
  const now = performance.now()
  if ((throttle.get(name) ?? 0) > now) return
  throttle.set(name, now + 35)
  try {
    const h = getSfx(name)
    const id = h.play()
    if (opts.rate) h.rate(opts.rate, id)
    if (opts.volume !== undefined) h.volume(opts.volume, id)
  } catch {
    /* som é opcional */
  }
}

export function music(name: MusicName | null) {
  musicName = name
  if (!enabled) return
  const next = name ? getMusic(name) : null
  if (next === current) return
  const prev = current
  if (prev) {
    prev.fade(prev.volume(), 0, 900)
    setTimeout(() => prev !== current && prev.pause(), 950)
  }
  current = next
  if (next && name) {
    if (!next.playing()) next.play()
    next.fade(next.volume(), MUSIC_VOL[name], 1500)
  }
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  Howler.mute(!on)
  if (on) {
    // pré-aquece os sons mais usados fora do caminho crítico
    setTimeout(() => (['blip', 'click', 'open', 'pop', 'whoosh'] as SfxName[]).forEach(getSfx), 0)
    const m = musicName
    current = null
    music(m)
  } else {
    current?.pause()
    current = null
  }
}

export function setVolume(v: number) {
  Howler.volume(v)
}

export const isSoundEnabled = () => enabled
