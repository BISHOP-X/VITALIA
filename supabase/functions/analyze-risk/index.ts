import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VitalsData {
  age: number
  heartRate: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  oxygenLevel: number
  temperature?: number
}

interface RiskResult {
  level: 'low' | 'medium' | 'high'
  score: number
  explanation: string
  recommendations: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vitals } = await req.json() as { vitals: VitalsData }

    if (!vitals || !vitals.heartRate || !vitals.bloodPressureSystolic) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required vitals data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const groqKey = Deno.env.get('GROQ_API_KEY')

    if (!groqKey) {
      const riskResult = calculateRiskRuleBased(vitals)
      return new Response(
        JSON.stringify({ success: true, source: 'demo', risk: riskResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `You are a medical AI assistant performing risk assessment based on vital signs.

Patient Vitals:
- Age: ${vitals.age} years
- Heart Rate: ${vitals.heartRate} bpm
- Blood Pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg
- Oxygen Saturation: ${vitals.oxygenLevel}%
${vitals.temperature ? `- Temperature: ${vitals.temperature}°F` : ''}

Analyze these vitals and return a JSON object with:
{
  "level": "low" | "medium" | "high",
  "score": <number 0-100, where 100 is highest risk>,
  "explanation": "<one sentence explaining the risk assessment>",
  "recommendations": ["<array of 2-3 specific recommendations>"]
}

Consider standard medical thresholds:
- Normal HR: 60-100 bpm
- Normal BP: 90-120 systolic, 60-80 diastolic
- Normal O2: 95-100%
- Fever: >100.4°F

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
        max_tokens: 300,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error')
    }

    const riskResult: RiskResult = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify({ success: true, source: 'ai', risk: riskResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Risk Analysis Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateRiskRuleBased(vitals: VitalsData): RiskResult {
  let riskScore = 0
  const issues: string[] = []
  const recommendations: string[] = []

  if (vitals.heartRate < 60) {
    riskScore += 15
    issues.push('bradycardia')
    recommendations.push('Monitor heart rate closely')
  } else if (vitals.heartRate > 100) {
    riskScore += 20
    issues.push('tachycardia')
    recommendations.push('Evaluate causes of elevated heart rate')
  }

  if (vitals.bloodPressureSystolic >= 180 || vitals.bloodPressureDiastolic >= 120) {
    riskScore += 40
    issues.push('hypertensive crisis')
    recommendations.push('Immediate blood pressure management required')
  } else if (vitals.bloodPressureSystolic >= 140 || vitals.bloodPressureDiastolic >= 90) {
    riskScore += 25
    issues.push('hypertension')
    recommendations.push('Consider antihypertensive therapy')
  } else if (vitals.bloodPressureSystolic < 90) {
    riskScore += 30
    issues.push('hypotension')
    recommendations.push('Evaluate for dehydration or other causes')
  }

  if (vitals.oxygenLevel < 90) {
    riskScore += 35
    issues.push('severe hypoxemia')
    recommendations.push('Supplemental oxygen may be needed')
  } else if (vitals.oxygenLevel < 95) {
    riskScore += 15
    issues.push('mild hypoxemia')
    recommendations.push('Monitor oxygen levels')
  }

  if (vitals.age > 65) {
    riskScore += 10
  }

  riskScore = Math.min(riskScore, 100)

  let level: 'low' | 'medium' | 'high'
  if (riskScore >= 50) {
    level = 'high'
  } else if (riskScore >= 25) {
    level = 'medium'
  } else {
    level = 'low'
  }

  let explanation: string
  if (issues.length === 0) {
    explanation = 'All vital signs are within normal ranges.'
    recommendations.push('Continue routine monitoring')
    recommendations.push('Maintain healthy lifestyle')
  } else {
    explanation = `Assessment indicates ${issues.join(', ')} requiring attention.`
  }

  return {
    level,
    score: riskScore,
    explanation,
    recommendations: recommendations.slice(0, 3)
  }
}
