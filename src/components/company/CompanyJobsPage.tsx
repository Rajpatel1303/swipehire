import React, { useState, useEffect } from "react";
import {
  Briefcase,
  PlusCircle,
  MapPin,
  Clock,
  IndianRupee,
  Users,
  Eye,
  Play,
  Pause,
  Copy,
  Trash2,
  Sparkles,
  Pencil,
  Bookmark,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CompanyEditJobModal } from "./CompanyEditJobModal";
import { CompanyJobCandidatesModal } from "./CompanyJobCandidatesModal";
import { JobStatus, Job } from "../../types";

const DRAFT_STORAGE_KEY = "swipehired_new_job_draft";

export const CompanyJobsPage: React.FC = () => {
  const {
    jobs,
    applications,
    toggleJobStatus,
    deleteJob,
    duplicateJob,
    setActiveView,
    setSelectedJobId,
    triggerCelebration,
    openAddJobModal,
    isAddJobModalOpen,
  } = useApp();

  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJobForCandidates, setSelectedJobForCandidates] = useState<Job | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | JobStatus>("all");

  // In-progress local draft detection
  const [savedLocalDraft, setSavedLocalDraft] = useState<any>(null);

  const checkLocalDraft = () => {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.title) {
          setSavedLocalDraft(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setSavedLocalDraft(null);
  };

  useEffect(() => {
    checkLocalDraft();
  }, [isAddJobModalOpen]);

  const handleDiscardLocalDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSavedLocalDraft(null);
  };

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === "all") return true;
    return job.status === filterStatus;
  });

  const handleDuplicate = (jobId: string) => {
    duplicateJob(jobId);
    triggerCelebration();
  };

  const handlePublishDraft = (jobId: string) => {
    toggleJobStatus(jobId, "active");
    triggerCelebration();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Manage Job Postings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor real-time applicant flow, pipeline health, drafts, and active radar positions.
          </p>
        </div>

        <button
          id="manage-jobs-post-btn"
          onClick={openAddJobModal}
          className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-md shadow-sky-600/25 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* In-Progress Unfinished Draft Banner */}
      {savedLocalDraft && (
        <div className="bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-3xl border-2 border-orange-300 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] bg-orange-500 text-white rounded-md font-black uppercase tracking-wider">
                  Unsaved Draft
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Auto-Saved {savedLocalDraft.savedAt || "recently"}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5">
                {savedLocalDraft.title || "Untitled Role"} · {savedLocalDraft.department || "Engineering"}
              </h4>
              <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                {savedLocalDraft.location} ({savedLocalDraft.workMode}) • {savedLocalDraft.experience} • {savedLocalDraft.salary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDiscardLocalDraft}
              className="px-3.5 py-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>

            <button
              onClick={openAddJobModal}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Resume Editing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterStatus === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Roles ({jobs.length})
        </button>
        <button
          onClick={() => setFilterStatus("active")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterStatus === "active"
              ? "bg-emerald-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Active ({jobs.filter((j) => j.status === "active").length})
        </button>
        <button
          onClick={() => setFilterStatus("draft")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 ${
            filterStatus === "draft"
              ? "bg-orange-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Bookmark className="w-3 h-3" />
          <span>Drafts ({jobs.filter((j) => j.status === "draft").length})</span>
        </button>
        <button
          onClick={() => setFilterStatus("paused")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterStatus === "paused"
              ? "bg-slate-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Paused ({jobs.filter((j) => j.status === "paused").length})
        </button>
        <button
          onClick={() => setFilterStatus("closed")}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
            filterStatus === "closed"
              ? "bg-red-500 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Closed ({jobs.filter((j) => j.status === "closed").length})
        </button>
      </div>

      {/* Jobs Table & Cards */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase">No job postings found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterStatus === "draft"
                ? "You don't have any saved draft roles right now. Click 'Post New Job' to start drafting."
                : "No positions match the selected filter status."}
            </p>
            {filterStatus === "draft" && (
              <button
                onClick={openAddJobModal}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Create Job Draft
              </button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isDraft = job.status === "draft";
            const appCount = applications.filter((a) => a.jobId === job.id).length;
            const interviewCount = applications.filter(
              (a) => a.jobId === job.id && a.status === "interview"
            ).length;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-[28px] border-2 transition-all p-6 space-y-4 shadow-xl ${
                  isDraft
                    ? "border-orange-400 bg-orange-50/15 hover:border-orange-500"
                    : "border-slate-900 hover:border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{job.title}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                          job.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : job.status === "draft"
                            ? "bg-orange-500 text-white shadow-xs"
                            : job.status === "paused"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        {isDraft && <Bookmark className="w-2.5 h-2.5" />}
                        <span>{job.status}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1 font-bold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-sky-500" />
                        {job.location} ({job.workMode})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-black text-emerald-700">
                        {job.salary}
                      </span>
                      <span>•</span>
                      <span>{job.experience}</span>
                      <span>•</span>
                      <span>{job.department}</span>
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border-2 border-slate-200 text-xs">
                    <div className="px-3 py-1 text-center">
                      <span className="text-base font-black text-slate-900 block">{appCount}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Applicants</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="px-3 py-1 text-center">
                      <span className="text-base font-black text-sky-700 block">{interviewCount}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Interviews</span>
                    </div>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.requiredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isDraft && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setActiveView("company-applications");
                          }}
                          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Applications Inbox ({appCount})</span>
                        </button>
                        <button
                          onClick={() => setSelectedJobForCandidates(job)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-[10px] transition-colors cursor-pointer border border-slate-200"
                          title="Quick Modal View"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      </div>
                    )}

                    <button
                      id={`edit-job-btn-${job.id}`}
                      onClick={() => setEditingJob(job)}
                      className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isDraft
                          ? "bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-200"
                      }`}
                      title={isDraft ? "Resume Editing Job Draft" : "Edit Job Details & Requirements"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isDraft ? "Resume / Edit Draft" : "Edit Job"}</span>
                    </button>

                    {isDraft ? (
                      <button
                        onClick={() => handlePublishDraft(job.id)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                        title="Publish Draft to Active Candidate Radar"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Publish to Radar</span>
                      </button>
                    ) : job.status === "active" ? (
                      <button
                        onClick={() => toggleJobStatus(job.id, "paused")}
                        className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5 text-orange-500" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleJobStatus(job.id, "active")}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Activate</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(job.id)}
                      className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors cursor-pointer"
                      title="Duplicate Posting"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteJob(job.id)}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full border border-slate-200 transition-colors cursor-pointer"
                      title="Delete Posting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <CompanyEditJobModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        job={editingJob}
      />

      {selectedJobForCandidates && (
        <CompanyJobCandidatesModal
          isOpen={!!selectedJobForCandidates}
          onClose={() => setSelectedJobForCandidates(null)}
          job={selectedJobForCandidates}
        />
      )}
    </div>
  );
};

