import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminDashboard } from './AdminDashboard'
import { UsersTab } from './UsersTab'
import { ResultsTab } from './ResultsTab'
import { ConfigTab } from './ConfigTab'
import { ToolsTab } from './ToolsTab'
import './AdminScreen.css'

type AdminTab = 'users' | 'results' | 'config' | 'tools'

const TABS: Array<{ id: AdminTab; icon: string; label: string }> = [
  { id: 'users',   icon: '👥', label: 'Usuários' },
  { id: 'results', icon: '⚽', label: 'Resultados' },
  { id: 'config',  icon: '⚙️', label: 'Configurações' },
  { id: 'tools',   icon: '🛠', label: 'Ferramentas' },
]

export function AdminScreen() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<AdminTab>('users')

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-denied__icon">⛔</div>
        <div className="admin-access-denied__title">Acesso restrito</div>
        <div className="admin-access-denied__sub">
          Esta área é exclusiva para o administrador do bolão.
        </div>
      </div>
    )
  }

  return (
    <div id="section-admin" role="tabpanel" className="admin-screen">
      <AdminDashboard />

      <nav className="admin-tabs" role="tablist" aria-label="Seções do admin">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab${tab === t.id ? ' admin-tab--active' : ''}`}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <span className="admin-tab__icon" aria-hidden="true">{t.icon}</span>
            <span className="admin-tab__label">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-tab-content">
        {tab === 'users'   && <UsersTab />}
        {tab === 'results' && <ResultsTab />}
        {tab === 'config'  && <ConfigTab />}
        {tab === 'tools'   && <ToolsTab />}
      </div>
    </div>
  )
}
