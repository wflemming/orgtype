import type { GameMode } from '../types/employee'

interface Props {
  mode: GameMode
  onChange: (mode: GameMode) => void
}

const modes: { value: GameMode; label: string; icon: string }[] = [
  { value: 'random', label: 'Random', icon: '🎲' },
  { value: 'top-down', label: 'Top → Down', icon: '⬇' },
  { value: 'bottom-up', label: 'Bottom → Up', icon: '⬆' },
]

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === m.value
              ? 'bg-sofi-purple text-white shadow-md'
              : 'bg-white text-sofi-dark hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  )
}
