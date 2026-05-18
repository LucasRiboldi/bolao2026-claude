import { useState, useEffect } from 'react'
import {
  loadAdminUserList, lockBets, unlockUserBets, deleteUserData,
  loadUserBetsForHistory, saveGroupBetsForUser, saveKnockoutBetsForUser,
} from '@/lib/firestore'
import type { UserProfile, GroupBets, KnockoutBets, KoArrayKey, KoSingleKey, TeamId } from '@/types'
import { GroupBetsView } from '@/screens/MyBetsScreen/GroupBetsView'
import { KnockoutBetsView } from '@/screens/MyBetsScreen/KnockoutBetsView'
import { GROUP_IDS, generateGroupGames } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { buildR32 } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'
import { AdminPageHeader } from './AdminPageHeader'

type AdminUser = UserProfile & { uid: string }

function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase()
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// ── View modal ────────────────────────────────────────────────────────────────

function BetHistoryModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [groupBets, setGroupBets] = useState<GroupBets>({})
  const [koBets, setKoBets] = useState<KnockoutBets>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserBetsForHistory(user.uid)
      .then(d => { setGroupBets(d.groupBets); setKoBets(d.knockoutBets) })
      .finally(() => setLoading(false))
  }, [user.uid])

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-label={`Apostas de ${user.name}`}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <span className="admin-modal__title">📋 {user.name}</span>
          <button className="admin-modal__close" onClick={onClose}>Fechar</button>
        </div>
        {loading
          ? <div className="spinner-wrap spinner-wrap--sm"><div className="spinner" /></div>
          : <>
              <GroupBetsView bets={groupBets} />
              <KnockoutBetsView groupBets={groupBets} koBets={koBets} />
            </>
        }
      </div>
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function Stepper({ value, onDec, onInc }: { value: string; onDec: () => void; onInc: () => void }) {
  const n = value === '' ? null : parseInt(value, 10)
  return (
    <div className="stepper">
      <button className="stepper__btn" onClick={onDec} disabled={n === null || n <= 0} aria-label="Diminuir">−</button>
      <div className={`stepper__val${n !== null ? ' stepper__val--filled' : ''}`}>{n ?? '?'}</div>
      <button className="stepper__btn" onClick={onInc} aria-label="Aumentar">+</button>
    </div>
  )
}

function KoChip({ teamId, selected, onClick }: { teamId: TeamId; selected: boolean; onClick: () => void }) {
  const team = TEAMS[teamId]
  if (!team) return null
  return (
    <div
      className={['ko-chip', selected ? 'ko-chip--selected' : ''].join(' ')}
      onClick={onClick}
      role="button"
      title={team.name}
    >
      <Flag iso={team.iso} name={team.name} size="sm" />
      <span className="ko-chip__name">{team.name}</span>
      {selected && <span className="ko-chip__check">✓</span>}
    </div>
  )
}

function KoRoundEdit({ label, color, teams, picked, onToggle, cols = 4 }: {
  label: string; color: string; teams: TeamId[]
  picked: TeamId[]; onToggle: (t: TeamId) => void; cols?: number
}) {
  const sorted = [...teams].sort((a, b) => (TEAMS[a]?.name ?? '').localeCompare(TEAMS[b]?.name ?? '', 'pt-BR'))
  if (sorted.length === 0) return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{label}</span>
      </div>
      <div className="ko-round-empty">Preencha a fase anterior</div>
    </div>
  )
  return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{label}</span>
        <span className="ko-round-badge" style={{ background: color }}>{picked.length}</span>
      </div>
      <div className="ko-chip-grid" style={{ '--ko-cols': cols } as React.CSSProperties}>
        {sorted.map(t => (
          <KoChip key={t} teamId={t} selected={picked.includes(t)} onClick={() => onToggle(t)} />
        ))}
      </div>
    </div>
  )
}

function EditBetsModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [groupBets, setGroupBets] = useState<GroupBets>({})
  const [koBets, setKoBets] = useState<KnockoutBets>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadUserBetsForHistory(user.uid)
      .then(d => { setGroupBets(d.groupBets); setKoBets(d.knockoutBets) })
      .finally(() => setLoading(false))
  }, [user.uid])

  function adjust(gameId: string, side: 'home' | 'away', delta: number) {
    setGroupBets(prev => {
      const b = prev[gameId] ?? { homeGoals: '', awayGoals: '' }
      const curr = side === 'home' ? b.homeGoals : b.awayGoals
      const n = curr === '' ? 0 : parseInt(curr, 10)
      const next = String(Math.max(0, n + delta))
      return { ...prev, [gameId]: side === 'home' ? { ...b, homeGoals: next } : { ...b, awayGoals: next } }
    })
  }

  function init(gameId: string, side: 'home' | 'away') {
    setGroupBets(prev => {
      const b = prev[gameId]
      if (b?.homeGoals !== '' || b?.awayGoals !== '') return prev
      return { ...prev, [gameId]: side === 'home' ? { homeGoals: '0', awayGoals: '' } : { homeGoals: '', awayGoals: '0' } }
    })
  }

  function toggleKo(round: KoArrayKey, teamId: TeamId) {
    setKoBets(prev => {
      const arr = prev[round] ?? []
      const has = arr.includes(teamId)
      if (!has) return { ...prev, [round]: [...arr, teamId] }
      const next: KnockoutBets = { ...prev, [round]: arr.filter(t => t !== teamId) }
      const order: (KoArrayKey | KoSingleKey)[] = ['r32', 'r16', 'qf', 'sf', 'champion', 'third']
      for (const later of order.slice(order.indexOf(round) + 1)) {
        if (later === 'champion' || later === 'third') { if (next[later] === teamId) delete next[later] }
        else { next[later] = (next[later] ?? []).filter(t => t !== teamId) }
      }
      return next
    })
  }

  function setSingleKo(round: KoSingleKey, teamId: TeamId) {
    setKoBets(prev => ({ ...prev, [round]: prev[round] === teamId ? undefined : teamId }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveGroupBetsForUser(user.uid, groupBets)
      await saveKnockoutBetsForUser(user.uid, koBets)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const standings = calcGroupStandings(groupBets)
  const qualified = getQualified(standings)
  const r32Matches = buildR32(qualified)
  const r32Pool = [...new Set(r32Matches.flatMap(m => [m.home, m.away]).filter(Boolean) as TeamId[])]
  const r16Pool = koBets.r32 ?? []
  const qfPool  = koBets.r16 ?? []
  const sfPool  = koBets.qf  ?? []
  const thirdPool = (koBets.qf ?? []).filter(t => !(koBets.sf ?? []).includes(t))
  const finalPool = koBets.sf ?? []

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-label={`Editar apostas de ${user.name}`}>
      <div className="admin-modal admin-modal--wide">
        <div className="admin-modal__header">
          <span className="admin-modal__title">✏️ Editar — {user.name}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-gold btn-sm${saved ? ' btn--saved' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? '✓ Salvo' : saving ? 'Salvando…' : '💾 Salvar'}
            </button>
            <button className="admin-modal__close" onClick={onClose}>Fechar</button>
          </div>
        </div>
        {loading
          ? <div className="spinner-wrap spinner-wrap--sm"><div className="spinner" /></div>
          : <div className="edit-bets-body">
              <div className="section-label">Fase de Grupos</div>
              {GROUP_IDS.map(gId => {
                const games = generateGroupGames(gId)
                return (
                  <div key={gId} className="edit-group">
                    <div className="edit-group__title">Grupo {gId}</div>
                    {games.map(game => {
                      const b = groupBets[game.id] ?? { homeGoals: '', awayGoals: '' }
                      const ht = TEAMS[game.home], at = TEAMS[game.away]
                      return (
                        <div key={game.id} className="match-row-bet">
                          <div className="match-team-left">
                            <span className="match-team-name">{ht?.name ?? game.home}</span>
                            {ht && <Flag iso={ht.iso} name={ht.name} size="sm" />}
                          </div>
                          <div className="match-score-center">
                            <Stepper value={b.homeGoals} onDec={() => adjust(game.id, 'home', -1)} onInc={() => { init(game.id, 'home'); adjust(game.id, 'home', 1) }} />
                            <span className="match-sep">×</span>
                            <Stepper value={b.awayGoals} onDec={() => adjust(game.id, 'away', -1)} onInc={() => { init(game.id, 'away'); adjust(game.id, 'away', 1) }} />
                          </div>
                          <div className="match-team-right">
                            {at && <Flag iso={at.iso} name={at.name} size="sm" />}
                            <span className="match-team-name">{at?.name ?? game.away}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              <div className="section-label" style={{ marginTop: 8 }}>Mata-Mata</div>
              <KoRoundEdit label="Round de 32" color="#e74c3c" teams={r32Pool} picked={koBets.r32 ?? []} onToggle={t => toggleKo('r32', t)} />
              <KoRoundEdit label="Oitavas" color="#e67e22" teams={r16Pool} picked={koBets.r16 ?? []} onToggle={t => toggleKo('r16', t)} />
              <KoRoundEdit label="Quartas" color="#f39c12" teams={qfPool} picked={koBets.qf ?? []} onToggle={t => toggleKo('qf', t)} />
              <KoRoundEdit label="Semifinais" color="#2ecc71" teams={sfPool} picked={koBets.sf ?? []} onToggle={t => toggleKo('sf', t)} cols={2} />
              <div className="ko-finals-row">
                <div className="ko-finals-col">
                  <KoRoundEdit label="3° Lugar" color="#607d8b" teams={thirdPool} picked={koBets.third ? [koBets.third] : []} onToggle={t => setSingleKo('third', t)} cols={1} />
                </div>
                <div className="ko-finals-col">
                  <KoRoundEdit label="Campeão" color="#d4aa2c" teams={finalPool} picked={koBets.champion ? [koBets.champion] : []} onToggle={t => setSingleKo('champion', t)} cols={1} />
                </div>
              </div>
            </div>
        }
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

type UserFilter = 'all' | 'locked' | 'open'

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')

  useEffect(() => {
    loadAdminUserList().then(setUsers).finally(() => setLoading(false))
  }, [])

  async function handleLock(uid: string) {
    setBusy(uid + ':lock')
    await lockBets(uid)
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, betsLocked: true } : u))
    setBusy(null)
  }

  async function handleUnlock(uid: string) {
    setBusy(uid + ':unlock')
    await unlockUserBets(uid)
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, betsLocked: false } : u))
    setBusy(null)
  }

  async function handleDelete(uid: string, name: string) {
    if (!confirm(`Excluir todos os dados de ${name}? Esta ação não pode ser desfeita.`)) return
    setBusy(uid + ':delete')
    await deleteUserData(uid)
    setUsers(prev => prev.filter(u => u.uid !== uid))
    setBusy(null)
  }

  // Derived: filtered+searched list
  const filtered = users.filter(u => {
    if (filter === 'locked' && !u.betsLocked) return false
    if (filter === 'open' && u.betsLocked) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
  })

  const lockedCount = users.filter(u => u.betsLocked).length
  const openCount = users.length - lockedCount

  if (loading) {
    return <div className="spinner-wrap spinner-wrap--inline"><div className="spinner" aria-label="Carregando usuários…" /></div>
  }

  return (
    <>
      <AdminPageHeader
        icon="👥"
        title="Gerenciar participantes"
        description={`${users.length} cadastrados · ${openCount} liberados · ${lockedCount} bloqueados`}
      />

      <div className="admin-toolbar">
        <input
          type="search"
          className="input"
          placeholder="🔍 Buscar por nome ou e-mail…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Buscar participante"
        />
        <div className="admin-filter-chips" role="radiogroup" aria-label="Filtrar por status">
          <button
            className={`filter-chip${filter === 'all' ? ' filter-chip--active' : ''}`}
            onClick={() => setFilter('all')}
            role="radio"
            aria-checked={filter === 'all'}
          >
            Todos <span className="filter-chip__count">{users.length}</span>
          </button>
          <button
            className={`filter-chip${filter === 'open' ? ' filter-chip--active' : ''}`}
            onClick={() => setFilter('open')}
            role="radio"
            aria-checked={filter === 'open'}
          >
            🟢 Liberados <span className="filter-chip__count">{openCount}</span>
          </button>
          <button
            className={`filter-chip${filter === 'locked' ? ' filter-chip--active' : ''}`}
            onClick={() => setFilter('locked')}
            role="radio"
            aria-checked={filter === 'locked'}
          >
            🔒 Bloqueados <span className="filter-chip__count">{lockedCount}</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <div className="empty-state__title">Nenhum participante encontrado</div>
          <div className="empty-state__sub">
            {query ? `Nenhum resultado para "${query}"` : 'Ajuste o filtro acima'}
          </div>
        </div>
      ) : (
        <div className="admin-user-list">
          {filtered.map(u => (
            <div key={u.uid} className="admin-user-row">
              <div className="admin-user-row__avatar">{avatarInitials(u.name ?? '?')}</div>
              <div className="admin-user-row__info">
                <div className="admin-user-row__name">{u.name || '—'}</div>
                <div className="admin-user-row__email">{u.email}</div>
              </div>
              <span className={`admin-user-row__badge ${u.betsLocked ? 'admin-user-row__badge--locked' : 'admin-user-row__badge--open'}`}>
                {u.betsLocked ? '🔒' : '🟢'}
              </span>
              <div className="admin-user-row__actions">
                <button className="btn btn-ghost btn-sm" aria-label="Ver apostas" title="Ver apostas" onClick={() => setHistoryUser(u)}>📋</button>
                <button className="btn btn-ghost btn-sm" aria-label="Editar apostas" title="Editar apostas" onClick={() => setEditUser(u)}>✏️</button>
                {u.betsLocked
                  ? <button className="btn btn-ghost btn-sm" aria-label="Desbloquear" title="Desbloquear" disabled={busy === u.uid + ':unlock'} onClick={() => handleUnlock(u.uid)}>🔓</button>
                  : <button className="btn btn-ghost btn-sm" aria-label="Bloquear" title="Bloquear" disabled={busy === u.uid + ':lock'} onClick={() => handleLock(u.uid)}>🔒</button>
                }
                <button className="btn btn-ghost btn-sm" aria-label="Excluir usuário" title="Excluir" disabled={busy === u.uid + ':delete'} onClick={() => handleDelete(u.uid, u.name ?? u.uid)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {historyUser && <BetHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
      {editUser && <EditBetsModal user={editUser} onClose={() => setEditUser(null)} />}
    </>
  )
}
