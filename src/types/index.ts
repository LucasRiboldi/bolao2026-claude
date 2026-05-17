// ── Teams ────────────────────────────────────────────────────────────────────

export interface Team {
  name: string
  short: string
  flag: string
  iso: string
}

export type TeamId = string

// ── Groups ───────────────────────────────────────────────────────────────────

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export interface GroupGame {
  id: string      // e.g. "A_0"
  home: TeamId
  away: TeamId
  round: 1 | 2 | 3
}

export interface StandingRow {
  id: TeamId
  pts: number
  gf: number
  ga: number
  gd: number
  played: number
  group?: GroupId
}

// ── Knockout ─────────────────────────────────────────────────────────────────

export interface KnockoutSlot {
  id: string          // e.g. "r32_01"
  homeSlot: string    // e.g. "1A", "2B", "T3_ABCDF" (Art. 12.6 slot eligibility)
  awaySlot: string
}

export interface KnockoutMatch {
  id: string
  home: TeamId | null | undefined
  away: TeamId | null | undefined
  homeLabel?: string
  awayLabel?: string
}

export interface KnockoutRound {
  name: string
  matches: Array<{ id: string; home: string; away: string }>
}

// ── Bets ─────────────────────────────────────────────────────────────────────

export interface GoalBet {
  homeGoals: string
  awayGoals: string
}

export type GroupBets = Record<string, GoalBet>    // gameId → bet

export type KoArrayKey  = 'r32' | 'r16' | 'qf' | 'sf'
export type KoSingleKey = 'champion' | 'third'

export interface KnockoutBets {
  r32?:      TeamId[]
  r16?:      TeamId[]
  qf?:       TeamId[]
  sf?:       TeamId[]
  champion?: TeamId
  third?:    TeamId
}

// ── Results ──────────────────────────────────────────────────────────────────

export interface Results {
  groupStage: Record<string, GoalBet>
  knockout: Record<string, TeamId>
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoringConfig {
  exactScore: number
  correctResult: number
  r32Winner: number
  r16Winner: number
  qfWinner: number
  sfWinner: number
  championScore: number
  finalistBonus: number
}

export interface ScoreBreakdown {
  exact: number
  result: number
  ko: number
  bonus: number
}

export interface ScoreResult {
  pts: number
  breakdown: ScoreBreakdown
}

// ── Users & Ranking ──────────────────────────────────────────────────────────

export interface UserProfile {
  name: string
  email: string
  betsLocked?: boolean
  betsSavedAt?: string
  betsUnlockedAt?: string
}

export interface RankingEntry {
  uid: string
  name: string
  pts: number
  breakdown?: ScoreBreakdown
}

export interface UserWithBets {
  uid: string
  profile: UserProfile
  groupBets: GroupBets
  knockoutBets: KnockoutBets
}

// ── Qualified teams (after group stage) ──────────────────────────────────────

export interface QualifiedTeams {
  winners: Record<GroupId, TeamId | undefined>
  runners: Record<GroupId, TeamId | undefined>
  thirds: StandingRow[]
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface AdminConfig {
  registrationOpen?: boolean
  globalLocked?: boolean
  globalLockedAt?: string
  globalUnlockedAt?: string
}
