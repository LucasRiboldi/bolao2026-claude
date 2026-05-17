import { useState } from 'react'
import type { GroupId, GroupBets } from '@/types'
import { generateGroupGames, GROUP_COLORS } from '@/data/groups'
import { GROUPS } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { MatchRowBet } from './MatchRowBet'

interface GroupCardProps {
  groupId: GroupId
  bets: GroupBets
  locked: boolean
  onChange: (gameId: string, home: string, away: string) => void
  defaultOpen?: boolean
}

export function GroupCard({ groupId, bets, locked, onChange, defaultOpen = false }: GroupCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const games = generateGroupGames(groupId)
  const teamNames = GROUPS[groupId].map(id => TEAMS[id]?.short ?? id).join(' · ')
  const color = GROUP_COLORS[groupId]

  return (
    <div className="group-card" style={{ borderLeftColor: color }}>
      <div
        className="group-card__header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <div>
          <div className="group-card__title">Grupo {groupId}</div>
          <div className="group-card__teams">{teamNames}</div>
        </div>
        <span className={`group-card__chevron${open ? ' group-card__chevron--open' : ''}`}>▾</span>
      </div>

      {open && (
        <div className="group-card__games">
          {games.map(game => (
            <MatchRowBet
              key={game.id}
              game={game}
              bets={bets}
              locked={locked}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
