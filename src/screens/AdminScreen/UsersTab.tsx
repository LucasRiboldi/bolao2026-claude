import { useState, useEffect } from 'react'
import {
  loadAdminUserList, lockBets, unlockUserBets, deleteUserData, loadUserBetsForHistory,
} from '@/lib/firestore'
import type { UserProfile, GroupBets, KnockoutBets } from '@/types'
import { GroupBetsView } from '@/screens/MyBetsScreen/GroupBetsView'
import { KnockoutBetsView } from '@/screens/MyBetsScreen/KnockoutBetsView'

type AdminUser = UserProfile & { uid: string }

function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase()
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

interface BetHistoryModalProps {
  user: AdminUser
  onClose: () => void
}

function BetHistoryModal({ user, onClose }: BetHistoryModalProps) {
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

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null)

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
              <button
                className="btn btn-ghost btn-sm"
                aria-label="Ver apostas"
                onClick={() => setHistoryUser(u)}
              >📋</button>
              {u.betsLocked
                ? <button
                    className="btn btn-ghost btn-sm"
                    aria-label="Desbloquear"
                    disabled={busy === u.uid + ':unlock'}
                    onClick={() => handleUnlock(u.uid)}
                  >🔓</button>
                : <button
                    className="btn btn-ghost btn-sm"
                    aria-label="Bloquear"
                    disabled={busy === u.uid + ':lock'}
                    onClick={() => handleLock(u.uid)}
                  >🔒</button>
              }
              <button
                className="btn btn-ghost btn-sm"
                aria-label="Excluir usuário"
                disabled={busy === u.uid + ':delete'}
                onClick={() => handleDelete(u.uid, u.name ?? u.uid)}
              >🗑</button>
            </div>
          </div>
        ))}
      </div>

      {historyUser && (
        <BetHistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />
      )}
    </>
  )
}
