import { useAuth } from '@/contexts/AuthContext'
import { useRanking } from '@/hooks/useRanking'
import type { RankingEntry } from '@/types'
import './RankingScreen.css'

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase()
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

const TROPHIES = ['🥇', '🥈', '🥉']

function MyPositionCard({ entry, pos }: { entry: RankingEntry; pos: number }) {
  const bd = entry.breakdown
  return (
    <div className="ranking-my-card">
      <div className="ranking-my-card__pos">{pos}º</div>
      <div className="ranking-my-card__body">
        <div className="ranking-my-card__name">Você</div>
        <div className="ranking-my-card__pts">
          <strong>{entry.pts}</strong> pontos
        </div>
        {bd && (
          <div className="ranking-breakdown">
            <span className="ranking-breakdown__item">Exato <strong>{bd.exact}</strong></span>
            <span className="ranking-breakdown__item">Resultado <strong>{bd.result}</strong></span>
            <span className="ranking-breakdown__item">Mata-mata <strong>{bd.ko}</strong></span>
            {bd.bonus > 0 && <span className="ranking-breakdown__item">Bônus <strong>{bd.bonus}</strong></span>}
          </div>
        )}
      </div>
    </div>
  )
}

function EntryRow({ entry, pos, isMe }: { entry: RankingEntry; pos: number; isMe: boolean }) {
  const trophy = TROPHIES[pos - 1]
  return (
    <div className={`ranking-entry${isMe ? ' ranking-entry--me' : ''}`}>
      {trophy
        ? <span className="ranking-entry__trophy">{trophy}</span>
        : <span className="ranking-entry__pos">{pos}º</span>
      }
      <div className="ranking-entry__avatar">{initials(entry.name)}</div>
      <span className="ranking-entry__name">{entry.name}</span>
      <span className="ranking-entry__pts">{entry.pts} pts</span>
    </div>
  )
}

export function RankingScreen() {
  const { user, isAdmin } = useAuth()
  const { entries, loading, error, refresh } = useRanking(isAdmin)

  const myPos = user ? entries.findIndex(e => e.uid === user.uid) : -1
  const myEntry = myPos >= 0 ? entries[myPos] : null

  return (
    <div id="section-ranking" role="tabpanel">
      <div className="ranking-header">
        <span className="ranking-header__title">Classificação</span>
        <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
          {loading ? '…' : '🔄 Atualizar'}
        </button>
      </div>

      {loading && (
        <div className="spinner-wrap" style={{ paddingTop: 32 }}>
          <div className="spinner" aria-label="Carregando ranking…" />
        </div>
      )}

      {!loading && error && (
        <div className="ranking-empty">
          <div className="ranking-empty__icon">⚠️</div>
          <div className="ranking-empty__title">Erro ao carregar</div>
          <div className="ranking-empty__sub">{error}</div>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="ranking-empty">
          <div className="ranking-empty__icon">🏆</div>
          <div className="ranking-empty__title">Ranking ainda não disponível</div>
          <div className="ranking-empty__sub">Os pontos serão calculados após o início da Copa.</div>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          {myEntry && <MyPositionCard entry={myEntry} pos={myPos + 1} />}

          <div className="ranking-list">
            {entries.map((entry, i) => (
              <EntryRow
                key={entry.uid}
                entry={entry}
                pos={i + 1}
                isMe={entry.uid === user?.uid}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
