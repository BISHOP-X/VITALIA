// ============================================
// VITALIA - SUPABASE CLIENT CONFIGURATION
// ============================================
// This file sets up the Supabase client for authentication
// and database operations throughout the application.

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Environment variables for Supabase connection
// These will be set in .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Supabase credentials not configured. Running in demo mode.\n' +
    'To enable real backend features, create a .env.local file with:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key'
  )
}

// Create the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      // Persist session in localStorage
      persistSession: true,
      // Auto refresh token before expiry
      autoRefreshToken: true,
      // Detect session from URL (for OAuth/magic links)
      detectSessionInUrl: true,
    },
  }
)

// ============================================
// AUTHENTICATION HELPERS
// ============================================

export interface SignUpData {
  email: string
  password: string
  fullName: string
  role: 'patient' | 'doctor'
  age?: number
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Sign up a new user with profile data
 */
export async function signUp({ email, password, fullName, role, age, gender }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        age,
        gender,
      },
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  // Best-effort local sign-out — clear session tokens without waiting on the
  // network. Never throws so callers can always redirect after calling this.
  try {
    await supabase.auth.signOut()
  } catch {
    // ignore — we'll still do the page redirect
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) throw error
  return data
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Get current user profile from profiles table
 */
export async function getCurrentProfile() {
  const session = await getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error) {
    const message = (error as any)?.message as string | undefined
    const code = (error as any)?.code as string | undefined

    // PostgREST uses PGRST116 for "JSON object requested, multiple (or no) rows returned".
    // In that case, treat it as "no profile yet" and let the app fall back to auth metadata.
    if (code === 'PGRST116' || message?.includes('multiple (or no) rows returned')) {
      return null
    }

    throw error
  }
  return data
}

// ============================================
// DATABASE OPERATION HELPERS
// ============================================

/**
 * Log a new symptom for the current patient
 */
export async function logSymptom(symptomData: {
  symptom_type: string
  severity: 'mild' | 'moderate' | 'severe'
  duration?: string
  body_location?: string
  notes?: string
}) {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('symptom_logs')
    .insert({
      patient_id: session.user.id,
      ...symptomData,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Save a BMI record for the current patient
 */
export async function saveBMIRecord(bmiData: {
  height_cm: number
  weight_kg: number
  bmi_value: number
  category: 'underweight' | 'normal' | 'overweight' | 'obese'
}) {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bmi_records')
    .insert({
      patient_id: session.user.id,
      ...bmiData,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get patient's symptom history
 */
export async function getSymptomHistory(limit = 10) {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('patient_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get patient's BMI history
 */
export async function getBMIHistory(limit = 10) {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bmi_records')
    .select('*')
    .eq('patient_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ============================================
// HEALTH VITALS HELPERS
// ============================================

/**
 * Save a vitals reading for the current patient
 */
export async function saveVitals(vitalsData: {
  heart_rate?: number | null
  systolic_bp?: number | null
  diastolic_bp?: number | null
  sleep_hours?: number | null
  oxygen_saturation?: number | null
  temperature?: number | null
  notes?: string | null
}) {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('health_vitals')
    .insert({
      patient_id: session.user.id,
      ...vitalsData,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get the patient's most recent vitals reading
 */
export async function getLatestVitals() {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('health_vitals')
    .select('*')
    .eq('patient_id', session.user.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Get patient's vitals history
 */
export async function getVitalsHistory(limit = 20) {
  const session = await getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('health_vitals')
    .select('*')
    .eq('patient_id', session.user.id)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ============================================
// DOCTOR HELPERS
// ============================================

/**
 * Get all patient profiles (doctor only — RLS enforced)
 */
export async function getAllPatientProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'patient')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Get symptom logs for a specific patient (doctor access via RLS)
 */
export async function getPatientSymptoms(patientId: string, limit = 20) {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Get BMI records for a specific patient (doctor access via RLS)
 */
export async function getPatientBMI(patientId: string, limit = 10) {
  const { data, error } = await supabase
    .from('bmi_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Get vitals for a specific patient (doctor access via RLS)
 */
export async function getPatientVitals(patientId: string) {
  const { data, error } = await supabase
    .from('health_vitals')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// ============================================
// DEMO MODE CHECK
// ============================================

/**
 * Check if running in demo mode (no Supabase configured)
 */
export function isDemoMode(): boolean {
  return !supabaseUrl || !supabaseKey || 
         supabaseUrl === 'https://placeholder.supabase.co'
}
