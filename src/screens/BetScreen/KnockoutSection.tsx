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
  'Round de 32':    '#e74c3c',
  'Oitavas':        '#e67e22',
  'Quartas':        '#f39c12',
  'Semifinais':     '#2ecc71',
  'Final':          '#d4aa2c',
  'Terceiro Lugar': '#607d8b',
}

const ROUND_COLS: Record<string, number> = {
  'Round de 32': 4,
  'Oitavas':     4,
  'Quartas':     4,
  'Semifinais':  2,
}

type FlatTeam = { teamId: TeamId; matchId: string }

function collectAndSort(matches: KnockoutMatch[]): FlatTeam[] {
  const result: FlatTeam[] = []
  for (const m of matches) {
    if (m.home) result.push({ teamId: m.home as TeamId, matchId: m.id })
    if (m.away) result.push({ teamId: m.away as TeamId, matchId: m.id })
  }
  return result.sort((a, b) =>
    (TEAMS[a.teamId]?.name ?? '').localeCompare(TEAMS[b.teamId]?.name ?? '', 'pt-BR'),
  )
}

function TeamChip({
  entry, koBets, locked, onPick,
}: {
  entry: FlatTeam
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
}) {
  const team = TEAMS[entry.teamId]
  if (!team) return null
  const selected = koBets[entry.matchId] === entry.teamId
  return (
    <div
      className={['ko-chip', selected ? 'ko-chip--selected' : '', locked ? 'ko-chip--locked' : ''].filter(Boolean).join(' ')}
      onClick={() => { if (!locked) onPick(entry.matchId, entry.teamId) }}
      role={locked ? undefined : 'button'}
      title={team.name}
    >
      <Flag iso={team.iso} name={team.name} size="sm" />
      <span className="ko-chip__name">{team.name}</span>
      {selected && <span className="ko-chip__check">✓</span>}
    </div>
  )
}

function FlatRound({
  name, matches, koBets, locked, onPick, cols,
}: {
  name: string
  matches: KnockoutMatch[]
  koBets: KnockoutBets
  locked: boolean
  onPick: (matchId: string, teamId: TeamId) => void
  cols?: number
}) {
  const color = ROUND_COLORS[name] ?? 'var(--border)'
  const numCols = cols ?? ROUND_COLS[name] ?? 2
  const teams = collectAndSort(matches)
  const picked = matches.filter(m => !!koBets[m.id]).length

  return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{name}</span>
        <span className="ko-round-badge" style={{ background: color }}>
          {picked}/{matches.length}
        </span>
      </div>
      <div className="ko-chip-grid" style={{ '--ko-cols': numCols } as React.CSSProperties}>
        {teams.map(t => (
          <TeamChip key={`${t.matchId}-${t.teamId}`} entry={t} koBets={koBets} locked={locked} onPick={onPick} />
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

  const mainRounds = rounds.filter(r => r.name !== 'Final' && r.name !== 'Terceiro Lugar')
  const finalRound  = rounds.find(r => r.name === 'Final')
  const thirdRound  = rounds.find(r => r.name === 'Terceiro Lugar')

  return (
    <div className="ko-section">
      <div className="ko-section-intro">
        <span>⚡ Mata-Mata</span>
        <span className="ko-section-intro__sub">Selecione os times que você acha que avançam em cada fase</span>
      </div>
      {mainRounds.map(round => (
        <FlatRound
          key={round.name}
          name={round.name}
          matches={round.matches}
          koBets={koBets}
          locked={locked}
          onPick={onPick}
        />
      ))}
      {(thirdRound || finalRound) && (
        <div className="ko-finals-row">
          {thirdRound && (
            <div className="ko-finals-col">
              <FlatRound name="Terceiro Lugar" matches={thirdRound.matches} koBets={koBets} locked={locked} onPick={onPick} cols={1} />
            </div>
          )}
          {finalRound && (
            <div className="ko-finals-col">
              <FlatRound name="Final" matches={finalRound.matches} koBets={koBets} locked={locked} onPick={onPick} cols={1} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
