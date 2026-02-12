import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedData {
  symptoms: string[]
  diagnosis: string
  treatment_plan: string[]
  follow_up: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { notes } = await req.json() as { notes: string }

    if (!notes || notes.trim().length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide clinical notes (at least 10 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groqKey = Deno.env.get('GROQ_API_KEY')

    if (!groqKey) {
      const mockExtraction: ExtractedData = {
        symptoms: extractKeywords(notes, ['pain', 'ache', 'fever', 'cough', 'fatigue', 'nausea', 'headache', 'dizziness']),
        diagnosis: 'Requires clinical evaluation - AI extraction demo',
        treatment_plan: ['Continue monitoring symptoms', 'Follow up in 1 week if symptoms persist'],
        follow_up: '1 week'
      }

      return new Response(
        JSON.stringify({ success: true, source: 'demo', extraction: mockExtraction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `You are a medical AI assistant. Extract structured clinical data from the following doctor's notes.

Doctor's Notes:
"${notes}"

Extract and return a JSON object with these exact keys:
{
  "symptoms": ["array of identified symptoms"],
  "diagnosis": "primary diagnosis or 'Pending evaluation' if unclear",
  "treatment_plan": ["array of treatment steps/medications"],
  "follow_up": "recommended follow-up timeframe"
}

Return ONLY valid JSON, no markdown or explanation.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error')
    }

    const extraction: ExtractedData = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify({ success: true, source: 'ai', extraction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Clinical Extraction Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function extractKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase()
  return keywords.filter(keyword => lowerText.includes(keyword))
}
