import { useAuth } from './contexts/AuthContext'

// Screens — to be implemented per layout approval
// import { AuthScreen }    from './screens/AuthScreen'
// import { AppShell }      from './components/layout/AppShell'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  // Routing and screen rendering will be added as each layout is approved
  return (
    <div style={{ padding: 24, color: 'var(--text)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Scaffold pronto. Aguardando aprovação dos layouts.
      </p>
    </div>
  )
}
