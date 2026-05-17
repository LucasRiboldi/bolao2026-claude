interface MatchCardProps {
  homeFlag: string
  homeName: string
  awayFlag: string
  awayName: string
  status: 'live' | 'soon' | 'done'
  homeGoals?: number
  awayGoals?: number
  minute?: number
  dateStr: string
  timeStr: string
}

export function MatchCard({
  homeFlag, homeName, awayFlag, awayName,
  status, homeGoals, awayGoals, minute, dateStr, timeStr,
}: MatchCardProps) {
  const isLive = status === 'live'
  const isDone = status === 'done'

  return (
    <article className={`match-card${isDone ? ' match-card--done' : ''}`}
             style={isDone ? { opacity: .65 } : undefined}>
      <div className="match-card__grass" />
      <div className="match-card__circle" />
      <div className="match-card__inner">

        {/* Ribbon */}
        <div className="match-ribbon">
          {isLive && (
            <>
              <span className="match-live-label">
                <span className="match-live-dot" />
                AO VIVO
              </span>
              <span className="match-time-chip">{minute}'</span>
            </>
          )}
          {!isLive && (
            <div className="match-dt">
              {isDone && <span>✓ Encerrado · {dateStr}</span>}
              {!isDone && <span>{dateStr}</span>}
              <div className="match-dt__sep" />
              <span className="match-dt__hora">{timeStr}</span>
            </div>
          )}
        </div>

        {/* Teams + score */}
        <div className="match-row">
          <div className="match-team">
            <div className={`match-flag${isLive ? ' match-flag--live' : ''}`}>{homeFlag}</div>
            <div className="match-name">{homeName}</div>
          </div>

          <div className={`match-plaque${isLive ? ' match-plaque--live' : ''}`}>
            {isLive && (
              <span className="match-score match-score--live">
                {homeGoals} : {awayGoals}
              </span>
            )}
            {isDone && (
              <span className="match-score match-score--done">
                {homeGoals} : {awayGoals}
              </span>
            )}
            {status === 'soon' && (
              <span className="match-score match-score--soon">×</span>
            )}
            <span className="match-score-sub">
              {isLive ? 'placar' : isDone ? 'encerrado' : 'em breve'}
            </span>
          </div>

          <div className="match-team">
            <div className={`match-flag${isLive ? ' match-flag--live' : ''}`}>{awayFlag}</div>
            <div className="match-name">{awayName}</div>
          </div>
        </div>

        {/* Watch button */}
        <a
          className="match-watch"
          href="https://www.youtube.com/@CazéTV"
          target="_blank"
          rel="noopener noreferrer"
          style={isDone ? { opacity: .55 } : status === 'soon' ? { background: 'rgba(255,255,255,.04)', borderColor: 'rgba(255,255,255,.08)' } : undefined}
        >
          <div className="match-yt-icon"><div className="match-yt-play" /></div>
          <span className="match-watch-txt">
            {isLive ? 'Assistir ao vivo' : isDone ? 'Ver replay' : 'Vai transmitir'}
          </span>
          <span className="match-watch-sub">CazéTV</span>
        </a>
      </div>
    </article>
  )
}
