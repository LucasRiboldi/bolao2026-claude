import type { GroupId, StandingRow, GroupBets } from '@/types'
import { generateGroupGames, GROUP_IDS } from '@/data/groups'
import { TEAMS } from '@/data/teams'

function computeWDL(teamId: string, groupId: GroupId, results: GroupBets) {
  let w = 0, d = 0, l = 0
  for (const game of generateGroupGames(groupId)) {
    const bet = results[game.id]
    if (!bet || bet.homeGoals === '' || bet.awayGoals === '') continue
    const hg = parseInt(bet.homeGoals, 10)
    const ag = parseInt(bet.awayGoals, 10)
    const isHome = game.home === teamId
    const isAway = game.away === teamId
    if (!isHome && !isAway) continue
    const scored = isHome ? hg : ag
    const conceded = isHome ? ag : hg
    if (scored > conceded) w++
    else if (scored === conceded) d++
    else l++
  }
  return { w, d, l }
}

function qualClass(rank: number): string {
  if (rank === 0) return ' standings-row--q1'
  if (rank === 1) return ' standings-row--q2'
  if (rank === 2) return ' standings-row--q3'
  return ''
}

interface GroupTableProps {
  groupId: GroupId
  rows: StandingRow[]
  results: GroupBets
}

export function GroupTable({ groupId, rows, results }: GroupTableProps) {
  return (
    <div className="standings-group">
      <div className="standings-group__title">Grupo {groupId}</div>
      <div className="standings-table">
        <div className="standings-header">
          <span>#</span>
          <span>País</span>
          <span>J</span>
          <span>V</span>
          <span>E</span>
          <span>D</span>
          <span>P</span>
        </div>
        {rows.map((row, i) => {
          const team = TEAMS[row.id]
          const { w, d, l } = computeWDL(row.id, groupId, results)
          return (
            <div key={row.id} className={`standings-row${qualClass(i)}`}>
              <span className="standings-row__rank">{i + 1}</span>
              <div className="standings-row__team">
                <span className="standings-row__flag">{team?.flag ?? '🏳'}</span>
                <span className="standings-row__name">{team?.short ?? row.id}</span>
              </div>
              <span className="standings-col">{row.played}</span>
              <span className="standings-col">{w}</span>
              <span className="standings-col">{d}</span>
              <span className="standings-col">{l}</span>
              <span className="standings-col standings-col--pts">{row.pts}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface AllGroupTablesProps {
  groupStandings: Partial<Record<GroupId, StandingRow[]>>
  results: GroupBets
}

export function AllGroupTables({ groupStandings, results }: AllGroupTablesProps) {
  return (
    <>
      {GROUP_IDS.map(gId => {
        const rows = groupStandings[gId] ?? []
        return <GroupTable key={gId} groupId={gId} rows={rows} results={results} />
      })}
    </>
  )
}
