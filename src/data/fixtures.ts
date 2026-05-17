/**
 * Official FIFA World Cup 2026 schedule, in BRASÍLIA timezone (UTC-3).
 *
 * Sourced from public/calendario.txt (the FIFA-published calendar). For each
 * match the BRASÍLIA date+time is what counts — even when local kickoff is
 * the previous calendar day in the US/Mexico/Canada, we record the actual
 * Brasília moment.
 *
 * MD3 (final round of each group) has simultaneous kickoffs per Art. 12.4 —
 * verified in the calendar (same Brasília time for both games of MD3).
 */
import { GROUP_IDS, generateGroupGames } from './groups'

export interface Fixture {
  gameId: string
  /** Brasília date, ISO YYYY-MM-DD */
  date: string
  /** Brasília time, HH:MM (24h) */
  time: string
  /** Stadium location label (optional, for display) */
  city?: string
  /** Full Brasília Date object */
  kickoff: Date
}

interface RawFixture {
  date: string
  time: string
  city?: string
}

// ── Group stage (Jun 11–27, 2026) ────────────────────────────────────────────
// Each entry: gameId → { brasília date, brasília time, city }.
const GROUP_RAW: Record<string, RawFixture> = {
  // ── MD1 (Jun 11–17) ───────────────────────────────────────────────────────
  A_0: { date: '2026-06-11', time: '16:00', city: 'Cidade do México' },
  A_1: { date: '2026-06-11', time: '23:00', city: 'Guadalajara' },
  B_0: { date: '2026-06-12', time: '16:00', city: 'Toronto' },
  D_0: { date: '2026-06-12', time: '22:00', city: 'Los Angeles' },
  B_1: { date: '2026-06-13', time: '16:00', city: 'Santa Clara' },
  C_0: { date: '2026-06-13', time: '19:00', city: 'Nova York/Nova Jersey' },
  C_1: { date: '2026-06-13', time: '22:00', city: 'Boston' },
  D_1: { date: '2026-06-14', time: '01:00', city: 'Vancouver' },     // local Jun 13 21:00
  E_0: { date: '2026-06-14', time: '14:00', city: 'Houston' },
  F_0: { date: '2026-06-14', time: '17:00', city: 'Dallas' },
  E_1: { date: '2026-06-14', time: '20:00', city: 'Filadélfia' },
  F_1: { date: '2026-06-14', time: '23:00', city: 'Monterrey' },
  H_0: { date: '2026-06-15', time: '13:00', city: 'Atlanta' },
  G_0: { date: '2026-06-15', time: '16:00', city: 'Seattle' },
  H_1: { date: '2026-06-15', time: '19:00', city: 'Miami' },
  G_1: { date: '2026-06-15', time: '22:00', city: 'Los Angeles' },
  I_0: { date: '2026-06-16', time: '16:00', city: 'Nova York/Nova Jersey' },
  I_1: { date: '2026-06-16', time: '19:00', city: 'Boston' },
  J_1: { date: '2026-06-16', time: '22:00', city: 'Kansas City' },
  J_0: { date: '2026-06-17', time: '01:00', city: 'Santa Clara' },   // local Jun 16 21:00
  K_0: { date: '2026-06-17', time: '14:00', city: 'Houston' },
  L_0: { date: '2026-06-17', time: '17:00', city: 'Dallas' },
  L_1: { date: '2026-06-17', time: '20:00', city: 'Toronto' },
  K_1: { date: '2026-06-17', time: '21:00', city: 'Cidade do México' },

  // ── MD2 (Jun 18–23) ───────────────────────────────────────────────────────
  A_3: { date: '2026-06-18', time: '13:00', city: 'Atlanta' },
  B_3: { date: '2026-06-18', time: '16:00', city: 'Los Angeles' },
  B_2: { date: '2026-06-18', time: '19:00', city: 'Vancouver' },
  A_2: { date: '2026-06-18', time: '22:00', city: 'Guadalajara' },
  D_3: { date: '2026-06-20', time: '00:00', city: 'Santa Clara' },   // local Jun 19 20:00
  D_2: { date: '2026-06-19', time: '16:00', city: 'Seattle' },
  C_3: { date: '2026-06-19', time: '19:00', city: 'Boston' },
  C_2: { date: '2026-06-19', time: '21:30', city: 'Filadélfia' },
  F_3: { date: '2026-06-20', time: '23:00', city: 'Monterrey' },
  F_2: { date: '2026-06-20', time: '14:00', city: 'Houston' },
  E_2: { date: '2026-06-20', time: '17:00', city: 'Toronto' },
  E_3: { date: '2026-06-20', time: '21:00', city: 'Kansas City' },
  H_2: { date: '2026-06-21', time: '13:00', city: 'Atlanta' },
  G_2: { date: '2026-06-21', time: '16:00', city: 'Los Angeles' },
  H_3: { date: '2026-06-21', time: '19:00', city: 'Miami' },
  G_3: { date: '2026-06-21', time: '22:00', city: 'Vancouver' },
  J_2: { date: '2026-06-22', time: '14:00', city: 'Dallas' },
  I_2: { date: '2026-06-22', time: '18:00', city: 'Filadélfia' },
  I_3: { date: '2026-06-22', time: '21:00', city: 'Nova York/Nova Jersey' },
  J_3: { date: '2026-06-23', time: '00:00', city: 'Santa Clara' },   // local Jun 22 20:00
  K_2: { date: '2026-06-23', time: '14:00', city: 'Houston' },
  L_2: { date: '2026-06-23', time: '17:00', city: 'Boston' },
  L_3: { date: '2026-06-23', time: '20:00', city: 'Toronto' },
  K_3: { date: '2026-06-23', time: '23:00', city: 'Guadalajara' },

  // ── MD3 (Jun 24–27) — simultaneous kickoffs per Art. 12.4 ─────────────────
  B_4: { date: '2026-06-24', time: '16:00', city: 'Vancouver' },
  B_5: { date: '2026-06-24', time: '16:00', city: 'Seattle' },
  C_4: { date: '2026-06-24', time: '19:00', city: 'Miami' },
  C_5: { date: '2026-06-24', time: '19:00', city: 'Atlanta' },
  A_4: { date: '2026-06-24', time: '22:00', city: 'Cidade do México' },
  A_5: { date: '2026-06-24', time: '22:00', city: 'Monterrey' },
  E_4: { date: '2026-06-25', time: '17:00', city: 'Nova York/Nova Jersey' },
  E_5: { date: '2026-06-25', time: '17:00', city: 'Filadélfia' },
  F_5: { date: '2026-06-25', time: '20:00', city: 'Dallas' },
  F_4: { date: '2026-06-25', time: '20:00', city: 'Kansas City' },
  D_4: { date: '2026-06-25', time: '23:00', city: 'Los Angeles' },
  D_5: { date: '2026-06-25', time: '23:00', city: 'Santa Clara' },
  I_4: { date: '2026-06-26', time: '16:00', city: 'Boston' },
  I_5: { date: '2026-06-26', time: '16:00', city: 'Toronto' },
  H_4: { date: '2026-06-26', time: '21:00', city: 'Houston' },
  H_5: { date: '2026-06-26', time: '21:00', city: 'Guadalajara' },
  G_4: { date: '2026-06-27', time: '00:00', city: 'Seattle' },       // local Jun 26 20:00
  G_5: { date: '2026-06-27', time: '00:00', city: 'Vancouver' },     // local Jun 26 20:00
  L_4: { date: '2026-06-27', time: '18:00', city: 'Nova York/Nova Jersey' },
  L_5: { date: '2026-06-27', time: '18:00', city: 'Filadélfia' },
  K_4: { date: '2026-06-27', time: '20:30', city: 'Miami' },
  K_5: { date: '2026-06-27', time: '20:30', city: 'Atlanta' },
  J_4: { date: '2026-06-27', time: '23:00', city: 'Kansas City' },
  J_5: { date: '2026-06-27', time: '23:00', city: 'Dallas' },
}

