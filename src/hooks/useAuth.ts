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
  isDemoMode,
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

// Demo user for when Supabase is not configured
const DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  role: 'patient',
  full_name: 'Sarah Johnson',
  age: 32,
  gender: 'female',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isDemo: isDemoMode(),
  })

  // Fetch user profile from database
  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getCurrentProfile()
      setState(prev => ({ ...prev, profile }))
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    // If in demo mode, set demo state immediately
    if (isDemoMode()) {
      setState({
        user: null,
        profile: DEMO_PROFILE,
        session: null,
        loading: false,
        isDemo: true,
      })
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }))
      
      if (session?.user) {
        fetchProfile()
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }))

        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile()
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

  // Sign in handler
  const handleSignIn = async (data: SignInData) => {
    if (state.isDemo) {
      // Demo mode - just simulate success
      console.log('Demo mode: Simulating sign in')
      return
    }
    
    setState(prev => ({ ...prev, loading: true }))
    try {
      await signIn(data)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Sign up handler
  const handleSignUp = async (data: SignUpData) => {
    if (state.isDemo) {
      // Demo mode - just simulate success
      console.log('Demo mode: Simulating sign up')
      return
    }

    setState(prev => ({ ...prev, loading: true }))
    try {
      await signUp(data)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Sign out handler
  const handleSignOut = async () => {
    if (state.isDemo) {
      console.log('Demo mode: Simulating sign out')
      return
    }

    setState(prev => ({ ...prev, loading: true }))
    try {
      await signOut()
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Password reset handler
  const handleResetPassword = async (email: string) => {
    if (state.isDemo) {
      console.log('Demo mode: Simulating password reset')
      return
    }

    await resetPassword(email)
  }

  // Manual profile refresh
  const refreshProfile = async () => {
    if (state.isDemo) return
    await fetchProfile()
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
