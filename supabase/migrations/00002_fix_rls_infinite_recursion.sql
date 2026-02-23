-- ============================================
-- FIX: Infinite recursion in profiles RLS policy (42P17)
-- ============================================
-- "Doctors can view patient profiles" queried profiles from inside
-- a policy ON profiles → infinite loop on every profile fetch.
-- Doctor policies on symptom_logs/bmi_records also queried profiles,
-- which then triggered the same loop transitively.
--
-- Fix: SECURITY DEFINER function reads the current user's role
-- without triggering RLS, used in all doctor-access policies.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Fix profiles policy (was the direct recursive loop)
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR public.get_my_role() = 'doctor'
    );

-- Fix symptom_logs doctor policy (transitively caused recursion)
DROP POLICY IF EXISTS "Doctors can view patient symptoms" ON public.symptom_logs;
CREATE POLICY "Doctors can view patient symptoms" ON public.symptom_logs
    FOR SELECT USING (
        auth.uid() = patient_id OR public.get_my_role() = 'doctor'
    );

-- Fix bmi_records doctor policy (transitively caused recursion)
DROP POLICY IF EXISTS "Doctors can view patient BMI" ON public.bmi_records;
CREATE POLICY "Doctors can view patient BMI" ON public.bmi_records
    FOR SELECT USING (
        auth.uid() = patient_id OR public.get_my_role() = 'doctor'
    );
