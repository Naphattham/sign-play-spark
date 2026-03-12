import { useState, useEffect, useCallback } from "react";
import { GameSidebar } from "@/components/GameSidebar";
import { VideoCard } from "@/components/VideoCard";
import { WebcamView } from "@/components/WebcamView";
import { LeaderboardView } from "@/components/LeaderboardView";
import { AuthModal } from "@/components/AuthModal";
import { ProfileEdit } from "@/components/ProfileEdit";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { HomePage } from "@/components/HomePage";
import { Category, Phrase, getPhrasesByCategory } from "@/lib/categories";
import { LogOut, X, Camera, Home, User } from "lucide-react";
import { useDistanceDetection, DistanceStatus } from "@/hooks/useDistanceDetection";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { signOutUser, updateStreakOnLogin, getUserData } from "@/lib/auth";
import generalImg from "@/asset/image/general.png";
import emotionalImg from "@/asset/image/emotional.png";
import qaImg from "@/asset/image/qa.png";
import illnessImg from "@/asset/image/illness.png";
import trophyImg from "@/asset/image/Trophy.png";
import guideHumanImg from "@/asset/image/guide_human.png";

type View = "home" | "game" | "leaderboard" | "profile" | "playing";

const categoryIconMap: Record<string, string> = {
  general: generalImg,
  emotions: emotionalImg,
  qa: qaImg,
  illness: illnessImg,
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false);
  // Only show loading on first visit, not on navigation back
  const [showInitialLoading, setShowInitialLoading] = useState(() => {
    const hasLoaded = sessionStorage.getItem('hasInitialLoaded');
    return !hasLoaded;
  });
  const [category, setCategory] = useState<Category>("general");
  const [activePhrase, setActivePhrase] = useState<Phrase>(getPhrasesByCategory("general")[0]);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set(["g1", "g2", "e1"]));
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [isPhraseCompleted, setIsPhraseCompleted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<"adult" | "friend">("adult");
  const [tutorialStep, setTutorialStep] = useState<"initial" | "scanning" | "too_close" | "success">("initial");
  const [webcamVideo, setWebcamVideo] = useState<HTMLVideoElement | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Real distance detection using MediaPipe Face Detection
  const distanceStatus = useDistanceDetection({
    enabled: isDetecting,
    videoElement: webcamVideo,
    tooCloseThreshold: 0.45,
    onStatusChange: useCallback((status: DistanceStatus) => {
      if (!isDetecting) return;

      if (status === "too_close") {
        setTutorialStep("too_close");
      } else if (status === "good") {
        setTutorialStep("success");
        // After 1.5s of success, go live
        setTimeout(() => {
          setIsLive(true);
          setTutorialStep("initial");
          setIsDetecting(false);
        }, 1500);
      } else {
        // no_face — keep scanning
        setTutorialStep("scanning");
      }
    }, [isDetecting]),
  });

  // Ensure loading animation plays completely (minimum 3.5 seconds) only on first visit
  useEffect(() => {
    if (showInitialLoading) {
      const timer = setTimeout(() => {
        setShowInitialLoading(false);
        sessionStorage.setItem('hasInitialLoaded', 'true');
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [showInitialLoading]);

  // Monitor authentication state
  useEffect(() => {
    // Set timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      if (isCheckingAuth) {
        console.warn("Auth check timeout, setting isCheckingAuth to false");
        setIsCheckingAuth(false);
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout); // Clear timeout when auth state is received

      const wasAuthenticated = isAuthenticated;
      const nowAuthenticated = !!user;

      // Update streak when user logs in
      if (nowAuthenticated && user) {
        try {
          const streakResult = await updateStreakOnLogin(user.uid);
          if (streakResult.streak !== undefined) {
            setUserStreak(streakResult.streak);
          }
        } catch (error) {
          console.error("Error updating streak:", error);
        }
      }

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

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [isAuthenticated, isCheckingAuth, cameraPermissionGranted]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setActivePhrase(getPhrasesByCategory(cat)[0]);
    setSelectedVariant("adult"); // Reset variant when changing category
    setView("game");
    setSidebarOpen(false);
    // Save last accessed category
    localStorage.setItem('lastCategory', cat);
  };

  const handlePhraseSelect = (phrase: Phrase) => {
    setActivePhrase(phrase);
    setGameOpen(true);
    setSelectedVariant("adult"); // Reset variant when changing phrase
    // Save last accessed category and phrase
    localStorage.setItem('lastCategory', phrase.category);
    localStorage.setItem('lastPhraseId', phrase.id);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          frameRate: { ideal: 30 }
        }
      });
      // Stop the stream immediately, we just want permission
      stream.getTracks().forEach(track => track.stop());
      setCameraPermissionGranted(true);
      setShowCameraPermission(false);
      setTutorialStep("initial");
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermissionGranted(false);
      setShowCameraPermission(false);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์");
    }
  };

  const handleCollectPoints = () => {
    if (!isPhraseCompleted) return;

    // Collect points logic here
    console.log("Points collected!");

    // Add to completed phrases
    setCompletedPhrases(prev => new Set([...prev, activePhrase.id]));

    // Move to next phrase or close modal
    const phrases = getPhrasesByCategory(category);
    const currentIndex = phrases.findIndex(p => p.id === activePhrase.id);
    if (currentIndex < phrases.length - 1) {
      setActivePhrase(phrases[currentIndex + 1]);
      setSelectedVariant("adult"); // Reset variant when moving to next phrase
      setIsPhraseCompleted(false); // Reset for next phrase
    } else {
      // Close modal
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
    return <LandingPage onLoginSuccess={() => { }} />;
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
            {view === "home" && (
              <>
                <Home size={20} className="text-foreground" />
                <h2 className="font-display text-xl text-foreground">Home</h2>
              </>
            )}
            {view === "leaderboard" && (
              <>
                <img src={trophyImg} alt="Leaderboard" className="w-5 h-5 object-contain" />
                <h2 className="font-display text-xl text-foreground">Leaderboard</h2>
              </>
            )}
            {view === "profile" && (
              <>
                <User size={20} className="text-foreground" />
                <h2 className="font-display text-xl text-foreground">Profile</h2>
              </>
            )}
            {view === "game" && (
              <>
                <img src={categoryIconMap[category]} alt={category} className="w-5 h-5 object-contain" />
                <h2 className="font-display text-xl text-foreground">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="brutal-btn-secondary flex items-center gap-2 text-sm font-body">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="h-[calc(100vh-4.5rem)] flex flex-col">
          {view === "home" && (
            <div className="p-4 lg:p-6 h-full">
              <HomePage
                onCategorySelect={(cat) => {
                  setCategory(cat);
                  setActivePhrase(getPhrasesByCategory(cat)[0]);
                  setSelectedVariant("adult"); // Reset variant when selecting category
                  setView("game");
                  localStorage.setItem('lastCategory', cat);
                }}
                onResumeLesson={() => {
                  // Resume to last accessed phrase
                  const lastPhraseId = localStorage.getItem('lastPhraseId');
                  const lastCat = (localStorage.getItem('lastCategory') as Category) || 'general';
                  const phrases = getPhrasesByCategory(lastCat);
                  const lastPhrase = phrases.find(p => p.id === lastPhraseId) || phrases[0];

                  setCategory(lastCat);
                  setActivePhrase(lastPhrase);
                  setSelectedVariant("adult"); // Reset variant when resuming
                  setView("game");
                  setGameOpen(true); // เปิด modal
                }}
                onLeaderboard={() => setView("leaderboard")}
                completedPhrases={completedPhrases}
                streak={userStreak}
              />
            </div>
          )}
          {view === "leaderboard" && (
            <div className="p-4 lg:p-6 h-full">
              <LeaderboardView />
            </div>
          )}
          {view === "profile" && (
            <div className="p-4 lg:p-6 h-full">
              <ProfileEdit onBack={() => setView("home")} />
            </div>
          )}
          {view === "game" && (
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 relative pb-32">
              {/* Content Header */}
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-4xl font-black mb-2">Phrases</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                    UNIT {category === "general" ? "1" : category === "emotions" ? "2" : category === "qa" ? "3" : "4"}: {category.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Phrase Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {getPhrasesByCategory(category).map((phrase) => (
                  <div
                    key={phrase.id}
                    onClick={() => handlePhraseSelect(phrase)}
                    className="relative bg-white brutal-card flex items-center p-4 pr-12 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="absolute -top-3 -right-3 bg-[#f94fa4] text-white font-black text-sm px-3 py-1 rounded-full border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                      +10 pts
                    </div>
                    <div className="w-16 h-16 bg-accent/20 brutal-card flex items-center justify-center text-3xl mr-6 shrink-0">
                      {phrase.emoji || "✋"}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl mb-1">{phrase.text}</h3>
                      <p className="text-gray-500 font-bold text-sm">{phrase.english || phrase.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Playing Game Modal */}
        {gameOpen && (
          <>
            {/* Backdrop with blur */}
            <div
              className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm animate-backdrop-in"
              onClick={() => {
                setGameOpen(false);
                setIsLive(false);
                setIsDetecting(false);
                setTutorialStep("initial");
              }}
            />

            {/* Modal content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-slate-900 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-w-7xl w-full h-[90vh] pointer-events-auto animate-modal-in">
                {/* Header Section */}
                <header className="flex items-center justify-end p-4 lg:p-6 border-b-[3px] border-foreground bg-yellow-400">

                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="hidden md:flex items-center px-3 lg:px-4 py-1.5 lg:py-2 bg-pink-400 border-[3px] border-foreground rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-white font-black text-xs lg:text-sm">
                        UNIT {category === "general" ? "1" : category === "emotions" ? "2" : category === "qa" ? "3" : "4"}: {category.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setGameOpen(false);
                        setIsLive(false);
                        setIsDetecting(false);
                        setTutorialStep("initial");
                      }}
                      className="flex items-center justify-center w-10 h-10 bg-white border-[3px] border-foreground rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-transform"
                    >
                      <X size={20} className="text-slate-900" />
                    </button>
                  </div>
                </header>

                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Main Workspace Area */}
                  <main className="flex-1 p-3 lg:p-4 xl:p-6 bg-[#f8f6f6] dark:bg-[#221610] overflow-y-auto flex flex-col justify-between">
                    {/* Current Word Display (Center) */}
                    <div className="flex items-center justify-center pb-2">
                      <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {activePhrase?.id === "g1"
                          ? (selectedVariant === "adult" ? "สวัสดีผู้ใหญ่" : "สวัสดีเพื่อน")
                          : activePhrase?.id === "g4"
                            ? (selectedVariant === "adult" ? "กินแล้ว" : "ยังไม่ได้กิน")
                            : (activePhrase?.text ?? "Hello")
                        }
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 items-start max-w-3xl mx-auto">
                      {/* Tutorial Video Section */}
                      <div className="flex flex-col gap-1.5 lg:gap-2">
                        <div className="relative aspect-square w-full max-w-md mx-auto bg-slate-200 dark:bg-slate-700 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <VideoCard phrase={activePhrase?.text ?? "Hello"} category={activePhrase?.category ?? "general"} variant={(activePhrase?.id === "g1" || activePhrase?.id === "g4") ? selectedVariant : undefined} />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/90 px-2 py-1 border-[3px] border-foreground rounded-full font-black text-xs absolute top-3 left-3">
                              TUTORIAL
                            </div>
                          </div>
                        </div>

                        {/* Video Controls - Show for "สวัสดี" phrase (g1) and "กินข้าวหรือยัง" phrase (g4) */}
                        {activePhrase?.id === "g1" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-md mx-auto w-full">
                            <button
                              onClick={() => setSelectedVariant("adult")}
                              className={`flex-1 h-10 lg:h-12 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                  ? "bg-yellow-400 text-slate-900"
                                  : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สวัสดีผู้ใหญ่
                            </button>
                            <button
                              onClick={() => setSelectedVariant("friend")}
                              className={`flex-1 h-10 lg:h-12 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                  ? "bg-yellow-400 text-slate-900"
                                  : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สวัสดีเพื่อน
                            </button>
                          </div>
                        )}
                        {activePhrase?.id === "g4" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-md mx-auto w-full">
                            <button
                              onClick={() => setSelectedVariant("adult")}
                              className={`flex-1 h-10 lg:h-12 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                  ? "bg-yellow-400 text-slate-900"
                                  : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              กินแล้ว
                            </button>
                            <button
                              onClick={() => setSelectedVariant("friend")}
                              className={`flex-1 h-10 lg:h-12 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                  ? "bg-yellow-400 text-slate-900"
                                  : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              ยังไม่ได้กิน
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Live Cam Section */}
                      <div className="flex flex-col gap-1.5 lg:gap-2">
                        <div className="relative aspect-square w-full max-w-md mx-auto bg-slate-200 dark:bg-slate-700 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <WebcamView onNextLevel={() => setIsPhraseCompleted(true)} cameraEnabled={cameraPermissionGranted} onVideoReady={(video) => setWebcamVideo(video)} />

                          {/* Tracking Overlays */}
                          {(tutorialStep === "scanning" || tutorialStep === "too_close") && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20 transition-all">
                              <img src={guideHumanImg} alt="Guide" className="w-full h-full object-cover opacity-80" />
                              <div className={`absolute bottom-6 bg-white/95 border-[3px] border-foreground rounded-full px-4 py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${tutorialStep === "too_close" ? "text-red-500 animate-pulse border-red-500 scale-105 transition-transform" : "animate-bounce"}`}>
                                {tutorialStep === "too_close" ? "ขยับถอยห่างไปอีกหน่อย" : "ถอยหลังออกไปให้มีระยะห่างจากกล้อง"}
                              </div>
                            </div>
                          )}

                          {tutorialStep === "success" && (
                            <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center backdrop-blur-sm z-30 animate-in fade-in zoom-in duration-300">
                              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-[4px] border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-4xl flex items-center justify-center w-full h-full pt-1">✓</span>
                              </div>
                              <h3 className="text-white font-black text-2xl drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Success!</h3>
                              <p className="text-white font-bold drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] mt-2">คุณอยู่ในตำแหน่งที่เหมาะสมแล้ว</p>
                            </div>
                          )}

                          {/* Recognition Overlay */}
                          <div className="absolute inset-0 border-4 border-dashed border-[#ec5b13]/50 m-3 rounded-lg pointer-events-none"></div>

                          {/* Points Badge */}
                          <div className="absolute top-3 right-3 animate-bounce z-10">
                            <div className="bg-pink-500 text-white border-[3px] border-foreground rounded-xl px-2 lg:px-3 py-1 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 text-xs">
                              + {activePhrase?.id === "g1" || activePhrase?.id === "g4" ? "5" : "10"} PTS
                            </div>
                          </div>

                          {/* Live Indicator Badge */}
                          <div className="absolute bottom-3 left-3 z-10">
                            <div className={`px-2 py-1 border-[3px] border-foreground rounded-full font-black text-xs flex items-center gap-1.5 ${isLive
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-gray-400 text-white'
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-white/50'
                                }`}></span>
                              LIVE
                            </div>
                          </div>
                        </div>

                        {/* Control Button */}
                        <button
                          onClick={() => {
                            if (!cameraPermissionGranted) {
                              setShowCameraPermission(true);
                            } else if (!isDetecting && !isLive) {
                              // Start real distance detection
                              setTutorialStep("scanning");
                              setIsDetecting(true);
                            } else {
                              setIsLive(false);
                              setIsDetecting(false);
                              setTutorialStep("initial");
                            }
                          }}
                          className={`w-full max-w-md mx-auto h-10 lg:h-12 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-sm ${!cameraPermissionGranted
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : (isDetecting || isLive)
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                        >
                          {!cameraPermissionGranted ? '📹 อนุญาตการเข้าถึงกล้อง' : (isDetecting || isLive) ? 'STOP' : 'START'}
                        </button>
                      </div>
                    </div>

                    {/* Bottom Footer Controls */}
                    <footer className="mt-3 flex items-center justify-between border-t-[3px] border-slate-200 dark:border-slate-800 pt-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Progress</span>
                        <div className="w-36 h-4 bg-slate-200 border-[3px] border-foreground rounded-full overflow-hidden">
                          <div className="w-[65%] h-full bg-pink-400 border-r-[3px] border-foreground transition-all duration-500"></div>
                        </div>
                      </div>
                      <button
                        onClick={handleCollectPoints}
                        disabled={!isPhraseCompleted}
                        className={`group flex items-center justify-center gap-2 border-[3px] border-foreground rounded-xl px-6 py-2.5 font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-tight ${isPhraseCompleted
                            ? 'bg-[#ec5b13] hover:bg-[#ec5b13]/90 text-white hover:translate-x-1 hover:-translate-y-1 cursor-pointer'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                          }`}
                      >
                        {isPhraseCompleted ? '✓' : '🔒'} COLLECT POINTS
                        {isPhraseCompleted && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                      </button>
                    </footer>
                  </main>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Camera Permission Modal */}
      {showCameraPermission && (
        <>
          <div
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
            onClick={() => { }} // Prevent closing by clicking backdrop
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
    </div>
  );
};

export default Index;
