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
  onSave?: () => Promise<void>
  saving?: boolean
  defaultOpen?: boolean
}

export function GroupCard({ groupId, bets, locked, onChange, onSave, saving = false, defaultOpen = false }: GroupCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [saved, setSaved] = useState(false)
  const games = generateGroupGames(groupId)
  const teamNames = GROUPS[groupId].map(id => TEAMS[id]?.name ?? id).join(' · ')
  const color = GROUP_COLORS[groupId]

  const filled = games.filter(g => {
    const b = bets[g.id]
    return b && b.homeGoals !== '' && b.awayGoals !== ''
  }).length

  async function handleGroupSave(e: React.MouseEvent) {
    e.stopPropagation()
    if (!onSave) return
    await onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
        <div className="group-card__right">
          <span className="group-card__count">{filled}/6</span>
          <span className={`group-card__chevron${open ? ' group-card__chevron--open' : ''}`}>▾</span>
        </div>
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
          {!locked && onSave && (
            <div className="group-card__save-row">
              <button
                className={`btn btn-ghost btn-sm${saved ? ' btn--saved' : ''}`}
                onClick={handleGroupSave}
                disabled={saving || filled === 0}
                aria-label={`Salvar grupo ${groupId}`}
              >
                {saved ? '✓ Salvo!' : saving ? 'Salvando…' : `💾 Salvar Grupo ${groupId}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
