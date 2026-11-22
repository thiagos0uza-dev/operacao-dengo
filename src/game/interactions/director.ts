import type { Line, Mood } from '../../content/config'
import { loadingPhrases } from '../../content/config'
import { useGame, type Choice, type Phase, type Prop, type RobotAnim } from '../state/store'
import { sfx } from '../../audio/sound'

/* --------------------------------------------------------------------------
 *  Barramento de eventos: os roteiros (DOM) avisam, o 3D reage.
 *  Assim a lógica funciona igual com ou sem WebGL.
 * ------------------------------------------------------------------------*/
type Handler = (payload?: unknown) => void
const handlers = new Map<string, Set<Handler>>()

export function on(evt: string, fn: Handler) {
  if (!handlers.has(evt)) handlers.set(evt, new Set())
  handlers.get(evt)!.add(fn)
  return () => void handlers.get(evt)?.delete(fn)
}
export function emit(evt: string, payload?: unknown) {
  handlers.get(evt)?.forEach((fn) => fn(payload))
}

/* --------------------------------------------------------------------------
 *  Tempo e cancelamento
 * ------------------------------------------------------------------------*/
const G = () => useGame.getState()

export class Cancelled extends Error {}

/** Captura a "execução" atual. Se a fase mudar, o roteiro para sozinho. */
export function scope() {
  const id = G().runId
  const alive = () => G().runId === id
  const guard = () => {
    if (!alive()) throw new Cancelled()
  }
  return { alive, guard }
}

export const reduced = () => G().settings.reducedMotion

export function wait(ms: number) {
  const id = G().runId
  return new Promise<void>((resolve, reject) =>
    setTimeout(() => (G().runId === id ? resolve() : reject(new Cancelled())), ms),
  )
}

/** Roda um roteiro assíncrono marcando a cena como ocupada. */
export async function run(fn: () => Promise<void>, { lock = true, enter = false } = {}) {
  if (lock && G().busy && !enter) return
  if (lock) useGame.setState({ busy: true })
  const id = G().runId
  try {
    await fn()
  } catch (e) {
    if (!(e instanceof Cancelled)) console.error(e)
  } finally {
    if (lock && G().runId === id) useGame.setState({ busy: false })
  }
}

/* --------------------------------------------------------------------------
 *  Diálogo
 * ------------------------------------------------------------------------*/
let dialogResolve: ((v: string) => void) | null = null
let dialogRun = -1

function openDialog(lines: Line[], choices?: Choice[]) {
  const id = G().runId
  return new Promise<string>((resolve, reject) => {
    dialogResolve?.('')
    dialogResolve = (v) => (G().runId === id ? resolve(v) : reject(new Cancelled()))
    dialogRun = id
    useGame.setState({ dialog: { lines, index: 0, choices } })
    if (lines[0]?.mood) G().setRobot({ mood: lines[0].mood })
  })
}

/** O robô fala. Resolve quando a pessoa termina de ler. */
export async function say(lines: Line[] | string, mood?: Mood) {
  const arr: Line[] = typeof lines === 'string' ? [{ text: lines, mood }] : lines
  if (!arr.length) return
  await openDialog(arr)
}

/** O robô pergunta. Resolve com o id da opção escolhida. */
export function ask(question: string, choices: Choice[], mood: Mood = 'focused') {
  return openDialog([{ text: question, mood }], choices)
}

/** Avança o diálogo (chamado pela caixa de diálogo). */
export function advanceDialog(choiceId?: string) {
  const d = G().dialog
  if (!d) return
  const last = d.index >= d.lines.length - 1
  if (!last) {
    const next = d.index + 1
    useGame.setState({ dialog: { ...d, index: next } })
    const m = d.lines[next].mood
    if (m) G().setRobot({ mood: m })
    return
  }
  if (d.choices && !choiceId) return
  useGame.setState({ dialog: null })
  const r = dialogResolve
  dialogResolve = null
  if (G().runId === dialogRun) r?.(choiceId ?? '')
}

/* --------------------------------------------------------------------------
 *  Robô
 * ------------------------------------------------------------------------*/
export const robot = {
  mood: (mood: Mood) => G().setRobot({ mood }),
  anim: (anim: RobotAnim) => G().setRobot({ anim }),
  set: (anim: RobotAnim, mood?: Mood) => G().setRobot(mood ? { anim, mood } : { anim }),
  props: (...p: Prop[]) => G().addProp(...p),
  drop: (...p: Prop[]) => G().removeProp(...p),
  clearProps: () => G().setRobot({ props: [] }),
  sign: (text: string) => {
    G().setRobot({ sign: text })
    G().addProp('sign')
  },
  quip: (text: string) => G().setRobot({ quip: text, quipId: G().robot.quipId + 1 }),
}

/* --------------------------------------------------------------------------
 *  Transições entre fases
 * ------------------------------------------------------------------------*/
let lastPhrase = -1
export function randomPhrase() {
  let i = Math.floor(Math.random() * loadingPhrases.length)
  if (i === lastPhrase) i = (i + 1) % loadingPhrases.length
  lastPhrase = i
  return loadingPhrases[i]
}

let going = false
export async function goTo(phase: Phase, { curtain = true }: { curtain?: boolean } = {}) {
  if (going) return
  going = true
  try {
    if (curtain) {
      useGame.setState({ curtain: randomPhrase() })
      sfx('whoosh')
      await new Promise((r) => setTimeout(r, 650))
    }
    G().setPhase(phase)
    if (curtain) {
      await new Promise((r) => setTimeout(r, reduced() ? 500 : 1300))
      useGame.setState({ curtain: null })
    }
  } finally {
    going = false
  }
}

/** Espera um evento do barramento (ex.: a pessoa tocar em "continuar"). */
export function until(evt: string) {
  const id = G().runId
  return new Promise<unknown>((resolve, reject) => {
    const off = on(evt, (p) => {
      off()
      if (G().runId === id) resolve(p)
      else reject(new Cancelled())
    })
  })
}

/** Move o robô na cena (a cena anima; o roteiro só espera). */
export function moveRobot(pos: [number, number, number], rotY: number, dur = 1) {
  emit('robot:to', { pos, rotY, dur: reduced() ? Math.min(dur, 0.3) : dur })
  return wait((reduced() ? Math.min(dur, 0.3) : dur) * 1000)
}

/** Próximo capítulo ainda não concluído. */
export function nextChapter(flags: Record<string, boolean>): Phase {
  if (!flags['op.done']) return 'operations'
  if (!flags['sim.done']) return 'simulator'
  if (!flags['free.done']) return 'freedom'
  return 'operations' // a Central dispara o teaser da missão final
}

export function registerItem(name: string) {
  G().toast(`Item registrado no inventário: ${name}`, 'item')
  sfx('sparkle')
}

/** Espera a cena 3D (carregada sob demanda) estar montada. */
export async function waitScene(phase: string) {
  const t0 = performance.now()
  while (G().webgl && G().sceneReady !== phase && performance.now() - t0 < 10000) {
    await new Promise((r) => setTimeout(r, 50))
  }
}
