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

export function usePatientData(userId = '') {
  const [data, setData] = useState<PatientData>({
    symptoms: [],
    bmiRecords: [],
    latestVitals: null,
    vitalsHistory: [],
    loading: true,
  })

  const fetchAll = useCallback(async () => {
    // Don't fetch until we have a userId (auth may still be loading)
    if (!userId) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }
    setData(prev => ({ ...prev, loading: true }))
    try {
      const [symptoms, bmiRecords, latestVitals, vitalsHistory] = await Promise.all([
        getSymptomHistory(20, userId).catch(() => []),
        getBMIHistory(10, userId).catch(() => []),
        getLatestVitals(userId).catch(() => null),
        getVitalsHistory(20, userId).catch(() => []),
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
  }, [userId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    ...data,
    refresh: fetchAll,
    // Optimistic patch — instantly update latestVitals in local state
    // so the dashboard reflects new values before the DB round-trip completes.
    patchLatestVitals: (patch: Partial<HealthVitals>) =>
      setData(prev => ({
        ...prev,
        latestVitals: prev.latestVitals
          ? { ...prev.latestVitals, ...patch }
          : ({ ...patch } as HealthVitals),
      })),
  }
}
