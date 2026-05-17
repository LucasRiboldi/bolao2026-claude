import { useState } from 'react'
import type { GroupId, GroupBets } from '@/types'
import { GROUP_IDS, generateGroupGames, GROUP_COLORS } from '@/data/groups'
import { TEAMS } from '@/data/teams'

function MatchRowView({ gameId, home, away, bets }: {
  gameId: string
  home: string
  away: string
  bets: GroupBets
}) {
  const bet = bets[gameId]
  const homeGoals = bet?.homeGoals ?? ''
  const awayGoals = bet?.awayGoals ?? ''
  const filled = homeGoals !== '' && awayGoals !== ''

  const homeTeam = TEAMS[home]
  const awayTeam = TEAMS[away]

  return (
    <div className="mybets-match-row">
      <div className="mybets-team-left">
        <span className="mybets-team-name">{homeTeam?.short ?? home}</span>
        <span className="mybets-team-flag">{homeTeam?.flag}</span>
      </div>
      <div className="mybets-score">
        <div className={`mybets-score__val${filled ? '' : ' mybets-score__val--empty'}`}>
          {filled ? homeGoals : '?'}
        </div>
        <span className="mybets-score__sep">×</span>
        <div className={`mybets-score__val${filled ? '' : ' mybets-score__val--empty'}`}>
          {filled ? awayGoals : '?'}
        </div>
      </div>
      <div className="mybets-team-right">
        <span className="mybets-team-flag">{awayTeam?.flag}</span>
        <span className="mybets-team-name">{awayTeam?.short ?? away}</span>
      </div>
    </div>
  )
}

function GroupCardView({ groupId, bets, defaultOpen }: {
  groupId: GroupId
  bets: GroupBets
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const games = generateGroupGames(groupId)
  const color = GROUP_COLORS[groupId]
  const filled = games.filter(g => {
    const b = bets[g.id]
    return b && b.homeGoals !== '' && b.awayGoals !== ''
  }).length

  return (
    <div className="mybets-group-card" style={{ borderLeftColor: color }}>
      <div
        className="mybets-group-card__header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <div className="mybets-group-card__title">Grupo {groupId}</div>
        <div className="mybets-group-card__meta">
          <span className="mybets-group-card__filled">{filled}/6</span>
          <span className={`mybets-group-card__chevron${open ? ' mybets-group-card__chevron--open' : ''}`}>▾</span>
        </div>
      </div>
      {open && games.map(game => (
        <MatchRowView
          key={game.id}
          gameId={game.id}
          home={game.home}
          away={game.away}
          bets={bets}
        />
      ))}
    </div>
  )
}

export function GroupBetsView({ bets }: { bets: GroupBets }) {
  return (
    <>
      <div className="mybets-section-label">Fase de Grupos</div>
      {GROUP_IDS.map((gId, i) => (
        <GroupCardView key={gId} groupId={gId} bets={bets} defaultOpen={i === 0} />
      ))}
    </>
  )
}
