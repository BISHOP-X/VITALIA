import { useState } from "react";
import { motion } from "framer-motion";
import { GlassModal } from "./GlassModal";
import { User, Stethoscope, Mail, Lock, ArrowRight, UserCircle, Calendar, Users, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { signIn, signUp, resetPassword } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: "patient" | "doctor") => void;
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgotPassword">("signin");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Sign up additional fields
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Always authenticate through Supabase
      if (mode === "signin") {
        await signIn({ email, password });
        onLogin(role);
      }

      if (mode === "signup") {
        const signUpResult = await signUp({
          email,
          password,
          fullName,
          role,
          age: age ? parseInt(age) : undefined,
          gender: gender || undefined,
        });

        // If email confirmation is disabled in Supabase, signUp returns a session.
        // In that case, go straight into the app.
        if (signUpResult.session?.user) {
          onLogin(role);
          return;
        }

        // Fallback: try sign-in (for setups that still allow immediate sign-in).
        await signIn({ email, password });
        onLogin(role);
      }

      if (mode === "forgotPassword") {
        await resetPassword(email);
        setResetEmailSent(true);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setEmail("");
    setPassword("");
    setFullName("");
    setAge("");
    setGender("");
    setResetEmailSent(false);
    setError("");
  };

  const goToForgotPassword = () => {
    setMode("forgotPassword");
    setPassword("");
    setResetEmailSent(false);
    setError("");
  };

  const backToSignIn = () => {
    setMode("signin");
    setEmail("");
    setPassword("");
    setResetEmailSent(false);
    setError("");
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose}>
      {/* Forgot Password Mode */}
      {mode === "forgotPassword" ? (
        <div className="text-center">
          {!resetEmailSent ? (
            <>
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Reset Password
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  We'll send you instructions to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                             text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                             transition-all duration-300"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 mt-1 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              <button 
                type="button"
                onClick={backToSignIn}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-5 sm:mt-6 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 sm:py-6"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Check your email!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                We've sent password reset instructions to<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={backToSignIn}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
              >
                Back to Sign In
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </motion.div>
          )}
        </div>
      ) : (
        /* Sign In / Sign Up Mode */
        <>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {mode === "signin" 
            ? "Sign in to access your health portal" 
            : "Join our digital health platform"
          }
        </p>
      </div>

      {/* Role Toggle */}
      <div className="flex gap-1.5 sm:gap-2 p-1 rounded-lg sm:rounded-xl bg-secondary/50 mb-5 sm:mb-6">
        <button
          onClick={() => setRole("patient")}
          className={`
            flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg
            text-sm sm:text-base font-medium transition-all duration-300
            ${role === "patient" 
              ? "bg-primary text-primary-foreground shadow-lg" 
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Patient
        </button>
        <button
          onClick={() => setRole("doctor")}
          className={`
            flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg
            text-sm sm:text-base font-medium transition-all duration-300
            ${role === "doctor" 
              ? "bg-primary text-primary-foreground shadow-lg" 
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Doctor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Sign Up Only Fields */}
        {mode === "signup" && (
          <>
            <div className="relative">
              <UserCircle className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                         text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                         transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="150"
                  required
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                           text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                           transition-all duration-300"
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                  required
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                           text-sm sm:text-base text-foreground
                           focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                           transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Common Fields */}
        <div className="relative">
          <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                     text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                     transition-all duration-300"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-white/10
                     text-sm sm:text-base text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                     transition-all duration-300"
          />
        </div>

        {/* Forgot Password Link - Only in Sign In Mode */}
        {mode === "signin" && (
          <div className="text-right -mt-1">
            <button
              type="button"
              onClick={goToForgotPassword}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 mt-1 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {mode === "signin" ? "Signing In..." : "Creating Account..."}
            </>
          ) : (
            <>
              {mode === "signin" ? "Sign In" : "Create Account"}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </>
          )}
        </motion.button>
      </form>

      <p className="text-center text-xs sm:text-sm text-muted-foreground mt-5 sm:mt-6">
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button 
          type="button"
          onClick={toggleMode}
          className="text-primary hover:underline font-medium"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
        </>
      )}
    </GlassModal>
  );
}
