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
 *   ✅ Step 1 RECURSION — when a–c only partially separate the tied group,
 *      criteria are RE-APPLIED to the remaining tied subset (Art. 13).
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
 *
 * THIRD-PLACED BRACKET ASSIGNMENT (Art. 12.6 + Annexe C):
 *   ✅ Slot eligibility per FIFA (which groups can fill each R32 slot)
 *   ⚠️ Annexe C 495-row table NOT fully encoded — a deterministic backtracking
 *      matching is used, producing a VALID (eligibility-respecting) assignment
 *      that may differ from FIFA's specific row choice. Pre-tournament display
 *      only; actual results are entered by matchId post-game.
 */
import type { GroupId, GroupBets, StandingRow, QualifiedTeams, TeamId } from '@/types'
import { GROUPS, GROUP_IDS, generateGroupGames } from '@/data/groups'
import { type GroupLetter } from '@/data/fifaRules2026'

interface H2HStats {
  pts: number
  gf: number
  ga: number
  gd: number
}

interface MatchPlayed {
  home: string
  away: string
  hg: number
  ag: number
}

function h2hStats(
  teamIds: string[],
  results: MatchPlayed[],
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

/**
 * Resolve a set of tied teams per Art. 13.
 *
 * Step 1 (H2H): re-applied recursively to any subset that remains tied after
 * the first H2H pass — this is the key correctness requirement of Art. 13.
 * Step 2 (overall GD/GF): applied only when Step 1 leaves ALL tied teams equal.
 */
function resolveTie(tied: StandingRow[], results: MatchPlayed[]): StandingRow[] {
  if (tied.length <= 1) return tied

  // Step 1: H2H computed ONLY among the currently tied teams
  const h2h = h2hStats(tied.map(t => t.id), results)
  const sorted = [...tied].sort((a, b) => {
    const ha = h2h[a.id]!
    const hb = h2h[b.id]!
    return (
      hb.pts - ha.pts ||   // Art. 13 Step 1a
      hb.gd  - ha.gd  ||   // Art. 13 Step 1b
      hb.gf  - ha.gf       // Art. 13 Step 1c
    )
  })

  // Partition by H2H equality and recurse on each multi-team partition.
  const out: StandingRow[] = []
  let i = 0
  while (i < sorted.length) {
    const ref = h2h[sorted[i]!.id]!
    let j = i + 1
    while (j < sorted.length) {
      const cur = h2h[sorted[j]!.id]!
      if (cur.pts !== ref.pts || cur.gd !== ref.gd || cur.gf !== ref.gf) break
      j++
    }
    const subset = sorted.slice(i, j)

    if (subset.length === 1) {
      out.push(subset[0]!)
    } else if (subset.length === tied.length) {
      // H2H failed to separate ANYONE → Step 2 (overall stats)
      out.push(...applyStep2(subset))
    } else {
      // H2H partially separated → recurse on the remaining tied subset.
      // h2hStats is recomputed with only the subset's teams, so direct
      // results between them get re-evaluated in isolation (Art. 13).
      out.push(...resolveTie(subset, results))
    }
    i = j
  }
  return out
}

/**
 * Art. 13 Step 2: overall GD → overall GF.
 * Steps 2f (conduct) and 3g/h (FIFA ranking) are intentionally omitted.
 */
function applyStep2(teams: StandingRow[]): StandingRow[] {
  return [...teams].sort((a, b) =>
    b.gd - a.gd ||   // Art. 13 Step 2d
    b.gf - a.gf      // Art. 13 Step 2e
  )
}

function rankGroupTeams(
  teams: StandingRow[],
  results: MatchPlayed[],
): StandingRow[] {
  // First partition by overall points; resolve each points-bucket via Art. 13.
  const byPts = [...teams].sort((a, b) => b.pts - a.pts)
  const ranked: StandingRow[] = []
  let i = 0
  while (i < byPts.length) {
    let j = i + 1
    while (j < byPts.length && byPts[j]!.pts === byPts[i]!.pts) j++
    const bucket = byPts.slice(i, j)
    ranked.push(...(bucket.length === 1 ? bucket : resolveTie(bucket, results)))
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
    const results: MatchPlayed[] = []

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
 *   Sorting criteria implemented: pts → GD → GF (FIFA's a, b, c).
 *   Conduct score (d) and FIFA ranking (e, f) are not implementable here.
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

  // Art. 13 para 2: a → b → c (d, e, f omitted; falls to insertion order)
  thirds.sort((a, b) =>
    b.pts - a.pts ||
    b.gd  - a.gd  ||
    b.gf  - a.gf
  )

  return { winners, runners, thirds: thirds.slice(0, 8) }
}

// ─── Annexe C: assign best-8 thirds to R32 slots ───────────────────────────

/**
 * R32 match IDs that receive a 3rd-placed team, and which group letters are
 * eligible to fill each slot (Art. 12.6 / Annexe C).
 *
 * Each slot has exactly 5 eligible source groups. The 8 slots are designed
 * so that for any of the C(12,8) = 495 possible qualifying-thirds combinations,
 * at least one valid bijection exists (by Hall's theorem).
 */
export const T3_SLOT_ELIGIBILITY: Record<string, readonly GroupLetter[]> = {
  r32_02: ['A', 'B', 'C', 'D', 'F'],
  r32_05: ['C', 'D', 'F', 'G', 'H'],
  r32_07: ['C', 'E', 'F', 'H', 'I'],
  r32_08: ['E', 'H', 'I', 'J', 'K'],
  r32_09: ['B', 'E', 'F', 'I', 'J'],
  r32_10: ['A', 'E', 'H', 'I', 'J'],
  r32_13: ['E', 'F', 'G', 'I', 'J'],
  r32_15: ['D', 'E', 'I', 'J', 'L'],
}

const T3_SLOT_IDS = Object.keys(T3_SLOT_ELIGIBILITY)

/**
 * Assign the 8 best thirds to specific R32 match slots, respecting Art. 12.6
 * eligibility. Returns a map of R32 match ID → TeamId.
 *
 * Backtracking finds a valid bipartite matching: each third is placed in a
 * slot whose eligible-groups set contains the third's source group. The
 * exhaustive search guarantees a valid assignment exists if one is possible.
 *
 * NOTE: Annexe C of the FIFA regulations specifies ONE particular assignment
 * per combination (out of possibly several valid matchings). The full 495-row
 * table is not encoded here — this function picks the FIRST valid matching
 * found in slot order, which is deterministic but may differ from FIFA's
 * exact choice. The bolão's scoring is unaffected because admin enters actual
 * results by match ID after each game.
 *
 * Returns {} if fewer than 8 thirds have group info or no valid matching exists.
 */
export function assignThirdsToSlots(
  thirds: StandingRow[],
): Record<string, TeamId> {
  const eight = thirds.slice(0, 8)
  if (eight.length === 0) return {}
  // Must have group info on every third (set by getQualified)
  if (eight.some(t => !t.group)) return {}

  const assignment: Record<string, TeamId> = {}
  const used = new Set<string>()

  function backtrack(idx: number): boolean {
    if (idx === eight.length) return true
    const third = eight[idx]!
    const group = third.group as GroupLetter
    for (const slotId of T3_SLOT_IDS) {
      if (used.has(slotId)) continue
      if (!T3_SLOT_ELIGIBILITY[slotId]!.includes(group)) continue
      used.add(slotId)
      assignment[slotId] = third.id
      if (backtrack(idx + 1)) return true
      used.delete(slotId)
      delete assignment[slotId]
    }
    return false
  }

  return backtrack(0) ? assignment : {}
}
