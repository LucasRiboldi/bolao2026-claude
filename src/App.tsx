import { useAuth } from './contexts/AuthContext'
import { AuthScreen } from './screens/AuthScreen'
import { AppShell } from './components/layout/AppShell'
import { BetScreen } from './screens/BetScreen'
import { MyBetsScreen } from './screens/MyBetsScreen'
import { StandingsScreen } from './screens/StandingsScreen'
import { RankingScreen } from './screens/RankingScreen'
import { InviteScreen } from './screens/InviteScreen'
import { AdminScreen } from './screens/AdminScreen'

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
      {(section) => {
        if (section === 'groups') return <BetScreen />
        if (section === 'mybets') return <MyBetsScreen />
        if (section === 'standings') return <StandingsScreen />
        if (section === 'ranking') return <RankingScreen />
        if (section === 'convidar') return <InviteScreen />
        if (section === 'admin') return <AdminScreen />
        return null
      }}
    </AppShell>
  )
}
