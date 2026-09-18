import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  MapPin,
  IndianRupee,
  Briefcase,
  Mail,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Filter,
  Download,
  PlusCircle,
  Eye,
  Target,
  FileText,
  UserCheck,
  Send,
  Layers,
  Award,
  HelpCircle,
  BrainCircuit,
  Scale,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  FolderGit2,
  Bookmark,
  Check,
  Zap,
  Lock,
  Trash2,
  X,
  ShieldAlert,
  Flame,
  Timer,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Application, ApplicationStatus, Job, CandidateProfile, GitHubRepoItem } from "../../types";
import { GeminiService, MatchAnalysisResult } from "../../services/geminiService";
import { ScheduleInterviewModal } from "./modals/ScheduleInterviewModal";
import { SendEmailModal } from "./modals/SendEmailModal";
import { SendWhatsAppModal } from "./modals/SendWhatsAppModal";
import { InterviewKitModal } from "./modals/InterviewKitModal";
import { OfferLetterModal } from "./modals/OfferLetterModal";
import { CandidateSkillRadarChart } from "./CandidateSkillRadarChart";
import { FastActionCountdownBadge } from "../common/FastActionCountdownBadge";
import { GitHubProjectModal } from "../common/GitHubProjectModal";
import { CustomSelect } from "../common/CustomSelect";
import { UserAvatar } from "../common/UserAvatar";

