# SPEC: Remove Pre-Populated Data & Wire Real User Input

## Goal
Every screen starts **empty** for new users. Users can **add, fill, and save** their own data. Features that depend on data from other components show helpful "empty system" messages with calls-to-action. Existing accounts retain any data they've already saved.

---

## Guiding Principles

1. **EDIT, never rewrite** — all changes are surgical `replace_string_in_file` edits
2. **Empty by default** — no hardcoded fake data anywhere
3. **Smart empty states** — when a feature needs data from another feature, tell the user *what* to do ("Log symptoms first", "Record your vitals")
4. **Preserve working features** — BMI calculator, Symptom logger, AI Advisor, Chat UI shell, Settings/Logout all work today. Don't break them.
5. **Mobile-first** — all new UI must be responsive (existing patterns: `text-xs sm:text-sm`, `p-3 sm:p-4`, etc.)

---

## Infrastructure Already Built (DO NOT REBUILD)

| Asset | Status |
|-------|--------|
| `health_vitals` table in Supabase | ✅ Live (migration applied) |
| `database.types.ts` — HealthVitals types | ✅ Done |
| `supabase.ts` — `saveVitals()`, `getLatestVitals()`, `getVitalsHistory()` | ✅ Done |
| `supabase.ts` — `getAllPatientProfiles()`, `getPatientSymptoms/BMI/Vitals()` | ✅ Done |
| `usePatientData.ts` hook — fetches symptoms, bmiRecords, latestVitals, vitalsHistory | ✅ Done |

---

## PATIENT DASHBOARD — Incremental Edit Plan

### Edit 1: Add imports + usePatientData hook call
**File:** `PatientDashboard.tsx` (top of file)
- Add import for `usePatientData` hook
- Add import for `saveVitals` from supabase
- Add import for `Plus` icon from lucide-react (for "Add" buttons)
- Call `usePatientData()` inside the component, destructure `{ symptoms, bmiRecords, latestVitals, vitalsHistory, loading, refresh }`

### Edit 2: Remove hardcoded `quickStats` array (lines ~48-53)
**What:** Delete the `const quickStats = [...]` top-level constant entirely.
**Why:** Will be replaced by dynamic data derived from `latestVitals` inside the component.

