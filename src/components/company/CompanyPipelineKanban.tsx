import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Mail,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  ChevronRight,
  Filter,
  Eye,
  Scale,
  BrainCircuit,
  Award,
  Trash2,
  X,
  GripVertical,
  MoveRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { ApplicationStatus, Application, Job } from "../../types";
import { SendEmailModal } from "./modals/SendEmailModal";
import { SendWhatsAppModal } from "./modals/SendWhatsAppModal";
import { ScheduleInterviewModal } from "./modals/ScheduleInterviewModal";
import { InterviewKitModal } from "./modals/InterviewKitModal";
import { OfferLetterModal } from "./modals/OfferLetterModal";
import { CompanyJobCandidatesModal } from "./CompanyJobCandidatesModal";
import { FastActionCountdownBadge } from "../common/FastActionCountdownBadge";

export const CompanyPipelineKanban: React.FC = () => {
  const {
    applications,
    updateApplicationStatus,
    rejectApplication,
    deleteCandidate,
    jobs,
    triggerCelebration,
    setActiveView,
  } = useApp();

  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [mobileActiveStage, setMobileActiveStage] = useState<ApplicationStatus | "all">("all");

  // Drag and Drop state
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);
  const [justMovedId, setJustMovedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; stage: string } | null>(null);

  // Modals
  const [activeEmailApp, setActiveEmailApp] = useState<Application | null>(null);
  const [activeWhatsAppApp, setActiveWhatsAppApp] = useState<Application | null>(null);
  const [activeScheduleApp, setActiveScheduleApp] = useState<Application | null>(null);
  const [activeInterviewKitApp, setActiveInterviewKitApp] = useState<Application | null>(null);
  const [activeOfferApp, setActiveOfferApp] = useState<Application | null>(null);
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);

  const columns: { status: ApplicationStatus; label: string; color: string; hoverBorder: string }[] = [
    { status: "applied", label: "Applications", color: "bg-slate-100 text-slate-800", hoverBorder: "border-slate-400 ring-slate-400" },
    { status: "screening", label: "Screening / Review", color: "bg-sky-100 text-sky-800", hoverBorder: "border-sky-500 ring-sky-400" },
    { status: "shortlisted", label: "Shortlisted", color: "bg-orange-100 text-orange-800", hoverBorder: "border-orange-500 ring-orange-400" },
    { status: "interview", label: "Interview", color: "bg-purple-100 text-purple-800", hoverBorder: "border-purple-500 ring-purple-400" },
    { status: "offer", label: "Offer Extended", color: "bg-emerald-100 text-emerald-800", hoverBorder: "border-emerald-500 ring-emerald-400" },
    { status: "hired", label: "Hired", color: "bg-emerald-600 text-white", hoverBorder: "border-emerald-600 ring-emerald-500" },
  ];

  const filteredApplications = applications.filter((app) => {
    if (app.hiddenFromCompany || app.deletedByCompany || app.status === "rejected") return false;
    if (selectedJobId !== "all" && app.jobId !== selectedJobId) return false;
    return true;
  });

  const handleAdvanceStatus = (appId: string, nextStatus: ApplicationStatus) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp || targetApp.status === nextStatus) return;

    updateApplicationStatus(appId, nextStatus);
    setJustMovedId(appId);

    const stageLabel = columns.find((c) => c.status === nextStatus)?.label || nextStatus;
    setToastMessage({
      text: `${targetApp.candidateName} moved to "${stageLabel}"`,
      stage: nextStatus,
    });

    if (nextStatus === "offer" || nextStatus === "hired") {
      triggerCelebration();
    }

    setTimeout(() => {
      setJustMovedId(null);
    }, 1500);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Drag & Drop event handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData("text/plain", appId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedAppId(appId);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colStatus: ApplicationStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverCol === colStatus) {
        setDragOverCol(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (appId) {
      handleAdvanceStatus(appId, targetStatus);
    }
    setDraggedAppId(null);
    setDragOverCol(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback for Stage Move */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Hiring Pipeline Kanban</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>Drag & Drop Enabled</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Drag candidates smoothly across stage columns or use 1-click stage advancement.
          </p>
        </div>

        {/* Right Actions & Filter by job */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveView("company-compare")}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare Arena</span>
          </button>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border-2 border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-black uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="all">All Jobs ({applications.length})</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Stage Selector Tabs */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1 -mx-1 px-1">
          <button
            onClick={() => setMobileActiveStage("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              mobileActiveStage === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Stages ({filteredApplications.length})
          </button>
          {columns.map((col) => {
            const count = filteredApplications.filter((a) => a.status === col.status).length;
            const isActive = mobileActiveStage === col.status;
            return (
              <button
                key={col.status}
                onClick={() => setMobileActiveStage(col.status)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{col.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : col.color}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper notice */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Grab any candidate card and drop into any stage to update candidate status in real-time.</span>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns
          .filter((col) => mobileActiveStage === "all" || col.status === mobileActiveStage)
          .map((col) => {
            const colApps = filteredApplications.filter((a) => a.status === col.status);
            const isColumnDropTarget = dragOverCol === col.status;

            return (
              <div
                key={col.status}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragEnter={(e) => handleDragOver(e, col.status)}
                onDragLeave={(e) => handleDragLeave(e, col.status)}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`rounded-[28px] p-3.5 flex flex-col space-y-3 min-w-[200px] border-2 transition-all duration-150 ${
                  isColumnDropTarget
                    ? `bg-sky-50/80 ${col.hoverBorder} ring-2 ring-offset-1 shadow-md`
                    : "bg-slate-100/90 border-slate-200"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{col.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${col.color}`}>
                    {colApps.length}
                  </span>
                </div>

                {/* Cards list with Drop Area */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[65vh]">
                  {colApps.length === 0 ? (
                    <div
                      className={`p-6 rounded-2xl border-2 border-dashed text-center text-[10px] font-black uppercase tracking-wider transition-all ${
                        isColumnDropTarget
                          ? "border-sky-500 bg-sky-100/60 text-sky-700 animate-pulse"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {isColumnDropTarget ? "Drop candidate here" : "Empty Stage"}
                    </div>
                  ) : (
                    colApps.map((app) => {
                      const isBeingDragged = draggedAppId === app.id;
                      const isRecentlyMoved = justMovedId === app.id;

                      return (
                        <div
                          key={app.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-3.5 rounded-2xl border-2 shadow-2xs transition-all space-y-3 select-none cursor-grab active:cursor-grabbing group ${
                            isBeingDragged
                              ? "opacity-30 scale-95 border-dashed border-sky-400 bg-slate-50 rotate-1 shadow-none"
                              : isRecentlyMoved
                              ? "border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/20 scale-[1.02]"
                              : "border-slate-200 hover:border-slate-900 hover:shadow-md hover:-translate-y-0.5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            {/* Drag grip icon & avatar */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <div
                                className="cursor-grab active:cursor-grabbing p-0.5 text-slate-300 group-hover:text-slate-500 shrink-0"
                                title="Drag to move stage"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>

                              <div
                                onClick={() => {
                                  const job = jobs.find((j) => j.id === app.jobId);
                                  if (job) setSelectedJobForModal(job);
                                }}
                                className="flex items-center gap-2 cursor-pointer group/cand truncate"
                                title="Click to view AI Candidate Evaluation"
                              >
                                <img
                                  src={
                                    app.candidatePhoto ||
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                                  }
                                  alt={app.candidateName}
                                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-100 group-hover/cand:ring-sky-500 transition-all shrink-0"
                                />
                                <div className="truncate">
                                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 leading-snug group-hover/cand:text-sky-600 transition-colors truncate">
                                    {app.candidateName}
                                  </h4>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                                    {app.jobTitle}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const job = jobs.find((j) => j.id === app.jobId);
                                if (job) setSelectedJobForModal(job);
                              }}
                              className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-0.5 shrink-0"
                              title="View Full AI Evaluation"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{app.matchScore}%</span>
                            </button>
                          </div>

                          {/* Skills & Countdown */}
                          <div className="space-y-2">
                            <div
                              onClick={() => {
                                const job = jobs.find((j) => j.id === app.jobId);
                                if (job) setSelectedJobForModal(job);
                              }}
                              className="flex flex-wrap gap-1 cursor-pointer"
                              title="Click to view full candidate details"
                            >
                              {(app.candidateSkills || []).slice(0, 2).map((s, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-slate-50 text-slate-700 text-[9px] rounded font-bold uppercase border border-slate-100"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>

                            {/* 72h Fast-Action Countdown for unreviewed / active applications */}
                            <div className="pt-0.5">
                              <FastActionCountdownBadge
                                appliedAt={app.appliedAt}
                                deadline={app.slaDeadline}
                                status={app.status}
                                compact={true}
                              />
                            </div>
                          </div>

                          {/* Quick Communication & Advance Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const job = jobs.find((j) => j.id === app.jobId);
                                  if (job) setSelectedJobForModal(job);
                                }}
                                className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                                title="View AI Match & Skills"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveEmailApp(app)}
                                className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                                title="Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveWhatsAppApp(app)}
                                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveScheduleApp(app)}
                                className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                                title="Schedule Interview"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveInterviewKitApp(app)}
                                className="p-1 text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
                                title="AI Interview Kit & Scorecard"
                              >
                                <BrainCircuit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveOfferApp(app)}
                                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                title="Generate Official Offer Letter"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Reject ${app.candidateName}? This will notify the candidate with constructive feedback and remove them from your active company view.`
                                    )
                                  ) {
                                    rejectApplication(app.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Reject Candidate"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete ${app.candidateName} from your pipeline?`)) {
                                    deleteCandidate(app.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Move next button */}
                            {col.status === "applied" && (
                              <button
                                onClick={() => handleAdvanceStatus(app.id, "screening")}
                                className="text-[9px] font-black uppercase tracking-wider text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Screen</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {col.status === "screening" && (
                              <button
                                onClick={() => handleAdvanceStatus(app.id, "shortlisted")}
                                className="text-[9px] font-black uppercase tracking-wider text-orange-600 hover:text-orange-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Shortlist</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {col.status === "shortlisted" && (
                              <button
                                onClick={() => setActiveScheduleApp(app)}
                                className="text-[9px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Interview</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {col.status === "interview" && (
                              <button
                                onClick={() => handleAdvanceStatus(app.id, "offer")}
                                className="text-[9px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Offer</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {col.status === "offer" && (
                              <button
                                onClick={() => handleAdvanceStatus(app.id, "hired")}
                                className="text-[9px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Hired ✦</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Drop zone slot hint when dragging card over this column */}
                  {isColumnDropTarget && colApps.length > 0 && (
                    <div className="p-3 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/90 text-center text-[10px] font-black uppercase tracking-wider text-sky-700 animate-pulse flex items-center justify-center gap-1.5">
                      <MoveRight className="w-3 h-3" />
                      <span>Move to {col.label}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Modals */}
      {activeEmailApp && (
        <SendEmailModal
          isOpen={!!activeEmailApp}
          onClose={() => setActiveEmailApp(null)}
          candidateName={activeEmailApp.candidateName}
          candidateEmail={activeEmailApp.candidateEmail}
          jobTitle={activeEmailApp.jobTitle}
        />
      )}

      {activeWhatsAppApp && (
        <SendWhatsAppModal
          isOpen={!!activeWhatsAppApp}
          onClose={() => setActiveWhatsAppApp(null)}
          candidateName={activeWhatsAppApp.candidateName}
          candidatePhone={activeWhatsAppApp.candidatePhone}
          jobTitle={activeWhatsAppApp.jobTitle}
        />
      )}

      {activeScheduleApp && (
        <ScheduleInterviewModal
          isOpen={!!activeScheduleApp}
          onClose={() => setActiveScheduleApp(null)}
          applicationId={activeScheduleApp.id}
          candidateName={activeScheduleApp.candidateName}
          jobTitle={activeScheduleApp.jobTitle}
        />
      )}

      {activeInterviewKitApp && (
        <InterviewKitModal
          isOpen={!!activeInterviewKitApp}
          onClose={() => setActiveInterviewKitApp(null)}
          application={activeInterviewKitApp}
          job={jobs.find((j) => j.id === activeInterviewKitApp.jobId) || jobs[0]}
        />
      )}

      {activeOfferApp && (
        <OfferLetterModal
          isOpen={!!activeOfferApp}
          onClose={() => setActiveOfferApp(null)}
          application={activeOfferApp}
          job={jobs.find((j) => j.id === activeOfferApp.jobId) || jobs[0]}
        />
      )}

      {selectedJobForModal && (
        <CompanyJobCandidatesModal
          isOpen={!!selectedJobForModal}
          onClose={() => setSelectedJobForModal(null)}
          job={selectedJobForModal}
        />
      )}
    </div>
  );
};
