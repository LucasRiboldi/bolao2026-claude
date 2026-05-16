import type { GroupId, GroupGame, TeamId } from '@/types'

export const GROUPS: Record<GroupId, [TeamId, TeamId, TeamId, TeamId]> = {
  A: ['mexico', 'southafrica', 'southkorea', 'czechia'],
  B: ['canada', 'switzerland', 'qatar', 'bosnia'],
  C: ['brazil', 'morocco', 'haiti', 'scotland'],
  D: ['usa', 'paraguay', 'australia', 'turkey'],
  E: ['germany', 'curacao', 'ivorycoast', 'ecuador'],
  F: ['netherlands', 'japan', 'tunisia', 'sweden'],
  G: ['belgium', 'egypt', 'iran', 'newzealand'],
  H: ['spain', 'capeverde', 'saudiarabia', 'uruguay'],
  I: ['france', 'senegal', 'norway', 'iraq'],
  J: ['argentina', 'algeria', 'austria', 'jordan'],
  K: ['portugal', 'uzbekistan', 'colombia', 'drcongo'],
  L: ['england', 'croatia', 'ghana', 'panama'],
}

export const GROUP_IDS = Object.keys(GROUPS) as GroupId[]

// Standard round-robin schedule: 6 games per group
export function generateGroupGames(groupId: GroupId): GroupGame[] {
  const [t0, t1, t2, t3] = GROUPS[groupId]
  return [
    { id: `${groupId}_0`, home: t0, away: t1, round: 1 },
    { id: `${groupId}_1`, home: t2, away: t3, round: 1 },
    { id: `${groupId}_2`, home: t0, away: t2, round: 2 },
    { id: `${groupId}_3`, home: t1, away: t3, round: 2 },
    { id: `${groupId}_4`, home: t0, away: t3, round: 3 },
    { id: `${groupId}_5`, home: t1, away: t2, round: 3 },
  ]
}

// All 72 group games indexed by id
export const ALL_GROUP_GAMES: Record<string, GroupGame> = {}
for (const gId of GROUP_IDS) {
  for (const game of generateGroupGames(gId)) {
    ALL_GROUP_GAMES[game.id] = game
  }
}

export const GROUP_COLORS: Record<GroupId, string> = {
  A: '#e74c3c',
  B: '#e67e22',
  C: '#f39c12',
  D: '#2ecc71',
  E: '#1abc9c',
  F: '#3498db',
  G: '#9b59b6',
  H: '#e91e63',
  I: '#00bcd4',
  J: '#8bc34a',
  K: '#ff5722',
  L: '#607d8b',
}