### Edit 3: Add dynamic quickStats derivation inside component
**Where:** Inside `PatientDashboard()` function body, after the `usePatientData()` call.
**What:** Create a derived `quickStats` array:
```ts
const quickStats = [
  { 
    label: "Heart Rate", 
    value: latestVitals?.heart_rate?.toString() ?? "--", 
    unit: latestVitals?.heart_rate ? "bpm" : "", 
    trend: "normal" as const 
  },
  { 
    label: "Blood Pressure", 
    value: latestVitals?.systolic_bp && latestVitals?.diastolic_bp 
      ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` 
      : "--", 
    unit: latestVitals?.systolic_bp ? "mmHg" : "", 
    trend: "normal" as const 
  },
  { 
    label: "Sleep", 
    value: latestVitals?.sleep_hours?.toString() ?? "--", 
    unit: latestVitals?.sleep_hours ? "hrs" : "", 
    trend: "good" as const 
  },
  { 
    label: "BMI", 
    value: bmiRecords.length > 0 ? bmiRecords[0].bmi_value.toFixed(1) : "--", 
    unit: bmiRecords.length > 0 
      ? bmiRecords[0].category.charAt(0).toUpperCase() + bmiRecords[0].category.slice(1) 
      : "", 
    trend: "good" as const, 
    clickable: true 
  },
];
```
**Empty state:** Cards show "--" with no unit when no data exists.

### Edit 4: Add "Record Vitals" button next to Quick Stats heading
**Where:** Above the Quick Stats grid.
**What:** Add a small "+" button or "Record Vitals" link that opens a new vitals modal.
**Depends on:** Edit 9 (vitals modal state + handler).

### Edit 5: Replace hardcoded `bmiHistory` with real data (lines ~113-120)
**What:** Change `const [bmiHistory] = useState([...6 fake entries...])` to derive from `bmiRecords`:
```ts
const bmiHistory = bmiRecords.map(r => ({
  date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  bmi: r.bmi_value
}));
```
**Empty state:** The BMI trend chart section already has a `{bmiHistory.length > 0 && ...}` guard, so it hides naturally when empty.

### Edit 6: Replace hardcoded `chatMessages` with empty array (lines ~124-148)
**What:** Change `const [chatMessages, setChatMessages] = useState([...4 fake messages...])` to:
```ts
const [chatMessages, setChatMessages] = useState<{id: number; sender: "doctor" | "patient"; content: string; timestamp: string; read: boolean}[]>([]);
```
**Empty state:** ChatPanel component already handles empty messages array. If not, we add a small empty state.

### Edit 7: Replace hardcoded HealthRing `progress={87}` with dynamic value
**Where:** Line ~461: `<HealthRing progress={87} status="low" size={undefined} />`
**What:** Derive a health completeness score from available data:
```ts
// Calculate health score based on data completeness (0-100)
const dataPoints = [
  latestVitals?.heart_rate ? 1 : 0,
  latestVitals?.systolic_bp ? 1 : 0,
  latestVitals?.sleep_hours ? 1 : 0,
  bmiRecords.length > 0 ? 1 : 0,
  symptoms.length > 0 ? 1 : 0,
].reduce((a, b) => a + b, 0);
const healthScore = dataPoints === 0 ? 0 : Math.round((dataPoints / 5) * 100);
const healthStatus: "low" | "medium" | "high" = healthScore >= 60 ? "low" : healthScore >= 30 ? "medium" : "high";
```
Replace `progress={87}` with `progress={healthScore}` and `status="low"` with `status={healthStatus}`.
Also update the subtitle text:
- If `healthScore === 0`: "Start by recording your vitals and symptoms"
- If `healthScore < 60`: "Keep adding health data to improve your score"
- Else: "You're doing great! Keep it up."

### Edit 8: Replace hardcoded "Upcoming Visit" with empty state (lines ~558-576)
**What:** Replace the hardcoded "Annual Check-up / Dr. Martinez / Jan 28, 2026" with an empty state:
```tsx
<p className="text-sm font-medium text-foreground truncate">No upcoming visits</p>
<p className="text-xs text-muted-foreground truncate">Tap "Book Visit" to schedule one</p>
```

### Edit 9: Add "Record Vitals" modal state + handler + modal UI
**Where:**
- State declarations section (near other `useState` calls): add `isVitalsModalOpen` state
- Handler section: add `handleSaveVitals` function
- Modal section (after other GlassModal blocks): add the vitals form modal
**What:** A modal with fields for Heart Rate, Blood Pressure (systolic/diastolic), Sleep Hours, O2 Sat, Temperature, Notes. Saves via `saveVitals()` then calls `refresh()`.

### Edit 10: Replace hardcoded Medical History modal content (lines ~960-972)
**What:** Replace the 3 fake records with real `symptoms` data. If empty, show "No records yet — log your symptoms to build your history."
```tsx
{symptoms.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-muted-foreground text-sm">No medical history yet</p>
    <p className="text-xs text-muted-foreground mt-1">Log your symptoms to start building your health history</p>
    <button onClick={() => { setIsHistoryModalOpen(false); setIsSymptomModalOpen(true); }} className="btn-primary mt-4 text-sm">
      Log Symptoms
    </button>
  </div>
) : (
  symptoms.map((record, i) => (
    <div key={record.id} className="p-4 rounded-xl bg-secondary/50 border border-white/10">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-foreground">{record.symptom_type}</p>
          <p className="text-sm text-muted-foreground">Severity: {record.severity}</p>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(record.created_at).toLocaleDateString()}</span>
      </div>
      {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
    </div>
  ))
)}
```

### Edit 11: Replace hardcoded Medication Reminders with empty state + localStorage (lines ~1020-1024)
**What:** Replace the 3 fake meds with localStorage-backed reminders or empty state.
For MVP simplicity: show empty state with "Add Reminder" button that uses a simple prompt or inline form. Save to localStorage key `vitalia_med_reminders`.

### Edit 12: Replace hardcoded Activity Tracking with empty state (lines ~1108-1150)
**What:** Replace fake steps/sleep/bpm and fake activities with:
- If vitals exist: show latest real vitals summary
- If no data: "No activity recorded yet — record your vitals to see a summary here"
Also add a button: "Record Vitals" that opens the vitals modal.

### Edit 13: Replace hardcoded Notifications with empty state (lines ~1160-1175)
**What:** Replace 3 fake notifications with:
```tsx
<div className="text-center py-8">
  <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
  <p className="text-sm text-muted-foreground">No notifications yet</p>
  <p className="text-xs text-muted-foreground mt-1">You'll see updates here as you use the app</p>
