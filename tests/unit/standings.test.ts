import { describe, it, expect } from 'vitest'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import type { GroupBets } from '@/types'

// Helper: build bets for group A games
// A: mexico, southafrica, southkorea, czechia
// Games: A_0=mexico vs southafrica, A_1=southkorea vs czechia
//        A_2=mexico vs southkorea,  A_3=southafrica vs czechia
//        A_4=mexico vs czechia,     A_5=southafrica vs southkorea

describe('calcGroupStandings', () => {
  it('returns empty standings for empty bets', () => {
    const result = calcGroupStandings({})
    expect(Object.keys(result)).toHaveLength(12)
    // All teams start at 0 pts
    for (const table of Object.values(result)) {
      for (const row of table) {
        expect(row.pts).toBe(0)
      }
    }
  })

  it('correctly computes standings with one win', () => {
    const bets: GroupBets = {
      A_0: { homeGoals: '2', awayGoals: '0' }, // mexico beats southafrica
    }
    const standings = calcGroupStandings(bets)
    const tableA = standings['A']!
    const mexico = tableA.find(t => t.id === 'mexico')!
    const southafrica = tableA.find(t => t.id === 'southafrica')!

    expect(mexico.pts).toBe(3)
    expect(mexico.gf).toBe(2)
    expect(mexico.ga).toBe(0)
    expect(mexico.gd).toBe(2)
    expect(southafrica.pts).toBe(0)
  })

  it('correctly handles a draw', () => {
    const bets: GroupBets = {
      A_0: { homeGoals: '1', awayGoals: '1' }, // mexico draws southafrica
    }
    const standings = calcGroupStandings(bets)
    const tableA = standings['A']!
    const mexico = tableA.find(t => t.id === 'mexico')!
    const southafrica = tableA.find(t => t.id === 'southafrica')!

    expect(mexico.pts).toBe(1)
    expect(southafrica.pts).toBe(1)
  })

  it('places teams in correct order by points', () => {
    const bets: GroupBets = {
      A_0: { homeGoals: '2', awayGoals: '0' }, // mexico 3pts
      A_1: { homeGoals: '1', awayGoals: '1' }, // southkorea & czechia 1pt each
    }
    const standings = calcGroupStandings(bets)
    const tableA = standings['A']!
    expect(tableA[0]!.id).toBe('mexico')
    expect(tableA[0]!.pts).toBe(3)
  })

  it('applies H2H tiebreaker', () => {
    // Mexico and South Africa both win one game each in direct encounter
    const bets: GroupBets = {
      A_0: { homeGoals: '2', awayGoals: '1' }, // mexico beats southafrica (H2H: mexico wins)
      A_2: { homeGoals: '0', awayGoals: '2' }, // southkorea beats mexico
      A_3: { homeGoals: '2', awayGoals: '1' }, // southafrica beats czechia
      // mexico: 3pts from A_0, 0pts from A_2 = 3pts total
      // southafrica: 0pts from A_0, 3pts from A_3 = 3pts total
      // H2H: mexico beat southafrica → mexico ranks above
    }
    const standings = calcGroupStandings(bets)
    const tableA = standings['A']!
    const mexIdx = tableA.findIndex(t => t.id === 'mexico')
    const safIdx = tableA.findIndex(t => t.id === 'southafrica')
    expect(mexIdx).toBeLessThan(safIdx)
  })

  it('skips games with empty bets', () => {
    const bets: GroupBets = {
      A_0: { homeGoals: '', awayGoals: '' },
    }
    const standings = calcGroupStandings(bets)
    const tableA = standings['A']!
    for (const row of tableA) {
      expect(row.pts).toBe(0)
      expect(row.played).toBe(0)
    }
  })
})

describe('getQualified', () => {
  it('extracts 1st and 2nd from each group', () => {
    const bets: GroupBets = {
      // Complete Group A: mexico 9pts, southafrica 6pts, southkorea 3pts, czechia 0pts
      A_0: { homeGoals: '1', awayGoals: '0' }, // mexico 3pts
      A_1: { homeGoals: '1', awayGoals: '0' }, // southkorea 3pts
      A_2: { homeGoals: '1', awayGoals: '0' }, // mexico 6pts
      A_3: { homeGoals: '1', awayGoals: '0' }, // southafrica 3pts
      A_4: { homeGoals: '1', awayGoals: '0' }, // mexico 9pts
      A_5: { homeGoals: '1', awayGoals: '0' }, // southafrica 6pts
    }
    const standings = calcGroupStandings(bets)
    const qualified = getQualified(standings)

    expect(qualified.winners['A']).toBe('mexico')
    expect(qualified.runners['A']).toBe('southafrica')
  })

  it('thirds list has at most 8 teams', () => {
    const bets: GroupBets = {}
    const standings = calcGroupStandings(bets)
    const qualified = getQualified(standings)
    expect(qualified.thirds.length).toBeLessThanOrEqual(8)
  })
})
