import { useState } from 'react'
import type { GroupId, GroupBets } from '@/types'
import { GROUP_IDS, generateGroupGames, GROUP_COLORS } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { Flag } from '@/components/Flag'
import { DEFAULT_SCORING } from '@/data/bracket'

interface RowProps {
  gameId: string
  home: string
  away: string
  bets: GroupBets
  results: GroupBets
}

function calcGamePts(bet: { homeGoals: string; awayGoals: string }, result: { homeGoals: string; awayGoals: string }): number | null {
  const bH = parseInt(bet.homeGoals, 10), bA = parseInt(bet.awayGoals, 10)
  const rH = parseInt(result.homeGoals, 10), rA = parseInt(result.awayGoals, 10)
  if (isNaN(bH) || isNaN(bA) || isNaN(rH) || isNaN(rA)) return null
  if (bH === rH && bA === rA) return DEFAULT_SCORING.exactScore
  if (Math.sign(bH - bA) === Math.sign(rH - rA)) return DEFAULT_SCORING.correctResult
  return 0
}

function MatchSheetRow({ gameId, home, away, bets, results }: RowProps) {
  const bet = bets[gameId]
  const result = results[gameId]
  const homeTeam = TEAMS[home]
  const awayTeam = TEAMS[away]

  const betFilled = bet && bet.homeGoals !== '' && bet.awayGoals !== ''
  const hasResult = result && result.homeGoals !== '' && result.awayGoals !== ''

  const pts = betFilled && hasResult ? calcGamePts(bet!, result!) : null

  return (
    <div className="sheet-row">
      <div className="sheet-teams">
        <div className="sheet-team sheet-team--home">
          {homeTeam && <Flag iso={homeTeam.iso} name={homeTeam.name} size="sm" />}
          <span className="sheet-team__name">{homeTeam?.name ?? home}</span>
        </div>

        <div className="sheet-score">
          {betFilled ? (
            <span className="sheet-score__val">{bet!.homeGoals} × {bet!.awayGoals}</span>
          ) : (
            <span className="sheet-score__empty">? × ?</span>
          )}
        </div>

        <div className="sheet-team sheet-team--away">
          <span className="sheet-team__name">{awayTeam?.name ?? away}</span>
          {awayTeam && <Flag iso={awayTeam.iso} name={awayTeam.name} size="sm" />}
        </div>
      </div>

      <div className="sheet-meta">
        {pts !== null ? (
          <span className={`sheet-pts${pts > 0 ? ' sheet-pts--earned' : ' sheet-pts--zero'}`}>
            {pts > 0 ? `+${pts}pts` : '0pts'}
          </span>
        ) : (
          <span className="sheet-pts sheet-pts--pending">—</span>
        )}

        <div className="sheet-result">
          {hasResult ? (
            <span className="sheet-result__score">{result!.homeGoals}–{result!.awayGoals}</span>
          ) : (
            <span className="sheet-result__date">Jun 2026</span>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupSheetCard({ groupId, bets, results, defaultOpen }: {
  groupId: GroupId
  bets: GroupBets
  results: GroupBets
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const games = generateGroupGames(groupId)
  const color = GROUP_COLORS[groupId]

  const filled = games.filter(g => {
    const b = bets[g.id]
    return b && b.homeGoals !== '' && b.awayGoals !== ''
  }).length

  const totalPts = games.reduce((acc, g) => {
    const bet = bets[g.id]
    const result = results[g.id]
    if (!bet || !result) return acc
    const p = calcGamePts(bet, result)
    return acc + (p ?? 0)
  }, 0)

  const hasPoints = games.some(g => results[g.id])

  return (
    <div className="sheet-group" style={{ borderLeftColor: color }}>
      <div
        className="sheet-group__header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <div className="sheet-group__left">
          <span className="sheet-group__title">Grupo {groupId}</span>
          <span className="sheet-group__filled">{filled}/6 preenchidos</span>
        </div>
        <div className="sheet-group__right">
          {hasPoints && <span className="sheet-group__pts">{totalPts} pts</span>}
          <span className={`sheet-group__chevron${open ? ' sheet-group__chevron--open' : ''}`}>▾</span>
        </div>
      </div>

      {open && (
        <div className="sheet-group__rows">
          <div className="sheet-header">
            <span>Confronto apostado</span>
            <span>Pts · Resultado</span>
          </div>
          {games.map(game => (
            <MatchSheetRow
              key={game.id}
              gameId={game.id}
              home={game.home}
              away={game.away}
              bets={bets}
              results={results}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function GroupBetsView({ bets, results = {} }: { bets: GroupBets; results?: GroupBets }) {
  return (
    <>
      <div className="mybets-section-label">Fase de Grupos</div>
      {GROUP_IDS.map((gId, i) => (
        <GroupSheetCard key={gId} groupId={gId} bets={bets} results={results} defaultOpen={i === 0} />
      ))}
    </>
  )
}
