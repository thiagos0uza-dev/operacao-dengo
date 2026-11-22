import { describe, expect, it } from 'vitest'
import { progressOf, resumeTarget, opInvestigations, PROGRESS_WEIGHTS } from './state/store'
import { encodeWav, SFX } from '../audio/synth'

describe('progresso', () => {
  it('soma 100% quando tudo é concluído', () => {
    const all = Object.fromEntries(Object.keys(PROGRESS_WEIGHTS).map((k) => [k, true]))
    expect(progressOf(all)).toBe(100)
  })
  it('começa em 0', () => expect(progressOf({})).toBe(0))
  it('conta investigações da central', () => expect(opInvestigations({ 'op.box': true, 'op.coffee': true })).toBe(2))
})

describe('retomada', () => {
  it('quem já respondeu vê o próprio final', () => {
    expect(resumeTarget({ answer: 'yes', resumePhase: 'simulator', flags: {} })).toBe('yes')
    expect(resumeTarget({ answer: 'no', resumePhase: null, flags: {} })).toBe('no')
  })
  it('sem intro concluída começa pela intro', () => expect(resumeTarget({ answer: null, resumePhase: 'freedom', flags: {} })).toBe('intro'))
  it('retoma o capítulo salvo', () => expect(resumeTarget({ answer: null, resumePhase: 'freedom', flags: { 'intro.done': true } })).toBe('freedom'))
})

describe('áudio procedural', () => {
  it('gera WAV válido', () => {
    const buf = encodeWav(SFX.blip())
    const v = new DataView(buf)
    expect(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3))).toBe('RIFF')
    expect(buf.byteLength).toBeGreaterThan(44)
  })
  it('todos os efeitos renderizam sem NaN', () => {
    for (const [name, fn] of Object.entries(SFX)) {
      const s = fn()
      expect(s.length, name).toBeGreaterThan(0)
      expect(s.some((x) => Number.isNaN(x)), name).toBe(false)
    }
  })
})
