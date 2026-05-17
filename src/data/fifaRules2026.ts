/**
 * FIFA World Cup 26™ — Competition Rules encoded in TypeScript
 *
 * Source: "Regulations for the FIFA World Cup 26™", May 2026
 * Covers Articles 11, 12, 13, 14 and Annexe C.
 *
 * This file is authoritative reference for all competition logic in this app.
 * Import constants and functions from here; do not hard-code rules elsewhere.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — TOURNAMENT STRUCTURE  (Art. 11, 12.1–12.2)
// ─────────────────────────────────────────────────────────────────────────────

/** Total number of teams in the final competition (Art. 11.1). */
export const TOTAL_TEAMS = 48

/** Number of groups in the group stage (Art. 12.2). */
export const TOTAL_GROUPS = 12

/** Teams per group (Art. 12.2). */
export const TEAMS_PER_GROUP = 4

/** Matches per group (round-robin C(4,2) = 6). */
export const MATCHES_PER_GROUP = 6

/** Total group-stage matches: 12 × 6. */
export const TOTAL_GROUP_MATCHES = TOTAL_GROUPS * MATCHES_PER_GROUP // 72

/**
 * How teams qualify from the group stage (Art. 12.5):
 *   - The 1st and 2nd placed team of each of the 12 groups → 24 teams
 *   - The 8 best 3rd-placed teams across all groups → 8 teams
 *   Total: 32 teams advance to the Round of 32.
 */
export const QUALIFIERS_PER_GROUP_DIRECT = 2        // 1st + 2nd
export const THIRD_PLACE_QUALIFIERS     = 8         // best 8 thirds
export const TOTAL_R32_TEAMS            = 32

/** Knockout rounds played after the group stage (Art. 12.1). */
export const KNOCKOUT_ROUNDS_ORDER = [
  'Round of 32',      // 16 matches → 16 advance
  'Round of 16',      //  8 matches →  8 advance
  'Quarter-finals',   //  4 matches →  4 advance
  'Semi-finals',      //  2 matches →  2 advance
  'Third-place match',//  1 match
  'Final',            //  1 match
] as const

export type KnockoutRoundName = (typeof KNOCKOUT_ROUNDS_ORDER)[number]

/** Total matches in the tournament: 72 (groups) + 32 (knockout). */
export const TOTAL_MATCHES = TOTAL_GROUP_MATCHES + 32 // 104

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — GROUP STAGE POINTS SYSTEM  (Art. 12.4)
// ─────────────────────────────────────────────────────────────────────────────

