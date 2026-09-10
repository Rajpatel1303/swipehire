import React, { useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Clock,
  IndianRupee,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Mail,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Award,
  HelpCircle,
  Users,
  Send,
  Trash2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Job, Application, ApplicationStatus, CandidateProfile } from "../../types";
import { GeminiService, MatchAnalysisResult } from "../../services/geminiService";
import { ScheduleInterviewModal } from "./modals/ScheduleInterviewModal";
import { SendEmailModal } from "./modals/SendEmailModal";
import { SendWhatsAppModal } from "./modals/SendWhatsAppModal";
import { InterviewKitModal } from "./modals/InterviewKitModal";
import { OfferLetterModal } from "./modals/OfferLetterModal";
import { CandidateSkillRadarChart } from "./CandidateSkillRadarChart";
import { CompanyEditJobModal } from "./CompanyEditJobModal";
import { Target, Radar, Pencil, Scale, BrainCircuit } from "lucide-react";
import { FastActionCountdownBadge } from "../common/FastActionCountdownBadge";

interface CompanyJobCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export const CompanyJobCandidatesModal: React.FC<CompanyJobCandidatesModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const {
    company,
    applications,
    allCandidates,
    jobs,
    updateApplicationStatus,
    rejectApplication,
    deleteCandidate,
    applyToJob,
    setActiveView,
    triggerCelebration,
  } = useApp();

  const currentJob = job ? jobs.find((j) => j.id === job.id) || job : null;
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<"all" | "high-match" | ApplicationStatus>("all");
  const [sortBy, setSortBy] = useState<"score" | "experience" | "recent">("score");
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [cardTabMap, setCardTabMap] = useState<Record<string, "summary" | "radar" | "skills" | "resume">>({});

  // Live AI Re-evaluation state
  const [customPromptMap, setCustomPromptMap] = useState<Record<string, string>>({});
  const [isAnalyzingMap, setIsAnalyzingMap] = useState<Record<string, boolean>>({});
  const [liveAnalysisMap, setLiveAnalysisMap] = useState<Record<string, MatchAnalysisResult>>({});
  const [showPromptInputMap, setShowPromptInputMap] = useState<Record<string, boolean>>({});

  // Sub-modals for direct recruiter outreach
  const [selectedScheduleApp, setSelectedScheduleApp] = useState<Application | null>(null);
  const [selectedEmailApp, setSelectedEmailApp] = useState<Application | null>(null);
  const [selectedWhatsAppApp, setSelectedWhatsAppApp] = useState<Application | null>(null);
  const [selectedInterviewKitApp, setSelectedInterviewKitApp] = useState<Application | null>(null);
  const [selectedOfferApp, setSelectedOfferApp] = useState<Application | null>(null);

  // Guard against inspecting competitor jobs
  if (!isOpen || !job || (company.id && job.companyId && job.companyId !== company.id)) return null;

  // Filter applications for this specific job (excluding rejected, hidden, or deleted from company view)
  const jobApplications = applications.filter(
    (app) =>
      app.jobId === job.id &&
      (!company.id || app.companyId === company.id) &&
      !app.hiddenFromCompany &&
      !app.deletedByCompany &&
      app.status !== "rejected"
  );

  // Helper to compute matched & missing skills dynamically if not pre-populated
  const getSkillBreakdown = (app: Application) => {
    const candidateSkills = (app.candidateSkills || []).map((s) => s.trim());
    const jobReq = (job.requiredSkills || []).map((s) => s.trim());
    const jobPref = (job.preferredSkills || []).map((s) => s.trim());

    const matchedReq = jobReq.filter((js) =>
      candidateSkills.some(
        (cs) => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase())
      )
    );
    const matchedPref = jobPref.filter((js) =>
      candidateSkills.some(
        (cs) => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase())
      )
    );
    const matched = Array.from(new Set([...matchedReq, ...matchedPref]));
    const missing = jobReq.filter(
      (js) =>
        !candidateSkills.some(
          (cs) => cs.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(cs.toLowerCase())
        )
    );

    return {
      matchedSkills: app.matchedSkills && app.matchedSkills.length > 0 ? app.matchedSkills : matched,
      missingSkills: app.missingSkills !== undefined ? app.missingSkills : missing,
      totalRequired: jobReq.length,
    };
  };

  // Filter and sort candidates
  const filteredCandidates = jobApplications
    .filter((app) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.candidateName.toLowerCase().includes(q);
        const matchesHeadline = (app.candidateHeadline || "").toLowerCase().includes(q);
        const matchesSkill = (app.candidateSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesHeadline && !matchesSkill) return false;
      }

      if (filterStage === "high-match") {
        return (app.matchScore || 0) >= 90;
      }
      if (filterStage !== "all") {
        return app.status === filterStage;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (sortBy === "experience") {
        return (b.candidateExpYears || 0) - (a.candidateExpYears || 0);
      }
      if (sortBy === "recent") {
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      }
      return 0;
    });

  // Recommended candidates from platform talent pool not yet applied
  const appliedCandidateIds = new Set(jobApplications.map((a) => a.candidateId));
  const suggestedTalentPool = allCandidates.filter((c) => !appliedCandidateIds.has(c.id));

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    if (newStatus === "rejected") {
      rejectApplication(appId);
      return;
    }
    updateApplicationStatus(appId, newStatus);
    if (newStatus === "offer" || newStatus === "hired" || newStatus === "shortlisted") {
      triggerCelebration();
    }
  };

  const handleRejectCandidate = (app: Application) => {
    if (
      window.confirm(
        `Reject ${app.candidateName}? This will remove them from your company view and generate constructive AI feedback for the candidate.`
      )
    ) {
      rejectApplication(app.id);
    }
  };

  const handleDeleteCandidate = (app: Application) => {
    if (
      window.confirm(
        `Delete ${app.candidateName} from this job pipeline?`
      )
    ) {
      deleteCandidate(app.id);
    }
  };

  const handleLiveReEvaluate = async (app: Application) => {
    setIsAnalyzingMap((prev) => ({ ...prev, [app.id]: true }));
    try {
      const candidateProfile: CandidateProfile = {
        id: app.candidateId,
        fullName: app.candidateName,
        headline: app.candidateHeadline,
        email: app.candidateEmail,
        phone: app.candidatePhone,
        location: app.candidateLocation,
        workPreference: app.candidateWorkPreference || "Hybrid",
        yearsOfExperience: app.candidateExpYears || 3,
        skills: app.candidateSkills || [],
        possibleRoles: [app.jobTitle],
        education: app.candidateEducationList || [],
        experience: app.candidateExperienceList || [],
        projects: app.candidateProjectsList || [],
        certifications: [],
        expectedSalary: app.candidateExpectedSalary || "₹8–11 LPA",
        preferredRole: app.jobTitle,
        bio: app.candidateBio,
        profilePhoto: app.candidatePhoto,
        profileStrength: 90,
        isCompleted: true,
      };

      const customFocus = customPromptMap[app.id] || "";
      const result = await GeminiService.analyzeMatch(candidateProfile, job, customFocus);
      setLiveAnalysisMap((prev) => ({ ...prev, [app.id]: result }));
    } catch (err) {
      console.error("Failed to re-evaluate candidate:", err);
    } finally {
      setIsAnalyzingMap((prev) => ({ ...prev, [app.id]: false }));
    }
  };

  const handleFastTrackInvite = async (candidate: CandidateProfile) => {
    await applyToJob(job.id, candidate);
    triggerCelebration();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl h-[96vh] sm:h-auto sm:max-h-[92vh] rounded-2xl sm:rounded-[32px] shadow-2xl border-2 border-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* COMPACT RESPONSIVE MODAL HEADER */}
        <div className="p-3.5 sm:p-5 border-b-2 border-slate-200 bg-slate-50 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 border border-sky-200">
                  Evaluation Hub
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
                    job.status === "active"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {job.status}
                </span>
                <span className="font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 text-[9px] sm:text-[10px]">
                  {jobApplications.length} Applicants
                </span>
              </div>

              <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight truncate">
                {job.title}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-0.5 font-bold text-slate-800">
                  <MapPin className="w-3 h-3 text-sky-600" />
                  {job.location} ({job.workMode})
                </span>
                <span>•</span>
                <span className="font-black text-emerald-700">{job.salary}</span>
                <span>•</span>
                <span className="text-slate-600 font-semibold">{job.experience}</span>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  setActiveView("company-compare");
                }}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-xs transition-colors cursor-pointer"
                title="Compare candidates side-by-side in Duel Arena"
              >
                <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Arena</span>
              </button>

              <button
                onClick={() => setIsEditJobOpen(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-800 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-full transition-colors cursor-pointer"
                title="Edit Job Details & Requirements"
              >
                <Pencil className="w-3 h-3 text-orange-500" />
                <span className="hidden xs:inline">Edit</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-full border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Quick Filter Tabs & Sort */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setFilterStage("all")}
                  className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                    filterStage === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  All ({jobApplications.length})
                </button>
                <button
                  onClick={() => setFilterStage("high-match")}
                  className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                    filterStage === "high-match"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                  }`}
                >
                  90%+ ({jobApplications.filter((a) => (a.matchScore || 0) >= 90).length})
                </button>
                <button
                  onClick={() => setFilterStage("shortlisted")}
                  className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                    filterStage === "shortlisted"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  Shortlisted ({jobApplications.filter((a) => a.status === "shortlisted").length})
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-wider px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="score">Highest Match</option>
                  <option value="experience">Experience</option>
                  <option value="recent">Most Recent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CANDIDATES LIST BODY */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-4 sm:space-y-6">
          {filteredCandidates.length === 0 ? (
            <div className="p-6 sm:p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                  No applicants match your filter
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {jobApplications.length === 0
                    ? "No candidates have applied to this role yet. You can invite qualified talent directly from our talent pool below."
                    : "Try clearing your search query or switching to 'All' filter."}
                </p>
              </div>

              {jobApplications.length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStage("all");
                  }}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {filteredCandidates.map((app) => {
                const activeTab = cardTabMap[app.id] || "summary";
                const { matchedSkills, missingSkills } = getSkillBreakdown(app);
                const liveEval = liveAnalysisMap[app.id];
                const activeScore = liveEval?.matchScore ?? app.matchScore ?? 90;
                const activeVerdict =
                  liveEval?.fitVerdict ??
                  app.fitVerdict ??
                  (activeScore >= 90
                    ? "Exceptional Fit · Strong Hire Recommendation"
                    : activeScore >= 80
                    ? "Good Fit · Recommended with Quick Ramp-Up"
                    : "Moderate Fit · Review Nuances");
                const activeMatched = liveEval?.matchedSkills ?? matchedSkills;
                const activeMissing = liveEval?.missingSkills ?? missingSkills;
                const activeStrengths =
                  liveEval?.strengths ??
                  app.strengths ??
                  app.matchReasons ?? [
                    "Strong background in modern component architectures",
                    "Location and preferred work mode match requirements",
                  ];
                const activeConcerns =
                  liveEval?.concerns ?? app.matchConcerns ?? [];
                const activeSummary = liveEval?.aiSummary ?? app.aiSummary;
                const activeQuestions =
                  liveEval?.interviewQuestions ??
                  app.interviewQuestions ?? [
                    `How do you structure component state and handle scalability in ${activeMatched[0] || "React"}?`,
                    activeMissing.length > 0
                      ? `How would you approach ramping up on ${activeMissing[0]}?`
                      : "Can you share how you resolve production performance bottlenecks?",
                  ];
                const isAnalyzing = !!isAnalyzingMap[app.id];

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl sm:rounded-[28px] border-2 border-slate-900 shadow-md hover:border-slate-800 transition-all p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 overflow-hidden"
                  >
                    {/* 1. CANDIDATE HEADER ROW */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <img
                          src={
                            app.candidatePhoto ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                          }
                          alt={app.candidateName}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover ring-2 ring-slate-900 shrink-0 shadow-sm"
                        />
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight truncate">
                              {app.candidateName}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                app.status === "hired"
                                  ? "bg-emerald-600 text-white"
                                  : app.status === "offer"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : app.status === "interview"
                                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                                  : app.status === "shortlisted"
                                  ? "bg-orange-100 text-orange-800 border border-orange-300"
                                  : app.status === "screening"
                                  ? "bg-sky-100 text-sky-800 border border-sky-300"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {app.status}
                            </span>
                            <FastActionCountdownBadge
                              appliedAt={app.appliedAt}
                              deadline={app.slaDeadline}
                              status={app.status}
                              compact={true}
                            />
                          </div>

                          <p className="text-xs font-bold text-slate-700 truncate">
                            {app.candidateHeadline || "Software Developer"}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-0.5 font-bold text-slate-700">
                              <MapPin className="w-3 h-3 text-sky-500" />
                              {app.candidateLocation} ({app.candidateWorkPreference || "Hybrid"})
                            </span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">
                              {app.candidateExpYears || 3} yrs exp
                            </span>
                            <span>•</span>
                            <span className="font-black text-emerald-700">
                              Exp: {app.candidateExpectedSalary || "₹8–11 LPA"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI MATCH SCORE GAUGE */}
                      <div className="flex flex-col items-center justify-center bg-slate-900 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-800 shadow-sm shrink-0">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-lg sm:text-2xl font-black text-white leading-none">
                            {activeScore}%
                          </span>
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-400 block mt-0.5">
                          Match
                        </span>
                      </div>
                    </div>

                    {/* Individual 72-Hour Response Action Countdown Timer */}
                    {app.status === "applied" && (
                      <div className="pt-1">
                        <FastActionCountdownBadge
                          appliedAt={app.appliedAt}
                          deadline={app.slaDeadline}
                          status={app.status}
                          variant="card-timer"
                          candidateName={app.candidateName}
                          onAdvanceToScreening={() => updateApplicationStatus(app.id, "screening")}
                          onShortlist={() => updateApplicationStatus(app.id, "shortlisted")}
                          onReject={() => updateApplicationStatus(app.id, "rejected")}
                        />
                      </div>
                    )}

                    {/* 2. CARD NAVIGATION SEGMENTS (SUMMARY | RADAR | SKILLS | RESUME) */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 border-b border-slate-200">
                      <button
                        onClick={() =>
                          setCardTabMap((prev) => ({ ...prev, [app.id]: "summary" }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === "summary"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Summary</span>
                      </button>

                      <button
                        onClick={() =>
                          setCardTabMap((prev) => ({ ...prev, [app.id]: "skills" }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === "skills"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Skills & Gaps</span>
                      </button>

                      <button
                        onClick={() =>
                          setCardTabMap((prev) => ({ ...prev, [app.id]: "radar" }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === "radar"
                            ? "bg-sky-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Target className="w-3 h-3" />
                        <span>Skill Radar</span>
                      </button>

                      <button
                        onClick={() =>
                          setCardTabMap((prev) => ({ ...prev, [app.id]: "resume" }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === "resume"
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>Full Resume</span>
                      </button>
                    </div>

                    {/* TAB CONTENT: AI SUMMARY (Default) */}
                    {activeTab === "summary" && (
                      <div className="space-y-3">
                        {/* Fit Verdict Banner */}
                        <div
                          className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                            activeScore >= 90
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                              : activeScore >= 80
                              ? "bg-sky-50/80 border-sky-300 text-sky-900"
                              : "bg-amber-50/80 border-amber-300 text-amber-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Award className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                            <span className="font-black uppercase tracking-wide truncate text-[11px] sm:text-xs">
                              {activeVerdict}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              setShowPromptInputMap((prev) => ({
                                ...prev,
                                [app.id]: !prev[app.id],
                              }))
                            }
                            className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 underline cursor-pointer shrink-0"
                          >
                            {showPromptInputMap[app.id] ? "Hide Prompt" : "Custom AI Criteria ✦"}
                          </button>
                        </div>

                        {/* Custom prompt input box */}
                        {showPromptInputMap[app.id] && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-sky-600" />
                              <span>Evaluate Custom Criteria</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Assess scalable backend performance experience..."
                                value={customPromptMap[app.id] || ""}
                                onChange={(e) =>
                                  setCustomPromptMap((prev) => ({
                                    ...prev,
                                    [app.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                              <button
                                onClick={() => handleLiveReEvaluate(app)}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                                <span>{isAnalyzing ? "..." : "Re-Analyze"}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Executive Summary */}
                        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {activeSummary}
                          </p>

                          {/* Strengths and Concerns */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Key Strengths:</span>
                              </span>
                              <ul className="space-y-0.5 pl-3.5 list-disc text-slate-600 font-medium text-[11px]">
                                {activeStrengths.slice(0, 2).map((st, i) => (
                                  <li key={i}>{st}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3 text-amber-600" />
                                <span>Areas to Probe:</span>
                              </span>
                              {activeConcerns.length === 0 ? (
                                <p className="text-slate-500 italic text-[11px] pl-1">
                                  No notable concerns detected.
                                </p>
                              ) : (
                                <ul className="space-y-0.5 pl-3.5 list-disc text-slate-600 font-medium text-[11px]">
                                  {activeConcerns.slice(0, 2).map((cn, i) => (
                                    <li key={i}>{cn}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          {/* Quick Interview Question */}
                          {activeQuestions.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-sky-600" />
                                <span>Suggested Question:</span>
                              </span>
                              <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 font-medium italic">
                                "{activeQuestions[0]}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: SKILLS & GAPS */}
                    {activeTab === "skills" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Matched Skills ({activeMatched.length})</span>
                            </span>
                            <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Verified
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activeMatched.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white text-emerald-800 text-[10px] font-black rounded border border-emerald-300 flex items-center gap-0.5 shadow-2xs"
                              >
                                <span>{skill}</span>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Missing / Gap ({activeMissing.length})</span>
                            </span>
                            <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              {activeMissing.length === 0 ? "Zero Gaps" : "Needs Review"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activeMissing.length === 0 ? (
                              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Possesses all core required skills!</span>
                              </span>
                            ) : (
                              activeMissing.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-white text-rose-800 text-[10px] font-black rounded border border-rose-300 flex items-center gap-0.5 shadow-2xs"
                                >
                                  <span>{skill}</span>
                                  <XCircle className="w-2.5 h-2.5 text-rose-500" />
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT: SKILL RADAR */}
                    {activeTab === "radar" && (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-sky-600" />
                            <span>D3 Multi-Axis Skill Radar Analysis</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            Evaluated vs. Job Metrics
                          </span>
                        </div>
                        <CandidateSkillRadarChart candidate={app} job={job} compact={true} />
                      </div>
                    )}

                    {/* TAB CONTENT: FULL RESUME & DEEP DIVE */}
                    {activeTab === "resume" && (
                      <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        {app.candidateBio && (
                          <div className="space-y-1">
                            <span className="font-black uppercase tracking-wider text-slate-500 text-[10px]">
                              Professional Bio:
                            </span>
                            <p className="text-slate-700 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                              {app.candidateBio}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <span className="font-black uppercase tracking-wider text-slate-800 text-[10px] flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-600" />
                            <span>Work Experience:</span>
                          </span>
                          <div className="space-y-1.5">
                            {(app.candidateExperienceList || [
                              {
                                title: app.candidateHeadline || "Software Engineer",
                                company: "Tech Company",
                                duration: `${app.candidateExpYears || 3} Years`,
                                description: "Led key web features and collaborated across agile engineering teams.",
                              },
                            ]).map((exp, i) => (
                              <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-0.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-black text-slate-900">{exp.title}</span>
                                  <span className="text-[10px] font-bold text-slate-500">{exp.duration}</span>
                                </div>
                                <span className="text-[11px] font-bold text-sky-700 block">{exp.company}</span>
                                <p className="text-[11px] text-slate-600 font-medium">{exp.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Projects & Education */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <span className="font-black uppercase tracking-wider text-slate-800 text-[10px] flex items-center gap-1">
                              <FolderGit2 className="w-3 h-3 text-slate-600" />
                              <span>Projects:</span>
                            </span>
                            {(app.candidateProjectsList || [
                              {
                                name: "Production Web Platform",
                                description: "Built scalable frontend workflows with React & TypeScript.",
                                technologies: ["React", "TypeScript", "Tailwind CSS"],
                              },
                            ]).map((proj, i) => (
                              <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                                <span className="font-black text-[11px] text-slate-900 block">{proj.name}</span>
                                <p className="text-[10px] text-slate-600">{proj.description}</p>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <span className="font-black uppercase tracking-wider text-slate-800 text-[10px] flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-slate-600" />
                              <span>Education:</span>
                            </span>
                            {(app.candidateEducationList || [
                              {
                                degree: "B.Tech in Computer Science",
                                institution: "Accredited University",
                                year: "2021",
                              },
                            ]).map((edu, i) => (
                              <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                                <span className="font-black text-[11px] text-slate-900 block">{edu.degree}</span>
                                <span className="text-[10px] text-slate-600 block">{edu.institution} ({edu.year})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. RECRUITER ACTION TOOLBAR (MOBILE OPTIMIZED) */}
                    <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Left: Quick Communication */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedEmailApp(app)}
                          className="px-2.5 py-1 text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 rounded-lg border border-slate-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          title="Send Official Email"
                        >
                          <Mail className="w-3 h-3 text-sky-600" />
                          <span>Email</span>
                        </button>

                        <button
                          onClick={() => setSelectedWhatsAppApp(app)}
                          className="px-2.5 py-1 text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg border border-slate-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          title="Send WhatsApp Message"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => setSelectedInterviewKitApp(app)}
                          className="px-2.5 py-1 text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          title="Interview Rubric Kit"
                        >
                          <BrainCircuit className="w-3 h-3 text-purple-600" />
                          <span className="hidden xs:inline">Rubric</span>
                        </button>
                      </div>

                      {/* Right: Stage Advance / Schedule / Offer / Stage Selector */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedOfferApp(app)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Award className="w-3 h-3 text-emerald-600" />
                          <span>Offer</span>
                        </button>

                        <button
                          onClick={() => setSelectedScheduleApp(app)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Interview</span>
                        </button>

                        {app.status !== "shortlisted" && app.status !== "interview" && app.status !== "offer" && app.status !== "hired" && (
                          <button
                            onClick={() => handleStatusChange(app.id, "shortlisted")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Shortlist</span>
                          </button>
                        )}

                        {/* Reject Candidate Button */}
                        <button
                          onClick={() => handleRejectCandidate(app)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                          title="Reject candidate and deliver AI feedback"
                        >
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Reject</span>
                        </button>

                        {/* Delete Candidate Button */}
                        <button
                          onClick={() => handleDeleteCandidate(app)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete candidate from job pipeline"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Delete</span>
                        </button>

                        {/* Stage Dropdown Selector */}
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className="px-2 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-wider focus:outline-none cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="shortlisted">Shortlist</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired ✦</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TALENT POOL DISCOVERY: SUGGESTED CANDIDATES */}
          {suggestedTalentPool.length > 0 && (
            <div className="pt-4 border-t-2 border-slate-200 space-y-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Instant Talent Radar · Recommended Profiles</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Pre-vetted candidates from the platform whose technical profile matches this role.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suggestedTalentPool.slice(0, 2).map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-800 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={cand.profilePhoto}
                          alt={cand.fullName}
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-300 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 uppercase truncate">{cand.fullName}</h4>
                          <span className="text-[10px] text-slate-500 font-medium block truncate">
                            {cand.headline}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {cand.yearsOfExperience} yrs exp · {cand.location}
                          </span>
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded border border-emerald-300 shrink-0">
                        {cand.yearsOfExperience >= 3 ? "91%" : "86%"}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Exp: {cand.expectedSalary}
                      </span>

                      <button
                        onClick={() => handleFastTrackInvite(cand)}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Invite</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COMPACT MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Showing <strong className="text-slate-900 font-black">{filteredCandidates.length}</strong> of{" "}
            {jobApplications.length} candidates
          </span>

          <button
            onClick={onClose}
            className="px-5 sm:px-6 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>

      {/* SUB-MODALS */}
      {selectedScheduleApp && (
        <ScheduleInterviewModal
          isOpen={!!selectedScheduleApp}
          onClose={() => setSelectedScheduleApp(null)}
          applicationId={selectedScheduleApp.id}
          candidateName={selectedScheduleApp.candidateName}
          jobTitle={selectedScheduleApp.jobTitle}
        />
      )}

      {selectedEmailApp && (
        <SendEmailModal
          isOpen={!!selectedEmailApp}
          onClose={() => setSelectedEmailApp(null)}
          candidateName={selectedEmailApp.candidateName}
          candidateEmail={selectedEmailApp.candidateEmail}
          jobTitle={selectedEmailApp.jobTitle}
        />
      )}

      {selectedWhatsAppApp && (
        <SendWhatsAppModal
          isOpen={!!selectedWhatsAppApp}
          onClose={() => setSelectedWhatsAppApp(null)}
          candidateName={selectedWhatsAppApp.candidateName}
          candidatePhone={selectedWhatsAppApp.candidatePhone}
          jobTitle={selectedWhatsAppApp.jobTitle}
        />
      )}

      {selectedInterviewKitApp && (
        <InterviewKitModal
          isOpen={!!selectedInterviewKitApp}
          onClose={() => setSelectedInterviewKitApp(null)}
          application={selectedInterviewKitApp}
          job={job}
        />
      )}

      {selectedOfferApp && (
        <OfferLetterModal
          isOpen={!!selectedOfferApp}
          onClose={() => setSelectedOfferApp(null)}
          application={selectedOfferApp}
          job={job}
        />
      )}

      {isEditJobOpen && currentJob && (
        <CompanyEditJobModal
          isOpen={isEditJobOpen}
          onClose={() => setIsEditJobOpen(false)}
          job={currentJob}
        />
      )}
    </div>
  );
};
