import { useState, useEffect } from 'react'
import { loadRanking, loadAllUsersForRanking, updateRankingDoc, loadScoringConfig } from '@/lib/firestore'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import type { RankingEntry, ScoringConfig } from '@/types'

export function useRanking(isAdmin: boolean) {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const scoringOverride = await loadScoringConfig()
      const scoring: ScoringConfig = { ...DEFAULT_SCORING, ...scoringOverride }

      let data = await loadRanking()

      if (data.length === 0 && isAdmin) {
        const users = await loadAllUsersForRanking()
        const computed = users.map(u => {
          const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, { groupStage: {}, knockout: {} }, scoring)
          return { uid: u.uid, name: u.profile.name ?? 'Sem nome', pts, breakdown }
        })
        data = sortRanking(computed)
        await updateRankingDoc(data)
      }

      setEntries(sortRanking(data))
    } catch (e) {
      setError('Erro ao carregar ranking.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, loading, error, refresh }
}
