/**
 * Compact serialization for group-stage bets and results.
 *
 * Disk format: `{ A_0: "2x1", B_1: "0x0" }`
 * Empty/blank values are OMITTED (null entry) — saves bytes for unfilled
 * games and lets the loader know they shouldn't count as bets.
 *
 * Memory format (unchanged): `{ A_0: { homeGoals: "2", awayGoals: "1" } }`
 *
 * Backward compatibility: decode() accepts BOTH the old object form and the
 * new string form per entry, so old Firestore docs continue to work without
 * a migration step. Writes always use the new string form.
 *
 * Size comparison (72-game group-stage doc):
 *   Old: ~2.9 KB   New: ~0.9 KB   → ~70% smaller
 */
import type { GroupBets, GoalBet } from '@/types'

const ENTRY_RE = /^(\d+)x(\d+)$/

/** Encode a single bet. Returns null when goals are empty/invalid. */
export function encodeBet(bet: GoalBet | undefined | null): string | null {
  if (!bet) return null
  const h = bet.homeGoals?.trim()
  const a = bet.awayGoals?.trim()
  if (!h || !a) return null
  const hN = parseInt(h, 10)
  const aN = parseInt(a, 10)
  if (Number.isNaN(hN) || Number.isNaN(aN)) return null
  return `${hN}x${aN}`
}

/** Decode either format: "2x1" string or { homeGoals, awayGoals } object. */
export function decodeBet(value: unknown): GoalBet | null {
  if (typeof value === 'string') {
    const m = ENTRY_RE.exec(value)
    if (!m) return null
    return { homeGoals: m[1]!, awayGoals: m[2]! }
  }
  if (value && typeof value === 'object') {
    const o = value as { homeGoals?: unknown; awayGoals?: unknown }
    if (typeof o.homeGoals === 'string' && typeof o.awayGoals === 'string') {
      return { homeGoals: o.homeGoals, awayGoals: o.awayGoals }
    }
  }
  return null
}

/**
 * Encode an entire GroupBets map to its compact disk form.
 * Empty entries are dropped — they don't need to occupy bytes in Firestore.
 */
export function encodeGroupBets(bets: GroupBets): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [gameId, bet] of Object.entries(bets)) {
    const encoded = encodeBet(bet)
    if (encoded !== null) out[gameId] = encoded
  }
  return out
}

/** Decode a Firestore doc (string- or object-valued entries) into GroupBets. */
export function decodeGroupBets(raw: Record<string, unknown>): GroupBets {
  const out: GroupBets = {}
  for (const [gameId, value] of Object.entries(raw)) {
    const decoded = decodeBet(value)
    if (decoded) out[gameId] = decoded
  }
  return out
}
