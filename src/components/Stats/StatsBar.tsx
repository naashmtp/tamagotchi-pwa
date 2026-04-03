import './StatsBar.css'

interface Props {
  label: string
  value: number | null
}

export function StatsBar({ label, value }: Props) {
  if (value === null) return null
  return (
    <div className="stats-bar">
      <span className="stats-bar-label">{label}</span>
      <div className="stats-bar-track">
        <div
          className={`stats-bar-fill${value < 25 ? ' low' : ''}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
