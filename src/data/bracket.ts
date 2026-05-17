import type { KnockoutSlot, KnockoutRound, KnockoutMatch, QualifiedTeams, GroupId, TeamId } from '@/types'
import { assignThirdsToSlots } from '@/utils/standings'

export const DEFAULT_SCORING = {
  exactScore: 17,
  correctResult: 8,
  r32Winner: 5,
  r16Winner: 11,
  qfWinner: 20,
  sfWinner: 40,
  championScore: 71,
  finalistBonus: 26,
}

/**
 * Official FIFA 2026 R32 bracket (Art. 12.6).
 *
 * "T3_XXXXX" labels indicate the slot can only be filled by a 3rd-placed team
 * whose source group is in the letter set (Art. 12.6 / Annexe C). Eligibility:
 *   T3_ABCDF → groups A,B,C,D,F   T3_BEFIJ → groups B,E,F,I,J
 *   T3_CDFGH → groups C,D,F,G,H   T3_AEHIJ → groups A,E,H,I,J
 *   T3_CEFHI → groups C,E,F,H,I   T3_EFGIJ → groups E,F,G,I,J
 *   T3_EHIJK → groups E,H,I,J,K   T3_DEIJL → groups D,E,I,J,L
 *
 * Actual third-team assignment to slots is computed by assignThirdsToSlots().
 */
export const KNOCKOUT_SLOTS: KnockoutSlot[] = [
  { id: 'r32_01', homeSlot: '2A',  awaySlot: '2B'        },
  { id: 'r32_02', homeSlot: '1E',  awaySlot: 'T3_ABCDF'  },
  { id: 'r32_03', homeSlot: '1F',  awaySlot: '2C'        },
  { id: 'r32_04', homeSlot: '1C',  awaySlot: '2F'        },
  { id: 'r32_05', homeSlot: '1I',  awaySlot: 'T3_CDFGH'  },
  { id: 'r32_06', homeSlot: '2E',  awaySlot: '2I'        },
  { id: 'r32_07', homeSlot: '1A',  awaySlot: 'T3_CEFHI'  },
  { id: 'r32_08', homeSlot: '1L',  awaySlot: 'T3_EHIJK'  },
  { id: 'r32_09', homeSlot: '1D',  awaySlot: 'T3_BEFIJ'  },
  { id: 'r32_10', homeSlot: '1G',  awaySlot: 'T3_AEHIJ'  },
  { id: 'r32_11', homeSlot: '2K',  awaySlot: '2L'        },
  { id: 'r32_12', homeSlot: '1H',  awaySlot: '2J'        },
  { id: 'r32_13', homeSlot: '1B',  awaySlot: 'T3_EFGIJ'  },
  { id: 'r32_14', homeSlot: '1J',  awaySlot: '2H'        },
  { id: 'r32_15', homeSlot: '1K',  awaySlot: 'T3_DEIJL'  },
  { id: 'r32_16', homeSlot: '2D',  awaySlot: '2G'        },
]

export const KNOCKOUT_ROUNDS: KnockoutRound[] = [
  {
    name: 'Oitavas',
    matches: [
      { id: 'r16_01', home: 'W:r32_02', away: 'W:r32_05' },
      { id: 'r16_02', home: 'W:r32_01', away: 'W:r32_03' },
      { id: 'r16_03', home: 'W:r32_04', away: 'W:r32_06' },
      { id: 'r16_04', home: 'W:r32_07', away: 'W:r32_08' },
      { id: 'r16_05', home: 'W:r32_11', away: 'W:r32_12' },
      { id: 'r16_06', home: 'W:r32_09', away: 'W:r32_10' },
      { id: 'r16_07', home: 'W:r32_14', away: 'W:r32_16' },
      { id: 'r16_08', home: 'W:r32_13', away: 'W:r32_15' },
    ],
  },
  {
    name: 'Quartas',
    matches: [
      { id: 'qf_01', home: 'W:r16_01', away: 'W:r16_02' },
      { id: 'qf_02', home: 'W:r16_05', away: 'W:r16_06' },
      { id: 'qf_03', home: 'W:r16_03', away: 'W:r16_04' },
      { id: 'qf_04', home: 'W:r16_07', away: 'W:r16_08' },
    ],
  },
  {
    name: 'Semifinais',
    matches: [
      { id: 'sf_01', home: 'W:qf_01', away: 'W:qf_02' },
      { id: 'sf_02', home: 'W:qf_03', away: 'W:qf_04' },
    ],
  },
  {
    name: 'Terceiro Lugar',
    matches: [{ id: 'third', home: 'L:sf_01', away: 'L:sf_02' }],
  },
  {
    name: 'Final',
    matches: [{ id: 'final', home: 'W:sf_01', away: 'W:sf_02' }],
  },
]

function resolveSlot(
  slot: string,
  qualified: QualifiedTeams,
  thirdAssignment: Record<string, TeamId>,
  matchId: string,
): TeamId | undefined {
  if (slot.startsWith('T3_')) return thirdAssignment[matchId]
  const pos = slot[0]
  if (pos === '1') return qualified.winners[slot[1] as GroupId]
  if (pos === '2') return qualified.runners[slot[1] as GroupId]
  return undefined
}

export function buildR32(qualified: QualifiedTeams): KnockoutMatch[] {
  const thirdAssignment = assignThirdsToSlots(qualified.thirds)
  return KNOCKOUT_SLOTS.map(s => ({
    id: s.id,
    home: resolveSlot(s.homeSlot, qualified, thirdAssignment, s.id),
    away: resolveSlot(s.awaySlot, qualified, thirdAssignment, s.id),
    homeLabel: s.homeSlot,
    awayLabel: s.awaySlot,
  }))
}

export function resolveKnockoutRound(
  roundMatches: KnockoutRound['matches'],
  koBets: Record<string, TeamId>,
  prevResolved: Record<string, KnockoutMatch> = {},
): KnockoutMatch[] {
  return roundMatches.map(m => {
    const resolve = (ref: string): TeamId | null => {
      if (ref.startsWith('W:')) return koBets[ref.slice(2)] ?? null
      if (ref.startsWith('L:')) {
        const prevId = ref.slice(2)
        const prev = prevResolved[prevId]
        if (!prev) return null
        const winner = koBets[prevId]
        if (!winner) return null
        return prev.home === winner ? (prev.away ?? null) : (prev.home ?? null)
      }
      return ref as TeamId
    }
    return { id: m.id, home: resolve(m.home), away: resolve(m.away) }
  })
}
