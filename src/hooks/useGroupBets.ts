import { useState, useEffect, useCallback } from 'react'
import { loadGroupBets, saveGroupBets, lockBets } from '@/lib/firestore'
import type { GroupBets } from '@/types'

export function useGroupBets(uid: string | undefined, locked: boolean) {
  const [bets, setBets] = useState<GroupBets>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    loadGroupBets(uid)
      .then(setBets)
      .finally(() => setLoading(false))
  }, [uid])

  const setBet = useCallback((gameId: string, homeGoals: string, awayGoals: string) => {
    if (locked) return
    setBets(prev => ({ ...prev, [gameId]: { homeGoals, awayGoals } }))
  }, [locked])

  const save = useCallback(async () => {
    if (!uid || locked) return
    setSaving(true)
    try {
      await saveGroupBets(uid, bets)
      await lockBets(uid)
    } finally {
      setSaving(false)
    }
  }, [uid, bets, locked])

  return { bets, loading, saving, setBet, save }
}
