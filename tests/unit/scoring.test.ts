import { describe, it, expect } from 'vitest'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import type { GroupBets, KnockoutBets, Results } from '@/types'

const emptyResults: Results = { groupStage: {}, knockout: {} }

describe('calculateScore', () => {
  it('returns 0 pts for empty bets', () => {
    const { pts } = calculateScore({}, {}, emptyResults)
    expect(pts).toBe(0)
  })

  it('scores exact group-stage result correctly', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '2', awayGoals: '1' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '2', awayGoals: '1' } },
      knockout: {},
    }
    const { pts, breakdown } = calculateScore(groupBets, {}, results)
    expect(pts).toBe(DEFAULT_SCORING.exactScore)
    expect(breakdown.exact).toBe(1)
    expect(breakdown.result).toBe(0)
  })

  it('scores correct result (wrong score) for group stage', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '3', awayGoals: '0' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '2', awayGoals: '1' } },
      knockout: {},
    }
    const { pts, breakdown } = calculateScore(groupBets, {}, results)
    expect(pts).toBe(DEFAULT_SCORING.correctResult)
    expect(breakdown.result).toBe(1)
    expect(breakdown.exact).toBe(0)
  })

  it('scores 0 for wrong result', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '1', awayGoals: '2' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '2', awayGoals: '1' } },
      knockout: {},
    }
    const { pts } = calculateScore(groupBets, {}, results)
    expect(pts).toBe(0)
  })

  it('scores draw correctly — exact', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '1', awayGoals: '1' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '1', awayGoals: '1' } },
      knockout: {},
    }
    const { pts, breakdown } = calculateScore(groupBets, {}, results)
    expect(pts).toBe(DEFAULT_SCORING.exactScore)
    expect(breakdown.exact).toBe(1)
  })

  it('scores draw correctly — correct result but different score', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '0', awayGoals: '0' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '2', awayGoals: '2' } },
      knockout: {},
    }
    const { pts, breakdown } = calculateScore(groupBets, {}, results)
    expect(pts).toBe(DEFAULT_SCORING.correctResult)
    expect(breakdown.result).toBe(1)
  })

  it('skips bets with empty goals', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '', awayGoals: '' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '1', awayGoals: '0' } },
      knockout: {},
    }
    const { pts } = calculateScore(groupBets, {}, results)
    expect(pts).toBe(0)
  })

  it('scores R32 knockout winner', () => {
    const koBets: KnockoutBets = { r32_01: 'brazil' }
    const results: Results = {
      groupStage: {},
      knockout: { r32_01: 'brazil' },
    }
    const { pts, breakdown } = calculateScore({}, koBets, results)
    expect(pts).toBe(DEFAULT_SCORING.r32Winner)
    expect(breakdown.ko).toBe(1)
  })

  it('scores champion correctly', () => {
    const koBets: KnockoutBets = { final: 'brazil' }
    const results: Results = { groupStage: {}, knockout: { final: 'brazil' } }
    const { pts, breakdown } = calculateScore({}, koBets, results)
    expect(pts).toBe(DEFAULT_SCORING.championScore)
    expect(breakdown.ko).toBe(1)
  })

  it('scores finalist bonus when both SF winners are correct', () => {
    const koBets: KnockoutBets = { sf_01: 'brazil', sf_02: 'argentina' }
    const results: Results = {
      groupStage: {},
      knockout: { sf_01: 'brazil', sf_02: 'argentina' },
    }
    const { pts, breakdown } = calculateScore({}, koBets, results)
    // sfWinner × 2 + finalistBonus
    expect(pts).toBe(DEFAULT_SCORING.sfWinner * 2 + DEFAULT_SCORING.finalistBonus)
    expect(breakdown.bonus).toBe(DEFAULT_SCORING.finalistBonus)
  })

  it('does NOT award finalist bonus for partial SF correct', () => {
    const koBets: KnockoutBets = { sf_01: 'brazil', sf_02: 'germany' }
    const results: Results = {
      groupStage: {},
      knockout: { sf_01: 'brazil', sf_02: 'argentina' },
    }
    const { pts, breakdown } = calculateScore({}, koBets, results)
    expect(pts).toBe(DEFAULT_SCORING.sfWinner)
    expect(breakdown.bonus).toBe(0)
  })

  it('respects custom scoring config', () => {
    const groupBets: GroupBets = { A_0: { homeGoals: '2', awayGoals: '1' } }
    const results: Results = {
      groupStage: { A_0: { homeGoals: '2', awayGoals: '1' } },
      knockout: {},
    }
    const customScoring = { ...DEFAULT_SCORING, exactScore: 30 }
    const { pts } = calculateScore(groupBets, {}, results, customScoring)
    expect(pts).toBe(30)
  })
})

describe('sortRanking', () => {
  it('sorts by pts descending', () => {
    const entries = [
      { pts: 10, name: 'B', breakdown: { exact: 0, result: 0, ko: 0 } },
      { pts: 20, name: 'A', breakdown: { exact: 0, result: 0, ko: 0 } },
    ]
    const sorted = sortRanking(entries)
    expect(sorted[0]!.pts).toBe(20)
  })

  it('uses exact as tiebreaker', () => {
    const entries = [
      { pts: 10, name: 'B', breakdown: { exact: 1, result: 0, ko: 0 } },
      { pts: 10, name: 'A', breakdown: { exact: 2, result: 0, ko: 0 } },
    ]
    const sorted = sortRanking(entries)
    expect(sorted[0]!.name).toBe('A')
  })

  it('uses name as final tiebreaker', () => {
    const entries = [
      { pts: 10, name: 'Zara', breakdown: { exact: 0, result: 0, ko: 0 } },
      { pts: 10, name: 'Ana',  breakdown: { exact: 0, result: 0, ko: 0 } },
    ]
    const sorted = sortRanking(entries)
    expect(sorted[0]!.name).toBe('Ana')
  })
})
