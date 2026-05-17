import {
  doc, collection, collectionGroup,
  getDoc, getDocs, setDoc, updateDoc, deleteField,
  writeBatch, serverTimestamp, onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  GroupBets, KnockoutBets, UserProfile, Results, GoalBet, TeamId,
  RankingEntry, UserWithBets, AdminConfig, ScoringConfig,
} from '@/types'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import { encodeGroupBets, decodeGroupBets, encodeBet } from './compactBets'

// ── Profile ───────────────────────────────────────────────────────────────────

export async function saveProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid), { _exists: true }, { merge: true })
  await setDoc(doc(db, 'users', uid, 'profile', 'info'), data, { merge: true })
}

export async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'info'))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function updateUserName(uid: string, name: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'profile', 'info'), { name }, { merge: true })
}

// ── Bets ──────────────────────────────────────────────────────────────────────

export async function saveGroupBets(uid: string, bets: GroupBets): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'bets', 'groupStage'), encodeGroupBets(bets))
}

export async function loadGroupBets(uid: string): Promise<GroupBets> {
  const snap = await getDoc(doc(db, 'users', uid, 'bets', 'groupStage'))
  return snap.exists() ? decodeGroupBets(snap.data() as Record<string, unknown>) : {}
}

export async function saveKnockoutBets(uid: string, bets: KnockoutBets): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'bets', 'knockout'), bets)
}

export async function loadKnockoutBets(uid: string): Promise<KnockoutBets> {
  const snap = await getDoc(doc(db, 'users', uid, 'bets', 'knockout'))
  if (!snap.exists()) return {}
  const data = snap.data()
  // Discard old matchId-based format (e.g. { r32_01: 'BRA' }) — incompatible with new model
  const isOldFormat = Object.keys(data).some(k => /^(r32|r16|qf|sf)_\d+$/.test(k) || k === 'final')
  return isOldFormat ? {} : (data as KnockoutBets)
}

export async function loadUserBetsForHistory(targetUid: string): Promise<{ groupBets: GroupBets; knockoutBets: KnockoutBets }> {
  const [gs, ko] = await Promise.all([
    getDoc(doc(db, 'users', targetUid, 'bets', 'groupStage')),
    getDoc(doc(db, 'users', targetUid, 'bets', 'knockout')),
  ])
  let knockoutBets: KnockoutBets = {}
  if (ko.exists()) {
    const data = ko.data()
    const isOldFormat = Object.keys(data).some(k => /^(r32|r16|qf|sf)_\d+$/.test(k) || k === 'final')
    knockoutBets = isOldFormat ? {} : (data as KnockoutBets)
  }
  return {
    groupBets:    gs.exists() ? decodeGroupBets(gs.data() as Record<string, unknown>) : {},
    knockoutBets,
  }
}

// ── Lock ──────────────────────────────────────────────────────────────────────

export async function lockBets(uid: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'profile', 'info'),
    { betsLocked: true, betsSavedAt: new Date().toISOString() },
    { merge: true },
  )
}

export async function unlockUserBets(targetUid: string): Promise<void> {
  await setDoc(
    doc(db, 'users', targetUid, 'profile', 'info'),
    { betsLocked: false, betsUnlockedAt: new Date().toISOString() },
    { merge: true },
  )
}

// ── TTL cache helper ─────────────────────────────────────────────────────────
// Reads sessionStorage with a max-age guard so stale data is auto-discarded.
// In-memory mirror prevents repeated JSON.parse within the same session.

interface TTLEntry<T> { data: T; ts: number }

function readTTL<T>(key: string, ttlMs: number): T | null {
  const raw = sessionStorage.getItem(key)
  if (!raw) return null
  try {
    const entry = JSON.parse(raw) as TTLEntry<T>
    if (Date.now() - entry.ts > ttlMs) {
      sessionStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function writeTTL<T>(key: string, data: T): void {
  sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() } satisfies TTLEntry<T>))
}

const RESULTS_TTL_MS = 30_000
const RANKING_TTL_MS = 30_000

// ── Results ───────────────────────────────────────────────────────────────────

let _resultsCache: Results | null = null
let _resultsCacheTs = 0

export async function loadResults(forceRefresh = false): Promise<Results> {
  if (!forceRefresh && _resultsCache && Date.now() - _resultsCacheTs < RESULTS_TTL_MS) {
    return _resultsCache
  }
  if (!forceRefresh) {
    const cached = readTTL<Results>('bolao_results', RESULTS_TTL_MS)
    if (cached) {
      _resultsCache = cached
      _resultsCacheTs = Date.now()
      return cached
    }
  }

  const [gs, ko] = await Promise.all([
    getDoc(doc(db, 'results', 'groupStage')),
    getDoc(doc(db, 'results', 'knockout')),
  ])
  const data: Results = {
    groupStage: gs.exists() ? decodeGroupBets(gs.data() as Record<string, unknown>) : {},
    knockout:   ko.exists() ? (ko.data() as Results['knockout'])   : {},
  }
  _resultsCache = data
  _resultsCacheTs = Date.now()
  writeTTL('bolao_results', data)
  return data
}

