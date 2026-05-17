import type { KnockoutMatch, Results } from '@/types'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'

interface SlotProps {
  match: KnockoutMatch
  side: 'home' | 'away'
  winner: string | undefined
}

function KoSlot({ match, side, winner }: SlotProps) {
  const teamId = side === 'home' ? match.home : match.away
  const team = teamId ? TEAMS[teamId] : null
  const isWinner = !!teamId && winner === teamId
  const isEmpty = !teamId

  if (isEmpty) {
    return (
      <div className="ko-results-slot">
        <span className="ko-results-slot__empty">A definir</span>
      </div>
    )
  }

  return (
    <div className={`ko-results-slot${isWinner ? ' ko-results-slot--winner' : winner ? ' ko-results-slot--loser' : ''}`}>
      {team && <Flag iso={team.iso} name={team.name} size="sm" />}
      <span className="ko-results-slot__name">{team?.name ?? teamId}</span>
      {isWinner && <span className="ko-results-slot__badge">✓ avançou</span>}
    </div>
  )
}

interface KoResultsProps {
  results: Results
}

export function KoResults({ results }: KoResultsProps) {
  const standings = calcGroupStandings(results.groupStage)
  const qualified = getQualified(standings)
  const r32 = buildR32(qualified)

  const allResolved: Record<string, KnockoutMatch> = {}
  for (const m of r32) allResolved[m.id] = m

  const rounds = [
    { name: 'Round de 32', matches: r32 },
    ...KNOCKOUT_ROUNDS.map(round => {
      const resolved = resolveKnockoutRound(round.matches, results.knockout, allResolved)
      for (const m of resolved) allResolved[m.id] = m
      return { name: round.name, matches: resolved }
    }),
  ]

  return (
    <div className="ko-results-section">
      {rounds.map(round => (
        <div key={round.name} className="ko-results-round">
          <div className="ko-results-round__title">{round.name}</div>
          {round.matches.map(match => (
            <div key={match.id} className="ko-results-match">
              <KoSlot match={match} side="home" winner={results.knockout[match.id]} />
              <KoSlot match={match} side="away" winner={results.knockout[match.id]} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
