import React, { useState } from "react";
import {
  Compass,
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  MapPin,
  IndianRupee,
  Layers,
  ChevronRight,
  Mail,
  MessageSquare,
  Eye,
  Sliders,
  Radar,
  Target,
  FileText,
  UserCheck,
  Pencil,
  Scale,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CompanyEditJobModal } from "./CompanyEditJobModal";
import { SendEmailModal } from "./modals/SendEmailModal";
import { SendWhatsAppModal } from "./modals/SendWhatsAppModal";
import { ScheduleInterviewModal } from "./modals/ScheduleInterviewModal";
import { CompanyJobCandidatesModal } from "./CompanyJobCandidatesModal";
import { CandidateSkillRadarChart } from "./CandidateSkillRadarChart";
import { Application, Job } from "../../types";
import { FastActionCountdownBadge } from "../common/FastActionCountdownBadge";

export const CompanyCockpitDashboard: React.FC = () => {
  const {
    company,
    jobs,
    applications,
    setActiveView,
    updateApplicationStatus,
    triggerCelebration,
    openAddJobModal,
  } = useApp();

  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [activeEmailCandidate, setActiveEmailCandidate] = useState<Application | null>(null);
  const [activeWhatsAppCandidate, setActiveWhatsAppCandidate] = useState<Application | null>(null);
  const [activeScheduleCandidate, setActiveScheduleCandidate] = useState<Application | null>(null);
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);

  // Defense-in-depth: scope jobs and applications to current company
  const companyJobs = jobs.filter((j) => !company.id || j.companyId === company.id);

  // Radar Interactive Selection state
  const [selectedRadarJobId, setSelectedRadarJobId] = useState<string>(
    companyJobs[0]?.id || ""
  );
  const [selectedRadarAppId, setSelectedRadarAppId] = useState<string>(
    applications[0]?.id || ""
  );

  // Filter applications for company view (excluding rejected, hidden, or deleted)
  const companyApplications = applications.filter(
    (a) => (!company.id || a.companyId === company.id) && !a.hiddenFromCompany && !a.deletedByCompany && a.status !== "rejected"
  );

  // Cockpit metrics (Spec #19)
  const activeJobs = companyJobs.filter((j) => j.status === "active");
  const totalApplications = companyApplications.length;
  const interviewsScheduled = companyApplications.filter((a) => a.status === "interview").length;
  const strongCandidates = companyApplications.filter((a) => (a.matchScore || 0) >= 90).length;

  // Derive active radar job & candidate
  const currentRadarJob =
    companyJobs.find((j) => j.id === selectedRadarJobId) || companyJobs[0] || null;
  const radarJobApplications = currentRadarJob
    ? companyApplications.filter((a) => a.jobId === currentRadarJob.id)
    : companyApplications;
  const currentRadarCandidate =
    companyApplications.find((a) => a.id === selectedRadarAppId) ||
    radarJobApplications[0] ||
    companyApplications[0] ||
    null;

  const handleSelectCandidateForRadar = (app: Application) => {
    setSelectedRadarAppId(app.id);
    setSelectedRadarJobId(app.jobId);
    // Smooth scroll to radar section
    const radarElement = document.getElementById("cockpit-d3-radar-section");
    if (radarElement) {
      radarElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & HIRING RADAR SUMMARY */}
      <div className="bg-slate-50 border-2 border-slate-900 rounded-[32px] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Intelligent Hiring Radar · Live</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
              {company.companyName} Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {company.contactPerson} · Managing <strong className="text-slate-900 font-black">{activeJobs.length} active roles</strong> across your tech team.
            </p>
          </div>

          {/* Quick Post Job, Blind Arena & Compare Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView("company-applications")}
              className="flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 rounded-full font-black text-xs uppercase tracking-widest shadow-2xs transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span>Applications Inbox ({applications.length})</span>
            </button>

            <button
              onClick={() => setActiveView("blind-marketplace")}
              className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-slate-900/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>💎 Blind Talent Arena</span>
            </button>

            <button
              onClick={() => setActiveView("company-compare")}
              className="flex items-center gap-2 px-5 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Arena</span>
            </button>

            <button
              id="cockpit-add-job-btn"
              onClick={openAddJobModal}
              className="flex items-center gap-2 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-sky-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Role</span>
            </button>
          </div>
        </div>

        {/* Cockpit 4-Card Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Jobs</span>
              <Briefcase className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{activeJobs.length}</div>
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">+2 new this week</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inflow</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">{totalApplications}</div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">From verified swipers</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">72h Action Window</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600">
              {applications.filter((a) => a.status === "applied").length}
            </div>
            <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider">
              {applications.filter((a) => {
                if (a.status !== "applied") return false;
                const hoursLeft = Math.max(0, (new Date(a.appliedAt).getTime() + 72 * 3600 * 1000 - Date.now()) / (3600 * 1000));
                return hoursLeft < 24;
              }).length > 0 ? "🔥 <24h Critical Reminder" : "Under 72h SLA"}
            </span>
          </div>

          <div className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">90%+ Matches</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{strongCandidates}</div>
            <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">High conviction</span>
          </div>
        </div>

        {/* 72h SLA Fast-Action & 24h Reminder Alert Banner if applied candidates pending */}
        {companyApplications.some((a) => a.status === "applied") && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>72-Hour Candidate Action Guarantee Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black">
                    {companyApplications.filter((a) => a.status === "applied").length} Pending Review
                  </span>
                </h4>
                <p className="text-[11px] text-amber-800 font-medium">
                  Candidate applications must be screened, shortlisted, or scheduled within 72 hours. If no action is taken, the candidate is released back to the talent market.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView("company-applications")}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              Review Pending 72h Queue
            </button>
          </div>
        )}
      </div>

      {/* 2. D3 CANDIDATE SKILL MATRIX VS JOB BENCHMARK RADAR */}
      <div id="cockpit-d3-radar-section" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[10px] font-black uppercase tracking-widest border border-sky-200">
              <Target className="w-3 h-3 text-sky-600" />
              <span>D3 Interactive Radar Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
              Candidate Skill Set vs. Job Benchmark
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Multi-axis D3 vector comparison against required job description standards.
            </p>
          </div>

          {/* Job Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {companyJobs.map((j) => {
              const isSelected = currentRadarJob?.id === j.id;
              const count = companyApplications.filter((a) => a.jobId === j.id).length;
              return (
                <button
                  key={j.id}
                  onClick={() => {
                    setSelectedRadarJobId(j.id);
                    const jobApps = companyApplications.filter((a) => a.jobId === j.id);
                    if (jobApps.length > 0) setSelectedRadarAppId(jobApps[0].id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{j.title}</span>
                  <span className="ml-1.5 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* D3 Radar Analysis Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main D3 Radar Chart Container */}
          <div className="lg:col-span-7">
            {currentRadarCandidate && currentRadarJob ? (
              <CandidateSkillRadarChart
                candidate={currentRadarCandidate}
                job={currentRadarJob}
              />
            ) : (
              <div className="p-12 bg-white rounded-[28px] border-2 border-slate-900 text-center space-y-3 shadow-xl">
                <p className="text-xs text-slate-500 font-medium">
                  Select an active job and applicant to render the D3 skill radar matrix.
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Candidate Queue & Job Specification Benchmark */}
          <div className="lg:col-span-5 space-y-4">
            {/* Applicant Selector Card */}
            <div className="bg-white rounded-[28px] border-2 border-slate-900 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Applicants for {currentRadarJob?.title || "Role"} ({radarJobApplications.length})
                </span>
                <span className="text-[10px] text-sky-600 font-black uppercase">
                  Click to Compare
                </span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {radarJobApplications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No applicants yet for this job.</p>
                ) : (
                  radarJobApplications.map((app) => {
                    const isSelected = currentRadarCandidate?.id === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedRadarAppId(app.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              app.candidatePhoto ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            }
                            alt={app.candidateName}
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                              {app.candidateName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate">
                              {app.candidateExpYears || 3}y exp · {app.candidateLocation}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 ${
                            app.matchScore >= 90
                              ? "bg-emerald-100 text-emerald-800"
                              : app.matchScore >= 80
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.matchScore}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Actions for Selected Candidate */}
              {currentRadarCandidate && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setActiveScheduleCandidate(currentRadarCandidate)}
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Interview</span>
                  </button>

                  <button
                    onClick={() => setActiveEmailCandidate(currentRadarCandidate)}
                    className="p-2.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                    title="Send Email via Gmail"
                  >
                    <Mail className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveWhatsAppCandidate(currentRadarCandidate)}
                    className="p-2.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                    title="1-Click WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (currentRadarJob) setSelectedJobForModal(currentRadarJob);
                    }}
                    className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                    title="Open Full Evaluation Hub"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Target Job Benchmark Reference */}
            {currentRadarJob && (
              <div className="bg-slate-900 text-white rounded-[28px] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                      Target Job Benchmark
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {currentRadarJob.experience}
                    </span>
                    <button
                      onClick={() => setEditingJob(currentRadarJob)}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-orange-500 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Job Benchmark & Criteria"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white">
                    {currentRadarJob.title}
                  </h4>
                  <p className="text-xs text-slate-300 font-medium">
                    {currentRadarJob.department} · {currentRadarJob.location} ({currentRadarJob.workMode})
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Required Core Skills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(currentRadarJob.requiredSkills || []).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white/10 text-white rounded-md text-[10px] font-bold uppercase"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {currentRadarJob.preferredSkills && currentRadarJob.preferredSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Preferred / Tooling:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {currentRadarJob.preferredSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-orange-500/20 text-orange-200 rounded-md text-[10px] font-bold uppercase border border-orange-500/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RECENT TALENT INFLOW & LIVE RADAR STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ranked Candidates Stream */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ranked Talent Inflow</h2>
              <p className="text-xs text-slate-500 font-medium">
                Sorted by AI match score across all active roles.
              </p>
            </div>

            <button
              onClick={() => setActiveView("company-pipeline")}
              className="text-xs font-black uppercase tracking-wider text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Pipeline Kanban</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 bg-white rounded-[32px] border-2 border-slate-900 text-center space-y-3 shadow-xl">
              <p className="text-xs text-slate-500 font-medium">No applications received yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-[28px] border-2 border-slate-900 shadow-xl hover:border-slate-800 transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div
                    onClick={() => {
                      const job = jobs.find((j) => j.id === app.jobId);
                      if (job) setSelectedJobForModal(job);
                    }}
                    className="flex items-start gap-4 cursor-pointer group flex-1"
                    title="Click to view AI Candidate Evaluation & Skills"
                  >
                    <img
                      src={
                        app.candidatePhoto ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={app.candidateName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 group-hover:ring-sky-500 transition-all shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight group-hover:text-sky-600 transition-colors">
                          {app.candidateName}
                        </h3>
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{app.matchScore}% Match</span>
                        </span>
                        <FastActionCountdownBadge
                          appliedAt={app.appliedAt}
                          deadline={app.slaDeadline}
                          status={app.status}
                          compact={true}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Applying for <strong className="text-slate-800">{app.jobTitle}</strong>
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {(app.candidateSkills || []).slice(0, 4).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md font-bold uppercase"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Radar Matrix, AI Breakdown, Email, WhatsApp, Schedule Interview) */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleSelectCandidateForRadar(app)}
                      className={`p-2.5 rounded-full transition-all cursor-pointer border-2 ${
                        currentRadarCandidate?.id === app.id
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "text-slate-600 hover:text-sky-600 hover:bg-sky-50 border-slate-200"
                      }`}
                      title="Load Candidate in D3 Skill Radar Chart"
                    >
                      <Target className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const job = jobs.find((j) => j.id === app.jobId);
                        if (job) setSelectedJobForModal(job);
                      }}
                      className="p-2.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors cursor-pointer border-2 border-slate-200"
                      title="View AI Candidate Breakdown & Skills"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveEmailCandidate(app)}
                      className="p-2.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors cursor-pointer border-2 border-slate-200"
                      title="Send Email via Connected Gmail"
                    >
                      <Mail className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveWhatsAppCandidate(app)}
                      className="p-2.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer border-2 border-slate-200"
                      title="1-Click WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveScheduleCandidate(app)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Interview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Jobs Radar & Quick Links */}
        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Postings</h2>
            <button
              onClick={() => setActiveView("company-jobs")}
              className="text-xs font-black uppercase tracking-wider text-sky-600 hover:text-sky-800 cursor-pointer"
            >
              All ({jobs.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setActiveView("company-jobs")}
                className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs hover:border-slate-900 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                    {job.title}
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{job.location}</span>
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[10px]">
                    {applications.filter((a) => a.jobId === job.id).length} Applicants
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Connected Outreach Status Card */}
          <div className="p-6 bg-slate-900 text-white rounded-[28px] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Outreach Engine</span>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Google Workspace / Gmail is active. Interviews scheduled generate real Google Meet links automatically.
            </p>
            <button
              onClick={() => setActiveView("company-email-connect")}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              Manage Email & Templates →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeEmailCandidate && (
        <SendEmailModal
          isOpen={!!activeEmailCandidate}
          onClose={() => setActiveEmailCandidate(null)}
          candidateName={activeEmailCandidate.candidateName}
          candidateEmail={activeEmailCandidate.candidateEmail}
          jobTitle={activeEmailCandidate.jobTitle}
        />
      )}

      {activeWhatsAppCandidate && (
        <SendWhatsAppModal
          isOpen={!!activeWhatsAppCandidate}
          onClose={() => setActiveWhatsAppCandidate(null)}
          candidateName={activeWhatsAppCandidate.candidateName}
          candidatePhone={activeWhatsAppCandidate.candidatePhone}
          jobTitle={activeWhatsAppCandidate.jobTitle}
        />
      )}

      {activeScheduleCandidate && (
        <ScheduleInterviewModal
          isOpen={!!activeScheduleCandidate}
          onClose={() => setActiveScheduleCandidate(null)}
          applicationId={activeScheduleCandidate.id}
          candidateName={activeScheduleCandidate.candidateName}
          jobTitle={activeScheduleCandidate.jobTitle}
        />
      )}

      {selectedJobForModal && (
        <CompanyJobCandidatesModal
          isOpen={!!selectedJobForModal}
          onClose={() => setSelectedJobForModal(null)}
          job={selectedJobForModal}
        />
      )}

      {editingJob && (
        <CompanyEditJobModal
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          job={editingJob}
        />
      )}
    </div>
  );
};
