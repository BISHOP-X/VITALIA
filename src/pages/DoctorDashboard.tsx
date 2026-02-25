import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Bell, 
  Settings, 
  Users, 
  Activity,
  Calendar,
  Heart,
  LogOut,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MessageCircle
} from "lucide-react";
import { PatientCard } from "@/components/PatientCard";
import { useAuth } from "@/hooks/useAuth";
import { AIWorkspace } from "@/components/AIWorkspace";
import { GlassModal } from "@/components/GlassModal";
import { DoctorChatSidebar } from "@/components/DoctorChatSidebar";

import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import avatar4 from "@/assets/avatar-4.jpg";
import healthPattern from "@/assets/health-pattern.jpg";
import { getAllPatientProfiles } from "@/lib/supabase";

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
  bmi: number;
  bmi_category: "Underweight" | "Normal" | "Overweight" | "Obese";
  bmi_trend: "up" | "down" | "stable";
  last_updated: string;
}

interface EnrichedPatient {
  id: string;
  name: string;
  age: number;
  avatar: string;
  status: "low" | "medium" | "high";
  lastVisit: string;
  medical_history: MedicalHistory;
  recent_symptoms: Symptom[];
  consultations: Consultation[];
  vitals: Vitals;
}

const defaultAvatars = [avatar1, avatar2, avatar3, avatar4];

