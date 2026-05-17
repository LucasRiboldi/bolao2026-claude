import type { KnockoutBets, KnockoutMatch, TeamId } from '@/types'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import type { GroupBets } from '@/types'

interface KnockoutSectionProps {
  groupBets: GroupBets
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
}

interface SlotProps {
  match: KnockoutMatch
  side: 'home' | 'away'
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
}

function KoSlot({ match, side, koBets, locked, onPick }: SlotProps) {
  const teamId = side === 'home' ? match.home : match.away
  const team = teamId ? TEAMS[teamId] : null
  const winner = koBets[match.id]
  const selected = winner === teamId && !!teamId
  const isEmpty = !teamId

  const cls = [
    'ko-slot',
    selected ? 'ko-slot--selected' : '',
    isEmpty ? 'ko-slot--empty' : '',
    locked ? 'ko-slot--locked' : '',
  ].filter(Boolean).join(' ')

  function handleClick() {
    if (isEmpty || locked || !teamId) return
    onPick(match.id, teamId)
  }

  return (
    <div className={cls} onClick={handleClick} role={isEmpty || locked ? undefined : 'button'}>
      <span className="ko-slot__flag">{team?.flag ?? '🏳'}</span>
      <span className="ko-slot__name">{team?.name ?? (isEmpty ? '—' : teamId)}</span>
      {selected && <span className="ko-slot__check">✓</span>}
      {!selected && !isEmpty && <span className="ko-slot__label">escolher</span>}
    </div>
  )
}

export function KnockoutSection({ groupBets, koBets, locked, onPick }: KnockoutSectionProps) {
  const standings = Object.fromEntries(
    Object.entries(calcGroupStandings(groupBets)).map(([g, rows]) => [g, rows])
  )
  const qualified = getQualified(standings as Parameters<typeof getQualified>[0])
  const r32 = buildR32(qualified)

  const r32ById: Record<string, KnockoutMatch> = {}
  for (const m of r32) r32ById[m.id] = m

  const allResolved: Record<string, KnockoutMatch> = { ...r32ById }

  const r32Section = { name: 'Round de 32', matches: r32 }
  const roundsWithMatches = [
    r32Section,
    ...KNOCKOUT_ROUNDS.map(round => {
      const resolved = resolveKnockoutRound(round.matches, koBets, allResolved)
      for (const m of resolved) allResolved[m.id] = m
      return { name: round.name, matches: resolved }
    }),
  ]

  return (
    <div className="ko-section">
      {roundsWithMatches.map(round => (
        <div key={round.name}>
          <div className="ko-section__title">{round.name}</div>
          {round.matches.map(match => (
            <div key={match.id} className="ko-match">
              <KoSlot match={match} side="home" koBets={koBets} locked={locked} onPick={onPick} />
              <KoSlot match={match} side="away" koBets={koBets} locked={locked} onPick={onPick} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
