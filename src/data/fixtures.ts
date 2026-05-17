/**
 * FIFA World Cup 2026 group-stage schedule (kickoff dates and times).
 *
 * Estimated schedule based on FIFA's published pattern:
 *   - Group stage: June 11 to June 27, 2026 (17 days)
 *   - 12 groups × 6 games = 72 games (4–5 per day)
 *   - MD3 of each group has simultaneous kickoffs (Art. 12.4)
 *
 * Times shown in Brasília timezone (UTC-3). Replace with the official FIFA
 * schedule when published — the structure is keyed by our internal gameId.
 */
import type { GroupId } from '@/types'
import { GROUP_IDS, generateGroupGames } from './groups'

// Each group's match days (ISO dates).
const GROUP_DAYS: Record<GroupId, { md1: string; md2: string; md3: string }> = {
  A: { md1: '2026-06-11', md2: '2026-06-18', md3: '2026-06-24' },
  B: { md1: '2026-06-11', md2: '2026-06-18', md3: '2026-06-24' },
  C: { md1: '2026-06-12', md2: '2026-06-19', md3: '2026-06-25' },
  D: { md1: '2026-06-12', md2: '2026-06-19', md3: '2026-06-25' },
  E: { md1: '2026-06-13', md2: '2026-06-20', md3: '2026-06-26' },
  F: { md1: '2026-06-13', md2: '2026-06-20', md3: '2026-06-26' },
  G: { md1: '2026-06-14', md2: '2026-06-21', md3: '2026-06-27' },
  H: { md1: '2026-06-14', md2: '2026-06-21', md3: '2026-06-27' },
  I: { md1: '2026-06-15', md2: '2026-06-22', md3: '2026-06-24' },
  J: { md1: '2026-06-15', md2: '2026-06-22', md3: '2026-06-25' },
  K: { md1: '2026-06-16', md2: '2026-06-23', md3: '2026-06-26' },
  L: { md1: '2026-06-16', md2: '2026-06-23', md3: '2026-06-27' },
}

// Kickoff times by game index within a group (Brasília UTC-3).
// MD3 games (idx 4 and 5) are simultaneous per Art. 12.4.
const TIME_BY_IDX: Record<string, string> = {
  '0': '13:00',
  '1': '16:00',
  '2': '19:00',
  '3': '22:00',
  '4': '17:00',  // simultaneous
  '5': '17:00',  // simultaneous
}

export interface Fixture {
  gameId: string
  date: string      // ISO YYYY-MM-DD
  time: string      // HH:MM (Brasília)
  kickoff: Date     // full Date in Brasília time
}

function buildFixtures(): Record<string, Fixture> {
  const out: Record<string, Fixture> = {}
  for (const gId of GROUP_IDS) {
    for (const game of generateGroupGames(gId)) {
      const idx = parseInt(game.id.split('_')[1]!, 10)
      const date =
        idx <= 1 ? GROUP_DAYS[gId].md1 :
        idx <= 3 ? GROUP_DAYS[gId].md2 :
                   GROUP_DAYS[gId].md3
      const time = TIME_BY_IDX[String(idx)] ?? '17:00'
      out[game.id] = {
        gameId: game.id,
        date,
        time,
        kickoff: new Date(`${date}T${time}:00-03:00`),
      }
    }
  }
  return out
}

export const FIXTURES: Record<string, Fixture> = buildFixtures()

/** All unique match days in chronological order. */
export const ALL_MATCH_DAYS: string[] = [
  ...new Set(Object.values(FIXTURES).map(f => f.date)),
].sort()

/** Returns game IDs scheduled for the given day (YYYY-MM-DD). */
export function getGamesForDay(day: string): Fixture[] {
  return Object.values(FIXTURES)
    .filter(f => f.date === day)
    .sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * Returns the "current relevant" day: today if there are games today,
 * otherwise the next upcoming day with games. Returns null only if the
 * tournament is fully over.
 */
export function getRelevantMatchDay(now: Date = new Date()): string | null {
  // Use Brasília date for "today"
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)

  if (ALL_MATCH_DAYS.includes(today)) return today
  const upcoming = ALL_MATCH_DAYS.find(d => d > today)
  if (upcoming) return upcoming
  // Tournament is past — return the last day so something still shows
  return ALL_MATCH_DAYS[ALL_MATCH_DAYS.length - 1] ?? null
}

/** "11 jun" formatted in pt-BR. */
export function formatDateShort(date: string): string {
  const d = new Date(`${date}T00:00:00-03:00`)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(d).replace('.', '')
}

/** "22h00" formatted. */
export function formatTimeShort(time: string): string {
  return time.replace(':', 'h')
}
