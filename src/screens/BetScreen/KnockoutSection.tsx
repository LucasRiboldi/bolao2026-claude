import type { KnockoutBets, KnockoutMatch, TeamId } from '@/types'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'
import type { GroupBets } from '@/types'

interface KnockoutSectionProps {
  groupBets: GroupBets
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
}

const ROUND_COLORS: Record<string, string> = {
  'Round de 32': '#e74c3c',
  'Oitavas':     '#e67e22',
  'Quartas':     '#f39c12',
  'Semifinais':  '#2ecc71',
  'Final':       '#d4aa2c',
  'Terceiro Lugar': '#607d8b',
}

const ROUND_COLS: Record<string, number> = {
  'Round de 32': 4,
  'Oitavas':     4,
  'Quartas':     4,
  'Semifinais':  2,
  'Final':       2,
  'Terceiro Lugar': 2,
}

interface TeamRowProps {
  teamId: TeamId | null | undefined
  matchId: string
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
}

function TeamRow({ teamId, matchId, koBets, locked, onPick }: TeamRowProps) {
  const team = teamId ? TEAMS[teamId] : null
  const winner = koBets[matchId]
  const selected = !!teamId && winner === teamId
  const hasWinner = !!winner
  const isEmpty = !teamId

  const cls = [
    'ko-team-row',
    selected ? 'ko-team-row--selected' : '',
    !selected && hasWinner && !isEmpty ? 'ko-team-row--eliminated' : '',
    isEmpty ? 'ko-team-row--empty' : '',
    locked ? 'ko-team-row--locked' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cls}
      onClick={() => { if (!isEmpty && !locked && teamId) onPick(matchId, teamId) }}
      role={isEmpty || locked ? undefined : 'button'}
      title={team ? `Escolher ${team.name}` : undefined}
    >
      {team ? (
        <>
          <Flag iso={team.iso} name={team.name} size="sm" />
          <span className="ko-team-row__name">{team.name}</span>
          {selected && <span className="ko-team-row__check">✓</span>}
        </>
      ) : (
        <span className="ko-team-row__tbd">A definir</span>
      )}
    </div>
  )
}

interface RoundGridProps {
  name: string
  matches: KnockoutMatch[]
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
}

function RoundGrid({ name, matches, koBets, locked, onPick }: RoundGridProps) {
  const color = ROUND_COLORS[name] ?? 'var(--border)'
  const numCols = ROUND_COLS[name] ?? 2
  const cols: KnockoutMatch[][] = Array.from({ length: numCols }, () => [])
  matches.forEach((m, i) => cols[i % numCols]!.push(m))

  return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{name}</span>
        <span className="ko-round-badge" style={{ background: color }}>
          {matches.length * 2} times
        </span>
      </div>
      <div className="ko-round-grid" style={{ '--cols': numCols } as React.CSSProperties}>
        {cols.map((col, ci) => (
          <div key={ci} className="ko-round-col">
            {col.map((match, mi) => (
              <div key={match.id} className="ko-match-pair">
                {mi > 0 && <div className="ko-match-divider" />}
                <TeamRow teamId={match.home} matchId={match.id} koBets={koBets} locked={locked} onPick={onPick} />
                <TeamRow teamId={match.away} matchId={match.id} koBets={koBets} locked={locked} onPick={onPick} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function KnockoutSection({ groupBets, koBets, locked, onPick }: KnockoutSectionProps) {
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
    <div className="ko-section">
      <div className="ko-section-intro">
        <span>⚡ Mata-Mata</span>
        <span className="ko-section-intro__sub">Clique nos times que você acha que avançam</span>
      </div>
      {rounds.map(round => (
        <RoundGrid
          key={round.name}
          name={round.name}
          matches={round.matches}
          koBets={koBets}
          locked={locked}
          onPick={onPick}
        />
      ))}
    </div>
  )
}
