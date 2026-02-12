-- ============================================
-- VITALIA HEALTH PLATFORM - DATABASE SCHEMA
-- ============================================
-- This migration creates the core tables for the health platform.
-- Designed for a demo/proof-of-concept with strategic real functionality.

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with app-specific data
-- This is REAL - stores actual registered users

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors can view patient profiles (for patient registry)
CREATE POLICY "Doctors can view patient profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'doctor'
        )
    );

-- ============================================
-- 2. SYMPTOM LOGS TABLE
-- ============================================
-- Stores patient-reported symptoms
-- This is REAL - patients can log actual symptoms

CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symptom_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    duration TEXT,
    body_location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- Patients can view their own symptoms
CREATE POLICY "Patients can view own symptoms" ON public.symptom_logs
    FOR SELECT USING (auth.uid() = patient_id);

-- Patients can insert their own symptoms
CREATE POLICY "Patients can insert own symptoms" ON public.symptom_logs
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Doctors can view all patient symptoms
CREATE POLICY "Doctors can view patient symptoms" ON public.symptom_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'doctor'
        )
    );

-- ============================================
-- 3. BMI RECORDS TABLE
-- ============================================
-- Stores BMI calculations for trend tracking
-- This is REAL - patients can save BMI records

CREATE TABLE IF NOT EXISTS public.bmi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    height_cm DECIMAL(5,2) NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    bmi_value DECIMAL(4,1) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('underweight', 'normal', 'overweight', 'obese')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bmi_records ENABLE ROW LEVEL SECURITY;

-- Patients can view their own BMI records
CREATE POLICY "Patients can view own BMI" ON public.bmi_records
    FOR SELECT USING (auth.uid() = patient_id);

-- Patients can insert their own BMI records
CREATE POLICY "Patients can insert own BMI" ON public.bmi_records
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Doctors can view patient BMI records
CREATE POLICY "Doctors can view patient BMI" ON public.bmi_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'doctor'
        )
    );

-- ============================================
-- 4. CONSULTATIONS TABLE (For AI Features)
-- ============================================
-- Stores doctor consultations with AI-generated content
-- Used for the Smart Rundown and Clinical Notes features

CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_notes TEXT, -- Raw unstructured notes
    ai_summary JSONB, -- AI-extracted structured data
    ai_risk_score TEXT CHECK (ai_risk_score IN ('low', 'medium', 'high')),
    ai_risk_explanation TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Doctors can manage consultations they created
CREATE POLICY "Doctors can manage own consultations" ON public.consultations
    FOR ALL USING (auth.uid() = doctor_id);

-- Patients can view their own consultations
CREATE POLICY "Patients can view own consultations" ON public.consultations
    FOR SELECT USING (auth.uid() = patient_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, age, gender)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        (NEW.raw_user_meta_data->>'age')::INTEGER,
        NEW.raw_user_meta_data->>'gender'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_patient ON public.symptom_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_created ON public.symptom_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bmi_records_patient ON public.bmi_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id);
