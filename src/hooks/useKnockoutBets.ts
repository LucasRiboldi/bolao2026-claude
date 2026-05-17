import { useState, useEffect, useCallback } from 'react'
import { loadKnockoutBets, saveKnockoutBets } from '@/lib/firestore'
import type { KnockoutBets, KoArrayKey, KoSingleKey, TeamId } from '@/types'

export function useKnockoutBets(uid: string | undefined, locked: boolean) {
  const [bets, setBets] = useState<KnockoutBets>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    loadKnockoutBets(uid)
      .then(setBets)
      .finally(() => setLoading(false))
  }, [uid])

  const togglePick = useCallback((round: KoArrayKey, teamId: TeamId) => {
    if (locked) return
    setBets(prev => {
      const arr = prev[round] ?? []
      const has = arr.includes(teamId)
      if (!has) return { ...prev, [round]: [...arr, teamId] }

      // Remove and cascade to later rounds
      const next: KnockoutBets = { ...prev, [round]: arr.filter(t => t !== teamId) }
      const order: (KoArrayKey | KoSingleKey)[] = ['r32', 'r16', 'qf', 'sf', 'champion', 'third']
      for (const later of order.slice(order.indexOf(round) + 1)) {
        if (later === 'champion' || later === 'third') {
          if (next[later] === teamId) delete next[later]
        } else {
          next[later] = (next[later] ?? []).filter(t => t !== teamId)
        }
      }
      return next
    })
  }, [locked])

  const setSingle = useCallback((round: KoSingleKey, teamId: TeamId) => {
    if (locked) return
    setBets(prev => ({ ...prev, [round]: prev[round] === teamId ? undefined : teamId }))
  }, [locked])

  const persist = useCallback(async () => {
    if (!uid || locked) return
    await saveKnockoutBets(uid, bets)
  }, [uid, bets, locked])

  return { bets, loading, togglePick, setSingle, persist }
}
