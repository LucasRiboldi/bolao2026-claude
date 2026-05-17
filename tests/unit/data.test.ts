import { describe, it, expect } from 'vitest'
import { TEAMS, teamDisplayName, teamLabel, nameInitials } from '@/data/teams'
import { GROUPS, GROUP_IDS, generateGroupGames, ALL_GROUP_GAMES } from '@/data/groups'
import { KNOCKOUT_SLOTS, buildR32 } from '@/data/bracket'
import type { QualifiedTeams } from '@/types'

describe('TEAMS', () => {
  it('has exactly 48 teams', () => {
    expect(Object.keys(TEAMS)).toHaveLength(48)
  })

  it('every team has name, short (3 chars), flag, iso', () => {
    for (const [id, team] of Object.entries(TEAMS)) {
      expect(team.name.length, `${id}.name`).toBeGreaterThan(0)
      expect(team.short.length, `${id}.short`).toBe(3)
      expect(team.flag.length, `${id}.flag`).toBeGreaterThan(0)
      expect(team.iso.length, `${id}.iso`).toBeGreaterThan(0)
    }
  })

  it('scotland uses gb-sct iso code', () => {
    expect(TEAMS['scotland']!.iso).toBe('gb-sct')
  })

  it('england uses gb-eng iso code', () => {
    expect(TEAMS['england']!.iso).toBe('gb-eng')
  })
})

describe('teamDisplayName', () => {
  it('returns short name when name > 10 chars', () => {
    // "Estados Unidos" = 14 chars
    expect(teamDisplayName('usa')).toBe('USA')
  })

  it('returns full name when name <= 10 chars', () => {
    // "Brasil" = 6 chars
    expect(teamDisplayName('brazil')).toBe('Brasil')
  })

  it('returns teamId for unknown team', () => {
    expect(teamDisplayName('unknown_team')).toBe('unknown_team')
  })
})

describe('teamLabel', () => {
  it('returns flag + name by default', () => {
    const label = teamLabel('brazil')
    expect(label).toContain('🇧🇷')
    expect(label).toContain('Brasil')
  })

  it('returns flag + short when useFull=false', () => {
    const label = teamLabel('brazil', false)
    expect(label).toContain('BRA')
  })

  it('returns ? for null/undefined', () => {
    expect(teamLabel(null)).toBe('?')
    expect(teamLabel(undefined)).toBe('?')
  })
})

describe('nameInitials', () => {
  it('returns first letter of first and last name', () => {
    expect(nameInitials('Lucas Riboldi')).toBe('LR')
  })

  it('returns single letter for single-word name', () => {
    expect(nameInitials('Lucas')).toBe('L')
  })

  it('handles empty string with fallback', () => {
    expect(nameInitials('')).toBe('?')
  })

  it('uppercases initials', () => {
    expect(nameInitials('ana paula')).toBe('AP')
  })
})

describe('GROUPS', () => {
  it('has exactly 12 groups (A-L)', () => {
    expect(GROUP_IDS).toHaveLength(12)
  })

  it('each group has exactly 4 teams', () => {
    for (const gId of GROUP_IDS) {
      expect(GROUPS[gId]).toHaveLength(4)
    }
  })

  it('all teams in groups exist in TEAMS', () => {
    for (const gId of GROUP_IDS) {
      for (const teamId of GROUPS[gId]) {
        expect(TEAMS[teamId], `${gId}: ${teamId}`).toBeDefined()
      }
    }
  })

  it('no team appears in more than one group', () => {
    const seen = new Set<string>()
    for (const gId of GROUP_IDS) {
      for (const teamId of GROUPS[gId]) {
        expect(seen.has(teamId), `${teamId} appears twice`).toBe(false)
        seen.add(teamId)
      }
    }
  })
})

describe('generateGroupGames', () => {
  it('generates exactly 6 games per group', () => {
    for (const gId of GROUP_IDS) {
      expect(generateGroupGames(gId)).toHaveLength(6)
    }
  })

  it('each team plays 3 games per group', () => {
    for (const gId of GROUP_IDS) {
      const games = generateGroupGames(gId)
      const teamCount: Record<string, number> = {}
      for (const g of games) {
        teamCount[g.home] = (teamCount[g.home] ?? 0) + 1
        teamCount[g.away] = (teamCount[g.away] ?? 0) + 1
      }
      for (const count of Object.values(teamCount)) {
        expect(count).toBe(3)
      }
    }
  })

  it('game ids are unique within a group', () => {
    for (const gId of GROUP_IDS) {
      const ids = generateGroupGames(gId).map(g => g.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('ALL_GROUP_GAMES', () => {
  it('has exactly 72 games (12 groups × 6)', () => {
    expect(Object.keys(ALL_GROUP_GAMES)).toHaveLength(72)
  })
})

describe('KNOCKOUT_SLOTS', () => {
  it('has exactly 16 R32 slots', () => {
    expect(KNOCKOUT_SLOTS).toHaveLength(16)
  })
})

describe('buildR32', () => {
  it('fills slots from qualified teams', () => {
    const qualified: QualifiedTeams = {
      winners: { A: 'mexico', B: 'canada', C: 'brazil', D: 'usa', E: 'germany', F: 'netherlands', G: 'belgium', H: 'spain', I: 'france', J: 'argentina', K: 'portugal', L: 'england' },
      runners: { A: 'southafrica', B: 'switzerland', C: 'morocco', D: 'paraguay', E: 'curacao', F: 'japan', G: 'egypt', H: 'capeverde', I: 'senegal', J: 'algeria', K: 'uzbekistan', L: 'croatia' },
      // 8 best thirds, each tagged with its source group (required for Annexe C
      // slot eligibility check). Picked groups here = {A,B,C,D,E,F,G,L} so a
      // valid assignment exists across the 8 T3 slots.
      thirds: [
        { id: 'brazil',  pts: 5, gf: 4, ga: 2, gd: 2,  played: 3, group: 'C' },
        { id: 'germany', pts: 4, gf: 3, ga: 2, gd: 1,  played: 3, group: 'E' },
        { id: 'spain',   pts: 4, gf: 2, ga: 1, gd: 1,  played: 3, group: 'H' },
        { id: 'france',  pts: 4, gf: 2, ga: 2, gd: 0,  played: 3, group: 'I' },
        { id: 'england', pts: 3, gf: 2, ga: 2, gd: 0,  played: 3, group: 'L' },
        { id: 'mexico',  pts: 3, gf: 1, ga: 1, gd: 0,  played: 3, group: 'A' },
        { id: 'canada',  pts: 3, gf: 1, ga: 2, gd: -1, played: 3, group: 'B' },
        { id: 'usa',     pts: 3, gf: 0, ga: 1, gd: -1, played: 3, group: 'D' },
      ],
    }
    const r32 = buildR32(qualified)
    expect(r32).toHaveLength(16)
    // r32_01: 2A vs 2B → southafrica vs switzerland
    const m1 = r32.find(m => m.id === 'r32_01')!
    expect(m1.home).toBe('southafrica')
    expect(m1.away).toBe('switzerland')
  })
})
