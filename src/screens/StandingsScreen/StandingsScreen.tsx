import { useStandings } from '@/hooks/useStandings'
import { AllGroupTables } from './GroupTable'
import { BracketBlank } from './BracketBlank'
import './StandingsScreen.css'

export function StandingsScreen() {
  const { groupStandings, results, loading, error, refresh } = useStandings()

  return (
    <div id="section-standings" role="tabpanel">
      <div className="standings-refresh-wrap">
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
          {loading ? '…' : '🔄 Atualizar'}
        </button>
      </div>

      {error && (
        <div className="standings-error">⚠️ {error}</div>
      )}

      {loading && (
        <div className="spinner-wrap spinner-wrap--inline">
          <div className="spinner" aria-label="Carregando classificação…" />
        </div>
      )}

      {!loading && (
        <>
          {/* Group standings always render — zeros until results arrive */}
          <AllGroupTables groupStandings={groupStandings} results={results.groupStage} />
          {/* Bracket structure is shown right below the groups */}
          <BracketBlank />
        </>
      )}
    </div>
  )
}
