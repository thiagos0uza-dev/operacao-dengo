import { useGame } from '../../game/state/store'

/** Sem WebGL, os objetos 3D viram botões. A história continua igual. */
export function FallbackActions({ actions }: { actions: { id: string; label: string; fn: () => void }[] }) {
  const webgl = useGame((s) => s.webgl)
  const busy = useGame((s) => s.busy || !!s.dialog)
  if (webgl || !actions.length) return null
  return (
    <div className="fallback-actions">
      {actions.map((a) => (
        <button key={a.id} className="btn ghost" disabled={busy} onClick={a.fn} data-hotspot={a.id}>
          {a.label}
        </button>
      ))}
    </div>
  )
}
