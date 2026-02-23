import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GlassModal } from "@/components/GlassModal";
import { useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type InstallStep = "intro" | "platform" | "ios";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWA_INSTALL_DISMISSED_KEY = "vitalia_pwa_install_dismissed_v1";

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneMatch = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const isIOSStandalone = (window.navigator as any)?.standalone === true;
  return isStandaloneMatch || isIOSStandalone;
}

function getIsIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function getRoleFromUserMetadata(user: any): "patient" | "doctor" | null {
  const role = user?.user_metadata?.role;
  return role === "patient" || role === "doctor" ? role : null;
}

function RequireRole({ role, children }: { role: "patient" | "doctor"; children: ReactNode }) {
  const { loading, isDemo, session, profile, user } = useAuth();

  if (isDemo) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-6 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/" replace />;
  }

  const resolvedRole = (profile?.role === "patient" || profile?.role === "doctor")
    ? profile.role
    : getRoleFromUserMetadata(user);

  if (resolvedRole && resolvedRole !== role) {
    return <Navigate to={resolvedRole === "doctor" ? "/doctor" : "/patient"} replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installStep, setInstallStep] = useState<InstallStep>("intro");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [androidPromptUnavailable, setAndroidPromptUnavailable] = useState(false);

  const isStandalone = useMemo(() => getIsStandalone(), []);
  const isIOS = useMemo(() => getIsIOS(), []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Prevent mini-infobar and let us trigger it from a user gesture.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      try {
        localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "installed");
      } catch {
        // ignore
      }
      setInstallModalOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isStandalone) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "dismissed";
    } catch {
      dismissed = false;
    }

    if (dismissed) return;

    const timer = window.setTimeout(() => {
      setInstallStep("intro");
      setAndroidPromptUnavailable(false);
      setInstallModalOpen(true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isStandalone]);

  const closeInstallModal = () => {
    try {
      localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "dismissed");
    } catch {
      // ignore
    }
    setInstallModalOpen(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      setAndroidPromptUnavailable(true);
      return;
    }

    setAndroidPromptUnavailable(false);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallModalOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <GlassModal isOpen={installModalOpen} onClose={closeInstallModal}>
          {installStep === "intro" && (
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Install Vitalia</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Download the app for faster access and a full-screen experience.
              </p>
              <button
                onClick={() => setInstallStep("platform")}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
              >
                Install PWA
              </button>
              <button
                onClick={closeInstallModal}
                className="btn-glass w-full mt-3 flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-3"
              >
                Not now
              </button>
            </div>
          )}

          {installStep === "platform" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center">Choose your device</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center">
                Android can show an install popup. iPhone uses “Add to Home Screen”.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleAndroidInstall}
                  className="btn-primary w-full flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-3"
                >
                  Download for Android
                </button>
                {androidPromptUnavailable && (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    Install popup not available yet. On Android Chrome, open the browser menu and tap “Install app”.
                  </p>
                )}

                <button
                  onClick={() => setInstallStep("ios")}
                  className="btn-glass w-full flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-3"
                >
                  Download for iPhone
                </button>
              </div>

              <button
                onClick={() => setInstallStep("intro")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-5 w-full"
              >
                Back
              </button>
            </div>
          )}

          {installStep === "ios" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center">Install on iPhone</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-5 text-center">
                iPhone doesn’t allow one-tap installation. Follow these steps in Safari.
              </p>
              <div className="glass-card p-4 sm:p-5">
                <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-foreground">
                  <li>Open this site in Safari.</li>
                  <li>Tap the Share button.</li>
                  <li>Select “Add to Home Screen”.</li>
                  <li>Tap “Add”.</li>
                </ol>
                {!isIOS && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                    If you’re not on an iPhone right now, you can still follow these steps later.
                  </p>
                )}
              </div>
              <button
                onClick={() => setInstallStep("platform")}
                className="btn-primary w-full mt-4 flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-3"
              >
                Back to device choice
              </button>
            </div>
          )}
        </GlassModal>

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/patient"
              element={(
                <RequireRole role="patient">
                  <PatientDashboard />
                </RequireRole>
              )}
            />
            <Route
              path="/doctor"
              element={(
                <RequireRole role="doctor">
                  <DoctorDashboard />
                </RequireRole>
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
