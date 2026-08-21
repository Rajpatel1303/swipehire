import React, { useState, useEffect } from "react";
import {
  Compass,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Info,
  Bookmark,
  CheckCircle2,
  MapPin,
  Clock,
  IndianRupee,
  Building2,
  RefreshCw,
  Sliders,
  ChevronRight,
  TrendingUp,
  Send,
  Eye,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { useApp } from "../../context/AppContext";
import { CandidateJobDetailModal } from "./CandidateJobDetailModal";
import { Job } from "../../types";

export const CareerRadarDashboard: React.FC = () => {
  const {
    candidate,
    radarDeck,
    handleSwipe,
    resetSwipes,
    applications,
    swipes,
    setActiveView,
    triggerCelebration,
  } = useApp();

  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "hybrid" | "remote" | "high_match">("all");
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "apply" | "skip" | "saved" } | null>(null);

  // Motion values for drag tilt
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-200, 0, 200], [-12, 0, 12]);
  const dragOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 0.9, 1, 0.9, 0.5]);

  // Filter the current deck based on quick filter chips
  const filteredDeck = radarDeck.filter((job) => {
    if (filterMode === "hybrid") return job.workMode === "Hybrid";
    if (filterMode === "remote") return job.workMode === "Remote";
    if (filterMode === "high_match") return (job.matchScore || 0) >= 90;
    return true;
  });

  const currentJob = filteredDeck[0] || null;

  // Keyboard shortcut listener for swift swiping (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedJobForModal) return; // Don't trigger if modal is open
      if (!currentJob) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSwipeAction("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSwipeAction("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentJob, selectedJobForModal]);

  const onSwipeAction = (direction: "left" | "right") => {
    if (!currentJob) return;

    setSwipeDirection(direction);
    if (direction === "right") {
      triggerCelebration();
      setFeedbackToast({
        message: `Applied to ${currentJob.title} @ ${currentJob.companyName}! Tracking in My Applications.`,
        type: "apply",
      });
    } else {
      setFeedbackToast({
        message: `Skipped ${currentJob.title}. Career Radar updated your target preferences.`,
        type: "skip",
      });
    }

    handleSwipe(currentJob.id, direction);

    // Reset swipe state after transition
    setTimeout(() => {
      setSwipeDirection(null);
    }, 300);

    setTimeout(() => {
      setFeedbackToast(null);
    }, 3000);
  };

  const handleSaveForLater = () => {
    if (!currentJob) return;
    setFeedbackToast({
      message: `Saved ${currentJob.title} to your bookmarks!`,
      type: "saved",
    });
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  // Top highlight job for the banner
  const topMatchJob = radarDeck[0] || null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden animate-in fade-in duration-200">
      {/* 1. TOP WELCOME & SUMMARY HIGHLIGHTS */}
      <div className="bg-white border-2 border-slate-900/90 rounded-3xl p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AI Career Radar Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Good morning, {candidate.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
              We curated <strong className="text-slate-900 font-black">{radarDeck.length} matching roles</strong> based on your tech stack, location, and salary goals.
            </p>
          </div>

          {/* Key Match Highlights Card */}
          {topMatchJob && (
            <div className="bg-slate-50 p-4 sm:p-4.5 rounded-2xl border border-slate-200 text-xs shadow-2xs space-y-2.5 min-w-[280px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top Opportunity</span>
                <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                  🎯 {topMatchJob.matchScore}% Match
                </span>
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{topMatchJob.title}</h4>
                <p className="text-slate-500 font-medium text-xs mt-0.5">{topMatchJob.companyName}</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600 font-semibold text-xs pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>{candidate.location.split(",")[0]}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                  <span>{topMatchJob.salary}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Adaptive Learned Preferences indicator */}
        {swipes.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong className="text-slate-900 font-black">{swipes.length} swipes recorded:</strong> Recommendations are tailored to your actions.
              </span>
            </div>
            <button
              onClick={resetSwipes}
              className="text-[11px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Deck</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TOAST FEEDBACK BANNER */}
      {feedbackToast && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-wider shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-in slide-in-from-top-2 ${
            feedbackToast.type === "apply"
              ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
              : feedbackToast.type === "skip"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-sky-500 text-white border-sky-600"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackToast.type === "apply" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {feedbackToast.type === "skip" && <ThumbsDown className="w-4 h-4 shrink-0" />}
            {feedbackToast.type === "saved" && <Bookmark className="w-4 h-4 shrink-0" />}
            <span className="leading-snug">{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setActiveView("candidate-applications")}
            className="text-[11px] underline font-black uppercase tracking-widest hover:text-slate-200 cursor-pointer self-end sm:self-auto shrink-0"
          >
            View Applications →
          </button>
        </div>
      )}

      {/* Quick Filter Bar (Mobile-first responsive carousel) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filters:</span>
        </span>
        <button
          onClick={() => setFilterMode("all")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            filterMode === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Roles ({radarDeck.length})
        </button>
        <button
          onClick={() => setFilterMode("high_match")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            filterMode === "high_match"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          90%+ Match
        </button>
        <button
          onClick={() => setFilterMode("hybrid")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            filterMode === "hybrid"
              ? "bg-emerald-500 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Hybrid
        </button>
        <button
          onClick={() => setFilterMode("remote")}
          className={`py-2 px-4 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
            filterMode === "remote"
              ? "bg-sky-500 text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Remote Only
        </button>
      </div>

      {/* 3. MAIN CAROUSEL & SWIPE CARD WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column on Desktop, Bottom on Mobile */}
        <div className="order-2 lg:order-1 lg:col-span-4 space-y-5">
          {/* Desktop Filters Widget */}
          <div className="hidden lg:block p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Radar Filter</span>
              </span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{filteredDeck.length} in stack</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setFilterMode("all")}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Roles
              </button>
              <button
                onClick={() => setFilterMode("high_match")}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterMode === "high_match"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                90%+ Match
              </button>
              <button
                onClick={() => setFilterMode("hybrid")}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterMode === "hybrid"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Hybrid
              </button>
              <button
                onClick={() => setFilterMode("remote")}
                className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterMode === "remote"
                    ? "bg-sky-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Remote Only
              </button>
            </div>
          </div>

          {/* Keyboard / Gesture Navigation Cheatsheet */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-3xl shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-orange-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>Fast Navigation Guide</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 font-medium">
              <div className="flex items-center justify-between">
                <span>1-Click Apply</span>
                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-[11px]">
                  Swipe Right or →
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Skip Role</span>
                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-orange-400 font-mono font-bold text-[11px]">
                  Swipe Left or ←
                </span>
              </div>
            </div>
          </div>

          {/* Quick Browse Direct link */}
          <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-2xs text-center space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Looking for all listings?</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Explore the comprehensive catalog of open positions in a grid list.
            </p>
            <button
              onClick={() => setActiveView("candidate-jobs")}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              Browse All Jobs Catalog →
            </button>
          </div>
        </div>

        {/* Center & Right: 3D Swipe Card Deck (First on mobile!) */}
        <div className="order-1 lg:order-2 lg:col-span-8 w-full max-w-full">
          {currentJob ? (
            <div className="relative w-full max-w-full">
              {/* Stack effect decorative back cards */}
              {filteredDeck.length > 1 && (
                <div className="absolute inset-x-3 sm:inset-x-5 -top-2.5 sm:-top-3 h-full bg-slate-200/90 rounded-3xl -z-10 transform scale-[0.98]"></div>
              )}
              {filteredDeck.length > 2 && (
                <div className="absolute inset-x-6 sm:inset-x-10 -top-5 sm:-top-6 h-full bg-slate-100/90 rounded-3xl -z-20 transform scale-[0.96]"></div>
              )}

              {/* Main Active Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentJob.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 100 || info.velocity.x > 500) {
                      onSwipeAction("right");
                    } else if (info.offset.x < -100 || info.velocity.x < -500) {
                      onSwipeAction("left");
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: 0,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: swipeDirection === "right" ? 350 : swipeDirection === "left" ? -350 : 0,
                    rotate: swipeDirection === "right" ? 14 : swipeDirection === "left" ? -14 : 0,
                    scale: 0.92,
                  }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="w-full bg-white rounded-3xl border-2 border-slate-900 shadow-xl sm:shadow-2xl p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6 cursor-grab active:cursor-grabbing"
                >
                  {/* Card Header */}
                  <div className="space-y-4 pb-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <img
                          src={
                            currentJob.companyLogo ||
                            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                          }
                          alt={currentJob.companyName}
                          className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0 shadow-2xs"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {currentJob.companyName}
                          </p>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                            {currentJob.title}
                          </h2>
                        </div>
                      </div>

                      {/* Overall Match Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{currentJob.matchScore || 92}% Match</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Fit</span>
                      </div>
                    </div>

                    {/* Metadata Chips with proper breathing room */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{currentJob.workMode}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentJob.experience}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{currentJob.salary}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{currentJob.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Multidimensional Match Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Skills Match
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        {currentJob.matchedSkills && currentJob.matchedSkills.length > 0 ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{currentJob.matchedSkills.slice(0, 3).join(", ")}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                            <span className="text-slate-500 font-medium">Domain / Role Fit</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Experience Fit
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{currentJob.experience} ({candidate.yearsOfExperience} Yrs Exp)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Location Fit
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">{currentJob.location.split(",")[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Why this matches you */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Why This Role Matches You</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
                      {currentJob.aiSummary ||
                        (currentJob.matchReasons && currentJob.matchReasons.join(" • ")) ||
                        `Your background matches the requirements for ${currentJob.title}. Compensation is in your target ${currentJob.salary} range with ${currentJob.workMode} flexibility.`}
                    </p>
                  </div>

                  {/* Action Controls */}
                  <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                      {/* Skip button (Left swipe) */}
                      <button
                        id="radar-swipe-left-btn"
                        onClick={() => onSwipeAction("left")}
                        className="col-span-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3.5 rounded-full border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 text-slate-800 hover:text-orange-600 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-[44px]"
                        title="Skip (Left Arrow)"
                      >
                        <ThumbsDown className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="truncate">Skip (←)</span>
                      </button>

                      {/* Info / View Full JD */}
                      <button
                        id="radar-view-details-btn"
                        onClick={() => setSelectedJobForModal(currentJob)}
                        className="col-span-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
                      >
                        <Info className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Details</span>
                      </button>

                      {/* Save for later */}
                      <button
                        id="radar-save-btn"
                        onClick={handleSaveForLater}
                        className="col-span-1 flex items-center justify-center gap-1.5 p-3.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer min-h-[44px]"
                        title="Save for later"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span className="sm:hidden text-xs font-bold">Save</span>
                      </button>
                    </div>

                    {/* 1-Click Apply (Right swipe) */}
                    <button
                      id="radar-swipe-right-btn"
                      onClick={() => onSwipeAction("right")}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer min-h-[44px]"
                      title="1-Click Apply (Right Arrow)"
                    >
                      <ThumbsUp className="w-4 h-4 shrink-0" />
                      <span>1-Click Apply (→)</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            /* Empty Radar Deck State */
            <div className="p-8 sm:p-12 bg-white rounded-3xl border-2 border-slate-900 shadow-2xl text-center space-y-6 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto text-3xl shadow-xs">
                🎯
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                  Radar Batch Complete!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  You've reviewed all available opportunities in this filter. New matching positions are added regularly.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  id="reset-radar-btn"
                  onClick={resetSwipes}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan New Batches</span>
                </button>

                <button
                  onClick={() => setActiveView("candidate-jobs")}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Browse Full Catalog
                </button>

                <button
                  onClick={() => setActiveView("candidate-applications")}
                  className="px-6 py-3 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  View My Applications ({applications.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal view for complete JD */}
      <CandidateJobDetailModal
        job={selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
        onApply={(jobId) => handleSwipe(jobId, "right")}
        isApplied={
          selectedJobForModal
            ? applications.some((a) => a.jobId === selectedJobForModal.id)
            : false
        }
      />
    </div>
  );
};
