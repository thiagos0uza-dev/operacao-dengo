import { create } from 'zustand'
import { useGame } from './store'

/* Estado efêmero dos overlays de cada cena (painéis, cartões, banners).
 * É limpo automaticamente a cada troca de fase. */
type UI = { v: Record<string, unknown>; set: (k: string, val: unknown) => void; clear: () => void }

export const useUI = create<UI>()((set) => ({
  v: {},
  set: (k, val) => set((s) => ({ v: { ...s.v, [k]: val } })),
  clear: () => set({ v: {} }),
}))

export const ui = {
  set: (k: string, val: unknown) => useUI.getState().set(k, val),
  get: <T,>(k: string) => useUI.getState().v[k] as T | undefined,
}

export function useUIValue<T>(k: string): T | undefined {
  return useUI((s) => s.v[k] as T | undefined)
}

let lastRun = -1
useGame.subscribe((s) => {
  if (s.runId !== lastRun) {
    lastRun = s.runId
    useUI.getState().clear()
  }
})
