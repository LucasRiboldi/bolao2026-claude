import {
  doc, collection, collectionGroup,
  getDoc, getDocs, setDoc, updateDoc, deleteField,
  writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  GroupBets, KnockoutBets, UserProfile, Results, GoalBet, TeamId,
  RankingEntry, UserWithBets, AdminConfig, ScoringConfig,
} from '@/types'

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
  await setDoc(doc(db, 'users', uid, 'bets', 'groupStage'), bets)
}

export async function loadGroupBets(uid: string): Promise<GroupBets> {
  const snap = await getDoc(doc(db, 'users', uid, 'bets', 'groupStage'))
  return snap.exists() ? (snap.data() as GroupBets) : {}
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
    groupBets:    gs.exists() ? (gs.data() as GroupBets) : {},
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

// ── Results ───────────────────────────────────────────────────────────────────

let _resultsCache: Results | null = null

export async function loadResults(forceRefresh = false): Promise<Results> {
  if (_resultsCache && !forceRefresh) return _resultsCache

  const cached = sessionStorage.getItem('bolao_results')
  if (cached && !forceRefresh) {
    try {
      _resultsCache = JSON.parse(cached) as Results
      return _resultsCache
    } catch { /* ignore */ }
  }

  const [gs, ko] = await Promise.all([
    getDoc(doc(db, 'results', 'groupStage')),
    getDoc(doc(db, 'results', 'knockout')),
  ])
  const data: Results = {
    groupStage: gs.exists() ? (gs.data() as Results['groupStage']) : {},
    knockout:   ko.exists() ? (ko.data() as Results['knockout'])   : {},
  }
  _resultsCache = data
  sessionStorage.setItem('bolao_results', JSON.stringify(data))
  return data
}

export function invalidateResultsCache(): void {
  _resultsCache = null
  sessionStorage.removeItem('bolao_results')
}

export async function saveGroupResults(results: Results['groupStage']): Promise<void> {
  await setDoc(doc(db, 'results', 'groupStage'), results, { merge: true })
  invalidateResultsCache()
}

export async function saveKnockoutResults(results: Results['knockout']): Promise<void> {
  await setDoc(doc(db, 'results', 'knockout'), results, { merge: true })
  invalidateResultsCache()
}

// Per-game / per-match operations (admin live editing) ────────────────────────

export async function saveSingleGroupResult(gameId: string, result: GoalBet): Promise<void> {
  await setDoc(doc(db, 'results', 'groupStage'), { [gameId]: result }, { merge: true })
  invalidateResultsCache()
}

export async function deleteSingleGroupResult(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'results', 'groupStage'), { [gameId]: deleteField() })
  invalidateResultsCache()
}

export async function saveSingleKnockoutResult(matchId: string, teamId: TeamId): Promise<void> {
  await setDoc(doc(db, 'results', 'knockout'), { [matchId]: teamId }, { merge: true })
  invalidateResultsCache()
}

export async function deleteSingleKnockoutResult(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'results', 'knockout'), { [matchId]: deleteField() })
  invalidateResultsCache()
}

export async function deleteAllResults(): Promise<void> {
  await Promise.all([
    setDoc(doc(db, 'results', 'groupStage'), {}),
    setDoc(doc(db, 'results', 'knockout'), {}),
  ])
  invalidateResultsCache()
}

// ── Ranking ───────────────────────────────────────────────────────────────────

export async function loadRanking(forceRefresh = false): Promise<RankingEntry[]> {
  if (!forceRefresh) {
    const cached = sessionStorage.getItem('bolao_ranking')
    if (cached) {
      try { return JSON.parse(cached) as RankingEntry[] } catch { /* ignore */ }
    }
  }
  const snap = await getDoc(doc(db, 'ranking', 'current'))
  const entries: RankingEntry[] = snap.exists() ? (snap.data() as { entries: RankingEntry[] }).entries : []
  if (entries.length > 0) sessionStorage.setItem('bolao_ranking', JSON.stringify(entries))
  return entries
}

export async function updateRankingDoc(rankingArray: RankingEntry[]): Promise<void> {
  await setDoc(doc(db, 'ranking', 'current'), { entries: rankingArray })
  sessionStorage.removeItem('bolao_ranking')
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
  await setDoc(doc(db, 'users', uid, 'bets', 'groupStage'), bets)
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
