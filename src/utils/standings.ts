/**
 * Group standings and qualification logic for FIFA World Cup 2026.
 *
 * Implements FIFA Regulations Art. 12–13. See src/data/fifaRules2026.ts for
 * the full rule constants and implementation-status notes.
 *
 * TIEBREAKER IMPLEMENTATION STATUS (Art. 13):
 *   ✅ Step 1a — H2H points among tied teams
 *   ✅ Step 1b — H2H goal difference among tied teams
 *   ✅ Step 1c — H2H goals scored among tied teams
 *   ✅ Step 2d — Overall goal difference
 *   ✅ Step 2e — Overall goals scored
 *   ❌ Step 2f — Conduct score (no card data in bets)
 *   ❌ Step 3g/h — FIFA World Ranking (no live API)
 *   → Falls back to array insertion order (deterministic, arbitrary)
 *
 * THIRD-PLACE RANKING STATUS (Art. 13 para 2):
 *   ✅ a, b, c — points, goal difference, goals scored
 *   ❌ d — conduct score (not implemented)
 *   ❌ e, f — FIFA World Ranking (not implemented)
 */
import type { GroupId, GroupBets, StandingRow, QualifiedTeams } from '@/types'
import { GROUPS, GROUP_IDS, generateGroupGames } from '@/data/groups'

interface H2HStats {
  pts: number
  gf: number
  ga: number
  gd: number
}

function h2hStats(
  teamIds: string[],
  results: Array<{ home: string; away: string; hg: number; ag: number }>,
): Record<string, H2HStats> {
  const set = new Set(teamIds)
  const s: Record<string, H2HStats> = {}
  for (const id of teamIds) s[id] = { pts: 0, gf: 0, ga: 0, gd: 0 }

  for (const r of results) {
    if (!set.has(r.home) || !set.has(r.away)) continue
    s[r.home]!.gf += r.hg
    s[r.home]!.ga += r.ag
    s[r.away]!.gf += r.ag
    s[r.away]!.ga += r.hg
    if (r.hg > r.ag) s[r.home]!.pts += 3
    else if (r.hg === r.ag) { s[r.home]!.pts += 1; s[r.away]!.pts += 1 }
    else s[r.away]!.pts += 3
  }
  for (const id of teamIds) {
    s[id]!.gd = s[id]!.gf - s[id]!.ga
  }
  return s
}

// Art. 13 Step 1: H2H among tied teams, then Step 2: overall stats.
// Steps 2f (conduct) and 3g/h (FIFA ranking) are intentionally omitted.
function rankGroupTeams(
  teams: StandingRow[],
  results: Array<{ home: string; away: string; hg: number; ag: number }>,
): StandingRow[] {
  teams.sort((a, b) => b.pts - a.pts)
  const ranked: StandingRow[] = []
  let i = 0

  while (i < teams.length) {
    let j = i
    while (j < teams.length && teams[j]!.pts === teams[i]!.pts) j++
    const tied = teams.slice(i, j)

    if (tied.length === 1) {
      ranked.push(tied[0]!)
    } else {
      const h2h = h2hStats(tied.map(t => t.id), results)
      tied.sort((a, b) => {
        const ha = h2h[a.id]!
        const hb = h2h[b.id]!
        return (
          hb.pts - ha.pts ||   // Art. 13 Step 1a
          hb.gd  - ha.gd  ||   // Art. 13 Step 1b
          hb.gf  - ha.gf  ||   // Art. 13 Step 1c
          b.gd   - a.gd   ||   // Art. 13 Step 2d
          b.gf   - a.gf        // Art. 13 Step 2e
        )
      })
      ranked.push(...tied)
    }
    i = j
  }
  return ranked
}

export function calcGroupStandings(
  groupBets: GroupBets,
): Record<GroupId, StandingRow[]> {
  const standings = {} as Record<GroupId, StandingRow[]>

  for (const gId of GROUP_IDS) {
    const table: Record<string, StandingRow> = {}
    for (const t of GROUPS[gId]) {
      table[t] = { id: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 }
    }
    const results: Array<{ home: string; away: string; hg: number; ag: number }> = []

    for (const game of generateGroupGames(gId)) {
      const bet = groupBets[game.id]
      if (!bet || bet.homeGoals === '' || bet.awayGoals === '') continue
      const hg = parseInt(bet.homeGoals, 10)
      const ag = parseInt(bet.awayGoals, 10)
      if (isNaN(hg) || isNaN(ag)) continue

      results.push({ home: game.home, away: game.away, hg, ag })

      const h = table[game.home]!
      const a = table[game.away]!
      h.gf += hg; h.ga += ag; h.played++
      a.gf += ag; a.ga += hg; a.played++
      if (hg > ag) h.pts += 3
      else if (hg === ag) { h.pts += 1; a.pts += 1 }
      else a.pts += 3
      h.gd = h.gf - h.ga
      a.gd = a.gf - a.ga
    }
    standings[gId] = rankGroupTeams(Object.values(table), results)
  }
  return standings
}

/**
 * Derives qualified teams from final standings (Art. 12.5 + Art. 13 para 2).
 *
 * - 1st and 2nd of every group qualify directly (24 teams).
 * - The 8 best 3rd-placed teams across all 12 groups qualify (Art. 13 para 2).
 *   Sorting criteria: pts → GD → GF → GA (conduct score and FIFA ranking omitted).
 * - Which R32 slot each third-placed team occupies depends on Annexe C of the
 *   regulations (495 combinations). The bolão does not implement slot assignment
 *   because admin enters real results by match ID directly.
 */
export function getQualified(
  standings: Record<GroupId, StandingRow[]>,
): QualifiedTeams {
  const winners = {} as Record<GroupId, string | undefined>
  const runners = {} as Record<GroupId, string | undefined>
  const thirds: StandingRow[] = []

  for (const [gId, table] of Object.entries(standings) as [GroupId, StandingRow[]][]) {
    winners[gId] = table[0]?.id
    runners[gId] = table[1]?.id
    if (table[2]) thirds.push({ ...table[2], group: gId })
  }

  // Art. 13 para 2: sort 12 thirds by a–c (d–f omitted)
  thirds.sort((a, b) =>
    b.pts - a.pts ||
    b.gd  - a.gd  ||
    b.gf  - a.gf  ||
    a.ga  - b.ga
  )

  return { winners, runners, thirds: thirds.slice(0, 8) }
}
