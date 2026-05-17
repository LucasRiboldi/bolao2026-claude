import { useState, useEffect, useCallback } from 'react'
import { loadKnockoutBets, saveKnockoutBets } from '@/lib/firestore'
import type { KnockoutBets, TeamId } from '@/types'

export function useKnockoutBets(uid: string | undefined, locked: boolean) {
  const [bets, setBets] = useState<KnockoutBets>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    loadKnockoutBets(uid)
      .then(setBets)
      .finally(() => setLoading(false))
  }, [uid])

  const pickWinner = useCallback((matchId: string, teamId: TeamId) => {
    if (locked) return
    setBets(prev => ({ ...prev, [matchId]: teamId }))
  }, [locked])

  const persist = useCallback(async () => {
    if (!uid || locked) return
    await saveKnockoutBets(uid, bets)
  }, [uid, bets, locked])

  return { bets, loading, pickWinner, persist }
}