// ── Knockout stage (Jun 28 – Jul 19, 2026) ───────────────────────────────────
// Calendar provides dates only; default kickoff time of 17:00 BSB used until
// FIFA publishes official times for each knockout match.
const KO_RAW: Record<string, RawFixture> = {
  r32_01: { date: '2026-06-28', time: '17:00', city: 'Los Angeles' },
  r32_02: { date: '2026-06-29', time: '17:00', city: 'Boston' },
  r32_03: { date: '2026-06-29', time: '17:00', city: 'Monterrey' },
  r32_04: { date: '2026-06-29', time: '17:00', city: 'Houston' },
  r32_05: { date: '2026-06-30', time: '17:00', city: 'Nova York/Nova Jersey' },
  r32_06: { date: '2026-06-30', time: '17:00', city: 'Dallas' },
  r32_07: { date: '2026-06-30', time: '17:00', city: 'Cidade do México' },
  r32_08: { date: '2026-07-01', time: '17:00', city: 'Atlanta' },
  r32_09: { date: '2026-07-01', time: '17:00', city: 'Santa Clara' },
  r32_10: { date: '2026-07-01', time: '17:00', city: 'Seattle' },
  r32_11: { date: '2026-07-02', time: '17:00', city: 'Toronto' },
  r32_12: { date: '2026-07-02', time: '17:00', city: 'Los Angeles' },
  r32_13: { date: '2026-07-02', time: '17:00', city: 'Vancouver' },
  r32_14: { date: '2026-07-03', time: '17:00', city: 'Miami' },
  r32_15: { date: '2026-07-03', time: '17:00', city: 'Kansas City' },
  r32_16: { date: '2026-07-03', time: '17:00', city: 'Dallas' },
  r16_01: { date: '2026-07-04', time: '17:00', city: 'Filadélfia' },
  r16_02: { date: '2026-07-04', time: '17:00', city: 'Houston' },
  r16_03: { date: '2026-07-05', time: '17:00', city: 'Nova York/Nova Jersey' },
  r16_04: { date: '2026-07-05', time: '17:00', city: 'Cidade do México' },
  r16_05: { date: '2026-07-06', time: '17:00', city: 'Dallas' },
  r16_06: { date: '2026-07-06', time: '17:00', city: 'Seattle' },
  r16_07: { date: '2026-07-07', time: '17:00', city: 'Atlanta' },
  r16_08: { date: '2026-07-07', time: '17:00', city: 'Vancouver' },
  qf_01:  { date: '2026-07-09', time: '17:00', city: 'Boston' },
  qf_02:  { date: '2026-07-10', time: '17:00', city: 'Los Angeles' },
  qf_03:  { date: '2026-07-12', time: '17:00', city: 'Miami' },
  qf_04:  { date: '2026-07-12', time: '17:00', city: 'Kansas City' },
  sf_01:  { date: '2026-07-14', time: '17:00', city: 'Dallas' },
  sf_02:  { date: '2026-07-15', time: '17:00', city: 'Atlanta' },
  third:  { date: '2026-07-18', time: '17:00', city: 'Miami' },
  final:  { date: '2026-07-19', time: '17:00', city: 'Nova York/Nova Jersey' },
}

