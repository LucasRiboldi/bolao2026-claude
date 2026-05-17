import { useState, useEffect } from 'react'
import {
  loadAdminUserList, lockBets, unlockUserBets, deleteUserData,
  loadUserBetsForHistory, saveGroupBetsForUser, saveKnockoutBetsForUser,
} from '@/lib/firestore'
import type { UserProfile, GroupBets, KnockoutBets, TeamId } from '@/types'
import { GroupBetsView } from '@/screens/MyBetsScreen/GroupBetsView'
import { KnockoutBetsView } from '@/screens/MyBetsScreen/KnockoutBetsView'
import { GROUP_IDS, generateGroupGames } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'
import type { KnockoutMatch } from '@/types'

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
          ? <div className="spinner-wrap" style={{ padding: 24 }}><div className="spinner" /></div>
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

function KoEditSlot({ match, side, koBets, onPick }: {
  match: KnockoutMatch; side: 'home' | 'away';
  koBets: KnockoutBets; onPick: (id: string, teamId: TeamId) => void
}) {
  const teamId = side === 'home' ? match.home : match.away
  const team = teamId ? TEAMS[teamId] : null
  const selected = !!teamId && koBets[match.id] === teamId
  if (!teamId) return <div className="ko-slot ko-slot--empty"><span className="ko-slot__name">—</span></div>
  return (
    <div
      className={`ko-slot${selected ? ' ko-slot--selected' : ''}`}
      onClick={() => teamId && onPick(match.id, teamId)}
      role="button"
    >
      {team && <Flag iso={team.iso} name={team.name} size="sm" />}
      <span className="ko-slot__name">{team?.name ?? teamId}</span>
      {selected && <span className="ko-slot__check">✓</span>}
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

  function pickKo(matchId: string, teamId: TeamId) {
    setKoBets(prev => ({ ...prev, [matchId]: teamId }))
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
  const r32 = buildR32(qualified)
  const allResolved: Record<string, KnockoutMatch> = {}
  for (const m of r32) allResolved[m.id] = m
  const koRounds = [
    { name: 'Round de 32', matches: r32 },
    ...KNOCKOUT_ROUNDS.map(round => {
      const resolved = resolveKnockoutRound(round.matches, koBets, allResolved)
      for (const m of resolved) allResolved[m.id] = m
      return { name: round.name, matches: resolved }
    }),
  ]

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
          ? <div className="spinner-wrap" style={{ padding: 24 }}><div className="spinner" /></div>
          : <div className="edit-bets-body">
              <div className="admin-section-label">Fase de Grupos</div>
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

              <div className="admin-section-label" style={{ marginTop: 8 }}>Mata-Mata</div>
              {koRounds.map(round => (
                <div key={round.name}>
                  <div className="admin-section-label" style={{ fontSize: '.58rem' }}>{round.name}</div>
                  {round.matches.map(match => (
                    <div key={match.id} className="ko-match">
                      <KoEditSlot match={match} side="home" koBets={koBets} onPick={pickKo} />
                      <KoEditSlot match={match} side="away" koBets={koBets} onPick={pickKo} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)

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

  if (loading) {
    return <div className="spinner-wrap" style={{ paddingTop: 32 }}><div className="spinner" aria-label="Carregando usuários…" /></div>
  }

  return (
    <>
      <div className="admin-section-label">{users.length} participantes</div>
      <div className="admin-user-list">
        {users.map(u => (
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

      {historyUser && <BetHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />}
      {editUser && <EditBetsModal user={editUser} onClose={() => setEditUser(null)} />}
    </>
  )
}
