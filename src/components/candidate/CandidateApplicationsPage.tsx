import React, { useState } from "react";
import {
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  Calendar,
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  Activity,
  Zap,
  BookOpen,
  Award,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ApplicationStatus, PulseStep, ConstructiveFeedback } from "../../types";
import { FastActionCountdownBadge } from "../common/FastActionCountdownBadge";

export const CandidateApplicationsPage: React.FC = () => {
  const { applications, setActiveView, companySLAs, requestConstructiveFeedback } = useApp();
  const [filterTab, setFilterTab] = useState<"all" | "active" | "interviews" | "offers" | "rejected" | "feedback">("all");
  const [expandedPulseAppId, setExpandedPulseAppId] = useState<string | null>(null);
  const [expandedFeedbackAppId, setExpandedFeedbackAppId] = useState<string | null>(null);
  const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(null);

  const stages: { key: ApplicationStatus; label: string; num: number }[] = [
    { key: "applied", label: "Applied", num: 1 },
    { key: "screening", label: "Screening", num: 2 },
    { key: "shortlisted", label: "Shortlisted", num: 3 },
    { key: "interview", label: "Interview", num: 4 },
    { key: "offer", label: "Offer", num: 5 },
    { key: "hired", label: "Hired", num: 6 },
  ];

  const getStageIndex = (status: ApplicationStatus) => {
    if (status === "rejected") return -1;
    return stages.findIndex((s) => s.key === status);
  };

  const handleRequestFeedback = async (appId: string) => {
    setLoadingFeedbackId(appId);
    try {
      await requestConstructiveFeedback(appId);
      setExpandedFeedbackAppId(appId);
    } finally {
      setLoadingFeedbackId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filterTab === "interviews") return app.status === "interview";
    if (filterTab === "offers") return app.status === "offer" || app.status === "hired";
    if (filterTab === "active") return app.status !== "rejected" && app.status !== "hired" && app.status !== "expired";
    if (filterTab === "rejected") return app.status === "rejected";
    if (filterTab === "feedback") return app.status === "rejected" || !!app.constructiveFeedback;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-2 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-Ghosting SLA & Transparent Pulse Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            My Application Journey
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            100% transparent hiring stages, verified company response SLAs, and automated AI skill feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView("blind-marketplace")}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>💎 Blind Talent Arena</span>
          </button>
          <button
            onClick={() => setActiveView("candidate-radar")}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
          >
            <span>Discover Roles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterTab === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Applications ({applications.length})
        </button>
        <button
          onClick={() => setFilterTab("active")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterTab === "active"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          In Progress ({applications.filter((a) => a.status !== "rejected" && a.status !== "hired").length})
        </button>
        <button
          onClick={() => setFilterTab("interviews")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterTab === "interviews"
              ? "bg-sky-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Interviews ({applications.filter((a) => a.status === "interview").length})
        </button>
        <button
          onClick={() => setFilterTab("offers")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterTab === "offers"
              ? "bg-emerald-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Offers ({applications.filter((a) => a.status === "offer" || a.status === "hired").length})
        </button>
        <button
          onClick={() => setFilterTab("rejected")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterTab === "rejected"
              ? "bg-rose-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Rejected ({applications.filter((a) => a.status === "rejected").length})
        </button>
        <button
          onClick={() => setFilterTab("feedback")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterTab === "feedback"
              ? "bg-amber-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          AI Feedback Hub ({applications.filter((a) => a.status === "rejected" || !!a.constructiveFeedback).length})
        </button>
      </div>

      {/* Applications Cards List */}
      {filteredApplications.length === 0 ? (
        <div className="p-12 bg-white rounded-[32px] border-2 border-slate-900 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl mx-auto shadow-xs">
            📋
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              No applications in this view.
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Use your Career Radar or Reverse Marketplace to explore top roles.
            </p>
          </div>
          <button
            onClick={() => setActiveView("candidate-radar")}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
          >
            Go to Career Radar →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApplications.map((app) => {
            const currentStageIdx = getStageIndex(app.status);
            const isRejected = app.status === "rejected";
            const slaInfo = companySLAs[app.companyId];
            const isPulseExpanded = expandedPulseAppId === app.id;
            const isFeedbackExpanded = expandedFeedbackAppId === app.id;

            return (
              <div
                key={app.id}
                className="bg-white rounded-[28px] border-2 border-slate-900 shadow-xl p-6 space-y-6 hover:border-slate-800 transition-all"
              >
                {/* Header Information & SLA Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        app.companyLogo ||
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={app.companyName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 shrink-0"
                    />
                    <div>
                      <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                        {app.jobTitle}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          {app.companyName}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400 font-medium">
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* 72h Fast-Action Countdown Guarantee */}
                    <FastActionCountdownBadge
                      appliedAt={app.appliedAt}
                      deadline={app.slaDeadline}
                      status={app.status}
                      compact={true}
                    />

                    {/* SLA Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
                      <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>
                        {app.companySlaBadge?.badgeText || slaInfo?.badgeText || "Fast Responder (Avg. 24h)"}
                      </span>
                    </div>

                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                      🎯 {app.matchScore}% Match
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        app.status === "interview"
                          ? "bg-sky-100 text-sky-800 border border-sky-300"
                          : app.status === "shortlisted"
                          ? "bg-orange-100 text-orange-800 border border-orange-300"
                          : app.status === "offer"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Visual 6-Stage Horizontal Journey Tracker */}
                {!isRejected && app.status !== "expired" && (
                  <div className="pt-1 overflow-x-auto no-scrollbar -mx-2 px-2">
                    <div className="relative min-w-[440px] sm:min-w-0">
                      {/* Background track line */}
                      <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 -translate-y-1/2 -z-0 rounded-full"></div>
                      {/* Active track line */}
                      {currentStageIdx >= 0 && (
                        <div
                          className="absolute top-1/2 left-0 h-1.5 bg-emerald-500 -translate-y-1/2 -z-0 transition-all duration-500 rounded-full"
                          style={{
                            width: `${(currentStageIdx / (stages.length - 1)) * 100}%`,
                          }}
                        ></div>
                      )}

                      <div className="relative z-10 grid grid-cols-6 gap-2 text-center">
                        {stages.map((stage, idx) => {
                          const isCompleted = idx < currentStageIdx;
                          const isCurrent = idx === currentStageIdx;

                          return (
                            <div key={stage.key} className="flex flex-col items-center gap-1.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-xs ${
                                  isCompleted
                                    ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                                    : isCurrent
                                    ? "bg-emerald-500 text-white ring-4 ring-emerald-200 animate-pulse"
                                    : "bg-white text-slate-400 border-2 border-slate-200"
                                }`}
                              >
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stage.num}
                              </div>
                              <span
                                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                                  isCurrent
                                    ? "text-emerald-800 font-black"
                                    : isCompleted
                                    ? "text-slate-800"
                                    : "text-slate-400"
                                }`}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Real-Time 72h Action Timer for Applied Applications */}
                {app.status === "applied" && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-sm space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                          Live Anti-Ghosting Guarantee · Recruiter Action Window
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded-md">
                        72h SLA Active
                      </span>
                    </div>

                    <FastActionCountdownBadge
                      appliedAt={app.appliedAt}
                      deadline={app.slaDeadline}
                      status={app.status}
                      variant="bar"
                    />

                    <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                      The employer is guaranteed to review your application within 72 hours. If no action is taken, your application is automatically withdrawn to protect your sensitive details and portfolio.
                    </p>
                  </div>
                )}

                {/* 72h SLA Inactivity Expiration Banner for Candidate */}
                {app.status === "expired" && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm uppercase tracking-wide text-rose-950">
                              72-Hour Anti-Ghosting Guarantee: Auto-Withdrawn & Privacy Protected
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[9px] font-black uppercase">
                              SLA Exceeded
                            </span>
                          </div>
                          <p className="text-xs text-rose-700 font-medium mt-0.5">
                            The company did not take review action within the guaranteed 72-hour window. Your direct contact details and documents have been locked and auto-withdrawn from their view to respect your time and data privacy.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveView("candidate-radar")}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                      >
                        Explore More Roles →
                      </button>
                    </div>
                  </div>
                )}

                {/* Rejection & Transparent AI Feedback Banner */}
                {isRejected && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border-2 border-rose-200 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0 mt-0.5 shadow-xs">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-sm uppercase tracking-wide text-rose-950">
                              Application Concluded · Constructive AI Insights Ready
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[9px] font-black uppercase">
                              Status: Rejected
                            </span>
                            {app.rejectedAt && (
                              <span className="text-[10px] text-rose-700 font-bold">
                                {new Date(app.rejectedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-rose-800 font-medium leading-relaxed">
                            {app.rejectionReason || "The employer evaluated your application and decided to advance other candidates. Detailed skill gap analysis and step-by-step portfolio recommendations have been generated for you."}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedFeedbackAppId(isFeedbackExpanded ? null : app.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isFeedbackExpanded ? "Hide AI Feedback" : "View Constructive Feedback"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Application Pulse Live Step-by-Step Transparency Bar */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden">
                  <div
                    onClick={() => setExpandedPulseAppId(isPulseExpanded ? null : app.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-black uppercase text-slate-900 tracking-wider">
                            Live Application Pulse
                          </strong>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-800 rounded-full text-[9px] font-black">
                            REAL-TIME
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {app.pulseSteps
                            ? `${app.pulseSteps.filter((s) => s.status === "completed").length} of ${app.pulseSteps.length} review milestones completed`
                            : "Recruiter reviewed resume & portfolio"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span>{isPulseExpanded ? "Hide Details" : "View Step-by-Step"}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isPulseExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Pulse Timeline */}
                  {isPulseExpanded && (
                    <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-3 animate-in fade-in duration-150">
                      <div className="space-y-3">
                        {(app.pulseSteps || [
                          {
                            stepName: "Application Indexed & AI Matched",
                            status: "completed",
                            completedAt: app.appliedAt,
                            detail: `Semantic match score verified at ${app.matchScore}%`,
                          },
                          {
                            stepName: "Technical Portfolio & GitHub Code Review",
                            status: "completed",
                            completedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
                            reviewerTitle: "Lead Engineering Architect",
                            detail: "Inspected verified project architectures and repo commits",
                          },
                          {
                            stepName: "Hiring Manager Assessment Gate",
                            status: app.status === "applied" ? "in_progress" : "completed",
                            reviewerTitle: "VP of Engineering",
                            detail: "Reviewing candidate alignment with team roadmap",
                          },
                        ]).map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-xs">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                step.status === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : step.status === "in_progress"
                                  ? "bg-amber-500 text-white animate-pulse"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {step.status === "completed" ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : step.status === "in_progress" ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : (
                                <span className="text-[10px] font-bold">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <strong className="text-slate-900 font-bold">{step.stepName}</strong>
                                {step.completedAt && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(step.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600">{step.detail}</p>
                              {step.reviewerTitle && (
                                <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  Reviewer: {step.reviewerTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Guaranteed SLA Info */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Company Response SLA Guarantee:
                        </span>
                        <span className="font-black text-emerald-700">
                          Guaranteed feedback within {app.companySlaBadge?.avgResponseHours || 24} hours
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Interview Box with Google Meet Quick Action */}
                {app.status === "interview" && app.interviewDetails && (
                  <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sky-900 font-black uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-sky-600" />
                        <span>Technical Interview Scheduled</span>
                      </div>
                      <p className="text-slate-700 font-medium">
                        Date & Time: <strong>{app.interviewDetails.date} at {app.interviewDetails.time}</strong>
                      </p>
                      {app.interviewDetails.notes && (
                        <p className="text-[11px] text-slate-500 italic">"{app.interviewDetails.notes}"</p>
                      )}
                    </div>

                    {app.interviewDetails.meetingLink && (
                      <a
                        href={
                          app.interviewDetails.meetingLink.startsWith("http")
                            ? app.interviewDetails.meetingLink
                            : `https://${app.interviewDetails.meetingLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-colors shrink-0 cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Google Meet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Offer details banner */}
                {(app.status === "offer" || app.status === "hired") && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs flex items-center justify-between gap-3 text-emerald-900">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Formal Offer Letter Extended! Check your email ({app.companyName})</span>
                    </div>
                    <span className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest">
                      Offer Active ✦
                    </span>
                  </div>
                )}

                {/* AUTOMATED CONSTRUCTIVE AI FEEDBACK HUB (For Rejected or Feedback-Requested Applications) */}
                {(isRejected || app.constructiveFeedback) && (
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-xs">
                          ✨
                        </div>
                        <div>
                          <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 flex items-center gap-2">
                            <span>Automated Constructive AI Feedback</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black">
                              ZERO GHOSTING GUARANTEE
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600 font-medium">
                            Personalized roadmap highlighting observed strengths and skills to bridge for future roles.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!app.constructiveFeedback) {
                            handleRequestFeedback(app.id);
                          } else {
                            setExpandedFeedbackAppId(isFeedbackExpanded ? null : app.id);
                          }
                        }}
                        disabled={loadingFeedbackId === app.id}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {loadingFeedbackId === app.id ? (
                          <span>Generating AI Feedback...</span>
                        ) : isFeedbackExpanded ? (
                          <span>Collapse AI Feedback</span>
                        ) : (
                          <span>Expand Constructive Roadmap →</span>
                        )}
                      </button>
                    </div>

                    {/* Feedback Content */}
                    {(isFeedbackExpanded || isRejected) && app.constructiveFeedback && (
                      <div className="space-y-4 pt-3 border-t border-amber-200/80 animate-in fade-in duration-150">
                        {/* Summary & Strengths */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-2xl border border-amber-200 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                              Recruiter Feedback Summary
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {app.constructiveFeedback.overallFeedbackSummary}
                            </p>
                          </div>

                          <div className="p-4 bg-white rounded-2xl border border-amber-200 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">
                              Key Strengths Commended
                            </span>
                            <ul className="space-y-1 text-xs text-slate-700 font-medium">
                              {app.constructiveFeedback.keyStrengths.map((str, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Skill Gap Analysis Table */}
                        {app.constructiveFeedback.gapAnalysis && app.constructiveFeedback.gapAnalysis.length > 0 && (
                          <div className="p-4 bg-white rounded-2xl border border-amber-200 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block">
                              Skill & Architecture Gap Analysis
                            </span>
                            <div className="space-y-3">
                              {app.constructiveFeedback.gapAnalysis.map((gap, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <strong className="text-slate-900 font-black">
                                      Focus Area: {gap.skillOrRequirement}
                                    </strong>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                      <span className="text-slate-400 font-bold block">Role Expectation:</span>
                                      <span className="text-slate-700">{gap.roleExpectation}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 font-bold block">Observed in Review:</span>
                                      <span className="text-slate-700">{gap.candidateObserved}</span>
                                    </div>
                                  </div>
                                  <div className="pt-1 text-[11px] text-amber-900 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                                    💡 <strong>AI Recommendation:</strong> {gap.recommendation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Plan & 90-Day Reapplication Timer */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 p-4 bg-white rounded-2xl border border-amber-200 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block">
                              Suggested Upskilling Roadmap
                            </span>
                            {app.constructiveFeedback.actionPlan.map((action, idx) => (
                              <div key={idx} className="flex items-start gap-3 text-xs">
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <strong className="text-slate-900 block">{action.title}</strong>
                                  <p className="text-[11px] text-slate-600">{action.description}</p>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold pt-1">
                                    <span>📚 {action.suggestedResource}</span>
                                    <span>⏱️ Est. {action.estimatedTimeToBridge}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Re-application Countdown */}
                          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col justify-between space-y-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                                Fast-Track Re-Application
                              </span>
                              <h4 className="text-sm font-black text-white">Eligible in 90 Days</h4>
                              <p className="text-[11px] text-slate-300 mt-1">
                                Bridge these topics and your profile will be prioritized directly for engineering screen.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic">
                              "{app.constructiveFeedback.recruiterEncouragingNote}"
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

