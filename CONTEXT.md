
# Project Context: AI-Integrated Digital Health System

**Status:** All 7 phases complete. Frontend 37/37 features, backend fully wired, build clean.

## 1. Project Overview

**Vitalia** is a **High-Fidelity Proof of Concept** for a Final Year Project. A dual-interface Digital Health Record platform that uses AI to transition healthcare from "passive record keeping" to "active clinical partnership."

**Architecture:** "Strategic Minimal Backend" — the frontend is complete with rich pre-populated data for demo polish. The backend adds real technical depth underneath (auth, DB writes, 1 live AI feature) while keeping mock data for maximum demo impact.

## 2. Technical Stack

* **Frontend:** React 18 (Vite), TypeScript, Tailwind CSS, Radix UI/shadcn-ui, Framer Motion, Recharts
* **Backend / Database:** Supabase (PostgreSQL, Auth, Row Level Security, Edge Functions)
* **AI Intelligence:** Groq API (`llama-3.3-70b-versatile`) via Supabase Edge Functions — free, fast inference
* **Hosting:** Vercel (Frontend)

## 3. Database Schema (Live on Supabase)

4 tables with RLS, auto-profile trigger, update timestamps, 7 indexes:

1. **`profiles`** — Links to `auth.users`. Stores `role` ('patient'|'doctor'), `full_name`, `age`, `gender`, `avatar_url`
2. **`symptom_logs`** — Patient symptom entries with `symptom_type`, `severity` (mild/moderate/severe), `duration`, `body_location`, `notes`
3. **`bmi_records`** — BMI tracking with `height_cm`, `weight_kg`, `bmi_value`, `category` (underweight/normal/overweight/obese)
4. **`consultations`** — Doctor-patient visits with `doctor_notes`, `ai_summary` (JSONB), `ai_risk_score`, `status`

12 RLS policies ensure patients see only their own data, doctors can view patient data.

## 4. What's Real vs Mock

### Real (Cloud Services)
- ✅ **Authentication** — Supabase Auth (sign up, sign in, password reset)
- ✅ **Symptom Logging** — Writes to `symptom_logs` table with severity mapping
- ✅ **BMI Saving** — Writes to `bmi_records` with imperial/metric unit conversion
- ✅ **AI Smart Rundown** — Live Edge Function calling Groq for 3-bullet patient summaries
- ✅ **Auto Profile Creation** — Trigger creates profile row on user signup

### Mock (Demo Data)
- Patient registry, vitals, medical records, chat history, appointments
- AI Clinical Notes Extraction, AI Risk Analysis (mock responses in UI)
- AI Health Advisor (patient-facing, pre-written analysis)

### Graceful Degradation
Every real feature falls back to demo mode if Supabase is unavailable. The app never breaks.

## 5. AI Edge Functions (Groq)

Three Edge Functions written, one deployed:

- **`smart-rundown`** (DEPLOYED) — 3-bullet patient summary. Falls back to demo response if no GROQ_API_KEY.
- **`extract-clinical-data`** (written, not deployed) — Extracts symptoms/diagnosis/treatment from unstructured notes
- **`analyze-risk`** (written, not deployed) — Risk scoring from vitals

## 6. Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client + all auth/DB helper functions + demo mode check |
| `src/components/AuthModal.tsx` | Login/signup/forgot password — wired to real Supabase |
| `src/pages/PatientDashboard.tsx` | Patient portal — symptom logging + BMI saving wired |
| `src/components/AIWorkspace.tsx` | Doctor AI tools — Smart Rundown calls real Edge Function |
| `src/hooks/useAuth.ts` | Auth state management hook with demo fallback |
| `supabase/migrations/00001_initial_schema.sql` | Complete database schema |

## 7. Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Edge Function secret (set in Supabase dashboard): `GROQ_API_KEY`