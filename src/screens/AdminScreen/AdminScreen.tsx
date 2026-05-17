import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UsersTab } from './UsersTab'
import { ResultsTab } from './ResultsTab'
import { ConfigTab } from './ConfigTab'
import './AdminScreen.css'

type AdminTab = 'users' | 'results' | 'config'

export function AdminScreen() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<AdminTab>('users')

  if (!isAdmin) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        ⛔ Acesso restrito
      </div>
    )
  }

  return (
    <div id="section-admin" role="tabpanel">
      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'users'   ? ' admin-tab--active' : ''}`} onClick={() => setTab('users')}>Usuários</button>
        <button className={`admin-tab${tab === 'results' ? ' admin-tab--active' : ''}`} onClick={() => setTab('results')}>Resultados</button>
        <button className={`admin-tab${tab === 'config'  ? ' admin-tab--active' : ''}`} onClick={() => setTab('config')}>Config</button>
      </div>

      {tab === 'users'   && <UsersTab />}
      {tab === 'results' && <ResultsTab />}
      {tab === 'config'  && <ConfigTab />}
    </div>
  )
}