</div>
```

### Edit 14: Remove fake doctor auto-reply from chat (lines ~397-412)
**What:** Remove the `setTimeout` block that auto-generates a fake doctor reply when patient sends a message. Keep the message-sending logic but remove the simulated doctor response.

### Edit 15: Wire `refresh()` after symptom logging and BMI saving
**Where:** `handleLogSymptom` and `saveBMIRecord` functions.
**What:** After successful save, call `refresh()` so dashboard data updates without page reload.

---

## DOCTOR DASHBOARD — Incremental Edit Plan

### Edit D1: Replace hardcoded `patients` array with real Supabase data
**What:** Remove the entire `const patients: EnrichedPatient[]` array (lines 76-226). Replace with:
- Import `usePatientData` for doctor-side or create `useDoctorData` hook  
- Actually: use `getAllPatientProfiles()` + related queries
- Since the doctor dashboard shows patient cards, we need a lighter approach: fetch real profile rows and adapt the UI

For MVP: Create a `useDoctorPatients` hook that calls `getAllPatientProfiles()` on mount. The patient detail view will show what data is actually available (symptoms, BMI, vitals from Supabase) rather than fake enriched data.

### Edit D2: Replace hardcoded dashboard stats with real counts
**What:** Replace `"248"`, `"12"`, `"5"`, `"2"` with actual counts from the fetched patients array (`.length`), and show 0 for the others.

### Edit D3: Replace hardcoded conversations with empty state  
**What:** Remove the mock conversations array and chat messages. Show "No conversations yet" in the chat sidebar.

### Edit D4: Remove fake patient auto-reply (lines ~331-347)
**What:** Remove the `setTimeout` that simulates a patient response.

### Edit D5: Replace hardcoded notifications with empty state
**What:** Same pattern as patient side — "No notifications yet."

### Edit D6: Handle empty patient detail view gracefully
**What:** When a doctor clicks a patient who has no symptoms/vitals/BMI, show appropriate empty states in each section instead of crashing on undefined data.

---

## CROSS-CUTTING: Empty State Messaging Strategy

| Feature | Depends On | Empty Message | CTA |
|---------|-----------|---------------|-----|
| Quick Stats | health_vitals | "--" values | "Record Vitals" button |
| Health Ring | any data | 0% ring | "Start by recording your vitals" |
| BMI Trend | bmi_records | Chart hidden | Use BMI Calculator |
| Medical History | symptom_logs | "No records yet" | "Log Symptoms" button |
| Activity | health_vitals | "No activity recorded" | "Record Vitals" button |
| Reminders | localStorage | "No reminders set" | "Add Reminder" button |
| Notifications | (system) | "No notifications" | — |
| Chat | (realtime - not built) | Empty chat | Can still send messages |
| Upcoming Visit | (not wired) | "No upcoming visits" | "Book Visit" button |
| Doctor: Patient Registry | profiles table | "No patients yet" | — |
| Doctor: Stats | profiles count | All zeros | — |
| Doctor: Chat | (not wired) | "No conversations" | — |
| Doctor: Patient Detail | symptoms/vitals/bmi | Section-level empty states | — |

---

## Execution Order (Incremental, Edit-by-Edit)

```
BATCH 1 — Patient Dashboard Core (Edits 1-3, 5-6)
  Import hook + derive quickStats + real bmiHistory + empty chat

BATCH 2 — Patient Dashboard UI (Edits 7-8, 13-14)
  Dynamic health ring + empty upcoming visit + empty notifications + remove auto-reply

BATCH 3 — Patient Dashboard Modals (Edits 9-12, 15)
  Vitals modal + real medical history + empty reminders + empty activity + refresh wiring

BATCH 4 — Quick Stats "Record Vitals" button (Edit 4)
  Add the CTA that opens vitals modal

BATCH 5 — Doctor Dashboard (Edits D1-D6)
  Real patients + real stats + empty states

BATCH 6 — Build + Verify + Commit
  npm run build → get_errors → fix → commit → push
```

---

## Files Modified

| File | Type of Change |
|------|---------------|
| `src/pages/PatientDashboard.tsx` | ~15 targeted edits (no rewrite) |
| `src/pages/DoctorDashboard.tsx` | ~6 targeted edits (no rewrite) |
| Possibly: `src/hooks/useDoctorPatients.ts` | NEW file (small hook) |

---

## What We Are NOT Changing

- Landing page — already good
- AuthModal — already wired to real Supabase
- AIWorkspace component — works with whatever patient data is passed
- HealthRing component — just receives props
- ChatButton / ChatPanel components — shell works, no real-time backend
- Settings modal UI — static, works as-is
- Symptom Logger form — already saves to Supabase
- BMI Calculator form — already saves to Supabase
- AI Health Advisor — mock analysis is acceptable (feature demo)
