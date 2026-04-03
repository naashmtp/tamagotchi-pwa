import type { PetAction } from '../../store/petStore'
import './ActionButtons.css'

interface Props {
  isAsleep: boolean
  onAction: (action: PetAction) => void
}

const ACTIONS: { action: PetAction; label: string }[] = [
  { action: 'feed', label: 'Feed' },
  { action: 'drink', label: 'Drink' },
  { action: 'play', label: 'Play' },
  { action: 'hug', label: 'Hug' },
]

export function ActionButtons({ isAsleep, onAction }: Props) {
  return (
    <div className="action-buttons">
      {ACTIONS.map(({ action, label }) => (
        <button
          key={action}
          className="action-btn"
          disabled={isAsleep}
          onClick={() => onAction(action)}
        >
          {label}
        </button>
      ))}
      {isAsleep ? (
        <button className="action-btn action-btn-sleep" onClick={() => onAction('wake')}>
          Wake
        </button>
      ) : (
        <button className="action-btn action-btn-sleep" onClick={() => onAction('sleep')}>
          Sleep
        </button>
      )}
    </div>
  )
}