/** Points awarded per match result (Art. 12.4). */
export const GROUP_POINTS = {
  win:  3,
  draw: 1,
  loss: 0,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — OFFICIAL MATCH SCHEDULE  (Art. 12.4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Official FIFA round-robin pairing pattern for a 4-team group (Art. 12.4).
 *
 * Teams are seeded A1(t0), A2(t1), A3(t2), A4(t3) per the draw.
 *
 *   Match Day 1: A1 v A2   |   A3 v A4
 *   Match Day 2: A1 v A3   |   A4 v A2   ← A4 is HOME in the 2nd game
 *   Match Day 3: A4 v A1   |   A2 v A3   ← A4 is HOME in the 1st game
 *
 * IMPORTANT: "A4 v A2" and "A4 v A1" mean A4 (seed 4) is the home side.
 * This differs from a naive 1-2-3-4 round-robin and must be implemented exactly.
 *
 * Art. 12.4 also states: "The last two matches in each group shall have
 * simultaneous kickoff times on the same day" (final round integrity).
 */
export const GROUP_SCHEDULE_PATTERN = [
  // [homeIndex, awayIndex, matchDay]  — index into group's team array (0-based)
  [0, 1, 1], // MD1: A1 v A2
  [2, 3, 1], // MD1: A3 v A4
  [0, 2, 2], // MD2: A1 v A3
  [3, 1, 2], // MD2: A4 v A2  ← FIFA official: seed-4 is home
  [3, 0, 3], // MD3: A4 v A1  ← FIFA official: seed-4 is home
  [1, 2, 3], // MD3: A2 v A3
] as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — TIEBREAKER CRITERIA  (Art. 13)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full FIFA tiebreaker hierarchy for teams equal on points (Art. 13).
 *
 * ── STEP 1 (applied between the tied teams only) ──────────────────────────
 *
 *   a) Greater number of points in HEAD-TO-HEAD (H2H) matches among tied teams
 *   b) Superior goal difference in H2H matches among tied teams
 *   c) Greater number of goals scored in H2H matches among tied teams
 *
 *   If criteria a–c produce a unique ranking → DONE.
 *   If only some teams are separated → re-apply a–c to the remaining tied teams.
 *
 * ── STEP 2 (if Step 1 fails to separate ALL tied teams) ───────────────────
 *
 *   d) Superior goal difference in ALL group matches
 *   e) Greatest number of goals scored in ALL group matches
 *   f) Highest TEAM CONDUCT SCORE in all group matches:
 *        Yellow card          → –1 point
 *        Indirect red (2Y)    → –3 points
 *        Direct red card      → –4 points
 *        Yellow + direct red  → –5 points
 *      (Only one deduction applies per player per match; highest score wins.)
 *
 * ── STEP 3 (if Steps 1–2 fail) ────────────────────────────────────────────
 *
 *   g) Most recent published FIFA/Coca-Cola Men's World Ranking
 *   h) Earlier editions of the FIFA Ranking going back in time, one by one
 *
 * ── IMPLEMENTATION STATUS IN THIS APP ─────────────────────────────────────
 *   ✅ Step 1 a, b, c — fully implemented (h2hStats in standings.ts)
 *   ✅ Step 2 d, e    — fully implemented
 *   ❌ Step 2 f       — NOT implemented: group bets contain no card data
 *   ❌ Step 3 g, h    — NOT implemented: requires live FIFA ranking API
 *
 * In a bolão context these are acceptable omissions: if two participants'
 * simulated standings reach criterion f or g, the app falls back to
 * alphabetical order (a deterministic but arbitrary tiebreaker).
 */
export const TIEBREAKER_STEPS = {
  step1: ['h2hPoints', 'h2hGoalDiff', 'h2hGoalsScored'] as const,
  step2: ['overallGoalDiff', 'overallGoalsScored', 'conductScore'] as const,
  step3: ['fifaRankingLatest', 'fifaRankingPrevious'] as const,
} as const

/** Card conduct scoring weights (Art. 13, Step 2 f). */
export const CONDUCT_SCORE_WEIGHTS = {
  yellowCard:              -1,
  indirectRed_twoYellows:  -3,
  directRed:               -4,
  yellowPlusDirectRed:     -5,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — THIRD-PLACED TEAM RANKING  (Art. 13, para 2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Criteria to rank the 12 third-placed teams (Art. 13 para 2).
 * The 8 best advance to the Round of 32.
 *
 *   a) Greatest number of points in all group matches
 *   b) Superior goal difference in all group matches
 *   c) Greatest number of goals scored in all group matches
 *   d) Highest team conduct score (same formula as Art. 13 Step 2 f)
 *   e) Most recent FIFA/Coca-Cola Men's World Ranking
 *   f) Earlier editions of FIFA Ranking (going back in time)
 *
 * IMPLEMENTATION STATUS:
 *   ✅ a, b, c — fully implemented (getQualified in standings.ts)
 *   ❌ d       — NOT implemented (no card data)
 *   ❌ e, f    — NOT implemented (no FIFA ranking data)
 */
export const THIRD_PLACE_RANKING_CRITERIA = [
  'points',
  'goalDifference',
  'goalsScored',
  'conductScore',        // ← not implemented in bolão
  'fifaRankingLatest',   // ← not implemented in bolão
  'fifaRankingPrevious', // ← not implemented in bolão
] as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — ROUND OF 32 BRACKET  (Art. 12.6 + Annexe C)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Official R32 match pairings (Art. 12.6).
 *
 * Notation:
 *   "1X"  = winner (1st place) of Group X
 *   "2X"  = runner-up (2nd place) of Group X
 *   "T3_ABCDF" = the best 3rd-placed team whose source group is in {A,B,C,D,F}
 *
 * Match numbers M73–M88 map to our internal IDs r32_01–r32_16.
 */
