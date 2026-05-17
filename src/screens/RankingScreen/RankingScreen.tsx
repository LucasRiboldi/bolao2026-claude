import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRanking } from '@/hooks/useRanking'
import type { RankingEntry } from '@/types'
import './RankingScreen.css'

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase()
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function CountUp({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const timer = setTimeout(() => {
      const duration = 900
      const start = Date.now()
      const tick = setInterval(() => {
        const elapsed = Date.now() - start
        const p = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setCount(Math.round(eased * target))
        if (p >= 1) clearInterval(tick)
      }, 16)
      return () => clearInterval(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, delay])
  return <>{count}</>
}

const RANK_META: Record<number, { emoji: string; label: string; cls: string }> = {
  1: { emoji: '👑', label: 'Campeão',  cls: 'rank-gold'   },
  2: { emoji: '🥈', label: '2° lugar', cls: 'rank-silver' },
  3: { emoji: '🥉', label: '3° lugar', cls: 'rank-bronze' },
}

function PodiumCard({ entry, pos, isMe }: { entry: RankingEntry; pos: number; isMe: boolean }) {
  const meta = RANK_META[pos]!
  return (
    <div className={`ranking-podium-card ranking-podium-card--${meta.cls}${isMe ? ' ranking-podium-card--me' : ''}`}>
      <span className="ranking-podium-card__emoji">{meta.emoji}</span>
      <div className="ranking-podium-card__avatar">{initials(entry.name)}</div>
      <div className="ranking-podium-card__name">{entry.name}</div>
      <div className="ranking-podium-card__pts">
        <CountUp target={entry.pts} delay={pos * 120} /> pts
      </div>
      <div className="ranking-podium-card__label">{meta.label}</div>
    </div>
  )
}

function MyPositionCard({ entry, pos }: { entry: RankingEntry; pos: number }) {
  const bd = entry.breakdown
  return (
    <div className="ranking-my-card">
      <div className="ranking-my-card__pos">{pos}º</div>
      <div className="ranking-my-card__body">
        <div className="ranking-my-card__name">Você</div>
        <div className="ranking-my-card__pts">
          <strong><CountUp target={entry.pts} /></strong> pontos
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
  const meta = RANK_META[pos]
  return (
    <div
      className={[
        'ranking-entry',
        isMe ? 'ranking-entry--me' : '',
        pos === 1 ? 'ranking-entry--rank-1' : pos === 2 ? 'ranking-entry--rank-2' : pos === 3 ? 'ranking-entry--rank-3' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--idx': pos } as React.CSSProperties}
    >
      {meta
        ? <span className={`ranking-entry__trophy${pos === 1 ? ' ranking-entry__trophy--first' : ''}`}>{meta.emoji}</span>
        : <span className="ranking-entry__pos">{pos}º</span>
      }
      <div className="ranking-entry__avatar">{initials(entry.name)}</div>
      <span className="ranking-entry__name">{entry.name}</span>
      <span className="ranking-entry__pts">
        <CountUp target={entry.pts} delay={Math.min(pos * 20, 400)} /> pts
      </span>
    </div>
  )
}

export function RankingScreen() {
  const { user, isAdmin } = useAuth()
  const { entries, loading, error, refresh } = useRanking(isAdmin)

  const myPos   = user ? entries.findIndex(e => e.uid === user.uid) : -1
  const myEntry = myPos >= 0 ? entries[myPos] : null

  const podium  = entries.slice(0, Math.min(3, entries.length))
  const rest    = entries.slice(3)

  return (
    <div id="section-ranking" role="tabpanel">
      <div className="ranking-header">
        <span className="ranking-header__title">🏆 Classificação</span>
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
          {myEntry && !loading && <MyPositionCard entry={myEntry} pos={myPos + 1} />}

          {/* Podium (top 3) */}
          {podium.length > 0 && (
            <div className="ranking-podium">
              {podium.map((e, i) => (
                <PodiumCard key={e.uid} entry={e} pos={i + 1} isMe={e.uid === user?.uid} />
              ))}
            </div>
          )}

          {/* Rest of list */}
          {rest.length > 0 && (
            <div className="ranking-list">
              {rest.map((entry, i) => (
                <EntryRow
                  key={entry.uid}
                  entry={entry}
                  pos={i + 4}
                  isMe={entry.uid === user?.uid}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
