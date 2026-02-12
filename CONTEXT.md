
# Project Context: AI-Integrated Digital Health System (MVP)

**Role:** You are the Lead Full-Stack Engineer. I have generated the Frontend UI (React + Tailwind). Your task is to wire up the **Backend Logic** (Supabase) and **AI Integrations** (Groq API) to make this system functional.

## 1. Project Overview

We are building a **High-Fidelity Proof of Concept** for a Final Year Project. The system is a dual-interface Digital Health Record platform that uses Artificial Intelligence to transition healthcare from "passive record keeping" to "active clinical partnership."

**Key Philosophy:** "Show, Don't Tell." The system relies on visual cues (badges, notifications) and instant AI automation (auto-filling notes) rather than complex manual forms.

## 2. Technical Stack (Strict Constraints)

* **Frontend:** React (Vite), Tailwind CSS, Lucide React (Icons).
* **Backend / Database:** **Supabase** (PostgreSQL, Auth, Row Level Security).
* **AI Intelligence:** Direct calls to Groq API (`llama-3.3-70b-versatile`) via Supabase Edge Functions — free, fast inference.
* **Hosting:** Vercel (Frontend).
* **NO:** Python backend, Docker, or custom ML model training.

## 3. Core Users & Workflows

The app has two distinct user roles. You must implement logic for both.

### **A. Patient Portal (Mobile-First)**

* **Goal:** Self-reporting and health tracking.
* **Key Features:**
1. **Auth:** Simple Email/Password login.
2. **Dashboard:** View "Current Health Status" (Visual Card).
3. **Action:** "Log Symptom" form (Updates the database).
4. **View:** See past medical history and upcoming appointments.



### **B. Doctor Dashboard (Desktop-First)**

* **Goal:** AI-assisted clinical review and documentation.
* **Key Features:**
1. **Patient Registry:** View list of patients with "Risk Badges" (High/Med/Low).
2. **Smart Profile:** When viewing a patient, the system fetches their self-reported symptoms and history.
3. **AI Feature 1: The "Smart Rundown":** An AI summary of the patient's history + new complaints.
4. **AI Feature 2: Smart Clinical Note:** Doctor types unstructured text  Button click  AI extracts `Symptoms`, `Diagnosis`, `Prescriptions` as JSON.
5. **AI Feature 3: Prescriptive Analysis:** System analyzes vitals  Button click  AI returns a Risk Score & Treatment Recommendation.



## 4. Required Database Schema (Supabase)

Please generate the SQL and Typescript interfaces for the following structure:

1. **`profiles`**: Links to `auth.users`. Stores `role` ('doctor' | 'patient'), `full_name`, `age`, `gender`, `avatar_url`.
2. **`medical_records`**: Stores historical data (Allergies, Past Surgeries, Chronic Conditions). Linked to `patient_id`.
3. **`consultations`**: Stores the actual visits.
* `id`, `patient_id`, `doctor_id`, `created_at`.
* `doctor_notes` (Text - the unstructured note).
* `ai_summary` (JSON - the structured extraction).
* `risk_score` (Text/Enum - 'High', 'Medium', 'Low').


4. **`vitals`**: Linked to `patient_id`. Stores `heart_rate`, `blood_pressure`, `temp`, `date`.

## 5. AI Implementation Logic

I need you to write the functions (Edge Functions or Service Services) to handle these specific prompts:

* **Function: `generateSmartRundown**`
* **Input:** Patient's last 3 medical records + Current Vitals.
* **Prompt:** "Summarize this patient's history and current status into a 3-bullet point briefing for a doctor."


* **Function: `extractClinicalData**`
* **Input:** Unstructured text string (e.g., "Pt complains of severe migraine...").
* **Prompt:** "Extract the following keys as JSON: { symptoms: [], diagnosis: '', treatment_plan: [] }."


* **Function: `analyzeRisk**`
* **Input:** Age, Heart Rate, BP, Oxygen Level.
* **Prompt:** "Analyze these vitals. Return a risk level (Low/Medium/High) and a one-sentence explanation."



## 6. Stakeholder Feature Updates (New Requirements)

After initial development, stakeholders requested 4 additional features to enhance user experience and clinical value:

### **Update 1: AI Health Advisor (Patient Portal)**
* **Purpose:** Empower patients with AI-powered health insights based on their logged symptoms and vitals.
* **Location:** Patient Dashboard - 5th ActionCard with Sparkles icon, purple gradient.
* **Workflow:**
  1. Patient clicks "AI Health Advisor" card
  2. Modal Phase 1: Introduction screen with benefits + medical disclaimer
  3. Modal Phase 2: 3-second loading animation with progress steps
  4. Modal Phase 3: AI analysis results showing:
     - Urgency level (Low/Moderate/High) with color-coded banner
     - Possible conditions with confidence percentages
     - Personalized recommendations (lifestyle, monitoring, actions)
     - When to consult a doctor guidance
  5. Actions: "Re-analyze" or "Book Appointment"
* **AI Logic:** Analyze patient's recent symptoms, vitals, medical history → Generate health assessment with disclaimers.

### **Update 2: Forgot Password Feature**
* **Purpose:** Allow users to reset their password via email link.
* **Location:** AuthModal signin mode - add "Forgot Password?" link below password input.
* **Workflow:**
  1. User clicks "Forgot Password?" link
  2. Modal switches to forgotPassword mode
  3. User enters email address
  4. System sends password reset link
  5. Success state shows confirmation message
* **UI States:** Initial form → Loading → Success confirmation with "Back to Sign In" button.

### **Update 3: Doctor-Patient Chat System**
* **Purpose:** Enable real-time communication between doctors and patients for quick consultations and follow-ups.
* **Patient Interface:**
  - Floating chat button (bottom-right, MessageCircle icon, teal gradient)
  - Slide-up chat panel (mobile) or right sidebar (desktop)
  - Message bubbles (sent/received), typing indicator, online status
* **Doctor Interface:**
  - MessageCircle icon in header with unread badge
  - Two-panel chat sidebar: Conversation list (left) + Active chat (right)
  - Patient selection, message history, real-time updates
* **Features:** Online/offline status, unread counts, typing indicators, message timestamps.

### **Update 4: BMI Calculator & Tracker**
* **Purpose:** Help patients and doctors monitor body mass index trends over time.
* **Patient Integration:** Add as 4th stat in quickStats grid (alongside HR, BP, Sleep) OR as 6th ActionCard.
* **Calculator Modal:**
  - Input: Height (cm/inches toggle) + Weight (kg/lbs toggle)
  - Output: BMI number, color-coded category (Underweight/Normal/Overweight/Obese)
  - Visual gauge showing BMI position on spectrum
  - Historical trend chart (if previous records exist)
* **Doctor View:** BMI displayed in patient vitals section with trend indicator (up/down arrow).
* **Database:** Store BMI records with timestamp for trend analysis.

## 7. Immediate Next Steps

1. Analyze the provided UI code components.
2. Write the Supabase SQL setup script (Tables + RLS Policies + New tables for chat/BMI).
3. Create the `useAuth` hook and Supabase client configuration.
4. Wire up the **Doctor Dashboard** to fetch real patients from Supabase.
5. Implement the **"Auto-Extract"** button logic using a mock AI call (or real API if key provided).
6. Implement the 4 stakeholder feature updates one by one (AI Advisor, Forgot Password, Chat System, BMI Tracker).