function buildFixtures(): Record<string, Fixture> {
  const out: Record<string, Fixture> = {}
  const all = { ...GROUP_RAW, ...KO_RAW }
  for (const [gameId, raw] of Object.entries(all)) {
    out[gameId] = {
      gameId,
      date: raw.date,
      time: raw.time,
      city: raw.city,
      kickoff: new Date(`${raw.date}T${raw.time}:00-03:00`),
    }
  }
  return out
}

export const FIXTURES: Record<string, Fixture> = buildFixtures()

// Dev-time guard: ensure every group gameId is covered.
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  for (const gId of GROUP_IDS) {
    for (const g of generateGroupGames(gId)) {
      if (!FIXTURES[g.id]) console.warn(`[fixtures] missing schedule for ${g.id}`)
    }
  }
}

/** All unique match days in chronological order. */
export const ALL_MATCH_DAYS: string[] = [
  ...new Set(Object.values(FIXTURES).map(f => f.date)),
].sort()

/** Returns fixtures scheduled for the given day (YYYY-MM-DD) sorted by time. */
export function getGamesForDay(day: string): Fixture[] {
  return Object.values(FIXTURES)
    .filter(f => f.date === day)
    .sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * Returns the "current relevant" day: today (in Brasília) if there are games
 * today, otherwise the next upcoming day with games. Falls back to the last
 * day of the tournament if everything is in the past.
 */
export function getRelevantMatchDay(now: Date = new Date()): string | null {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)

  if (ALL_MATCH_DAYS.includes(today)) return today
  const upcoming = ALL_MATCH_DAYS.find(d => d > today)
  if (upcoming) return upcoming
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