export function invalidateResultsCache(): void {
  _resultsCache = null
  _resultsCacheTs = 0
  sessionStorage.removeItem('bolao_results')
}

export async function saveGroupResults(results: Results['groupStage']): Promise<void> {
  await setDoc(doc(db, 'results', 'groupStage'), encodeGroupBets(results), { merge: true })
  invalidateResultsCache()
  scheduleRankingRecompute()
}

export async function saveKnockoutResults(results: Results['knockout']): Promise<void> {
  await setDoc(doc(db, 'results', 'knockout'), results, { merge: true })
  invalidateResultsCache()
  scheduleRankingRecompute()
}

// Per-game / per-match operations (admin live editing) ────────────────────────
// Every write schedules a debounced ranking recompute (2s) so all participants
// see updated scores in near-real-time via the subscribeRanking listener.

export async function saveSingleGroupResult(gameId: string, result: GoalBet): Promise<void> {
  const encoded = encodeBet(result)
  if (encoded === null) return  // skip empty/invalid input — nothing to write
  await setDoc(doc(db, 'results', 'groupStage'), { [gameId]: encoded }, { merge: true })
  invalidateResultsCache()
  scheduleRankingRecompute()
}

export async function deleteSingleGroupResult(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'results', 'groupStage'), { [gameId]: deleteField() })
  invalidateResultsCache()
  scheduleRankingRecompute()
}

export async function saveSingleKnockoutResult(matchId: string, teamId: TeamId): Promise<void> {
  await setDoc(doc(db, 'results', 'knockout'), { [matchId]: teamId }, { merge: true })
  invalidateResultsCache()
  scheduleRankingRecompute()
}

export async function deleteSingleKnockoutResult(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'results', 'knockout'), { [matchId]: deleteField() })
  invalidateResultsCache()
  scheduleRankingRecompute()
}

export async function deleteAllResults(): Promise<void> {
  await Promise.all([
    setDoc(doc(db, 'results', 'groupStage'), {}),
    setDoc(doc(db, 'results', 'knockout'), {}),
  ])
  invalidateResultsCache()
  scheduleRankingRecompute()
}

// ── Ranking ───────────────────────────────────────────────────────────────────

/**
 * One-shot read of the cached ranking. Used by pre-auth screens (AuthScreen
 * public ranking) where onSnapshot can't be used because the user isn't
 * logged in yet. In-app, prefer subscribeRanking() for real-time updates.
 *
 * Cached for RANKING_TTL_MS to reduce Firestore reads when many users open
 * the auth page in quick succession.
 */
export async function loadRanking(forceRefresh = false): Promise<RankingEntry[]> {
  if (!forceRefresh) {
    const cached = readTTL<RankingEntry[]>('bolao_ranking', RANKING_TTL_MS)
    if (cached) return cached
  }
  const snap = await getDoc(doc(db, 'ranking', 'current'))
  const entries: RankingEntry[] = snap.exists()
    ? ((snap.data() as { entries?: RankingEntry[] }).entries ?? [])
    : []
  writeTTL('bolao_ranking', entries)
  return entries
}

export async function updateRankingDoc(rankingArray: RankingEntry[]): Promise<void> {
  await setDoc(doc(db, 'ranking', 'current'), { entries: rankingArray })
  sessionStorage.removeItem('bolao_ranking')
}

/**
 * Subscribe to real-time updates of the ranking document.
 * The callback fires immediately with current data and then on every change.
 * Returns the unsubscribe function — call it to stop listening.
 */
export function subscribeRanking(
  cb: (entries: RankingEntry[]) => void,
  onError?: (err: unknown) => void,
): () => void {
  return onSnapshot(
    doc(db, 'ranking', 'current'),
    snap => {
      const entries = snap.exists()
        ? ((snap.data() as { entries?: RankingEntry[] }).entries ?? [])
        : []
      cb(entries)
    },
    err => { if (onError) onError(err) },
  )
}

/**
 * Recompute the entire ranking from scratch: loads all users' bets + current
 * results + scoring config, calculates everyone's score, sorts, and writes
 * to ranking/current. All subscribers (subscribeRanking) update automatically.
 *
 * Heavy operation — reads N user profiles + 2N bet docs + 2 result docs +
 * 1 scoring config doc. Use scheduleRankingRecompute() instead of calling
 * this directly when reacting to admin result entries (it debounces).
 */
export async function recomputeRanking(): Promise<void> {
  const [users, results, scoringOverride] = await Promise.all([
    loadAllUsersForRanking(),
    loadResults(true),
    loadScoringConfig(),
  ])
  const scoring: ScoringConfig = { ...DEFAULT_SCORING, ...scoringOverride }
  const entries = users.map(u => {
    const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results, scoring)
    return {
      uid:  u.uid,
      name: u.profile.name ?? 'Sem nome',
      pts,
      breakdown,
    }
  })
  const sorted = sortRanking(entries)
  await updateRankingDoc(sorted)
}