interface SelectedPatient {
  id: string;
  name: string;
  age: number;
  avatar: string;
  status: "low" | "medium" | "high";
  lastVisit: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore — still navigate home
    }
    window.location.href = "/";
  };
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Real patient data from Supabase
  const [patients, setPatients] = useState<EnrichedPatient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPatients() {
      try {
        const profiles = await getAllPatientProfiles();
        if (cancelled) return;
        const mapped: EnrichedPatient[] = profiles.map((p, i) => ({
          id: p.id,
          name: p.full_name,
          age: p.age ?? 0,
          avatar: p.avatar_url || defaultAvatars[i % defaultAvatars.length],
          status: "low" as const,
          lastVisit: "No visits yet",
          medical_history: { allergies: [], chronic_conditions: [], past_surgeries: [], current_medications: [] },
          recent_symptoms: [],
          consultations: [],
          vitals: {
            heart_rate: 0, blood_pressure: "--/--", temperature: 0, oxygen_level: 0,
            weight: 0, bmi: 0, bmi_category: "Normal" as const, bmi_trend: "stable" as const,
            last_updated: "No data yet"
          }
        }));
        setPatients(mapped);
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        if (!cancelled) setPatientsLoading(false);
      }
    }
    loadPatients();
    return () => { cancelled = true; };
  }, []);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Conversations — empty until real messaging is implemented
  const [conversations] = useState<{ patientId: number; patientName: string; patientAvatar: string; lastMessage: string; lastMessageTime: string; unreadCount: number; isOnline: boolean }[]>([]);

  // Chat messages — empty until real messaging is implemented
  const [chatMessages, setChatMessages] = useState<{ [key: number]: any[] }>({});

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) return;

    const newMessage = {
      id: (chatMessages[selectedConversationId]?.length || 0) + 1,
      sender: "doctor" as const,
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage]
    }));
  };

  const handleSelectConversation = (patientId: number) => {
    setSelectedConversationId(patientId);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedPatient) {
    const fullPatient = patients.find(p => p.id === selectedPatient.id);
    
    if (!fullPatient) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading patient data…</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Patient Detail View */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Panel - Patient Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-1/3 border-r border-border p-4 sm:p-6 lg:p-8 overflow-y-auto"
          >
            <button
              onClick={() => setSelectedPatient(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back to Registry</span>
            </button>

            <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
              <img
                src={selectedPatient.avatar}
                alt={selectedPatient.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl object-cover border-4 border-white/10 mb-3 sm:mb-4"
              />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{selectedPatient.name}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{selectedPatient.age} years old</p>
              
              <div className={`
                mt-4 px-4 py-2 rounded-full text-sm font-medium
                ${
                  selectedPatient.status === 'low' 
                    ? 'bg-status-low/20 text-status-low' 
                    : selectedPatient.status === 'medium'
                    ? 'bg-status-medium/20 text-status-medium'
                    : 'bg-status-high/20 text-status-high'
                }
              `}>
                {selectedPatient.status === 'low' ? 'Low Risk' : selectedPatient.status === 'medium' ? 'Medium Risk' : 'High Risk'}
              </div>
            </div>

            {/* Latest Vitals */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Latest Vitals
              </h3>
              
              {[
                { label: "Blood Pressure", value: fullPatient.vitals.blood_pressure + " mmHg" },
                { label: "Heart Rate", value: fullPatient.vitals.heart_rate + " bpm" },
                { label: "Temperature", value: fullPatient.vitals.temperature + "°F" },
                { label: "Oxygen Level", value: fullPatient.vitals.oxygen_level + "%" },
                { label: "Weight", value: fullPatient.vitals.weight + " lbs" },
                { 
                  label: "BMI", 
                  value: `${fullPatient.vitals.bmi} (${fullPatient.vitals.bmi_category})`,
                  trend: fullPatient.vitals.bmi_trend
                },
              ].map((vital, i) => (
                <motion.div
                  key={vital.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50"
                >
                  <span className="text-xs sm:text-sm text-muted-foreground">{vital.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">{vital.value}</span>
                    {vital.trend && (
                      <div className="flex items-center">
                        {vital.trend === "up" && <TrendingUp className="w-3 h-3 text-red-400" />}
                        {vital.trend === "down" && <TrendingDown className="w-3 h-3 text-green-400" />}
                        {vital.trend === "stable" && <div className="w-3 h-0.5 bg-blue-400" />}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2">
                Last updated: {fullPatient.vitals.last_updated}
              </p>
            </div>

            {/* Medical History Section */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Medical History
              </h3>

              {/* Chronic Conditions */}
              {fullPatient.medical_history.chronic_conditions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-orange-500/10 border border-orange-500/20"
                >
                  <h4 className="text-[10px] sm:text-xs font-semibold text-orange-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-400"></span>
                    Chronic Conditions
                  </h4>
                  <div className="space-y-1">
                    {fullPatient.medical_history.chronic_conditions.map((condition, i) => (
                      <div key={i} className="text-xs sm:text-sm text-foreground flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5 sm:mt-1">•</span>
                        <span>{condition}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Allergies */}
              {fullPatient.medical_history.allergies.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <h4 className="text-[10px] sm:text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-400"></span>
                    Allergies
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {fullPatient.medical_history.allergies.map((allergy, i) => (
                      <span 
                        key={i}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-medium"
                      >
                        ⚠️ {allergy}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10"
                >
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">No known allergies</p>
                </motion.div>
              )}

              {/* Current Medications */}
              {fullPatient.medical_history.current_medications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20"
                >
                  <h4 className="text-[10px] sm:text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400"></span>
                    Current Medications
                  </h4>
                  <div className="space-y-1">
                    {fullPatient.medical_history.current_medications.map((med, i) => (
                      <div key={i} className="text-xs sm:text-sm text-foreground flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 sm:mt-1">💊</span>
                        <span>{med}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Past Surgeries */}
              {fullPatient.medical_history.past_surgeries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-purple-500/10 border border-purple-500/20"
                >
                  <h4 className="text-[10px] sm:text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400"></span>
                    Past Surgeries
                  </h4>
                  <div className="space-y-2">
                    {fullPatient.medical_history.past_surgeries.map((surgery, i) => (
                      <div key={i} className="text-xs sm:text-sm text-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{surgery.procedure}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{surgery.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Self-Reported Symptoms Section */}
            {fullPatient.recent_symptoms.length > 0 && (
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Recent Symptoms
                  <span className="ml-auto text-[10px] sm:text-xs font-normal normal-case px-1.5 sm:px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                    {fullPatient.recent_symptoms.length} new
                  </span>
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  {fullPatient.recent_symptoms.map((symptom, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                        symptom.severity >= 7 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : symptom.severity >= 5
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-yellow-500/10 border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">{symptom.symptom}</h4>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] sm:text-xs font-bold ${
                            symptom.severity >= 7 ? 'text-red-400' : symptom.severity >= 5 ? 'text-orange-400' : 'text-yellow-400'
                          }`}>
                            {symptom.severity}/10
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                        <span>📅 {symptom.reported_date}</span>
                        <span>⏱️ {symptom.duration}</span>
                      </div>
                      {/* Severity Bar */}
                      <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            symptom.severity >= 7 ? 'bg-red-400' : symptom.severity >= 5 ? 'bg-orange-400' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${symptom.severity * 10}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation History */}
            {fullPatient.consultations.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Consultation History
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  {fullPatient.consultations.map((consult, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                        <span className="text-[10px] sm:text-xs font-semibold text-primary">{consult.date}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{consult.doctor}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1.5 sm:mb-2">{consult.diagnosis}</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{consult.notes}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Panel - AI Workspace */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">AI Workspace</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Intelligent clinical analysis</p>
              </div>
            </div>

            <AIWorkspace patient={patients.find(p => p.id === selectedPatient.id)!} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-10">
          <img src={healthPattern} alt="" className="w-full h-full object-cover" />
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">Vitalia Clinic</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Doctor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Chat Button */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsChatOpen(true)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center
                         hover:bg-white/15 transition-colors"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                {totalUnreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 
                             bg-red-500 rounded-full 
                             flex items-center justify-center
                             border-2 border-background
                             shadow-lg"
                  >
                    <span className="text-white text-[10px] sm:text-xs font-bold">
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </span>
                  </motion.div>
                )}
              </motion.button>

              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
              <button 
                onClick={handleLogout}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {[
            { label: "Total Patients", value: String(patients.length), icon: Users, color: "text-primary" },
            { label: "Today's Visits", value: "0", icon: Calendar, color: "text-accent" },
            { label: "Pending Reviews", value: "0", icon: Activity, color: "text-status-medium" },
            { label: "Critical Alerts", value: String(patients.filter(p => p.status === 'high').length), icon: Heart, color: "text-status-high" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 sm:p-5 lg:p-6"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Patient Registry */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Patient Registry</h2>
            
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 w-full sm:w-64 md:w-80 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                         text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                         transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {patientsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading patients…</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No patients match your search' : 'No patients registered yet'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">Patients will appear here once they sign up</p>
              </div>
            ) : (
              filteredPatients.map((patient, i) => (
                <PatientCard
                  key={patient.id}
                  name={patient.name}
                  age={patient.age}
                  avatar={patient.avatar}
                  status={patient.status}
                  lastVisit={patient.lastVisit}
                  onClick={() => setSelectedPatient(patient)}
                  delay={0.2 + i * 0.1}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <GlassModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Clinic Settings</h2>
        <div className="space-y-4">
          {[
            { label: "Profile Settings", sublabel: "Update your information" },
            { label: "Notification Preferences", sublabel: "Manage alerts & reminders" },
            { label: "Schedule Management", sublabel: "Working hours & availability" },
            { label: "Security", sublabel: "Password & authentication" },
            { label: "Clinic Information", sublabel: "Address, contact details" },
          ].map((item, i) => (
            <button key={i} className="w-full p-4 rounded-xl bg-secondary/50 border border-white/10 text-left hover:bg-secondary transition-colors">
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.sublabel}</p>
            </button>
          ))}
        </div>
      </GlassModal>

      <GlassModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)}>
        <h2 className="text-2xl font-bold text-foreground mb-4">Notifications</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">You'll see alerts and updates here</p>
          </div>
        </div>
        <button className="btn-primary w-full mt-4">
          Mark All as Read
        </button>
      </GlassModal>

      {/* Doctor Chat Sidebar */}
      <DoctorChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        messages={selectedConversationId ? (chatMessages[selectedConversationId] || []) : []}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        onViewProfile={() => {
          // Messaging not yet connected to real patient data
        }}
      />
    </div>
  );
}
