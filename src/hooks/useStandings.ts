import { useState, useEffect, useCallback } from 'react'
import { loadResults } from '@/lib/firestore'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import type { Results, GroupId, StandingRow, QualifiedTeams } from '@/types'

export interface StandingsState {
  groupStandings: Record<GroupId, StandingRow[]>
  qualified: QualifiedTeams
  results: Results
  hasData: boolean
  loading: boolean
  error: string | null
}

const EMPTY_RESULTS: Results = { groupStage: {}, knockout: {} }

export function useStandings() {
  const [state, setState] = useState<StandingsState>({
    groupStandings: {} as Record<GroupId, StandingRow[]>,
    qualified: { winners: {} as QualifiedTeams['winners'], runners: {} as QualifiedTeams['runners'], thirds: [] },
    results: EMPTY_RESULTS,
    hasData: false,
    loading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const results = await loadResults()
      const groupStandings = calcGroupStandings(results.groupStage)
      const qualified = getQualified(groupStandings)
      const hasData = Object.keys(results.groupStage).length > 0 || Object.keys(results.knockout).length > 0
      setState({ groupStandings, qualified, results, hasData, loading: false, error: null })
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Falha ao carregar classificação.' }))
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { ...state, refresh: fetch }
}
