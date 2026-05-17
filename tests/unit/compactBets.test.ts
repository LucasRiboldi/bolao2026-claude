import { describe, it, expect } from 'vitest'
import { encodeBet, decodeBet, encodeGroupBets, decodeGroupBets } from '@/lib/compactBets'
import type { GroupBets } from '@/types'

describe('encodeBet', () => {
  it('encodes a filled bet as "HxA"', () => {
    expect(encodeBet({ homeGoals: '2', awayGoals: '1' })).toBe('2x1')
    expect(encodeBet({ homeGoals: '0', awayGoals: '0' })).toBe('0x0')
    expect(encodeBet({ homeGoals: '12', awayGoals: '0' })).toBe('12x0')
  })

  it('returns null for empty or invalid inputs', () => {
    expect(encodeBet(undefined)).toBeNull()
    expect(encodeBet(null)).toBeNull()
    expect(encodeBet({ homeGoals: '', awayGoals: '' })).toBeNull()
    expect(encodeBet({ homeGoals: '2', awayGoals: '' })).toBeNull()
    expect(encodeBet({ homeGoals: 'foo', awayGoals: '1' })).toBeNull()
  })
})

describe('decodeBet', () => {
  it('decodes the new string format', () => {
    expect(decodeBet('2x1')).toEqual({ homeGoals: '2', awayGoals: '1' })
    expect(decodeBet('0x0')).toEqual({ homeGoals: '0', awayGoals: '0' })
    expect(decodeBet('12x3')).toEqual({ homeGoals: '12', awayGoals: '3' })
  })

  it('decodes the old object format (backward compat)', () => {
    expect(decodeBet({ homeGoals: '2', awayGoals: '1' }))
      .toEqual({ homeGoals: '2', awayGoals: '1' })
  })

  it('returns null for malformed input', () => {
    expect(decodeBet(undefined)).toBeNull()
    expect(decodeBet(null)).toBeNull()
    expect(decodeBet('2-1')).toBeNull()  // wrong separator
    expect(decodeBet('foo')).toBeNull()
    expect(decodeBet(42)).toBeNull()
    expect(decodeBet({ homeGoals: 2, awayGoals: 1 })).toBeNull()  // numbers, not strings
    expect(decodeBet({})).toBeNull()
  })
})

describe('encodeGroupBets / decodeGroupBets — round trip', () => {
  it('preserves filled bets through encode → decode', () => {
    const original: GroupBets = {
      A_0: { homeGoals: '2', awayGoals: '1' },
      A_1: { homeGoals: '0', awayGoals: '0' },
      B_0: { homeGoals: '3', awayGoals: '2' },
    }
    const encoded = encodeGroupBets(original)
    expect(encoded).toEqual({ A_0: '2x1', A_1: '0x0', B_0: '3x2' })
    expect(decodeGroupBets(encoded)).toEqual(original)
  })

  it('drops empty entries during encoding', () => {
    const bets: GroupBets = {
      A_0: { homeGoals: '2', awayGoals: '1' },
      A_1: { homeGoals: '',  awayGoals: ''  },
      A_2: { homeGoals: '0', awayGoals: '0' },
    }
    expect(encodeGroupBets(bets)).toEqual({ A_0: '2x1', A_2: '0x0' })
  })

  it('decodes a mixed-format document (some old, some new)', () => {
    const raw = {
      A_0: '2x1',                                       // new format
      A_1: { homeGoals: '0', awayGoals: '0' },          // old format
      A_2: 'invalid',                                   // skipped
    }
    expect(decodeGroupBets(raw)).toEqual({
      A_0: { homeGoals: '2', awayGoals: '1' },
      A_1: { homeGoals: '0', awayGoals: '0' },
    })
  })

  it('produces shorter output than legacy object form', () => {
    const bets: GroupBets = {}
    for (let i = 0; i < 72; i++) {
      bets[`G_${i}`] = { homeGoals: '2', awayGoals: '1' }
    }
    const oldJson = JSON.stringify(bets)
    const newJson = JSON.stringify(encodeGroupBets(bets))
    // New format should be at least 50% smaller
    expect(newJson.length).toBeLessThan(oldJson.length * 0.5)
  })
})
