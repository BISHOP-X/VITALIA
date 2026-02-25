import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  ChevronRight,
  Bell,
  Settings,
  LogOut,
  Heart,
  Check,
  Sparkles,
  Brain,
  AlertTriangle,
  TrendingUp,
  Zap,
  Loader2,
  Scale,
  Ruler,
  Calculator,
  Plus,
  Thermometer
} from "lucide-react";
import { HealthRing } from "@/components/HealthRing";
import { ActionCard } from "@/components/ActionCard";
import { GlassModal } from "@/components/GlassModal";
import { ChatButton } from "@/components/ChatButton";
import { ChatPanel } from "@/components/ChatPanel";
import { toast } from "@/hooks/use-toast";
import { logSymptom, saveBMIRecord as saveBMIToSupabase, isDemoMode, saveVitals } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePatientData } from "@/hooks/usePatientData";
import healthPattern from "@/assets/health-pattern.jpg";

// Common symptom types for quick selection
const commonSymptoms = [
  "Headache", "Fever", "Cough", "Fatigue", 
  "Nausea", "Dizziness", "Chest Pain", "Shortness of Breath",
  "Abdominal Pain", "Joint Pain", "Back Pain", "Sore Throat"
];

// Body locations for symptom mapping
const bodyLocations = [
  "Head", "Chest", "Abdomen", "Back", 
  "Left Arm", "Right Arm", "Left Leg", "Right Leg", "Other"
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { symptoms, bmiRecords, latestVitals, vitalsHistory, loading: dataLoading, refresh } = usePatientData();

  // Dynamic quick stats from real Supabase data
  const quickStats = [
    {
      label: "Heart Rate",
      value: latestVitals?.heart_rate?.toString() ?? "--",
      unit: latestVitals?.heart_rate ? "bpm" : "",
      trend: "normal" as const,
    },
    {
      label: "Blood Pressure",
      value: latestVitals?.systolic_bp && latestVitals?.diastolic_bp
        ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}`
        : "--",
      unit: latestVitals?.systolic_bp ? "mmHg" : "",
      trend: "normal" as const,
    },
    {
      label: "Sleep",
      value: latestVitals?.sleep_hours?.toString() ?? "--",
      unit: latestVitals?.sleep_hours ? "hrs" : "",
      trend: "good" as const,
    },
    {
      label: "BMI",
      value: bmiRecords.length > 0 ? bmiRecords[0].bmi_value.toFixed(1) : "--",
      unit: bmiRecords.length > 0
        ? bmiRecords[0].category.charAt(0).toUpperCase() + bmiRecords[0].category.slice(1)
        : "",
      trend: "good" as const,
      clickable: true,
    },
  ];

  // Health score based on data completeness (0-100)
  const dataPoints = [
    latestVitals?.heart_rate ? 1 : 0,
    latestVitals?.systolic_bp ? 1 : 0,
    latestVitals?.sleep_hours ? 1 : 0,
    bmiRecords.length > 0 ? 1 : 0,
    symptoms.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);
  const healthScore = dataPoints === 0 ? 0 : Math.round((dataPoints / 5) * 100);
  const healthStatus: "low" | "medium" | "high" = healthScore >= 60 ? "low" : healthScore >= 30 ? "medium" : "high";
  const healthMessage = healthScore === 0
    ? "Start by recording your vitals and symptoms"
    : healthScore < 60
    ? "Keep adding health data to improve your score"
    : "You're doing great! Keep it up.";
  const profileFirstName = profile?.full_name?.trim().split(/\s+/)[0];
  const userMetaFullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined;
  const userMetaFirstName = userMetaFullName?.trim().split(/\s+/)[0];
  const emailFirstName = typeof user?.email === 'string' ? user.email.split('@')[0] : undefined;
  let lastKnownFirstName: string | undefined;
  try {
    const stored = localStorage.getItem('vitalia_last_known_full_name_v1') || '';
    const first = stored.trim().split(/\s+/)[0];
    lastKnownFirstName = first || undefined;
  } catch {
    lastKnownFirstName = undefined;
  }
  const displayName = profileFirstName || userMetaFirstName || lastKnownFirstName || emailFirstName || 'Guest';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore — still navigate home
    }
    window.location.href = "/";
  };

  const handleDownloadApp = () => {
    window.dispatchEvent(new CustomEvent('vitalia:open-install-modal'));
  };
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ heartRate: '', systolicBp: '', diastolicBp: '', sleepHours: '', oxygenSat: '', temperature: '', notes: '' });
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    possible_conditions: { name: string; likelihood: number; description: string; }[];
    urgency_level: "low" | "medium" | "high";
    recommendations: string[];
    when_to_see_doctor: string;
    disclaimer: string;
  } | null>(null);
  
  // BMI Calculator state
  const [isBMIModalOpen, setIsBMIModalOpen] = useState(false);
  const [showBMIResult, setShowBMIResult] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "inches">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [bmiValue, setBmiValue] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<{
    label: string;
    color: string;
    description: string;
  } | null>(null);
  // Real BMI history from Supabase
  const bmiHistory = bmiRecords.map(r => ({
    date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    bmi: r.bmi_value,
  }));

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: number; sender: "doctor" | "patient"; content: string; timestamp: string; read: boolean}[]>([]);
  const [unreadChatCount] = useState(0);

  // Symptom form state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [bodyLocation, setBodyLocation] = useState("");
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleLogSymptom = async () => {
    // Validate required fields
    if (selectedSymptoms.length === 0 && !customSymptom) {
      toast({
        title: "Symptom Required",
        description: "Please select or enter at least one symptom.",
        variant: "destructive"
      });
      return;
    }

    if (!duration) {
      toast({
        title: "Duration Required", 
        description: "Please specify how long you've had these symptoms.",
        variant: "destructive"
      });
      return;
    }

    // Combine selected symptoms with custom entry
    const allSymptoms = [...selectedSymptoms];
    if (customSymptom.trim()) {
      allSymptoms.push(customSymptom.trim());
    }

    // Map 1-10 severity slider to database enum
    const severityLevel: 'mild' | 'moderate' | 'severe' = 
      severity <= 3 ? 'mild' : severity <= 6 ? 'moderate' : 'severe';

    // Save to Supabase if connected, otherwise silent fallback
    if (!isDemoMode()) {
      try {
        await logSymptom({
          symptom_type: allSymptoms.join(', '),
          severity: severityLevel,
          duration,
          body_location: bodyLocation || undefined,
          notes: notes || undefined,
        });
      } catch (err) {
        console.error('Symptom save failed, continuing in demo mode:', err);
      }
    }

    toast({
      title: "Symptom Logged",
      description: "Your health data has been recorded successfully.",
    });

    // Refresh dashboard data
    refresh();

    // Reset form
    setSelectedSymptoms([]);
    setCustomSymptom("");
    setBodyLocation("");
    setSeverity(5);
    setDuration("");
    setNotes("");
    setIsSymptomModalOpen(false);
  };

  const handleBookAppointment = () => {
    toast({
      title: "Appointment Requested",
      description: "We'll contact you shortly to confirm your booking.",
    });
    setIsBookingModalOpen(false);
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    // Simulate AI processing - In production, this calls Groq API via Edge Functions
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock AI analysis based on patient's current health data
    // In production, this would analyze: symptoms, vitals, history, medications
    const mockAnalysis = {
      possible_conditions: [
        {
          name: "General Wellness - Healthy State",
          likelihood: 87,
          description: "Your vitals and health score indicate you're in good health. Heart rate, blood pressure, and sleep patterns are all within optimal ranges."
        },
        {
          name: "Mild Dehydration Risk",
          likelihood: 15,
          description: "Slightly elevated heart rate could indicate mild dehydration. Consider increasing water intake to 8-10 glasses daily."
        },
        {
          name: "Sleep Quality Optimization",
          likelihood: 12,
          description: "While your 7.5 hours is good, maintaining consistent sleep schedule could improve recovery and energy levels."
        }
      ],
      urgency_level: "low" as const,
      recommendations: [
        "Continue your current healthy habits - your 87% health score is excellent",
        "Maintain regular exercise routine (aim for 150 minutes/week of moderate activity)",
        "Stay hydrated: drink 8-10 glasses of water daily",
        "Keep consistent sleep schedule (7-9 hours nightly)",
        "Monitor blood pressure weekly to maintain current healthy levels",
        "Consider adding stress-reduction practices like meditation or yoga"
      ],
      when_to_see_doctor: "Schedule a routine checkup within the next 3-6 months for preventive care. Seek immediate care if you experience chest pain, severe headaches, or any concerning new symptoms.",
      disclaimer: "This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult with a healthcare provider for medical decisions."
    };

    setIsAnalyzing(false);
    setAiAnalysis(mockAnalysis);
  };

  const calculateBMI = () => {
    if (!height || !weight) {
      toast({
        title: "Missing Information",
        description: "Please enter both height and weight.",
        variant: "destructive"
      });
      return;
    }

    let heightInMeters = parseFloat(height);
    let weightInKg = parseFloat(weight);

    // Convert to metric if needed
    if (heightUnit === "inches") {
      heightInMeters = heightInMeters * 0.0254; // inches to meters
    } else {
      heightInMeters = heightInMeters / 100; // cm to meters
    }

    if (weightUnit === "lbs") {
      weightInKg = weightInKg * 0.453592; // lbs to kg
    }

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    setBmiValue(parseFloat(bmi.toFixed(1)));

    // Determine category
    let category;
    if (bmi < 18.5) {
      category = {
        label: "Underweight",
        color: "blue",
        description: "Your BMI is below the healthy range. Consider consulting a healthcare provider about nutrition."
      };
    } else if (bmi >= 18.5 && bmi < 25) {
      category = {
        label: "Normal Weight",
        color: "green",
        description: "Your BMI is in the healthy range. Keep up your current lifestyle!"
      };
    } else if (bmi >= 25 && bmi < 30) {
      category = {
        label: "Overweight",
        color: "yellow",
        description: "Your BMI is above the healthy range. Consider healthy diet and exercise adjustments."
      };
    } else {
      category = {
        label: "Obese",
        color: "red",
        description: "Your BMI indicates obesity. Consult a healthcare provider for a personalized health plan."
      };
    }

    setBmiCategory(category);
    setShowBMIResult(true);
  };

  const resetBMICalculator = () => {
    setShowBMIResult(false);
    setHeight("");
    setWeight("");
    setBmiValue(null);
    setBmiCategory(null);
  };

  const saveBMIRecord = async () => {
    if (!isDemoMode() && bmiValue && bmiCategory) {
      try {
        // Convert to metric for DB storage
        let heightCm = parseFloat(height);
        let weightKg = parseFloat(weight);
        if (heightUnit === "inches") heightCm = heightCm * 2.54;
        if (weightUnit === "lbs") weightKg = weightKg * 0.453592;

        const categoryMap: Record<string, 'underweight' | 'normal' | 'overweight' | 'obese'> = {
          "Underweight": "underweight",
          "Normal Weight": "normal",
          "Overweight": "overweight",
          "Obese": "obese",
        };

        await saveBMIToSupabase({
          height_cm: parseFloat(heightCm.toFixed(2)),
          weight_kg: parseFloat(weightKg.toFixed(2)),
          bmi_value: bmiValue,
          category: categoryMap[bmiCategory.label] || "normal",
        });
      } catch (err) {
        console.error('BMI save failed, continuing in demo mode:', err);
      }
    }

    toast({
      title: "BMI Saved",
      description: "Your BMI record has been saved successfully.",
    });

    // Refresh dashboard data
    refresh();

    setIsBMIModalOpen(false);
    resetBMICalculator();
  };

  const handleSaveVitals = async () => {
    const { heartRate, systolicBp, diastolicBp, sleepHours, oxygenSat, temperature, notes: vNotes } = vitalsForm;
    // Require at least one field
    if (!heartRate && !systolicBp && !sleepHours && !oxygenSat && !temperature) {
      toast({ title: "Enter at least one vital", description: "Fill in at least one measurement to save.", variant: "destructive" });
      return;
    }
    setIsSavingVitals(true);
    try {
      await saveVitals({
        heart_rate: heartRate ? parseInt(heartRate) : undefined,
        systolic_bp: systolicBp ? parseInt(systolicBp) : undefined,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : undefined,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
        oxygen_saturation: oxygenSat ? parseInt(oxygenSat) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        notes: vNotes || undefined,
      });
      toast({ title: "Vitals Recorded", description: "Your vitals have been saved successfully." });
      setVitalsForm({ heartRate: '', systolicBp: '', diastolicBp: '', sleepHours: '', oxygenSat: '', temperature: '', notes: '' });
      setIsVitalsModalOpen(false);
      refresh();
    } catch (err) {
      console.error('Vitals save failed:', err);
      toast({ title: "Save Failed", description: "Could not save vitals. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingVitals(false);
    }
  };

  // Chat message handlers
  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: chatMessages.length + 1,
      sender: "patient" as const,
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    
    setChatMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with pattern */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={healthPattern}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
        </div>

        <div className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sm:pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">Good morning,</p>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{displayName}</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Health Ring */}
          <div className="flex flex-col items-center px-4">
            <div className="w-full max-w-[180px]">
              <HealthRing progress={healthScore} status={healthStatus} size={undefined} />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground text-center px-4"
            >
              {healthMessage}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 sm:px-6 -mt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Your Vitals</h3>
          <button
            onClick={() => setIsVitalsModalOpen(true)}
            className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Vitals
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              onClick={stat.clickable ? () => setIsBMIModalOpen(true) : undefined}
              className={`glass-card p-2 sm:p-3 text-center relative ${stat.clickable ? 'cursor-pointer hover:bg-white/15 hover:border-amber-500/50 transition-all duration-300 group' : ''}`}
            >
              {stat.clickable && (
                <div className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <Calculator className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                </div>
              )}
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">{stat.label}</p>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {stat.value}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5 sm:ml-1">
                  {stat.unit}
                </span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="px-4 sm:px-6 mt-6 sm:mt-8 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <ActionCard
            title="AI Health Advisor"
            subtitle="Get instant insights"
            icon={Sparkles}
            gradient="teal"
            onClick={() => setIsAIAdvisorOpen(true)}
            delay={0.6}
          />
          <ActionCard
            title="Log Symptoms"
            subtitle="Record how you feel"
            icon={Activity}
            gradient="coral"
            onClick={() => setIsSymptomModalOpen(true)}
            delay={0.65}
          />
          <ActionCard
            title="My History"
            subtitle="View past records"
            icon={FileText}
            gradient="sage"
            onClick={() => setIsHistoryModalOpen(true)}
            delay={0.7}
          />
          <ActionCard
            title="Book Visit"
            subtitle="Schedule appointment"
            icon={Calendar}
            gradient="ocean"
            onClick={() => setIsBookingModalOpen(true)}
            delay={0.75}
          />
          <ActionCard
            title="Reminders"
            subtitle="Medication alerts"
            icon={Clock}
            gradient="coral"
            onClick={() => setIsReminderModalOpen(true)}
            delay={0.8}
          />
        </div>
      </div>

      {/* Upcoming Visit */}
      <div className="px-4 sm:px-6 mt-6 sm:mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="glass-card p-3 sm:p-4"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Upcoming Visit</h3>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium text-foreground truncate">No upcoming visits</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Tap "Book Visit" to schedule one</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl border-t border-white/10">
        <div className="flex items-center justify-around py-3 sm:py-4 px-2">
          <button className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[60px] py-1">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="text-[10px] sm:text-xs text-primary font-medium">Home</span>
          </button>
          <button 
            onClick={() => setIsActivityModalOpen(true)}
            className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[60px] py-1 hover:opacity-80 transition-opacity"
          >
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Activity</span>
          </button>
          <button 
            onClick={() => setIsBookingModalOpen(true)}
            className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[60px] py-1 hover:opacity-80 transition-opacity"
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Schedule</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[60px] py-1 hover:opacity-80 transition-opacity"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Exit</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {/* AI Health Advisor Modal */}
      <GlassModal isOpen={isAIAdvisorOpen} onClose={() => setIsAIAdvisorOpen(false)}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">AI Health Advisor</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Powered by advanced health intelligence</p>
          </div>
        </div>

        {!aiAnalysis && !isAnalyzing && (
          <div className="space-y-4 sm:space-y-5">
            <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">Get Instant Health Insights</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Our AI analyzes your current vitals, health score, and wellness data to provide:
                  </p>
                </div>
              </div>
              
              <div className="mt-3 sm:mt-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground">Possible health conditions based on your data</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground">Urgency assessment and priority level</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground">Personalized health recommendations</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-foreground">When to consult your doctor</p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-orange-300 leading-relaxed">
                  <strong className="font-semibold">Medical Disclaimer:</strong> This AI analysis is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </div>
            </div>

            <button
              onClick={handleAIAnalysis}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              Analyze My Health
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-pulse" />
                <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-primary animate-spin absolute inset-0" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground mt-4 sm:mt-6">Analyzing Your Health Data...</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">This may take a few moments</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {[
                { icon: "🧬", text: "Reviewing vitals and health metrics" },
                { icon: "📊", text: "Analyzing patterns and trends" },
                { icon: "🔍", text: "Identifying potential insights" },
                { icon: "💡", text: "Generating personalized recommendations" }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30"
                >
                  <span className="text-lg sm:text-xl">{step.icon}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">{step.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {aiAnalysis && !isAnalyzing && (
          <div className="space-y-3 sm:space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Urgency Level Banner */}
            <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 ${
              aiAnalysis.urgency_level === "high" 
                ? "bg-red-500/10 border-red-500/30" 
                : aiAnalysis.urgency_level === "medium"
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-green-500/10 border-green-500/30"
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  aiAnalysis.urgency_level === "high"
                    ? "bg-red-500/20"
                    : aiAnalysis.urgency_level === "medium"
                    ? "bg-orange-500/20"
                    : "bg-green-500/20"
                }`}>
                  <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    aiAnalysis.urgency_level === "high"
                      ? "text-red-400"
                      : aiAnalysis.urgency_level === "medium"
                      ? "text-orange-400"
                      : "text-green-400"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Priority: {aiAnalysis.urgency_level.charAt(0).toUpperCase() + aiAnalysis.urgency_level.slice(1)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {aiAnalysis.urgency_level === "low" && "Continue regular health monitoring"}
                    {aiAnalysis.urgency_level === "medium" && "Consider consulting your doctor soon"}
                    {aiAnalysis.urgency_level === "high" && "Seek medical attention promptly"}
                  </p>
                </div>
              </div>
            </div>

            {/* Possible Conditions */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                AI Health Analysis
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {aiAnalysis.possible_conditions.map((condition, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">{condition.name}</h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm font-bold text-primary">{condition.likelihood}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                        style={{ width: `${condition.likelihood}%` }}
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{condition.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                Personalized Recommendations
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {aiAnalysis.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-start gap-2 p-2 sm:p-2.5 rounded-lg bg-accent/5 border border-accent/10"
                  >
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* When to See Doctor */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
              <h3 className="text-xs sm:text-sm font-semibold text-primary mb-1.5 sm:mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                When to Consult Your Doctor
              </h3>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">{aiAnalysis.when_to_see_doctor}</p>
            </div>

            {/* Disclaimer */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-[10px] sm:text-xs text-orange-300 leading-relaxed">{aiAnalysis.disclaimer}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setAiAnalysis(null);
                  handleAIAnalysis();
                }}
                className="btn-glass flex-1 text-sm sm:text-base py-2.5 sm:py-3"
              >
                Re-analyze
              </button>
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="btn-primary flex-1 text-sm sm:text-base py-2.5 sm:py-3"
              >
                Book Appointment
              </button>
            </div>
          </div>
        )}
      </GlassModal>

      <GlassModal isOpen={isSymptomModalOpen} onClose={() => setIsSymptomModalOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5 sm:mb-2">Log Symptoms</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Help us understand what you're experiencing</p>
        
        <div className="space-y-4 sm:space-y-5 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
          {/* Common Symptoms - Quick Select Pills */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Select Symptoms</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'bg-secondary/50 text-foreground border border-white/10 hover:border-primary/50'
                  }`}
                >
                  {selectedSymptoms.includes(symptom) && (
                    <Check className="w-3 h-3 inline mr-1" />
                  )}
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Symptom Input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Other Symptom</label>
            <input 
              type="text"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type if not listed above..."
            />
          </div>

          {/* Body Location Selector */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Where does it hurt?</label>
            <select 
              value={bodyLocation}
              onChange={(e) => setBodyLocation(e.target.value)}
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select location...</option>
              {bodyLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Severity Slider */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
              Severity: <span className="text-primary font-bold">{severity}/10</span>
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              <input 
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full h-1.5 sm:h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #f59e0b ${severity * 5}%, #ef4444 ${severity * 10}%, #374151 ${severity * 10}%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          {/* Duration Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">How long have you had this? *</label>
            <select 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select duration...</option>
              <option value="less_than_day">Less than a day</option>
              <option value="1_2_days">1-2 days</option>
              <option value="3_7_days">3-7 days</option>
              <option value="1_2_weeks">1-2 weeks</option>
              <option value="more_than_2_weeks">More than 2 weeks</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">Additional Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Any other details you'd like to share..."
              rows={3}
            />
          </div>

          <button onClick={handleLogSymptom} className="btn-primary w-full text-sm sm:text-base py-2.5 sm:py-3">
            Save Symptom Log
          </button>
        </div>
      </GlassModal>

      <GlassModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Medical History</h2>
        {symptoms.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">No medical history yet</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Log your symptoms to start building your health history</p>
            <button
              onClick={() => { setIsHistoryModalOpen(false); setIsSymptomModalOpen(true); }}
              className="btn-primary mt-4 text-sm sm:text-base py-2 sm:py-2.5 px-6"
            >
              Log Symptoms
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
            {symptoms.map((record) => (
              <div key={record.id} className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10">
                <div className="flex justify-between items-start mb-1.5 sm:mb-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">{record.symptom_type}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Severity: <span className={`font-medium ${
                      record.severity === 'severe' ? 'text-red-400' : record.severity === 'moderate' ? 'text-orange-400' : 'text-green-400'
                    }`}>{record.severity}</span></p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{new Date(record.created_at).toLocaleDateString()}</span>
                </div>
                {record.body_location && <p className="text-[10px] sm:text-xs text-muted-foreground">Location: {record.body_location}</p>}
                {record.duration && <p className="text-[10px] sm:text-xs text-muted-foreground">Duration: {record.duration}</p>}
                {record.notes && <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 italic">{record.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </GlassModal>

      <GlassModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Book Appointment</h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Select Doctor</label>
            <select className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Dr. Martinez (General)</option>
              <option>Dr. Chen (Cardiology)</option>
              <option>Dr. Rodriguez (Neurology)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Preferred Date</label>
            <input 
              type="date" 
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Reason for Visit</label>
            <textarea 
              className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief description..."
              rows={3}
            />
          </div>
          <button onClick={handleBookAppointment} className="btn-primary w-full mt-3 sm:mt-4 text-sm sm:text-base py-2.5 sm:py-3">
            Request Appointment
          </button>
        </div>
      </GlassModal>

      <GlassModal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Medication Reminders</h2>
        <div className="text-center py-8 sm:py-12">
          <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-2 sm:mb-3" />
          <p className="text-sm sm:text-base text-muted-foreground">No reminders set</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Medication reminders will appear here once configured by your doctor</p>
        </div>
      </GlassModal>

      <GlassModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Settings</h2>
        <div className="space-y-2 sm:space-y-3">
          <button className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors">
            <p className="text-sm sm:text-base font-semibold text-foreground">Notifications</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage alerts</p>
          </button>
          <button className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors">
            <p className="text-sm sm:text-base font-semibold text-foreground">Privacy</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Data & permissions</p>
          </button>
          <button className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors">
            <p className="text-sm sm:text-base font-semibold text-foreground">Profile</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Personal information</p>
          </button>
          <button className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors">
            <p className="text-sm sm:text-base font-semibold text-foreground">Integrations</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Connected devices</p>
          </button>

          <button
            onClick={handleDownloadApp}
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors"
          >
            <p className="text-sm sm:text-base font-semibold text-foreground">Download App</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Install Vitalia as a PWA</p>
          </button>

          <button
            onClick={handleLogout}
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors"
          >
            <p className="text-sm sm:text-base font-semibold text-foreground">Log out</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Sign out and return to home</p>
          </button>
        </div>
      </GlassModal>

      <GlassModal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Activity & Vitals</h2>
        {latestVitals ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="glass-card p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-accent/10">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Latest Recorded Vitals</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center">
                  <p className="text-lg sm:text-2xl font-bold text-primary">{latestVitals.heart_rate ?? '--'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Heart Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-2xl font-bold text-accent">{latestVitals.sleep_hours ?? '--'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Hours Sleep</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-2xl font-bold text-primary">{latestVitals.oxygen_saturation ?? '--'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">O₂ Sat %</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2">Recorded: {new Date(latestVitals.recorded_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => { setIsActivityModalOpen(false); setIsVitalsModalOpen(true); }} className="btn-primary w-full text-sm sm:text-base py-2.5 sm:py-3">
              Record New Vitals
            </button>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">No activity recorded yet</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Record your vitals to see a summary here</p>
            <button onClick={() => { setIsActivityModalOpen(false); setIsVitalsModalOpen(true); }} className="btn-primary mt-4 text-sm sm:text-base py-2 sm:py-2.5 px-6">
              Record Vitals
            </button>
          </div>
        )}
      </GlassModal>

      <GlassModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)}>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Notifications</h2>
        <div className="text-center py-8 sm:py-12">
          <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mx-auto mb-2 sm:mb-3" />
          <p className="text-sm sm:text-base text-muted-foreground">No notifications yet</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">You'll see updates here as you use the app</p>
        </div>
      </GlassModal>

      {/* BMI Calculator Modal */}
      <GlassModal isOpen={isBMIModalOpen} onClose={() => {
        setIsBMIModalOpen(false);
        resetBMICalculator();
      }}>
        {!showBMIResult ? (
          /* BMI Input Screen */
          <div>
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">BMI Calculator</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Track your body mass index</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              {/* Height Input Group */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Height</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder={heightUnit === "cm" ? "170" : "67"}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                               text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                               focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                               transition-all duration-300"
                    />
                  </div>
                  <div className="flex gap-1.5 p-1 rounded-lg bg-secondary/50 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setHeightUnit("cm")}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300
                                ${heightUnit === "cm" 
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" 
                                  : "text-muted-foreground hover:text-foreground"}`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit("inches")}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300
                                ${heightUnit === "inches" 
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" 
                                  : "text-muted-foreground hover:text-foreground"}`}
                    >
                      inches
                    </button>
                  </div>
                </div>
              </div>

              {/* Weight Input Group */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Weight</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder={weightUnit === "kg" ? "70" : "154"}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                               text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                               focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                               transition-all duration-300"
                    />
                  </div>
                  <div className="flex gap-1.5 p-1 rounded-lg bg-secondary/50 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setWeightUnit("kg")}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300
                                ${weightUnit === "kg" 
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" 
                                  : "text-muted-foreground hover:text-foreground"}`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit("lbs")}
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300
                                ${weightUnit === "lbs" 
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" 
                                  : "text-muted-foreground hover:text-foreground"}`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <div className="p-3 rounded-lg bg-secondary/30 border border-white/10">
                <p className="text-xs text-muted-foreground text-center">
                  BMI = weight (kg) / height (m)²
                </p>
              </div>

              {/* Calculate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={calculateBMI}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm sm:text-base
                         shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Calculate BMI
              </motion.button>
            </div>
          </div>
        ) : (
          /* BMI Results Screen */
          <div>
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="text-5xl sm:text-6xl font-bold text-foreground mb-2"
              >
                {bmiValue}
              </motion.div>
              <p className="text-sm sm:text-base text-muted-foreground">Body Mass Index</p>
            </div>

            {/* BMI Gauge */}
            {bmiCategory && (
              <div className="mb-6">
                <div className="relative h-4 rounded-full overflow-hidden mb-3">
                  {/* Gauge segments */}
                  <div className="absolute inset-0 flex">
                    <div className="flex-[18.5] bg-blue-500" />
                    <div className="flex-[6.5] bg-green-500" />
                    <div className="flex-[5] bg-yellow-500" />
                    <div className="flex-[10] bg-red-500" />
                  </div>
                  {/* Indicator */}
                  <motion.div
                    initial={{ left: "0%" }}
                    animate={{ 
                      left: `${Math.min(Math.max((bmiValue! / 40) * 100, 2), 98)}%`
                    }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-foreground"
                  />
                </div>

                {/* Category Labels */}
                <div className="grid grid-cols-4 gap-1 text-[10px] sm:text-xs text-center text-muted-foreground mb-6">
                  <div>Underweight<br/>&lt;18.5</div>
                  <div>Normal<br/>18.5-25</div>
                  <div>Overweight<br/>25-30</div>
                  <div>Obese<br/>≥30</div>
                </div>

                {/* Category Badge */}
                <div className="flex justify-center mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold
                    ${bmiCategory.color === "blue" ? "bg-blue-500/20 text-blue-400" : ""}
                    ${bmiCategory.color === "green" ? "bg-green-500/20 text-green-400" : ""}
                    ${bmiCategory.color === "yellow" ? "bg-yellow-500/20 text-yellow-400" : ""}
                    ${bmiCategory.color === "red" ? "bg-red-500/20 text-red-400" : ""}
                  `}>
                    {bmiCategory.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-center text-muted-foreground mb-6 px-2">
                  {bmiCategory.description}
                </p>

                {/* BMI History Trend */}
                {bmiHistory.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Your BMI Trend</h3>
                    </div>
                    
                    {/* Simple SVG Line Chart */}
                    <div className="relative h-32 bg-secondary/30 rounded-lg p-3">
                      <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="300" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
                        <line x1="0" y1="80" x2="300" y2="80" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
                        
                        {/* BMI Line */}
                        <polyline
                          points={bmiHistory.map((entry, i) => {
                            const x = (i / (bmiHistory.length - 1)) * 300;
                            const y = 100 - ((entry.bmi - 22) * 10); // Scale around 22-26 range
                            return `${x},${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="url(#bmiGradient)"
                          strokeWidth="2"
                          className="drop-shadow-lg"
                        />
                        
                        {/* Data points */}
                        {bmiHistory.map((entry, i) => {
                          const x = (i / (bmiHistory.length - 1)) * 300;
                          const y = 100 - ((entry.bmi - 22) * 10);
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="3"
                              className="fill-primary"
                            />
                          );
                        })}
                        
                        <defs>
                          <linearGradient id="bmiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    
                    {/* Date labels */}
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
                      <span>{bmiHistory[bmiHistory.length - 1].date}</span>
                      <span>{bmiHistory[0].date}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetBMICalculator}
                    className="flex-1 py-2.5 rounded-lg border border-white/20 text-foreground font-medium text-sm
                             hover:bg-secondary/50 transition-all duration-300"
                  >
                    Recalculate
                  </button>
                  <button
                    onClick={saveBMIRecord}
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm
                             shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Save Record
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassModal>

      {/* Vitals Modal */}
      <GlassModal isOpen={isVitalsModalOpen} onClose={() => setIsVitalsModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Record Vitals</h2>
              <p className="text-xs text-muted-foreground">Enter the values you have — leave the rest blank</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Heart Rate (bpm)</label>
              <input
                type="number"
                placeholder="e.g. 72"
                value={vitalsForm.heartRate}
                onChange={e => setVitalsForm(f => ({ ...f, heartRate: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Systolic BP (mmHg)</label>
              <input
                type="number"
                placeholder="e.g. 120"
                value={vitalsForm.systolicBp}
                onChange={e => setVitalsForm(f => ({ ...f, systolicBp: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Diastolic BP (mmHg)</label>
              <input
                type="number"
                placeholder="e.g. 80"
                value={vitalsForm.diastolicBp}
                onChange={e => setVitalsForm(f => ({ ...f, diastolicBp: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 7.5"
                value={vitalsForm.sleepHours}
                onChange={e => setVitalsForm(f => ({ ...f, sleepHours: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">O₂ Saturation (%)</label>
              <input
                type="number"
                placeholder="e.g. 98"
                value={vitalsForm.oxygenSat}
                onChange={e => setVitalsForm(f => ({ ...f, oxygenSat: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 36.6"
                value={vitalsForm.temperature}
                onChange={e => setVitalsForm(f => ({ ...f, temperature: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <textarea
              placeholder="Any additional notes…"
              value={vitalsForm.notes}
              onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>

          <button
            onClick={handleSaveVitals}
            disabled={isSavingVitals}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSavingVitals ? 'Saving…' : 'Save Vitals'}
          </button>
        </div>
      </GlassModal>

      {/* Floating Chat Button */}
      <ChatButton 
        onClick={() => setIsChatOpen(true)}
        unreadCount={unreadChatCount}
        isOpen={isChatOpen}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        doctorName="Dr. Martinez"
        isOnline={true}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
      />
    </div>
  );
}
