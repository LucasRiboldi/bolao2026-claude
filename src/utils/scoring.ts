import type { GroupBets, KnockoutBets, Results, ScoringConfig, ScoreResult } from '@/types'
import { DEFAULT_SCORING } from '@/data/bracket'

export function calculateScore(
  groupBets: GroupBets,
  knockoutBets: KnockoutBets,
  results: Results,
  scoring: ScoringConfig = DEFAULT_SCORING,
): ScoreResult {
  let pts = 0
  const breakdown = { exact: 0, result: 0, ko: 0, bonus: 0 }

  // ── Group stage ──────────────────────────────────────────────────────────
  const gsResults = results.groupStage ?? {}
  for (const [gameId, result] of Object.entries(gsResults)) {
    const bet = groupBets[gameId]
    if (!bet) continue
    const bH = parseInt(bet.homeGoals, 10)
    const bA = parseInt(bet.awayGoals, 10)
    const rH = parseInt(result.homeGoals, 10)
    const rA = parseInt(result.awayGoals, 10)
    if (isNaN(bH) || isNaN(bA) || isNaN(rH) || isNaN(rA)) continue

    if (bH === rH && bA === rA) {
      pts += scoring.exactScore
      breakdown.exact++
    } else if (Math.sign(bH - bA) === Math.sign(rH - rA)) {
      pts += scoring.correctResult
      breakdown.result++
    }
  }

  // ── Knockout ─────────────────────────────────────────────────────────────
  const koResults = results.knockout ?? {}
  const advanced = {
    r32: new Set<string>(),
    r16: new Set<string>(),
    qf:  new Set<string>(),
    sf:  new Set<string>(),
  }
  for (const [matchId, winnerId] of Object.entries(koResults)) {
    if (matchId.startsWith('r32_')) advanced.r32.add(winnerId)
    else if (matchId.startsWith('r16_')) advanced.r16.add(winnerId)
    else if (matchId.startsWith('qf_'))  advanced.qf.add(winnerId)
    else if (matchId.startsWith('sf_'))  advanced.sf.add(winnerId)
  }

  for (const [matchId, betTeam] of Object.entries(knockoutBets)) {
    if (!betTeam || matchId === 'final' || matchId === 'third') continue
    let pointsForHit = 0
    if      (matchId.startsWith('r32_') && advanced.r32.has(betTeam)) pointsForHit = scoring.r32Winner
    else if (matchId.startsWith('r16_') && advanced.r16.has(betTeam)) pointsForHit = scoring.r16Winner
    else if (matchId.startsWith('qf_')  && advanced.qf.has(betTeam))  pointsForHit = scoring.qfWinner
    else if (matchId.startsWith('sf_')  && advanced.sf.has(betTeam))  pointsForHit = scoring.sfWinner
    if (pointsForHit > 0) { pts += pointsForHit; breakdown.ko++ }
  }

  // Third place exact
  if (knockoutBets['third'] && koResults['third'] && knockoutBets['third'] === koResults['third']) {
    pts += scoring.r32Winner
    breakdown.ko++
  }

  // Champion exact
  const champion = koResults['final']
  if (champion && knockoutBets['final'] === champion) {
    pts += scoring.championScore
    breakdown.ko++
  }

  // Finalist bonus (both SF winners correct)
  const betSf01 = knockoutBets['sf_01']
  const betSf02 = knockoutBets['sf_02']
  if (betSf01 && betSf02 && advanced.sf.has(betSf01) && advanced.sf.has(betSf02)) {
    pts += scoring.finalistBonus
    breakdown.bonus = scoring.finalistBonus
  }

  return { pts, breakdown }
}

export function sortRanking<T extends { pts: number; breakdown?: { exact: number; result: number; ko: number }; name: string }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) =>
    b.pts - a.pts ||
    (b.breakdown?.exact  ?? 0) - (a.breakdown?.exact  ?? 0) ||
    (b.breakdown?.result ?? 0) - (a.breakdown?.result ?? 0) ||
    (b.breakdown?.ko     ?? 0) - (a.breakdown?.ko     ?? 0) ||
    a.name.localeCompare(b.name)
  )
}