const STAGE_CONFIG: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  applied: { label: "New Applied", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  screening: { label: "Screening", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  shortlisted: { label: "Shortlisted", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  interview: { label: "Interview", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  offer: { label: "Offer Made", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  hired: { label: "Hired", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  rejected: { label: "Rejected", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  expired: { label: "72h SLA Expired", bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300" },
};

export const CompanyApplicationsPage: React.FC = () => {
  const {
    company,
    applications,
    jobs,
    allCandidates,
    selectedJobId,
    setSelectedJobId,
    openAddJobModal,
    updateApplicationStatus,
    rejectApplication,
    deleteApplication,
    deleteCandidate,
    expireApplication,
    purgeExpiredApplications,
    simulateFastForwardApplication,
    applyToJob,
    triggerCelebration,
    setActiveView,
  } = useApp();

  // Defense-in-depth: scope jobs and applications to current company
  const companyJobs = useMemo(
    () => jobs.filter((j) => !company.id || j.companyId === company.id),
    [jobs, company.id]
  );
  const companyApplications = useMemo(
    () => applications.filter((a) => !company.id || a.companyId === company.id),
    [applications, company.id]
  );

  // Filters & Search
  const [filterJobId, setFilterJobId] = useState<string>(selectedJobId || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStage, setFilterStage] = useState<"all" | "high-match" | "urgent-sla" | "expired-only" | ApplicationStatus>("all");
  const [sortBy, setSortBy] = useState<"score" | "recent" | "experience">("score");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Selection for bulk actions
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Card Tab expansions
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [cardTabMap, setCardTabMap] = useState<Record<string, "summary" | "radar" | "skills" | "resume" | "github">>({});

  // Live AI Re-evaluation
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
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
  const [inspectingProject, setInspectingProject] = useState<{ repo: GitHubRepoItem; username: string } | null>(null);

  // Compute Skill Breakdown Helper
  const getSkillBreakdown = (app: Application, job: Job | undefined) => {
    const candidateSkills = (app.candidateSkills || []).map((s) => s.trim());
    const jobReq = job ? (job.requiredSkills || []).map((s) => s.trim()) : [];
    const jobPref = job ? (job.preferredSkills || []).map((s) => s.trim()) : [];

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

  // Filtered and Sorted Applications
  const filteredApplications = useMemo(() => {
    return companyApplications
      .filter((app) => {
        // Job filter
        if (filterJobId !== "all" && app.jobId !== filterJobId) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = app.candidateName.toLowerCase().includes(q);
          const matchesHeadline = (app.candidateHeadline || "").toLowerCase().includes(q);
          const matchesJob = app.jobTitle.toLowerCase().includes(q);
          const matchesSkill = (app.candidateSkills || []).some((s) => s.toLowerCase().includes(q));
          if (!matchesName && !matchesHeadline && !matchesJob && !matchesSkill) {
            return false;
          }
        }

        // Stage filter
        if (filterStage === "rejected") {
          return app.status === "rejected";
        }

        // Hide rejected, deleted, or hidden applications by default from company view
        if (app.hiddenFromCompany || app.deletedByCompany || app.status === "rejected") {
          return false;
        }

        if (filterStage === "high-match") {
          return (app.matchScore || 0) >= 90 && app.status !== "expired" && !app.isExpired;
        }
        if (filterStage === "urgent-sla") {
          return app.status === "applied" && !app.isExpired;
        }
        if (filterStage === "expired-only") {
          return app.status === "expired" || !!app.isExpired;
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
        // Recent
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      });
  }, [companyApplications, filterJobId, searchQuery, filterStage, sortBy]);

  // Key Metrics
  const stats = useMemo(() => {
    const activeCompanyApps = companyApplications.filter((a) => !a.hiddenFromCompany && !a.deletedByCompany && a.status !== "rejected");
    const total = activeCompanyApps.length;
    const pendingReview = activeCompanyApps.filter((a) => a.status === "applied" && !a.isExpired).length;
    const expiredCount = companyApplications.filter((a) => a.status === "expired" || a.isExpired).length;
    const shortlisted = activeCompanyApps.filter((a) => (a.status === "shortlisted" || a.status === "screening") && !a.isExpired).length;
    const interviewing = activeCompanyApps.filter((a) => a.status === "interview").length;
    const offers = activeCompanyApps.filter((a) => a.status === "offer" || a.status === "hired").length;
    const rejectedCount = companyApplications.filter((a) => a.status === "rejected").length;
    const avgScore = activeCompanyApps.length > 0
      ? Math.round(activeCompanyApps.reduce((acc, a) => acc + (a.matchScore || 0), 0) / activeCompanyApps.length)
      : 0;
    return { total, pendingReview, expiredCount, shortlisted, interviewing, offers, rejectedCount, avgScore };
  }, [companyApplications]);

  // Find the single most urgent pending application requiring recruiter review action
  const mostUrgentApplication = useMemo(() => {
    const pending = companyApplications.filter((a) => a.status === "applied" && !a.isExpired);
    if (pending.length === 0) return null;
    return pending.reduce((earliest, curr) => {
      const earliestDeadline = earliest.slaDeadline
        ? new Date(earliest.slaDeadline).getTime()
        : new Date(earliest.appliedAt).getTime() + 72 * 3600 * 1000;
      const currDeadline = curr.slaDeadline
        ? new Date(curr.slaDeadline).getTime()
        : new Date(curr.appliedAt).getTime() + 72 * 3600 * 1000;
      return currDeadline < earliestDeadline ? curr : earliest;
    }, pending[0]);
  }, [companyApplications]);

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedAppIds.length === filteredApplications.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApplications.map((a) => a.id));
    }
  };

  const handleBulkStageChange = (newStatus: ApplicationStatus) => {
    if (newStatus === "rejected") {
      selectedAppIds.forEach((id) => {
        rejectApplication(id);
      });
    } else {
      selectedAppIds.forEach((id) => {
        updateApplicationStatus(id, newStatus);
      });
    }
    triggerCelebration();
    setSelectedAppIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedAppIds.length} candidate(s) from your company pipeline?`)) {
      selectedAppIds.forEach((id) => {
        deleteCandidate(id);
      });
      triggerCelebration();
      setSelectedAppIds([]);
    }
  };

  // Live AI Re-evaluation
  const handleLiveReevaluate = async (app: Application, targetJob: Job) => {
    const prompt = customPromptMap[app.id] || "";
    setIsAnalyzingMap((prev) => ({ ...prev, [app.id]: true }));

    const candidateObj = allCandidates.find((c) => c.id === app.candidateId) || {
      id: app.candidateId,
      fullName: app.candidateName,
      headline: app.candidateHeadline,
      skills: app.candidateSkills,
      yearsOfExperience: app.candidateExpYears,
      email: app.candidateEmail,
      phone: app.candidatePhone,
      location: app.candidateLocation,
      workPreference: app.candidateWorkPreference || "Hybrid",
      expectedSalary: app.candidateExpectedSalary || app.jobSalary,
      education: app.candidateEducationList || [],
      experience: app.candidateExperienceList || [],
      projects: app.candidateProjectsList || [],
      bio: app.candidateBio,
      profilePhoto: app.candidatePhoto,
      possibleRoles: [app.jobTitle],
      certifications: [],
      preferredRole: app.jobTitle,
      profileStrength: 90,
      isCompleted: true,
    };

    const result = await GeminiService.analyzeMatch(candidateObj, targetJob, prompt);
    setLiveAnalysisMap((prev) => ({ ...prev, [app.id]: result }));
    setIsAnalyzingMap((prev) => ({ ...prev, [app.id]: false }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
              Candidate Applications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-200">
              {applications.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time candidate inbox. Screen applicant radar profiles, AI match scores, interview scorecards, and execute fast hiring actions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {stats.expiredCount > 0 && (
            <button
              onClick={purgeExpiredApplications}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              title="Permanently remove all auto-withdrawn expired applications"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-100" />
              <span>Purge Expired ({stats.expiredCount})</span>
            </button>
          )}

          <button
            id="post-job-nav-btn"
            onClick={openAddJobModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <span>+ Post New Job</span>
          </button>

          <button
            id="manage-jobs-nav-btn"
            onClick={() => setActiveView("company-jobs")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-bold text-xs transition-colors cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            <span>Job Postings ({companyJobs.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setFilterStage("all")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider opacity-70">Total Applicants</div>
          <div className="text-2xl font-black mt-1">{stats.total}</div>
        </div>

        <div
          onClick={() => setFilterStage("urgent-sla")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === "urgent-sla"
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-amber-50/50 border-amber-200 hover:border-amber-300"
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Needs Review (72h)</span>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">{stats.pendingReview}</div>
        </div>

        <div
          onClick={() => setFilterStage("high-match")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === "high-match"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>90%+ Match</span>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {companyApplications.filter((a) => (a.matchScore || 0) >= 90 && !a.isExpired).length}
          </div>
        </div>

        <div
          onClick={() => setFilterStage("shortlisted")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === "shortlisted"
              ? "bg-purple-600 text-white border-purple-600 shadow-md"
              : "bg-purple-50/50 border-purple-200 hover:border-purple-300"
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-800">Shortlisted</div>
          <div className="text-2xl font-black text-purple-950 mt-1">{stats.shortlisted}</div>
        </div>

        <div
          onClick={() => setFilterStage("interview")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === "interview"
              ? "bg-sky-600 text-white border-sky-600 shadow-md"
              : "bg-sky-50/50 border-sky-200 hover:border-sky-300"
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-sky-800">In Interview</div>
          <div className="text-2xl font-black text-sky-950 mt-1">{stats.interviewing}</div>
        </div>

        <div
          onClick={() => setFilterStage("expired-only")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStage === "expired-only"
              ? "bg-rose-600 text-white border-rose-600 shadow-md"
              : "bg-rose-50/50 border-rose-200 hover:border-rose-300"
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1">
            <Lock className="w-3 h-3 text-rose-600" />
            <span>72h Expired</span>
          </div>
          <div className="text-2xl font-black text-rose-950 mt-1">{stats.expiredCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Job Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Filter By Job:</span>
            <CustomSelect
              value={filterJobId}
              onChange={(val) => {
                setFilterJobId(val);
                setSelectedJobId(val === "all" ? null : val);
              }}
              variant="card"
              size="sm"
              options={[
                {
                  value: "all",
                  label: "All Jobs",
                  badge: `${companyApplications.length}`,
                },
                ...companyJobs.map((j) => {
                  const count = companyApplications.filter((a) => a.jobId === j.id).length;
                  return {
                    value: j.id,
                    label: j.title,
                    badge: `${count}`,
                    description: `${j.department} • ${j.location}`,
                  };
                }),
              ]}
            />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, headline, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort & View Mode Switches */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSortBy("score")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === "score" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Sort by AI Match Score"
              >
                Match Score
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === "recent" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Sort by Most Recent Application"
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy("experience")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === "experience" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Sort by Experience"
              >
                Exp (Yrs)
              </button>
            </div>
          </div>
        </div>

        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1 shrink-0">
            Pipeline Stage:
          </span>
          <button
            onClick={() => setFilterStage("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              filterStage === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Stages ({applications.length})
          </button>
          <button
            onClick={() => setFilterStage("urgent-sla")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
              filterStage === "urgent-sla"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Needs Review ({stats.pendingReview})</span>
          </button>
          <button
            onClick={() => setFilterStage("high-match")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
              filterStage === "high-match"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>90%+ Match</span>
          </button>
          {(["applied", "screening", "shortlisted", "interview", "offer", "hired", "rejected"] as ApplicationStatus[]).map(
            (status) => {
              const count = applications.filter((a) => a.status === status).length;
              const config = STAGE_CONFIG[status];
              const isActive = filterStage === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStage(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{config.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? "bg-white/20 text-white" : `${config.bg} ${config.text}`
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedAppIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 bg-white/20 rounded-lg">
              {selectedAppIds.length} candidate{selectedAppIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedAppIds([])}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1">Move To:</span>
            <button
              onClick={() => handleBulkStageChange("screening")}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Screening
            </button>
            <button
              onClick={() => handleBulkStageChange("shortlisted")}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Shortlist
            </button>
            <button
              onClick={() => handleBulkStageChange("interview")}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Interview
            </button>
            <button
              onClick={() => handleBulkStageChange("rejected")}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Delete selected candidates from company pipeline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Candidates</span>
            </button>
          </div>
        </div>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">No candidates found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? `No candidates matching "${searchQuery}". Try modifying your search or clearing filters.`
                : filterStage !== "all"
                ? `No candidates in the "${filterStage}" stage.`
                : "No applications have been submitted for this job yet."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStage("all");
                setFilterJobId("all");
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={openAddJobModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Post a New Job
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Bar */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-bold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAppIds.length === filteredApplications.length && filteredApplications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Select all {filteredApplications.length} candidates</span>
            </label>
            <span>Showing {filteredApplications.length} applications</span>
          </div>

          {filteredApplications.map((app) => {
            const currentCandidateJob = jobs.find((j) => j.id === app.jobId);
            const isSelected = selectedAppIds.includes(app.id);
            const isExpanded = expandedCardId === app.id;
            const isAppExpired = app.status === "expired" || !!app.isExpired;
            const activeCardTab = cardTabMap[app.id] || "summary";
            const stageConfig = STAGE_CONFIG[app.status] || STAGE_CONFIG.applied;
            const skillBreakdown = getSkillBreakdown(app, currentCandidateJob);
            const candidateData = allCandidates.find(
              (c) => c.id === app.candidateId || (c.email && c.email.toLowerCase() === app.candidateEmail?.toLowerCase())
            );

            const isLiveAnalyzing = isAnalyzingMap[app.id] || false;
            const liveAnalysis = liveAnalysisMap[app.id];
            const currentScore = liveAnalysis ? liveAnalysis.matchScore : app.matchScore || 85;
            const currentSummary = liveAnalysis ? liveAnalysis.aiSummary : app.aiSummary;
            const currentReasons = liveAnalysis ? liveAnalysis.reasons : app.matchReasons || [];
            const currentConcerns = liveAnalysis ? liveAnalysis.concerns : app.matchConcerns || [];

            return (
              <div
                key={app.id}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  isAppExpired
                    ? "border-rose-300 bg-rose-50/10 opacity-90"
                    : isSelected
                    ? "border-sky-500 ring-2 ring-sky-500/20"
                    : "border-slate-200/90"
                }`}
              >
                {/* 72h Expiration Alert Lockout Banner */}
                {isAppExpired && (
                  <div className="bg-rose-100/80 border-b border-rose-200 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                            72-Hour Anti-Ghosting Lockout Active
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase">
                            Auto-Withdrawn
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700 font-medium">
                          No company action was taken within 72 hours. Candidate contact details and portfolio are permanently locked to respect candidate privacy.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Remove expired record permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Record</span>
                    </button>
                  </div>
                )}

                {/* Main Card Header & Summary Row */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Checkbox + Avatar + Info */}
                    <div className="flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedAppIds((prev) =>
                            prev.includes(app.id) ? prev.filter((id) => id !== app.id) : [...prev, app.id]
                          );
                        }}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 mt-1 cursor-pointer"
                      />

                      <div className="relative shrink-0">
                        <UserAvatar
                          src={app.candidatePhoto}
                          alt={app.candidateName}
                          size="xl"
                          settings={app.candidatePhotoSettings || candidateData?.photoSettings}
                          fallbackText={app.candidateName}
                          badge={
                            <span
                              className={`w-3.5 h-3.5 rounded-full border-2 border-white block ${
                                isAppExpired
                                  ? "bg-rose-500"
                                  : app.status === "hired" || app.status === "offer"
                                  ? "bg-emerald-500"
                                  : app.status === "rejected"
                                  ? "bg-rose-500"
                                  : "bg-sky-500"
                              }`}
                            />
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-base sm:text-lg font-black leading-snug ${isAppExpired ? "text-slate-500 line-through" : "text-slate-900"}`}>
                            {app.candidateName}
                          </h3>
                          {candidateData?.githubData?.connected && (
                            <a
                              href={candidateData.githubData.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                              title="Verified GitHub Candidate"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                              </svg>
                              <span>@{candidateData.githubData.username}</span>
                              <span className="text-emerald-400 font-bold">✓</span>
                            </a>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${stageConfig.bg} ${stageConfig.text} ${stageConfig.border}`}
                          >
                            {stageConfig.label}
                          </span>
                          <FastActionCountdownBadge
                            appliedAt={app.appliedAt}
                            deadline={app.slaDeadline}
                            status={app.status}
                            compact={true}
                            onAdvance={() => updateApplicationStatus(app.id, "screening")}
                            onReject={() => rejectApplication(app.id)}
                          />
                        </div>

                        <p className="text-xs font-semibold text-slate-600">
                          {isAppExpired ? "🔒 Profile locked due to 72h inactivity SLA" : app.candidateHeadline}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                          <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-sky-600" />
                            Applied for: {app.jobTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {isAppExpired ? "[🔒 Redacted]" : app.candidateLocation}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {app.candidateExpYears} yrs exp
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <IndianRupee className="w-3 h-3 text-emerald-600" />
                            {isAppExpired ? "[🔒 Redacted]" : (app.candidateExpectedSalary || app.jobSalary)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: AI Match Score Meter & Quick Contact Bar */}
                    <div className="flex items-center lg:flex-col lg:items-end justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            AI Match Score
                          </div>
                          <div className="text-xs font-bold text-emerald-700">
                            {isAppExpired ? "🔒 Archived" : currentScore >= 90 ? "✨ Strong Match" : currentScore >= 75 ? "Good Alignment" : "Partial Fit"}
                          </div>
                        </div>
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 shadow-xs ${
                            isAppExpired
                              ? "bg-slate-100 text-slate-400 border-slate-300"
                              : currentScore >= 90
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : currentScore >= 75
                              ? "bg-sky-50 text-sky-700 border-sky-300"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                          }`}
                        >
                          {currentScore}%
                        </div>
                      </div>

                      {/* Direct Outreach Shortcuts */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => !isAppExpired && setSelectedEmailApp(app)}
                          disabled={isAppExpired}
                          className={`p-2 rounded-xl border transition-colors ${
                            isAppExpired
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                          }`}
                          title={isAppExpired ? "Direct email locked: 72h SLA expired" : "Send Email"}
                        >
                          <Mail className={`w-3.5 h-3.5 ${isAppExpired ? "text-slate-400" : "text-sky-600"}`} />
                        </button>
                        <button
                          onClick={() => !isAppExpired && setSelectedWhatsAppApp(app)}
                          disabled={isAppExpired}
                          className={`p-2 rounded-xl border transition-colors ${
                            isAppExpired
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                          }`}
                          title={isAppExpired ? "WhatsApp chat locked: 72h SLA expired" : "WhatsApp Chat"}
                        >
                          <MessageSquare className={`w-3.5 h-3.5 ${isAppExpired ? "text-slate-400" : "text-emerald-600"}`} />
                        </button>
                        <button
                          onClick={() => !isAppExpired && setSelectedScheduleApp(app)}
                          disabled={isAppExpired}
                          className={`p-2 rounded-xl border transition-colors ${
                            isAppExpired
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                          }`}
                          title={isAppExpired ? "Interview scheduling locked: 72h SLA expired" : "Schedule Interview"}
                        >
                          <Calendar className={`w-3.5 h-3.5 ${isAppExpired ? "text-slate-400" : "text-purple-600"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Individual 72-Hour Response Action Countdown Timer for this candidate */}
                  {!isAppExpired && app.status === "applied" && (
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

                  {/* Skills Snapshot Row */}
                  {!isAppExpired && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                        Matched Skills:
                      </span>
                      {skillBreakdown.matchedSkills.slice(0, 6).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          {skill}
                        </span>
                      ))}
                      {skillBreakdown.missingSkills.length > 0 && (
                        <>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mx-1">
                            Gaps:
                          </span>
                          {skillBreakdown.missingSkills.slice(0, 2).map((gap, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded-md"
                            >
                              <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                              {gap}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Bar / Pipeline Status Transition Row */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Stage Selector or Lock Message */}
                    {isAppExpired ? (
                      <div className="flex items-center gap-2 text-rose-700">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Pipeline Stage Locked (72h SLA Deadline Exceeded)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Stage:</span>
                        <CustomSelect
                          value={app.status}
                          onChange={(newStatus) => {
                            if (newStatus === "rejected") {
                              rejectApplication(app.id);
                            } else {
                              updateApplicationStatus(app.id, newStatus as ApplicationStatus);
                            }
                          }}
                          variant="card"
                          size="sm"
                          options={[
                            { value: "applied", label: "New Applied" },
                            { value: "screening", label: "Screening" },
                            { value: "shortlisted", label: "Shortlisted" },
                            { value: "interview", label: "Interview" },
                            { value: "offer", label: "Offer Made" },
                            { value: "hired", label: "Hired ✦" },
                            { value: "rejected", label: "Rejected" },
                          ]}
                        />
                      </div>
                    )}

                    {/* Recruiter Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isAppExpired ? (
                        <button
                          onClick={() => deleteCandidate(app.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Record</span>
                        </button>
                      ) : (
                        <>
                          {/* Reject Candidate Button */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Reject ${app.candidateName}? This will notify the candidate with AI constructive feedback and remove them from your active pipeline.`)) {
                                rejectApplication(app.id);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Reject candidate and deliver AI feedback"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>

                          {/* Delete Candidate Button */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${app.candidateName} from your pipeline?`)) {
                                deleteCandidate(app.id);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Delete candidate record from company"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Delete</span>
                          </button>

                          {/* Live 72h Fast Forward Simulation Button for Testing */}
                          {app.status === "applied" && (
                            <button
                              onClick={() => simulateFastForwardApplication(app.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              title="Simulate 72h elapsing to test auto-locking SLA behavior"
                            >
                              <Flame className="w-3.5 h-3.5 text-amber-600" />
                              <span>⚡ Test +72h Expiry</span>
                            </button>
                          )}

                          {/* Interview Kit / Scorecard */}
                          <button
                            onClick={() => setSelectedInterviewKitApp(app)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>AI Interview Kit</span>
                          </button>

                          {/* Make Offer */}
                          <button
                            onClick={() => setSelectedOfferApp(app)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Make Offer</span>
                          </button>

                          {/* Deep-Dive Expansion Toggle */}
                          <button
                            onClick={() => setExpandedCardId(isExpanded ? null : app.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              isExpanded
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            <span>{isExpanded ? "Close Deep-Dive" : "Deep-Dive Radar & Resume"}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Deep-Dive Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
                    {/* Deep-Dive Sub-Navigation Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200">
                      <button
                        onClick={() => setCardTabMap((prev) => ({ ...prev, [app.id]: "summary" }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeCardTab === "summary"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Match Analysis</span>
                      </button>

                      <button
                        onClick={() => setCardTabMap((prev) => ({ ...prev, [app.id]: "radar" }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeCardTab === "radar"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Target className="w-3.5 h-3.5 text-sky-400" />
                        <span>Skill Radar Visualizer</span>
                      </button>

                      <button
                        onClick={() => setCardTabMap((prev) => ({ ...prev, [app.id]: "skills" }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeCardTab === "skills"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                        <span>Skills & Gap Matrix</span>
                      </button>

                      <button
                        onClick={() => setCardTabMap((prev) => ({ ...prev, [app.id]: "resume" }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeCardTab === "resume"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Full Resume & Experience</span>
                      </button>

                      <button
                        onClick={() => setCardTabMap((prev) => ({ ...prev, [app.id]: "github" }))}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          activeCardTab === "github"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>GitHub Code Proof</span>
                        {candidateData?.githubData?.connected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    </div>

                    {/* Tab 1: AI Summary & Live Re-eval */}
                    {activeCardTab === "summary" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                AI Fit Analysis ({currentScore}% Match)
                              </h4>
                            </div>
                            <button
                              onClick={() =>
                                setShowPromptInputMap((prev) => ({
                                  ...prev,
                                  [app.id]: !prev[app.id],
                                }))
                              }
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                            >
                              <BrainCircuit className="w-3 h-3" />
                              <span>Custom Prompt Re-evaluate</span>
                            </button>
                          </div>
                          <p className="text-xs text-emerald-950 font-medium leading-relaxed">{currentSummary}</p>
                        </div>

                        {/* Custom Re-evaluate Drawer */}
                        {showPromptInputMap[app.id] && (
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                                <span>Custom Recruiter Evaluation Criteria:</span>
                              </label>
                              <span className="text-[10px] text-slate-400">Powered by Gemini AI</span>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g., Focus heavily on hands-on production microservices & GraphQL experience..."
                              value={customPromptMap[app.id] || ""}
                              onChange={(e) =>
                                setCustomPromptMap((prev) => ({
                                  ...prev,
                                  [app.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() =>
                                  currentCandidateJob && handleLiveReevaluate(app, currentCandidateJob)
                                }
                                disabled={isLiveAnalyzing}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLiveAnalyzing ? "animate-spin" : ""}`} />
                                <span>{isLiveAnalyzing ? "Analyzing..." : "Re-evaluate Candidate"}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Key Candidate Strengths</span>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {currentReasons.map((r, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Concerns / Gaps */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-800">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span>Areas for Interview Exploration</span>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {currentConcerns.length > 0 ? (
                                currentConcerns.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                    <span>{c}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-slate-400 italic">No significant concerns flagged.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Skill Radar Visualizer */}
                    {activeCardTab === "radar" && currentCandidateJob && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                              Multi-Axis Competency Radar
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Visualizes candidate proficiency vs benchmark job expectations across 6 key engineering axes.
                            </p>
                          </div>
                        </div>
                        <CandidateSkillRadarChart candidate={app} job={currentCandidateJob} />
                      </div>
                    )}

                    {/* Tab 3: Skills & Gap Matrix */}
                    {activeCardTab === "skills" && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Complete Candidate Skills Inventory
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(app.candidateSkills || []).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {currentCandidateJob && (
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                              Required Role Prerequisites ({currentCandidateJob.requiredSkills.length} Total)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentCandidateJob.requiredSkills.map((req, i) => {
                                const isMatched = (app.candidateSkills || []).some(
                                  (s) =>
                                    s.toLowerCase().includes(req.toLowerCase()) ||
                                    req.toLowerCase().includes(s.toLowerCase())
                                );
                                return (
                                  <div
                                    key={i}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                                      isMatched
                                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                        : "bg-rose-50/60 border-rose-200 text-rose-900"
                                    }`}
                                  >
                                    <span>{req}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                                        isMatched ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                                      }`}
                                    >
                                      {isMatched ? "Verified" : "Missing / Gap"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Full Resume & Work History */}
                    {activeCardTab === "resume" && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-6">
                        {/* Bio */}
                        {app.candidateBio && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                              Candidate Summary
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{app.candidateBio}</p>
                          </div>
                        )}

                        {/* Experience */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                            <span>Work Experience</span>
                          </h4>
                          {app.candidateExperienceList && app.candidateExperienceList.length > 0 ? (
                            <div className="space-y-3">
                              {app.candidateExperienceList.map((exp, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-900">{exp.title}</span>
                                    <span className="text-[11px] text-slate-500 font-bold">{exp.duration}</span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-600">{exp.company}</div>
                                  <p className="text-xs text-slate-500 mt-1">{exp.description}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No formal work history recorded.</p>
                          )}
                        </div>

                        {/* Projects */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Highlighted Projects</span>
                          </h4>
                          {app.candidateProjectsList && app.candidateProjectsList.length > 0 ? (
                            <div className="space-y-3">
                              {app.candidateProjectsList.map((proj, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                  <span className="text-xs font-black text-slate-900">{proj.name}</span>
                                  <p className="text-xs text-slate-600">{proj.description}</p>
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {(proj.technologies || []).map((t, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-white text-slate-700 rounded-md text-[10px] font-bold border border-slate-200"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No custom projects listed.</p>
                          )}
                        </div>

                        {/* Education */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                            <span>Education</span>
                          </h4>
                          {app.candidateEducationList && app.candidateEducationList.length > 0 ? (
                            <div className="space-y-2">
                              {app.candidateEducationList.map((edu, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <div className="text-xs font-black text-slate-900">{edu.degree}</div>
                                    <div className="text-xs text-slate-600">{edu.institution}</div>
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-500">{edu.year}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No education details provided.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 5: GitHub Code Proof & Telemetry */}
                    {activeCardTab === "github" && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                        {candidateData?.githubData?.connected ? (
                          <>
                            {/* GitHub Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white">
                              <div className="flex items-center gap-3">
                                <img
                                  src={candidateData.githubData.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                                  alt={candidateData.githubData.username}
                                  className="w-12 h-12 rounded-xl border border-slate-700 object-cover"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white">
                                      {candidateData.githubData.name || candidateData.githubData.username}
                                    </span>
                                    <a
                                      href={candidateData.githubData.profileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-sky-400 hover:text-sky-300 font-mono inline-flex items-center gap-1"
                                    >
                                      @{candidateData.githubData.username}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  {candidateData.githubData.bio && (
                                    <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{candidateData.githubData.bio}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[11px] text-emerald-300 font-medium">
                                      {candidateData.githubData.lastActiveSummary || "Active on GitHub"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  Verified GitHub Profile
                                </span>
                              </div>
                            </div>

                            {/* Telemetry Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Public Repos</span>
                                <span className="text-lg font-black text-slate-900">
                                  {candidateData.githubData.publicRepos ?? candidateData.githubData.publicReposCount ?? candidateData.githubData.topRepos?.length ?? 0}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Stars</span>
                                <span className="text-lg font-black text-amber-600">
                                  ★ {candidateData.githubData.totalStars ?? candidateData.githubData.topRepos?.reduce((acc: number, r: any) => acc + (r.starsCount ?? r.stars ?? 0), 0) ?? 0}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Followers</span>
                                <span className="text-lg font-black text-sky-600">
                                  {candidateData.githubData.followers ?? candidateData.githubData.followersCount ?? 0}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Online / Recency</span>
                                <span className="text-xs font-bold text-emerald-700 mt-1 inline-block">Active Contributor</span>
                              </div>
                            </div>

                            {/* Top Languages */}
                            {candidateData.githubData.languages && candidateData.githubData.languages.length > 0 && (
                              <div className="space-y-1.5">
                                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Top Languages by Codebase Volume
                                </h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {candidateData.githubData.languages.map((lang, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold"
                                    >
                                      {lang.name} <span className="text-[10px] text-slate-500">({lang.percentage}%)</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Featured Repositories with Project Intelligence */}
                            {candidateData.githubData.topRepos && candidateData.githubData.topRepos.length > 0 && (
                              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                    <span>Featured GitHub Repositories & AI Project Breakdown ({candidateData.githubData.topRepos.length})</span>
                                  </h5>
                                  <span className="text-[10px] text-slate-400 font-medium">Click any project for deep-dive & README</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {candidateData.githubData.topRepos.map((repo, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => setInspectingProject({ repo, username: candidateData.githubData?.username || "" })}
                                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-500 hover:shadow-md transition-all text-xs group cursor-pointer flex flex-col justify-between gap-3 relative"
                                    >
                                      <div className="space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-black text-slate-900 group-hover:text-sky-600 transition-colors truncate text-sm">
                                              {repo.name}
                                            </span>
                                            {repo.homepage && (
                                              <a
                                                href={repo.homepage}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 hover:bg-emerald-200 transition-colors inline-flex items-center gap-0.5"
                                                title="Open Live Deployment"
                                              >
                                                <span>Live</span>
                                                <ExternalLink className="w-2 h-2" />
                                              </a>
                                            )}
                                          </div>
                                          <span className="text-[11px] font-bold text-amber-600 shrink-0 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                            ★ {repo.starsCount ?? repo.stars ?? 0}
                                          </span>
                                        </div>

                                        <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                                          {repo.description || "Public repository on GitHub"}
                                        </p>
                                      </div>

                                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                          <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                            {repo.language || "Code"}
                                          </span>
                                          {(repo.forksCount ?? repo.forks ?? 0) > 0 && (
                                            <span>• {repo.forksCount ?? repo.forks} forks</span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 text-sky-600 font-bold group-hover:underline">
                                          <span>Explain Project</span>
                                          <Sparkles className="w-3 h-3 text-sky-500" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                            Candidate has not verified GitHub telemetry yet. All candidates are required to connect their GitHub before completing their profile.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recruiter Outreach & Action Sub-Modals */}
      {selectedEmailApp && (
        <SendEmailModal
          isOpen={true}
          onClose={() => setSelectedEmailApp(null)}
          candidateName={selectedEmailApp.candidateName}
          candidateEmail={selectedEmailApp.candidateEmail}
          jobTitle={selectedEmailApp.jobTitle}
        />
      )}

      {selectedWhatsAppApp && (
        <SendWhatsAppModal
          isOpen={true}
          onClose={() => setSelectedWhatsAppApp(null)}
          candidateName={selectedWhatsAppApp.candidateName}
          candidatePhone={selectedWhatsAppApp.candidatePhone}
          jobTitle={selectedWhatsAppApp.jobTitle}
        />
      )}

      {selectedScheduleApp && (
        <ScheduleInterviewModal
          isOpen={true}
          onClose={() => setSelectedScheduleApp(null)}
          application={selectedScheduleApp}
        />
      )}

      {selectedInterviewKitApp && (
        <InterviewKitModal
          isOpen={true}
          onClose={() => setSelectedInterviewKitApp(null)}
          application={selectedInterviewKitApp}
          job={jobs.find((j) => j.id === selectedInterviewKitApp.jobId) || jobs[0]}
          candidateProfile={allCandidates.find((c) => c.id === selectedInterviewKitApp.candidateId)}
        />
      )}

      {selectedOfferApp && (
        <OfferLetterModal
          isOpen={true}
          onClose={() => setSelectedOfferApp(null)}
          application={selectedOfferApp}
          job={jobs.find((j) => j.id === selectedOfferApp.jobId) || jobs[0]}
          candidateProfile={allCandidates.find((c) => c.id === selectedOfferApp.candidateId)}
        />
      )}

      {inspectingProject && (
        <GitHubProjectModal
          isOpen={true}
          onClose={() => setInspectingProject(null)}
          repo={inspectingProject.repo}
          username={inspectingProject.username}
        />
      )}
    </div>
  );
};