/**
 * Debounced ranking recompute. Multiple calls within 2s coalesce into one
 * recompute — useful when the admin enters several results in quick
 * succession (e.g. 6 group games of one round). Failures are silenced
 * (the next call will retry), but logged to console.
 */
let _recomputeTimer: ReturnType<typeof setTimeout> | null = null
const RECOMPUTE_DEBOUNCE_MS = 2000

export function scheduleRankingRecompute(): void {
  if (_recomputeTimer) clearTimeout(_recomputeTimer)
  _recomputeTimer = setTimeout(() => {
    _recomputeTimer = null
    recomputeRanking().catch(e => console.error('[ranking] auto-recompute failed:', e))
  }, RECOMPUTE_DEBOUNCE_MS)
}

export async function loadAllUsersForRanking(): Promise<UserWithBets[]> {
  const list: UserWithBets[] = []
  const seen = new Set<string>()

  try {
    const profilesSnap = await getDocs(collectionGroup(db, 'profile'))
    for (const profileDoc of profilesSnap.docs) {
      if (profileDoc.id !== 'info') continue
      const uid = profileDoc.ref.parent.parent!.id
      if (seen.has(uid)) continue
      seen.add(uid)
      const userRef = profileDoc.ref.parent.parent!
      const [gsSnap, koSnap] = await Promise.all([
        getDoc(doc(userRef, 'bets', 'groupStage')),
        getDoc(doc(userRef, 'bets', 'knockout')),
      ])
      list.push({
        uid,
        profile:      profileDoc.data() as UserProfile,
        groupBets:    gsSnap.exists() ? (gsSnap.data() as GroupBets)    : {},
        knockoutBets: koSnap.exists() ? (koSnap.data() as KnockoutBets) : {},
      })
    }
  } catch {
    const usersSnap = await getDocs(collection(db, 'users'))
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      if (seen.has(uid)) continue
      seen.add(uid)
      const [profileSnap, gsSnap, koSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid, 'profile', 'info')),
        getDoc(doc(db, 'users', uid, 'bets', 'groupStage')),
        getDoc(doc(db, 'users', uid, 'bets', 'knockout')),
      ])
      list.push({
        uid,
        profile:      profileSnap.exists() ? (profileSnap.data() as UserProfile) : { name: '', email: '' },
        groupBets:    gsSnap.exists() ? (gsSnap.data() as GroupBets)    : {},
        knockoutBets: koSnap.exists() ? (koSnap.data() as KnockoutBets) : {},
      })
    }
  }
  return list
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function loadAdminUserList(): Promise<Array<UserProfile & { uid: string }>> {
  const list: Array<UserProfile & { uid: string }> = []
  const seen = new Set<string>()

  try {
    const profilesSnap = await getDocs(collectionGroup(db, 'profile'))
    for (const profileDoc of profilesSnap.docs) {
      if (profileDoc.id !== 'info') continue
      const uid = profileDoc.ref.parent.parent!.id
      if (seen.has(uid)) continue
      seen.add(uid)
      list.push({ uid, ...(profileDoc.data() as UserProfile) })
    }
  } catch {
    const usersSnap = await getDocs(collection(db, 'users'))
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      if (seen.has(uid)) continue
      seen.add(uid)
      const profileSnap = await getDoc(doc(db, 'users', uid, 'profile', 'info'))
      list.push({ uid, ...(profileSnap.exists() ? (profileSnap.data() as UserProfile) : { name: '', email: '' }) })
    }
  }

  list.sort((a, b) => {
    if (a.betsLocked && !b.betsLocked) return -1
    if (!a.betsLocked && b.betsLocked) return 1
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
  return list
}

export async function saveGroupBetsForUser(uid: string, bets: GroupBets): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'bets', 'groupStage'), encodeGroupBets(bets))
}

export async function saveKnockoutBetsForUser(uid: string, bets: KnockoutBets): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'bets', 'knockout'), bets)
}

export async function deleteUserData(uid: string): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'users', uid, 'profile', 'info'))
  batch.delete(doc(db, 'users', uid, 'bets', 'groupStage'))
  batch.delete(doc(db, 'users', uid, 'bets', 'knockout'))
  batch.delete(doc(db, 'users', uid))
  await batch.commit()
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function loadAdminConfig(): Promise<AdminConfig> {
  const snap = await getDoc(doc(db, 'config', 'admin'))
  return snap.exists() ? (snap.data() as AdminConfig) : {}
}

export async function saveAdminConfig(data: Partial<AdminConfig>): Promise<void> {
  await setDoc(doc(db, 'config', 'admin'), data, { merge: true })
}

export async function loadScoringConfig(): Promise<Partial<ScoringConfig>> {
  const snap = await getDoc(doc(db, 'config', 'scoring'))
  return snap.exists() ? (snap.data() as Partial<ScoringConfig>) : {}
}

export async function saveScoringConfig(data: Partial<ScoringConfig>): Promise<void> {
  await setDoc(doc(db, 'config', 'scoring'), data, { merge: true })
}

// suppress unused import warning for serverTimestamp (kept for future use)
void serverTimestamp
