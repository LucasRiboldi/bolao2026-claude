import { useAuth } from './contexts/AuthContext'
import { AuthScreen } from './screens/AuthScreen'

// Dashboard shell will be added after layout approval
// import { AppShell } from './components/layout/AppShell'

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

  // Placeholder until AppShell is approved and implemented
  return (
    <div style={{ padding: 24, color: 'var(--text)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Logado como {user.email}. AppShell em desenvolvimento.
      </p>
    </div>
  )
}
