import type { GroupBets, KnockoutBets, TeamId } from '@/types'
import { TEAMS } from '@/data/teams'
import { buildR32, DEFAULT_SCORING } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'

const ROUND_COLORS: Record<string, string> = {
  r32:      '#e74c3c',
  r16:      '#e67e22',
  qf:       '#f39c12',
  sf:       '#2ecc71',
  champion: '#d4aa2c',
  third:    '#607d8b',
}

const ROUND_PTS: Record<string, number> = {
  r32:      DEFAULT_SCORING.r32Winner,
  r16:      DEFAULT_SCORING.r16Winner,
  qf:       DEFAULT_SCORING.qfWinner,
  sf:       DEFAULT_SCORING.sfWinner,
  champion: DEFAULT_SCORING.championScore,
  third:    DEFAULT_SCORING.r32Winner,
}

function sortTeams(ids: TeamId[]): TeamId[] {
  return [...ids].sort((a, b) => (TEAMS[a]?.name ?? '').localeCompare(TEAMS[b]?.name ?? '', 'pt-BR'))
}

function buildActualSets(koResults: Record<string, TeamId>) {
  const sets = { r32: new Set<string>(), r16: new Set<string>(), qf: new Set<string>(), sf: new Set<string>() }
  for (const [id, winner] of Object.entries(koResults)) {
    if (id.startsWith('r32_')) sets.r32.add(winner)
    else if (id.startsWith('r16_')) sets.r16.add(winner)
    else if (id.startsWith('qf_'))  sets.qf.add(winner)
    else if (id.startsWith('sf_'))  sets.sf.add(winner)
  }
  return sets
}

function BetsChip({
  teamId, picked, correct, wrong, pts,
}: {
  teamId: TeamId; picked: boolean; correct: boolean; wrong: boolean; pts: number
}) {
  const team = TEAMS[teamId]
  if (!team) return null
  return (
    <div className={['ko-bets-chip', picked ? 'ko-bets-chip--picked' : ''].filter(Boolean).join(' ')}>
      <Flag iso={team.iso} name={team.name} size="sm" />
      <span className="ko-bets-chip__name">{team.name}</span>
      {picked && (
        <span className={['ko-bets-pts', correct ? 'ko-bets-pts--ok' : wrong ? 'ko-bets-pts--wrong' : 'ko-bets-pts--pending'].join(' ')}>
          {correct ? `+${pts}` : wrong ? '0' : '—'}
        </span>
      )}
    </div>
  )
}

interface ArrayRoundProps {
  label: string
  colorKey: string
  pool: TeamId[]
  picks: TeamId[]
  actual: Set<string> | null
  cols?: number
}

function ArrayRound({ label, colorKey, pool, picks, actual, cols = 4 }: ArrayRoundProps) {
  if (pool.length === 0 && picks.length === 0) return null
  const color = ROUND_COLORS[colorKey] ?? 'var(--border)'
  const pts = ROUND_PTS[colorKey] ?? 0
  const earned = picks.filter(t => actual?.has(t)).length * pts

  return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{label}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {earned > 0 && <span className="ko-round-earned">+{earned} pts</span>}
          <span className="ko-round-badge" style={{ background: color }}>{picks.length}</span>
        </div>
      </div>
      {picks.length === 0
        ? <div className="ko-round-empty">Nenhuma aposta</div>
        : (
          <div className="ko-chip-grid" style={{ '--ko-cols': cols } as React.CSSProperties}>
            {sortTeams(picks).map(teamId => (
              <BetsChip
                key={teamId}
                teamId={teamId}
                picked={true}
                correct={!!actual && actual.has(teamId)}
                wrong={!!actual && actual.size > 0 && !actual.has(teamId)}
                pts={pts}
              />
            ))}
          </div>
        )
      }
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
  const r32Matches = buildR32(qualified)
  const r32Pool = [...new Set(r32Matches.flatMap(m => [m.home, m.away]).filter(Boolean) as TeamId[])]

  const actual = buildActualSets(koResults)
  const hasResults = Object.keys(koResults).length > 0

  const champion = koBets.champion
  const third    = koBets.third
  const actualChampion = koResults['final']
  const actualThird    = koResults['third']

  return (
    <>
      <div className="mybets-section-label">Mata-Mata</div>
      <div className="mybets-ko-section">
        <ArrayRound
          label="Round de 32"
          colorKey="r32"
          pool={r32Pool}
          picks={koBets.r32 ?? []}
          actual={hasResults ? actual.r32 : null}
        />
        <ArrayRound
          label="Oitavas"
          colorKey="r16"
          pool={koBets.r32 ?? []}
          picks={koBets.r16 ?? []}
          actual={hasResults ? actual.r16 : null}
        />
        <ArrayRound
          label="Quartas"
          colorKey="qf"
          pool={koBets.r16 ?? []}
          picks={koBets.qf ?? []}
          actual={hasResults ? actual.qf : null}
        />
        <ArrayRound
          label="Semifinais"
          colorKey="sf"
          pool={koBets.qf ?? []}
          picks={koBets.sf ?? []}
          actual={hasResults ? actual.sf : null}
          cols={2}
        />

        {(third || champion) && (
          <div className="ko-finals-row">
            <div className="ko-finals-col">
              <div className="ko-round-section">
                <div className="ko-round-header" style={{ borderLeftColor: ROUND_COLORS['third'] }}>
                  <span className="ko-round-title">3° Lugar</span>
                </div>
                {third
                  ? (
                    <div className="ko-chip-grid" style={{ '--ko-cols': 1 } as React.CSSProperties}>
                      <BetsChip
                        teamId={third}
                        picked
                        correct={!!actualThird && actualThird === third}
                        wrong={!!actualThird && actualThird !== third}
                        pts={ROUND_PTS['third']}
                      />
                    </div>
                  )
                  : <div className="ko-round-empty">Sem aposta</div>
                }
              </div>
            </div>
            <div className="ko-finals-col">
              <div className="ko-round-section">
                <div className="ko-round-header" style={{ borderLeftColor: ROUND_COLORS['champion'] }}>
                  <span className="ko-round-title">Campeão 👑</span>
                </div>
                {champion
                  ? (
                    <div className="ko-chip-grid" style={{ '--ko-cols': 1 } as React.CSSProperties}>
                      <BetsChip
                        teamId={champion}
                        picked
                        correct={!!actualChampion && actualChampion === champion}
                        wrong={!!actualChampion && actualChampion !== champion}
                        pts={ROUND_PTS['champion']}
                      />
                    </div>
                  )
                  : <div className="ko-round-empty">Sem aposta</div>
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
