import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, AlertTriangle, Check, Loader2, Clipboard, Zap } from "lucide-react";
import { supabase, isDemoMode } from "@/lib/supabase";

interface MedicalHistory {
  allergies: string[];
  chronic_conditions: string[];
  past_surgeries: { procedure: string; date: string; }[];
  current_medications: string[];
}

interface Symptom {
  symptom: string;
  severity: number;
  reported_date: string;
  duration: string;
}

interface Consultation {
  date: string;
  doctor: string;
  diagnosis: string;
  notes: string;
}

interface Vitals {
  heart_rate: number;
  blood_pressure: string;
  temperature: number;
  oxygen_level: number;
  weight: number;
  last_updated: string;
}

interface EnrichedPatient {
  id: string;
  name: string;
  age: number;
  status: string;
  medical_history: MedicalHistory;
  recent_symptoms: Symptom[];
  consultations: Consultation[];
  vitals: Vitals;
}

interface AIWorkspaceProps {
  patient: EnrichedPatient;
}

interface ExtractedData {
  symptoms: string[];
  diagnosis: string;
  treatment_plan: string[];
}

interface SmartRundown {
  bullets: [string, string, string];
  generated_at: string;
  data_sources: {
    records_analyzed: number;
    symptoms_included: number;
  };
}

