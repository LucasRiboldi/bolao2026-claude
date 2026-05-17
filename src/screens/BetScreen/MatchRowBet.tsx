import type { GroupGame, GroupBets } from '@/types'
import { TEAMS } from '@/data/teams'

interface MatchRowBetProps {
  game: GroupGame
  bets: GroupBets
  locked: boolean
  onChange: (gameId: string, home: string, away: string) => void
}

function Stepper({
  value,
  onDec,
  onInc,
  locked,
}: {
  value: string
  onDec: () => void
  onInc: () => void
  locked: boolean
}) {
  const n = value === '' ? null : parseInt(value, 10)
  const filled = n !== null
  return (
    <div className="stepper">
      <button
        className="stepper__btn"
        onClick={onDec}
        disabled={locked || n === null || n <= 0}
        aria-label="Diminuir"
      >−</button>
      <div className={`stepper__val${filled ? ' stepper__val--filled' : ''}${locked ? ' stepper__val--locked' : ''}`}>
        {filled ? n : '?'}
      </div>
      <button
        className="stepper__btn"
        onClick={onInc}
        disabled={locked}
        aria-label="Aumentar"
      >+</button>
    </div>
  )
}

export function MatchRowBet({ game, bets, locked, onChange }: MatchRowBetProps) {
  const bet = bets[game.id]
  const home = bet?.homeGoals ?? ''
  const away = bet?.awayGoals ?? ''

  const homeTeam = TEAMS[game.home]
  const awayTeam = TEAMS[game.away]

  function adjust(side: 'home' | 'away', delta: number) {
    const curr = side === 'home' ? home : away
    const other = side === 'home' ? away : home
    const n = curr === '' ? 0 : parseInt(curr, 10)
    const next = String(Math.max(0, n + delta))
    if (side === 'home') onChange(game.id, next, other)
    else onChange(game.id, other, next)
  }

  function init(side: 'home' | 'away') {
    if (home !== '' || away !== '') return
    if (side === 'home') onChange(game.id, '0', '')
    else onChange(game.id, '', '0')
  }

  return (
    <div className="match-row-bet">
      <div className="match-team-left">
        <span className="match-team-name">{homeTeam?.short ?? game.home}</span>
        <span className="match-team-flag">{homeTeam?.flag}</span>
      </div>

      <div className="match-score-center">
        <Stepper
          value={home}
          onDec={() => adjust('home', -1)}
          onInc={() => { init('home'); adjust('home', 1) }}
          locked={locked}
        />
        <span className="match-sep">×</span>
        <Stepper
          value={away}
          onDec={() => adjust('away', -1)}
          onInc={() => { init('away'); adjust('away', 1) }}
          locked={locked}
        />
      </div>

      <div className="match-team-right">
        <span className="match-team-flag">{awayTeam?.flag}</span>
        <span className="match-team-name">{awayTeam?.short ?? game.away}</span>
      </div>
    </div>
  )
}
