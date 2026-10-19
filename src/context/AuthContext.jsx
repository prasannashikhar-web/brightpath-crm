import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './authContextDef'
import {
  signIn as serviceSignIn,
  signUp as serviceSignUp,
  signOut as serviceSignOut,
  fetchUserProfile
} from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load and refresh user profile with retry fallback
  const loadProfile = useCallback(async (userId, userMetadata = {}) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    let p = await fetchUserProfile(userId)

    // If trigger was asynchronous, retry once
    if (!p) {
      await new Promise((r) => setTimeout(r, 600))
      p = await fetchUserProfile(userId)
    }

    if (!p) {
      // Graceful fallback from metadata so user isn't blocked
      p = {
        id: userId,
        full_name: userMetadata?.full_name || 'Staff Member',
        email: userMetadata?.email || '',
        role: 'counsellor'
      }
    }

    setProfile(p)
    return p
  }, [])

  // Initialize session and subscribe to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)
          await loadProfile(initialSession.user.id, initialSession.user.user_metadata)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('[AuthContext] Auth initialization error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen to real-time auth changes across tabs and actions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return

        if (newSession?.user) {
          setSession(newSession)
          setUser(newSession.user)
          await loadProfile(newSession.user.id, newSession.user.user_metadata)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [loadProfile])

  // Sign in wrapper
  const signIn = useCallback(async (credentials) => {
    const result = await serviceSignIn(credentials)
    if (result.user) {
      setUser(result.user)
      setSession(result.session)
      if (result.profile) {
        setProfile(result.profile)
      } else {
        await loadProfile(result.user.id, result.user.user_metadata)
      }
    }
    return result
  }, [loadProfile])

  // Sign up wrapper
  const signUp = useCallback(async (payload) => {
    const result = await serviceSignUp(payload)
    if (result.user) {
      setUser(result.user)
      setSession(result.session)
      if (result.profile) {
        setProfile(result.profile)
      } else {
        await loadProfile(result.user.id, result.user.user_metadata)
      }
    }
    return result
  }, [loadProfile])

  // Sign out wrapper
  const signOut = useCallback(async () => {
    await serviceSignOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  // Explicit profile refresh function
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await loadProfile(user.id, user.user_metadata)
    }
    return null
  }, [user, loadProfile])

  const role = useMemo(() => {
    return profile?.role || 'counsellor'
  }, [profile])

  const value = useMemo(() => ({
    user,
    session,
    profile,
    role,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshProfile
  }), [user, session, profile, role, loading, signIn, signUp, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