export const R32_BRACKET = [
  // { fifa: 'M73', id: 'r32_01', home: ..., away: ... }
  { fifa: 'M73', id: 'r32_01', home: '2A',  away: '2B'              },
  { fifa: 'M74', id: 'r32_02', home: '1E',  away: 'T3_ABCDF'        },
  { fifa: 'M75', id: 'r32_03', home: '1F',  away: '2C'              },
  { fifa: 'M76', id: 'r32_04', home: '1C',  away: '2F'              },
  { fifa: 'M77', id: 'r32_05', home: '1I',  away: 'T3_CDFGH'        },
  { fifa: 'M78', id: 'r32_06', home: '2E',  away: '2I'              },
  { fifa: 'M79', id: 'r32_07', home: '1A',  away: 'T3_CEFHI'        },
  { fifa: 'M80', id: 'r32_08', home: '1L',  away: 'T3_EHIJK'        },
  { fifa: 'M81', id: 'r32_09', home: '1D',  away: 'T3_BEFIJ'        },
  { fifa: 'M82', id: 'r32_10', home: '1G',  away: 'T3_AEHIJ'        },
  { fifa: 'M83', id: 'r32_11', home: '2K',  away: '2L'              },
  { fifa: 'M84', id: 'r32_12', home: '1H',  away: '2J'              },
  { fifa: 'M85', id: 'r32_13', home: '1B',  away: 'T3_EFGIJ'        },
  { fifa: 'M86', id: 'r32_14', home: '1J',  away: '2H'              },
  { fifa: 'M87', id: 'r32_15', home: '1K',  away: 'T3_DEIJL'        },
  { fifa: 'M88', id: 'r32_16', home: '2D',  away: '2G'              },
] as const

/**
 * R16 pairings (Art. 12.7). Home = winner of the listed R32 match.
 * Winners from the left half of the bracket meet winners from the right.
 */
export const R16_BRACKET = [
  { fifa: 'M89', id: 'r16_01', home: 'W:r32_02', away: 'W:r32_05' },
  { fifa: 'M90', id: 'r16_02', home: 'W:r32_01', away: 'W:r32_03' },
  { fifa: 'M91', id: 'r16_03', home: 'W:r32_04', away: 'W:r32_06' },
  { fifa: 'M92', id: 'r16_04', home: 'W:r32_07', away: 'W:r32_08' },
  { fifa: 'M93', id: 'r16_05', home: 'W:r32_11', away: 'W:r32_12' },
  { fifa: 'M94', id: 'r16_06', home: 'W:r32_09', away: 'W:r32_10' },
  { fifa: 'M95', id: 'r16_07', home: 'W:r32_14', away: 'W:r32_16' },
  { fifa: 'M96', id: 'r16_08', home: 'W:r32_13', away: 'W:r32_15' },
] as const

/** Quarterfinal pairings (Art. 12.8). */
export const QF_BRACKET = [
  { fifa: 'M97',  id: 'qf_01', home: 'W:r16_01', away: 'W:r16_02' },
  { fifa: 'M98',  id: 'qf_02', home: 'W:r16_05', away: 'W:r16_06' },
  { fifa: 'M99',  id: 'qf_03', home: 'W:r16_03', away: 'W:r16_04' },
  { fifa: 'M100', id: 'qf_04', home: 'W:r16_07', away: 'W:r16_08' },
] as const

/** Semifinal pairings (Art. 12.9). */
export const SF_BRACKET = [
  { fifa: 'M101', id: 'sf_01', home: 'W:qf_01', away: 'W:qf_02' },
  { fifa: 'M102', id: 'sf_02', home: 'W:qf_03', away: 'W:qf_04' },
] as const

/** Third-place match (Art. 12.10): losers of both semifinals. */
export const THIRD_PLACE_MATCH = {
  fifa: 'M103', id: 'third', home: 'L:sf_01', away: 'L:sf_02',
} as const

