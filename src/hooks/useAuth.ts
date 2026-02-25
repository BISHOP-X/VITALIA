// ============================================
// VITALIA - AUTHENTICATION HOOK
// ============================================
// Custom React hook for authentication state management
// Provides auth status, user info, and auth methods

import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { 
  supabase, 
  signIn, 
  signUp, 
  signOut, 
  resetPassword,
  getCurrentProfile,
  type SignUpData,
  type SignInData
} from '../lib/supabase'
import type { Profile } from '../lib/database.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isDemo: boolean
}

interface UseAuthReturn extends AuthState {
  signIn: (data: SignInData) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const LAST_KNOWN_NAME_KEY = 'vitalia_last_known_full_name_v1'

function persistLastKnownName(fullName: unknown) {
  if (typeof fullName !== 'string') return
  const trimmed = fullName.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(LAST_KNOWN_NAME_KEY, trimmed)
  } catch {
    // ignore
  }
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isDemo: false,
  })

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) return
    try {
      const profile = await getCurrentProfile(userId)
      setState(prev => ({ ...prev, profile }))

      if (profile?.full_name) {
        persistLastKnownName(profile.full_name)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [])

  // Initialize auth state — always uses real Supabase
  useEffect(() => {
    // Use getUser() instead of getSession() — avoids navigator.locks deadlock.
    // getUser() makes a direct API call with the stored JWT.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState(prev => ({
        ...prev,
        user: user ?? null,
        loading: false,
      }))

      if (user?.user_metadata?.full_name) {
        persistLastKnownName(user.user_metadata.full_name)
      }

      if (user) {
        fetchProfile(user.id)
      }
    }).catch(() => {
      setState(prev => ({ ...prev, loading: false }))
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }))

        if (session?.user?.user_metadata?.full_name) {
          persistLastKnownName(session.user.user_metadata.full_name)
        }

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user.id)
        }

        if (event === 'SIGNED_OUT') {
          setState(prev => ({
            ...prev,
            profile: null,
          }))
        }
      }
    )

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Sign in handler — always goes through Supabase
  const handleSignIn = async (data: SignInData) => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await signIn(data)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Sign up handler — always goes through Supabase
  const handleSignUp = async (data: SignUpData) => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await signUp(data)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Sign out handler — always clears real session
  const handleSignOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await signOut()
      setState(prev => ({
        ...prev,
        user: null,
        profile: null,
        session: null,
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Password reset handler
  const handleResetPassword = async (email: string) => {
    await resetPassword(email)
  }

  // Manual profile refresh
  const refreshProfile = async () => {
    if (state.user?.id) {
      await fetchProfile(state.user.id)
    }
  }

  return {
    ...state,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    refreshProfile,
  }
}

// ============================================
// ROLE-SPECIFIC HOOKS
// ============================================

/**
 * Hook that returns true if current user is a patient
 */
export function useIsPatient(): boolean {
  const { profile } = useAuth()
  return profile?.role === 'patient'
}

/**
 * Hook that returns true if current user is a doctor
 */
export function useIsDoctor(): boolean {
  const { profile } = useAuth()
  return profile?.role === 'doctor'
}
