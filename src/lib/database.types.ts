// ============================================
// VITALIA - SUPABASE DATABASE TYPES
// ============================================
// TypeScript interfaces matching the database schema
// Auto-generated types for type-safe database operations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'patient' | 'doctor'
          full_name: string
          age: number | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'patient' | 'doctor'
          full_name: string
          age?: number | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'patient' | 'doctor'
          full_name?: string
          age?: number | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      symptom_logs: {
        Row: {
          id: string
          patient_id: string
          symptom_type: string
          severity: 'mild' | 'moderate' | 'severe'
          duration: string | null
          body_location: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          symptom_type: string
          severity: 'mild' | 'moderate' | 'severe'
          duration?: string | null
          body_location?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          symptom_type?: string
          severity?: 'mild' | 'moderate' | 'severe'
          duration?: string | null
          body_location?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      bmi_records: {
        Row: {
          id: string
          patient_id: string
          height_cm: number
          weight_kg: number
          bmi_value: number
          category: 'underweight' | 'normal' | 'overweight' | 'obese'
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          height_cm: number
          weight_kg: number
          bmi_value: number
          category: 'underweight' | 'normal' | 'overweight' | 'obese'
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          height_cm?: number
          weight_kg?: number
          bmi_value?: number
          category?: 'underweight' | 'normal' | 'overweight' | 'obese'
          created_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          doctor_notes: string | null
          ai_summary: Json | null
          ai_risk_score: 'low' | 'medium' | 'high' | null
          ai_risk_explanation: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          doctor_notes?: string | null
          ai_summary?: Json | null
          ai_risk_score?: 'low' | 'medium' | 'high' | null
          ai_risk_explanation?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          doctor_notes?: string | null
          ai_summary?: Json | null
          ai_risk_score?: 'low' | 'medium' | 'high' | null
          ai_risk_explanation?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================
// CONVENIENCE TYPE EXPORTS
// ============================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type SymptomLog = Database['public']['Tables']['symptom_logs']['Row']
export type SymptomLogInsert = Database['public']['Tables']['symptom_logs']['Insert']

export type BMIRecord = Database['public']['Tables']['bmi_records']['Row']
export type BMIRecordInsert = Database['public']['Tables']['bmi_records']['Insert']

export type Consultation = Database['public']['Tables']['consultations']['Row']
export type ConsultationInsert = Database['public']['Tables']['consultations']['Insert']
export type ConsultationUpdate = Database['public']['Tables']['consultations']['Update']

// ============================================
// AI RESPONSE TYPES
// ============================================

export interface AISmartRundown {
  success: boolean
  source: 'ai' | 'demo'
  rundown: string[]
}

export interface AIClinicalExtraction {
  success: boolean
  source: 'ai' | 'demo'
  extraction: {
    symptoms: string[]
    diagnosis: string
    treatment_plan: string[]
    follow_up: string
  }
}

export interface AIRiskAnalysis {
  success: boolean
  source: 'ai' | 'demo'
  risk: {
    level: 'low' | 'medium' | 'high'
    score: number
    explanation: string
    recommendations: string[]
  }
}
