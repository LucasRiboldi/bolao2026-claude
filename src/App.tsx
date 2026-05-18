import { lazy, Suspense } from 'react'
import { useAuth } from './contexts/AuthContext'
import { AuthScreen } from './screens/AuthScreen'
import { AppShell } from './components/layout/AppShell'

// Eager: BetScreen is the default landing tab post-login. Keeps the main
// chunk responsive (no suspense fallback on first authenticated view).
import { BetScreen } from './screens/BetScreen'

// Lazy: every other screen ships in its own chunk and downloads on demand.
// AdminScreen alone is ~30% of the post-auth payload and is only ever
// loaded for the single admin account.
const MyBetsScreen    = lazy(() => import('./screens/MyBetsScreen').then(m => ({ default: m.MyBetsScreen })))
const StandingsScreen = lazy(() => import('./screens/StandingsScreen').then(m => ({ default: m.StandingsScreen })))
const RankingScreen   = lazy(() => import('./screens/RankingScreen').then(m => ({ default: m.RankingScreen })))
const InviteScreen    = lazy(() => import('./screens/InviteScreen').then(m => ({ default: m.InviteScreen })))
const AdminScreen     = lazy(() => import('./screens/AdminScreen').then(m => ({ default: m.AdminScreen })))

function ScreenFallback() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-label="Carregando tela…" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="spinner-wrap spinner-wrap--page">
        <div className="spinner" aria-label="Carregando…" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <AppShell>
      {(section) => {
        if (section === 'groups') return <BetScreen />
        return (
          <Suspense fallback={<ScreenFallback />}>
            {section === 'mybets'    && <MyBetsScreen />}
            {section === 'standings' && <StandingsScreen />}
            {section === 'ranking'   && <RankingScreen />}
            {section === 'convidar'  && <InviteScreen />}
            {section === 'admin'     && <AdminScreen />}
          </Suspense>
        )
      }}
    </AppShell>
  )
}
