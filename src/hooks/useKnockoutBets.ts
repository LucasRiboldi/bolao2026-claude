import { useState, useEffect, useCallback } from 'react'
import { loadKnockoutBets, saveKnockoutBets } from '@/lib/firestore'
import type { KnockoutBets, KoArrayKey, KoSingleKey, TeamId } from '@/types'

/**
 * Maximum picks per knockout round — equals the number of teams that advance
 * to the next round (FIFA Art. 12). Selecting beyond this limit is blocked.
 */
export const KO_ROUND_MAX: Record<KoArrayKey, number> = {
  r32: 16, // 16 winners advance to R16
  r16:  8, //  8 winners advance to QF
  qf:   4, //  4 winners advance to SF
  sf:   2, //  2 winners advance to Final
}

export function useKnockoutBets(uid: string | undefined, locked: boolean) {
  const [bets, setBets] = useState<KnockoutBets>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

      // Add — blocked if already at round's max
      if (!has) {
        if (arr.length >= KO_ROUND_MAX[round]) return prev
        return { ...prev, [round]: [...arr, teamId] }
      }

      // Remove + cascade to later rounds
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

  const save = useCallback(async () => {
    if (!uid || locked) return
    setSaving(true)
    try { await saveKnockoutBets(uid, bets) }
    finally { setSaving(false) }
  }, [uid, bets, locked])

  return { bets, loading, saving, togglePick, setSingle, save }
}
