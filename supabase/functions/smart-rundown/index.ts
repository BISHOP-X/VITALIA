import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PatientData {
  name: string
  age: number
  recentSymptoms: string[]
  vitals: {
    heartRate: number
    bloodPressure: string
    temperature: number
    oxygenLevel: number
  }
  medicalHistory: string[]
  currentMedications: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { patientData } = await req.json() as { patientData: PatientData }

    const groqKey = Deno.env.get('GROQ_API_KEY')

    if (!groqKey) {
      return new Response(
        JSON.stringify({
          success: true,
          source: 'demo',
          rundown: [
            `Patient ${patientData.name} is a ${patientData.age}-year-old with ${patientData.recentSymptoms.length > 0 ? patientData.recentSymptoms.join(', ') : 'no recently reported symptoms'}.`,
            `Current vitals show HR ${patientData.vitals.heartRate} bpm, BP ${patientData.vitals.bloodPressure}, which are within ${patientData.vitals.heartRate > 100 ? 'elevated' : 'normal'} ranges.`,
            `Recommend reviewing ${patientData.currentMedications.length > 0 ? 'current medication regimen' : 'preventive care options'} and scheduling follow-up as needed.`
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `You are a medical AI assistant helping doctors quickly understand a patient's status.

Patient Information:
- Name: ${patientData.name}
- Age: ${patientData.age}
- Recent Symptoms: ${patientData.recentSymptoms.join(', ') || 'None reported'}
- Current Vitals: HR ${patientData.vitals.heartRate} bpm, BP ${patientData.vitals.bloodPressure}, Temp ${patientData.vitals.temperature}°F, O2 ${patientData.vitals.oxygenLevel}%
- Medical History: ${patientData.medicalHistory.join(', ') || 'None recorded'}
- Current Medications: ${patientData.currentMedications.join(', ') || 'None'}

Generate a concise 3-bullet point briefing for the doctor. Each bullet should be 1-2 sentences max. Focus on:
1. Patient overview and chief concern
2. Vital signs assessment
3. Recommended next steps

Return ONLY a JSON array with exactly 3 strings, no markdown or explanation.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error')
    }

    const rundown = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify({ success: true, source: 'ai', rundown }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Smart Rundown Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
