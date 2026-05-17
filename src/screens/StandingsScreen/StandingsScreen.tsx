import { useState } from 'react'
import { useStandings } from '@/hooks/useStandings'
import { AllGroupTables } from './GroupTable'
import { KoResults } from './KoResults'
import './StandingsScreen.css'

type Tab = 'grupos' | 'mata-mata'

function EmptyState({ error }: { error: string | null }) {
  return (
    <div className="standings-empty">
      <div className="standings-empty__icon">{error ? '⚠️' : '🕐'}</div>
      <div className="standings-empty__title">
        {error ? 'Erro ao carregar' : 'Aguardando início da Copa…'}
      </div>
      <div className="standings-empty__sub">
        {error ?? 'Os dados aparecerão quando a competição começar.'}
      </div>
    </div>
  )
}

export function StandingsScreen() {
  const [tab, setTab] = useState<Tab>('grupos')
  const { groupStandings, results, hasData, loading, error, refresh } = useStandings()

  return (
    <div id="section-standings" role="tabpanel">
      <div className="standings-tabs">
        <button
          className={`standings-tab${tab === 'grupos' ? ' standings-tab--active' : ''}`}
          onClick={() => setTab('grupos')}
        >
          Grupos
        </button>
        <button
          className={`standings-tab${tab === 'mata-mata' ? ' standings-tab--active' : ''}`}
          onClick={() => setTab('mata-mata')}
        >
          Mata-Mata
        </button>
      </div>

      <div className="standings-refresh-wrap">
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
          {loading ? '…' : '🔄 Atualizar'}
        </button>
      </div>

      {loading && (
        <div className="spinner-wrap" style={{ paddingTop: 32 }}>
          <div className="spinner" aria-label="Carregando classificação…" />
        </div>
      )}

      {!loading && !hasData && <EmptyState error={error} />}

      {!loading && hasData && tab === 'grupos' && (
        <AllGroupTables groupStandings={groupStandings} results={results.groupStage} />
      )}

      {!loading && hasData && tab === 'mata-mata' && (
        <KoResults results={results} />
      )}
    </div>
  )
}
