import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameSidebar } from "@/components/GameSidebar";
import { LeaderboardView } from "@/components/LeaderboardView";
import { AuthModal } from "@/components/AuthModal";
import { ProfileEdit } from "@/components/ProfileEdit";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PredictionOverlay } from "@/components/PredictionOverlay";
import { HomePage } from "@/components/HomePage";
import { LessonsPage } from "@/components/LessonsPage";
import { QuestView } from "@/components/QuestView";
import { GameSetupPage } from "@/components/GameSetupPage";
import { CameraPermission } from "@/components/CameraPermission";
import { TutorialModal } from "@/components/TutorialModal";
import { MainHeader } from "@/components/MainHeader";
import { GameView } from "@/components/GameView";
import { Category, Phrase, getPhrasesByCategory, resolveTargetClass } from "@/lib/categories";
import { View } from "@/lib/gameConstants";
import { useAuthState } from "@/hooks/useAuthState";
import { useCameraState } from "@/hooks/useCameraState";
import { useGameState } from "@/hooks/useGameState";
import { useSignAndDistance } from "@/hooks/useSignAndDistance";
import { auth } from "@/lib/firebase";
import { saveUnlockedHint } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [category, setCategory] = useState<Category>("general");
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<View>(((location.state as any)?.view as View) || "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ((location.state as any)?.view) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  // ── Auth State ─────────────────────────────────────────
  const authState = useAuthState(
    () => {
      camera.setShowCameraPermission(true);
    },
    () => {
      camera.setShowHowToPlay(true);
    }
  );

  // ── Camera State ───────────────────────────────────────
  const camera = useCameraState();

  // ── Game State ─────────────────────────────────────────
  const game = useGameState({
    category,
    completedPhrases: authState.completedPhrases,
    setCompletedPhrases: authState.setCompletedPhrases,
  });

  // Sync auth-loaded data into game state
  useEffect(() => {
    game.setCollectedPhrases(authState.collectedPhrases);
  }, [authState.collectedPhrases]);

  useEffect(() => {
    game.setPhrasePoints(authState.phrasePoints);
  }, [authState.phrasePoints]);

  // ── Phrase Navigation ──────────────────────────────────
  const currentCategoryPhrases = getPhrasesByCategory(category);
  const currentPhraseIndex = currentCategoryPhrases.findIndex(p => p.id === game.activePhrase?.id);
  const isFirstPhrase = currentPhraseIndex <= 0;
  const isLastPhrase = currentPhraseIndex >= currentCategoryPhrases.length - 1;

  // ── Sign Recognition ───────────────────────────────────
  const signRecognition = useSignAndDistance({
    videoElement: camera.webcamVideo,
    canvasElement: camera.webcamCanvas,
    enabled: camera.cameraPermissionGranted && game.gameOpen && !camera.isTransitioning,
    predictEnabled: camera.isLive || camera.isDetecting,
    targetPhrase: (camera.isLive || camera.isDetecting) && !game.isPhraseCompleted ? game.effectivePhrase : undefined,
    userId: auth.currentUser?.uid,
    logTargetWord: game.effectivePhrase ? resolveTargetClass(game.effectivePhrase, game.selectedVariant) : undefined,
    tooCloseThreshold: 0.15,
    distanceThreshold: 0.05,
    variant: (game.activePhrase?.id === "g1" || game.activePhrase?.id === "g4" || game.activePhrase?.id === "g6") ? game.selectedVariant : undefined,
    onPhraseMatch: (prediction, confidence) => {
      if (!camera.isLive && !camera.isDetecting) return;
      if (game.isPhraseCompleted) return;
      game.setBestConfidence(prev => Math.max(prev, confidence));
      if (game.activePhrase?.id === "g2") {
        if (game.byeStep === 1 && prediction === "bye_me" && confidence >= 0.5) {
          game.setByeStep(2);
        } else if (game.byeStep === 2 && prediction === "bye_go" && confidence >= 0.5) {
          game.handlePhraseCompletion(confidence);
        }
      } else if (game.activePhrase?.id === "g3") {
        if (game.eatStep === 1 && prediction === "rice" && confidence >= 0.5) {
          game.setEatStep(2);
        } else if (game.eatStep === 2 && prediction === "eat" && confidence >= 0.5) {
          game.setEatStep(3);
        } else if (game.eatStep === 3 && prediction === "yet" && confidence >= 0.5) {
          game.handlePhraseCompletion(confidence);
        }
      } else if (game.activePhrase?.id === "g4") {
        if (game.selectedVariant === "adult") {
          if (game.eatStep === 1 && prediction === "eat" && confidence >= 0.5) {
            game.setEatStep(2);
          } else if (game.eatStep === 2 && prediction === "already" && confidence >= 0.5) {
            game.handlePhraseCompletion(confidence);
          }
        } else {
          if (game.eatStep === 1 && prediction === "eat" && confidence >= 0.5) {
            game.setEatStep(2);
          } else if (game.eatStep === 2 && prediction === "yet" && confidence >= 0.5) {
            game.handlePhraseCompletion(confidence);
          }
        }
      } else {
        game.handlePhraseCompletion(confidence);
      }
    },
    onPrediction: (prediction) => {
      if ((camera.isLive || camera.isDetecting) && signRecognition.isMatched) {
        game.setBestConfidence(prev => Math.max(prev, prediction.confidence));
      }
    },
  });

  // Clear buffer when game opens
  useEffect(() => {
    if (game.gameOpen) {
      signRecognition.clearBuffer();
    }
  }, [game.gameOpen, signRecognition.clearBuffer]);

  // Tutorial step logic based on distance
  useEffect(() => {
    if (!camera.isDetecting) return;
    if (camera.goodPositionTimerRef.current || camera.successTimerRef.current) return;

    if (signRecognition.distanceStatus === "too_close") {
      camera.setTutorialStep("too_close");
    } else if (signRecognition.distanceStatus === "good") {
      if (camera.scanningLocked) {
        camera.setTutorialStep("scanning");
      } else {
        camera.setTutorialStep("scanning");

        camera.goodPositionTimerRef.current = setTimeout(() => {
          camera.setTutorialStep("success");

          camera.successTimerRef.current = setTimeout(() => {
            camera.setIsLive(true);
            camera.setTutorialStep("initial");
            camera.setIsDetecting(false);

            camera.successTimerRef.current = null;
            camera.goodPositionTimerRef.current = null;
          }, 2500);
        }, 1000);
      }
    } else {
      camera.setTutorialStep("scanning");
    }
  }, [camera.isDetecting, signRecognition.distanceStatus, camera.scanningLocked]);

  // ── Handlers ───────────────────────────────────────────
  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    game.setActivePhrase(getPhrasesByCategory(cat)[0]);
    game.setSelectedVariant("adult");
    setView("game");
    setSidebarOpen(false);
    localStorage.setItem('lastCategory', cat);
  };

  const handleConfirmHint = async () => {
    game.setShowHintContent(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const hintKey = game.getCurrentHintKey();
      await saveUnlockedHint(user.uid, hintKey);
      authState.setHintUnlocked(prev => new Set([...prev, hintKey]));
    } catch (error) {
      console.error("Error using hint:", error);
      toast({
        title: "Error",
        description: "เกิดข้อผิดพลาดในการใช้ Hint",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    authState.handleLogout({
      onBeforeLogout: () => {
        camera.setIsLive(false);
        camera.setIsDetecting(false);
        game.setBestConfidence(0);
        game.setButtonState("start");
        game.setIsPhraseCompleted(false);
      },
      onAfterLogout: () => {
        setView("home");
        setSidebarOpen(false);
        game.setGameOpen(false);
        camera.setCameraPermissionGranted(false);
        setCategory("general");
        game.setActivePhrase(getPhrasesByCategory("general")[0]);
      },
    });
  };

  const handlePrevPhrase = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isFirstPhrase) {
      game.handlePhraseSelect(currentCategoryPhrases[currentPhraseIndex - 1]);
      game.resetPhraseState(camera.sessionStartedRef, camera.setIsTransitioning);
    }
  };

  const handleNextPhrase = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLastPhrase) {
      game.handlePhraseSelect(currentCategoryPhrases[currentPhraseIndex + 1]);
      game.resetPhraseState(camera.sessionStartedRef, camera.setIsTransitioning);
    }
  };

  // ── Early Returns (Loading / Landing) ──────────────────
  if (authState.showInitialLoading || authState.isCheckingAuth) {
    return <LoadingScreen message="กำลังตรวจสอบ..." />;
  }

  if (authState.isAuthTransitioning) {
    return <LoadingScreen message={authState.isAuthenticated ? "กำลังออกจากระบบ..." : "กำลังเข้าสู่ระบบ..."} />;
  }

  if (authState.isLoggingOut) {
    return <LoadingScreen message="กำลังออกจากระบบ..." />;
  }

  if (!authState.isAuthenticated) {
    return <LandingPage onLoginSuccess={() => { }} />;
  }

  // ── Main Render ────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex w-full">
      <GameSidebar
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
        onPlayGame={() => { setView("gamesetup"); setSidebarOpen(false); }}
        onLessons={() => { setView("lessons"); setSidebarOpen(false); }}
        onQuest={() => { setView("quest"); setSidebarOpen(false); }}
        onLeaderboard={() => { setView("leaderboard"); setSidebarOpen(false); }}
        onProfile={() => { setView("profile"); setSidebarOpen(false); }}
        onHome={() => { setView("home"); setSidebarOpen(false); }}
        showPlayGame={view === "gamesetup"}
        showLessons={view === "lessons" || view === "game"}
        showQuest={view === "quest"}
        showLeaderboard={view === "leaderboard"}
        showHome={view === "home"}
        showProfile={view === "profile"}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-h-[100dvh] overflow-x-hidden">
        <MainHeader
          view={view}
          category={category}
          onMenuOpen={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <div className="h-[calc(100dvh-2.75rem)] sm:h-[calc(100dvh-3.25rem)] md:h-[calc(100dvh-4rem)] flex flex-col overflow-hidden">
          {view === "home" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
              <HomePage
                onCategorySelect={(cat) => {
                  setCategory(cat);
                  game.setActivePhrase(getPhrasesByCategory(cat)[0]);
                  game.setSelectedVariant("adult");
                  setView("game");
                  localStorage.setItem('lastCategory', cat);
                }}
                onResumeLesson={() => {
                  const lastPhraseId = localStorage.getItem('lastPhraseId');
                  const lastCat = (localStorage.getItem('lastCategory') as Category) || 'general';
                  const phrases = getPhrasesByCategory(lastCat);
                  const lastPhrase = phrases.find(p => p.id === lastPhraseId) || phrases[0];

                  setCategory(lastCat);
                  game.setActivePhrase(lastPhrase);
                  game.setSelectedVariant("adult");
                  setView("game");
                  game.setGameOpen(true);
                }}
                onLeaderboard={() => setView("leaderboard")}
                onLessons={() => setView("lessons")}
                completedPhrases={authState.completedPhrases}
                streak={authState.userStreak}
                level={authState.userLevel}
              />
            </div>
          )}
          {view === "lessons" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
              <LessonsPage
                onCategorySelect={(cat) => {
                  setCategory(cat);
                  game.setActivePhrase(getPhrasesByCategory(cat)[0]);
                  game.setSelectedVariant("adult");
                  setView("game");
                  localStorage.setItem('lastCategory', cat);
                }}
                completedPhrases={authState.completedPhrases}
                streak={authState.userStreak}
              />
            </div>
          )}
          {view === "leaderboard" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
              <LeaderboardView />
            </div>
          )}
          {view === "quest" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
              <QuestView streak={authState.userStreak} />
            </div>
          )}
          {view === "gamesetup" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto flex flex-col w-full">
              <GameSetupPage />
            </div>
          )}
          {view === "profile" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
              <ProfileEdit onBack={() => setView("home")} />
            </div>
          )}
          {view === "game" && (
            <GameView
              category={category}
              completedPhrases={authState.completedPhrases}
              onBack={() => setView("lessons")}
              onPhraseSelect={game.handlePhraseSelect}
            />
          )}
        </div>
      </main>

      <PredictionOverlay
        gameOpen={game.gameOpen}
        isClosingModal={game.isClosingModal}
        category={category}
        activePhrase={game.activePhrase}
        currentCategoryPhrases={currentCategoryPhrases}
        completedPhrases={authState.completedPhrases}
        isFirstPhrase={isFirstPhrase}
        isLastPhrase={isLastPhrase}
        onPrevPhrase={handlePrevPhrase}
        onNextPhrase={handleNextPhrase}
        onCloseModal={() => game.handleCloseModal({
          setIsLive: camera.setIsLive,
          setIsDetecting: camera.setIsDetecting,
          setTutorialStep: camera.setTutorialStep,
          setWebcamVideo: camera.setWebcamVideo,
          setWebcamCanvas: camera.setWebcamCanvas,
          sessionStartedRef: camera.sessionStartedRef,
          successTimerRef: camera.successTimerRef,
          goodPositionTimerRef: camera.goodPositionTimerRef,
        })}
        onPhraseSelect={game.handlePhraseSelect}
        onResetPhraseState={() => game.resetPhraseState(camera.sessionStartedRef, camera.setIsTransitioning)}
        onCategoryChange={(cat) => {
          const phrases = getPhrasesByCategory(cat as Category);
          setCategory(cat as Category);
          game.setActivePhrase(phrases[0]);
          game.handlePhraseSelect(phrases[0]);
          game.resetPhraseState(camera.sessionStartedRef, camera.setIsTransitioning);
          localStorage.setItem('lastCategory', cat);
        }}
        selectedVariant={game.selectedVariant}
        byeStep={game.byeStep}
        eatStep={game.eatStep}
        onVariantChange={(variant) => game.handleVariantChange(variant, camera.isLive, camera.isDetecting, camera.setIsTransitioning)}
        isLive={camera.isLive}
        isDetecting={camera.isDetecting}
        tutorialStep={camera.tutorialStep}
        cameraPermissionGranted={camera.cameraPermissionGranted}
        webcamVideo={camera.webcamVideo}
        onShowCameraPermission={() => {
          camera.setSkipCameraCalibration(true);
          camera.setShowCameraPermission(true);
        }}
        onVideoReady={(video) => camera.setWebcamVideo(video)}
        onCanvasReady={(canvas) => camera.setWebcamCanvas(canvas)}
        onSetIsPhraseCompleted={game.setIsPhraseCompleted}
        buttonState={game.buttonState}
        bestConfidence={game.bestConfidence}
        isPhraseCompleted={game.isPhraseCompleted}
        phrasePoints={game.phrasePoints}
        onTryAgain={() => game.handleTryAgain(camera.setIsTransitioning)}
        onCollectPoints={game.handleCollectPoints}
        onStop={() => {
          camera.setIsLive(false);
          camera.setIsDetecting(false);
          camera.setTutorialStep("initial");
          game.setIsPhraseCompleted(false);
          game.setBestConfidence(0);
          game.setButtonState("start");
          game.setByeStep(1);
          game.setEatStep(1);
          game.isCollectingRef.current = false;
          camera.sessionStartedRef.current = false;
          if (camera.successTimerRef.current) {
            clearTimeout(camera.successTimerRef.current);
            camera.successTimerRef.current = null;
          }
        }}
        onStart={() => {
          if (!camera.webcamVideo || camera.webcamVideo.readyState < 2) {
            toast({
              title: "รอสักครู่",
              description: "กำลังเปิดกล้อง กรุณารอสักครู่...",
              variant: "default",
            });
            return;
          }
          camera.sessionStartedRef.current = true;
          camera.setTutorialStep("initial");
          camera.setIsLive(true);
          camera.setIsDetecting(false);
          game.setBestConfidence(0);
          game.setButtonState("stop");
        }}
        signRecognition={signRecognition}
        effectivePhrase={game.effectivePhrase}
        targetDisplayWord={game.targetDisplayWord}
        showHintContent={game.showHintContent}
        onHintClick={handleConfirmHint}
        onSetShowHintContent={game.setShowHintContent}
        getCurrentHintKey={game.getCurrentHintKey}
        getCurrentHintVideos={game.getCurrentHintVideos}
        getCurrentHintText={game.getCurrentHintText}
      />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {camera.showHowToPlay && !camera.showCameraPermission && (
        <TutorialModal onClose={() => camera.setShowHowToPlay(false)} />
      )}

      {camera.showCameraPermission && (
        <CameraPermission
          onAllow={camera.requestCameraPermission}
          skipCalibration={camera.skipCameraCalibration}
          onSkip={() => {
            camera.setShowCameraPermission(false);
            camera.setSkipCameraCalibration(false);
            camera.setCameraPermissionGranted(false);
          }}
        />
      )}
    </div>
  );
};

export default Index;
