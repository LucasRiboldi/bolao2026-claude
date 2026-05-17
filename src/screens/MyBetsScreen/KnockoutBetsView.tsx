import type { GroupBets, KnockoutBets, KnockoutMatch, TeamId } from '@/types'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound, DEFAULT_SCORING } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'

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

const ROUND_POINTS: Record<string, number> = {
  'Round de 32':    DEFAULT_SCORING.r32Winner,
  'Oitavas':        DEFAULT_SCORING.r16Winner,
  'Quartas':        DEFAULT_SCORING.qfWinner,
  'Semifinais':     DEFAULT_SCORING.sfWinner,
  'Terceiro Lugar': DEFAULT_SCORING.sfWinner,
  'Final':          DEFAULT_SCORING.championScore,
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

function BetsTeamChip({
  entry, koBets, koResults, roundPts,
}: {
  entry: FlatTeam
  koBets: KnockoutBets
  koResults: Record<string, TeamId>
  roundPts: number
}) {
  const team = TEAMS[entry.teamId]
  if (!team) return null
  const picked  = koBets[entry.matchId] === entry.teamId
  const actual  = koResults[entry.matchId]
  const correct = picked && !!actual && actual === entry.teamId
  const wrong   = picked && !!actual && actual !== entry.teamId

  return (
    <div className={['ko-bets-chip', picked ? 'ko-bets-chip--picked' : ''].filter(Boolean).join(' ')}>
      <Flag iso={team.iso} name={team.name} size="sm" />
      <span className="ko-bets-chip__name">{team.name}</span>
      {picked && (
        <span className={['ko-bets-pts', correct ? 'ko-bets-pts--ok' : wrong ? 'ko-bets-pts--wrong' : 'ko-bets-pts--pending'].join(' ')}>
          {correct ? `+${roundPts}` : wrong ? '0' : '—'}
        </span>
      )}
    </div>
  )
}

function BetsRound({
  name, matches, koBets, koResults, cols,
}: {
  name: string
  matches: KnockoutMatch[]
  koBets: KnockoutBets
  koResults: Record<string, TeamId>
  cols?: number
}) {
  const color  = ROUND_COLORS[name] ?? 'var(--border)'
  const numCols = cols ?? ROUND_COLS[name] ?? 2
  const pts    = ROUND_POINTS[name] ?? 0
  const teams  = collectAndSort(matches)
  const pickedCount = matches.filter(m => !!koBets[m.id]).length
  const earnedPts = matches.reduce((sum, m) => {
    const picked = koBets[m.id]
    if (picked && koResults[m.id] === picked) return sum + pts
    return sum
  }, 0)

  return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{name}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {earnedPts > 0 && (
            <span className="ko-round-earned">+{earnedPts} pts</span>
          )}
          <span className="ko-round-badge" style={{ background: color }}>
            {pickedCount}/{matches.length}
          </span>
        </div>
      </div>
      <div className="ko-chip-grid" style={{ '--ko-cols': numCols } as React.CSSProperties}>
        {teams.map(t => (
          <BetsTeamChip key={`${t.matchId}-${t.teamId}`} entry={t} koBets={koBets} koResults={koResults} roundPts={pts} />
        ))}
      </div>
    </div>
  )
}

export function KnockoutBetsView({
  groupBets, koBets, koResults = {},
}: {
  groupBets: GroupBets
  koBets: KnockoutBets
  koResults?: Record<string, TeamId>
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

  const mainRounds = rounds.filter(r => r.name !== 'Final' && r.name !== 'Terceiro Lugar')
  const finalRound  = rounds.find(r => r.name === 'Final')
  const thirdRound  = rounds.find(r => r.name === 'Terceiro Lugar')

  return (
    <>
      <div className="mybets-section-label">Mata-Mata</div>
      <div className="mybets-ko-section">
        {mainRounds.map(round => (
          <BetsRound
            key={round.name}
            name={round.name}
            matches={round.matches}
            koBets={koBets}
            koResults={koResults}
          />
        ))}
        {(thirdRound || finalRound) && (
          <div className="ko-finals-row">
            {thirdRound && (
              <div className="ko-finals-col">
                <BetsRound name="Terceiro Lugar" matches={thirdRound.matches} koBets={koBets} koResults={koResults} cols={1} />
              </div>
            )}
            {finalRound && (
              <div className="ko-finals-col">
                <BetsRound name="Final" matches={finalRound.matches} koBets={koBets} koResults={koResults} cols={1} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