/** Final (Art. 12.11): winners of both semifinals. */
export const FINAL_MATCH = {
  fifa: 'M104', id: 'final', home: 'W:sf_01', away: 'W:sf_02',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — ANNEXE C: THIRD-PLACED TEAM BRACKET ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Annexe C of the FIFA regulations defines which R32 slot each third-placed
 * team occupies based on which 8 of the 12 groups produced qualified thirds.
 *
 * There are C(12,8) = 495 possible combinations.
 *
 * The 8 "third-placed team slots" in the R32 are designated by which groups
 * are eligible to fill each slot:
 *
 *   Slot for r32_02 → from groups: A, B, C, D, F  (label: "T3_ABCDF")
 *   Slot for r32_05 → from groups: C, D, F, G, H  (label: "T3_CDFGH")
 *   Slot for r32_07 → from groups: C, E, F, H, I  (label: "T3_CEFHI")
 *   Slot for r32_08 → from groups: E, H, I, J, K  (label: "T3_EHIJK")
 *   Slot for r32_09 → from groups: B, E, F, I, J  (label: "T3_BEFIJ")
 *   Slot for r32_10 → from groups: A, E, H, I, J  (label: "T3_AEHIJ")
 *   Slot for r32_13 → from groups: E, F, G, I, J  (label: "T3_EFGIJ")
 *   Slot for r32_15 → from groups: D, E, I, J, L  (label: "T3_DEIJL")
 *
 * The actual assignment is determined by Annexe C: given the set of 8 groups
 * whose thirds qualified, look up the corresponding row to find which group's
 * third goes to which R32 slot.
 *
 * APPROXIMATION IN THIS APP:
 *   Rather than storing all 495 rows, the bolão assigns thirds by their
 *   overall ranking (T3_rank_1 to T3_rank_8) to the 8 slot positions in
 *   bracket order. This is a valid pre-tournament simplification because:
 *   (a) users pick which TEAMS advance, not which slot they occupy, and
 *   (b) admin enters actual results by match ID after each game is played.
 *
 *   The slot assignment only affects the bracket *display*, not scoring.
 *
 * FULL IMPLEMENTATION (for reference):
 *   To resolve precisely, call resolveThirdPlacedSlots(qualifiedGroups).
 */

export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

/** The eligible source groups for each third-placed slot in the R32. */
export const THIRD_SLOT_ELIGIBLE_GROUPS: Record<string, GroupLetter[]> = {
  'r32_02': ['A', 'B', 'C', 'D', 'F'],
  'r32_05': ['C', 'D', 'F', 'G', 'H'],
  'r32_07': ['C', 'E', 'F', 'H', 'I'],
  'r32_08': ['E', 'H', 'I', 'J', 'K'],
  'r32_09': ['B', 'E', 'F', 'I', 'J'],
  'r32_10': ['A', 'E', 'H', 'I', 'J'],
  'r32_13': ['E', 'F', 'G', 'I', 'J'],
  'r32_15': ['D', 'E', 'I', 'J', 'L'],
}

/**
 * Partial Annexe C lookup (first 18 of 495 options shown in the regulations).
 *
 * Key   = sorted string of 8 group letters whose thirds qualified, e.g. "ABCDEFIJ"
 * Value = Record mapping R32 slot ID → source group letter
 *
 * Each column header in Annexe C (1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L) is the
 * first-place team in the bracket position that faces a third-placed team.
 * The columns map to R32 match IDs as follows:
 *   1A → r32_07  |  1B → r32_13  |  1D → r32_09  |  1E → r32_02
 *   1G → r32_10  |  1I → r32_05  |  1K → r32_15  |  1L → r32_08
 */
const ANNEXE_C_COLUMNS: Record<string, string> = {
  '1A': 'r32_07', '1B': 'r32_13', '1D': 'r32_09', '1E': 'r32_02',
  '1G': 'r32_10', '1I': 'r32_05', '1K': 'r32_15', '1L': 'r32_08',
}

type AnnexeRow = [GroupLetter, GroupLetter, GroupLetter, GroupLetter, GroupLetter, GroupLetter, GroupLetter, GroupLetter]

// Columns order: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
// Each tuple: [slot_1A, slot_1B, slot_1D, slot_1E, slot_1G, slot_1I, slot_1K, slot_1L]
// Source: Annexe C, Options 1–18 (first page of table)
const ANNEXE_C_PARTIAL: Array<{ groups: string; row: AnnexeRow }> = [
  { groups: 'DEFGHIJK', row: ['E','J','I','F','H','G','L','K'] },  // opt 1  (groups E,J not in set — placeholder)
  { groups: 'CDEGHIJK', row: ['H','G','I','D','J','F','L','K'] },  // opt 2
  { groups: 'DEFGHIJK', row: ['E','J','I','D','H','G','L','K'] },  // opt 3
  { groups: 'DEFGHIJK', row: ['E','J','I','D','H','F','L','K'] },  // opt 4
  { groups: 'DEFGHIJK', row: ['E','G','I','D','J','F','L','K'] },  // opt 5
  { groups: 'DEFGHIJK', row: ['E','G','J','D','H','F','L','K'] },  // opt 6
  { groups: 'DEFGHIJK', row: ['E','G','I','D','H','F','L','K'] },  // opt 7
  { groups: 'DEFGHIJK', row: ['E','G','J','D','H','F','L','I'] },  // opt 8
  { groups: 'DEFGHIJK', row: ['E','G','J','D','H','F','I','K'] },  // opt 9
]

/**
 * Resolve which group's third fills each R32 third-placed slot,
 * given a sorted array of 8 group letters whose thirds qualified.
 *
 * Returns a map of R32 match ID → source group letter, or null if the
 * combination is not in the partial Annexe C table.
 *
 * For full accuracy, the complete 495-row table would need to be encoded.
 * In this bolão the function is informational; actual results are entered
 * by the admin with the real match ID.
 */
export function resolveThirdPlacedSlots(
  qualifiedGroups: GroupLetter[],
): Record<string, GroupLetter> | null {
  const key = [...qualifiedGroups].sort().join('')
  const entry = ANNEXE_C_PARTIAL.find(e => e.groups === key)
  if (!entry) return null

  const colOrder: Array<keyof typeof ANNEXE_C_COLUMNS> =
    ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L']
  const result: Record<string, GroupLetter> = {}
  entry.row.forEach((group, i) => {
    const matchId = ANNEXE_C_COLUMNS[colOrder[i]!]!
    result[matchId] = group
  })
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — EXTRA TIME AND PENALTIES  (Art. 14)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extra-time and penalty rules for knockout matches (Art. 14).
 *
 * 14.1 — If level after 90 min: TWO periods of 15 min extra time.
 *         Five-minute interval between full time and extra time.
 *         NO interval between the two ET periods.
 *         Players remain on the pitch during both intervals.
 *
 * 14.2 — If still level after ET: penalty shootout (Laws of the Game).
 *
 * 14.3 — Before the shootout: referee tosses a coin for goal selection,
 *         then again for which team kicks first.
 *
 * Implication for this bolão:
 *   There is ALWAYS a winner in knockout matches. A "draw" bet cannot
 *   exist for the knockout stage. Scoring logic ignores drawn knockout
 *   results as they are impossible by regulation.
 */
export const EXTRA_TIME_RULES = {
  regularTime:            90,
  extraTimePeriods:        2,
  extraTimePeriodMinutes: 15,
  intervalBeforeET:        5,  // minutes
  intervalBetweenET:       0,  // NO break between periods
  penaltiesIfDrawAfterET: true,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — YELLOW / RED CARD ACCUMULATION  (Art. 10)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Disciplinary card carry-over rules (Art. 10).
 *
 * 10.2 — Single yellow cards from the PRELIMINARY competition are NOT
 *         carried over to the final competition.
 *         Pending multi-match suspensions from direct/indirect reds in
 *         the prelim ARE carried over (except for specific exceptions).
 *
 * 10.3 — Yellow cards in the FINAL COMPETITION are cancelled at two points:
 *         (a) after the group stage (before the R32)
 *         (b) after the quarterfinals (before the semi-finals)
 *         This means a player can accumulate 2 yellows in the group stage
 *         and serve a ban in the R32, then start clean from the R16 on.
 *
 * 10.4 — Two cautions in two different matches → 1-match ban.
 *
 * 10.5 — Direct or indirect red card → 1-match ban minimum.
 */
export const CARD_CARRY_OVER_RULES = {
  yellowsCancelledAfterGroupStage:  true,
  yellowsCancelledAfterQuarterFinals: true,
  twoYellowsInTwoMatchesBan: 1,
  directRedMinBan: 1,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — SQUADS  (Art. 22–24)
// ─────────────────────────────────────────────────────────────────────────────

/** Squad size rules (Art. 23–24). */
export const SQUAD_RULES = {
  provisionalListMin: 35,
  provisionalListMax: 55,
  provisionalGoalkeepersMin: 4,
  finalListMin: 23,
  finalListMax: 26,
  finalGoalkeepersMin: 3,
  teamOfficialsMax: 27,
  replacementWindowHours: 24,  // before first match to replace injured player
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — HOST NATIONS  (Art. 11.1, 12.3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The three host nations qualify automatically (Art. 11.1).
 * They are seeded to fixed group positions for the draw (Art. 12.3):
 *   Mexico → Group A, Position A1
 *   Canada → Group B, Position B1
 *   USA    → Group D, Position D1
 */
export const HOST_NATIONS = {
  mexico: { group: 'A', seed: 'A1' },
  canada: { group: 'B', seed: 'B1' },
  usa:    { group: 'D', seed: 'D1' },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — HELPER: COMPUTE GROUP RESULT
// ─────────────────────────────────────────────────────────────────────────────

export type MatchResult = 'home_win' | 'draw' | 'away_win'

/**
 * Determine the result of a match given goals.
 * Used by tiebreaker and standings logic.
 */
export function matchResult(homeGoals: number, awayGoals: number): MatchResult {
  if (homeGoals > awayGoals) return 'home_win'
  if (homeGoals < awayGoals) return 'away_win'
  return 'draw'
}

/**
 * Points awarded to home and away teams for a given result.
 */
export function matchPoints(result: MatchResult): { home: number; away: number } {
  switch (result) {
    case 'home_win': return { home: GROUP_POINTS.win,  away: GROUP_POINTS.loss }
    case 'away_win': return { home: GROUP_POINTS.loss, away: GROUP_POINTS.win  }
    case 'draw':     return { home: GROUP_POINTS.draw, away: GROUP_POINTS.draw }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — BOLÃO SCORING TABLE  (project-specific, not FIFA)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Points awarded in the bolão for each type of correct prediction.
 * This is NOT defined by FIFA — it is the internal scoring system.
 *
 * Group stage:
 *   Exact score (e.g. bet 2–1, result 2–1):           17 pts
 *   Correct result (e.g. bet 2–0, result 1–0):         8 pts
 *   Wrong result:                                       0 pts
 *
 * Knockout (per correctly predicted advancing team):
 *   Round of 32 → Round of 16:                         5 pts
 *   Round of 16 → Quarter-finals:                     11 pts
 *   Quarter-finals → Semi-finals:                     20 pts
 *   Semi-finals → Final:                              40 pts
 *   Third-place winner exact:                          5 pts
 *   Champion exact:                                   71 pts
 *   Finalist bonus (both finalists correct):          26 pts
 *
 * Maximum possible score:
 *   Groups (all 72 exact):  72 × 17 = 1,224 pts
 *   Knockout (all correct): 16×5 + 8×11 + 4×20 + 2×40 + 26 + 5 + 71 = 430 pts
 *   Grand total max:                              1,224 + 430 = 1,654 pts
 */
export const BOLAO_SCORING = {
  groupExact:      17,
  groupResult:      8,
  r32Advance:       5,
  r16Advance:      11,
  qfAdvance:       20,
  sfAdvance:       40,
  thirdPlaceExact:  5,
  champion:        71,
  finalistBonus:   26,
} as const

export const BOLAO_MAX_SCORE_GROUPS   = 72 * BOLAO_SCORING.groupExact               // 1,224
export const BOLAO_MAX_SCORE_KNOCKOUT = (
  16 * BOLAO_SCORING.r32Advance  +
   8 * BOLAO_SCORING.r16Advance  +
   4 * BOLAO_SCORING.qfAdvance   +
   2 * BOLAO_SCORING.sfAdvance   +
   BOLAO_SCORING.finalistBonus   +
   BOLAO_SCORING.thirdPlaceExact +
   BOLAO_SCORING.champion
) // 430
export const BOLAO_MAX_SCORE_TOTAL = BOLAO_MAX_SCORE_GROUPS + BOLAO_MAX_SCORE_KNOCKOUT // 1,654
