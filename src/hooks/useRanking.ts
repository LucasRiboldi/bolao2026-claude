import { useState, useEffect, useCallback } from 'react'
import { subscribeRanking, recomputeRanking } from '@/lib/firestore'
import { sortRanking } from '@/utils/scoring'
import type { RankingEntry } from '@/types'

/**
 * Real-time ranking via Firestore onSnapshot. Entries update automatically
 * whenever the admin (or auto-recompute on result save) writes to
 * ranking/current — no manual refresh needed.
 *
 * `forceRecompute` rebuilds the ranking from raw bets + results + scoring
 * config. Useful when scoring config changes, or to bootstrap an empty
 * ranking. Available only when the caller is admin (the underlying writes
 * require admin permissions in firestore.rules).
 */
export function useRanking(isAdmin: boolean) {
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recomputing, setRecomputing] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const unsub = subscribeRanking(
      data => {
        setEntries(sortRanking(data))
        setLoading(false)
      },
      () => {
        setError('Erro ao carregar ranking.')
        setLoading(false)
      },
    )
    return unsub
  }, [])

  const forceRecompute = useCallback(async () => {
    if (!isAdmin) return
    setRecomputing(true)
    try {
      await recomputeRanking()
      // subscribeRanking will fire automatically with the new data
    } catch {
      setError('Erro ao recalcular ranking.')
    } finally {
      setRecomputing(false)
    }
  }, [isAdmin])

  return { entries, loading, error, recomputing, forceRecompute }
}