export function AIWorkspace({ patient }: AIWorkspaceProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingRundown, setIsGeneratingRundown] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [smartRundown, setSmartRundown] = useState<SmartRundown | null>(null);
  const [aiSource, setAiSource] = useState<'ai' | 'demo' | null>(null);

  const handleGenerateRundown = async () => {
    setIsGeneratingRundown(true);
    setSmartRundown(null);
    setAiSource(null);

    // Try real Edge Function first
    if (!isDemoMode()) {
      try {
        const { data, error } = await supabase.functions.invoke('smart-rundown', {
          body: {
            patientData: {
              name: patient.name,
              age: patient.age,
              recentSymptoms: patient.recent_symptoms.map(s => s.symptom),
              vitals: {
                heartRate: patient.vitals.heart_rate,
                bloodPressure: patient.vitals.blood_pressure,
                temperature: patient.vitals.temperature,
                oxygenLevel: patient.vitals.oxygen_level,
              },
              medicalHistory: [
                ...patient.medical_history.chronic_conditions,
                ...patient.medical_history.allergies.map(a => `${a} allergy`),
              ],
              currentMedications: patient.medical_history.current_medications,
            }
          }
        });

        if (!error && data?.success && data.rundown) {
          const bullets = data.rundown as string[];
          setSmartRundown({
            bullets: [bullets[0] || '', bullets[1] || '', bullets[2] || ''] as [string, string, string],
            generated_at: new Date().toISOString(),
            data_sources: {
              records_analyzed: patient.consultations.length,
              symptoms_included: patient.recent_symptoms.length,
            }
          });
          setAiSource(data.source === 'ai' ? 'ai' : 'demo');
          setIsGeneratingRundown(false);
          return;
        }
      } catch (err) {
        console.error('Edge function call failed, using local generation:', err);
      }
    }

    // Fallback: local mock generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const historyParts: string[] = [];
    if (patient.medical_history.chronic_conditions.length > 0) {
      historyParts.push(patient.medical_history.chronic_conditions.join(", "));
    }
    if (patient.medical_history.allergies.length > 0) {
      historyParts.push(`${patient.medical_history.allergies.join(", ")} allergies`);
    }
    if (patient.medical_history.past_surgeries.length > 0) {
      const surgery = patient.medical_history.past_surgeries[0];
      historyParts.push(`${surgery.procedure} (${surgery.date})`);
    }
    
    const historyBullet = `**Medical History:** ${historyParts.join("; ")}. Current meds: ${patient.medical_history.current_medications.slice(0, 2).join(", ")}.`;
    
    const symptomsSummary = patient.recent_symptoms.length > 0
      ? `Patient reported ${patient.recent_symptoms.length} symptom${patient.recent_symptoms.length > 1 ? 's' : ''} in past 7 days: ${patient.recent_symptoms[0].symptom} (${patient.recent_symptoms[0].severity}/10 severity, ${patient.recent_symptoms[0].duration}). Last report: ${patient.recent_symptoms[0].reported_date}.`
      : "No recent symptoms reported.";
    
    const recentBullet = `**Recent Activity:** ${symptomsSummary}`;
    
    const vitalStatus = patient.vitals.heart_rate > 100 || patient.vitals.oxygen_level < 95
      ? "requires monitoring"
      : "stable";
    
    const statusBullet = `**Current Status:** Vitals ${vitalStatus} (BP: ${patient.vitals.blood_pressure}, HR: ${patient.vitals.heart_rate}, O2: ${patient.vitals.oxygen_level}%). ${patient.consultations.length > 0 ? `Last seen: ${patient.consultations[0].date} - ${patient.consultations[0].diagnosis}.` : ""} ${patient.status === "high" ? "⚠️ Requires immediate attention." : patient.status === "medium" ? "Monitor closely." : "Routine follow-up recommended."}`;
    
    const rundown: SmartRundown = {
      bullets: [historyBullet, recentBullet, statusBullet],
      generated_at: new Date().toISOString(),
      data_sources: {
        records_analyzed: patient.consultations.length,
        symptoms_included: patient.recent_symptoms.length
      }
    };
    
    setSmartRundown(rundown);
    setAiSource('demo');
    setIsGeneratingRundown(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAnalysisResult("Low cardiovascular risk based on current vitals. Recommend maintaining current exercise routine and dietary habits. Next check-up in 6 months.");
    setIsAnalyzing(false);
  };

  const handleExtract = async () => {
    if (!clinicalNotes.trim()) {
      return;
    }
    
    setIsExtracting(true);
    setExtractedData(null);
    
    // Simulate AI processing - In production, this calls Groq API via Edge Functions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI extraction based on text patterns
    const mockExtraction: ExtractedData = {
      symptoms: [
        "Persistent headache (7/10 severity)",
        "Dizziness when standing",
        "Fatigue lasting 3+ days"
      ],
      diagnosis: "Possible orthostatic hypotension with tension headache",
      treatment_plan: [
        "Increase fluid intake to 2L daily",
        "Monitor blood pressure in standing position",
        "Prescribe: Ibuprofen 400mg PRN for headache",
        "Follow-up in 2 weeks or sooner if symptoms worsen"
      ]
    };
    
    setExtractedData(mockExtraction);
    setIsExtracting(false);
  };

  return (
    <div className="space-y-6">
      {/* Smart Patient Rundown Card - PRIORITY #1 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 sm:p-5 lg:p-6 border-2 border-primary/30"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Clipboard className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                Smart Patient Rundown
                {smartRundown && (
                  <>
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary whitespace-nowrap">
                      Generated {Math.floor((Date.now() - new Date(smartRundown.generated_at).getTime()) / 1000)}s ago
                    </span>
                    {aiSource && (
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1 ${
                        aiSource === 'ai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {aiSource === 'ai' ? <><Zap className="w-3 h-3" /> Groq AI</> : '📋 Demo'}
                      </span>
                    )}
                  </>
                )}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                AI summary: Last {patient.consultations.length} records • {patient.recent_symptoms.length} symptoms • Current vitals
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isGeneratingRundown ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 mb-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mt-1">
                  <span className="text-xs">🏥</span>
                </div>
                <div className="flex-1">
                  <div className="shimmer h-4 rounded-lg w-full mb-2" />
                  <div className="shimmer h-4 rounded-lg w-3/4" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                  <span className="text-xs">📊</span>
                </div>
                <div className="flex-1">
                  <div className="shimmer h-4 rounded-lg w-full mb-2" />
                  <div className="shimmer h-4 rounded-lg w-4/5" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                  <span className="text-xs">💓</span>
                </div>
                <div className="flex-1">
                  <div className="shimmer h-4 rounded-lg w-full mb-2" />
                  <div className="shimmer h-4 rounded-lg w-2/3" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Analyzing patient data...
              </p>
            </motion.div>
          ) : smartRundown ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 sm:space-y-3 mb-3 sm:mb-4"
            >
              {/* Bullet 1: Medical History */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">🏥</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {smartRundown.bullets[0].split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-purple-400">{part}</strong> : part
                  )}
                </p>
              </motion.div>

              {/* Bullet 2: Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">📊</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {smartRundown.bullets[1].split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-orange-400">{part}</strong> : part
                  )}
                </p>
              </motion.div>

              {/* Bullet 3: Current Status */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">💓</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {smartRundown.bullets[2].split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-blue-400">{part}</strong> : part
                  )}
                </p>
              </motion.div>

              {/* Data sources */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-2 sm:pt-3 border-t border-white/5">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  📋 {smartRundown.data_sources.records_analyzed} records analyzed
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  🩺 {smartRundown.data_sources.symptoms_included} symptoms included
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-dashed border-primary/30 text-center mb-3 sm:mb-4"
            >
              <Clipboard className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                No rundown generated yet
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Click below to generate AI-powered clinical briefing
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button
            onClick={handleGenerateRundown}
            disabled={isGeneratingRundown}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 disabled:opacity-50"
          >
            {isGeneratingRundown ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Generating Rundown...</span>
                <span className="sm:hidden">Generating...</span>
              </>
            ) : smartRundown ? (
              <>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Regenerate Rundown</span>
                <span className="sm:hidden">Regenerate</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Generate Smart Rundown</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </button>
          {smartRundown && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(smartRundown.bullets.join('\n\n'));
              }}
              className="btn-glass px-3 sm:px-4 flex items-center gap-2 py-2.5 sm:py-3"
              title="Copy to clipboard"
            >
              📋
            </button>
          )}
        </div>
      </motion.div>

      {/* AI Risk Analysis Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 sm:p-5 lg:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">AI Risk Analysis</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Powered by health intelligence</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="shimmer h-4 rounded-lg w-full" />
              <div className="shimmer h-4 rounded-lg w-3/4" />
              <div className="shimmer h-4 rounded-lg w-5/6" />
            </motion.div>
          ) : analysisResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-status-healthy/10 border border-status-healthy/20"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-status-healthy flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {analysisResult}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs sm:text-sm text-muted-foreground"
            >
              Click analyze to generate AI-powered risk assessment for {patient.name}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="btn-primary w-full mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Analyze Risk
            </>
          )}
        </button>
      </motion.div>

      {/* Smart Note Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4 sm:p-5 lg:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/20 flex items-center justify-center">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Smart Clinical Note</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">AI-powered data extraction</p>
          </div>
        </div>

        {/* Doctor's Note Input */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
            Clinical Notes
          </label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Type your unstructured clinical notes here...&#10;&#10;Example: 'Patient complains of severe headache for past 3 days, rates pain 7/10. Reports dizziness when standing. BP: 118/76, HR: 68. Assessment: likely tension headache with orthostatic component. Plan: increase hydration, monitor BP, prescribe ibuprofen 400mg PRN.'"
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-xs sm:text-sm text-foreground 
                     placeholder:text-muted-foreground/70 leading-relaxed
                     focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                     transition-all duration-300 resize-none"
            rows={8}
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
            Write free-form notes. AI will extract: Symptoms, Diagnosis, Treatment Plan
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isExtracting ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 mb-4"
            >
              <div className="shimmer h-4 rounded-lg w-full" />
              <div className="shimmer h-4 rounded-lg w-4/5" />
              <div className="shimmer h-4 rounded-lg w-2/3" />
            </motion.div>
          ) : extractedData ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 sm:space-y-4 mb-3 sm:mb-4"
            >
              {/* Extracted Symptoms */}
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-accent/10 border border-accent/20">
                <h4 className="text-xs sm:text-sm font-semibold text-accent mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs">🔍</span>
                  </div>
                  Symptoms
                </h4>
                <ul className="space-y-1">
                  {extractedData.symptoms.map((symptom, i) => (
                    <li key={i} className="text-xs sm:text-sm text-foreground flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Extracted Diagnosis */}
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
                <h4 className="text-xs sm:text-sm font-semibold text-primary mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs">📋</span>
                  </div>
                  Diagnosis
                </h4>
                <p className="text-xs sm:text-sm text-foreground">{extractedData.diagnosis}</p>
              </div>

              {/* Extracted Treatment Plan */}
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-status-healthy/10 border border-status-healthy/20">
                <h4 className="text-xs sm:text-sm font-semibold text-status-healthy mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-status-healthy/20 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs">💊</span>
                  </div>
                  Treatment Plan
                </h4>
                <ul className="space-y-1">
                  {extractedData.treatment_plan.map((step, i) => (
                    <li key={i} className="text-xs sm:text-sm text-foreground flex items-start gap-2">
                      <span className="text-status-healthy font-semibold mt-0.5">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Save Button */}
              <button className="btn-accent w-full text-sm sm:text-base py-2.5 sm:py-3">
                Save to Patient Record
              </button>
            </motion.div>
          ) : clinicalNotes.trim() ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 mb-3 sm:mb-4"
            >
              <p className="text-xs sm:text-sm text-foreground">
                ✓ Notes ready. Click "Auto-Extract" to parse clinical data
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          onClick={handleExtract}
          disabled={isExtracting || !clinicalNotes.trim()}
          className="btn-accent w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">Extracting Data...</span>
              <span className="sm:hidden">Extracting...</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Auto-Extract Clinical Data</span>
              <span className="sm:hidden">Auto-Extract</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
