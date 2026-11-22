import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ItemId, Line, Mood } from '../../content/config'
import { audioPrefs } from '../../content/config'

export type Phase =
  | 'boot'
  | 'intro'
  | 'operations'
  | 'secret'
  | 'simulator'
  | 'freedom'
  | 'finale'
  | 'yes'
  | 'no'

export type RobotAnim =
  | 'idle'
  | 'type'
  | 'panic'
  | 'wave'
  | 'dance'
  | 'bow'
  | 'run'
  | 'fall'
  | 'spin'
  | 'carry'
  | 'nervous'
  | 'sit'
  | 'hold'
  | 'thumbs'
  | 'stamp'
  | 'fly'
  | 'look'

export type Prop =
  | 'detective'
  | 'magnifier'
  | 'phone'
  | 'helmet'
  | 'chocolates'
  | 'firstaid'
  | 'stamp'
  | 'book'
  | 'partyhat'
  | 'bowler'
  | 'bowlerHand'
  | 'sweat'
  | 'stars'
  | 'sign'
  | 'planet'

export type Quality = 'auto' | 'low' | 'high'
export type Panel = null | 'settings' | 'map' | 'inventory' | 'diagnosis'

export type Choice = { id: string; label: string }
export type DialogState = {
  lines: Line[]
  index: number
  choices?: Choice[]
}

export type Settings = {
  sound: boolean
  volume: number
  reducedMotion: boolean
  quality: Quality
  dengo: number
  chaos: number
  jokes: number
  speed: number
  clueless: boolean
}

export type Toast = { id: number; text: string; kind: 'alert' | 'success' | 'info' | 'item' }

type State = {
  phase: Phase
  resumePhase: Phase | null
  runId: number
  curtain: string | null
  flags: Record<string, boolean>
  answer: null | 'yes' | 'no'
  settings: Settings
  robotClicks: number
  robot: { mood: Mood; anim: RobotAnim; props: Prop[]; sign: string; quip: string | null; quipId: number }
  dialog: DialogState | null
  toasts: Toast[]
  panel: Panel
  busy: boolean
  chaos: boolean
  alarm: boolean
  webgl: boolean
  sceneReady: string
  isTouch: boolean
  /* ações */
  setPhase: (p: Phase) => void
  flag: (k: string, v?: boolean) => void
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void
  setRobot: (r: Partial<State['robot']>) => void
  addProp: (...p: Prop[]) => void
  removeProp: (...p: Prop[]) => void
  setPanel: (p: Panel) => void
  toast: (text: string, kind?: Toast['kind']) => void
  dismissToast: (id: number) => void
  reset: () => void
}

const prefersReduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export const defaultSettings = (): Settings => ({
  sound: false,
  volume: audioPrefs.defaultVolume,
  reducedMotion: typeof window !== 'undefined' ? prefersReduced() : false,
  quality: 'auto',
  dengo: 70,
  chaos: 15,
  jokes: 2,
  speed: 1,
  clueless: false,
})

let toastSeq = 1

export const useGame = create<State>()(
  persist(
    (set, get) => ({
      phase: 'boot',
      resumePhase: null,
      runId: 0,
      curtain: null,
      flags: {},
      answer: null,
      settings: defaultSettings(),
      robotClicks: 0,
      robot: { mood: 'idle', anim: 'idle', props: [], sign: '', quip: null, quipId: 0 },
      dialog: null,
      toasts: [],
      panel: null,
      busy: false,
      chaos: false,
      alarm: false,
      webgl: true,
      sceneReady: '',
      isTouch: false,

      setPhase: (phase) =>
        set((s) => ({
          phase,
          runId: s.runId + 1,
          dialog: null,
          busy: true, // o roteiro de entrada da fase assume e libera
          chaos: false,
          alarm: false,
          panel: null,
          robot: { ...s.robot, mood: 'idle', anim: 'idle', props: [], sign: '', quip: null },
          resumePhase: phase === 'boot' || phase === 'intro' ? s.resumePhase : phase,
        })),
      flag: (k, v = true) => set((s) => ({ flags: { ...s.flags, [k]: v } })),
      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      setRobot: (r) => set((s) => ({ robot: { ...s.robot, ...r } })),
      addProp: (...p) => set((s) => ({ robot: { ...s.robot, props: [...new Set([...s.robot.props, ...p])] } })),
      removeProp: (...p) => set((s) => ({ robot: { ...s.robot, props: s.robot.props.filter((x) => !p.includes(x)) } })),
      setPanel: (panel) => set({ panel }),
      toast: (text, kind = 'info') => {
        const id = toastSeq++
        set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }))
        setTimeout(() => get().dismissToast(id), kind === 'alert' ? 2600 : 3800)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      reset: () =>
        set((s) => ({
          phase: 'boot',
          resumePhase: null,
          runId: s.runId + 1,
          flags: {},
          answer: null,
          robotClicks: 0,
          dialog: null,
          panel: null,
          busy: false,
          chaos: false,
          alarm: false,
          settings: { ...defaultSettings(), sound: s.settings.sound, volume: s.settings.volume },
        })),
    }),
    {
      name: 'operacao-dengo-v1',
      storage: createJSONStorage(() => {
        try {
          const t = '__t'
          localStorage.setItem(t, t)
          localStorage.removeItem(t)
          return localStorage
        } catch {
          const mem = new Map<string, string>()
          return {
            getItem: (k: string) => mem.get(k) ?? null,
            setItem: (k: string, v: string) => void mem.set(k, v),
            removeItem: (k: string) => void mem.delete(k),
          }
        }
      }),
      partialize: (s) => ({
        resumePhase: s.resumePhase,
        flags: s.flags,
        answer: s.answer,
        settings: { ...s.settings, sound: false },
        robotClicks: s.robotClicks,
      }),
    },
  ),
)

/* --------------------------------------------------------------------------
 *  Progresso
 * ------------------------------------------------------------------------*/
export const PROGRESS_WEIGHTS: Record<string, number> = {
  'intro.done': 6,
  'op.computer': 6,
  'op.coffee': 6,
  'op.button': 6,
  'op.box': 6,
  'op.done': 6,
  'sim.s1': 8,
  'sim.s3': 8,
  'sim.s4': 8,
  'free.done': 18,
  'finale.done': 22,
}

export function progressOf(flags: Record<string, boolean>): number {
  let p = 0
  for (const [k, w] of Object.entries(PROGRESS_WEIGHTS)) if (flags[k]) p += w
  return Math.min(100, p)
}

export const opInvestigations = (flags: Record<string, boolean>) =>
  ['op.computer', 'op.coffee', 'op.button', 'op.box'].filter((k) => flags[k]).length

export const allItems: ItemId[] = ['milkmoo', 'dengo', 'pass', 'memes', 'hug', 'quiet', 'premium', 'ram', 'battery']

/** Fase em que a pessoa retoma a experiência depois do boot. */
export function resumeTarget(s: { answer: State['answer']; resumePhase: Phase | null; flags: Record<string, boolean> }): Phase {
  if (s.answer) return s.answer
  if (!s.flags['intro.done']) return 'intro'
  const p = s.resumePhase
  if (!p || p === 'boot' || p === 'intro' || p === 'secret' || p === 'yes' || p === 'no') return 'operations'
  return p
}
