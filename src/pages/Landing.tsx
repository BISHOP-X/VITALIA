import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Shield, Sparkles } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import heroImage from "@/assets/hero-wellness.jpg";

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (role: "patient" | "doctor") => {
    setIsAuthOpen(false);
    if (role === "patient") {
      navigate("/patient");
    } else {
      navigate("/doctor");
    }
  };

  const handleLearnMore = () => {
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-screen relative overflow-hidden flex flex-col">
      {/* Full-bleed hero background */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Doctor and patient connection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">Vitalia</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsAuthOpen(true)}
            className="btn-glass text-sm sm:text-base px-4 sm:px-6"
          >
            Sign In
          </motion.button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 flex-1 flex items-center">
        <div className="w-full max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-4 sm:mb-6"
          >
            <span className="text-gradient-primary">Redefining</span>
            <br />
            Your Healthcare
            <br />
            <span className="text-gradient-accent">Journey</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-lg leading-relaxed"
          >
            Experience the future of personalized medicine. AI-powered insights, 
            seamless doctor connections, and your complete health story in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="btn-primary flex items-center justify-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Get Started
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={handleLearnMore}
              className="btn-glass flex items-center justify-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Learn More
            </button>
          </motion.div>

          {/* Feature Pills - Inline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap gap-2 sm:gap-3 mt-6 sm:mt-8"
          >
            {[
              { icon: Shield, label: "HIPAA Compliant" },
              { icon: Sparkles, label: "AI-Powered" },
              { icon: Heart, label: "24/7 Care" },
            ].map((feature, i) => (
              <div
                key={feature.label}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full glass-card"
              >
                <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs font-medium text-foreground whitespace-nowrap">{feature.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Floating elements for depth */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(175, 55%, 45%, 0.2), transparent)" }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
