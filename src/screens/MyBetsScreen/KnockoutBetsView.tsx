import type { GroupBets, KnockoutBets, KnockoutMatch } from '@/types'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'

function KoSlotView({ match, side, koBets }: {
  match: KnockoutMatch
  side: 'home' | 'away'
  koBets: KnockoutBets
}) {
  const teamId = side === 'home' ? match.home : match.away
  const team = teamId ? TEAMS[teamId] : null
  const winner = koBets[match.id]
  const isWinner = !!teamId && winner === teamId

  if (!teamId) {
    return (
      <div className="mybets-ko-slot">
        <span className="mybets-ko-slot__empty">A definir</span>
      </div>
    )
  }

  return (
    <div className={`mybets-ko-slot${isWinner ? ' mybets-ko-slot--winner' : ''}`}>
      {team && <Flag iso={team.iso} name={team.name} size="sm" />}
      <span className="mybets-ko-slot__name">{team?.name ?? teamId}</span>
      {isWinner && <span className="mybets-ko-slot__check">✓</span>}
    </div>
  )
}

export function KnockoutBetsView({ groupBets, koBets }: {
  groupBets: GroupBets
  koBets: KnockoutBets
}) {
  const standings = calcGroupStandings(groupBets)
  const qualified = getQualified(standings)
  const r32 = buildR32(qualified)

  const allResolved: Record<string, KnockoutMatch> = {}
  for (const m of r32) allResolved[m.id] = m

  const rounds = [
    { name: 'Round de 32', matches: r32 },
    ...KNOCKOUT_ROUNDS.map(round => {
      const resolved = resolveKnockoutRound(round.matches, koBets, allResolved)
      for (const m of resolved) allResolved[m.id] = m
      return { name: round.name, matches: resolved }
    }),
  ]

  return (
    <>
      <div className="mybets-section-label">Mata-Mata</div>
      <div className="mybets-ko-section">
        {rounds.map(round => (
          <div key={round.name}>
            <div className="mybets-ko-round-title">{round.name}</div>
            {round.matches.map(match => (
              <div key={match.id} className="mybets-ko-match">
                <KoSlotView match={match} side="home" koBets={koBets} />
                <KoSlotView match={match} side="away" koBets={koBets} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
