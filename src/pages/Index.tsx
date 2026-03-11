import { useState, useEffect } from "react";
import { GameSidebar } from "@/components/GameSidebar";
import { VideoCard } from "@/components/VideoCard";
import { WebcamView } from "@/components/WebcamView";
import { PhraseSelector } from "@/components/PhraseSelector";
import { LeaderboardView } from "@/components/LeaderboardView";
import { AuthModal } from "@/components/AuthModal";
import { ProfileEdit } from "@/components/ProfileEdit";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { HomePage } from "@/components/HomePage";
import { Category, Phrase, getPhrasesByCategory } from "@/lib/categories";
import { LogOut, X, Camera } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { signOutUser } from "@/lib/auth";

type View = "home" | "game" | "leaderboard" | "profile";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [category, setCategory] = useState<Category>("general");
  const [activePhrase, setActivePhrase] = useState<Phrase>(getPhrasesByCategory("general")[0]);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set(["g1", "g2", "e1"]));
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ensure loading animation plays completely (minimum 3.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const wasAuthenticated = isAuthenticated;
      const nowAuthenticated = !!user;
      
      // Show loading animation when auth state changes (login/logout)
      if (wasAuthenticated !== nowAuthenticated && !isCheckingAuth) {
        setIsAuthTransitioning(true);
        setTimeout(() => {
          setIsAuthenticated(nowAuthenticated);
          setIsAuthTransitioning(false);
          
          // Show camera permission modal after login
          if (nowAuthenticated && !cameraPermissionGranted) {
            setShowCameraPermission(true);
          }
        }, 3500); // Show loading for 3.5 seconds
      } else {
        setIsAuthenticated(nowAuthenticated);
        setIsCheckingAuth(false);
        
        // Show camera permission modal after login
        if (nowAuthenticated && !cameraPermissionGranted) {
          setShowCameraPermission(true);
        }
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, isCheckingAuth, cameraPermissionGranted]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setActivePhrase(getPhrasesByCategory(cat)[0]);
    setView("game");
    setSidebarOpen(false);
  };

  const handlePhraseSelect = (phrase: Phrase) => {
    setActivePhrase(phrase);
    setGameOpen(true);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just want permission
      stream.getTracks().forEach(track => track.stop());
      setCameraPermissionGranted(true);
      setShowCameraPermission(false);
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermissionGranted(false);
      setShowCameraPermission(false);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์");
    }
  };

  const handleNextLevel = () => {
    const phrases = getPhrasesByCategory(category);
    const currentIndex = phrases.findIndex(p => p.id === activePhrase.id);
    if (currentIndex < phrases.length - 1) {
      setActivePhrase(phrases[currentIndex + 1]);
    } else {
      // Move to next category or show completion message
      setGameOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await signOutUser();
      // Wait for visual feedback (3.5 seconds to match loading animation)
      await new Promise(resolve => setTimeout(resolve, 3500));
      setView("home");
      setSidebarOpen(false);
      setGameOpen(false);
      setCameraPermissionGranted(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading while initial loading or checking auth state or transitioning
  if (showInitialLoading || isCheckingAuth) {
    return <LoadingScreen message="กำลังตรวจสอบ..." />;
  }

  if (isAuthTransitioning) {
    return <LoadingScreen message={isAuthenticated ? "กำลังออกจากระบบ..." : "กำลังเข้าสู่ระบบ..."} />;
  }

  if (isLoggingOut) {
    return <LoadingScreen message="กำลังออกจากระบบ..." />;
  }

  // Show Landing Page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex w-full">
      <GameSidebar
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
        onLeaderboard={() => { setView("leaderboard"); setSidebarOpen(false); }}
        onProfile={() => { setView("profile"); setSidebarOpen(false); }}
        onHome={() => { setView("home"); setSidebarOpen(false); }}
        showLeaderboard={view === "leaderboard"}
        showHome={view === "home"}
        showProfile={view === "profile"}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-h-screen">
        {/* Top bar */}
        <header className="border-b-[3px] border-foreground bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <h2 className="font-display text-xl text-foreground">
              {view === "home" ? "🏠 Home" : view === "leaderboard" ? "🏆 Leaderboard" : view === "profile" ? "👤 Profile" : `📚 ${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </h2>
          </div>
          <button onClick={handleLogout} className="brutal-btn-secondary flex items-center gap-2 text-sm font-body">
            <LogOut size={16} />
            Logout
          </button>
        </header>

        <div className="p-4 lg:p-6 h-[calc(100vh-4.5rem)]">
          {view === "home" && (
            <HomePage 
              onCategorySelect={(cat) => {
                setCategory(cat);
                setActivePhrase(getPhrasesByCategory(cat)[0]);
                setView("game");
              }}
              onLeaderboard={() => setView("leaderboard")}
            />
          )}
          {view === "leaderboard" && <LeaderboardView />}
          {view === "profile" && <ProfileEdit onBack={() => setView("home")} />}
          {view === "game" && (
            <div className="h-full">
              {/* Phrase selector */}
              <PhraseSelector
                category={category}
                activePhrase={activePhrase}
                onSelect={handlePhraseSelect}
                completedPhrases={completedPhrases}
              />
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Camera Permission Modal */}
      {showCameraPermission && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
            onClick={() => {}} // Prevent closing by clicking backdrop
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="brutal-card-lg max-w-md w-full bg-background">
              <div className="border-b-[3px] border-foreground bg-secondary px-6 py-4">
                <h2 className="font-display text-xl text-secondary-foreground text-center">
                  📹 อนุญาตการเข้าถึงกล้อง
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-[3px] border-foreground">
                    <Camera size={48} className="text-accent" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-body text-foreground font-bold text-lg">
                    SignMate ต้องการใช้กล้องของคุณ
                  </p>
                  <p className="font-body text-muted-foreground text-sm">
                    เราใช้กล้องเพื่อตรวจจับท่าทางภาษามือของคุณแบบเรียลไทม์ 
                    ข้อมูลวิดีโอจะไม่ถูกบันทึกหรือส่งออกไปจากอุปกรณ์ของคุณ
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={requestCameraPermission}
                    className="w-full brutal-btn-primary font-bold"
                  >
                    อนุญาตการเข้าถึงกล้อง
                  </button>
                  <button
                    onClick={() => {
                      setShowCameraPermission(false);
                      setCameraPermissionGranted(false);
                    }}
                    className="w-full brutal-btn-secondary text-sm"
                  >
                    ข้าม (เล่นโดยไม่มีกล้อง)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating game modal */}
      {gameOpen && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setGameOpen(false)}
          />
          
          {/* Modal content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="brutal-card-lg max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto">
              {/* Modal header */}
              <div className="border-b-[3px] border-foreground bg-secondary px-6 py-3 flex items-center justify-between">
                <h2 className="font-display text-xl text-secondary-foreground">
                  🎯 {activePhrase?.text ?? "Hello"}
                </h2>
                <button
                  onClick={() => setGameOpen(false)}
                  className="brutal-btn-primary p-2"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Game content */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4 lg:p-6 overflow-auto bg-background">
                <VideoCard phrase={activePhrase?.text ?? "Hello"} />
                <WebcamView onNextLevel={handleNextLevel} cameraEnabled={cameraPermissionGranted} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
