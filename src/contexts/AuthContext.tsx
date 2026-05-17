import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, ADMIN_EMAIL } from '@/lib/firebase'
import { loadProfile, saveProfile, loadAdminConfig } from '@/lib/firestore'
import type { UserProfile } from '@/types'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isAdmin: boolean
  globalLocked: boolean
  loading: boolean
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isAdmin: false,
  globalLocked: false,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    globalLocked: false,
    loading: true,
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        setState({ user: null, profile: null, isAdmin: false, globalLocked: false, loading: false })
        return
      }

      const isAdmin = user.email === ADMIN_EMAIL
      const [profileLoaded, config] = await Promise.all([
        loadProfile(user.uid),
        loadAdminConfig(),
      ])

      let profile = profileLoaded
      if (!profile) {
        const newProfile: UserProfile = {
          name: user.displayName ?? user.email?.split('@')[0] ?? 'Usuário',
          email: user.email ?? '',
        }
        await saveProfile(user.uid, newProfile)
        profile = newProfile
      }

      setState({
        user,
        profile,
        isAdmin,
        globalLocked: config.globalLocked ?? false,
        loading: false,
      })
    })
    return unsub
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
