import { useAuth } from './contexts/AuthContext'
import { AuthScreen } from './screens/AuthScreen'
import { AppShell } from './components/layout/AppShell'
import type { Section } from './components/layout/AppShell'

// Placeholder screens — replaced as each layout is approved
function PlaceholderScreen({ section }: { section: Section }) {
  const labels: Record<Section, string> = {
    groups:    '⚽ Apostar',
    mybets:    '📋 Minhas Apostas',
    standings: '🌐 Classificação Copa',
    ranking:   '🏆 Ranking',
    convidar:  '↗ Convidar Amigos',
    admin:     '⚙️ Admin',
  }
  return (
    <div style={{ padding: '32px 16px', color: 'var(--text-muted)', fontSize: '.875rem', textAlign: 'center' }}>
      {labels[section]} — em desenvolvimento
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '100vh' }}>
        <div className="spinner" aria-label="Carregando…" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <AppShell>
      {(section) => <PlaceholderScreen section={section} />}
    </AppShell>
  )
}
