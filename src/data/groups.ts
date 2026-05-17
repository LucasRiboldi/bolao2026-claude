import type { GroupId, GroupGame, TeamId } from '@/types'

/**
 * Seed positions [t0=X1, t1=X2, t2=X3, t3=X4] per the official FIFA 2026 draw,
 * verified against the public match calendar (public/calendario.txt):
 *   - MD1 game 1 (t0 v t1) and MD1 game 2 (t2 v t3) must match the schedule.
 *   - 4 groups (B, F, I, K) were re-seeded against the draft to match FIFA.
 */
export const GROUPS: Record<GroupId, [TeamId, TeamId, TeamId, TeamId]> = {
  A: ['mexico',      'southafrica', 'southkorea', 'czechia'],
  B: ['canada',      'bosnia',      'qatar',      'switzerland'],
  C: ['brazil',      'morocco',     'haiti',      'scotland'],
  D: ['usa',         'paraguay',    'australia',  'turkey'],
  E: ['germany',     'curacao',     'ivorycoast', 'ecuador'],
  F: ['netherlands', 'japan',       'sweden',     'tunisia'],
  G: ['belgium',     'egypt',       'iran',       'newzealand'],
  H: ['spain',       'capeverde',   'saudiarabia','uruguay'],
  I: ['france',      'senegal',     'iraq',       'norway'],
  J: ['argentina',   'algeria',     'austria',    'jordan'],
  K: ['portugal',    'drcongo',     'uzbekistan', 'colombia'],
  L: ['england',     'croatia',     'ghana',      'panama'],
}

export const GROUP_IDS = Object.keys(GROUPS) as GroupId[]

// Official FIFA 2026 round-robin schedule (Art. 12.4 of FWC26 Regulations)
// MD1: A1vA2, A3vA4 | MD2: A1vA3, A4vA2 | MD3: A4vA1, A2vA3
// t0=seed1(A1), t1=seed2(A2), t2=seed3(A3), t3=seed4(A4)
export function generateGroupGames(groupId: GroupId): GroupGame[] {
  const [t0, t1, t2, t3] = GROUPS[groupId]
  return [
    { id: `${groupId}_0`, home: t0, away: t1, round: 1 }, // MD1: A1 v A2
    { id: `${groupId}_1`, home: t2, away: t3, round: 1 }, // MD1: A3 v A4
    { id: `${groupId}_2`, home: t0, away: t2, round: 2 }, // MD2: A1 v A3
    { id: `${groupId}_3`, home: t3, away: t1, round: 2 }, // MD2: A4 v A2 (FIFA: t3 home)
    { id: `${groupId}_4`, home: t3, away: t0, round: 3 }, // MD3: A4 v A1 (FIFA: t3 home)
    { id: `${groupId}_5`, home: t1, away: t2, round: 3 }, // MD3: A2 v A3
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
