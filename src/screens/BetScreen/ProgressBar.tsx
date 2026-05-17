interface ProgressBarProps {
  filled: number
  total: number
}

export function ProgressBar({ filled, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100)
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>Apostas preenchidas</span>
        <strong>{filled} / {total}</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
