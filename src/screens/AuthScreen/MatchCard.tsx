/**
 * MatchCard — broadcast-style match preview/live card.
 *
 * Layout inspired by FIFA's official scoreboard:
 *   ┌─────[ CITY ]─────┐
 *   │  🇩🇪  GER 7 🏆 1 BRA  🇧🇷  │
 *   │      93:47 [+4]      │
 *   └──────────────────────┘
 *
 * Pre-match: no score, no clock — shows date + time chip + watch link icon.
 * Live:      pulsing red dot + live score + minute + stoppage chip.
 * Done:      final score + "FT" badge.
 */
interface MatchCardProps {
  homeIso: string
  homeName: string
  homeShort?: string
  awayIso: string
  awayName: string
  awayShort?: string
  status: 'live' | 'soon' | 'done'
  homeGoals?: number
  awayGoals?: number
  minute?: number
  stoppage?: number
  dateStr: string
  timeStr: string
  city?: string
}

function FlagImg({ iso, name }: { iso: string; name: string }) {
  return (
    <img
      className="mc-flag-img"
      src={`https://flagcdn.com/96x72/${iso}.png`}
      srcSet={`https://flagcdn.com/192x144/${iso}.png 2x`}
      width={96}
      height={72}
      alt={name}
      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
    />
  )
}

function inferShort(name: string): string {
  return name
    .replace(/[^A-Za-zÀ-ÿ]/g, '')
    .slice(0, 3)
    .toUpperCase()
}

export function MatchCard({
  homeIso, homeName, homeShort,
  awayIso, awayName, awayShort,
  status, homeGoals, awayGoals, minute, stoppage,
  dateStr, timeStr, city,
}: MatchCardProps) {
  const isLive = status === 'live'
  const isDone = status === 'done'
  const isSoon = status === 'soon'

  const homeCode = homeShort ?? inferShort(homeName)
  const awayCode = awayShort ?? inferShort(awayName)

  return (
    <article className={`mc${isLive ? ' mc--live' : ''}${isDone ? ' mc--done' : ''}`}>

      {/* Top ribbon — city OR date/time */}
      {city && (
        <div className="mc-ribbon">
          <span className="mc-ribbon__txt">{city}</span>
        </div>
      )}

      {/* Main row */}
      <div className="mc-row">
        <FlagImg iso={homeIso} name={homeName} />
        <span className="mc-code mc-code--home">{homeCode}</span>

        {/* Score plaque always shows numeric goals. Defaults to 0 × 0 for
            upcoming matches so the layout is identical pre/live/post-match.
            Live updates flow from subscribeResults() in AuthScreen. */}
        <div className={`mc-score${isSoon ? ' mc-score--pending' : ''}`}>
          <span className="mc-score__num">{homeGoals ?? 0}</span>
          <span className="mc-score__divider" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M7 2v6c0 2.21 1.79 4 4 4h2c2.21 0 4-1.79 4-4V2H7zm12 0v3a3 3 0 0 1-3 3V5h3zM5 5v3a3 3 0 0 1-3-3V2h3v3zM10 14h4v2l-1 4h-2l-1-4v-2z"/>
            </svg>
          </span>
          <span className="mc-score__num">{awayGoals ?? 0}</span>
        </div>

        <span className="mc-code mc-code--away">{awayCode}</span>
        <FlagImg iso={awayIso} name={awayName} />
      </div>

      {/* Bottom row — clock + watch button */}
      <div className="mc-foot">
        {isLive && (
          <div className="mc-clock">
            <span className="mc-clock__time">{String(minute ?? 0).padStart(2, '0')}:00</span>
            {stoppage !== undefined && stoppage > 0 && (
              <span className="mc-clock__chip">+{stoppage}</span>
            )}
            <span className="mc-live-pill"><span className="mc-live-pill__dot" />AO VIVO</span>
          </div>
        )}
        {isDone && (
          <div className="mc-clock">
            <span className="mc-clock__final">ENCERRADO · {dateStr}</span>
          </div>
        )}
        {isSoon && (
          <div className="mc-clock mc-clock--soon">
            <span className="mc-clock__soon">⏱ {dateStr} · {timeStr}</span>
          </div>
        )}

        <a
          className="mc-watch"
          href="https://www.youtube.com/@CazéTV"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isLive ? 'Assistir ao vivo' : isDone ? 'Ver replay' : 'Transmissão na CazéTV'}
          title={isLive ? 'Assistir ao vivo' : isDone ? 'Ver replay' : 'Transmissão CazéTV'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
          </svg>
        </a>
      </div>
    </article>
  )
}
