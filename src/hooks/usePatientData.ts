// ============================================
// VITALIA — Patient Data Hook
// ============================================
// Fetches real patient data from Supabase on mount.
// Returns loading/empty states so the dashboard can show
// appropriate UI for each section.

import { useState, useEffect, useCallback } from 'react'
import {
  getSymptomHistory,
  getBMIHistory,
  getLatestVitals,
  getVitalsHistory,
} from '@/lib/supabase'
import type { SymptomLog, BMIRecord, HealthVitals } from '@/lib/database.types'

interface PatientData {
  symptoms: SymptomLog[]
  bmiRecords: BMIRecord[]
  latestVitals: HealthVitals | null
  vitalsHistory: HealthVitals[]
  loading: boolean
}

export function usePatientData() {
  const [data, setData] = useState<PatientData>({
    symptoms: [],
    bmiRecords: [],
    latestVitals: null,
    vitalsHistory: [],
    loading: true,
  })

  const fetchAll = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }))
    try {
      const [symptoms, bmiRecords, latestVitals, vitalsHistory] = await Promise.all([
        getSymptomHistory(20).catch(() => []),
        getBMIHistory(10).catch(() => []),
        getLatestVitals().catch(() => null),
        getVitalsHistory(20).catch(() => []),
      ])

      setData({
        symptoms: symptoms ?? [],
        bmiRecords: bmiRecords ?? [],
        latestVitals: latestVitals ?? null,
        vitalsHistory: vitalsHistory ?? [],
        loading: false,
      })
    } catch {
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { ...data, refresh: fetchAll }
}
