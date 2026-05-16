import { useState, type ReactNode } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import './AppShell.css'

export type Section = 'groups' | 'mybets' | 'standings' | 'ranking' | 'convidar' | 'admin'

interface AppShellProps {
  children: (section: Section) => ReactNode
  userScore?: number
}

interface NavItem {
  id: Section
  label: string
  icon: ReactNode
  adminOnly?: boolean
  nonAdminOnly?: boolean
  isCopa?: boolean
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export function AppShell({ children, userScore }: AppShellProps) {
  const { profile, isAdmin } = useAuth()
  const [section, setSection] = useState<Section>('groups')

  const firstName = profile?.name?.trim().split(' ')[0] ?? 'Você'

  const navItems: NavItem[] = [
    { id: 'groups',    label: 'APOSTAR',  icon: '⚽' },
    { id: 'mybets',    label: 'BETS',     icon: '📋' },
    { id: 'standings', label: 'COPA',     icon: '🌐', isCopa: true },
    { id: 'ranking',   label: 'RANKING',  icon: '🏆' },
    { id: 'admin',     label: 'CONFIG',   icon: '⚙️', adminOnly: true },
    { id: 'convidar',  label: 'CONVIDAR', icon: <WhatsAppIcon />, nonAdminOnly: true },
  ]

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    if (item.nonAdminOnly && isAdmin) return false
    return true
  })

  async function handleLogout() {
    await signOut(auth)
  }

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-header__brand">Bolão 2026</span>
          <div className="app-header__right">
            <span className="app-header__user">{firstName}</span>
            {userScore !== undefined && (
              <span className="score-pill">{userScore} pts</span>
            )}
            <button className="btn-logout" onClick={handleLogout} aria-label="Sair">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="app-content">
        {children(section)}
      </main>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <nav className="bottom-nav" aria-label="Navegação principal">
      <div role="tablist" style={{ display: 'contents' }}>
        {visibleItems.map(item => (
          <button
            key={item.id}
            className={[
              'bnav-item',
              item.isCopa ? 'bnav-item--copa' : '',
              section === item.id ? 'bnav-item--active' : '',
            ].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={section === item.id}
            aria-controls={`section-${item.id}`}
            onClick={() => setSection(item.id)}
          >
            {item.isCopa ? (
              <>
                <span className="bnav-copa-btn" aria-hidden="true">{item.icon}</span>
                <span className="bnav-lbl">{item.label}</span>
              </>
            ) : (
              <>
                <span className="bnav-icon" aria-hidden="true">{item.icon}</span>
                <span className="bnav-lbl">{item.label}</span>
              </>
            )}
          </button>
        ))}
      </div>
      </nav>
    </>
  )
}
